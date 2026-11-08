<?php

namespace App\Support;

/**
 * كتالوج السياسات واللوائح.
 *
 * - السياسات الحالية: حزمة سياسات دفة الإصدار 3.0 (19 وثيقة في 4 مجموعات)،
 *   تُقرأ من resources/policies/v3/catalog.json.
 * - السياسات القديمة (1–7): أُوقف بيعها، وتبقى معرّفة لعرض الطلبات السابقة فقط.
 */
class PolicyCatalog
{
    public const VERSION = '3.0';

    public const STATUS_NOTE = 'نموذج مهني استرشادي لا يصبح معتمدًا إلا بعد استكمال بيانات الجهة وحقول التخصيص وإصدار قرار الاعتماد من صاحب الصلاحية والحصول على الموافقات النظامية اللازمة.';

    public const CONFLICT_RULE = 'تسود الأنظمة واللوائح والقرارات الصادرة من الجهات المختصة واللائحة الأساسية المعتمدة للجهة على أي حكم في هذه الوثيقة، ولا يجوز استخدام حقول التخصيص لتخفيض حق نظامي أو تجاوز اختصاص أو اعتماد واجب.';

    private static ?array $cache = null;

    /** All policy types (current + legacy), keyed list ordered by id. */
    public static function all(): array
    {
        if (self::$cache !== null) {
            return self::$cache;
        }

        $data    = self::loadCatalogFile();
        $groups  = collect($data['groups'] ?? [])->pluck('name', 'key');
        $current = collect($data['policies'] ?? [])->map(fn ($p) => [
            'id'          => (int) $p['id'],
            'code'        => $p['code'],
            'version'     => $data['version'] ?? self::VERSION,
            'group'       => $p['group'],
            'group_name'  => $groups[$p['group']] ?? '',
            'name'        => $p['name'],
            'icon'        => $p['icon'] ?? '📜',
            'description' => $p['description'],
            'overview'    => $p['overview'] ?? null,
            'tip'         => $p['tip'] ?? null,
            'price'       => (float) $p['price'],
            'sections'    => $p['sections'] ?? [],
            'chapters'    => $p['chapters'] ?? [],
            'template'    => $p['code'],
            'active'      => true,
        ]);

        return self::$cache = $current->concat(self::legacy())->sortBy('id')->values()->all();
    }

    /** IDs a client may purchase today. */
    public static function activeIds(): array
    {
        return collect(self::all())->where('active', true)->pluck('id')->values()->all();
    }

    public static function allIds(): array
    {
        return collect(self::all())->pluck('id')->values()->all();
    }

    public static function groups(): array
    {
        return self::loadCatalogFile()['groups'] ?? [];
    }

    public static function find(int $id): ?array
    {
        return collect(self::all())->firstWhere('id', $id);
    }

    /** Absolute path of the corrected v3.0 reference document, or null. */
    public static function templatePath(?string $code, string $format): ?string
    {
        if (!$code || !in_array($format, ['docx', 'pdf'], true)) {
            return null;
        }

        $path = resource_path("policies/v3/templates/{$code}.{$format}");

        return is_file($path) ? $path : null;
    }

    private static function loadCatalogFile(): array
    {
        static $file = null;

        if ($file === null) {
            $path = resource_path('policies/v3/catalog.json');
            $file = is_file($path) ? (json_decode(file_get_contents($path), true) ?: []) : [];
        }

        return $file;
    }

    /** Pre-v3.0 catalog — kept read-only so existing orders still render. */
    private static function legacy(): array
    {
        $rows = [
            [1, 'لائحة الموارد البشرية',    '👥', 'تنظيم شؤون الموظفين والتوظيف والتدريب والإجازات',  1500, ['معلومات المنظمة','التوظيف والاستقطاب','ساعات العمل والإجازات','التعويضات والمزايا','تقييم الأداء','التدريب والتطوير','إنهاء الخدمة','السلوك والانضباط']],
            [2, 'السياسات الإعلامية',        '📢', 'ضبط التواصل الإعلامي والمحتوى والعلاقات العامة',     1200, ['معلومات المنظمة','الهوية البصرية','التواصل الإعلامي','وسائل التواصل الاجتماعي','الأزمات الإعلامية','المتحدث الرسمي']],
            [3, 'سياسات الحوكمة',            '⚖️', 'تنظيم الحوكمة ومسؤوليات مجلس الإدارة واللجان',      1800, ['معلومات المنظمة','مجلس الإدارة','اللجان','التصويت واتخاذ القرار','تضارب المصالح','الشفافية والإفصاح','المحاسبية']],
            [4, 'لائحة تنظيم التبرعات',      '💰', 'تنظيم استقبال وإدارة وتوثيق التبرعات',                 1000, ['معلومات المنظمة','قنوات استقبال التبرعات','أنواع التبرعات','التوثيق والإيصالات','التبرعات المشروطة','الإفصاح المالي']],
            [5, 'سياسة الموارد المالية',      '🏦', 'ضبط الإدارة المالية والميزانيات والصرف',                1500, ['معلومات المنظمة','الميزانية السنوية','صلاحيات الصرف','المشتريات','التقارير المالية','التدقيق والمراجعة']],
            [6, 'سياسة الخصوصية والسرية',    '🔒', 'حماية بيانات المستفيدين والسرية والإفصاح',             1200, ['معلومات المنظمة','جمع البيانات','تخزين البيانات','مشاركة البيانات','حقوق المستفيد','الإفصاح والشفافية']],
            [7, 'سياسات المتابعة والتقييم',  '📊', 'آليات المتابعة وتقييم الأداء والبرامج',                 1000, ['معلومات المنظمة','إطار المتابعة','أدوات التقييم','مؤشرات الأداء','التقارير الدورية','التحسين المستمر']],
        ];

        return array_map(fn ($r) => [
            'id'          => $r[0],
            'code'        => null,
            'version'     => '2.0',
            'group'       => 'legacy',
            'group_name'  => 'إصدار سابق',
            'name'        => $r[1],
            'icon'        => $r[2],
            'description' => $r[3],
            'overview'    => null,
            'tip'         => null,
            'price'       => (float) $r[4],
            'sections'    => $r[5],
            'chapters'    => [],
            'template'    => null,
            'active'      => false,
        ], $rows);
    }
}
