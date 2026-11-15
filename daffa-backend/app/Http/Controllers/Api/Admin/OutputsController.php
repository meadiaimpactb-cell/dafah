<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Controller;
use App\Models\Consultant;
use App\Models\ConsultantReview;
use App\Models\OperationalSubmission;
use App\Models\OperationalUnit;
use App\Models\OperationalWorkflow;
use App\Models\PolicySelection;
use App\Models\PolicyWorkflow;
use App\Models\StrategicUnit;
use App\Models\StrategicWorkflow;
use App\Models\UnitSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\URL;

/**
 * مركز المخرجات — يتيح للأدمن الاطلاع على مخرجات كل العملاء في الأنظمة الثلاثة
 * (الاستراتيجي، التشغيلي، السياسات) وعلى قرارات المستشارين وملاحظاتهم.
 * قراءة فقط: لا يغيّر أي بيانات.
 */
class OutputsController extends Controller
{
    private const SYSTEMS = ['strategic', 'operational', 'policies'];

    // ── GET /admin/outputs ─────────────────────────────────────────────────
    public function index(Request $request)
    {
        $system       = $request->query('system');
        $status       = $request->query('status');
        $consultantId = $request->query('consultant_id');
        $q            = trim((string) $request->query('q', ''));

        $rows = collect();
        foreach (self::SYSTEMS as $sys) {
            if ($system && $system !== $sys) {
                continue;
            }
            $rows = $rows->concat($this->rowsFor($sys));
        }

        if ($consultantId) {
            $rows = $rows->where('consultant_id', (int) $consultantId);
        }
        if ($status) {
            $rows = $rows->filter(fn ($r) => match ($status) {
                'needs_review' => $r['pending_review'] > 0,
                'revision'     => $r['in_revision'] > 0,
                'completed'    => $r['status'] === 'completed',
                'active'       => $r['status'] !== 'completed' && $r['paid'],
                'unpaid'       => !$r['paid'],
                default        => true,
            });
        }
        if ($q !== '') {
            $rows = $rows->filter(fn ($r) => str_contains(mb_strtolower($r['org_name'] . ' ' . $r['email'] . ' ' . $r['consultant_name']), mb_strtolower($q)));
        }

        $rows = $rows->sortByDesc('updated_ts')->values();

        return response()->json([
            'data'    => $rows->map(fn ($r) => collect($r)->except('updated_ts'))->values(),
            'summary' => $this->summary(),
        ]);
    }

