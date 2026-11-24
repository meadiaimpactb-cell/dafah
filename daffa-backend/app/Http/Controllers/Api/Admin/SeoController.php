<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\PublicPageController;
use App\Models\ActivityLog;
use App\Models\SeoPage;
use App\Models\SiteContent;
use App\Support\PublicCache;
use App\Support\SeoPages;
use App\Support\SeoRules;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/**
 * «الظهور والقياس» في لوحة الأدمن: الظهور في محركات البحث لكل صفحة، والكلمات المفتاحية، وملف robots.txt،
 * وخريطة الموقع وحالة الأرشفة وIndexNow، ومعرّفات أدوات القياس ورموز التوثيق.
 * كل ما يُحفظ هنا يصل الزائر ومحركات البحث من الخادم مباشرة (PublicPageController).
 */
class SeoController extends Controller
{
    private function pageOr404(string $page): string
    {
        abort_unless(in_array($page, SeoPages::INDEXABLE, true), 404);

        return $page;
    }

    private function setting(string $key, string $value): void
    {
        SiteContent::where('key', $key)->update(['value' => $value]);
    }

    private function forget(): void
    {
        PublicCache::forget(PublicCache::SITE_CONTENT, 'seo-pages');
    }

    private function log(Request $r, string $action, string $details): void
    {
        ActivityLog::record($r->user()?->id, $action, 'seo', 'admin', $details);
    }

    // GET /admin/seo/pages
    public function pages()
    {
        $c = SeoPages::content();
        $custom = SeoPages::custom();

        return response()->json(['base' => SeoPages::BASE, 'limits' => SeoRules::LIMITS, 'pages' => array_map(function ($p) use ($c, $custom) {
            $own = $custom[$p] ?? [];
            [$dt, $dd] = SeoPages::defaults($p, $c);

            return [
                'page' => $p, 'label' => SeoPages::LABELS[$p], 'path' => SeoPages::PATHS[$p],
                'title' => $own['title'] ?? '', 'description' => $own['description'] ?? '',
                'og_image' => $own['og_image'] ?? '', 'og_image_url' => ($own['og_image'] ?? '') !== '' ? SeoPages::ogImage($p) : null,
                'keywords' => $own['keywords'] ?? [], 'primary' => $own['primary'] ?? '', 'noindex' => (bool) ($own['noindex'] ?? false),
                'defaults' => ['title' => $dt, 'description' => $dd], 'updated_at' => $own['updated_at'] ?? null,
            ];
        }, SeoPages::INDEXABLE)]);
    }

    // PUT /admin/seo/pages/{page}
    public function savePage(Request $request, string $page)
    {
        $page = $this->pageOr404($page);
        $data = $request->validate([
            'title' => 'nullable|string|max:200',
            'description' => 'nullable|string|max:500',
            'noindex' => 'required|boolean',
            'og_image' => 'nullable|string|max:255',
        ], ['title.max' => 'العنوان طويل جدًا (200 حرف كحد أقصى).', 'description.max' => 'الوصف طويل جدًا (500 حرف كحد أقصى).']);
        $img = trim((string) ($data['og_image'] ?? ''));
        if ($img !== '' && (! str_starts_with($img, 'seo/') || str_contains($img, '..') || ! Storage::disk('public')->exists($img))) {
            return response()->json(['message' => 'صورة المشاركة غير صالحة، ارفعها من جديد.'], 422);
        }
        $row = SeoPage::firstOrCreate(['page' => $page]);
        $row->update(['title' => trim((string) ($data['title'] ?? '')) ?: null, 'description' => trim((string) ($data['description'] ?? '')) ?: null,
            'noindex' => (bool) $data['noindex'], 'og_image' => $img ?: null]);
        $this->forget();
        $this->log($request, 'تعديل الظهور في محركات البحث', SeoPages::LABELS[$page].($data['noindex'] ? ' — مخفية عن البحث' : ''));

        return $this->pages();
    }

    // POST /admin/seo/pages/{page}/image
    public function uploadImage(Request $request, string $page)
    {
        $page = $this->pageOr404($page);
        $request->validate(['image' => 'required|image|mimes:jpg,jpeg,png,webp|max:3072|dimensions:min_width=600,min_height=315'], [
            'image.dimensions' => 'الصورة صغيرة؛ الأنسب 1200 × 630 بكسل، وأقلها 600 × 315.',
            'image.max' => 'حجم الصورة أكبر من 3 ميجابايت.',
            'image.mimes' => 'الصيغ المقبولة: JPG وPNG وWebP.',
        ]);
        $path = $request->file('image')->store('seo', 'public');

        return response()->json(['path' => $path, 'url' => SeoPages::BASE.'/storage/'.$path]);
    }

