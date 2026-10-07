<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Consultant;
use App\Models\DiscountCode;
use App\Models\Order;
use App\Models\ServiceSetting;
use App\Models\StrategicUnit;
use App\Models\StrategicWorkflow;
use App\Models\UnitSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Mpdf\Mpdf;

class StrategicController extends Controller
{
    // ── GET /api/strategic/workflows ─────────────────────────────────────────
    // قائمة جميع خطط المستخدم
    public function listWorkflows(Request $request)
    {
        $workflows = StrategicWorkflow::with('consultant')
            ->where('user_id', $request->user()->id)
            ->withCount([
                'submissions as approved_count'  => fn($q) => $q->where('status', 'approved'),
                'submissions as submitted_count' => fn($q) => $q->whereIn('status', ['submitted', 'reviewing', 'approved']),
                'submissions as total_count',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        // منع إنشاء خطة جديدة إذا كانت هناك خطة لم تُستكمل تعبئة جميع وحداتها
        $unitCount     = StrategicUnit::count();
        $hasIncomplete = $workflows->contains(
            fn($wf) => $wf->status !== 'completed' && $wf->submitted_count < $unitCount
        );

        return response()->json([
            'workflows'      => $workflows,
            'can_create_new' => !$hasIncomplete,
        ]);
    }

    // ── GET /api/strategic/workflow ──────────────────────────────────────────
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

    // ── GET /api/strategic/page-data ─────────────────────────────────────────
    public function pageData(Request $request)
    {
        $workflow = $this->resolveWorkflow($request);

        $units       = null;
        $submissions = null;

        if ($workflow) {
            $submissions = $workflow->submissions->keyBy('unit_number');

            // دائماً أرجع الوحدات بعد بدء مرحلة العمل — للسماح بمراجعة الخطوات السابقة
            if ($workflow->current_step >= 3) {
                $allUnits  = StrategicUnit::orderBy('unit_number')->get();
                $subsByNum = UnitSubmission::where('workflow_id', $workflow->id)
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
        $catalog = StrategicUnit::orderBy('unit_number')->get(['unit_number', 'name']);

        return response()->json([
            'workflow'    => $workflow,
            'submissions' => $submissions,
            'units'       => $units,
            'catalog'     => $catalog,
            'pricing'     => [
                'base'                => (float) ($s['strategic_base']      ?? 5000),
                'addon_certification' => (float) ($s['addon_certification'] ?? 2000),
                'addon_design'        => (float) ($s['addon_design']        ?? 1500),
                'tax_rate'            => (float) ($s['tax_rate']            ?? 15),
            ],
        ]);
    }

    // ── POST /api/strategic/workflow/start ───────────────────────────────────
    // إنشاء خطة استراتيجية جديدة دائماً
    public function start(Request $request)
    {
        $request->validate([
            'addon_certification' => 'boolean',
            'addon_design'        => 'boolean',
        ]);

        $s        = ServiceSetting::map();
        $subtotal = (float) ($s['strategic_base'] ?? 5000);
        if ($request->addon_certification) $subtotal += (float) ($s['addon_certification'] ?? 2000);
        if ($request->addon_design)        $subtotal += (float) ($s['addon_design'] ?? 1500);
        $taxRate  = (float) ($s['tax_rate'] ?? 15) / 100;
        $tax      = round($subtotal * $taxRate, 2);
        $total    = $subtotal + $tax;

        $workflow = StrategicWorkflow::create([
            'user_id'             => $request->user()->id,
            'current_step'        => 1,
            'status'              => 'pending',
            'addon_certification' => $request->boolean('addon_certification'),
            'addon_design'        => $request->boolean('addon_design'),
            'subtotal'            => $subtotal,
            'tax_amount'          => $tax,
            'total'               => $total,
            'started_at'          => now(),
        ]);

        ActivityLog::record($request->user()->id, 'بدء التخطيط الاستراتيجي', 'workflow', 'client',
            'المنظمة: ' . ($request->user()->org_name ?: $request->user()->email));

        return response()->json(['workflow' => $workflow], 201);
    }

    // ── GET /api/strategic/consultants ───────────────────────────────────────
    public function consultants()
    {
        return response()->json(Consultant::all());
    }

    // ── POST /api/strategic/workflow/consultant ───────────────────────────────
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

        ActivityLog::record($request->user()->id, 'اختيار مستشار — استراتيجي', 'workflow', 'client',
            'المستشار: ' . $consultant->name . ' — ' . ($request->user()->org_name ?: $request->user()->email));

        return response()->json(['workflow' => $workflow->fresh('consultant')]);
    }

    // ── POST /api/strategic/workflow/pay ─────────────────────────────────────
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
            'order_number'     => 'STR-' . strtoupper(Str::random(8)),
            'service_type'     => 'strategic',
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

        $units = StrategicUnit::orderBy('unit_number')->get();
        foreach ($units as $unit) {
            UnitSubmission::firstOrCreate([
                'workflow_id' => $workflow->id,
                'unit_id'     => $unit->id,
            ], [
                'unit_number' => $unit->unit_number,
                'status'      => 'not_started',
                'form_data'   => null,
            ]);
        }

        ActivityLog::record($request->user()->id, 'دفع — استراتيجي', 'payment', 'client',
            number_format($total, 2) . ' ر.س — ' . ($request->user()->org_name ?: $request->user()->email) . ' — ' . $order->order_number);

        return response()->json([
            'workflow' => $workflow->fresh(),
            'order'    => $order,
        ]);
    }

    // ── GET /api/strategic/units ──────────────────────────────────────────────
    public function units(Request $request)
    {
        $workflow = $this->userWorkflow($request);
        $units    = StrategicUnit::orderBy('unit_number')->get();

        $submissions = UnitSubmission::where('workflow_id', $workflow->id)
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

    // ── GET /api/strategic/units/{id} ─────────────────────────────────────────
    public function unit(Request $request, int $unitNumber)
    {
        $workflow = $this->userWorkflow($request);
        $unit     = StrategicUnit::where('unit_number', $unitNumber)->firstOrFail();

        $submission = UnitSubmission::where('workflow_id', $workflow->id)
            ->where('unit_id', $unit->id)
            ->first();

        return response()->json([
            'unit'       => $unit,
            'submission' => $submission,
        ]);
    }

    // ── POST /api/strategic/units/{id}/save ───────────────────────────────────
    public function saveUnit(Request $request, int $unitNumber)
    {
        $request->validate([
            'form_data' => 'present|array',
        ]);

        $workflow = $this->userWorkflow($request);
        $unit     = StrategicUnit::where('unit_number', $unitNumber)->firstOrFail();

        $submission = UnitSubmission::where('workflow_id', $workflow->id)
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

    // ── POST /api/strategic/units/{id}/submit ─────────────────────────────────
    public function submitUnit(Request $request, int $unitNumber)
    {
        $request->validate([
            'form_data' => 'present|array',
        ]);

        $workflow = $this->userWorkflow($request);
        $unit     = StrategicUnit::where('unit_number', $unitNumber)->firstOrFail();

        $submission = UnitSubmission::where('workflow_id', $workflow->id)
            ->where('unit_id', $unit->id)
            ->firstOrFail();

        if ($submission->status === 'approved') {
            return response()->json(['message' => 'الوحدة معتمدة بالفعل.'], 422);
        }

        if ($unitNumber > 1) {
            $prevUnits    = StrategicUnit::where('unit_number', '<', $unitNumber)->pluck('id');
            $notSubmitted = UnitSubmission::where('workflow_id', $workflow->id)
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

        $allSubmitted = UnitSubmission::where('workflow_id', $workflow->id)
            ->whereNotIn('status', ['submitted', 'reviewing', 'approved'])
            ->doesntExist();

        if ($allSubmitted && $workflow->current_step === 3) {
            $workflow->update(['current_step' => 4, 'status' => 'review']);
        }

        ActivityLog::record($request->user()->id, 'إرسال وحدة للمراجعة — استراتيجي', 'review', 'client',
            'الوحدة ' . $unitNumber . ': ' . $unit->name . ' — ' . ($request->user()->org_name ?: $request->user()->email));

        return response()->json(['submission' => $submission, 'workflow_step' => $workflow->fresh()->current_step]);
    }

    // ── GET /api/strategic/workflow/progress ──────────────────────────────────
    public function progress(Request $request)
    {
        $workflow = $this->userWorkflow($request);
        $workflow->load('consultant');

        $total    = UnitSubmission::where('workflow_id', $workflow->id)->count();
        $approved = UnitSubmission::where('workflow_id', $workflow->id)->where('status', 'approved')->count();
        $percent  = $total > 0 ? round(($approved / $total) * 100) : 0;

        return response()->json([
            'current_step'     => $workflow->current_step,
            'status'           => $workflow->status,
            'total_units'      => $total,
            'approved_units'   => $approved,
            'progress_percent' => $percent,
            'consultant'       => $workflow->consultant,
        ]);
    }

    // ── GET /api/strategic/workflow/pdf-link ─────────────────────────────────
    public function getPdfLink(Request $request)
    {
        $workflow = $this->userWorkflow($request);

        $url = URL::temporarySignedRoute(
            'pdf.strategic',
            now()->addMinutes(10),
            ['user_id' => $request->user()->id, 'workflow_id' => $workflow->id]
        );

        return response()->json(['url' => $url]);
    }

    // ── GET /pdf/strategic (web route — signed URL) ───────────────────────────
    public function downloadPDFSigned(Request $request)
    {
        if (!$request->hasValidSignature()) {
            abort(403, 'الرابط منتهي الصلاحية أو غير صالح.');
        }

        $userId     = (int) $request->user_id;
        $workflowId = $request->workflow_id ? (int) $request->workflow_id : null;

        $query = StrategicWorkflow::with(['consultant', 'submissions.unit', 'user'])
            ->where('user_id', $userId);

        $workflow = $workflowId
            ? $query->where('id', $workflowId)->firstOrFail()
            : $query->latest()->firstOrFail();

        $submissions = $workflow->submissions
            ->filter(fn($s) => !empty($s->form_data))
            ->sortBy('unit_number')
            ->values();

        if ($submissions->isEmpty()) {
            $submissions = $workflow->submissions
                ->where('status', 'approved')
                ->sortBy('unit_number')
                ->values();
        }

        return view('strategic.plan', compact('workflow', 'submissions'));
    }

    // ── GET /api/strategic/workflow/pdf (Axios fallback) ─────────────────────
    public function downloadPDF(Request $request)
    {
        $workflowId = $request->input('workflow_id') ? (int) $request->input('workflow_id') : null;
        return $this->buildPdfResponse($request->user()->id, $workflowId);
    }

    // ── مشترك: بناء استجابة الـ PDF ────────────────────────────────────────
    private function buildPdfResponse(int $userId, ?int $workflowId = null)
    {
        $query = StrategicWorkflow::with(['consultant', 'submissions.unit', 'user'])
            ->where('user_id', $userId);

        $workflow = $workflowId
            ? $query->where('id', $workflowId)->firstOrFail()
            : $query->latest()->firstOrFail();

        $submissions = $workflow->submissions
            ->filter(fn($s) => !empty($s->form_data))
            ->sortBy('unit_number')
            ->values();

        if ($submissions->isEmpty()) {
            $submissions = $workflow->submissions
                ->where('status', 'approved')
                ->sortBy('unit_number')
                ->values();
        }

        $html = view('pdf.strategic', compact('workflow', 'submissions'))->render();

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

            $filename   = 'strategic-plan-' . now()->format('Y-m-d') . '.pdf';
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

    // ── Helpers ───────────────────────────────────────────────────────────────

    // يعيد workflow محدد أو null إن لم يوجد (للـ page-data/getWorkflow)
    private function resolveWorkflow(Request $request): ?StrategicWorkflow
    {
        $workflowId = $request->input('workflow_id');
        $query = StrategicWorkflow::with(['consultant', 'submissions.unit'])
            ->where('user_id', $request->user()->id);

        if ($workflowId) {
            return $query->where('id', (int) $workflowId)->first();
        }

        return $query->latest()->first();
    }

    // يعيد workflow محدد أو يرمي 404 (للعمليات التي تتطلب وجود workflow)
    private function userWorkflow(Request $request): StrategicWorkflow
    {
        $workflowId = $request->input('workflow_id');

        $query = StrategicWorkflow::where('user_id', $request->user()->id);

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
