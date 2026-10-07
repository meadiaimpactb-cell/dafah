<?php

namespace App\Helpers;

class PdfRenderer
{
    private static array $LABELS = [
        'vision'               => 'الرؤية',
        'mission'              => 'الرسالة',
        'values'               => 'القيم',
        'target_community'     => 'المجتمع المستهدف',
        'geographic_scope'     => 'النطاق الجغرافي',
        'programs'             => 'البرامج والخدمات',
        'partners'             => 'الشركاء',
        'resources'            => 'الموارد',
        'challenges'           => 'التحديات',
        'description'          => 'الوصف',
        'notes'                => 'ملاحظات',
        'strengths'            => 'نقاط القوة',
        'weaknesses'           => 'نقاط الضعف',
        'opportunities'        => 'الفرص',
        'threats'              => 'التهديدات',
        'needs'                => 'الاحتياجات',
        'community_definition' => 'تعريف المجتمع المستهدف',
        'need_description'     => 'وصف الاحتياج',
        'priority'             => 'الأولوية',
        'source'               => 'المصدر',
        'positions'            => 'المناصب',
        'dept'                 => 'القسم',
        'title'                => 'المسمى الوظيفي',
        'role'                 => 'الدور',
        'responsibilities'     => 'المسؤوليات',
        'reports_to'           => 'يرفع لـ',
        'kpis'                 => 'مؤشرات الأداء',
        'indicator'            => 'المؤشر',
        'target'               => 'الهدف',
        'unit'                 => 'الوحدة',
        'frequency'            => 'التكرار',
        'baseline'             => 'القيمة الأساسية',
        'initiatives'          => 'المبادرات',
        'name'                 => 'الاسم',
        'objective'            => 'الهدف',
        'timeline'             => 'الجدول الزمني',
        'budget'               => 'الميزانية',
        'responsible'          => 'المسؤول',
        'value_proposition'    => 'عرض القيمة',
        'customer_segments'    => 'شرائح العملاء',
        'channels'             => 'قنوات التواصل',
        'customer_relationships'=> 'علاقات العملاء',
        'revenue_streams'      => 'مصادر الدخل',
        'key_resources'        => 'الموارد الرئيسية',
        'key_activities'       => 'الأنشطة الرئيسية',
        'key_partners'         => 'الشركاء الرئيسيون',
        'cost_structure'       => 'هيكل التكاليف',
        'relationships'        => 'علاقات العملاء',
        'problem'              => 'المشكلة',
        'inputs'               => 'المدخلات',
        'activities'           => 'الأنشطة',
        'outputs'              => 'المخرجات',
        'outcomes'             => 'النتائج',
        'impact'               => 'الأثر',
        'assumptions'          => 'الافتراضات',
        'so'                   => 'ق+ف (SO)',
        'st'                   => 'ق+ت (ST)',
        'wo'                   => 'ض+ف (WO)',
        'wt'                   => 'ض+ت (WT)',
        'tows'                 => 'مصفوفة TOWS',
        'toc'                  => 'نظرية التغيير',
        'bmc'                  => 'نموذج العمل',
        'directions'           => 'التوجهات الاستراتيجية',
        'matrix'               => 'مصفوفة SWOT',
        'table'                => 'الجدول',
        'needs_table'          => 'جدول الاحتياجات',
        'factors'              => 'عوامل PESTEL',
        'stakeholders'         => 'أصحاب المصلحة',
        'gap_analysis'         => 'تحليل الفجوة',
        'goals_list'           => 'الأهداف الاستراتيجية',
        'values_list'          => 'القيم المؤسسية',
        'desc'                 => 'الوصف',
        'level'                => 'المستوى',
        'interest'             => 'الاهتمام',
        'strategy'             => 'الاستراتيجية',
        'document'             => 'الوثيقة',
        'monitoring'           => 'المتابعة والتقييم',
        'key_findings'         => 'النتائج الرئيسية',
        'closing_notes'        => 'ملاحظات ختامية',
        'implementation'       => 'خطة التنفيذ',
        'executive_summary'    => 'الملخص التنفيذي',
    ];

    public static function label(string $key): string
    {
        return self::$LABELS[$key] ?? str_replace('_', ' ', $key);
    }

    private static function isCompoundTable(array $obj): bool
    {
        if (empty($obj)) return false;
        $keys       = array_keys($obj);
        $withDouble = array_filter($keys, fn($k) => str_contains((string) $k, '__'));
        return count($withDouble) >= count($keys) * 0.6;
    }

