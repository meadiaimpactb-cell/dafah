<?php

namespace App\Support;

use App\Mail\EmailVerificationMail;
use App\Models\EmailVerification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

/**
 * رموز التحقق من البريد (OTP):
 * 6 أرقام · صالحة 10 دقائق · تُخزَّن مُجزّأة (HMAC بمفتاح التطبيق) · 5 محاولات خاطئة كحد أقصى لكل رمز ·
 * تُحذف فور الاستخدام · إعادة الإرسال بعد 60 ثانية وبحد 6 رسائل في الساعة لكل بريد.
 * الرمز لا يُعاد أبدًا في استجابة الـ API.
 */
class EmailOtp
{
    public const TTL_MINUTES    = 10;
    public const MAX_ATTEMPTS   = 5;
    public const RESEND_SECONDS = 60;
    public const MAX_PER_HOUR   = 6;

    public const VERIFY       = 'verify';
    public const EMAIL_CHANGE = 'email_change';

    /**
     * إنشاء رمز وإرساله.
     * @return array{status: 'sent'|'throttled'|'failed', retry_after: int}
     */
    public static function send(string $email, string $name, string $purpose = self::VERIFY, ?int $userId = null): array
    {
        $email   = mb_strtolower(trim($email));
        $coolKey = "otp-send:{$purpose}:{$email}";
        $hourKey = "otp-send-hour:{$email}";

        if (RateLimiter::tooManyAttempts($coolKey, 1)) {
            return ['status' => 'throttled', 'retry_after' => RateLimiter::availableIn($coolKey)];
        }
        if (RateLimiter::tooManyAttempts($hourKey, self::MAX_PER_HOUR)) {
            return ['status' => 'throttled', 'retry_after' => RateLimiter::availableIn($hourKey)];
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        EmailVerification::where('email', $email)->where('purpose', $purpose)->delete();
        $row = EmailVerification::create([
            'email'      => $email,
            'code'       => self::hash($email, $code),
            'purpose'    => $purpose,
            'user_id'    => $userId,
            'attempts'   => 0,
            'expires_at' => now()->addMinutes(self::TTL_MINUTES),
        ]);

        try {
            Mail::to($email)->send(new EmailVerificationMail($code, $name, $purpose));
        } catch (\Throwable $e) {
            $row->delete();
            Log::error('[OTP] تعذّر إرسال رمز التحقق', ['email' => $email, 'purpose' => $purpose, 'error' => $e->getMessage()]);
            return ['status' => 'failed', 'retry_after' => 0];
        }

        if (app()->environment('local')) {
            Log::info("[OTP][dev] {$purpose} {$email}: {$code}");
        }

        RateLimiter::hit($coolKey, self::RESEND_SECONDS);
        RateLimiter::hit($hourKey, 3600);

        return ['status' => 'sent', 'retry_after' => self::RESEND_SECONDS];
    }

    /**
     * التحقق من رمز. عند النجاح يُحذف الرمز (لا يُستخدم مرتين).
     * @return 'ok'|'invalid'|'expired'|'locked'
     */
    public static function check(string $email, string $code, string $purpose = self::VERIFY, ?int $userId = null): string
    {
        $email = mb_strtolower(trim($email));
        $row = EmailVerification::where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->latest('id')
            ->first();

        if (!$row || $row->isExpired() || ($userId !== null && (int) $row->user_id !== $userId)) {
            return 'expired';
        }

        if (!hash_equals($row->code, self::hash($email, $code))) {
            $row->increment('attempts');
            if ($row->attempts >= self::MAX_ATTEMPTS) {
                $row->delete();
                return 'locked';
            }
            return 'invalid';
        }

        $row->delete();
        return 'ok';
    }

    /** رسالة عربية لنتيجة التحقق */
    public static function checkMessage(string $result): string
    {
        return match ($result) {
            'invalid' => 'الرمز غير صحيح، تحقق منه وأعد المحاولة.',
            'locked'  => 'تجاوزت عدد المحاولات المسموح. اطلب رمزًا جديدًا.',
            default   => 'الرمز منتهي الصلاحية أو غير صالح. اطلب رمزًا جديدًا.',
        };
    }

    /** رسالة عربية لنتيجة الإرسال */
    public static function sendMessage(array $result, string $sentText = 'أرسلنا رمز التحقق إلى بريدك الإلكتروني.'): string
    {
        return match ($result['status']) {
            'sent'      => $sentText,
            'throttled' => 'أرسلنا لك رمزًا قبل قليل — تحقق من بريدك (ومجلد البريد غير الهام). يمكنك طلب رمز جديد بعد ' . self::wait($result['retry_after']) . '.',
            default     => 'تعذّر إرسال الرمز الآن. حاول مرة أخرى بعد قليل.',
        };
    }

    private static function wait(int $seconds): string
    {
        return $seconds >= 120 ? ceil($seconds / 60) . ' دقيقة' : max(1, $seconds) . ' ثانية';
    }

    private static function hash(string $email, string $code): string
    {
        return hash_hmac('sha256', $email . '|' . $code, (string) config('app.key'));
    }
}
