<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user:id,rep_name,org_name,email,role')
            ->orderByDesc('created_at');

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('details', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($u) =>
                        $u->where('rep_name', 'like', "%{$search}%")
                          ->orWhere('org_name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                  );
            });
        }

        $logs = $query->limit(500)->get()->map(fn($l) => [
            'id'         => $l->id,
            'user_name'  => $this->userName($l),
            'role'       => $l->role,
            'action'     => $l->action,
            'category'   => $l->category,
            'details'    => $l->details,
            'ip'         => $l->ip,
            'time'       => $l->created_at->diffForHumans(),
            'created_at' => $l->created_at->format('Y/m/d H:i'),
        ]);

        return response()->json($logs);
    }

    private function userName(ActivityLog $l): string
    {
        if (!$l->user) return 'النظام';
        return $l->user->org_name ?: $l->user->rep_name ?: $l->user->email;
    }
}
