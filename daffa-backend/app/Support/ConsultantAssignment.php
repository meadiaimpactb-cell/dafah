<?php

namespace App\Support;

use App\Models\ActivityLog;
use App\Models\Consultant;
use App\Models\ConsultantChangeRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\OperationalWorkflow;
use App\Models\Order;
use App\Models\PolicyWorkflow;
use App\Models\StrategicWorkflow;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * إسناد المستشار وتغييره في الأنظمة الثلاثة (قواعد موحدة يستخدمها العميل والمشرف).
 *
 * القواعد:
 *  - قبل الدفع يختار العميل مستشاره بنفسه من خطوة «اختيار المستشار»، فلا حاجة إلى طلب.
 *  - بعد الدفع وحتى اكتمال الخطة: يقدّم العميل طلبًا مسبَّبًا، ويدرسه المشرف ويقرر.
 *  - بعد اكتمال الخطة (أو انتهاء مراجعة السياسات): لا تغيير، فلا عمل متبقٍ للمستشار.
 *  - عند التغيير: ينتقل كل ما ينتظر المراجعة إلى المستشار الجديد تلقائيًا، ويبقى عمل العميل
 *    وملاحظات المستشار السابق كما هي، وتُنشأ محادثة مع المستشار الجديد، ويُبلَّغ الأطراف الثلاثة.
 */
class ConsultantAssignment
{
    public const SYSTEMS = [
        'strategic' => ['model' => StrategicWorkflow::class, 'items' => 'submissions', 'label' => 'الخطة الاستراتيجية', 'ref' => 'ST', 'view' => 'strategic-roadmap'],
        'operational' => ['model' => OperationalWorkflow::class, 'items' => 'submissions', 'label' => 'الخطة التشغيلية', 'ref' => 'OP', 'view' => 'operational-roadmap'],
        'policies' => ['model' => PolicyWorkflow::class, 'items' => 'selections', 'label' => 'خطة السياسات', 'ref' => 'PL', 'view' => 'policies-select'],
    ];

    public static function workflow(string $system, int $id): Model
    {
        abort_unless(isset(self::SYSTEMS[$system]), 404);

        return (self::SYSTEMS[$system]['model'])::with(['user', 'consultant'])->findOrFail($id);
    }

    public static function planNumber(string $system, Model $wf): int
    {
        return (self::SYSTEMS[$system]['model'])::where('user_id', $wf->user_id)->where('id', '<=', $wf->id)->count();
    }

    public static function planLabel(string $system, Model $wf): string
    {
        return self::SYSTEMS[$system]['label'].' #'.self::planNumber($system, $wf);
    }

    public static function planRef(string $system, Model $wf): string
    {
        return self::SYSTEMS[$system]['ref'].'-'.$wf->id;
    }

    public static function isPaid(Model $wf): bool
    {
        return $wf->payment_status === 'paid';
    }

    /** هل الخطة مغلقة (لا عمل متبقٍ للمستشار)؟ */
    public static function isClosed(string $system, Model $wf): bool
    {
        return in_array($wf->status, $system === 'policies' ? ['completed', 'design_in_progress'] : ['completed'], true);
    }

    /**
     * هل يستطيع العميل طلب تغيير المستشار لهذه الخطة الآن؟ يعيد [bool, سبب المنع أو null].
     */
    public static function clientEligibility(string $system, Model $wf): array
    {
        if (self::isClosed($system, $wf)) {
            return [false, 'اكتملت هذه الخطة واعتُمدت مخرجاتها، فلا يلزم تغيير المستشار.'];
        }
        if (! $wf->consultant_id) {
            return [false, 'لم يُحدَّد مستشار لهذه الخطة بعد — ستختاره في خطوة «اختيار المستشار».'];
        }
        if (! self::isPaid($wf)) {
            return [false, 'الخطة قبل الدفع: يمكنك اختيار مستشار آخر بنفسك من خطوة «اختيار المستشار» دون طلب.'];
        }
        $pending = ConsultantChangeRequest::where('system', $system)->where('workflow_id', $wf->id)->where('status', 'pending')->exists();
        if ($pending) {
            return [false, 'لديك طلب تغيير قيد الدراسة لهذه الخطة.'];
        }

        return [true, null];
    }

    /** هل يستطيع المشرف تغيير المستشار مباشرة؟ */
    public static function adminEligibility(string $system, Model $wf): array
    {
        if (self::isClosed($system, $wf)) {
            return [false, 'الخطة مكتملة؛ لا يُغيَّر مستشار خطة اعتُمدت مخرجاتها.'];
        }

        return [true, null];
    }

