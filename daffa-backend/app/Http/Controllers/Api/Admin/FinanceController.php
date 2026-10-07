<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Consultant;
use App\Models\Order;
use App\Models\StrategicWorkflow;
use App\Models\OperationalWorkflow;
use App\Models\PolicyWorkflow;
use App\Models\UnitSubmission;
use App\Models\OperationalSubmission;
use App\Models\PolicySelection;

class FinanceController extends Controller
{
    public function index()
    {
        $serviceLabel = [
            'strategic'   => 'استراتيجي',
            'operational' => 'تشغيلي',
            'policies'    => 'سياسات',
        ];

        // ── Totals ────────────────────────────────────────────────────────────
        $totalRevenue   = Order::where('payment_status', 'paid')->sum('total');
        $monthRevenue   = Order::where('payment_status', 'paid')
            ->where('paid_at', '>=', now()->startOfMonth())->sum('total');
        $pendingRevenue = Order::where('payment_status', 'pending')->sum('total');

        // ── Recent transactions (last 20 paid orders) ─────────────────────────
        $transactions = Order::with('user:id,org_name,rep_name,email')
            ->where('payment_status', 'paid')
            ->orderByDesc('paid_at')
            ->limit(20)
            ->get()
            ->map(fn($o) => [
                'id'           => $o->id,
                'order_number' => $o->order_number,
                'org_name'     => $o->user?->org_name ?: $o->user?->rep_name ?: $o->user?->email,
                'service'      => $serviceLabel[$o->service_type] ?? $o->service_type,
                'total'        => $o->total,
                'date'         => $o->paid_at?->format('Y/m/d') ?? '—',
            ]);

        // ── Monthly revenue chart (last 12 months) ────────────────────────────
        $monthly = Order::where('payment_status', 'paid')
            ->where('paid_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("DATE_FORMAT(paid_at,'%Y-%m') as month, SUM(total) as rev")
            ->groupBy('month')->orderBy('month')
            ->pluck('rev', 'month');

        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $key = now()->subMonths($i)->format('Y-m');
            $months[$key] = (float) ($monthly[$key] ?? 0);
        }

        // ── Consultant payables (reviews completed, no financial payout model yet) ─
        $consultants = Consultant::where('available', true)
            ->orderBy('name')
            ->get()
            ->map(function ($c) {
                $stIds  = StrategicWorkflow::where('consultant_id', $c->id)->pluck('id');
                $opIds  = OperationalWorkflow::where('consultant_id', $c->id)->pluck('id');
                $polIds = PolicyWorkflow::where('consultant_id', $c->id)->pluck('id');

                $reviews = UnitSubmission::whereIn('workflow_id', $stIds)->where('status', 'approved')->count()
                    + OperationalSubmission::whereIn('workflow_id', $opIds)->where('status', 'approved')->count()
                    + PolicySelection::whereIn('workflow_id', $polIds)->where('status', 'approved')->count();

                return [
                    'id'      => $c->id,
                    'name'    => $c->name,
                    'rating'  => $c->rating,
                    'reviews' => $reviews,
                ];
            });

        return response()->json([
            'total_revenue'   => (float) $totalRevenue,
            'month_revenue'   => (float) $monthRevenue,
            'pending_revenue' => (float) $pendingRevenue,
            'transactions'    => $transactions,
            'monthly_chart'   => $months,
            'consultants'     => $consultants,
        ]);
    }
}