    // ── GET /admin/outputs/{system}/{id} ───────────────────────────────────
    public function show(string $system, int $id)
    {
        abort_unless(in_array($system, self::SYSTEMS, true), 404);

        if ($system === 'strategic') {
            $wf    = StrategicWorkflow::with(['user', 'consultant', 'submissions'])->findOrFail($id);
            $units = StrategicUnit::orderBy('unit_number')->get();
            $subs  = $wf->submissions->keyBy('unit_number');
            $items = $units->map(fn ($u) => $this->item($u->unit_number, $u->name, $u->template_type, $subs->get($u->unit_number)));
            $pdf   = $this->signed('pdf.strategic', $wf);
        } elseif ($system === 'operational') {
            $wf    = OperationalWorkflow::with(['user', 'consultant', 'submissions'])->findOrFail($id);
            $units = OperationalUnit::orderBy('unit_number')->get();
            $subs  = $wf->submissions->keyBy('unit_number');
            $items = $units->map(fn ($u) => $this->item($u->unit_number, $u->name, $u->template_type, $subs->get($u->unit_number)));
            $pdf   = $this->signed('pdf.operational', $wf);
        } else {
            $wf    = PolicyWorkflow::with(['user', 'consultant', 'selections'])->findOrFail($id);
            $names = $this->policyNames();
            $items = $wf->selections->sortBy('id')->values()->map(function ($s, $i) use ($names, $wf) {
                $item = $this->item($i + 1, $names[$s->policy_type_id] ?? ('سياسة #' . $s->policy_type_id), 'policy', $s);
                $item['pdf_url'] = $s->status === 'approved'
                    ? URL::temporarySignedRoute('pdf.policy', now()->addMinutes(30), ['user_id' => $wf->user_id, 'selection_id' => $s->id, 'workflow_id' => $wf->id])
                    : null;
                return $item;
            });
            $pdf = null;
        }

        $hasContent = $items->contains(fn ($i) => !empty($i['form_data']));

        return response()->json([
            'system'      => $system,
            'id'          => $wf->id,
            'status'      => $wf->status,
            'current_step'=> $wf->current_step,
            'paid'        => $this->isPaid($wf),
            'payment_method' => $wf->payment_method,
            'total'       => (float) $wf->total,
            'created_at'  => optional($wf->created_at)->toDateString(),
            'completed_at'=> optional($wf->completed_at ?? null)->toDateString(),
            'org'         => [
                'id'       => $wf->user?->id,
                'name'     => $wf->user?->org_name ?: $wf->user?->rep_name,
                'rep_name' => $wf->user?->rep_name,
                'email'    => $wf->user?->email,
                'phone'    => $wf->user?->phone,
                'org_type' => $wf->user?->org_type,
                'sector'   => $wf->user?->sector,
            ],
            'consultant'  => $wf->consultant ? ['id' => $wf->consultant->id, 'name' => $wf->consultant->name, 'specialty' => $wf->consultant->specialty] : null,
            'items'       => $items->values(),
            'pdf_url'     => $hasContent ? $pdf : null,
        ]);
    }

    // ── GET /admin/outputs/consultants ─────────────────────────────────────
    public function consultants()
    {
        $consultants = Consultant::orderBy('name')->get();
        $all = collect(self::SYSTEMS)->flatMap(fn ($s) => $this->rowsFor($s));

        $data = $consultants->map(function ($c) use ($all) {
            $mine = $all->where('consultant_id', $c->id);
            $decisions = $this->decisions($c->id, 400);
            $approved  = $decisions->where('decision', 'approved')->count();
            $revisions = $decisions->where('decision', 'revision')->count();
            $hours     = $decisions->pluck('response_hours')->filter(fn ($h) => $h !== null);
            $ratings   = ConsultantReview::where('consultant_id', $c->id)->pluck('rating');

            return [
                'id'                 => $c->id,
                'name'               => $c->name,
                'specialty'          => $c->specialty,
                'available'          => (bool) $c->available,
                'clients'            => $mine->pluck('user_id')->unique()->count(),
                'active_projects'    => $mine->where('status', '!=', 'completed')->count(),
                'pending_review'     => $mine->sum('pending_review'),
                'approved'           => $approved,
                'revisions'          => $revisions,
                'avg_response_hours' => $hours->count() ? round($hours->avg(), 1) : null,
                'rating'             => $ratings->count() ? round($ratings->avg(), 1) : (float) $c->rating,
                'ratings_count'      => $ratings->count(),
            ];
        });

        return response()->json(['data' => $data->values()]);
    }

    // ── GET /admin/outputs/consultants/{consultant}/reviews ────────────────
    public function consultantReviews(int $consultant)
    {
        $c = Consultant::findOrFail($consultant);
        return response()->json([
            'consultant' => ['id' => $c->id, 'name' => $c->name, 'specialty' => $c->specialty],
            'data'       => $this->decisions($c->id, 100)->values(),
            'ratings'    => ConsultantReview::with('user:id,org_name,rep_name')->where('consultant_id', $c->id)->latest()->take(20)->get()->map(fn ($r) => [
                'rating'  => $r->rating,
                'comment' => $r->comment,
                'org'     => $r->user?->org_name ?: $r->user?->rep_name,
                'system'  => $r->workflow_type,
                'date'    => optional($r->created_at)->toDateString(),
            ]),
        ]);
    }

