<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * المحتوى المنظَّم للوحدات الاستراتيجية (عمود strategic_units.content):
 * النبذة، الشرح، الإرشادات، تعليمات النماذج وتوضيحات ⓘ والأمثلة، وملفات PDF.
 *
 * - القيم الافتراضية المعتمدة في resources/strategic/units.json (تُستخدم للتهيئة ولـ«استعادة الافتراضي»).
 * - normalize() يضبط البنية القادمة من لوحة التحكم على المخطط المعروف فقط (نصوص وقوائم)،
 *   ويحافظ على مسارات ملفات PDF المرفوعة فلا تُعدَّل إلا عبر مسار الرفع.
 */
class StrategicContent
{
    public const PDF_KINDS = ['explanation', 'guidelines'];

    private const MAX_STR   = 20000;
    private const MAX_ITEMS = 300;

    /** المحتوى الافتراضي لكل الوحدات (مفتاحه template_type) */
    public static function defaults(): array
    {
        $path = resource_path('strategic/units.json');
        if (!is_file($path)) {
            return [];
        }
        return json_decode(file_get_contents($path), true) ?: [];
    }

    public static function defaultFor(?string $type): ?array
    {
        return $type ? (self::defaults()[$type] ?? null) : null;
    }

    /** روابط ملفات PDF المرفوعة من لوحة التحكم (null = يُستخدم الملف الافتراضي) */
    public static function pdfUrls(?array $content): array
    {
        $out = [];
        foreach (self::PDF_KINDS as $kind) {
            $file = $content[$kind]['pdf_file'] ?? null;
            $out[$kind] = ($file && Storage::disk('public')->exists($file)) ? self::publicUrl($file) : null;
        }
        return $out;
    }

    /** رابط عام لملف على قرص public مع ترميز كل جزء (الأسماء عربية وفيها مسافات) */
    public static function publicUrl(string $path): string
    {
        $base = rtrim((string) config('filesystems.disks.public.url'), '/');
        return $base . '/' . implode('/', array_map('rawurlencode', explode('/', $path)));
    }

    /* ───────────── الضبط على المخطط ───────────── */

    public static function normalize(array $in, ?array $current = null): array
    {
        $current = $current ?: [];

        $out = [
            'template_label' => self::str($in['template_label'] ?? null),
            'overview'       => [
                'title'      => self::str($in['overview']['title'] ?? null),
                'paragraphs' => self::strList($in['overview']['paragraphs'] ?? []),
            ],
            'explanation'    => self::explanation($in['explanation'] ?? []),
            'guidelines'     => self::guidelines($in['guidelines'] ?? []),
            'form'           => self::form($in['form'] ?? []),
        ];

        // مسارات ملفات PDF لا تأتي من المحرر — تبقى كما هي في قاعدة البيانات
        foreach (self::PDF_KINDS as $kind) {
            foreach (['pdf_file', 'pdf_name'] as $k) {
                if (!empty($current[$kind][$k])) {
                    $out[$kind][$k] = $current[$kind][$k];
                }
            }
        }

        return $out;
    }

    private static function explanation($e): array
    {
        $e = is_array($e) ? $e : [];
        return [
            'title'            => self::str($e['title'] ?? null),
            'subtitle'         => self::str($e['subtitle'] ?? null),
            'cards'            => self::listOf($e['cards'] ?? [], fn ($c) => [
                'title'      => self::str($c['title'] ?? null),
                'paragraphs' => self::strList($c['paragraphs'] ?? []),
                'bullets'    => self::strList($c['bullets'] ?? []),
            ]),
            'deep_dive'        => self::titled($e['deep_dive'] ?? null),
            'example_button'   => self::str($e['example_button'] ?? null),
            'example'          => self::example($e['example'] ?? null),
            'example_button_2' => self::str($e['example_button_2'] ?? null),
            'example_2'        => self::example($e['example_2'] ?? null),
            'pdf_button'       => self::str($e['pdf_button'] ?? null),
            'pdf_caption'      => self::str($e['pdf_caption'] ?? null),
        ];
    }

    private static function guidelines($g): array
    {
        $g = is_array($g) ? $g : [];
        return [
            'title'          => self::str($g['title'] ?? null),
            'subtitle'       => self::str($g['subtitle'] ?? null),
            'before'         => self::titled($g['before'] ?? null),
            'steps'          => self::listOf($g['steps'] ?? [], fn ($s) => [
                'title' => self::str($s['title'] ?? null),
                'text'  => self::str($s['text'] ?? null),
            ]),
            'after'          => self::titled($g['after'] ?? null),
            'example_button' => self::str($g['example_button'] ?? null),
            'example'        => self::example($g['example'] ?? null),
            'pdf_button'     => self::str($g['pdf_button'] ?? null),
            'pdf_caption'    => self::str($g['pdf_caption'] ?? null),
        ];
    }

