<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailVerification extends Model
{
    protected $fillable = ['email', 'code', 'purpose', 'user_id', 'attempts', 'expires_at', 'used_at'];

    // الرمز مُجزّأ ولا يُعرض أبدًا
    protected $hidden = ['code'];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at'    => 'datetime',
        'attempts'   => 'integer',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