    private static function renderCompoundTable(array $obj): string
    {
        $rows  = [];
        $attrs = [];
        foreach ($obj as $key => $val) {
            $key = (string) $key;
            if (str_contains($key, '__')) {
                $pos          = strrpos($key, '__');
                $cat          = substr($key, 0, $pos);
                $attr         = substr($key, $pos + 2);
                $rows[$cat][$attr] = $val;
                $attrs[$attr] = true;
            }
        }
        $attrs = array_keys($attrs);
        $cats  = array_keys($rows);
        if (empty($cats)) return '<span class="empty-val">—</span>';

        $html = '<table class="data-table"><thead><tr><th>البند</th>';
        foreach ($attrs as $a) {
            $html .= '<th>' . self::label($a) . '</th>';
        }
        $html .= '</tr></thead><tbody>';
        foreach ($cats as $cat) {
            $html .= '<tr><td><strong>' . htmlspecialchars($cat) . '</strong></td>';
            foreach ($attrs as $a) {
                $html .= '<td>' . htmlspecialchars((string) ($rows[$cat][$a] ?? '—')) . '</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';
        return $html;
    }

    private static function renderTableFromArray(array $arr): string
    {
        if (empty($arr)) return '<span class="empty-val">—</span>';
        $keys = [];
        foreach ($arr as $row) {
            if (is_array($row)) {
                foreach (array_keys($row) as $k) {
                    $keys[$k] = true;
                }
            }
        }
        $keys = array_keys($keys);
        if (empty($keys)) return '<span class="empty-val">—</span>';

        $html = '<table class="data-table"><thead><tr>';
        foreach ($keys as $k) {
            $html .= '<th>' . self::label($k) . '</th>';
        }
        $html .= '</tr></thead><tbody>';
        foreach ($arr as $row) {
            if (!is_array($row)) continue;
            $html .= '<tr>';
            foreach ($keys as $k) {
                $v = $row[$k] ?? '—';
                $html .= '<td>' . (is_array($v) ? implode('، ', $v) : htmlspecialchars((string) $v)) . '</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';
        return $html;
    }

    public static function renderValue(mixed $val, int $depth = 0): string
    {
        if (is_null($val) || $val === '' || $val === []) {
            return '<span class="empty-val">—</span>';
        }

        if (is_bool($val)) {
            return $val ? 'نعم' : 'لا';
        }

        if (is_array($val)) {
            if (empty($val)) return '<span class="empty-val">—</span>';

            // Array of objects → table
            if (isset($val[0]) && is_array($val[0])) {
                return self::renderTableFromArray($val);
            }

            // Associative array with compound keys
            if (!isset($val[0]) && self::isCompoundTable($val)) {
                return self::renderCompoundTable($val);
            }

            // Associative array (nested object)
            if (!isset($val[0])) {
                $entries = array_filter($val, fn($v) => $v !== null && $v !== '' && $v !== []);
                if (empty($entries)) return '<span class="empty-val">—</span>';
                $html = '<table class="nested-table">';
                foreach ($entries as $k => $v) {
                    $html .= '<tr>';
                    $html .= '<td class="nested-key">' . self::label((string) $k) . '</td>';
                    $html .= '<td class="nested-val">' . self::renderValue($v, $depth + 1) . '</td>';
                    $html .= '</tr>';
                }
                $html .= '</table>';
                return $html;
            }

            // Simple array of strings
            $items = array_map(
                fn($v) => '<li>' . htmlspecialchars((string) $v) . '</li>',
                $val
            );
            return '<ul>' . implode('', $items) . '</ul>';
        }

        return nl2br(htmlspecialchars((string) $val));
    }

    public static function renderFormData(?array $formData): string
    {
        if (empty($formData)) {
            return '<p class="empty-val">لا توجد بيانات</p>';
        }

        if (self::isCompoundTable($formData)) {
            return self::renderCompoundTable($formData);
        }

        $html = '';
        foreach ($formData as $key => $val) {
            $isEmpty = is_null($val) || $val === '' || (is_array($val) && empty($val));
            if ($isEmpty) continue;

            $html .= '<div class="field-block">';
            $html .= '<div class="field-label">' . self::label((string) $key) . '</div>';
            $html .= '<div class="field-value">' . self::renderValue($val) . '</div>';
            $html .= '</div>';
        }

        return $html ?: '<p class="empty-val">لا توجد بيانات</p>';
    }
}
