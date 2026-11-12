<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

/**
 * بريد حقيقي: يُستخدم مع email:rfc,dns (صيغة صحيحة ونطاق موجود يستقبل البريد)،
 * ويرفض نطاقات البريد المؤقت/الوهمي (قائمة disposable-email-domains — CC0)
 * والنطاقات المحجوزة للأمثلة والاختبار.
 */
class RealEmail implements ValidationRule
{
    /** نطاقات محجوزة لا تخص أحدًا (RFC 2606 / 6761) */
    private const RESERVED = ['example.com', 'example.net', 'example.org', 'example.edu', 'test.com'];
    private const RESERVED_TLDS = ['test', 'example', 'invalid', 'localhost', 'local'];

    private static ?array $disposable = null;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $email  = mb_strtolower(trim((string) $value));
        $domain = substr(strrchr($email, '@') ?: '', 1);
        if ($domain === '') {
            return; // الصيغة تتولاها قاعدة email
        }

        $tld = substr(strrchr($domain, '.') ?: '', 1);
        if (in_array($domain, self::RESERVED, true) || in_array($tld, self::RESERVED_TLDS, true)) {
            $fail('هذا البريد غير حقيقي — استخدم بريدًا تملكه وتستطيع استقبال الرسائل عليه.');
            return;
        }

        if (self::isDisposable($domain)) {
            $fail('لا يُقبل البريد المؤقت أو الوهمي — استخدم بريدًا حقيقيًا تملكه.');
        }
    }

    /** النطاق أو أي نطاق أعلى منه في القائمة (مثل x.mailinator.com) */
    public static function isDisposable(string $domain): bool
    {
        if (self::$disposable === null) {
            $path = resource_path('email/disposable_domains.txt');
            $list = is_file($path) ? file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) : [];
            self::$disposable = array_flip(array_map('trim', $list));
        }
        $parts = explode('.', $domain);
        while (count($parts) >= 2) {
            if (isset(self::$disposable[implode('.', $parts)])) {
                return true;
            }
            array_shift($parts);
        }
        return false;
    }

    /** قواعد حقل البريد الموحّدة في النظام (التسجيل، الملف الشخصي، لوحة التحكم) */
    public static function rules(?int $ignoreUserId = null, bool $required = true): array
    {
        $unique = Rule::unique('users', 'email');
        if ($ignoreUserId) {
            $unique->ignore($ignoreUserId);
        }
        return [$required ? 'required' : 'nullable', 'string', 'max:255', 'email:rfc,dns', new self(), $unique];
    }

    /** رسائل عربية لحقل البريد (field = اسم الحقل في الطلب) */
    public static function messages(string $field = 'email'): array
    {
        return [
            "{$field}.required" => 'البريد الإلكتروني مطلوب.',
            "{$field}.string"   => 'البريد الإلكتروني غير صحيح.',
            "{$field}.max"      => 'البريد الإلكتروني طويل جدًا.',
            "{$field}.email"    => 'البريد الإلكتروني غير صحيح أو أن نطاقه لا يستقبل البريد — تأكد من كتابته بشكل صحيح.',
            "{$field}.unique"   => 'البريد الإلكتروني مسجّل مسبقًا.',
        ];
    }

    public static function normalize(?string $email): ?string
    {
        return $email === null ? null : mb_strtolower(trim($email));
    }
}
