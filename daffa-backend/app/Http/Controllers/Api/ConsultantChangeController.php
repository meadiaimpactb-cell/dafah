<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Consultant;
use App\Models\ConsultantChangeRequest;
use App\Models\Notification;
use App\Models\User;
use App\Support\ConsultantAssignment as CA;
use Illuminate\Http\Request;

/**
 * العميل: عرض مستشاري خططه، وتقديم طلب مسبَّب لتغيير مستشار خطة جارية، ومتابعة القرار، وإلغاء طلبه قبل البتّ فيه.
 */
class ConsultantChangeController extends Controller
{
    // GET /api/consultant-changes
    public function index(Request $request)
    {
        $uid = $request->user()->id;
        $plans = [];
        foreach (CA::SYSTEMS as $system => $cfg) {
            $rows = ($cfg['model'])::with('consultant')->where('user_id', $uid)->orderBy('id')->get();
            foreach ($rows as $i => $wf) {
                [$ok, $why] = CA::clientEligibility($system, $wf);
                $plans[] = [
                    'system' => $system,
                    'workflow_id' => $wf->id,
                    'label' => $cfg['label'].' #'.($i + 1),
                    'ref' => CA::planRef($system, $wf),
                    'status' => $wf->status,
                    'closed' => CA::isClosed($system, $wf),
                    'paid' => CA::isPaid($wf),
                    'consultant' => $wf->consultant ? self::consultantCard($wf->consultant) : null,
                    'can_request' => $ok,
                    'blocked_reason' => $why,
                    'created_at' => optional($wf->created_at)->toDateString(),
                ];
            }
        }

        $requests = ConsultantChangeRequest::with(['fromConsultant', 'toConsultant', 'requestedConsultant'])
            ->where('user_id', $uid)->latest()->get()
            ->map(fn ($r) => self::format($r));

        return response()->json([
            'plans' => array_reverse($plans),
            'requests' => $requests,
            'reasons' => ConsultantChangeRequest::REASONS,
            'consultants' => Consultant::where('available', true)->orderByDesc('rating')->get()->map(fn ($c) => self::consultantCard($c)),
        ]);
    }

    // POST /api/consultant-changes
    public function store(Request $request)
    {
        $data = $request->validate([
            'system' => 'required|in:strategic,operational,policies',
            'workflow_id' => 'required|integer',
            'reason_category' => 'required|in:'.implode(',', array_keys(ConsultantChangeRequest::REASONS)),
            'reason' => 'required|string|min:15|max:2000',
            'preferred_consultant_id' => 'nullable|integer|exists:consultants,id',
        ], [
            'reason.required' => 'اكتب سبب الطلب حتى تتمكن الإدارة من دراسته.',
            'reason.min' => 'وضّح السبب في جملة أو جملتين على الأقل (15 حرفًا فأكثر).',
            'reason_category.required' => 'اختر سبب الطلب.',
        ]);
        $user = $request->user();

        $wf = CA::workflow($data['system'], (int) $data['workflow_id']);
        abort_unless($wf->user_id === $user->id, 404);
        [$ok, $why] = CA::clientEligibility($data['system'], $wf);
        if (! $ok) {
            return response()->json(['message' => $why], 422);
        }
        if (! empty($data['preferred_consultant_id'])) {
            $pref = Consultant::find($data['preferred_consultant_id']);
            if ((int) $pref->id === (int) $wf->consultant_id) {
                return response()->json(['message' => 'المستشار المفضّل هو مستشارك الحالي — اختر مستشارًا آخر أو اترك الاختيار للإدارة.'], 422);
            }
            if (! $pref->available) {
                return response()->json(['message' => 'المستشار المفضّل غير متاح حاليًا.'], 422);
            }
        }

        $req = ConsultantChangeRequest::create([
            'user_id' => $user->id,
            'system' => $data['system'],
            'workflow_id' => $wf->id,
            'from_consultant_id' => $wf->consultant_id,
            'requested_consultant_id' => $data['preferred_consultant_id'] ?? null,
            'source' => 'client',
            'reason_category' => $data['reason_category'],
            'reason' => trim($data['reason']),
            'status' => 'pending',
            'snapshot' => CA::snapshot($data['system'], $wf),
        ]);

        $label = CA::planLabel($data['system'], $wf);
        $org = $user->org_name ?: $user->rep_name;
        foreach (User::where('role', 'admin')->where('is_active', true)->pluck('id') as $adminId) {
            Notification::notify($adminId, 'consultant_change_request', "طلب تغيير مستشار — {$org}",
                "{$label}: ".ConsultantChangeRequest::REASONS[$data['reason_category']], ['request_id' => $req->id]);
        }
        ActivityLog::record($user->id, 'طلب تغيير مستشار', 'consultant', 'client', "{$label} — ".ConsultantChangeRequest::REASONS[$data['reason_category']]);

        return response()->json(['request' => self::format($req->fresh(['fromConsultant', 'toConsultant', 'requestedConsultant']))], 201);
    }

