<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultant;
use App\Models\DiscountCode;
use App\Models\OperationalWorkflow;
use App\Models\Order;
use App\Models\PolicySelection;
use App\Models\PolicyTypeContent;
use App\Models\PolicyWorkflow;
use App\Models\ServiceSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Mpdf\Mpdf;

class PolicyController extends Controller
{
    // ── Static defaults for 7 policy types ──────────────────────────────────
    private static function policyDefaults(): array
    {
        return [
            ['id'=>1,'name'=>'لائحة الموارد البشرية',    'icon'=>'👥','description'=>'تنظيم شؤون الموظفين والتوظيف والتدريب والإجازات',    'price'=>1500,'sections'=>['معلومات المنظمة','التوظيف والاستقطاب','ساعات العمل والإجازات','التعويضات والمزايا','تقييم الأداء','التدريب والتطوير','إنهاء الخدمة','السلوك والانضباط']],
            ['id'=>2,'name'=>'السياسات الإعلامية',        'icon'=>'📢','description'=>'ضبط التواصل الإعلامي والمحتوى والعلاقات العامة',       'price'=>1200,'sections'=>['معلومات المنظمة','الهوية البصرية','التواصل الإعلامي','وسائل التواصل الاجتماعي','الأزمات الإعلامية','المتحدث الرسمي']],
            ['id'=>3,'name'=>'سياسات الحوكمة',            'icon'=>'⚖️','description'=>'تنظيم الحوكمة ومسؤوليات مجلس الإدارة واللجان',        'price'=>1800,'sections'=>['معلومات المنظمة','مجلس الإدارة','اللجان','التصويت واتخاذ القرار','تضارب المصالح','الشفافية والإفصاح','المحاسبية']],
            ['id'=>4,'name'=>'لائحة تنظيم التبرعات',    'icon'=>'💰','description'=>'تنظيم استقبال وإدارة وتوثيق التبرعات',                   'price'=>1000,'sections'=>['معلومات المنظمة','قنوات استقبال التبرعات','أنواع التبرعات','التوثيق والإيصالات','التبرعات المشروطة','الإفصاح المالي']],
            ['id'=>5,'name'=>'سياسة الموارد المالية',    'icon'=>'🏦','description'=>'ضبط الإدارة المالية والميزانيات والصرف',                  'price'=>1500,'sections'=>['معلومات المنظمة','الميزانية السنوية','صلاحيات الصرف','المشتريات','التقارير المالية','التدقيق والمراجعة']],
            ['id'=>6,'name'=>'سياسة الخصوصية والسرية', 'icon'=>'🔒','description'=>'حماية بيانات المستفيدين والسرية والإفصاح',               'price'=>1200,'sections'=>['معلومات المنظمة','جمع البيانات','تخزين البيانات','مشاركة البيانات','حقوق المستفيد','الإفصاح والشفافية']],
            ['id'=>7,'name'=>'سياسات المتابعة والتقييم','icon'=>'📊','description'=>'آليات المتابعة وتقييم الأداء والبرامج',                   'price'=>1000,'sections'=>['معلومات المنظمة','إطار المتابعة','أدوات التقييم','مؤشرات الأداء','التقارير الدورية','التحسين المستمر']],
        ];
    }

    // ── Catalog merged with DB overrides (name, description, price) ──────────
    public static function policyTypes(): array
    {
        $overrides = PolicyTypeContent::all()->keyBy('policy_type_id');

        return collect(self::policyDefaults())->map(function ($t) use ($overrides) {
            $o = $overrides->get($t['id']);
            return array_merge($t, [
                'name'                => ($o && $o->name)             ? $o->name             : $t['name'],
                'description'         => ($o && $o->description)      ? $o->description      : $t['description'],
                'price'               => ($o && $o->price !== null)   ? (float) $o->price    : $t['price'],
                'overview'            => $o?->overview,
                'written_description' => $o?->written_description,
                'tip'                 => $o?->tip,
                'video_url'           => $o?->video_url,
                'video_duration'      => $o?->video_duration,
            ]);
        })->values()->toArray();
    }

