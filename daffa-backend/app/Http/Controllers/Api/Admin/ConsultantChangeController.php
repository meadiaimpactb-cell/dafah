<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ConsultantChangeController as ClientCC;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Consultant;
use App\Models\ConsultantChangeRequest;
use App\Models\Notification;
use App\Support\ConsultantAssignment as CA;
use Illuminate\Http\Request;

/**
 * المشرف: دراسة طلبات تغيير المستشار والبتّ فيها، والتغيير المباشر لأي خطة جارية، وسجل كل خطة.
 */
class ConsultantChangeController extends Controller
{
    private const WITH = ['user', 'fromConsultant', 'toConsultant', 'requestedConsultant', 'decider'];

    // GET /admin/consultant-changes?status=pending|approved|rejected|cancelled|all
    public function index(Request $request)
    {
        $status = $request->query('status', 'pending');
        $rows = ConsultantChangeRequest::with(self::WITH)
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->orderByRaw("FIELD(status, 'pending') DESC")->latest()->limit(300)->get();

        $counts = ConsultantChangeRequest::selectRaw('status, COUNT(*) c')->groupBy('status')->pluck('c', 'status');

        return response()->json([
            'data' => $rows->map(fn ($r) => ClientCC::format($r, true))->values(),
            'counts' => [
                'pending' => (int) ($counts['pending'] ?? 0), 'approved' => (int) ($counts['approved'] ?? 0),
                'rejected' => (int) ($counts['rejected'] ?? 0), 'cancelled' => (int) ($counts['cancelled'] ?? 0),
            ],
            'reasons' => ConsultantChangeRequest::REASONS,
            'admin_reasons' => ConsultantChangeRequest::ADMIN_REASONS,
        ]);
    }

    // GET /admin/consultant-changes/pending-count
    public function pendingCount()
    {
        return response()->json(['count' => ConsultantChangeRequest::where('status', 'pending')->count()]);
    }

    // GET /admin/consultant-changes/plan/{system}/{id} — حال الخطة وسجل تغييراتها قبل التغيير المباشر
    public function plan(string $system, int $id)
    {
        $wf = CA::workflow($system, $id);
        [$ok, $why] = CA::adminEligibility($system, $wf);

        return response()->json([
            'plan_label' => CA::planLabel($system, $wf),
            'plan_ref' => CA::planRef($system, $wf),
            'org' => $wf->user?->org_name ?: $wf->user?->rep_name,
            'paid' => CA::isPaid($wf),
            'consultant' => $wf->consultant ? ClientCC::consultantCard($wf->consultant) : null,
            'can_change' => $ok,
            'blocked_reason' => $why,
            'snapshot' => CA::snapshot($system, $wf),
            'earnings' => CA::earnings($system, $wf),
            'pending_request' => ($p = ConsultantChangeRequest::with(self::WITH)->where('system', $system)->where('workflow_id', $id)->where('status', 'pending')->first()) ? ClientCC::format($p, true) : null,
            'history' => ConsultantChangeRequest::with(self::WITH)->where('system', $system)->where('workflow_id', $id)->latest()->get()->map(fn ($r) => ClientCC::format($r, true)),
            'admin_reasons' => ConsultantChangeRequest::ADMIN_REASONS,
        ]);
    }

    // POST /admin/consultant-changes/{id}/approve
    public function approve(Request $request, int $id)
    {
        $data = $request->validate([
            'consultant_id' => 'required|integer|exists:consultants,id',
            'transfer_earnings' => 'required|boolean',
            'admin_note' => 'nullable|string|max:1000',
            'internal_note' => 'nullable|string|max:2000',
        ], ['consultant_id.required' => 'اختر المستشار الجديد.']);

        $req = ConsultantChangeRequest::with(self::WITH)->findOrFail($id);
        if ($req->status !== 'pending') {
            return response()->json(['message' => 'بُتّ في هذا الطلب مسبقًا.'], 422);
        }
        $wf = CA::workflow($req->system, $req->workflow_id);
        [$ok, $why] = CA::adminEligibility($req->system, $wf);
        if (! $ok) {
            return response()->json(['message' => $why], 422);
        }
        $to = Consultant::findOrFail($data['consultant_id']);
        if ((int) $to->id === (int) $wf->consultant_id) {
            return response()->json(['message' => 'اختر مستشارًا غير المستشار الحالي للخطة.'], 422);
        }

        CA::reassign($req->system, $wf, $to, (bool) $data['transfer_earnings'], $request->user(), $data['admin_note'] ?? null);
        $req->update([
            'status' => 'approved', 'to_consultant_id' => $to->id, 'earnings_transferred' => (bool) $data['transfer_earnings'],
            'admin_note' => $data['admin_note'] ?? null, 'internal_note' => $data['internal_note'] ?? null,
            'decided_by' => $request->user()->id, 'decided_at' => now(),
        ]);

        return response()->json(['request' => ClientCC::format($req->fresh(self::WITH), true)]);
    }

