<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolicySelection extends Model
{
    protected $fillable = [
        'workflow_id', 'policy_type_id', 'status',
        'form_data', 'consultant_notes', 'revision_count',
        'submitted_at', 'reviewed_at',
    ];

    protected $casts = [
        'form_data'    => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at'  => 'datetime',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(PolicyWorkflow::class, 'workflow_id');
    }
}