    // ── GET /api/policies/workflows ───────────────────────────────────────────
    public function index(Request $request)
    {
        $uid     = $request->user()->id;
        $typeMap = collect(self::policyTypes())->keyBy('id');

        // Fetch oldest-first for sequential numbering, then reverse for display
        $rows = PolicyWorkflow::with(['consultant', 'selections'])
            ->where('user_id', $uid)
            ->orderBy('id', 'asc')
            ->get();

        // Incomplete = not completed AND questionnaires not yet all submitted (step < 4)
        $hasIncomplete = $rows->filter(fn($wf) =>
            $wf->status !== 'completed' && $wf->current_step < 4
        )->isNotEmpty();

        $workflows = $rows->reverse()->values()->map(function ($wf, $displayIndex) use ($typeMap, $rows, $hasIncomplete) {
            $sels          = $wf->selections;
            $approvedNames = $sels->where('status', 'approved')
                ->map(fn($s) => $typeMap->get($s->policy_type_id)['name'] ?? '—')
                ->values();

            // Sequential number = position in oldest-first list (1-based)
            $planNumber = $rows->search(fn($r) => $r->id === $wf->id) + 1;

            return array_merge($wf->toArray(), [
                'plan_number'      => $planNumber,
                'selections_count' => $sels->count(),
                'approved_count'   => $sels->where('status', 'approved')->count(),
                'approved_names'   => $approvedNames,
            ]);
        });

        return response()->json([
            'workflows'      => $workflows,
            'can_create_new' => !$hasIncomplete,
        ]);
    }

    // ── GET /api/policies/page-data ───────────────────────────────────────────
    public function pageData(Request $request)
    {
        $user = $request->user();

        $operationalWorkflow = OperationalWorkflow::where('user_id', $user->id)
            ->where('status', 'completed')
            ->latest()
            ->first();

        $workflowQuery = PolicyWorkflow::with(['consultant', 'selections', 'user'])
            ->where('user_id', $user->id);

        if ($request->filled('workflow_id')) {
            $workflowQuery->where('id', (int) $request->workflow_id);
        } else {
            $workflowQuery->latest();
        }

        $workflow = $workflowQuery->first();

        $operationalConsultant = $operationalWorkflow?->load('consultant')?->consultant;

        $selectionsWithTypes = null;
        if ($workflow) {
            $typeMap = collect(self::policyTypes())->keyBy('id');
            $selectionsWithTypes = $workflow->selections->map(
                fn($s) => array_merge($s->toArray(), ['policy_type' => $typeMap->get($s->policy_type_id)])
            );
        }

        $s         = ServiceSetting::map();
        $designFee = (float) ($s['policy_design'] ?? 1500);
        $taxRate   = (float) ($s['tax_rate']       ?? 15) / 100;
        $designTax = round($designFee * $taxRate, 2);

        $designFileUrl = null;
        if ($workflow?->design_file) {
            $designFileUrl = url('storage/' . $workflow->design_file);
        }

        return response()->json([
            'workflow'                => $workflow,
            'selections'              => $selectionsWithTypes,
            'policy_types'            => self::policyTypes(),
            'operational_completed'   => (bool) $operationalWorkflow,
            'operational_consultant'  => $operationalConsultant,
            'design_price'            => $designFee,
            'design_tax'              => $designTax,
            'design_total'            => $designFee + $designTax,
            'design_file_url'         => $designFileUrl,
        ]);
    }

