<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionnaireQuestion extends Model
{
    protected $fillable = ['section_id', 'question', 'type', 'options', 'required', 'hint', 'display_condition', 'meta', 'sort_order'];

    protected $casts = ['required' => 'boolean', 'options' => 'array', 'meta' => 'array'];

    public function section()
    {
        return $this->belongsTo(QuestionnaireSection::class, 'section_id');
    }
}
