<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Consultant;
use App\Models\OperationalWorkflow;
use App\Models\Order;
use App\Models\PolicyWorkflow;
use App\Models\StrategicWorkflow;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        // ── Counts ────────────────────────────────────────────────────────────
        $totalOrgs        = User::where('role', 'client')->count();
        $activeConsultants = Consultant::where('available', true)->count();

        // ── Revenue ───────────────────────────────────────────────────────────
        $totalRevenue = Order::where('payment_status', 'paid')->sum('total');

        // ── Workflows ─────────────────────────────────────────────────────────
        $stTotal  = StrategicWorkflow::count();
        $opTotal  = OperationalWorkflow::count();
        $polTotal = PolicyWorkflow::count();
        $allTotal = $stTotal + $opTotal + $polTotal;

        $stCompleted  = StrategicWorkflow::where('status', 'completed')->count();
        $opCompleted  = OperationalWorkflow::where('status', 'completed')->count();
        $polCompleted = PolicyWorkflow::where('status', 'completed')->count();
        $allCompleted = $stCompleted + $opCompleted + $polCompleted;

        $activeWorkflows = ($stTotal - $stCompleted) + ($opTotal - $opCompleted) + ($polTotal - $polCompleted);
        $completionRate  = $allTotal > 0 ? round($allCompleted / $allTotal * 100) : 0;

        // ── Monthly revenue (last 12 months) ──────────────────────────────────
        $monthly = Order::where('payment_status', 'paid')
            ->where('paid_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("DATE_FORMAT(paid_at, '%Y-%m') as month, SUM(total) as revenue")
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('revenue', 'month');

        // Fill all 12 months so the chart always has 12 bars
        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $key = now()->subMonths($i)->format('Y-m');
            $months[$key] = (float) ($monthly[$key] ?? 0);
        }

        // ── Service distribution (by order count) ─────────────────────────────
        $dist = Order::where('payment_status', 'paid')
            ->selectRaw('service_type, COUNT(*) as cnt')
            ->groupBy('service_type')
            ->pluck('cnt', 'service_type');

        $distTotal   = max($dist->sum(), 1);
        $strategic   = (int) ($dist['strategic']   ?? 0);
        $operational = (int) ($dist['operational'] ?? 0);
        $policy      = (int) ($dist['policies']    ?? $dist['policy'] ?? 0);

        // ── Recent activity (last 10 log entries) ─────────────────────────────
        $recentActivity = ActivityLog::with('user:id,rep_name,org_name,email,role')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($l) => [
                'id'         => $l->id,
                'action'     => $l->action,
                'category'   => $l->category,
                'role'       => $l->role,
                'details'    => $l->details,
                'time'       => $l->created_at->diffForHumans(),
                'created_at' => $l->created_at->format('Y/m/d H:i'),
                'user_name'  => $l->user
                    ? ($l->user->org_name ?: $l->user->rep_name ?: $l->user->email)
                    : '—',
            ]);

        return response()->json([
            'total_orgs'        => $totalOrgs,
            'active_consultants'=> $activeConsultants,
            'total_revenue'     => $totalRevenue,
            'active_workflows'  => $activeWorkflows,
            'total_completed'   => $allCompleted,
            'completion_rate'   => $completionRate,
            'monthly_revenue'   => $months,
            'service_dist'      => [
                'strategic'   => $strategic,
                'operational' => $operational,
                'policy'      => $policy,
                'total'       => $distTotal,
            ],
            'recent_activity'   => $recentActivity,
        ]);
    }
}