    // ── POST /api/policies/workflow/start ─────────────────────────────────────
    public function start(Request $request)
    {
        $user     = $request->user();
        $forceNew = $request->boolean('force_new');

        // Resume existing active plan (no force_new)
        if (!$forceNew) {
            $existing = PolicyWorkflow::where('user_id', $user->id)
                ->where('status', '!=', 'completed')
                ->orderByRaw("current_step DESC")
                ->orderBy('id', 'desc')
                ->first();

            if ($existing) {
                return response()->json(['workflow' => $existing->load(['consultant', 'selections'])]);
            }
        }

        // Block new plan if any existing plan still has unfilled questionnaires (step < 4)
        if ($forceNew) {
            $incomplete = PolicyWorkflow::where('user_id', $user->id)
                ->where('status', '!=', 'completed')
                ->where('current_step', '<', 4)
                ->exists();

            if ($incomplete) {
                return response()->json([
                    'message' => 'يجب إكمال تعبئة جميع استبيانات السياسات في الخطة الحالية قبل إنشاء خطة جديدة.',
                ], 422);
            }
        }

        $operationalWorkflow = OperationalWorkflow::where('user_id', $user->id)
            ->where('status', 'completed')
            ->latest()
            ->first();

        $workflow = PolicyWorkflow::create([
            'user_id'       => $user->id,
            'consultant_id' => $operationalWorkflow?->consultant_id,
            'current_step'  => 0,
            'status'        => 'pending',
            'started_at'    => now(),
        ]);

        return response()->json(['workflow' => $workflow->load('consultant')], 201);
    }

    // ── POST /api/policies/workflow/select-policies ───────────────────────────
    // Saves selected policy IDs + calculated pricing (before payment)
    public function selectPolicies(Request $request)
    {
        $request->validate([
            'policy_type_ids'    => 'required|array|min:1',
            'policy_type_ids.*'  => 'integer|between:1,7',
        ]);

        $workflow = $this->userWorkflow($request);

        $types    = collect(self::policyTypes())->whereIn('id', $request->policy_type_ids);
        $subtotal = $types->sum('price');
        $s        = ServiceSetting::map();
        $tax      = round($subtotal * ((float) ($s['tax_rate'] ?? 15) / 100), 2);

        $workflow->update([
            'current_step'     => 1,
            'selected_policies'=> $request->policy_type_ids,
            'subtotal'         => $subtotal,
            'tax_amount'       => $tax,
            'total'            => $subtotal + $tax,
        ]);

        return response()->json(['workflow' => $workflow->fresh()]);
    }

    // ── POST /api/policies/workflow/pay ───────────────────────────────────────
    public function pay(Request $request)
    {
        $request->validate([
            'payment_method'       => 'required|in:card,mada,apple_pay,bank_transfer',
            'policy_type_ids'      => 'required|array|min:1',
            'policy_type_ids.*'    => 'integer|between:1,7',
            'discount_code'        => 'nullable|string|max:50',
            'include_arbitration'  => 'nullable|boolean',
        ]);

        $workflow = $this->userWorkflow($request);

        if ($workflow->payment_status === 'paid') {
            return response()->json(['message' => 'تم الدفع مسبقاً.'], 422);
        }

        $types    = collect(self::policyTypes())->whereIn('id', $request->policy_type_ids);
        $subtotal = $types->sum('price');

        $s = ServiceSetting::map();
        if ($request->boolean('include_arbitration')) {
            $subtotal += (float) ($s['policy_arbitration'] ?? 2000);
        }

        $discount = 0;
        if ($request->discount_code) {
            $dc = DiscountCode::where('code', strtoupper($request->discount_code))->first();
            if ($dc && $dc->isValid()) {
                $discount = $dc->calcDiscount($subtotal);
                $dc->increment('used_count');
            }
        }

        $taxRate = (float) ($s['tax_rate'] ?? 15) / 100;
        $taxable = $subtotal - $discount;
        $tax     = round($taxable * $taxRate, 2);
        $total   = $taxable + $tax;

        $commissionRate  = (float) (ServiceSetting::val('consultant_commission_rate', 80)) / 100;
        $consultantShare = round($taxable * $commissionRate, 2);

        $order = Order::create([
            'user_id'          => $request->user()->id,
            'order_number'     => 'POL-' . strtoupper(Str::random(8)),
            'service_type'     => 'policies',
            'workflow_id'      => $workflow->id,
            'consultant_id'    => $workflow->consultant_id,
            'subtotal'         => $subtotal,
            'tax_amount'       => $tax,
            'discount_code'    => $request->discount_code,
            'discount_amount'  => $discount,
            'total'            => $total,
            'consultant_share' => $consultantShare,
            'payment_method'   => $request->payment_method,
            'payment_status'   => 'paid',
            'paid_at'          => now(),
        ]);

        $workflow->update([
            'current_step'        => 3,
            'status'              => 'active',
            'selected_policies'   => $request->policy_type_ids,
            'subtotal'            => $subtotal,
            'tax_amount'          => $tax,
            'discount_code'       => $request->discount_code,
            'discount_amount'     => $discount,
            'include_arbitration' => $request->boolean('include_arbitration'),
            'total'               => $total,
            'payment_method'      => $request->payment_method,
            'payment_status'      => 'paid',
            'paid_at'             => now(),
        ]);

        foreach ($request->policy_type_ids as $typeId) {
            PolicySelection::firstOrCreate(
                ['workflow_id' => $workflow->id, 'policy_type_id' => $typeId],
                ['status' => 'not_started', 'form_data' => null]
            );
        }

        $typeMap = collect(self::policyTypes())->keyBy('id');
        $selections = PolicySelection::where('workflow_id', $workflow->id)
            ->get()
            ->map(fn($s) => array_merge($s->toArray(), ['policy_type' => $typeMap->get($s->policy_type_id)]));

        return response()->json([
            'workflow'   => $workflow->fresh(),
            'selections' => $selections,
            'order'      => $order,
        ]);
    }