    // PUT /admin/seo/pages/{page}/keywords
    public function saveKeywords(Request $request, string $page)
    {
        $page = $this->pageOr404($page);
        $data = $request->validate(['keywords' => 'present|array|max:30', 'keywords.*' => 'string|min:2|max:80', 'primary' => 'nullable|string|max:80'], [
            'keywords.max' => 'الحد الأقصى 30 كلمة لكل صفحة.', 'keywords.*.string' => 'كلمة غير صالحة.',
            'keywords.*.min' => 'الكلمة قصيرة جدًا (حرفان على الأقل).', 'keywords.*.max' => 'الكلمة طويلة جدًا (80 حرفًا كحد أقصى).',
        ]);
        $seen = [];
        $list = [];
        foreach ($data['keywords'] as $k) {
            $k = trim(preg_replace('/\s+/u', ' ', $k));
            $n = mb_strtolower($k);
            if ($k !== '' && ! isset($seen[$n])) {
                $seen[$n] = true;
                $list[] = $k;
            }
        }
        $primary = in_array($data['primary'] ?? '', $list, true) ? $data['primary'] : ($list[0] ?? null);
        SeoPage::firstOrCreate(['page' => $page])->update(['keywords' => $list, 'primary_keyword' => $primary]);
        $this->forget();

        return response()->json(['keywords' => $list, 'primary' => $primary]);
    }

    // GET /admin/seo/pages/{page}/content
    public function content(string $page)
    {
        return response()->json(PublicPageController::pageContent($this->pageOr404($page)));
    }

    // GET /admin/seo/robots
    public function robots()
    {
        $c = SeoPages::content();

        return response()->json([
            'custom' => (string) ($c['seo_robots_custom'] ?? ''),
            'effective' => PublicPageController::robotsText(),
            'default' => SeoRules::defaultRobots(),
            'ai_block' => ($c['seo_ai_bots'] ?? 'allow') === 'block',
            'ai_bots' => SeoRules::AI_BOTS,
            'warnings' => SeoRules::robotsWarnings((string) ($c['seo_robots_custom'] ?? '')),
        ]);
    }

    // PUT /admin/seo/robots
    public function saveRobots(Request $request)
    {
        $data = $request->validate(['text' => 'nullable|string|max:5000']);
        $text = trim(str_replace("\r", '', (string) ($data['text'] ?? '')));
        if ($text !== '' && preg_match('/<[a-z!?\/]/i', $text)) {
            return response()->json(['message' => 'الملف نص عادي؛ لا يقبل وسوم HTML.'], 422);
        }
        $this->setting('seo_robots_custom', $text);
        $this->forget();
        $this->log($request, 'تعديل ملف robots.txt', $text === '' ? 'استعادة القواعد الافتراضية' : 'قواعد خاصة');

        return $this->robots();
    }

    // PUT /admin/seo/ai-bots
    public function aiBots(Request $request)
    {
        $data = $request->validate(['block' => 'required|boolean']);
        $this->setting('seo_ai_bots', $data['block'] ? 'block' : 'allow');
        $this->forget();
        $this->log($request, 'زواحف الذكاء الاصطناعي', $data['block'] ? 'حجب' : 'سماح');

        return $this->robots();
    }

    // GET /admin/seo/sitemap
    public function sitemap()
    {
        try {
            $last = SiteContent::max('updated_at');
        } catch (\Throwable) {
            $last = null;
        }
        $entries = PublicPageController::sitemapEntries($last);
        $hidden = array_values(array_diff(SeoPages::INDEXABLE, SeoPages::indexable()));

        return response()->json([
            'base' => SeoPages::BASE,
            'entries' => array_map(fn ($e) => $e + ['label' => SeoPages::LABELS[$e['page']]], $entries),
            'hidden' => array_map(fn ($p) => ['page' => $p, 'label' => SeoPages::LABELS[$p]], $hidden),
            'excluded' => [['label' => 'تسجيل الدخول', 'path' => '/login'], ['label' => 'إنشاء حساب', 'path' => '/register'], ['label' => 'لوحات التحكم', 'path' => '—']],
        ]);
    }

