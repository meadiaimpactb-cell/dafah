<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperationalWorkflow extends Model
{
    protected $fillable = [
        'user_id', 'consultant_id', 'current_step', 'arbitration_step', 'status',
        'subtotal', 'tax_amount', 'total',
        'discount_code', 'discount_amount',
        'payment_method', 'payment_status',
        'paid_at', 'started_at', 'completed_at',
    ];

    protected $casts = [
        'paid_at'      => 'datetime',
        'started_at'   => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function consultant(): BelongsTo
    {
        return $this->belongsTo(Consultant::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(OperationalSubmission::class, 'workflow_id');
    }

    public function getCompletedCountAttribute(): int
    {
        return $this->submissions()->where('status', 'approved')->count();
    }
}
