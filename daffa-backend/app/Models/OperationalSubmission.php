<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationalSubmission extends Model
{
    protected $fillable = [
        'workflow_id', 'unit_id', 'unit_number',
        'status', 'form_data', 'consultant_notes',
        'revision_count', 'submitted_at', 'reviewed_at',
    ];

    protected $casts = [
        'form_data'    => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at'  => 'datetime',
    ];

    public function unit(): BelongsTo
    {
        return $this->belongsTo(OperationalUnit::class, 'unit_id');
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(OperationalWorkflow::class, 'workflow_id');
    }
}