    // GET /admin/seo/status — حالة الأرشفة كما تستطيع الإدارة التحقق منها
    public function status()
    {
        $c = SeoPages::content();
        $verify = SeoRules::validValues($c, SeoRules::VERIFY);
        $robots = PublicPageController::robotsText();
        $pages = array_map(function ($p) use ($c) {
            [$t, $d] = SeoPages::meta($p, $c);

            return ['page' => $p, 'label' => SeoPages::LABELS[$p], 'title' => SeoRules::meter($t, 'title'), 'description' => SeoRules::meter($d, 'description')];
        }, SeoPages::indexable());
        $last = json_decode((string) ($c['seo_indexnow_last'] ?? ''), true) ?: null;

        return response()->json([
            'base' => SeoPages::BASE,
            'verify' => ['google' => isset($verify['seo_verify_google']), 'bing' => isset($verify['seo_verify_bing'])],
            'sitemap' => ['pages' => count(SeoPages::indexable()), 'hidden' => count(SeoPages::INDEXABLE) - count(SeoPages::indexable())],
            'robots' => [
                'sitemap' => (bool) preg_match('/^\s*sitemap\s*:/im', $robots),
                'engines' => ! in_array('BLOCK_ALL', SeoRules::robotsWarnings((string) ($c['seo_robots_custom'] ?? '')), true),
                'ai_block' => ($c['seo_ai_bots'] ?? 'allow') === 'block',
            ],
            'indexnow' => ['last' => $last],
            'pages' => $pages,
            'log' => ['verified_at' => (string) ($c['seo_log_verified_at'] ?? ''), 'sitemap_at' => (string) ($c['seo_log_sitemap_at'] ?? '')],
        ]);
    }

    // PUT /admin/seo/log
    public function saveLog(Request $request)
    {
        $data = $request->validate(['verified_at' => 'nullable|date_format:Y-m-d', 'sitemap_at' => 'nullable|date_format:Y-m-d']);
        $this->setting('seo_log_verified_at', (string) ($data['verified_at'] ?? ''));
        $this->setting('seo_log_sitemap_at', (string) ($data['sitemap_at'] ?? ''));
        $this->forget();

        return $this->status();
    }

    // POST /admin/seo/indexnow — يرسل روابط الصفحات العامة إلى IndexNow (Bing وYandex وغيرهما)
    public function indexNow(Request $request)
    {
        $urls = array_map(fn ($p) => SeoPages::url($p), SeoPages::indexable());
        $result = ['at' => now()->toDateTimeString(), 'count' => count($urls), 'status' => null, 'error' => null];
        try {
            $res = Http::timeout(15)->acceptJson()->post('https://api.indexnow.org/indexnow', [
                'host' => parse_url(SeoPages::BASE, PHP_URL_HOST),
                'key' => SeoPages::INDEXNOW_KEY,
                'keyLocation' => SeoPages::BASE.'/'.SeoPages::INDEXNOW_KEY.'.txt',
                'urlList' => $urls,
            ]);
            $result['status'] = $res->status();
        } catch (\Throwable $e) {
            $result['error'] = 'تعذّر الاتصال بخدمة IndexNow';
        }
        $this->setting('seo_indexnow_last', json_encode($result, JSON_UNESCAPED_UNICODE));
        $this->forget();
        $this->log($request, 'إرسال الروابط إلى IndexNow', "{$result['count']} رابط — ".($result['status'] ?? $result['error']));

        return response()->json($result);
    }

    // GET /admin/seo/tracking
    public function tracking()
    {
        $c = SeoPages::content();
        $keys = array_merge(SeoRules::VERIFY, SeoRules::TRACKING);

        return response()->json(['values' => array_combine($keys, array_map(fn ($k) => (string) ($c[$k] ?? ''), $keys))]);
    }

    // PUT /admin/seo/tracking — يُحفظ المعرّف وحده حتى لو لُصق الكود كاملًا، ويُرفض ما لا يطابق صيغته
    public function saveTracking(Request $request)
    {
        $keys = array_merge(SeoRules::VERIFY, SeoRules::TRACKING);
        $request->validate(array_fill_keys(array_map(fn ($k) => "values.$k", $keys), 'nullable|string|max:2000'));
        $clean = [];
        $errors = [];
        foreach ($keys as $k) {
            $v = SeoRules::normalize($k, (string) $request->input("values.$k", ''));
            if ($v !== '' && ! SeoRules::valid($k, $v)) {
                $errors["values.$k"] = ['الصيغة غير صحيحة لهذا المعرّف.'];
            }
            $clean[$k] = $v;
        }
        if ($errors) {
            return response()->json(['message' => 'بعض المعرّفات بصيغة خاطئة ولم يُحفظ شيء.', 'errors' => $errors], 422);
        }
        foreach ($clean as $k => $v) {
            $this->setting($k, $v);
        }
        $this->forget();
        $on = count(array_filter(array_intersect_key($clean, array_flip(SeoRules::TRACKING))));
        $this->log($request, 'تعديل أدوات القياس والتوثيق', "{$on} أداة قياس مفعّلة");

        return $this->tracking();
    }
}
