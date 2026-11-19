<?php

namespace App\Support;

/**
 * قواعد أسئلة استبيانات السياسات — النسخة الخادمية (المرجع النهائي قبل الإرسال).
 * مطابقة لدلالة daffa-frontend/src/pages/policies/questionRules.js.
 *
 * meta المدعومة:
 *  input: text|date|number · min · max · integer · unit
 *  exclusive: [خيارات تُلغي غيرها في الاختيار المتعدد]
 *  other: {options:[..], label, input?, placeholder?}   → إجابة إضافية q{id}__other مطلوبة عند اختيار أحدها
 *  show_if: {q, in:[..]} | {q, not_in:[..]} | {q, has:[..]} | {q, not_has:[..]}
 *  fields: [{key,label,input,min,max,integer,unit,options,required,show_if_opt:{q,has:[..]}}]  → q{id} نص مجمّع + q{id}__parts
 *  checks: [{lte:[a,b],msg}, {eq_product:[a,b,c],msg}]
 *  force:  {q?, in?:[..], options:[..]}  → خيارات إلزامية مثبّتة
 */
class QuestionRules
{
    public static function toLatinDigits(string $s): string
    {
        $s = strtr($s, ['٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9', '٫' => '.']);

        return str_replace([',', '٬', ' ', '%', 'ريال'], '', $s);
    }

    public static function num($v): ?float
    {
        if ($v === null) {
            return null;
        }
        $s = trim(self::toLatinDigits((string) $v));
        if ($s === '' || ! is_numeric($s)) {
            return null;
        }

        return (float) $s;
    }

    public static function filled($value): bool
    {
        if (is_array($value)) {
            return count($value) > 0;
        }

        return $value !== null && trim((string) $value) !== '';
    }

    /** هل يظهر السؤال بحسب إجابات الأسئلة الأخرى؟ */
    public static function visible(array $meta, array $answers): bool
    {
        $c = $meta['show_if'] ?? null;
        if (! $c || empty($c['q'])) {
            return true;
        }
        $v = $answers['q'.$c['q']] ?? null;
        if (isset($c['in'])) {
            return ! is_array($v) && in_array((string) $v, $c['in'], true);
        }
        if (isset($c['not_in'])) {
            return ! self::filled($v) || (! is_array($v) && ! in_array((string) $v, $c['not_in'], true));
        }
        $arr = is_array($v) ? $v : (self::filled($v) ? [(string) $v] : []);
        if (isset($c['has'])) {
            return count(array_intersect($arr, $c['has'])) > 0;
        }
        if (isset($c['not_has'])) {
            return count(array_intersect($arr, $c['not_has'])) === 0;
        }

        return true;
    }

    /** الخيارات المثبّتة إلزاميًا بحسب force */
    public static function forced(array $meta, array $answers): array
    {
        $f = $meta['force'] ?? null;
        if (! $f || empty($f['options'])) {
            return [];
        }
        if (! empty($f['q'])) {
            $v = $answers['q'.$f['q']] ?? null;
            $arr = is_array($v) ? $v : (self::filled($v) ? [(string) $v] : []);
            if (isset($f['in']) && count(array_intersect($arr, $f['in'])) === 0) {
                return [];
            }
        }

        return $f['options'];
    }

    private static function checkNumber($raw, array $spec, string $label = ''): ?string
    {
        $n = self::num($raw);
        $pfx = $label !== '' ? "«{$label}»: " : '';
        if ($n === null) {
            return $pfx.'أدخل رقمًا صحيحًا';
        }
        if (! empty($spec['integer']) && floor($n) != $n) {
            return $pfx.'أدخل عددًا صحيحًا بلا كسور';
        }
        if (isset($spec['min']) && $n < $spec['min']) {
            return $pfx.'لا يمكن أن تقل القيمة عن '.$spec['min'].(isset($spec['unit']) ? ' '.$spec['unit'] : '');
        }
        if (isset($spec['max']) && $n > $spec['max']) {
            return $pfx.'لا يمكن أن تزيد القيمة على '.$spec['max'].(isset($spec['unit']) ? ' '.$spec['unit'] : '');
        }

        return null;
    }

    private static function checkDate($raw): ?string
    {
        $s = trim(self::toLatinDigits((string) $raw));
        if (! preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m) || ! checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
            return 'أدخل تاريخًا صحيحًا';
        }

