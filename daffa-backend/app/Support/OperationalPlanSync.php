<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * ربط وحدات الخطة التشغيلية الواحدة ببعضها:
 * - لكل نشاط في «المبادرات التشغيلية» (op_activities) معرّف ثابت id.
 * - «الجدول الزمني للتنفيذ» (op_gantt) ينقل هذه الأنشطة تلقائيًا: صف مستقل لكل نشاط مرتبط
 *   بمعرّفه (source_id)، فتبقى الأشهر المحددة عند إعادة فتح النموذج أو تغيير اسم النشاط،
 *   دون تكرار الصفوف أو فقدانها. الصفوف المضافة يدويًا (بلا source_id) تبقى كما هي.
 * - «المبادرات التشغيلية» تبدأ بالمبادرات المختارة في الجزء الأول (op_import).
 * دوال خالصة على المصفوفات — لا تحفظ شيئًا بنفسها.
 */
class OperationalPlanSync
{
    public const MONTHS = 12;

    public static function newId(): string
    {
        return 'act_'.Str::lower(Str::random(12));
    }

    private static function norm($s): string
    {
        return trim(preg_replace('/\s+/u', ' ', is_string($s) ? $s : ''));
    }

    private static function months($m): array
    {
        $m = is_array($m) ? array_values($m) : [];
        $m = array_map(fn ($v) => $v ? 1 : 0, array_slice($m, 0, self::MONTHS));

        return array_pad($m, self::MONTHS, 0);
    }

    /** يضمن معرّفًا فريدًا لكل نشاط في op_activities. يعيد [formData, changed] */
    public static function ensureActivityIds(array $data): array
    {
        if (! is_array($data['groups'] ?? null)) {
            return [$data, false];
        }
        $changed = false;
        $seen = [];
        $groups = $data['groups'];
        foreach ($groups as $gi => $g) {
            if (! is_array($g) || ! is_array($g['activities'] ?? null)) {
                continue;
            }
            foreach ($g['activities'] as $ai => $a) {
                if (! is_array($a)) {
                    continue;
                }
                $id = is_string($a['id'] ?? null) ? trim($a['id']) : '';
                if ($id === '' || isset($seen[$id]) || strlen($id) > 64) {
                    $id = self::newId();
                    $groups[$gi]['activities'][$ai]['id'] = $id;
                    $changed = true;
                }
                $seen[$id] = true;
            }
        }
        if ($changed) {
            $data['groups'] = $groups;
        }

        return [$data, $changed];
    }

    /** الأنشطة المسمّاة في op_activities بترتيبها: [{id, name, initiative}] */
    public static function activities(?array $data): array
    {
        $out = [];
        foreach ((array) ($data['groups'] ?? []) as $g) {
            if (! is_array($g)) {
                continue;
            }
            $initiative = self::norm($g['initiative'] ?? '');
            foreach ((array) ($g['activities'] ?? []) as $a) {
                if (! is_array($a)) {
                    continue;
                }
                $name = self::norm($a['name'] ?? '');
                $id = $a['id'] ?? null;
                if ($name === '' || ! is_string($id) || $id === '') {
                    continue;
                }
                $out[] = ['id' => $id, 'name' => $name, 'initiative' => $initiative];
            }
        }

        return $out;
    }

