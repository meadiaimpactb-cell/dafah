<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StrategicWorkflow extends Model
{
    protected $fillable = [
        'user_id', 'consultant_id', 'current_step', 'status',
        'addon_certification', 'addon_design',
        'subtotal', 'tax_amount', 'total',
        'discount_code', 'discount_amount',
        'payment_status', 'payment_method', 'paid_at',
        'started_at', 'completed_at',
    ];

    protected $casts = [
        'addon_certification' => 'boolean',
        'addon_design'        => 'boolean',
        'paid_at'             => 'datetime',
        'started_at'          => 'datetime',
        'completed_at'        => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function consultant()
    {
        return $this->belongsTo(Consultant::class);
    }

    public function submissions()
    {
        return $this->hasMany(UnitSubmission::class, 'workflow_id');
    }

    public function getCompletedCountAttribute(): int
    {
        return $this->submissions()->where('status', 'approved')->count();
    }
}