    private static function form($f): array
    {
        $f = is_array($f) ? $f : [];
        return [
            'blocks'   => self::listOf($f['blocks'] ?? [], fn ($b) => [
                'anchor'           => self::str($b['anchor'] ?? null) ?? 'top',
                'title'            => self::str($b['title'] ?? null),
                'heading'          => self::str($b['heading'] ?? null),
                'items'            => self::strList($b['items'] ?? []),
                'ordered'          => array_key_exists('ordered', $b) ? (bool) $b['ordered'] : true,
                'note'             => self::str($b['note'] ?? null),
                'example_button'   => self::str($b['example_button'] ?? null),
                'example'          => self::example($b['example'] ?? null),
                'example_button_2' => self::str($b['example_button_2'] ?? null),
                'example_2'        => self::example($b['example_2'] ?? null),
            ]),
            'tooltips' => self::listOf($f['tooltips'] ?? [], fn ($t) => [
                'anchor'  => self::str($t['anchor'] ?? null) ?? 'top',
                'label'   => self::str($t['label'] ?? null) ?? '',
                'text'    => self::str($t['text'] ?? null),
                'example' => self::example($t['example'] ?? null),
            ]),
            'renames'  => array_values(array_filter(self::listOf($f['renames'] ?? [], fn ($r) => [
                'from' => self::str($r['from'] ?? null) ?? '',
                'to'   => self::str($r['to'] ?? null) ?? '',
            ]), fn ($r) => $r['from'] !== '' && $r['to'] !== '')),
        ];
    }

    /** مثال: عنوان + كتل (فقرة، قائمة، حقول بتخطيط اختياري، جدول، هيكل تنظيمي) + ملاحظة */
    private static function example($x): ?array
    {
        if (!is_array($x)) {
            return null;
        }
        $blocks = self::listOf($x['blocks'] ?? [], function ($b) {
            $type = $b['type'] ?? 'paragraph';
            switch ($type) {
                case 'list':
                    return ['type' => 'list', 'items' => self::strList($b['items'] ?? [])];
                case 'fields':
                    $out = ['type' => 'fields', 'items' => self::listOf($b['items'] ?? [], fn ($i) => [
                        'label' => self::str($i['label'] ?? null) ?? '',
                        'value' => self::str($i['value'] ?? null) ?? '',
                    ])];
                    $layout = $b['layout'] ?? null;
                    if (in_array($layout, ['chain', 'combo', 'canvas'], true)) {
                        $out['layout'] = $layout; // سلسلة / تركيب عاملين ← خيار / لوحة 5-2-2
                    }
                    return $out;
                case 'table':
                    return [
                        'type'    => 'table',
                        'headers' => self::strList($b['headers'] ?? []),
                        'rows'    => self::listOf($b['rows'] ?? [], fn ($r) => self::strList($r, true)),
                    ];
                case 'orgchart':
                    return [
                        'type' => 'orgchart',
                        'rows' => self::listOf($b['rows'] ?? [], fn ($r) => array_pad(array_slice(self::strList($r, true), 0, 3), 3, '')),
                    ];
                default:
                    return ['type' => 'paragraph', 'text' => self::str($b['text'] ?? null) ?? ''];
            }
        });

        return [
            'title'  => self::str($x['title'] ?? null),
            'blocks' => $blocks,
            'note'   => self::str($x['note'] ?? null),
        ];
    }

    /* ───────────── أدوات ───────────── */

    private static function str($v): ?string
    {
        if (is_int($v) || is_float($v)) {
            $v = (string) $v;
        }
        if (!is_string($v)) {
            return null;
        }
        $v = str_replace("\r\n", "\n", $v);
        return mb_substr($v, 0, self::MAX_STR);
    }

    /** قائمة نصوص؛ keepEmpty للخلايا (خانة فارغة في جدول لها معنى) */
    private static function strList($v, bool $keepEmpty = false): array
    {
        if (!is_array($v)) {
            return [];
        }
        $out = [];
        foreach (array_slice(array_values($v), 0, self::MAX_ITEMS) as $s) {
            $s = self::str($s);
            if ($s === null) {
                if ($keepEmpty) {
                    $out[] = '';
                }
                continue;
            }
            $out[] = $s;
        }
        return $out;
    }

    private static function listOf($v, callable $fn): array
    {
        if (!is_array($v)) {
            return [];
        }
        $out = [];
        foreach (array_slice(array_values($v), 0, self::MAX_ITEMS) as $item) {
            if (!is_array($item)) {
                continue;
            }
            $out[] = $fn($item);
        }
        return $out;
    }

    /** كتلة {title, text} اختيارية (null = مخفية) */
    private static function titled($v): ?array
    {
        if (!is_array($v)) {
            return null;
        }
        return ['title' => self::str($v['title'] ?? null), 'text' => self::str($v['text'] ?? null)];
    }

    /* ───────────── أسماء ملفات PDF ───────────── */

    /** اسم ملف آمن يحافظ على العربية: يُزال ما يُحظر في أسماء الملفات وتُضمن اللاحقة .pdf */
    public static function safePdfName(?string $name, string $fallback): string
    {
        $name = (string) $name;
        $name = preg_replace('/\.pdf$/iu', '', trim($name));
        $name = preg_replace('/[\x00-\x1F\x7F<>:"\/\\\\|?*#%&{}$!\'@+`=]+/u', ' ', $name);
        $name = trim(preg_replace('/\s+/u', ' ', $name), " .-");
        if ($name === '') {
            $name = $fallback;
        }
        return mb_substr($name, 0, 150) . '.pdf';
    }
}
