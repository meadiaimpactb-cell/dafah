<?php

namespace App\Support;

/**
 * المحتوى المنظَّم لوحدات التخطيط التشغيلي (عمود operational_units.content):
 * النبذة، الشرح، الإرشادات، تعليمات نموذج العمل، مثاله التوضيحي (نافذة منبثقة) وتوضيحات ⓘ.
 *
 * - القيم المعتمدة في resources/operational/units.json (مصدرها «دفة — الحزم الموحّدة للمطور»)
 *   وتُستخدم للتهيئة ولـ«استعادة المحتوى المعتمد» من لوحة التحكم.
 * - كل قسم بطاقة واحدة: {title, heading, blocks[]}، والكتل أنواع معروفة فقط:
 *   paragraph · heading · list · step (مرقّمة تلقائيًا) · tip · fields · table · gantt.
 *   النص يقبل **عريض** وأسطرًا متعددة.
 */
class OperationalContent
{
    public const SECTIONS = ['overview', 'explanation', 'guidelines'];

    public const BLOCK_TYPES = ['paragraph', 'heading', 'list', 'step', 'tip', 'fields', 'table', 'gantt'];

    private const MAX_STR = 20000;

    private const MAX_ITEMS = 300;

    /** المحتوى الافتراضي لكل الوحدات (مفتاحه template_type) */
    public static function defaults(): array
    {
        $path = resource_path('operational/units.json');
        if (! is_file($path)) {
            return [];
        }

        return json_decode(file_get_contents($path), true) ?: [];
    }

    public static function defaultFor(?string $type): ?array
    {
        return $type ? (self::defaults()[$type] ?? null) : null;
    }

    /* ───────────── الضبط على المخطط ───────────── */

    public static function normalize(array $in): array
    {
        $out = [];
        foreach (self::SECTIONS as $section) {
            $out[$section] = self::card($in[$section] ?? []);
        }

        $f = is_array($in['form'] ?? null) ? $in['form'] : [];
        $out['form'] = self::card($f) + [
            'example_button' => self::str($f['example_button'] ?? null),
            'example' => self::example($f['example'] ?? null),
            'tooltips' => array_values(array_filter(self::listOf($f['tooltips'] ?? [], fn ($t) => [
                'label' => trim((string) self::str($t['label'] ?? null)),
                'text' => self::str($t['text'] ?? null),
            ]), fn ($t) => $t['label'] !== '')),
        ];

        return $out;
    }

    /** بطاقة: عنوان + عنوان فرعي اختياري + كتل */
    private static function card($c): array
    {
        $c = is_array($c) ? $c : [];

        return [
            'title' => self::str($c['title'] ?? null),
            'heading' => self::str($c['heading'] ?? null),
            'blocks' => self::blocks($c['blocks'] ?? []),
        ];
    }

    /** المثال التوضيحي (يُعرض في نافذة منبثقة) */
    private static function example($x): ?array
    {
        if (! is_array($x)) {
            return null;
        }

        return [
            'title' => self::str($x['title'] ?? null),
            'blocks' => self::blocks($x['blocks'] ?? []),
        ];
    }

    private static function blocks($list): array
    {
        return self::listOf($list, function ($b) {
            $type = in_array($b['type'] ?? null, self::BLOCK_TYPES, true) ? $b['type'] : 'paragraph';
            switch ($type) {
                case 'heading':
                    return ['type' => 'heading', 'text' => self::str($b['text'] ?? null) ?? ''];
                case 'list':
                    return [
                        'type' => 'list',
                        'ordered' => array_key_exists('ordered', $b) ? (bool) $b['ordered'] : true,
                        'items' => self::strList($b['items'] ?? []),
                    ];
                case 'step':
                    return [
                        'type' => 'step',
                        'title' => self::str($b['title'] ?? null),
                        'text' => self::str($b['text'] ?? null),
                        'items' => self::strList($b['items'] ?? []),
                    ];
                case 'tip':
                    return [
                        'type' => 'tip',
                        'label' => self::str($b['label'] ?? null),
                        'text' => self::str($b['text'] ?? null) ?? '',
                    ];
                case 'fields':
                    return ['type' => 'fields', 'items' => self::listOf($b['items'] ?? [], fn ($i) => [
                        'label' => self::str($i['label'] ?? null) ?? '',
                        'value' => self::str($i['value'] ?? null) ?? '',
                    ])];
                case 'table':
                    return [
                        'type' => 'table',
                        'headers' => self::strList($b['headers'] ?? [], true),
                        'rows' => self::listOf($b['rows'] ?? [], fn ($r) => self::strList($r, true)),
                    ];
                case 'gantt':
                    $months = array_slice(self::strList($b['months'] ?? [], true), 0, 24);
                    $n = count($months);

                    return [
                        'type' => 'gantt',
                        'months' => $months,
                        'rows' => self::listOf($b['rows'] ?? [], function ($r) use ($n) {
                            $marks = array_map(fn ($m) => $m ? 1 : 0, array_values(is_array($r['marks'] ?? null) ? $r['marks'] : []));

                            return [
                                'label' => self::str($r['label'] ?? null) ?? '',
                                'marks' => array_slice(array_pad($marks, $n, 0), 0, $n),
                            ];
                        }),
                    ];
                default:
                    return ['type' => 'paragraph', 'text' => self::str($b['text'] ?? null) ?? ''];
            }
        });
    }

    /* ───────────── أدوات ───────────── */

    private static function str($v): ?string
    {
        if (is_int($v) || is_float($v)) {
            $v = (string) $v;
        }
        if (! is_string($v)) {
            return null;
        }

        return mb_substr(str_replace("\r\n", "\n", $v), 0, self::MAX_STR);
    }

    /** قائمة نصوص؛ keepEmpty للخلايا (خانة فارغة في جدول لها معنى) */
    private static function strList($v, bool $keepEmpty = false): array
    {
        if (! is_array($v)) {
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
        if (! is_array($v)) {
            return [];
        }
        $out = [];
        foreach (array_slice(array_values($v), 0, self::MAX_ITEMS) as $item) {
            if (is_array($item)) {
                $out[] = $fn($item);
            }
        }

        return $out;
    }
}
