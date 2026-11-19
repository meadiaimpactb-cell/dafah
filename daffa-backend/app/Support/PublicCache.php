<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * ذاكرة مؤقتة بالملفات للنقاط العامة (المحتوى، الأسئلة الشائعة، أنواع السياسات).
 *
 * تُستخدم الملفات صراحةً — لا مخزن الكاش الافتراضي — حتى لا تحتاج الصفحة الرئيسية إلى أي اتصال
 * بقاعدة البيانات؛ فعلى الاستضافة المشتركة يُرفض الاتصال عند تزامن الطلبات (SQLSTATE 2002)
 * وكانت الصفحات العامة تُعيد 500. تُلغى القيم فور أي تعديل من لوحة الأدمن.
 */
final class PublicCache
{
    /** مدة الصلاحية القصوى بالثواني (حماية إن فات إلغاء ما) */
    public const TTL = 600;

    public const SITE_CONTENT = 'site-content';

    public const FAQS = 'faqs';

    public const POLICY_TYPES = 'policy-types';

    public static function remember(string $key, Closure $resolver): mixed
    {
        try {
            return Cache::store('file')->remember("public:$key", self::TTL, $resolver);
        } catch (\Throwable) {
            // تعذّر الكتابة في مجلد الكاش لا يجب أن يعطّل النقطة العامة
            return $resolver();
        }
    }

    public static function forget(string ...$keys): void
    {
        foreach ($keys as $key) {
            try {
                Cache::store('file')->forget("public:$key");
            } catch (\Throwable) {
                // تجاهل: ستنتهي الصلاحية خلال TTL على أي حال
            }
        }
    }
}
