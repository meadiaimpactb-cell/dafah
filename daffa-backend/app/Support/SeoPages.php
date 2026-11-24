<?php

namespace App\Support;

use App\Http\Controllers\Api\PolicyController;
use App\Models\OperationalUnit;
use App\Models\SiteContent;
use App\Models\StrategicUnit;

/**
 * الصفحات العامة كما تراها محركات البحث: عنوان ووصف ورابط قانوني وبطاقات مشاركة وبيانات منظّمة ومحتوى حقيقي
 * لكل رابط، تُحقن في index.html المبني (React يستبدل المحتوى بعد التحميل بالتصميم الكامل نفسه).
 * كل النصوص من «محتوى الموقع» في لوحة الأدمن، فأي تعديل هناك يظهر هنا.
 */
final class SeoPages
{
    public const BASE = 'https://daffah.org';

    public const BRAND = 'منصة دفة';

    /** مفتاح IndexNow (الملف نفسه منشور في جذر الموقع: /{key}.txt) */
    public const INDEXNOW_KEY = 'ac4dcda9214e7340a57c69c1827ac03e';

    /** الصفحات القابلة للفهرسة (بترتيب خريطة الموقع) */
    public const INDEXABLE = ['home', 'about', 'services', 'pricing', 'contact', 'privacy', 'terms'];

    public const PATHS = [
        'home' => '/', 'about' => '/about', 'services' => '/services', 'pricing' => '/pricing',
        'contact' => '/contact', 'privacy' => '/privacy', 'terms' => '/terms', 'login' => '/login', 'register' => '/register',
    ];

    public const LABELS = [
        'home' => 'الرئيسية', 'about' => 'عن دفة', 'services' => 'الخدمات', 'pricing' => 'الأسعار', 'contact' => 'تواصل معنا',
        'privacy' => 'سياسة الخصوصية', 'terms' => 'شروط الاستخدام', 'login' => 'تسجيل الدخول', 'register' => 'إنشاء حساب',
    ];

    /** ما كتبه المشرف في «الظهور والقياس» لكل صفحة (عنوان، وصف، صورة، كلمات، إخفاء) */
    public static function custom(): array
    {
        try {
            return PublicCache::remember('seo-pages', fn () => \App\Models\SeoPage::all()->keyBy('page')->map(fn ($p) => [
                'title' => (string) $p->title, 'description' => (string) $p->description, 'og_image' => (string) $p->og_image,
                'keywords' => $p->keywords ?: [], 'primary' => (string) $p->primary_keyword, 'noindex' => (bool) $p->noindex,
                'updated_at' => optional($p->updated_at)->toDateString(),
            ])->all());
        } catch (\Throwable) {
            return [];
        }
    }

    /** الصفحات القابلة للفهرسة فعلًا (ما لم يُخفِه المشرف) */
    public static function indexable(): array
    {
        $c = self::custom();

        return array_values(array_filter(self::INDEXABLE, fn ($p) => empty($c[$p]['noindex'])));
    }

    public static function ogImage(string $page): string
    {
        $img = self::custom()[$page]['og_image'] ?? '';

        return $img !== '' ? self::BASE.'/storage/'.ltrim($img, '/') : self::BASE.'/og-image.png';
    }

    public static function content(): array
    {
        try {
            return PublicCache::remember(PublicCache::SITE_CONTENT, fn () => SiteContent::pluck('value', 'key')->all());
        } catch (\Throwable) {
            return [];
        }
    }

    public static function policies(): array
    {
        try {
            return PublicCache::remember(PublicCache::POLICY_TYPES, fn () => collect(PolicyController::policyTypes())->where('active', true)->values()->all());
        } catch (\Throwable) {
            return [];
        }
    }

    public static function units(): array
    {
        try {
            return PublicCache::remember('units', fn () => [
                'strategic' => StrategicUnit::orderBy('unit_number')->pluck('name')->all(),
                'operational' => OperationalUnit::orderBy('unit_number')->pluck('name')->all(),
            ]);
        } catch (\Throwable) {
            return ['strategic' => [], 'operational' => []];
        }
    }

    /** رقم من نص سعر مثل «5,000» */
    public static function num(?string $v): ?float
    {
        $n = preg_replace('/[^\d.]/', '', strtr((string) $v, ['٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9']));

        return $n === '' ? null : (float) $n;
    }

    /** بيانات تواصل حقيقية فقط (لا تُنشر القيم الافتراضية الوهمية مثل XXX) */
    public static function realPhone(array $c): ?string
    {
        $p = trim((string) ($c['contact_phone'] ?? ''));

        return ($p !== '' && ! preg_match('/x/i', $p) && preg_match('/\d{6,}/', preg_replace('/\D/', '', $p))) ? $p : null;
    }

