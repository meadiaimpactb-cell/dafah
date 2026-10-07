<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionnaireSection extends Model
{
    protected $fillable = ['name', 'sort_order', 'policy_type_id'];

    public function questions()
    {
        return $this->hasMany(QuestionnaireQuestion::class, 'section_id')->orderBy('sort_order');
    }
}
