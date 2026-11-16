<?php

namespace App\Providers;

use Carbon\Carbon;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // الأوقات النسبية بالعربية في كل الواجهات ("منذ ٥ دقائق" بدل "5 minutes ago")
        Carbon::setLocale('ar');

        // توجيه رابط إعادة تعيين كلمة المرور إلى الواجهة الأمامية
        ResetPassword::createUrlUsing(fn ($user, string $token) => self::resetUrl($user, $token));

        // رسالة إعادة التعيين بالعربية وبهوية منصة دفة (بدل رسالة Laravel الإنجليزية الافتراضية)
        ResetPassword::toMailUsing(function ($user, string $token) {
            $broker = config('auth.defaults.passwords', 'users');
            return (new MailMessage)
                ->subject('إعادة تعيين كلمة المرور — منصة دفة')
                ->view(['emails.reset-password', 'emails.reset-password-text'], [
                    'url'     => self::resetUrl($user, $token),
                    'name'    => $user->rep_name ?: ($user->org_name ?: ''),
                    'minutes' => (int) config("auth.passwords.{$broker}.expire", 60),
                ]);
        });
    }

    private static function resetUrl($user, string $token): string
    {
        $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://dafah.test')), '/');
        return $frontend . '?token=' . $token . '&email=' . urlencode($user->email);
    }
}