    // ── GET /api/policies/selections ─────────────────────────────────────────
    public function selections(Request $request)
    {
        $workflow = $this->userWorkflow($request);
        $typeMap  = collect(self::policyTypes())->keyBy('id');

        $selections = PolicySelection::where('workflow_id', $workflow->id)
            ->get()
            ->map(fn($s) => array_merge($s->toArray(), ['policy_type' => $typeMap->get($s->policy_type_id)]));

        return response()->json(['selections' => $selections, 'policy_types' => self::policyTypes()]);
    }

    // ── GET /api/policies/selections/{id} ────────────────────────────────────
    public function selection(Request $request, int $id)
    {
        $workflow  = $this->userWorkflow($request);
        $typeMap   = collect(self::policyTypes())->keyBy('id');
        $selection = PolicySelection::where('workflow_id', $workflow->id)->where('id', $id)->firstOrFail();

        return response()->json([
            'selection' => array_merge($selection->toArray(), ['policy_type' => $typeMap->get($selection->policy_type_id)]),
        ]);
    }

    // ── POST /api/policies/selections/{id}/save ───────────────────────────────
    public function saveSelection(Request $request, int $id)
    {
        $request->validate(['form_data' => 'present|array']);

        $workflow  = $this->userWorkflow($request);
        $selection = PolicySelection::where('workflow_id', $workflow->id)->where('id', $id)->firstOrFail();

        if ($selection->status === 'approved') {
            return response()->json(['message' => 'السياسة معتمدة نهائياً ولا يمكن تعديلها.'], 422);
        }

        $newStatus = in_array($selection->status, ['not_started', 'revision']) ? 'in_progress' : $selection->status;

        $selection->update(['form_data' => $request->form_data, 'status' => $newStatus]);

        return response()->json(['selection' => $selection]);
    }

