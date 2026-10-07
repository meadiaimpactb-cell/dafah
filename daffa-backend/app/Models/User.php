<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'org_name',
        'org_type',
        'rep_name',
        'email',
        'google_id',
        'phone',
        'sector',
        'logo',
        'permissions',
        'password',
        'role',
        'is_active',
        'email_verified_at',
    ];

    public function consultant()
    {
        return $this->hasOne(\App\Models\Consultant::class);
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
            'permissions'       => 'array',
        ];
    }
}
