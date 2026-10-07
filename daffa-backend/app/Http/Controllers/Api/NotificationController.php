<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\NotificationLog;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /api/notifications
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn($n) => $this->format($n));

        return response()->json($notifications);
    }

    // GET /api/notifications/unread-count
    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    // POST /api/notifications/{id}/read
    public function markRead(Request $request, int $id)
    {
        $notif = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notif->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    // POST /api/notifications/read-all
    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    // ── Admin: POST /api/admin/notifications/send ─────────────────────────────
    public function adminSend(Request $request)
    {
        $request->validate([
            'target'  => 'required|in:all,clients,consultants,user',
            'user_id' => 'required_if:target,user|nullable|exists:users,id',
            'title'   => 'required|string|max:255',
            'body'    => 'nullable|string|max:2000',
        ]);

        $query = User::whereIn('role', ['client', 'consultant']);

        if ($request->target === 'clients')     $query->where('role', 'client');
        if ($request->target === 'consultants') $query->where('role', 'consultant');
        if ($request->target === 'user')        $query->where('id', $request->user_id);

        $userIds = $query->pluck('id');

        if ($userIds->isEmpty()) {
            return response()->json(['sent' => 0, 'message' => 'لا يوجد مستخدمون في هذه الفئة']);
        }

        $now  = now();
        $rows = $userIds->map(fn($uid) => [
            'user_id'    => $uid,
            'type'       => 'admin_message',
            'title'      => $request->title,
            'body'       => $request->body,
            'data'       => null,
            'read_at'    => null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        Notification::insert($rows);

        NotificationLog::create([
            'sent_by'         => $request->user()->id,
            'target_type'     => $request->target,
            'target_user_id'  => $request->target === 'user' ? $request->user_id : null,
            'title'           => $request->title,
            'body'            => $request->body,
            'recipient_count' => $userIds->count(),
        ]);

        ActivityLog::record($request->user()->id, 'إرسال إشعار جماعي', 'admin',
            $request->user()->role, 'الجمهور: ' . $request->target . ' — ' . $userIds->count() . ' مستخدم — "' . $request->title . '"');

        return response()->json(['sent' => $userIds->count()]);
    }

    // ── Admin: GET /api/admin/notifications/log ───────────────────────────────
    public function adminLog()
    {
        $TARGET_LABELS = [
            'all'         => 'جميع المستخدمين',
            'clients'     => 'العملاء فقط',
            'consultants' => 'المستشارين فقط',
            'user'        => 'مستخدم محدد',
        ];

        $logs = NotificationLog::with(['sender:id,rep_name,email', 'targetUser:id,rep_name,org_name,email'])
            ->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(fn($l) => [
                'id'              => $l->id,
                'title'           => $l->title,
                'body'            => $l->body,
                'target_type'     => $l->target_type,
                'target_label'    => $TARGET_LABELS[$l->target_type] ?? $l->target_type,
                'target_user'     => $l->targetUser
                    ? ($l->targetUser->org_name ?: $l->targetUser->rep_name ?: $l->targetUser->email)
                    : null,
                'recipient_count' => $l->recipient_count,
                'sent_by'         => $l->sender->rep_name ?: $l->sender->email,
                'time'            => $l->created_at->diffForHumans(),
                'created_at'      => $l->created_at->format('Y/m/d H:i'),
            ]);

        return response()->json($logs);
    }

    // ── Admin: GET /api/admin/notifications/users ─────────────────────────────
    public function adminUsers()
    {
        $users = User::whereIn('role', ['client', 'consultant'])
            ->orderBy('rep_name')
            ->get(['id', 'rep_name', 'org_name', 'org_type', 'sector', 'email', 'phone', 'role', 'is_active'])
            ->map(fn($u) => [
                'id'       => $u->id,
                'role'     => $u->role,
                'email'    => $u->email,
                'phone'    => $u->phone,
                'is_active'=> $u->is_active,
                'display_name' => $u->role === 'consultant'
                    ? ($u->rep_name ?: $u->email)
                    : ($u->org_name ?: $u->rep_name ?: $u->email),
                'rep_name' => $u->rep_name,
                'org_name' => $u->org_name,
                'org_type' => $u->org_type,
                'sector'   => $u->sector,
            ]);

        return response()->json($users);
    }

    private function format(Notification $n): array
    {
        return [
            'id'         => $n->id,
            'type'       => $n->type,
            'title'      => $n->title,
            'body'       => $n->body,
            'data'       => $n->data,
            'read'       => !is_null($n->read_at),
            'time'       => $n->created_at->diffForHumans(),
            'created_at' => $n->created_at->toISOString(),
        ];
    }
}
