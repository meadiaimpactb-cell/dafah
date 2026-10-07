<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionnaireQuestion extends Model
{
    protected $fillable = ['section_id', 'question', 'type', 'options', 'required', 'hint', 'display_condition', 'sort_order'];

    protected $casts = ['required' => 'boolean', 'options' => 'array'];

    public function section()
    {
        return $this->belongsTo(QuestionnaireSection::class, 'section_id');
    }
}