    /**
     * ينقل الأنشطة إلى op_gantt. يعيد [formData, stats].
     * stats: added (صفوف جديدة)، linked (صفوف قديمة رُبطت بنشاطها بالاسم)، renamed، missing (صفوف لنشاط حُذف).
     * الترتيب: صفوف الأنشطة المنقولة بترتيب «المبادرات التشغيلية»، ثم الصفوف اليدوية بترتيبها.
     */
    public static function syncGantt(?array $gantt, array $acts): array
    {
        $gantt = $gantt ?: [];
        $stats = ['added' => 0, 'linked' => 0, 'renamed' => 0, 'missing' => 0];

        // تنظيف الصفوف ودمج أي تكرار لنفس النشاط في صف واحد (مع الإبقاء على كل الأشهر المحددة)
        $rows = [];
        $first = [];
        foreach ((array) ($gantt['activities'] ?? []) as $r) {
            if (! is_array($r)) {
                continue;
            }
            $r['name'] = is_string($r['name'] ?? null) ? $r['name'] : '';
            $r['months'] = self::months($r['months'] ?? null);
            $sid = is_string($r['source_id'] ?? null) ? $r['source_id'] : '';
            if ($sid === '') {
                unset($r['source_id'], $r['source_missing']);
            }
            if ($sid !== '' && isset($first[$sid])) {
                $k = $first[$sid];
                foreach ($r['months'] as $mi => $v) {
                    $rows[$k]['months'][$mi] = ($rows[$k]['months'][$mi] || $v) ? 1 : 0;
                }

                continue;
            }
            if ($sid !== '') {
                $first[$sid] = count($rows);
            }
            $rows[] = $r;
        }

        $used = [];
        $linked = [];
        foreach ($acts as $a) {
            $i = $first[$a['id']] ?? null;
            if ($i === null) {
                // خطة قائمة قبل الربط: صف يدوي بالاسم نفسه يُربط بنشاطه بدل إضافة صف مكرر
                foreach ($rows as $j => $r) {
                    if (! isset($used[$j]) && ! isset($r['source_id']) && self::norm($r['name']) === $a['name']) {
                        $i = $j;
                        $stats['linked']++;
                        break;
                    }
                }
            }
            if ($i === null) {
                $linked[] = [
                    'source_id' => $a['id'],
                    'initiative' => $a['initiative'],
                    'name' => $a['name'],
                    'months' => array_fill(0, self::MONTHS, 0),
                ];
                $stats['added']++;

                continue;
            }
            $row = $rows[$i];
            if (isset($row['source_id']) && self::norm($row['name']) !== $a['name']) {
                $stats['renamed']++;
            }
            unset($row['source_missing']);
            $row['source_id'] = $a['id'];
            $row['initiative'] = $a['initiative'];
            $row['name'] = $a['name'];
            $used[$i] = true;
            $linked[] = $row;
        }

        $rest = [];
        foreach ($rows as $j => $r) {
            if (isset($used[$j])) {
                continue;
            }
            if (isset($r['source_id'])) {
                // النشاط الأصلي حُذف أو أُفرغ اسمه: يبقى الصف بأشهره ويُنبَّه المستخدم ليقرر حذفه
                $r['source_missing'] = true;
                $stats['missing']++;
            }
            $rest[] = $r;
        }

        $gantt['activities'] = array_merge($linked, $rest);

        return [$gantt, $stats];
    }

    /** المبادرات المختارة (المؤشَّر عليها) في op_import بترتيبها، بلا تكرار */
    public static function selectedInitiatives(?array $import): array
    {
        $out = [];
        foreach ((array) ($import['items'] ?? []) as $it) {
            if (! is_array($it) || empty($it['checked'])) {
                continue;
            }
            $name = self::norm($it['name'] ?? '');
            if ($name !== '' && ! in_array($name, $out, true)) {
                $out[] = $name;
            }
        }

        return $out;
    }

    /**
     * يضيف إلى op_activities مجموعة لكل مبادرة مختارة في الجزء الأول غير موجودة بعد.
     * لا يحذف شيئًا (إلغاء اختيار مبادرة لا يمس أنشطتها المسجلة). يعيد [formData, added]
     */
    public static function syncActivityGroups(?array $activities, array $selected): array
    {
        $activities = $activities ?: [];
        $groups = array_values(array_filter((array) ($activities['groups'] ?? []), 'is_array'));
        $existing = [];
        foreach ($groups as $g) {
            $existing[self::norm($g['initiative'] ?? '')] = true;
        }
        $added = 0;
        foreach ($selected as $name) {
            if (isset($existing[$name])) {
                continue;
            }
            $groups[] = [
                'initiative' => $name,
                'activities' => [['id' => self::newId(), 'name' => '', 'desc' => '', 'output' => '']],
            ];
            $existing[$name] = true;
            $added++;
        }
        $activities['groups'] = $groups;

        return [$activities, $added];
    }
}
