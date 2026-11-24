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
        'profile_completed_at',
        'org_name',
        'org_type',
        'rep_name',
        'email',
        'google_id',
        'facebook_id',
        'linkedin_id',
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
        return $this->hasOne(Consultant::class);
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'permissions' => 'array',
        ];
    }

    /** الحقول التي يلزم أن يكملها العميل (مثل نموذج التسجيل): اسم المنظمة ونوعها ورقم الجوال */
    public const PROFILE_REQUIRED = ['org_name', 'org_type', 'phone'];

    public function profileMissing(): array
    {
        if ($this->role !== 'client') {
            return [];
        }

        return array_values(array_filter(self::PROFILE_REQUIRED, fn ($f) => trim((string) $this->{$f}) === ''));
    }

    /**
     * يُعلَّم الملف مكتملًا تلقائيًا متى اكتملت حقوله (التسجيل العادي، أو إضافة المشرف، أو استكمال حساب Google).
     * الحساب المنشأ عبر Google وأخواتها يبدأ بلا اسم منظمة ولا جوال، فيُطلب منه الاستكمال.
     */
    protected static function booted(): void
    {
        static::saving(function (User $u) {
            if (! $u->profile_completed_at && $u->profileMissing() === []) {
                $u->profile_completed_at = now();
            }
        });
    }
}
