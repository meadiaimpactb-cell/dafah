<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SeoPage extends Model
{
    protected $fillable = ['page', 'title', 'description', 'og_image', 'keywords', 'primary_keyword', 'noindex'];

    protected $casts = ['keywords' => 'array', 'noindex' => 'boolean'];
}