    // ── POST /api/policies/selections/{id}/submit ─────────────────────────────
    public function submitSelection(Request $request, int $id)
    {
        $request->validate(['form_data' => 'present|array']);

        $workflow  = $this->userWorkflow($request);

        // Auto-heal: if consultant_id is missing, inherit from the completed operational workflow
        if (!$workflow->consultant_id) {
            $opWorkflow = OperationalWorkflow::where('user_id', $workflow->user_id)
                ->where('status', 'completed')
                ->latest()
                ->first();
            if ($opWorkflow?->consultant_id) {
                $workflow->update(['consultant_id' => $opWorkflow->consultant_id]);
            }
        }

        $selection = PolicySelection::where('workflow_id', $workflow->id)->where('id', $id)->firstOrFail();

        if ($selection->status === 'approved') {
            return response()->json(['message' => 'السياسة معتمدة بالفعل.'], 422);
        }

        $selection->update([
            'form_data'    => $request->form_data,
            'status'       => 'submitted',
            'submitted_at' => now(),
        ]);

        $workflow->load('selections');
        $allSubmitted = $workflow->selections->every(
            fn($s) => in_array($s->status, ['submitted', 'reviewing', 'revision', 'approved'])
        );

        if ($allSubmitted && $workflow->current_step === 3) {
            $workflow->update(['current_step' => 4]);
        }

        return response()->json(['selection' => $selection->fresh()]);
    }

    // ── POST /api/policies/workflow/design ────────────────────────────────────
    // User decides yes/no for professional design (step 7)
    public function requestDesign(Request $request)
    {
        $request->validate([
            'payment_method' => 'required|in:card,mada,apple_pay,bank_transfer',
            'want_design'    => 'required|boolean',
            'design_logo'    => 'nullable|file|mimes:png,jpg,jpeg,svg,webp|max:5120',
        ]);

        $workflow = $this->userWorkflow($request);

        if ($request->boolean('want_design')) {
            // رفع الشعار إن وُجد
            $logoPath = null;
            if ($request->hasFile('design_logo')) {
                $logoPath = $request->file('design_logo')->store('design-logos', 'public');
            }

            // استخراج متطلبات التصميم
            $brief = null;
            if ($request->input('design_brief')) {
                $brief = json_decode($request->input('design_brief'), true);
            }

            $s         = ServiceSetting::map();
            $designFee = (float) ($s['policy_design'] ?? 1500);
            $taxRate   = (float) ($s['tax_rate'] ?? 15) / 100;
            $tax       = round($designFee * $taxRate, 2);

            $designCommissionRate  = (float) (ServiceSetting::val('consultant_commission_rate', 80)) / 100;
            $designConsultantShare = round($designFee * $designCommissionRate, 2);

            Order::create([
                'user_id'          => $request->user()->id,
                'order_number'     => 'DES-' . strtoupper(Str::random(8)),
                'service_type'     => 'policies',
                'workflow_id'      => $workflow->id,
                'consultant_id'    => $workflow->consultant_id,
                'subtotal'         => $designFee,
                'tax_amount'       => $tax,
                'total'            => $designFee + $tax,
                'consultant_share' => $designConsultantShare,
                'payment_method'   => $request->payment_method,
                'payment_status'   => 'paid',
                'paid_at'          => now(),
            ]);

            $workflow->update([
                'want_design'           => true,
                'design_fee'            => $designFee,
                'design_payment_status' => 'paid',
                'design_paid_at'        => now(),
                'design_status'         => 'pending',
                'status'                => 'design_in_progress',
                'design_brief'          => $brief,
                'design_logo'           => $logoPath,
            ]);
        } else {
            $workflow->update([
                'want_design'  => false,
                'status'       => 'completed',
                'completed_at' => now(),
            ]);
        }

        return response()->json(['workflow' => $workflow->fresh()->load(['consultant', 'user'])]);
    }

    // ── POST /api/policies/design/approve ─────────────────────────────────────
    // User approves the uploaded design → marks workflow as completed
    public function approveDesign(Request $request)
    {
        $workflow = $this->userWorkflow($request);

        abort_if($workflow->design_status !== 'uploaded', 422, 'التصميم غير جاهز للاعتماد بعد.');

        $workflow->update([
            'design_status'     => 'approved',
            'design_approved_at'=> now(),
            'status'            => 'completed',
            'completed_at'      => now(),
        ]);

        return response()->json(['workflow' => $workflow->fresh()->load(['consultant', 'user'])]);
    }

