<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Consultant;
use App\Models\StrategicWorkflow;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/chat/conversations
    // ─────────────────────────────────────────────────────────────────────────
    public function conversations(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'consultant') {
            // جلب المحادثات الخاصة بهذا المستشار مع عملائه
            $conversations = Conversation::with(['client'])
                ->where('consultant_user_id', $user->id)
                ->orderByDesc('last_at')
                ->get()
                ->map(fn($c) => $this->formatConversation($c, $user->id));

        } elseif ($user->role === 'admin') {
            // المدير يرى جميع المحادثات
            $conversations = Conversation::with(['client', 'consultantUser'])
                ->orderByDesc('last_at')
                ->get()
                ->map(fn($c) => $this->formatConversation($c, $user->id));

        } else {
            // العميل يرى محادثاته مع مستشاريه
            $conversations = Conversation::with(['consultantUser'])
                ->where('client_id', $user->id)
                ->orderByDesc('last_at')
                ->get()
                ->map(fn($c) => $this->formatConversation($c, $user->id));
        }

        return response()->json($conversations);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/chat/conversations/{id}/messages
    // ─────────────────────────────────────────────────────────────────────────
    public function messages(Request $request, int $id)
    {
        $user = $request->user();
        $conv = $this->findConversation($id, $user->id);

        $messages = Message::with('sender')
            ->where('conversation_id', $id)
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => $this->formatMessage($m, $user->id));

        // تعليم الرسائل الواردة كمقروءة
        Message::where('conversation_id', $id)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // تعليم إشعارات الرسائل كمقروءة عند فتح المحادثة
        Notification::where('user_id', $user->id)
            ->where('type', 'message')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json($messages);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/chat/conversations/{id}/messages
    // ─────────────────────────────────────────────────────────────────────────
    public function send(Request $request, int $id)
    {
        $request->validate(['body' => 'required|string|max:2000']);
        $user = $request->user();
        $conv = $this->findConversation($id, $user->id);

        $message = Message::create([
            'conversation_id' => $id,
            'sender_id'       => $user->id,
            'body'            => $request->body,
        ]);

        $conv->update([
            'last_message' => mb_substr($request->body, 0, 100),
            'last_at'      => now(),
        ]);

        // Notify the other party
        $recipientId = ($conv->client_id === $user->id) ? $conv->consultant_user_id : $conv->client_id;
        $senderName  = $user->org_name ?? $user->rep_name ?? $user->email;
        Notification::notify($recipientId, 'message', "رسالة جديدة من {$senderName}", mb_substr($request->body, 0, 80));

        return response()->json($this->formatMessage($message->load('sender'), $user->id), 201);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/chat/conversations/start
    // ── يُنشئ محادثة جديدة أو يُرجع الموجودة بين عميل ومستشار
    // ─────────────────────────────────────────────────────────────────────────
    public function start(Request $request)
    {
        $user = $request->user();

        // العميل يبدأ محادثة مع مستشاره تلقائياً من خلال الـ workflow
        if ($user->role !== 'consultant' && $user->role !== 'admin') {
            $workflow = StrategicWorkflow::with('consultant')
                ->where('user_id', $user->id)
                ->whereNotNull('consultant_id')
                ->latest()
                ->first();

            if (!$workflow || !$workflow->consultant?->user_id) {
                return response()->json(['message' => 'لم يتم تعيين مستشار لك بعد'], 422);
            }

            $consultantUserId = $workflow->consultant->user_id;

            $conv = Conversation::firstOrCreate(
                ['client_id' => $user->id, 'consultant_user_id' => $consultantUserId],
                ['last_at' => now()]
            );

            return response()->json(['conversation_id' => $conv->id]);
        }

        return response()->json(['message' => 'غير مسموح'], 403);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/chat/unread
    // ─────────────────────────────────────────────────────────────────────────
    public function unread(Request $request)
    {
        $user   = $request->user();
        $convIds = Conversation::where('client_id', $user->id)
            ->orWhere('consultant_user_id', $user->id)
            ->pluck('id');

        $count = Message::whereIn('conversation_id', $convIds)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private function findConversation(int $id, int $userId): Conversation
    {
        return Conversation::where(function ($q) use ($userId) {
            $q->where('client_id', $userId)
              ->orWhere('consultant_user_id', $userId);
        })->findOrFail($id);
    }

    private function formatConversation(Conversation $c, int $myId): array
    {
        $isClient = $c->client_id === $myId;
        $other    = $isClient ? $c->consultantUser : $c->client;

        $unread = Message::where('conversation_id', $c->id)
            ->where('sender_id', '!=', $myId)
            ->whereNull('read_at')
            ->count();

        return [
            'id'          => $c->id,
            'other_name'  => $other->org_name ?? $other->rep_name ?? $other->email ?? 'مجهول',
            'other_role'  => $isClient ? 'مستشار' : 'عميل',
            'avatar'      => mb_substr($other->org_name ?? $other->rep_name ?? '?', 0, 1),
            'last_message'=> $c->last_message ?? '',
            'last_at'     => $c->last_at?->diffForHumans() ?? '',
            'unread'      => $unread,
        ];
    }

    private function formatMessage(Message $m, int $myId): array
    {
        $sender = $m->sender;
        return [
            'id'          => $m->id,
            'sender_id'   => $m->sender_id,
            'is_mine'     => $m->sender_id === $myId,
            'sender_name' => $sender->org_name ?? $sender->rep_name ?? $sender->email ?? 'مجهول',
            'body'        => $m->body,
            'time'        => $m->created_at->format('H:i'),
            'read_at'     => $m->read_at,
        ];
    }
}
