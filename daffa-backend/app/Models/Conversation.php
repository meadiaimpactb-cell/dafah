<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = ['client_id', 'consultant_user_id', 'last_message', 'last_at'];

    protected $casts = ['last_at' => 'datetime'];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function consultantUser()
    {
        return $this->belongsTo(User::class, 'consultant_user_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