    // ── POST /api/policies/design/revision ────────────────────────────────────
    // User requests a design revision
    public function requestDesignRevision(Request $request)
    {
        $request->validate(['notes' => 'required|string|max:1000']);

        $workflow = $this->userWorkflow($request);

        abort_if($workflow->design_status !== 'uploaded', 422, 'لا يوجد تصميم لطلب تعديله.');

        $workflow->update([
            'design_status'         => 'revision_requested',
            'design_revision_notes' => $request->notes,
            'design_file'           => null,
            'design_uploaded_at'    => null,
        ]);

        return response()->json(['workflow' => $workflow->fresh()->load(['consultant', 'user'])]);
    }

    // ── GET /api/policies/workflow/pdf-link/{selectionId} ────────────────────
    public function getPdfLink(Request $request, int $selectionId)
    {
        $workflow  = $this->userWorkflow($request);
        PolicySelection::where('workflow_id', $workflow->id)->where('id', $selectionId)->firstOrFail();

        $url = URL::temporarySignedRoute(
            'pdf.policy',
            now()->addMinutes(10),
            ['user_id' => $request->user()->id, 'selection_id' => $selectionId, 'workflow_id' => $workflow->id]
        );

        return response()->json(['url' => $url]);
    }

    // ── GET /pdf/policy (signed, web route) ───────────────────────────────────
    public function downloadPDFSigned(Request $request)
    {
        if (!$request->hasValidSignature()) {
            abort(403, 'الرابط منتهي الصلاحية أو غير صالح.');
        }

        $userId      = (int) $request->user_id;
        $selectionId = (int) $request->selection_id;
        $workflowId  = (int) ($request->workflow_id ?? 0);

        $wfQuery = PolicyWorkflow::with(['user', 'consultant'])->where('user_id', $userId);
        $workflow = $workflowId
            ? $wfQuery->where('id', $workflowId)->firstOrFail()
            : $wfQuery->latest()->firstOrFail();

        $typeMap   = collect(self::policyTypes())->keyBy('id');
        $selection = PolicySelection::where('workflow_id', $workflow->id)
            ->where('id', $selectionId)
            ->firstOrFail();

        $policyType = $typeMap->get($selection->policy_type_id);

        return view('pdf.policy', compact('workflow', 'selection', 'policyType'));
    }

    // ── GET /api/policies/workflow/pdf/{selectionId} (direct mPDF) ────────────
    public function downloadPDF(Request $request, int $selectionId)
    {
        $userId     = $request->user()->id;
        $workflowId = (int) ($request->query('workflow_id') ?? 0);
        $wfQuery    = PolicyWorkflow::with(['user', 'consultant'])->where('user_id', $userId);
        $workflow   = $workflowId
            ? $wfQuery->where('id', $workflowId)->firstOrFail()
            : $wfQuery->latest()->firstOrFail();

        $typeMap    = collect(self::policyTypes())->keyBy('id');
        $selection  = PolicySelection::where('workflow_id', $workflow->id)
            ->where('id', $selectionId)
            ->firstOrFail();
        $policyType = $typeMap->get($selection->policy_type_id);

        $html = view('pdf.policy', compact('workflow', 'selection', 'policyType'))->render();

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
            $filename   = 'policy-' . $selection->policy_type_id . '-' . now()->format('Y-m-d') . '.pdf';
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

    // ── Private helpers ───────────────────────────────────────────────────────
    private function userWorkflow(Request $request): PolicyWorkflow
    {
        $uid = $request->user()->id;

        if ($request->filled('workflow_id')) {
            return PolicyWorkflow::where('id', (int) $request->workflow_id)
                ->where('user_id', $uid)
                ->firstOrFail();
        }

        return PolicyWorkflow::where('user_id', $uid)
            ->orderByRaw("(status = 'completed') DESC")
            ->orderByRaw("current_step DESC")
            ->orderBy('id', 'desc')
            ->firstOrFail();
    }
}
