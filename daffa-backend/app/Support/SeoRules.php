<?php

namespace App\Support;

/**
 * قواعد «الظهور والقياس» المشتركة بين الخادم ولوحة الأدمن (نظيرتها في الواجهة: utils/seoRules.js).
 * المعرّف يدخل كودًا يُنفَّذ في متصفح الزائر، فلا يُقبل ولا يُحقن إلا ما يطابق صيغته تمامًا.
 */
final class SeoRules
{
    /** ما يعرضه جوجل قبل أن يقصّ النص */
    public const LIMITS = ['title' => [30, 60], 'description' => [70, 160]];

    public const TRACKING = ['track_gtm', 'track_ga4', 'track_meta_pixel', 'track_clarity', 'track_tiktok', 'track_snap'];

    public const VERIFY = ['seo_verify_google', 'seo_verify_bing'];

    private const FORMATS = [
        'track_gtm' => '/^GTM-[A-Z0-9]{4,12}$/',
        'track_ga4' => '/^G-[A-Z0-9]{4,16}$/',
        'track_meta_pixel' => '/^\d{6,20}$/',
        'track_clarity' => '/^[a-z0-9]{6,20}$/',
        'track_tiktok' => '/^[A-Z0-9]{10,30}$/',
        'track_snap' => '/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/',
        'seo_verify_google' => '/^[A-Za-z0-9_-]{20,100}$/',
        'seo_verify_bing' => '/^[A-Za-z0-9]{16,64}$/',
    ];

    private const EXTRACT = [
        'track_gtm' => ['/\b(GTM-[A-Z0-9]{4,12})\b/i'],
        'track_ga4' => ['/\b(G-[A-Z0-9]{4,16})\b/i'],
        'track_meta_pixel' => ['/fbq\(\s*[\'"]init[\'"]\s*,\s*[\'"](\d{6,20})[\'"]/i', '/[?&]id=(\d{6,20})/'],
        'track_clarity' => ['/clarity\.ms\/tag\/([a-z0-9]{6,20})/i', '/["\']script["\']\s*,\s*["\']([a-z0-9]{6,20})["\']/i'],
        'track_tiktok' => ['/ttq\.load\(\s*[\'"]([A-Z0-9]{10,30})[\'"]/i'],
        'track_snap' => ['/snaptr\(\s*[\'"]init[\'"]\s*,\s*[\'"]([a-f0-9-]{36})[\'"]/i'],
        'seo_verify_google' => ['/content\s*=\s*["\']([A-Za-z0-9_-]{20,100})["\']/i'],
        'seo_verify_bing' => ['/content\s*=\s*["\']([A-Za-z0-9]{16,64})["\']/i'],
    ];

    public static function valid(string $key, ?string $value): bool
    {
        return isset(self::FORMATS[$key]) && preg_match(self::FORMATS[$key], trim((string) $value)) === 1;
    }

    /** يقبل المعرّف أو الوسم/الكود كاملًا، ويرجع المعرّف وحده */
    public static function normalize(string $key, ?string $raw): string
    {
        $v = trim((string) $raw);
        if ($v === '' || ! isset(self::FORMATS[$key])) {
            return $v;
        }
        $case = fn ($s) => in_array($key, ['track_gtm', 'track_ga4', 'track_tiktok'], true) ? strtoupper($s) : (in_array($key, ['track_clarity', 'track_snap'], true) ? strtolower($s) : $s);
        if (self::valid($key, $case($v))) {
            return $case($v);
        }
        foreach (self::EXTRACT[$key] as $re) {
            if (preg_match($re, $v, $m) && self::valid($key, $case($m[1]))) {
                return $case($m[1]);
            }
        }

        return $v;
    }

    /** المعرّفات الصالحة فقط (للحقن في الصفحة) */
    public static function validValues(array $settings, array $keys): array
    {
        $out = [];
        foreach ($keys as $k) {
            $v = trim((string) ($settings[$k] ?? ''));
            if (self::valid($k, $v)) {
                $out[$k] = $v;
            }
        }

        return $out;
    }

    public static function meter(string $text, string $kind): string
    {
        $n = mb_strlen(trim($text));
        [$min, $max] = self::LIMITS[$kind];

        return $n === 0 ? 'empty' : ($n < $min ? 'short' : ($n > $max ? 'long' : 'good'));
    }

    /* ── robots.txt ─────────────────────────────────────────────────────── */

    /** زواحف الذكاء الاصطناعي التي يقرر المالك السماح لها أو حجبها */
    public const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot'];

    // صور المشاركة المرفوعة من اللوحة في /storage/seo/ مسموحة (تعرضها نتائج البحث والمشاركة)، وبقية المرفقات الخاصة محجوبة
    private const OPEN = ['Allow: /', 'Allow: /storage/seo/', 'Disallow: /api/', 'Disallow: /pdf/', 'Disallow: /storage/'];

    /** القواعد الافتراضية: كل الصفحات العامة مفتوحة، وواجهة البرمجة والمستندات الموقّعة والمرفقات الخاصة محجوبة، وCSS/JS غير محجوبة */
    public static function defaultRobots(): string
    {
        return implode("\n\n", array_map(fn ($ua) => "User-agent: {$ua}\n".implode("\n", self::OPEN), ['*', 'Googlebot', 'Bingbot']));
    }

    public static function buildRobots(?string $custom, bool $aiBlock, string $base): string
    {
        $body = trim((string) $custom) !== '' ? trim(str_replace("\r", '', (string) $custom)) : self::defaultRobots();
        $mentioned = collect(self::AI_BOTS)->contains(fn ($b) => preg_match('/^\s*user-agent\s*:\s*'.preg_quote($b, '/').'\s*$/im', $body));
        if (! $mentioned) {
            $ua = implode("\n", array_map(fn ($b) => "User-agent: {$b}", self::AI_BOTS));
            $body .= "\n\n# زواحف الذكاء الاصطناعي: ".($aiBlock ? 'محجوبة' : 'مسموحة')." (من لوحة الأدمن ← ملف robots.txt)\n".$ua."\n".($aiBlock ? 'Disallow: /' : implode("\n", self::OPEN));
        }
        if (! preg_match('/^\s*sitemap\s*:/im', $body)) {
            $body .= "\n\nSitemap: {$base}/sitemap.xml";
        }

        return "# منصة دفة — robots.txt\n\n".$body."\n";
    }

    public static function robotsWarnings(string $text): array
    {
        $out = [];
        if (preg_match('/^\s*disallow\s*:\s*\/\s*$/im', $text) && ! preg_match('/^\s*user-agent\s*:\s*(GPTBot|ClaudeBot|CCBot)/im', $text)) {
            $out[] = 'BLOCK_ALL';
        }
        if (preg_match('/^\s*disallow\s*:\s*\/(assets|fonts)\b/im', $text) || preg_match('/disallow\s*:\s*[^\n]*\.(css|js)\b/i', $text)) {
            $out[] = 'BLOCK_ASSETS';
        }
        if (! preg_match('/^\s*user-agent\s*:/im', $text) && trim($text) !== '') {
            $out[] = 'NO_AGENT';
        }

        return $out;
    }
}