    // ───────────────────────────────────────────────────────────────────────

    private function rowsFor(string $system): Collection
    {
        if ($system === 'strategic') {
            $total = max(1, StrategicUnit::count());
            return StrategicWorkflow::with(['user:id,org_name,rep_name,email', 'consultant:id,name', 'submissions:id,workflow_id,status,updated_at'])
                ->get()->map(fn ($w) => $this->row('strategic', $w, $w->submissions, $total));
        }
        if ($system === 'operational') {
            $total = max(1, OperationalUnit::count());
            return OperationalWorkflow::with(['user:id,org_name,rep_name,email', 'consultant:id,name', 'submissions:id,workflow_id,status,updated_at'])
                ->get()->map(fn ($w) => $this->row('operational', $w, $w->submissions, $total));
        }
        return PolicyWorkflow::with(['user:id,org_name,rep_name,email', 'consultant:id,name', 'selections:id,workflow_id,status,updated_at'])
            ->get()->map(function ($w) {
                $total = max(1, count((array) ($w->selected_policies ?? [])) ?: $w->selections->count());
                return $this->row('policies', $w, $w->selections, $total);
            });
    }

    private function row(string $system, $w, Collection $items, int $total): array
    {
        $approved = $items->where('status', 'approved')->count();
        $last = collect([$w->updated_at, $items->max('updated_at')])->filter()->max();
        return [
            'key'             => $system . '-' . $w->id,
            'system'          => $system,
            'id'              => $w->id,
            'user_id'         => $w->user_id,
            'org_name'        => $w->user?->org_name ?: ($w->user?->rep_name ?: '—'),
            'email'           => $w->user?->email ?? '',
            'consultant_id'   => $w->consultant_id,
            'consultant_name' => $w->consultant?->name ?? '',
            'status'          => $w->status,
            'current_step'    => $w->current_step,
            'paid'            => $this->isPaid($w),
            'total_items'     => $total,
            'approved'        => $approved,
            'pending_review'  => $items->whereIn('status', ['submitted', 'reviewing'])->count(),
            'in_revision'     => $items->where('status', 'revision')->count(),
            'progress'        => $w->status === 'completed' ? 100 : (int) round($approved / $total * 100),
            'updated_at'      => $last ? Carbon::parse($last)->diffForHumans() : '',
            'updated_ts'      => $last ? Carbon::parse($last)->timestamp : 0,
        ];
    }

    private function item(int $number, string $name, ?string $type, $sub): array
    {
        $data = $sub?->form_data;
        if (is_string($data)) {
            $data = json_decode($data, true);
        }
        return [
            'number'           => $number,
            'name'             => $name,
            'template_type'    => $type,
            'status'           => $sub?->status ?? 'not_started',
            'form_data'        => $data ?: null,
            'consultant_notes' => $sub?->consultant_notes,
            'revision_count'   => (int) ($sub?->revision_count ?? 0),
            'submitted_at'     => optional($sub?->submitted_at)->toDateTimeString(),
            'reviewed_at'      => optional($sub?->reviewed_at)->toDateTimeString(),
        ];
    }

