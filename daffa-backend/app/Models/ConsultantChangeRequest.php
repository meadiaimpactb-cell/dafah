<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultantChangeRequest extends Model
{
    protected $fillable = [
        'user_id', 'system', 'workflow_id', 'from_consultant_id', 'requested_consultant_id', 'to_consultant_id',
        'source', 'reason_category', 'reason', 'status', 'admin_note', 'internal_note', 'earnings_transferred',
        'snapshot', 'decided_by', 'decided_at',
    ];

    protected $casts = [
        'snapshot' => 'array',
        'earnings_transferred' => 'boolean',
        'decided_at' => 'datetime',
    ];

    /** أسباب الطلب المعتمدة (المفتاح ← النص الظاهر) */
    public const REASONS = [
        'slow_response' => 'تأخر المستشار في مراجعة الوحدات أو الرد',
        'quality' => 'عدم الرضا عن جودة الملاحظات أو التوجيه',
        'communication' => 'صعوبة في التواصل أو التفاهم',
        'expertise' => 'الحاجة إلى تخصص أو خبرة مختلفة',
        'availability' => 'المستشار غير متاح أو منقطع',
        'other' => 'سبب آخر',
    ];

    /** أسباب يختارها المشرف عند التغيير المباشر */
    public const ADMIN_REASONS = [
        'consultant_unavailable' => 'المستشار غير متاح (إجازة/انقطاع/إيقاف)',
        'workload' => 'إعادة توزيع الأحمال بين المستشارين',
        'quality' => 'ملاحظات على أداء المستشار في هذه الخطة',
        'client_request' => 'بناءً على طلب العميل خارج المنصة',
        'other' => 'سبب آخر',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function fromConsultant()
    {
        return $this->belongsTo(Consultant::class, 'from_consultant_id');
    }

    public function toConsultant()
    {
        return $this->belongsTo(Consultant::class, 'to_consultant_id');
    }

    public function requestedConsultant()
    {
        return $this->belongsTo(Consultant::class, 'requested_consultant_id');
    }

    public function decider()
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