    /** حال الخطة لدراسة الطلب: التقدم، وما ينتظر المراجعة وأقدمه، وسرعة مراجعة المستشار في هذه الخطة، والتواصل */
    public static function snapshot(string $system, Model $wf): array
    {
        $items = $wf->{self::SYSTEMS[$system]['items']}()->get();
        $pending = $items->whereIn('status', ['submitted', 'reviewing']);
        $oldest = $pending->pluck('submitted_at')->filter()->min();
        $hours = $items->filter(fn ($i) => $i->submitted_at && $i->reviewed_at && in_array($i->status, ['approved', 'revision'], true))
            ->map(fn ($i) => Carbon::parse($i->submitted_at)->diffInMinutes(Carbon::parse($i->reviewed_at)) / 60)
            ->filter(fn ($h) => $h >= 0);

        $conUserId = $wf->consultant?->user_id;
        $conv = $conUserId ? Conversation::where('client_id', $wf->user_id)->where('consultant_user_id', $conUserId)->first() : null;
        $msgs = $conv ? Message::where('conversation_id', $conv->id) : null;
        $lastFromConsultant = $conv ? Message::where('conversation_id', $conv->id)->where('sender_id', $conUserId)->max('created_at') : null;

        return [
            'total' => $items->count(),
            'approved' => $items->where('status', 'approved')->count(),
            'pending_review' => $pending->count(),
            'in_revision' => $items->where('status', 'revision')->count(),
            'oldest_pending_days' => $oldest ? (int) Carbon::parse($oldest)->diffInDays(now()) : null,
            'avg_review_hours' => $hours->count() ? round($hours->avg(), 1) : null,
            'reviews_done' => $hours->count(),
            'messages' => $msgs ? $msgs->count() : 0,
            'last_consultant_message' => $lastFromConsultant ? Carbon::parse($lastFromConsultant)->toDateTimeString() : null,
            'paid_days_ago' => $wf->paid_at ? (int) Carbon::parse($wf->paid_at)->diffInDays(now()) : null,
            'previous_changes' => ConsultantChangeRequest::where('system', $system)->where('workflow_id', $wf->id)->where('status', 'approved')->count(),
            'taken_at' => now()->toDateTimeString(),
        ];
    }

    /** المبالغ المرتبطة بالخطة لدى المستشار الحالي (لقرار نقل المستحقات) */
    public static function earnings(string $system, Model $wf): array
    {
        $orders = Order::where('service_type', $system)->where('workflow_id', $wf->id)->where('payment_status', 'paid')
            ->when($wf->consultant_id, fn ($q) => $q->where('consultant_id', $wf->consultant_id))->get();

        return ['orders' => $orders->count(), 'consultant_share' => round((float) $orders->sum('consultant_share'), 2)];
    }

    /**
     * ينفّذ التغيير: يحدّث الخطة، وينقل المستحقات إن طُلب، ويُنشئ المحادثة، ويبلّغ الأطراف، ويسجّل العملية.
     */
    public static function reassign(string $system, Model $wf, Consultant $to, bool $transferEarnings, ?User $actor, ?string $clientMessage = null): array
    {
        $from = $wf->consultant;
        abort_if($from && $from->id === $to->id, 422, 'المستشار المختار هو المستشار الحالي للخطة.');

        $label = self::planLabel($system, $wf);
        $org = $wf->user?->org_name ?: ($wf->user?->rep_name ?: 'العميل');
        $moved = 0;

        DB::transaction(function () use ($system, $wf, $to, $from, $transferEarnings, &$moved) {
            $wf->forceFill(['consultant_id' => $to->id])->save();
            if ($transferEarnings) {
                $moved = Order::where('service_type', $system)->where('workflow_id', $wf->id)
                    ->when($from, fn ($q) => $q->where('consultant_id', $from->id))
                    ->update(['consultant_id' => $to->id]);
            }
            if ($to->user_id) {
                Conversation::firstOrCreate(['client_id' => $wf->user_id, 'consultant_user_id' => $to->user_id], ['last_at' => now()]);
            }
        });

        $snap = self::snapshot($system, $wf->fresh(['consultant', 'user']));
        $data = ['system' => $system, 'workflow_id' => $wf->id];

        Notification::notify($wf->user_id, 'consultant_change', "تغيّر مستشار {$label}",
            "مستشارك الجديد: {$to->name}. أعمالك المرسلة تنتقل إليه كما هي.".($clientMessage ? " — {$clientMessage}" : ''), $data);
        if ($to->user_id) {
            Notification::notify($to->user_id, 'consultant_assigned', "أُسندت إليك {$label} — {$org}",
                $snap['pending_review'] > 0 ? "بانتظار مراجعتك {$snap['pending_review']} من أعمال العميل. ملاحظات المستشار السابق ظاهرة في كل وحدة." : 'تابع العميل من «العملاء والمهام».', $data);
        }
        if ($from?->user_id) {
            Notification::notify($from->user_id, 'consultant_unassigned', "أُعيد إسناد {$label} — {$org}",
                'أُسندت هذه الخطة إلى مستشار آخر بقرار من إدارة المنصة. شكرًا لما قدمته فيها.', $data);
        }

        ActivityLog::record($actor?->id, 'تغيير مستشار خطة', 'consultant', $actor?->role ?? 'admin',
            "{$label} ({$org}): ".($from?->name ?? '—')." ← {$to->name}".($transferEarnings ? " — نُقلت المستحقات ({$moved} طلب)" : ' — بقيت المستحقات للمستشار السابق'));

        return ['from' => $from, 'to' => $to, 'orders_moved' => $moved];
    }
}