    public static function realEmail(array $c): ?string
    {
        $e = trim((string) ($c['contact_email'] ?? ''));

        return filter_var($e, FILTER_VALIDATE_EMAIL) && ! str_contains($e, 'example.') ? $e : null;
    }

    /** العنوان والوصف: ما كتبه المشرف، وإلا النص الافتراضي المبني من محتوى الصفحة */
    public static function meta(string $page, array $c): array
    {
        [$t, $d] = self::defaults($page, $c);
        $own = self::custom()[$page] ?? [];

        return [trim($own['title'] ?? '') !== '' ? trim($own['title']) : $t, trim($own['description'] ?? '') !== '' ? trim($own['description']) : $d];
    }

    /** النص الافتراضي لكل صفحة (50–60 حرفًا للعنوان و140–160 للوصف تقريبًا) */
    public static function defaults(string $page, array $c): array
    {
        $sp = $c['strategic_price'] ?? '5,000';
        $op = $c['operational_price'] ?? '3,500';
        $pp = $c['policies_min_price'] ?? '1,000';
        $count = count(self::policies()) ?: 19;

        return match ($page) {
            'home' => ['منصة دفة | التخطيط الاستراتيجي والسياسات للجمعيات الأهلية',
                'ابنِ الخطة الاستراتيجية والتشغيلية وسياسات ولوائح جمعيتك خطوة بخطوة عبر منصة دفة، بفيديوهات ونماذج جاهزة ومراجعة واعتماد من مستشار متخصص عن بعد.'],
            'about' => ['عن منصة دفة | كيف نبني خطط المنظمات غير الربحية',
                'تعرّف على منصة دفة: رؤيتها ورسالتها وآلية عملها التي ترشد الجمعيات والمؤسسات غير الربحية لبناء خططها وسياساتها خطوة بخطوة بإشراف مستشار متخصص.'],
            'services' => ['خدمات دفة: التخطيط الاستراتيجي والتشغيلي والسياسات',
                "ثلاث خدمات مستقلة للمنظمات غير الربحية: خطة استراتيجية في 11 وحدة، وخطة تشغيلية في 5 وحدات، و{$count} سياسة ولائحة، مع مراجعة واعتماد مستشار متخصص."],
            'pricing' => ['أسعار منصة دفة | التخطيط الاستراتيجي والسياسات واللوائح',
                "أسعار خدمات منصة دفة: الخطة الاستراتيجية {$sp} ريال، والخطة التشغيلية {$op} ريال، والسياسات واللوائح من {$pp} ريال للسياسة، مع اختيار مستشارك قبل الدفع."],
            'contact' => ['تواصل مع منصة دفة | الاستفسارات والدعم الفني',
                'تواصل مع فريق منصة دفة للاستفسار عن خدمات التخطيط الاستراتيجي والتشغيلي وبناء السياسات واللوائح، أو للدعم الفني وطلبات الشراكة مع منظمتك.'],
            'privacy' => ['سياسة الخصوصية وحماية البيانات | منصة دفة',
                'كيف تجمع منصة دفة بيانات المنظمات ومستخدميها وتستخدمها وتحميها، ومع من تشاركها، وحقوقك في الوصول إليها وتصحيحها وحذفها وفق نظام حماية البيانات الشخصية.'],
            'terms' => ['شروط استخدام منصة دفة للتخطيط والسياسات',
                'الشروط التي تنظّم استخدام منصة دفة للتخطيط الاستراتيجي والتشغيلي وبناء السياسات: الحسابات، ودور المستشار، والمدفوعات، والملكية الفكرية للمخرجات، والمسؤولية.'],
            'login' => ['تسجيل الدخول | منصة دفة', 'سجّل دخولك إلى منصة دفة لمتابعة خطط منظمتك وسياساتها.'],
            'register' => ['أنشئ حساب منظمتك | منصة دفة', 'أنشئ حساب منظمتك في منصة دفة وابدأ رحلة التخطيط الاستراتيجي والتشغيلي وبناء السياسات.'],
        };
    }

    public static function noindex(string $page): bool
    {
        return in_array($page, ['login', 'register'], true) || ! empty(self::custom()[$page]['noindex']);
    }

    public static function url(string $page): string
    {
        return self::BASE.self::PATHS[$page];
    }

