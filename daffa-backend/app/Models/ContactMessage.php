<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $fillable = ['name', 'org', 'email', 'phone', 'subject', 'message', 'ip', 'emailed_at'];

    protected $casts = ['emailed_at' => 'datetime'];
}
