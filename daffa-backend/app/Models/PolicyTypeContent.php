<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PolicyTypeContent extends Model
{
    protected $fillable = [
        'policy_type_id', 'name', 'description', 'price',
        'overview', 'written_description', 'tip', 'video_url', 'video_duration',
    ];

    protected $casts = ['price' => 'float'];
}
