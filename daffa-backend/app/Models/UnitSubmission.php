<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UnitSubmission extends Model
{
    protected $fillable = [
        'workflow_id', 'unit_id', 'unit_number', 'status',
        'form_data', 'consultant_notes', 'revision_count',
        'submitted_at', 'reviewed_at',
    ];

    protected $casts = [
        'form_data'    => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at'  => 'datetime',
    ];

    public function unit()
    {
        return $this->belongsTo(StrategicUnit::class, 'unit_id');
    }

    public function workflow()
    {
        return $this->belongsTo(StrategicWorkflow::class, 'workflow_id');
    }
}
