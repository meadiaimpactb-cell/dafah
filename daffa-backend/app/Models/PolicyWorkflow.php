<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PolicyWorkflow extends Model
{
    protected $fillable = [
        'user_id', 'consultant_id', 'current_step', 'status',
        'selected_policies', 'subtotal', 'tax_amount', 'total',
        'discount_code', 'discount_amount', 'include_arbitration',
        'payment_method', 'payment_status', 'paid_at',
        'want_design', 'design_payment_status', 'design_fee', 'design_paid_at',
        'design_status', 'design_file', 'design_revision_notes',
        'design_uploaded_at', 'design_approved_at',
        'design_brief', 'design_logo',
        'started_at', 'completed_at',
    ];

    protected $casts = [
        'selected_policies'  => 'array',
        'design_brief'       => 'array',
        'include_arbitration'=> 'boolean',
        'want_design'        => 'boolean',
        'paid_at'            => 'datetime',
        'design_paid_at'     => 'datetime',
        'design_uploaded_at' => 'datetime',
        'design_approved_at' => 'datetime',
        'started_at'         => 'datetime',
        'completed_at'       => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function consultant(): BelongsTo
    {
        return $this->belongsTo(Consultant::class);
    }

    public function selections(): HasMany
    {
        return $this->hasMany(PolicySelection::class, 'workflow_id');
    }
}
