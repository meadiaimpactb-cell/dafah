<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consultant extends Model
{
    protected $fillable = [
        'user_id', 'name', 'specialty', 'rating', 'experience_years',
        'completed_projects', 'available', 'bio', 'avatar_initial', 'avatar',
    ];

    protected $casts = [
        'available' => 'boolean',
        'rating'    => 'decimal:1',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