    /** قرارات المستشار (اعتماد/طلب تعديل) عبر الأنظمة الثلاثة */
    private function decisions(int $consultantId, int $limit): Collection
    {
        $names = $this->policyNames();
        $sUnits = StrategicUnit::pluck('name', 'unit_number');
        $oUnits = OperationalUnit::pluck('name', 'unit_number');

        $map = function ($s, string $system, string $name, $wf) {
            $resp = ($s->submitted_at && $s->reviewed_at) ? round($s->submitted_at->diffInMinutes($s->reviewed_at) / 60, 1) : null;
            return [
                'system'         => $system,
                'workflow_id'    => $wf?->id,
                'org_name'       => $wf?->user?->org_name ?: ($wf?->user?->rep_name ?: '—'),
                'item'           => $name,
                'decision'       => $s->status === 'approved' ? 'approved' : ($s->status === 'revision' ? 'revision' : $s->status),
                'notes'          => $s->consultant_notes,
                'revision_count' => (int) $s->revision_count,
                'reviewed_at'    => optional($s->reviewed_at)->toDateTimeString(),
                'reviewed_human' => optional($s->reviewed_at)->diffForHumans(),
                'response_hours' => $resp !== null ? abs($resp) : null,
                'ts'             => optional($s->reviewed_at)->timestamp ?? 0,
            ];
        };

        $st = UnitSubmission::with('workflow.user:id,org_name,rep_name')
            ->whereHas('workflow', fn ($q) => $q->where('consultant_id', $consultantId))
            ->whereNotNull('reviewed_at')->whereIn('status', ['approved', 'revision'])->latest('reviewed_at')->take($limit)->get()
            ->map(fn ($s) => $map($s, 'strategic', $sUnits[$s->unit_number] ?? ('وحدة ' . $s->unit_number), $s->workflow));
        $op = OperationalSubmission::with('workflow.user:id,org_name,rep_name')
            ->whereHas('workflow', fn ($q) => $q->where('consultant_id', $consultantId))
            ->whereNotNull('reviewed_at')->whereIn('status', ['approved', 'revision'])->latest('reviewed_at')->take($limit)->get()
            ->map(fn ($s) => $map($s, 'operational', $oUnits[$s->unit_number] ?? ('وحدة ' . $s->unit_number), $s->workflow));
        $po = PolicySelection::with('workflow.user:id,org_name,rep_name')
            ->whereHas('workflow', fn ($q) => $q->where('consultant_id', $consultantId))
            ->whereNotNull('reviewed_at')->whereIn('status', ['approved', 'revision'])->latest('reviewed_at')->take($limit)->get()
            ->map(fn ($s) => $map($s, 'policies', $names[$s->policy_type_id] ?? 'سياسة', $s->workflow));

        return $st->concat($op)->concat($po)->sortByDesc('ts')->take($limit)
            ->map(fn ($r) => collect($r)->except('ts')->all())->values();
    }

    private function summary(): array
    {
        $count = fn ($model, $status) => $model::whereIn('status', (array) $status)->count();
        return [
            'strategic'   => ['workflows' => StrategicWorkflow::count(),   'completed' => StrategicWorkflow::where('status', 'completed')->count()],
            'operational' => ['workflows' => OperationalWorkflow::count(), 'completed' => OperationalWorkflow::where('status', 'completed')->count()],
            'policies'    => ['workflows' => PolicyWorkflow::count(),      'completed' => PolicyWorkflow::where('status', 'completed')->count()],
            'pending_review' => $count(UnitSubmission::class, ['submitted', 'reviewing']) + $count(OperationalSubmission::class, ['submitted', 'reviewing']) + $count(PolicySelection::class, ['submitted', 'reviewing']),
            'in_revision'    => $count(UnitSubmission::class, 'revision') + $count(OperationalSubmission::class, 'revision') + $count(PolicySelection::class, 'revision'),
            'approved_items' => $count(UnitSubmission::class, 'approved') + $count(OperationalSubmission::class, 'approved') + $count(PolicySelection::class, 'approved'),
        ];
    }

    private function policyNames(): array
    {
        return collect(PolicyController::policyTypes())->mapWithKeys(fn ($t) => [$t['id'] => $t['name']])->all();
    }

    private function isPaid($w): bool
    {
        return in_array($w->payment_status, ['paid', 'completed', 'confirmed'], true) || !empty($w->paid_at);
    }

    private function signed(string $route, $wf): string
    {
        return URL::temporarySignedRoute($route, now()->addMinutes(30), ['user_id' => $wf->user_id, 'workflow_id' => $wf->id]);
    }
}