    // POST /admin/consultant-changes/{id}/reject
    public function reject(Request $request, int $id)
    {
        $data = $request->validate([
            'admin_note' => 'required|string|min:5|max:1000',
            'internal_note' => 'nullable|string|max:2000',
        ], ['admin_note.required' => 'اكتب للعميل سبب عدم اعتماد الطلب.', 'admin_note.min' => 'وضّح السبب للعميل.']);

        $req = ConsultantChangeRequest::with(self::WITH)->findOrFail($id);
        if ($req->status !== 'pending') {
            return response()->json(['message' => 'بُتّ في هذا الطلب مسبقًا.'], 422);
        }
        $req->update(['status' => 'rejected', 'admin_note' => $data['admin_note'], 'internal_note' => $data['internal_note'] ?? null,
            'decided_by' => $request->user()->id, 'decided_at' => now()]);

        $wf = CA::workflow($req->system, $req->workflow_id);
        $label = CA::planLabel($req->system, $wf);
        Notification::notify($req->user_id, 'consultant_change', "لم يُعتمد طلب تغيير مستشار {$label}", $data['admin_note'],
            ['system' => $req->system, 'workflow_id' => $req->workflow_id]);
        ActivityLog::record($request->user()->id, 'رفض طلب تغيير مستشار', 'consultant', 'admin', "{$label} — {$data['admin_note']}");

        return response()->json(['request' => ClientCC::format($req->fresh(self::WITH), true)]);
    }

    // POST /admin/consultant-changes/direct — تغيير مباشر من المشرف
    public function direct(Request $request)
    {
        $data = $request->validate([
            'system' => 'required|in:strategic,operational,policies',
            'workflow_id' => 'required|integer',
            'consultant_id' => 'required|integer|exists:consultants,id',
            'reason_category' => 'required|in:'.implode(',', array_keys(ConsultantChangeRequest::ADMIN_REASONS)),
            'reason' => 'required|string|min:5|max:2000',
            'transfer_earnings' => 'required|boolean',
            'admin_note' => 'nullable|string|max:1000',
        ], ['reason.required' => 'سجّل سبب التغيير (للسجل الداخلي).', 'consultant_id.required' => 'اختر المستشار الجديد.']);

        $wf = CA::workflow($data['system'], (int) $data['workflow_id']);
        [$ok, $why] = CA::adminEligibility($data['system'], $wf);
        if (! $ok) {
            return response()->json(['message' => $why], 422);
        }
        $to = Consultant::findOrFail($data['consultant_id']);
        if ((int) $to->id === (int) $wf->consultant_id) {
            return response()->json(['message' => 'اختر مستشارًا غير المستشار الحالي للخطة.'], 422);
        }

        // طلب العميل المعلّق لهذه الخطة (إن وُجد) يُغلق بهذا القرار
        $pending = ConsultantChangeRequest::where('system', $data['system'])->where('workflow_id', $wf->id)->where('status', 'pending')->first();
        $snapshot = CA::snapshot($data['system'], $wf);
        $from = $wf->consultant_id;
        CA::reassign($data['system'], $wf, $to, (bool) $data['transfer_earnings'], $request->user(), $data['admin_note'] ?? null);

        $common = ['to_consultant_id' => $to->id, 'earnings_transferred' => (bool) $data['transfer_earnings'], 'admin_note' => $data['admin_note'] ?? null,
            'decided_by' => $request->user()->id, 'decided_at' => now(), 'status' => 'approved'];
        if ($pending) {
            $pending->update($common + ['internal_note' => $data['reason']]);
            $rec = $pending;
        } else {
            $rec = ConsultantChangeRequest::create($common + [
                'user_id' => $wf->user_id, 'system' => $data['system'], 'workflow_id' => $wf->id, 'from_consultant_id' => $from,
                'source' => 'admin', 'reason_category' => $data['reason_category'], 'reason' => trim($data['reason']), 'snapshot' => $snapshot,
            ]);
        }

        return response()->json(['request' => ClientCC::format($rec->fresh(self::WITH), true)], 201);
    }
}
