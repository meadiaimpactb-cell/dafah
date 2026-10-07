<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Consultant;
use App\Models\DiscountCode;
use App\Models\OperationalSubmission;
use App\Models\OperationalUnit;
use App\Models\OperationalWorkflow;
use App\Models\Order;
use App\Models\ServiceSetting;
use App\Models\StrategicWorkflow;
use App\Models\UnitSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Mpdf\Mpdf;

class OperationalController extends Controller
{
    // ── GET /api/operational/workflows ───────────────────────────────────────
    public function listWorkflows(Request $request)
    {
        $workflows = OperationalWorkflow::with('consultant')
            ->where('user_id', $request->user()->id)
            ->withCount([
                'submissions as approved_count' => fn($q) => $q->where('status', 'approved'),
                'submissions as total_count',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($workflows);
    }

    // ── GET /api/operational/workflow ────────────────────────────────────────
    public function getWorkflow(Request $request)
    {
        $workflow = $this->resolveWorkflow($request);

        if (!$workflow) {
            return response()->json(['workflow' => null]);
        }

        return response()->json([
            'workflow'    => $workflow,
            'submissions' => $workflow->submissions->keyBy('unit_number'),
        ]);
    }

    // ── GET /api/operational/page-data ───────────────────────────────────────
    public function pageData(Request $request)
    {
        $user = $request->user();

        // التحقق من اكتمال التخطيط الاستراتيجي
        $strategicWorkflow = StrategicWorkflow::where('user_id', $user->id)
            ->where('status', 'completed')
            ->latest()
            ->first();

        $workflow = $this->resolveWorkflow($request);

        // جلب المستشار من التخطيط الاستراتيجي لعرضه قبل بدء التشغيلي
        $strategicConsultant = $strategicWorkflow?->load('consultant')?->consultant;

        // مزامنة المستشار: إذا كان الـ workflow موجوداً بمستشار مختلف → نحدّثه
        if ($workflow && $strategicWorkflow && $workflow->consultant_id !== $strategicWorkflow->consultant_id) {
            $workflow->update(['consultant_id' => $strategicWorkflow->consultant_id]);
            $workflow->load(['consultant', 'submissions.unit', 'user']);
        }

        $units       = null;
        $submissions = null;

        if ($workflow) {
            $submissions = $workflow->submissions->keyBy('unit_number');

            // دائماً أرجع الوحدات بعد بدء مرحلة العمل — للسماح بمراجعة الخطوات السابقة
            if ($workflow->current_step >= 3) {
                $allUnits  = OperationalUnit::orderBy('unit_number')->get();
                $subsByNum = OperationalSubmission::where('workflow_id', $workflow->id)
                    ->get()->keyBy('unit_number');

                $units = $allUnits->map(function ($unit) use ($subsByNum) {
                    $sub = $subsByNum->get($unit->unit_number);
                    return array_merge($unit->toArray(), [
                        'submission_status' => $sub?->status ?? 'not_started',
                        'submission_id'     => $sub?->id,
                        'consultant_notes'  => $sub?->consultant_notes,
                    ]);
                });
            }
        }

        $s       = ServiceSetting::map();
        $catalog = OperationalUnit::orderBy('unit_number')->get(['unit_number', 'name']);

        return response()->json([
            'workflow'              => $workflow,
            'submissions'           => $submissions,
            'units'                 => $units,
            'strategic_completed'   => (bool) $strategicWorkflow,
            'strategic_consultant'  => $strategicConsultant,
            'catalog'               => $catalog,
            'pricing'               => [
                'base'     => (float) ($s['operational_base'] ?? 3500),
                'tax_rate' => (float) ($s['tax_rate']         ?? 15),
            ],
        ]);
    }

    // ── POST /api/operational/workflow/start ─────────────────────────────────
    public function start(Request $request)
    {
        $user = $request->user();

        // منع إنشاء خطة جديدة إذا كانت هناك خطة قيد التنفيذ
        $activePlan = OperationalWorkflow::where('user_id', $user->id)
            ->where('status', '!=', 'completed')
            ->first();

        if ($activePlan) {
            return response()->json([
                'message' => 'لديك خطة تشغيلية قيد التنفيذ. يجب إكمالها واعتمادها أولاً قبل إنشاء خطة جديدة.',
            ], 422);
        }

        // جلب الخطة الاستراتيجية المكتملة إن وُجدت (اختياري)
        $strategicWorkflow = StrategicWorkflow::where('user_id', $user->id)
            ->where('status', 'completed')
            ->latest()
            ->first();

        $s            = ServiceSetting::map();
        $subtotal     = (float) ($s['operational_base'] ?? 3500);
        $taxRate      = (float) ($s['tax_rate'] ?? 15) / 100;
        $tax          = round($subtotal * $taxRate, 2);
        $total        = $subtotal + $tax;
        // استخدام مستشار الخطة الاستراتيجية إن وُجد، وإلا null
        $consultantId = $strategicWorkflow?->consultant_id;

        $workflow = OperationalWorkflow::create([
            'user_id'       => $user->id,
            'consultant_id' => $consultantId,
            'current_step'  => 2,   // تخطى اختيار المستشار مباشرةً للدفع
            'status'        => 'pending',
            'subtotal'      => $subtotal,
            'tax_amount'    => $tax,
            'total'         => $total,
            'started_at'    => now(),
        ]);

        ActivityLog::record($user->id, 'بدء التخطيط التشغيلي', 'workflow', 'client',
            'المنظمة: ' . ($user->org_name ?: $user->email));

        return response()->json(['workflow' => $workflow->load('consultant')], 201);
    }

    // ── GET /api/operational/consultants ─────────────────────────────────────
    public function consultants()
    {
        return response()->json(Consultant::all());
    }

    // ── POST /api/operational/workflow/consultant ─────────────────────────────
    public function selectConsultant(Request $request)
    {
        $request->validate([
            'consultant_id' => 'required|exists:consultants,id',
        ]);

        $workflow = $this->userWorkflow($request);

        if ($workflow->current_step !== 1) {
            return response()->json(['message' => 'الخطوة غير صحيحة.'], 422);
        }

        $consultant = Consultant::findOrFail($request->consultant_id);
        if (!$consultant->available) {
            return response()->json(['message' => 'المستشار غير متاح حالياً.'], 422);
        }

        $workflow->update([
            'consultant_id' => $consultant->id,
            'current_step'  => 2,
        ]);

        return response()->json(['workflow' => $workflow->fresh('consultant')]);
    }

    // ── POST /api/operational/workflow/pay ───────────────────────────────────
    public function pay(Request $request)
    {
        $request->validate([
            'payment_method' => 'required|in:card,mada,apple_pay,bank_transfer',
            'discount_code'  => 'nullable|string|max:50',
        ]);

        $workflow = $this->userWorkflow($request);

        if ($workflow->current_step !== 2) {
            return response()->json(['message' => 'الخطوة غير صحيحة.'], 422);
        }

        $discount = 0;
        if ($request->discount_code) {
            $dc = DiscountCode::where('code', strtoupper($request->discount_code))->first();
            if ($dc && $dc->isValid()) {
                $discount = $dc->calcDiscount($workflow->subtotal);
                $dc->increment('used_count');
            }
        }

        $total = $workflow->subtotal - $discount + $workflow->tax_amount;

        $commissionRate  = (float) (ServiceSetting::val('consultant_commission_rate', 80)) / 100;
        $consultantShare = round(($workflow->subtotal - $discount) * $commissionRate, 2);

        $order = Order::create([
            'user_id'          => $request->user()->id,
            'order_number'     => 'OPR-' . strtoupper(Str::random(8)),
            'service_type'     => 'operational',
            'workflow_id'      => $workflow->id,
            'consultant_id'    => $workflow->consultant_id,
            'subtotal'         => $workflow->subtotal,
            'tax_amount'       => $workflow->tax_amount,
            'discount_code'    => $request->discount_code,
            'discount_amount'  => $discount,
            'total'            => $total,
            'consultant_share' => $consultantShare,
            'payment_method'   => $request->payment_method,
            'payment_status'   => 'paid',
            'paid_at'          => now(),
        ]);

        $workflow->update([
            'current_step'    => 3,
            'status'          => 'active',
            'payment_status'  => 'paid',
            'payment_method'  => $request->payment_method,
            'paid_at'         => now(),
            'discount_code'   => $request->discount_code,
            'discount_amount' => $discount,
            'total'           => $total,
        ]);

        // إنشاء submissions للـ 5 وحدات
        $units = OperationalUnit::orderBy('unit_number')->get();
        foreach ($units as $unit) {
            OperationalSubmission::firstOrCreate([
                'workflow_id' => $workflow->id,
                'unit_id'     => $unit->id,
            ], [
                'unit_number' => $unit->unit_number,
                'status'      => 'not_started',
                'form_data'   => null,
            ]);
        }

        ActivityLog::record($request->user()->id, 'دفع — تشغيلي', 'payment', 'client',
            number_format($total, 2) . ' ر.س — ' . ($request->user()->org_name ?: $request->user()->email) . ' — ' . $order->order_number);

        return response()->json([
            'workflow' => $workflow->fresh(),
            'order'    => $order,
        ]);
    }

    // ── GET /api/operational/units ────────────────────────────────────────────
    public function units(Request $request)
    {
        $workflow = $this->userWorkflow($request);
        $units    = OperationalUnit::orderBy('unit_number')->get();

        $submissions = OperationalSubmission::where('workflow_id', $workflow->id)
            ->get()->keyBy('unit_number');

        $data = $units->map(function ($unit) use ($submissions) {
            $sub = $submissions->get($unit->unit_number);
            return array_merge($unit->toArray(), [
                'submission_status' => $sub?->status ?? 'not_started',
                'submission_id'     => $sub?->id,
                'consultant_notes'  => $sub?->consultant_notes,
            ]);
        });

        return response()->json($data);
    }

    // ── GET /api/operational/units/{num} ──────────────────────────────────────
    public function unit(Request $request, int $unitNumber)
    {
        $workflow = $this->userWorkflow($request);
        $unit     = OperationalUnit::where('unit_number', $unitNumber)->firstOrFail();

        $submission = OperationalSubmission::where('workflow_id', $workflow->id)
            ->where('unit_id', $unit->id)
            ->first();

        return response()->json([
            'unit'       => $unit,
            'submission' => $submission,
        ]);
    }

    // ── POST /api/operational/units/{num}/save ────────────────────────────────
    public function saveUnit(Request $request, int $unitNumber)
    {
        $request->validate(['form_data' => 'present|array']);

        $workflow = $this->userWorkflow($request);
        $unit     = OperationalUnit::where('unit_number', $unitNumber)->firstOrFail();

        $submission = OperationalSubmission::where('workflow_id', $workflow->id)
            ->where('unit_id', $unit->id)
            ->firstOrFail();

        if ($submission->status === 'approved') {
            return response()->json(['message' => 'الوحدة معتمدة نهائياً ولا يمكن تعديلها.'], 422);
        }

        $newStatus = in_array($submission->status, ['not_started', 'revision'])
            ? 'in_progress'
            : $submission->status;

        $submission->update([
            'form_data' => $request->form_data,
            'status'    => $newStatus,
        ]);

        return response()->json(['submission' => $submission]);
    }

    // ── POST /api/operational/units/{num}/submit ──────────────────────────────
    public function submitUnit(Request $request, int $unitNumber)
    {
        $request->validate(['form_data' => 'present|array']);

        $workflow = $this->userWorkflow($request);
        $unit     = OperationalUnit::where('unit_number', $unitNumber)->firstOrFail();

        $submission = OperationalSubmission::where('workflow_id', $workflow->id)
            ->where('unit_id', $unit->id)
            ->firstOrFail();

        if ($submission->status === 'approved') {
            return response()->json(['message' => 'الوحدة معتمدة بالفعل.'], 422);
        }

        // التحقق أن جميع الوحدات السابقة أُرسلت
        if ($unitNumber > 1) {
            $prevUnits = OperationalUnit::where('unit_number', '<', $unitNumber)
                ->orderBy('unit_number')->pluck('id');
            $notSubmitted = OperationalSubmission::where('workflow_id', $workflow->id)
                ->whereIn('unit_id', $prevUnits)
                ->whereNotIn('status', ['submitted', 'reviewing', 'revision', 'approved'])
                ->exists();
            if ($notSubmitted) {
                return response()->json(['message' => 'يجب إرسال جميع الوحدات السابقة قبل المتابعة.'], 422);
            }
        }

        $submission->update([
            'form_data'    => $request->form_data,
            'status'       => 'submitted',
            'submitted_at' => now(),
        ]);

        // التحقق إذا كل الوحدات مُرسَلة → ننتقل لخطوة المراجعة
        $workflow->load('submissions');
        $allSubmitted = $workflow->submissions->every(
            fn($s) => in_array($s->status, ['submitted', 'reviewing', 'revision', 'approved'])
        );

        if ($allSubmitted && $workflow->current_step === 3) {
            $workflow->update(['current_step' => 4, 'status' => 'review']);
        }

        ActivityLog::record($request->user()->id, 'إرسال وحدة للمراجعة — تشغيلي', 'review', 'client',
            'الوحدة ' . $unitNumber . ': ' . $unit->name . ' — ' . ($request->user()->org_name ?: $request->user()->email));

        return response()->json(['submission' => $submission->fresh()]);
    }

    // ── GET /api/operational/progress ────────────────────────────────────────
    public function progress(Request $request)
    {
        $workflow = $this->userWorkflow($request);
        $total    = OperationalSubmission::where('workflow_id', $workflow->id)->count();
        $approved = OperationalSubmission::where('workflow_id', $workflow->id)
            ->where('status', 'approved')->count();
        $percent  = $total > 0 ? round(($approved / $total) * 100) : 0;

        return response()->json([
            'total_units'     => $total,
            'approved_units'  => $approved,
            'progress_percent'=> $percent,
            'status'          => $workflow->status,
        ]);
    }

    // ── GET /api/operational/workflow/pdf-link ────────────────────────────────
    public function getPdfLink(Request $request)
    {
        $workflow = $this->userWorkflow($request);

        $url = URL::temporarySignedRoute(
            'pdf.operational',
            now()->addMinutes(10),
            ['user_id' => $request->user()->id, 'workflow_id' => $workflow->id]
        );

        return response()->json(['url' => $url]);
    }

    // ── GET /pdf/operational (web route — signed URL) ─────────────────────────
    public function downloadPDFSigned(Request $request)
    {
        if (!$request->hasValidSignature()) {
            abort(403, 'الرابط منتهي الصلاحية أو غير صالح.');
        }

        $userId     = (int) $request->user_id;
        $workflowId = $request->workflow_id ? (int) $request->workflow_id : null;

        $query = OperationalWorkflow::with(['consultant', 'submissions.unit', 'user'])
            ->where('user_id', $userId);

        $workflow = $workflowId
            ? $query->where('id', $workflowId)->firstOrFail()
            : $query->latest()->firstOrFail();

        $submissions = $workflow->submissions
            ->filter(fn($s) => !empty($s->form_data))
            ->sortBy('unit_number')
            ->values();

        return view('pdf.operational', compact('workflow', 'submissions'));
    }

    // ── GET /api/operational/workflow/pdf ─────────────────────────────────────
    public function downloadPDF(Request $request)
    {
        $userId     = $request->user()->id;
        $workflowId = $request->input('workflow_id') ? (int) $request->input('workflow_id') : null;

        $query = OperationalWorkflow::with(['consultant', 'submissions.unit', 'user'])
            ->where('user_id', $userId);

        $workflow = $workflowId
            ? $query->where('id', $workflowId)->firstOrFail()
            : $query->latest()->firstOrFail();

        $submissions = $workflow->submissions
            ->filter(fn($s) => !empty($s->form_data))
            ->sortBy('unit_number')
            ->values();

        $html = view('pdf.operational', compact('workflow', 'submissions'))->render();

        set_error_handler(fn() => true, E_WARNING | E_NOTICE);
        try {
            $mpdf = new Mpdf([
                'mode'              => 'utf-8',
                'format'            => 'A4',
                'default_font'      => 'dejavusans',
                'default_font_size' => 11,
                'margin_left'       => 12,
                'margin_right'      => 12,
                'margin_top'        => 10,
                'margin_bottom'     => 10,
                'autoLangToFont'    => false,
                'autoScriptToLang'  => false,
                'useSubstitutions'  => false,
                'tempDir'           => storage_path('app/mpdf-tmp'),
            ]);

            $mpdf->WriteHTML($html);

            $filename   = 'operational-plan-' . now()->format('Y-m-d') . '.pdf';
            $pdfContent = $mpdf->Output('', 'S');
        } finally {
            restore_error_handler();
        }

        return response($pdfContent, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Content-Length'      => strlen($pdfContent),
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
        ]);
    }

    // ── GET /api/operational/strategic-initiatives ────────────────────────────
    // جلب مبادرات الخطة الاستراتيجية (وحدة 5) لاستخدامها في الوحدة 1
    public function strategicInitiatives(Request $request)
    {
        $strategicWorkflow = StrategicWorkflow::where('user_id', $request->user()->id)
            ->where('status', 'completed')
            ->latest()
            ->first();

        if (!$strategicWorkflow) {
            return response()->json(['initiatives' => [], 'message' => 'لا توجد خطة استراتيجية مكتملة.']);
        }

        $unit5Submission = UnitSubmission::where('workflow_id', $strategicWorkflow->id)
            ->where('unit_number', 5)
            ->first();

        $formData = $unit5Submission?->form_data ?? [];
        $initiatives = [];

        // استخراج المبادرات من البيانات المحفوظة
        if (!empty($formData['rows'])) {
            $initiatives = collect($formData['rows'])
                ->filter(fn($r) => !empty($r['initiative'] ?? $r['المبادرة'] ?? $r[0] ?? ''))
                ->map(fn($r) => $r['initiative'] ?? $r['المبادرة'] ?? (is_array($r) ? implode(' - ', array_values($r)) : $r))
                ->values()
                ->toArray();
        } elseif (!empty($formData['initiatives'])) {
            $initiatives = $formData['initiatives'];
        } elseif (!empty($formData)) {
            // محاولة استخراج أي نص كمبادرة
            foreach ($formData as $key => $value) {
                if (is_string($value) && strlen($value) > 5) {
                    $initiatives[] = $value;
                } elseif (is_array($value)) {
                    foreach ($value as $v) {
                        if (is_string($v) && strlen($v) > 5) {
                            $initiatives[] = $v;
                        }
                    }
                }
            }
        }

        return response()->json(['initiatives' => array_values(array_unique($initiatives))]);
    }

    // ── POST /api/operational/workflow/arbitration ────────────────────────────
    // arbitration_step: 1=requested(provider selection)
    //                   2=provider chosen, at payment
    //                   3=paid/done
    public function arbitration(Request $request)
    {
        $request->validate([
            'arbitration_step' => 'required|integer|in:1,2,3',
        ]);

        $workflow = $this->userWorkflow($request);

        if ($workflow->current_step !== 5) {
            return response()->json(['message' => 'الخطوة غير صحيحة.'], 422);
        }

        $data = ['arbitration_step' => $request->arbitration_step];

        // Only mark fully complete when payment is done (step 3)
        if ($request->arbitration_step === 3) {
            $data['status']       = 'completed';
            $data['completed_at'] = now();
        }

        $workflow->update($data);

        return response()->json(['workflow' => $workflow->fresh()->load(['consultant', 'user'])]);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    // يعيد workflow بناءً على workflow_id (إن وُجد) أو الأحدث — لا يرمي 404
    private function resolveWorkflow(Request $request): ?OperationalWorkflow
    {
        $workflowId = $request->input('workflow_id');
        $query = OperationalWorkflow::with(['consultant', 'submissions.unit', 'user'])
            ->where('user_id', $request->user()->id);

        if ($workflowId) {
            return $query->where('id', (int) $workflowId)->first();
        }

        return $query->latest()->first();
    }

    // يعيد workflow محدد أو يرمي 404 (للعمليات التي تتطلب وجود workflow)
    private function userWorkflow(Request $request): OperationalWorkflow
    {
        $workflowId = $request->input('workflow_id');
        $query = OperationalWorkflow::where('user_id', $request->user()->id);

        if ($workflowId) {
            return $query->where('id', (int) $workflowId)->firstOrFail();
        }

        return $query
            ->orderByRaw("(status = 'completed') DESC")
            ->orderByRaw("current_step DESC")
            ->orderBy('id', 'desc')
            ->firstOrFail();
    }
}
