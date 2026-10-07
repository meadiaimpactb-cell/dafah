<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultantReview extends Model
{
    protected $fillable = ['user_id', 'consultant_id', 'workflow_type', 'workflow_id', 'rating', 'comment'];

    protected $casts = ['rating' => 'integer', 'workflow_id' => 'integer'];

    public function consultant()
    {
        return $this->belongsTo(Consultant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
