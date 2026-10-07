<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StrategicUnit extends Model
{
    protected $fillable = [
        'unit_number', 'name', 'template_type', 'video_duration',
        'overview', 'overview2', 'table_headers', 'table_rows',
        'topics', 'steps', 'tip',
        'written_description', 'tips', 'video_url',
    ];

    protected $casts = [
        'table_headers' => 'array',
        'table_rows'    => 'array',
        'topics'        => 'array',
        'steps'         => 'array',
        'tips'          => 'array',
    ];
}
