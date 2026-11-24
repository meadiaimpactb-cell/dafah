<?php

namespace App\Http\Controllers;

use App\Models\SiteContent;
use App\Support\SeoPages;
use App\Support\SeoRules;
use Illuminate\Support\Facades\Log;

/**
 * يخدم الصفحات العامة من index.html المبني بعد حقن العنوان والوصف والرابط القانوني والبيانات المنظّمة
 * والمحتوى الحقيقي لكل رابط، حتى تقرأ محركات البحث كل صفحة كما هي دون الحاجة إلى تشغيل JavaScript.
 * أي خطأ هنا يعيد index.html كما هو فلا يتعطل الموقع أبدًا.
 */
class PublicPageController extends Controller
{
    public function show(string $page)
    {
        $html = self::indexHtml();
        if ($html === null) {
            abort(404);
        }
        try {
            $html = self::render($page, $html);
        } catch (\Throwable $e) {
            Log::warning('SEO render failed: '.$e->getMessage());
        }

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache',
            'X-Robots-Tag' => SeoPages::noindex($page) ? 'noindex, follow' : 'index, follow',
        ]);
    }

    /** خريطة الموقع: الصفحات القابلة للفهرسة فقط، وتاريخ آخر تعديل من محتوى الموقع */
    public function sitemap()
    {
        try {
            $last = SiteContent::max('updated_at');
        } catch (\Throwable) {
            $last = null;
        }
        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
        foreach (self::sitemapEntries($last) as $e) {
            $xml .= '  <url><loc>'.$e['loc'].'</loc><lastmod>'.$e['lastmod'].'</lastmod><priority>'.$e['priority'].'</priority></url>'."\n";
        }
        $xml .= '</urlset>'."\n";

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8', 'Cache-Control' => 'public, max-age=3600']);
    }

    /** روابط خريطة الموقع: الصفحات العامة غير المخفية، وتاريخ آخر تعديل لكل منها */
    public static function sitemapEntries($siteUpdated = null): array
    {
        $base = $siteUpdated ? date('Y-m-d', strtotime($siteUpdated)) : date('Y-m-d', @filemtime((string) self::indexPath()) ?: time());
        $prio = ['home' => '1.0', 'services' => '0.9', 'pricing' => '0.9', 'about' => '0.7', 'contact' => '0.6', 'privacy' => '0.3', 'terms' => '0.3'];
        $custom = SeoPages::custom();

        return array_map(fn ($p) => [
            'page' => $p, 'loc' => SeoPages::url($p), 'priority' => $prio[$p],
            'lastmod' => max($base, (string) ($custom[$p]['updated_at'] ?? '')),
        ], SeoPages::indexable());
    }

    /** robots.txt: القواعد الخاصة من لوحة الأدمن أو الافتراضية، مع قرار زواحف الذكاء الاصطناعي وسطر الخريطة دائمًا */
    public function robots()
    {
        return response(self::robotsText(), 200, ['Content-Type' => 'text/plain; charset=UTF-8', 'Cache-Control' => 'public, max-age=600']);
    }

    /** العناوين والأوصاف الفعلية للصفحات العامة — يستعملها التطبيق عند التنقل داخل الموقع */
    public function meta()
    {
        $c = SeoPages::content();
        $out = [];
        foreach (array_keys(SeoPages::PATHS) as $p) {
            [$t, $d] = SeoPages::meta($p, $c);
            $out[$p] = ['title' => $t, 'description' => $d, 'noindex' => SeoPages::noindex($p), 'image' => SeoPages::ogImage($p)];
        }

        return response()->json($out, 200, ['Cache-Control' => 'public, max-age=60']);
    }

    public static function robotsText(): string
    {
        $c = SeoPages::content();

        return SeoRules::buildRobots($c['seo_robots_custom'] ?? '', ($c['seo_ai_bots'] ?? 'allow') === 'block', SeoPages::BASE);
    }

    /** نص الصفحة كما تقرؤه محركات البحث (لتحليل الكلمات المفتاحية) */
    public static function pageContent(string $page): array
    {
        $c = SeoPages::content();
        [$title, $desc] = SeoPages::meta($page, $c);
        $html = view('seo.body', [
            'page' => $page, 'c' => $c, 'units' => SeoPages::units(), 'policies' => SeoPages::policies(),
            'email' => SeoPages::realEmail($c), 'phone' => SeoPages::realPhone($c),
        ])->render();
        preg_match('#<main.*</main>#su', $html, $m);
        $main = $m[0] ?? $html;
        preg_match_all('#<h[1-3][^>]*>(.*?)</h[1-3]>#su', $main, $h);
        $clean = fn ($x) => trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($x), ENT_QUOTES, 'UTF-8')));

        return ['title' => $title, 'description' => $desc, 'headings' => array_values(array_filter(array_map($clean, $h[1]))), 'body' => $clean($main)];
    }

    public static function indexPath(): ?string
    {
        foreach (array_filter([env('FRONTEND_INDEX_PATH'), base_path('../index.html'), base_path('../daffa-frontend/dist/index.html')]) as $p) {
            if (is_file($p)) {
                return $p;
            }
        }

        return null;
    }

    public static function indexHtml(): ?string
    {
        $p = self::indexPath();

        return $p ? file_get_contents($p) : null;
    }

    public static function render(string $page, string $html): string
    {
        $c = SeoPages::content();
        [$title, $desc] = SeoPages::meta($page, $c);
        $url = SeoPages::url($page);
        $robots = SeoPages::noindex($page) ? 'noindex, follow' : 'index, follow, max-image-preview:large';
        $img = SeoPages::ogImage($page);
        $e = fn ($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');

        $head = "    <title>{$e($title)}</title>\n"
            ."    <meta name=\"description\" content=\"{$e($desc)}\" />\n"
            ."    <meta name=\"robots\" content=\"{$robots}\" />\n"
            ."    <link rel=\"canonical\" href=\"{$e($url)}\" />\n"
            ."    <meta name=\"df-seo-view\" content=\"{$e($page)}\" />\n"
            ."    <meta property=\"og:type\" content=\"website\" />\n"
            ."    <meta property=\"og:site_name\" content=\"".SeoPages::BRAND."\" />\n"
            ."    <meta property=\"og:locale\" content=\"ar_SA\" />\n"
            ."    <meta property=\"og:title\" content=\"{$e($title)}\" />\n"
            ."    <meta property=\"og:description\" content=\"{$e($desc)}\" />\n"
            ."    <meta property=\"og:url\" content=\"{$e($url)}\" />\n"
            ."    <meta property=\"og:image\" content=\"{$img}\" />\n"
            ."    <meta property=\"og:image:width\" content=\"1200\" />\n"
            ."    <meta property=\"og:image:height\" content=\"630\" />\n"
            ."    <meta property=\"og:image:alt\" content=\"منصة دفة للتخطيط الاستراتيجي والتشغيلي وبناء السياسات\" />\n"
            ."    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n"
            ."    <meta name=\"twitter:title\" content=\"{$e($title)}\" />\n"
            ."    <meta name=\"twitter:description\" content=\"{$e($desc)}\" />\n"
            ."    <meta name=\"twitter:image\" content=\"{$img}\" />\n";
        // رموز التوثيق من «أدوات القياس والتتبّع» (الصالحة فقط)
        $verify = SeoRules::validValues($c, SeoRules::VERIFY);
        if (isset($verify['seo_verify_google'])) {
            $head .= "    <meta name=\"google-site-verification\" content=\"{$e($verify['seo_verify_google'])}\" />\n";
        }
        if (isset($verify['seo_verify_bing'])) {
            $head .= "    <meta name=\"msvalidate.01\" content=\"{$e($verify['seo_verify_bing'])}\" />\n";
        }

        $ld = "    <script type=\"application/ld+json\">".json_encode(SeoPages::jsonLd($page, $c), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG)."</script>\n";

        $body = view('seo.body', [
            'page' => $page, 'c' => $c, 'units' => SeoPages::units(), 'policies' => SeoPages::policies(),
            'email' => SeoPages::realEmail($c), 'phone' => SeoPages::realPhone($c),
        ])->render();

        $html = self::between($html, '<!--seo-head-->', '<!--/seo-head-->', "\n".$head.'    ');
        $html = self::between($html, '<!--seo-ld-->', '<!--/seo-ld-->', "\n".$ld.'    ');

        return self::between($html, '<!--seo-body-->', '<!--/seo-body-->', "\n".$body."\n    ");
    }

    private static function between(string $html, string $open, string $close, string $inner): string
    {
        $a = strpos($html, $open);
        $b = strpos($html, $close);
        if ($a === false || $b === false || $b < $a) {
            return $html;
        }

        return substr($html, 0, $a + strlen($open)).$inner.substr($html, $b);
    }
}