    // POST /api/consultant-changes/{id}/cancel
    public function cancel(Request $request, int $id)
    {
        $req = ConsultantChangeRequest::where('user_id', $request->user()->id)->findOrFail($id);
        if ($req->status !== 'pending') {
            return response()->json(['message' => 'لا يمكن إلغاء طلب بُتّ فيه.'], 422);
        }
        $req->update(['status' => 'cancelled', 'decided_at' => now()]);
        ActivityLog::record($request->user()->id, 'إلغاء طلب تغيير مستشار', 'consultant', 'client', 'طلب #'.$req->id);

        return response()->json(['request' => self::format($req->fresh(['fromConsultant', 'toConsultant', 'requestedConsultant']))]);
    }

    public static function consultantCard(Consultant $c): array
    {
        return [
            'id' => $c->id, 'name' => $c->name, 'specialty' => $c->specialty, 'rating' => (float) $c->rating,
            'experience_years' => $c->experience_years, 'avatar' => $c->avatar, 'avatar_initial' => $c->avatar_initial, 'available' => (bool) $c->available,
        ];
    }

    /** صيغة الطلب كما يراها العميل (دون الملاحظة الداخلية) */
    public static function format(ConsultantChangeRequest $r, bool $forAdmin = false): array
    {
        $wf = null;
        try {
            $wf = CA::workflow($r->system, $r->workflow_id);
        } catch (\Throwable) {
        }
        $out = [
            'id' => $r->id,
            'system' => $r->system,
            'workflow_id' => $r->workflow_id,
            'plan_label' => $wf ? CA::planLabel($r->system, $wf) : CA::SYSTEMS[$r->system]['label'],
            'plan_ref' => CA::SYSTEMS[$r->system]['ref'].'-'.$r->workflow_id,
            'source' => $r->source,
            'reason_category' => $r->reason_category,
            'reason_label' => (ConsultantChangeRequest::REASONS + ConsultantChangeRequest::ADMIN_REASONS)[$r->reason_category] ?? $r->reason_category,
            'reason' => $r->reason,
            'status' => $r->status,
            'admin_note' => $r->admin_note,
            'from' => $r->fromConsultant ? ['id' => $r->fromConsultant->id, 'name' => $r->fromConsultant->name] : null,
            'requested' => $r->requestedConsultant ? ['id' => $r->requestedConsultant->id, 'name' => $r->requestedConsultant->name] : null,
            'to' => $r->toConsultant ? ['id' => $r->toConsultant->id, 'name' => $r->toConsultant->name] : null,
            'created_at' => optional($r->created_at)->toDateTimeString(),
            'decided_at' => optional($r->decided_at)->toDateTimeString(),
        ];
        if ($forAdmin) {
            $out += [
                'internal_note' => $r->internal_note,
                'earnings_transferred' => $r->earnings_transferred,
                'snapshot' => $r->snapshot,
                'decided_by' => $r->decider?->rep_name ?: $r->decider?->email,
                'org' => ['id' => $r->user?->id, 'name' => $r->user?->org_name ?: $r->user?->rep_name, 'email' => $r->user?->email, 'phone' => $r->user?->phone],
                'plan' => $wf ? [
                    'status' => $wf->status,
                    'closed' => CA::isClosed($r->system, $wf),
                    'paid' => CA::isPaid($wf),
                    'current_consultant' => $wf->consultant ? ['id' => $wf->consultant->id, 'name' => $wf->consultant->name] : null,
                    'live' => CA::snapshot($r->system, $wf),
                    'earnings' => CA::earnings($r->system, $wf),
                ] : null,
            ];
        }

        return $out;
    }
}