    /** البيانات المنظّمة لكل صفحة */
    public static function jsonLd(string $page, array $c): array
    {
        $org = [
            '@type' => 'Organization',
            '@id' => self::BASE.'/#organization',
            'name' => self::BRAND,
            'alternateName' => ['دفة', 'Daffah'],
            'url' => self::BASE.'/',
            'logo' => ['@type' => 'ImageObject', 'url' => self::BASE.'/logo.png', 'width' => 560, 'height' => 560],
            'image' => self::ogImage('home'),
            'description' => 'منصة للتخطيط الاستراتيجي والتشغيلي وبناء السياسات واللوائح للمنظمات غير الربحية بإشراف مستشارين متخصصين.',
            'areaServed' => ['@type' => 'Country', 'name' => 'المملكة العربية السعودية'],
            'address' => ['@type' => 'PostalAddress', 'addressLocality' => 'الرياض', 'addressCountry' => 'SA'],
        ];
        $same = array_values(array_filter(array_map(fn ($k) => trim((string) ($c[$k] ?? '')), ['social_twitter', 'social_linkedin', 'social_instagram', 'social_youtube', 'social_facebook']), fn ($u) => preg_match('#^https?://#', $u)));
        if ($same) {
            $org['sameAs'] = $same;
        }
        $cp = array_filter(['email' => self::realEmail($c), 'telephone' => self::realPhone($c)]);
        if ($cp) {
            $org['contactPoint'] = ['@type' => 'ContactPoint', 'contactType' => 'customer support', 'availableLanguage' => ['ar']] + $cp;
        }
        $site = ['@type' => 'WebSite', '@id' => self::BASE.'/#website', 'url' => self::BASE.'/', 'name' => self::BRAND, 'inLanguage' => 'ar', 'publisher' => ['@id' => self::BASE.'/#organization']];
        [$title, $desc] = self::meta($page, $c);
        $type = match ($page) { 'about' => 'AboutPage', 'contact' => 'ContactPage', default => 'WebPage' };
        $webpage = ['@type' => $type, '@id' => self::url($page).'#webpage', 'url' => self::url($page), 'name' => $title, 'description' => $desc,
            'inLanguage' => 'ar', 'isPartOf' => ['@id' => self::BASE.'/#website'], 'about' => ['@id' => self::BASE.'/#organization']];
        $graph = [$org, $site, $webpage];

        if ($page !== 'home') {
            $graph[] = ['@type' => 'BreadcrumbList', '@id' => self::url($page).'#breadcrumb', 'itemListElement' => [
                ['@type' => 'ListItem', 'position' => 1, 'name' => self::LABELS['home'], 'item' => self::BASE.'/'],
                ['@type' => 'ListItem', 'position' => 2, 'name' => self::LABELS[$page], 'item' => self::url($page)],
            ]];
        }
        if (in_array($page, ['services', 'pricing'], true)) {
            foreach (self::services($c) as $s) {
                $node = ['@type' => 'Service', '@id' => self::BASE.'/services#'.$s['id'], 'name' => $s['name'], 'description' => $s['desc'],
                    'serviceType' => $s['type'], 'provider' => ['@id' => self::BASE.'/#organization'],
                    'areaServed' => ['@type' => 'Country', 'name' => 'المملكة العربية السعودية'], 'audience' => ['@type' => 'Audience', 'audienceType' => 'المنظمات غير الربحية'], 'url' => self::BASE.'/services'];
                if ($s['price'] !== null) {
                    $node['offers'] = ['@type' => 'Offer', 'priceCurrency' => 'SAR', 'url' => self::BASE.'/pricing', 'availability' => 'https://schema.org/InStock']
                        + ($s['from'] ? ['priceSpecification' => ['@type' => 'PriceSpecification', 'minPrice' => $s['price'], 'priceCurrency' => 'SAR']] : ['price' => $s['price']]);
                }
                $graph[] = $node;
            }
        }

        return ['@context' => 'https://schema.org', '@graph' => $graph];
    }

    public static function services(array $c): array
    {
        $count = count(self::policies()) ?: 19;

        return [
            ['id' => 'strategic', 'name' => 'نظام التخطيط الاستراتيجي', 'type' => 'التخطيط الاستراتيجي للمنظمات غير الربحية',
                'desc' => $c['strategic_service_desc'] ?? 'بناء الخطة الاستراتيجية الكاملة للمنظمة من خلال 11 وحدة تخطيطية متسلسلة.',
                'price' => self::num($c['strategic_service_price'] ?? $c['strategic_price'] ?? null), 'from' => false],
            ['id' => 'operational', 'name' => 'نظام التخطيط التشغيلي', 'type' => 'التخطيط التشغيلي للمنظمات غير الربحية',
                'desc' => $c['operational_service_desc'] ?? 'تحويل المبادرات الاستراتيجية إلى خطة تشغيلية مفصلة.',
                'price' => self::num($c['operational_service_price'] ?? $c['operational_price'] ?? null), 'from' => false],
            ['id' => 'policies', 'name' => 'نظام بناء السياسات واللوائح', 'type' => 'إعداد السياسات واللوائح الداخلية',
                'desc' => ($c['policies_service_desc'] ?? 'بناء السياسات واللوائح الداخلية عبر استبيانات ذكية موجهة.')." ({$count} سياسة ولائحة ضمن حزمة دفة v3.0)",
                'price' => self::num($c['policies_min_price'] ?? null), 'from' => true],
        ];
    }
}
