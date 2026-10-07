<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // توجيه رابط إعادة تعيين كلمة المرور إلى الواجهة الأمامية
        ResetPassword::createUrlUsing(function ($user, string $token) {
            $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://dafah.test')), '/');
            return $frontend . '?token=' . $token . '&email=' . urlencode($user->email);
        });
    }
}