        return null;
    }

    /**
     * يقيّم سؤالًا واحدًا.
     *
     * @return array{status:'ok'|'missing'|'invalid'|'hidden', msg:?string}
     */
    public static function evaluate(object $q, array $answers): array
    {
        $meta = is_array($q->meta) ? $q->meta : [];
        if (! self::visible($meta, $answers)) {
            return ['status' => 'hidden', 'msg' => null];
        }

        $key = 'q'.$q->id;
        $value = $answers[$key] ?? null;
        $req = (bool) $q->required;

        // ── مركّب بعدة خانات
        if (! empty($meta['fields'])) {
            $parts = $answers[$key.'__parts'] ?? null;
            $parts = is_array($parts) ? $parts : [];
            $missing = false;
            $visibleKeys = [];
            foreach ($meta['fields'] as $f) {
                if (! empty($f['show_if_opt'])) {
                    $sv = $answers['q'.$f['show_if_opt']['q']] ?? null;
                    $arr = is_array($sv) ? $sv : (self::filled($sv) ? [(string) $sv] : []);
                    if (count(array_intersect($arr, $f['show_if_opt']['has'] ?? [])) === 0) {
                        continue;
                    }
                }
                $visibleKeys[] = $f['key'];
                $pv = $parts[$f['key']] ?? null;
                $fReq = $f['required'] ?? true;
                if (! self::filled($pv)) {
                    if ($fReq) {
                        $missing = true;
                    }

continue;
                }
                if (($f['input'] ?? 'text') === 'number' && ($e = self::checkNumber($pv, $f, $f['label'] ?? ''))) {
                    return ['status' => 'invalid', 'msg' => $e];
                }
                if (($f['input'] ?? 'text') === 'date' && ($e = self::checkDate($pv))) {
                    return ['status' => 'invalid', 'msg' => ($f['label'] ?? '').': '.$e];
                }
            }
            if ($missing) {
                return $req ? ['status' => 'missing', 'msg' => 'أكمل جميع الخانات المطلوبة'] : ['status' => 'ok', 'msg' => null];
            }
            // الفحوص المتقاطعة على الخانات الظاهرة فقط
            $parts = array_intersect_key($parts, array_flip($visibleKeys));
            foreach ($meta['checks'] ?? [] as $c) {
                if (isset($c['lte'])) {
                    [$a, $b] = $c['lte'];
                    $na = self::num($parts[$a] ?? null);
                    $nb = self::num($parts[$b] ?? null);
                    if ($na !== null && $nb !== null && $na > $nb) {
                        return ['status' => 'invalid', 'msg' => $c['msg'] ?? 'القيم متعارضة'];
                    }
                }
                if (isset($c['eq_product'])) {
                    [$a, $b, $cc] = $c['eq_product'];
                    $na = self::num($parts[$a] ?? null);
                    $nb = self::num($parts[$b] ?? null);
                    $nc = self::num($parts[$cc] ?? null);
                    if ($na !== null && $nb !== null && $nc !== null && abs($na - $nb * $nc) > 0.01) {
                        return ['status' => 'invalid', 'msg' => $c['msg'] ?? 'القيم غير متسقة'];
                    }
                }
            }

            return ['status' => 'ok', 'msg' => null];
        }

        if (! self::filled($value)) {
            return $req ? ['status' => 'missing', 'msg' => 'هذا السؤال مطلوب'] : ['status' => 'ok', 'msg' => null];
        }

        if ($q->type === 'multiple') {
            $vals = is_array($value) ? $value : [];
            $ex = array_intersect($vals, $meta['exclusive'] ?? []);
            if (count($ex) > 0 && count($vals) > 1) {
                return ['status' => 'invalid', 'msg' => 'لا يمكن الجمع بين «'.reset($ex).'» وخيارات أخرى'];
            }
            $forced = self::forced($meta, $answers);
            if ($forced && count(array_diff($forced, $vals)) > 0) {
                return ['status' => 'invalid', 'msg' => 'الخيارات الإلزامية يجب أن تبقى محددة: '.implode('، ', $forced)];
            }
        }

        if ($q->type === 'text') {
            $input = $meta['input'] ?? 'text';
            if ($input === 'number' && ($e = self::checkNumber($value, $meta))) {
                return ['status' => 'invalid', 'msg' => $e];
            }
            if ($input === 'date' && ($e = self::checkDate($value))) {
                return ['status' => 'invalid', 'msg' => $e];
            }
        }

        // ── «أخرى» تستلزم توضيحًا
        $other = $meta['other'] ?? null;
        if ($other && ! empty($other['options'])) {
            $chosen = is_array($value) ? count(array_intersect($value, $other['options'])) > 0 : in_array((string) $value, $other['options'], true);
            if ($chosen) {
                $ov = $answers[$key.'__other'] ?? null;
                if (! self::filled($ov)) {
                    return ['status' => 'missing', 'msg' => ($other['label'] ?? 'حدّد المقصود بـ«أخرى»').' — مطلوب'];
                }
                if (($other['input'] ?? 'text') === 'date' && ($e = self::checkDate($ov))) {
                    return ['status' => 'invalid', 'msg' => $e];
                }
            }
        }

        return ['status' => 'ok', 'msg' => null];
    }
}
