<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Consultant;
use App\Models\Order;
use App\Models\User;
use App\Models\StrategicWorkflow;
use App\Models\OperationalWorkflow;
use App\Models\PolicyWorkflow;
use App\Models\UnitSubmission;
use App\Models\OperationalSubmission;
use App\Models\PolicySelection;

class ReportsController extends Controller
{
    public function index()
    {
        // ── Completion Rates ─────────────────────────────────────────────────
        $totalSt  = StrategicWorkflow::count();
        $totalOp  = OperationalWorkflow::count();
        $totalPol = PolicyWorkflow::count();
        $totalWf  = $totalSt + $totalOp + $totalPol;

        $completedSt  = StrategicWorkflow::where('status', 'completed')->count();
        $completedOp  = OperationalWorkflow::where('status', 'completed')->count();
        $completedPol = PolicyWorkflow::where('status', 'completed')->count();
        $completedWf  = $completedSt + $completedOp + $completedPol;

        $completionRate = $totalWf > 0 ? round($completedWf / $totalWf * 100) : 0;

        // ── Avg Completion Days ───────────────────────────────────────────────
        $avgDaySt = StrategicWorkflow::where('status', 'completed')
            ->whereNotNull('started_at')->whereNotNull('completed_at')
            ->selectRaw('AVG(DATEDIFF(completed_at, started_at)) as d')->value('d') ?? 0;
        $avgDayOp = OperationalWorkflow::where('status', 'completed')
            ->whereNotNull('started_at')->whereNotNull('completed_at')
            ->selectRaw('AVG(DATEDIFF(completed_at, started_at)) as d')->value('d') ?? 0;
        $avgDays = ($avgDaySt + $avgDayOp) > 0
            ? round(($avgDaySt + $avgDayOp) / max(($avgDaySt > 0 ? 1 : 0) + ($avgDayOp > 0 ? 1 : 0), 1))
            : null;

        // ── Revenue & Rating ─────────────────────────────────────────────────
        $totalRevenue = (float) Order::where('payment_status', 'paid')->sum('total');
        $avgRating    = round((float)(Consultant::where('available', true)->avg('rating') ?? 0), 1);

        // ── Monthly Registrations (last 12 months) ───────────────────────────
        $regRaw = User::where('role', 'client')
            ->where('created_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at,'%Y-%m') as m, COUNT(*) as cnt")
            ->groupBy('m')->orderBy('m')
            ->pluck('cnt', 'm');

        // ── Monthly Revenue (last 12 months, in thousands) ───────────────────
        $revRaw = Order::where('payment_status', 'paid')
            ->where('paid_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("DATE_FORMAT(paid_at,'%Y-%m') as m, SUM(total) as rev")
            ->groupBy('m')->orderBy('m')
            ->pluck('rev', 'm');

        $monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                       'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
        $monthlyOrgs = [];
        $monthlyRev  = [];
        for ($i = 11; $i >= 0; $i--) {
            $dt  = now()->subMonths($i);
            $key = $dt->format('Y-m');
            $lbl = $monthNames[$dt->month - 1];
            $monthlyOrgs[] = ['label' => $lbl, 'value' => (int)($regRaw[$key]  ?? 0)];
            $monthlyRev[]  = ['label' => $lbl, 'value' => round((float)($revRaw[$key] ?? 0) / 1000, 1)];
        }

        // ── Service Distribution ─────────────────────────────────────────────
        $dist = Order::where('payment_status', 'paid')
            ->selectRaw('service_type, COUNT(*) as cnt')
            ->groupBy('service_type')->pluck('cnt', 'service_type');
        $distTotal  = $dist->sum();
        $distSt     = (int)($dist['strategic']   ?? 0);
        $distOp     = (int)($dist['operational'] ?? 0);
        $distPol    = (int)($dist['policies']    ?? 0);

        $serviceDist = [
            ['label' => 'استراتيجي', 'value' => $distSt,  'color' => '#1A6B7C'],
            ['label' => 'تشغيلي',    'value' => $distOp,  'color' => '#E8713A'],
            ['label' => 'سياسات',    'value' => $distPol, 'color' => '#F1C40F'],
        ];

        $completionByService = [
            ['label' => 'استراتيجي', 'value' => $totalSt  > 0 ? round($completedSt  / $totalSt  * 100) : 0],
            ['label' => 'تشغيلي',    'value' => $totalOp  > 0 ? round($completedOp  / $totalOp  * 100) : 0],
            ['label' => 'سياسات',    'value' => $totalPol > 0 ? round($completedPol / $totalPol * 100) : 0],
        ];

        // ── Org Progress Table (most recent active workflows) ─────────────────
        $orgProgress = [];

        foreach (StrategicWorkflow::with('user')
            ->whereIn('status', ['active', 'completed'])
            ->orderByDesc('updated_at')->limit(6)->get() as $wf) {
            $approved = UnitSubmission::where('workflow_id', $wf->id)->where('status', 'approved')->count();
            $orgProgress[] = [
                'org'      => $wf->user?->org_name ?: ($wf->user?->rep_name ?: '—'),
                'service'  => 'استراتيجي',
                'progress' => round($approved / 5 * 100),
                'step'     => "وحدة {$approved} / 5",
                'days'     => $wf->started_at ? now()->diffInDays($wf->started_at) : 0,
                'status'   => $wf->status,
            ];
        }
        foreach (OperationalWorkflow::with('user')
            ->whereIn('status', ['active', 'completed'])
            ->orderByDesc('updated_at')->limit(4)->get() as $wf) {
            $approved = OperationalSubmission::where('workflow_id', $wf->id)->where('status', 'approved')->count();
            $orgProgress[] = [
                'org'      => $wf->user?->org_name ?: ($wf->user?->rep_name ?: '—'),
                'service'  => 'تشغيلي',
                'progress' => round($approved / 5 * 100),
                'step'     => "وحدة {$approved} / 5",
                'days'     => $wf->started_at ? now()->diffInDays($wf->started_at) : 0,
                'status'   => $wf->status,
            ];
        }
        foreach (PolicyWorkflow::with('user')
            ->whereIn('status', ['active', 'completed'])
            ->orderByDesc('updated_at')->limit(4)->get() as $wf) {
            $approved  = PolicySelection::where('workflow_id', $wf->id)->where('status', 'approved')->count();
            $total     = PolicySelection::where('workflow_id', $wf->id)->count() ?: 1;
            $orgProgress[] = [
                'org'      => $wf->user?->org_name ?: ($wf->user?->rep_name ?: '—'),
                'service'  => 'سياسات',
                'progress' => round($approved / $total * 100),
                'step'     => "سياسة {$approved} / {$total}",
                'days'     => $wf->started_at ? now()->diffInDays($wf->started_at) : 0,
                'status'   => $wf->status,
            ];
        }

        // Sort: longest active first (may need most attention)
        usort($orgProgress, fn($a, $b) => $b['days'] - $a['days']);
        $orgProgress = array_values(array_slice($orgProgress, 0, 10));

        // ── Consultant Performance ────────────────────────────────────────────
        $consultants = Consultant::where('available', true)->orderByDesc('rating')->get()
            ->map(function ($c) {
                $stIds  = StrategicWorkflow::where('consultant_id', $c->id)->pluck('id');
                $opIds  = OperationalWorkflow::where('consultant_id', $c->id)->pluck('id');
                $polIds = PolicyWorkflow::where('consultant_id', $c->id)->pluck('id');

                // Avg review hours
                $stH  = UnitSubmission::whereIn('workflow_id', $stIds)->where('status', 'approved')
                    ->whereNotNull('submitted_at')->whereNotNull('reviewed_at')
                    ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, submitted_at, reviewed_at)) as h')->value('h');
                $opH  = OperationalSubmission::whereIn('workflow_id', $opIds)->where('status', 'approved')
                    ->whereNotNull('submitted_at')->whereNotNull('reviewed_at')
                    ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, submitted_at, reviewed_at)) as h')->value('h');
                $polH = PolicySelection::whereIn('workflow_id', $polIds)->where('status', 'approved')
                    ->whereNotNull('submitted_at')->whereNotNull('reviewed_at')
                    ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, submitted_at, reviewed_at)) as h')->value('h');

                $vals    = array_filter([$stH, $opH, $polH], fn($v) => $v !== null);
                $avgHours = count($vals) > 0 ? round(array_sum($vals) / count($vals)) : null;

                // Reviews count
                $reviews = UnitSubmission::whereIn('workflow_id', $stIds)->where('status', 'approved')->count()
                    + OperationalSubmission::whereIn('workflow_id', $opIds)->where('status', 'approved')->count()
                    + PolicySelection::whereIn('workflow_id', $polIds)->where('status', 'approved')->count();

                return [
                    'name'      => $c->name,
                    'rating'    => $c->rating,
                    'reviews'   => $reviews,
                    'avg_hours' => $avgHours,
                ];
            });

        // ── Overall Approval Stats ────────────────────────────────────────────
        $allSubs = UnitSubmission::whereIn('status', ['approved', 'revision'])->count()
                 + OperationalSubmission::whereIn('status', ['approved', 'revision'])->count()
                 + PolicySelection::whereIn('status', ['approved', 'revision'])->count();
        $firstTime = UnitSubmission::where('status', 'approved')->where('revision_count', 0)->count()
                   + OperationalSubmission::where('status', 'approved')->where('revision_count', 0)->count()
                   + PolicySelection::where('status', 'approved')->where('revision_count', 0)->count();
        $afterRevision = UnitSubmission::where('status', 'approved')->where('revision_count', '>', 0)->count()
                       + OperationalSubmission::where('status', 'approved')->where('revision_count', '>', 0)->count()
                       + PolicySelection::where('status', 'approved')->where('revision_count', '>', 0)->count();
        $inRevision = UnitSubmission::where('status', 'revision')->count()
                    + OperationalSubmission::where('status', 'revision')->count()
                    + PolicySelection::where('status', 'revision')->count();

        $approvalStats = $allSubs > 0 ? [
            'first_time'     => round($firstTime      / $allSubs * 100),
            'after_revision' => round($afterRevision  / $allSubs * 100),
            'revision'       => round($inRevision     / $allSubs * 100),
        ] : ['first_time' => 0, 'after_revision' => 0, 'revision' => 0];

        return response()->json([
            'metrics' => [
                'completion_rate' => $completionRate,
                'avg_days'        => $avgDays,
                'avg_rating'      => $avgRating,
                'total_revenue'   => $totalRevenue,
            ],
            'monthly_orgs'          => $monthlyOrgs,
            'monthly_revenue'       => $monthlyRev,
            'service_dist'          => $serviceDist,
            'service_dist_total'    => (int) $distTotal,
            'completion_by_service' => $completionByService,
            'org_progress'          => $orgProgress,
            'consultants'           => $consultants,
            'approval_stats'        => $approvalStats,
        ]);
    }
}
