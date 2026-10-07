<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OperationalUnit extends Model
{
    protected $fillable = [
        'unit_number', 'name', 'template_type',
        'overview', 'overview2', 'written_description', 'tips', 'topics', 'steps', 'tip', 'video_duration', 'video_url',
    ];

    protected $casts = [
        'topics' => 'array',
        'steps'  => 'array',
        'tips'   => 'array',
    ];
}
