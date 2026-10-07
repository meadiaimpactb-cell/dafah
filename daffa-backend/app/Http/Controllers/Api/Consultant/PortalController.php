<?php

namespace App\Http\Controllers\Api\Consultant;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\PolicyController;
use App\Models\ActivityLog;
use App\Models\Consultant;
use App\Models\Notification;
use App\Models\OperationalSubmission;
use App\Models\OperationalWorkflow;
use App\Models\PolicySelection;
use App\Models\PolicyWorkflow;
use App\Models\UnitSubmission;
use App\Models\StrategicWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortalController extends Controller
{
    private function consultant(Request $request): Consultant
    {
        return Consultant::where('user_id', $request->user()->id)->firstOrFail();
    }

    // GET /api/consultant/dashboard
    public function dashboard(Request $request)
    {
        $consultant = $this->consultant($request);

        $stIds  = StrategicWorkflow::where('consultant_id', $consultant->id)->pluck('id');
        $opIds  = OperationalWorkflow::where('consultant_id', $consultant->id)->pluck('id');
        $polIds = PolicyWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        // إجمالي العملاء النشطين عبر كل الخدمات
        $activeClients =
            StrategicWorkflow::where('consultant_id', $consultant->id)
                ->whereHas('user', fn($q) => $q->where('role', 'client'))
                ->whereIn('status', ['active', 'review'])->count()
            + OperationalWorkflow::where('consultant_id', $consultant->id)
                ->whereIn('status', ['active', 'review'])->count()
            + PolicyWorkflow::where('consultant_id', $consultant->id)
                ->whereIn('status', ['active'])->count();

        // إجمالي المراجعات المعلقة عبر كل الخدمات
        $pendingCount =
            UnitSubmission::whereIn('workflow_id', $stIds)->whereIn('status', ['submitted', 'reviewing'])->count()
            + OperationalSubmission::whereIn('workflow_id', $opIds)->whereIn('status', ['submitted', 'reviewing'])->count()
            + PolicySelection::whereIn('workflow_id', $polIds)->whereIn('status', ['submitted', 'reviewing'])->count();

        // إجمالي المراجعات المكتملة عبر كل الخدمات
        $completedCount =
            UnitSubmission::whereIn('workflow_id', $stIds)->where('status', 'approved')->count()
            + OperationalSubmission::whereIn('workflow_id', $opIds)->where('status', 'approved')->count()
            + PolicySelection::whereIn('workflow_id', $polIds)->where('status', 'approved')->count();

        // آخر 5 مراجعات معلقة (من الأنظمة الثلاثة مرتبة بالتاريخ)
        $stPending = UnitSubmission::with(['workflow.user', 'unit'])
            ->whereIn('workflow_id', $stIds)
            ->whereIn('status', ['submitted', 'reviewing'])
            ->orderBy('submitted_at')
            ->take(5)->get()
            ->map(fn($s) => $this->formatSubmission($s));

        $opPending = OperationalSubmission::with(['workflow.user', 'unit'])
            ->whereIn('workflow_id', $opIds)
            ->whereIn('status', ['submitted', 'reviewing'])
            ->orderBy('submitted_at')
            ->take(5)->get()
            ->map(fn($s) => $this->formatOpSubmission($s));

        $polPending = PolicySelection::with(['workflow.user'])
            ->whereIn('workflow_id', $polIds)
            ->whereIn('status', ['submitted', 'reviewing'])
            ->orderBy('submitted_at')
            ->take(5)->get()
            ->map(fn($s) => $this->formatPolSelection($s));

        $pending = $stPending->concat($opPending)->concat($polPending)
            ->sortBy('submitted_at')
            ->take(5)
            ->values();

        return response()->json([
            'consultant'      => $consultant,
            'active_clients'  => $activeClients,
            'pending_count'   => $pendingCount,
            'completed_count' => $completedCount,
            'pending_reviews' => $pending,
        ]);
    }

    // GET /api/consultant/clients
    // يجمع العملاء من الأنظمة الثلاثة: استراتيجي + تشغيلي + سياسات
    public function clients(Request $request)
    {
        $consultant = $this->consultant($request);
        $cid        = $consultant->id;

        // جلب جميع الـ workflows عبر الأنظمة الثلاثة
        $stWfs  = StrategicWorkflow::with(['user', 'submissions'])
            ->where('consultant_id', $cid)
            ->whereHas('user', fn($q) => $q->where('role', 'client'))
            ->get();

        $opWfs  = OperationalWorkflow::with(['user', 'submissions'])
            ->where('consultant_id', $cid)
            ->whereHas('user', fn($q) => $q->where('role', 'client'))
            ->get();

        $polWfs = PolicyWorkflow::with(['user', 'selections'])
            ->where('consultant_id', $cid)
            ->whereHas('user', fn($q) => $q->where('role', 'client'))
            ->get();

        // تجميع المستخدمين الفريدين عبر الأنظمة الثلاثة
        $allUsers = collect()
            ->merge($stWfs->pluck('user'))
            ->merge($opWfs->pluck('user'))
            ->merge($polWfs->pluck('user'))
            ->unique('id')
            ->values();

        // دالة مساعدة: تجمع بيانات كل الخطط (لا الأخيرة فقط)
        $aggregateService = function ($allWfs, string $itemsRelation) {
            if ($allWfs->isEmpty()) return null;

            // جمع كل الوحدات/الاستبيانات من جميع الخطط
            $allItems = $allWfs->flatMap(fn($wf) => $wf->{$itemsRelation});

            // الحالة = أول خطة نشطة، وإلا completed
            $activeWf   = $allWfs->filter(fn($wf) => $wf->status !== 'completed')->sortByDesc('id')->first();
            $latestWf   = $allWfs->sortByDesc('id')->first();
            $overallSts = $activeWf ? $activeWf->status : 'completed';

            return [
                'status'       => $overallSts,
                'total'        => $allItems->count(),
                'approved'     => $allItems->where('status', 'approved')->count(),
                'pending'      => $allItems->whereIn('status', ['submitted', 'reviewing'])->count(),
                'revision'     => $allItems->where('status', 'revision')->count(),
                'progress'     => $allItems->count() > 0
                    ? round(($allItems->where('status', 'approved')->count() / $allItems->count()) * 100)
                    : 0,
                'workflow_id'  => $latestWf->id,
                'started_at'   => $allWfs->min('started_at')?->format('Y-m-d'),
                'plans_count'  => $allWfs->count(),  // عدد الخطط الإجمالي
            ];
        };

        $clients = $allUsers->map(function ($user) use ($stWfs, $opWfs, $polWfs, $aggregateService) {
            $uid = $user->id;

            // استراتيجي — كل الخطط مجمّعة
            $stData  = $aggregateService($stWfs->where('user_id', $uid),  'submissions');

            // تشغيلي — كل الخطط مجمّعة
            $opData  = $aggregateService($opWfs->where('user_id', $uid),  'submissions');

            // سياسات — كل الخطط مجمّعة (selections وليس submissions)
            $polData = $aggregateService($polWfs->where('user_id', $uid), 'selections');

            $totalPending =
                ($stData['pending']  ?? 0) +
                ($opData['pending']  ?? 0) +
                ($polData['pending'] ?? 0);

            return [
                'user_id'       => $uid,
                'org_name'      => $user->org_name,
                'org_type'      => $user->org_type,
                'rep_name'      => $user->rep_name,
                'avatar'        => mb_substr($user->org_name ?? '؟', 0, 1),
                'strategic'     => $stData,
                'operational'   => $opData,
                'policies'      => $polData,
                'total_pending' => $totalPending,
            ];
        })
        ->sortByDesc('total_pending')   // العملاء ذوو المهام المعلقة أولاً
        ->values();

        return response()->json($clients);
    }

    // GET /api/consultant/reviews/pending
    public function pendingReviews(Request $request)
    {
        $consultant  = $this->consultant($request);
        $workflowIds = StrategicWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        // تشمل 'revision' حتى تبقى الوحدة مرئية للمستشار بانتظار تعديل العميل
        $submissions = UnitSubmission::with(['workflow.user', 'unit'])
            ->whereIn('workflow_id', $workflowIds)
            ->whereIn('status', ['submitted', 'reviewing', 'revision'])
            ->orderByRaw("FIELD(status, 'submitted', 'reviewing', 'revision')")
            ->orderBy('submitted_at')
            ->get()
            ->map(fn($s) => $this->formatSubmission($s));

        return response()->json($submissions);
    }

    // GET /api/consultant/reviews/completed
    public function completedReviews(Request $request)
    {
        $consultant  = $this->consultant($request);
        $workflowIds = StrategicWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $submissions = UnitSubmission::with(['workflow.user', 'unit'])
            ->whereIn('workflow_id', $workflowIds)
            ->where('status', 'approved')
            ->orderByDesc('reviewed_at')
            ->get()
            ->map(fn($s) => $this->formatSubmission($s));

        return response()->json($submissions);
    }

    // GET /api/consultant/submissions/{id}
    public function submission(Request $request, int $id)
    {
        $consultant  = $this->consultant($request);
        $workflowIds = StrategicWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $sub = UnitSubmission::with(['workflow.user', 'unit'])
            ->whereIn('workflow_id', $workflowIds)
            ->findOrFail($id);

        $sub->update(['status' => $sub->status === 'submitted' ? 'reviewing' : $sub->status]);

        return response()->json($this->formatSubmission($sub->fresh(['workflow.user', 'unit'])));
    }

    // POST /api/consultant/submissions/{id}/approve
    public function approve(Request $request, int $id)
    {
        $request->validate(['notes' => 'nullable|string|max:1000']);

        $consultant  = $this->consultant($request);
        $workflowIds = StrategicWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $sub = UnitSubmission::with('workflow.user', 'unit')->whereIn('workflow_id', $workflowIds)->findOrFail($id);
        $sub->update([
            'status'           => 'approved',
            'consultant_notes' => $request->notes,
            'reviewed_at'      => now(),
        ]);

        $userId   = $sub->workflow->user_id;
        $unitName = $sub->unit?->name ?? "الوحدة {$sub->unit_number}";
        Notification::notify($userId, 'unit_approved', "تم اعتماد {$unitName}", $request->notes ?: null);

        $this->checkWorkflowCompletion($sub->workflow_id);

        // If workflow just completed, send a completion notification
        $wf = StrategicWorkflow::find($sub->workflow_id);
        if ($wf && $wf->status === 'completed') {
            Notification::notify($userId, 'workflow_completed', 'تهانينا! اكتمل التخطيط الاستراتيجي', 'تم اعتماد جميع الوحدات الاستراتيجية من قِبَل المستشار.');
        }

        ActivityLog::record($request->user()->id, 'اعتماد وحدة — استراتيجي', 'review', 'consultant',
            $unitName . ' — ' . ($sub->workflow->user->org_name ?: $sub->workflow->user->email));

        return response()->json(['submission' => $this->formatSubmission($sub->fresh(['workflow.user', 'unit']))]);
    }

    // POST /api/consultant/submissions/{id}/revision
    public function requestRevision(Request $request, int $id)
    {
        $request->validate(['notes' => 'required|string|max:1000']);

        $consultant  = $this->consultant($request);
        $workflowIds = StrategicWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $sub = UnitSubmission::with('workflow.user', 'unit')->whereIn('workflow_id', $workflowIds)->findOrFail($id);
        $sub->update([
            'status'           => 'revision',
            'consultant_notes' => $request->notes,
            'reviewed_at'      => now(),
            'revision_count'   => $sub->revision_count + 1,
        ]);

        $unitName = $sub->unit?->name ?? "الوحدة {$sub->unit_number}";
        Notification::notify($sub->workflow->user_id, 'unit_revision', "طلب تعديل على {$unitName}", $request->notes);

        ActivityLog::record($request->user()->id, 'طلب تعديل — استراتيجي', 'review', 'consultant',
            $unitName . ' — ' . ($sub->workflow->user->org_name ?: $sub->workflow->user->email));

        return response()->json(['submission' => $this->formatSubmission($sub->fresh(['workflow.user', 'unit']))]);
    }

    // ── Operational Reviews ────────────────────────────────────────────────────

    // GET /api/consultant/operational/reviews/pending
    public function opPendingReviews(Request $request)
    {
        $consultant  = $this->consultant($request);
        $workflowIds = OperationalWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $submissions = OperationalSubmission::with(['workflow.user', 'unit'])
            ->whereIn('workflow_id', $workflowIds)
            ->whereIn('status', ['submitted', 'reviewing', 'revision'])
            ->orderByRaw("FIELD(status, 'submitted', 'reviewing', 'revision')")
            ->orderBy('submitted_at')
            ->get()
            ->map(fn($s) => $this->formatOpSubmission($s));

        return response()->json($submissions);
    }

    // GET /api/consultant/operational/reviews/completed
    public function opCompletedReviews(Request $request)
    {
        $consultant  = $this->consultant($request);
        $workflowIds = OperationalWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $submissions = OperationalSubmission::with(['workflow.user', 'unit'])
            ->whereIn('workflow_id', $workflowIds)
            ->where('status', 'approved')
            ->orderByDesc('reviewed_at')
            ->get()
            ->map(fn($s) => $this->formatOpSubmission($s));

        return response()->json($submissions);
    }

    // GET /api/consultant/operational/submissions/{id}
    public function opSubmission(Request $request, int $id)
    {
        $consultant  = $this->consultant($request);
        $workflowIds = OperationalWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $sub = OperationalSubmission::with(['workflow.user', 'unit'])
            ->whereIn('workflow_id', $workflowIds)
            ->findOrFail($id);

        $sub->update(['status' => $sub->status === 'submitted' ? 'reviewing' : $sub->status]);

        return response()->json($this->formatOpSubmission($sub->fresh(['workflow.user', 'unit'])));
    }

    // POST /api/consultant/operational/submissions/{id}/approve
    public function opApprove(Request $request, int $id)
    {
        $request->validate(['notes' => 'nullable|string|max:1000']);

        $consultant  = $this->consultant($request);
        $workflowIds = OperationalWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $sub = OperationalSubmission::with('workflow.user', 'unit')->whereIn('workflow_id', $workflowIds)->findOrFail($id);
        $sub->update([
            'status'           => 'approved',
            'consultant_notes' => $request->notes,
            'reviewed_at'      => now(),
        ]);

        $userId   = $sub->workflow->user_id;
        $unitName = $sub->unit?->name ?? "الوحدة {$sub->unit_number}";
        Notification::notify($userId, 'op_approved', "تم اعتماد {$unitName}", $request->notes ?: null);

        $this->checkOpWorkflowCompletion($sub->workflow_id);

        $wf = OperationalWorkflow::find($sub->workflow_id);
        if ($wf && $wf->status === 'completed') {
            Notification::notify($userId, 'op_workflow_completed', 'تهانينا! اكتمل التخطيط التشغيلي', 'تم اعتماد جميع الوحدات التشغيلية من قِبَل المستشار.');
        }

        ActivityLog::record($request->user()->id, 'اعتماد وحدة — تشغيلي', 'review', 'consultant',
            $unitName . ' — ' . ($sub->workflow->user->org_name ?: $sub->workflow->user->email));

        return response()->json(['submission' => $this->formatOpSubmission($sub->fresh(['workflow.user', 'unit']))]);
    }

    // POST /api/consultant/operational/submissions/{id}/revision
    public function opRequestRevision(Request $request, int $id)
    {
        $request->validate(['notes' => 'required|string|max:1000']);

        $consultant  = $this->consultant($request);
        $workflowIds = OperationalWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $sub = OperationalSubmission::with('workflow.user', 'unit')->whereIn('workflow_id', $workflowIds)->findOrFail($id);
        $sub->update([
            'status'           => 'revision',
            'consultant_notes' => $request->notes,
            'reviewed_at'      => now(),
            'revision_count'   => $sub->revision_count + 1,
        ]);

        $unitName = $sub->unit?->name ?? "الوحدة {$sub->unit_number}";
        Notification::notify($sub->workflow->user_id, 'op_revision', "طلب تعديل على {$unitName}", $request->notes);

        ActivityLog::record($request->user()->id, 'طلب تعديل — تشغيلي', 'review', 'consultant',
            $unitName . ' — ' . ($sub->workflow->user->org_name ?: $sub->workflow->user->email));

        return response()->json(['submission' => $this->formatOpSubmission($sub->fresh(['workflow.user', 'unit']))]);
    }

    // GET /api/consultant/me
    public function me(Request $request)
    {
        return response()->json($this->consultant($request)->load('user'));
    }

    // ── Policy Reviews ────────────────────────────────────────────────────────

    // GET /api/consultant/policies/reviews/pending
    public function polPendingReviews(Request $request)
    {
        $consultant  = $this->consultant($request);
        $workflowIds = PolicyWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $typeMap = collect(PolicyController::policyTypes())->keyBy('id');

        $selections = PolicySelection::with(['workflow.user'])
            ->whereIn('workflow_id', $workflowIds)
            ->whereIn('status', ['submitted', 'reviewing', 'revision'])
            ->orderByRaw("FIELD(status, 'submitted', 'reviewing', 'revision')")
            ->orderBy('submitted_at')
            ->get()
            ->map(fn($s) => $this->formatPolSelection($s, $typeMap));

        return response()->json($selections);
    }

    // GET /api/consultant/policies/reviews/completed
    public function polCompletedReviews(Request $request)
    {
        $consultant  = $this->consultant($request);
        $workflowIds = PolicyWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $typeMap = collect(PolicyController::policyTypes())->keyBy('id');

        $selections = PolicySelection::with(['workflow.user'])
            ->whereIn('workflow_id', $workflowIds)
            ->where('status', 'approved')
            ->orderByDesc('reviewed_at')
            ->get()
            ->map(fn($s) => $this->formatPolSelection($s, $typeMap));

        return response()->json($selections);
    }

    // GET /api/consultant/policies/selections/{id}
    public function polSelection(Request $request, int $id)
    {
        $consultant  = $this->consultant($request);
        $workflowIds = PolicyWorkflow::where('consultant_id', $consultant->id)->pluck('id');
        $typeMap     = collect(PolicyController::policyTypes())->keyBy('id');

        $sel = PolicySelection::with(['workflow.user'])
            ->whereIn('workflow_id', $workflowIds)
            ->findOrFail($id);

        $sel->update(['status' => $sel->status === 'submitted' ? 'reviewing' : $sel->status]);

        return response()->json($this->formatPolSelection($sel->fresh(['workflow.user']), $typeMap));
    }

    // POST /api/consultant/policies/selections/{id}/approve
    public function polApprove(Request $request, int $id)
    {
        $request->validate(['notes' => 'nullable|string|max:1000']);

        $consultant  = $this->consultant($request);
        $workflowIds = PolicyWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $typeMap = collect(PolicyController::policyTypes())->keyBy('id');
        $sel = PolicySelection::with('workflow.user')->whereIn('workflow_id', $workflowIds)->findOrFail($id);
        $sel->update([
            'status'           => 'approved',
            'consultant_notes' => $request->notes,
            'reviewed_at'      => now(),
        ]);

        $userId     = $sel->workflow->user_id;
        $policyName = $typeMap->get($sel->policy_type_id)['name'] ?? 'السياسة';
        Notification::notify($userId, 'policy_approved', "تم اعتماد {$policyName}", $request->notes ?: null);

        $this->checkPolWorkflowCompletion($sel->workflow_id);

        ActivityLog::record($request->user()->id, 'اعتماد سياسة', 'review', 'consultant',
            $policyName . ' — ' . ($sel->workflow->user->org_name ?: $sel->workflow->user->email));

        return response()->json(['selection' => $this->formatPolSelection($sel->fresh(['workflow.user']), $typeMap)]);
    }

    // POST /api/consultant/policies/selections/{id}/revision
    public function polRequestRevision(Request $request, int $id)
    {
        $request->validate(['notes' => 'required|string|max:1000']);

        $consultant  = $this->consultant($request);
        $workflowIds = PolicyWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        $typeMap = collect(PolicyController::policyTypes())->keyBy('id');
        $sel = PolicySelection::with('workflow.user')->whereIn('workflow_id', $workflowIds)->findOrFail($id);
        $sel->update([
            'status'           => 'revision',
            'consultant_notes' => $request->notes,
            'reviewed_at'      => now(),
            'revision_count'   => $sel->revision_count + 1,
        ]);

        $policyName = $typeMap->get($sel->policy_type_id)['name'] ?? 'السياسة';
        Notification::notify($sel->workflow->user_id, 'policy_revision', "طلب تعديل على {$policyName}", $request->notes);

        ActivityLog::record($request->user()->id, 'طلب تعديل — سياسة', 'review', 'consultant',
            $policyName . ' — ' . ($sel->workflow->user->org_name ?: $sel->workflow->user->email));

        return response()->json(['selection' => $this->formatPolSelection($sel->fresh(['workflow.user']), $typeMap)]);
    }

    private function formatOpSubmission(OperationalSubmission $s): array
    {
        $daysPending = $s->submitted_at
            ? now()->diffInDays($s->submitted_at)
            : null;

        return [
            'id'               => $s->id,
            'workflow_id'      => $s->workflow_id,
            'unit_number'      => $s->unit_number,
            'unit_name'        => $s->unit?->name,
            'unit_template'    => $s->unit?->template_type,
            'status'           => $s->status,
            'form_data'        => $s->form_data,
            'consultant_notes' => $s->consultant_notes,
            'revision_count'   => $s->revision_count,
            'submitted_at'     => $s->submitted_at?->diffForHumans(),
            'reviewed_at'      => $s->reviewed_at?->diffForHumans(),
            'days_pending'     => $daysPending,
            'is_late'          => $daysPending >= 3,
            'user_id'          => $s->workflow?->user?->id,
            'org_name'         => $s->workflow?->user?->org_name,
            'org_type'         => $s->workflow?->user?->org_type,
            'avatar'           => mb_substr($s->workflow?->user?->org_name ?? '?', 0, 1),
            'service_type'     => 'operational',
        ];
    }

    private function checkOpWorkflowCompletion(int $workflowId): void
    {
        $allApproved = OperationalSubmission::where('workflow_id', $workflowId)
            ->where('status', '!=', 'approved')
            ->doesntExist();

        if ($allApproved) {
            OperationalWorkflow::find($workflowId)?->update([
                'current_step' => 5,
                'status'       => 'completed',
                'completed_at' => now(),
            ]);
        }
    }

    private function formatSubmission(UnitSubmission $s): array
    {
        $daysPending = $s->submitted_at
            ? now()->diffInDays($s->submitted_at)
            : null;

        return [
            'id'              => $s->id,
            'workflow_id'     => $s->workflow_id,
            'unit_number'     => $s->unit_number,
            'unit_name'       => $s->unit?->name,
            'unit_template'   => $s->unit?->template_type,
            'status'          => $s->status,
            'form_data'       => $s->form_data,
            'consultant_notes'=> $s->consultant_notes,
            'revision_count'  => $s->revision_count,
            'submitted_at'    => $s->submitted_at?->diffForHumans(),
            'reviewed_at'     => $s->reviewed_at?->diffForHumans(),
            'days_pending'    => $daysPending,
            'is_late'         => $daysPending >= 3,
            'user_id'         => $s->workflow?->user?->id,
            'org_name'        => $s->workflow?->user?->org_name,
            'org_type'        => $s->workflow?->user?->org_type,
            'avatar'          => mb_substr($s->workflow?->user?->org_name ?? '?', 0, 1),
            'service_type'    => 'strategic',
        ];
    }

    private function formatPolSelection(PolicySelection $s, $typeMap): array
    {
        $daysPending = $s->submitted_at ? now()->diffInDays($s->submitted_at) : null;
        return [
            'id'               => $s->id,
            'workflow_id'      => $s->workflow_id,
            'policy_type_id'   => $s->policy_type_id,
            'policy_name'      => $typeMap->get($s->policy_type_id)['name'] ?? '',
            'policy_icon'      => $typeMap->get($s->policy_type_id)['icon'] ?? '',
            'status'           => $s->status,
            'form_data'        => $s->form_data,
            'consultant_notes' => $s->consultant_notes,
            'revision_count'   => $s->revision_count,
            'submitted_at'     => $s->submitted_at?->diffForHumans(),
            'reviewed_at'      => $s->reviewed_at?->diffForHumans(),
            'days_pending'     => $daysPending,
            'is_late'          => $daysPending >= 3,
            'user_id'          => $s->workflow?->user?->id,
            'org_name'         => $s->workflow?->user?->org_name,
            'org_type'         => $s->workflow?->user?->org_type,
            'avatar'           => mb_substr($s->workflow?->user?->org_name ?? '?', 0, 1),
            'service_type'     => 'policy',
        ];
    }

    private function checkPolWorkflowCompletion(int $workflowId): void
    {
        $allApproved = PolicySelection::where('workflow_id', $workflowId)
            ->where('status', '!=', 'approved')
            ->doesntExist();

        if ($allApproved) {
            $workflow = PolicyWorkflow::find($workflowId);
            if (!$workflow || $workflow->status === 'completed') return;

            $workflow->update([
                'current_step' => 5,
                'status'       => 'completed',
                'completed_at' => now(),
            ]);

            Notification::notify(
                $workflow->user_id,
                'pol_all_approved',
                'تمت مراجعة جميع السياسات',
                'تم اعتماد جميع سياساتك من قِبَل المستشار. يمكنك الآن المتابعة للخطوة التالية.'
            );
        }
    }

    private function checkWorkflowCompletion(int $workflowId): void
    {
        $allApproved = UnitSubmission::where('workflow_id', $workflowId)
            ->where('status', '!=', 'approved')
            ->doesntExist();

        if ($allApproved) {
            StrategicWorkflow::find($workflowId)?->update([
                'current_step' => 5,
                'status'       => 'completed',
                'completed_at' => now(),
            ]);
        }
    }

    // ── GET /api/consultant/policies/designs ──────────────────────────────────
    // List workflows that need design work (pending or revision_requested)
    public function designRequests(Request $request)
    {
        $consultant = $this->consultant($request);

        $workflows = PolicyWorkflow::with(['user'])
            ->where('consultant_id', $consultant->id)
            ->where('status', 'design_in_progress')
            ->orderByRaw("FIELD(design_status, 'revision_requested', 'pending', 'uploaded')")
            ->get()
            ->map(fn($w) => $this->formatDesignWorkflow($w));

        return response()->json(['workflows' => $workflows]);
    }

    // ── POST /api/consultant/policies/designs/{id}/upload ─────────────────────
    // Consultant uploads the design file for a workflow
    public function uploadDesign(Request $request, int $workflowId)
    {
        $request->validate([
            'design_file' => 'required|file|mimes:pdf,jpg,jpeg,png,zip|max:20480',
        ]);

        $consultant = $this->consultant($request);

        $workflow = PolicyWorkflow::where('consultant_id', $consultant->id)
            ->where('status', 'design_in_progress')
            ->findOrFail($workflowId);

        // Delete old file if exists
        if ($workflow->design_file && Storage::disk('public')->exists($workflow->design_file)) {
            Storage::disk('public')->delete($workflow->design_file);
        }

        $path = $request->file('design_file')->store('designs', 'public');

        $workflow->update([
            'design_status'      => 'uploaded',
            'design_file'        => $path,
            'design_uploaded_at' => now(),
            'design_revision_notes' => null,
        ]);

        return response()->json(['workflow' => $this->formatDesignWorkflow($workflow->fresh('user'))]);
    }

    // GET /api/consultant/stats
    public function stats(Request $request)
    {
        $consultant = $this->consultant($request);

        $stIds  = StrategicWorkflow::where('consultant_id', $consultant->id)->pluck('id');
        $opIds  = OperationalWorkflow::where('consultant_id', $consultant->id)->pluck('id');
        $polIds = PolicyWorkflow::where('consultant_id', $consultant->id)->pluck('id');

        // إجمالي العملاء الفريدين عبر كل الخدمات
        $allClients = collect()
            ->merge(StrategicWorkflow::where('consultant_id', $consultant->id)->pluck('user_id'))
            ->merge(OperationalWorkflow::where('consultant_id', $consultant->id)->pluck('user_id'))
            ->merge(PolicyWorkflow::where('consultant_id', $consultant->id)->pluck('user_id'))
            ->unique()->count();

        // المراجعات المكتملة لكل خدمة
        $stDone  = UnitSubmission::whereIn('workflow_id', $stIds)->where('status', 'approved')->count();
        $opDone  = OperationalSubmission::whereIn('workflow_id', $opIds)->where('status', 'approved')->count();
        $polDone = PolicySelection::whereIn('workflow_id', $polIds)->where('status', 'approved')->count();

        // متوسط وقت المراجعة بالساعات (استراتيجي)
        $avgHours = UnitSubmission::whereIn('workflow_id', $stIds)
            ->where('status', 'approved')
            ->whereNotNull('reviewed_at')->whereNotNull('submitted_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, submitted_at, reviewed_at)) as avg_h')
            ->value('avg_h');

        // مراجعات شهرية (آخر 12 شهر) — تشمل كل الخدمات
        $since = now()->subMonths(11)->startOfMonth();
        $fetchMonthly = fn($query) => $query
            ->where('status', 'approved')
            ->where('reviewed_at', '>=', $since)
            ->selectRaw("DATE_FORMAT(reviewed_at,'%Y-%m') as month, COUNT(*) as cnt")
            ->groupBy('month')->pluck('cnt', 'month');

        $mSt  = $fetchMonthly(UnitSubmission::whereIn('workflow_id', $stIds));
        $mOp  = $fetchMonthly(OperationalSubmission::whereIn('workflow_id', $opIds));
        $mPol = $fetchMonthly(PolicySelection::whereIn('workflow_id', $polIds));

        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $key = now()->subMonths($i)->format('Y-m');
            $months[$key] = (int) ($mSt[$key] ?? 0) + (int) ($mOp[$key] ?? 0) + (int) ($mPol[$key] ?? 0);
        }

        return response()->json([
            'rating'           => (float) $consultant->rating,
            'total_clients'    => $allClients,
            'total_completed'  => $stDone + $opDone + $polDone,
            'avg_review_hours' => $avgHours ? round($avgHours, 1) : 0,
            'by_service'       => ['strategic' => $stDone, 'operational' => $opDone, 'policy' => $polDone],
            'monthly_reviews'  => $months,
        ]);
    }

    // GET /api/consultant/earnings
    public function earnings(Request $request)
    {
        $consultant = $this->consultant($request);

        $serviceLabel = [
            'strategic'   => 'التخطيط الاستراتيجي',
            'operational' => 'التخطيط التشغيلي',
            'policies'    => 'السياسات واللوائح',
        ];

        $orders = \App\Models\Order::with('user')
            ->where('consultant_id', $consultant->id)
            ->where('payment_status', 'paid')
            ->orderByDesc('paid_at')
            ->get()
            ->map(fn($o) => [
                'id'               => $o->id,
                'order_number'     => $o->order_number,
                'service_type'     => $o->service_type,
                'service_label'    => $serviceLabel[$o->service_type] ?? $o->service_type,
                'org_name'         => $o->user?->org_name ?: $o->user?->rep_name,
                'total'            => (float) $o->total,
                'subtotal'         => (float) $o->subtotal,
                'consultant_share' => (float) $o->consultant_share,
                'date'             => ($o->paid_at ?? $o->created_at)->format('Y-m-d'),
            ]);

        $totalEarnings    = $orders->sum('consultant_share');
        $commissionRate   = (float) \App\Models\ServiceSetting::val('consultant_commission_rate', 80);
        $platformRate     = 100 - $commissionRate;

        // أرباح شهرية (آخر 12 شهر)
        $monthly = [];
        for ($i = 11; $i >= 0; $i--) {
            $key = now()->subMonths($i)->format('Y-m');
            $monthly[$key] = round($orders->filter(fn($o) =>
                str_starts_with($o['date'], $key)
            )->sum('consultant_share'), 2);
        }

        return response()->json([
            'total_earnings'   => round($totalEarnings, 2),
            'commission_rate'  => $commissionRate,
            'platform_rate'    => $platformRate,
            'orders_count'     => $orders->count(),
            'orders'           => $orders,
            'monthly'          => $monthly,
        ]);
    }

    private function formatDesignWorkflow(PolicyWorkflow $w): array
    {
        return [
            'id'                    => $w->id,
            'org_name'              => $w->user?->org_name,
            'org_type'              => $w->user?->org_type,
            'avatar'                => mb_substr($w->user?->org_name ?? '?', 0, 1),
            'design_status'         => $w->design_status,
            'design_file'           => $w->design_file ? url('storage/' . $w->design_file) : null,
            'design_fee'            => $w->design_fee,
            'design_paid_at'        => $w->design_paid_at?->diffForHumans(),
            'design_uploaded_at'    => $w->design_uploaded_at?->diffForHumans(),
            'design_revision_notes' => $w->design_revision_notes,
        ];
    }
}
