<?php

namespace App\Support;

/**
 * قواعد أسئلة استبيانات السياسات — النسخة الخادمية (المرجع النهائي قبل الإرسال).
 * مطابقة لدلالة daffa-frontend/src/pages/policies/questionRules.js.
 *
 * meta المدعومة:
 *  input: text|date|number|phone · min · max · integer · unit
 *  no_negative: true            → نص حر لا يقبل أرقامًا سالبة (مبالغ ومدد داخل نص)
 *  exclusive: [خيارات تُلغي غيرها في الاختيار المتعدد]
 *  other: {options:[..], label, input?, placeholder?, optional?}  → إجابة إضافية q{id}__other (مطلوبة ما لم تكن optional)
 *  show_if: {q, in|not_in|has|not_has:[..]} | {any:[شروط]} | {all:[شروط]}
 *  fields: [{key,label,input,min,max,integer,unit,options,required,show_if_opt:{q,has:[..]}}]  → q{id} نص مجمّع + q{id}__parts
 *  checks: [{lte:[a,b],msg}, {eq_product:[a,b,c],msg}, {sum_eq:[[keys],total],msg}, {lte_q:[field,qid,qfield?],msg}]
 *  force:  {q?, in?:[..], options:[..]}  → خيارات إلزامية مثبّتة
 *  require: {all:[..], or_any:[..], msg} → خيارات يجب أن يشملها الاختيار المتعدد (أو أحد بدائلها)
 *  conflicts: [{q, in|has|not_has:[..], self_in|self_has:[..], msg}] → تعارض مع إجابة سؤال آخر
 */
class QuestionRules
{
    public static function toLatinDigits(string $s): string
    {
        $s = strtr($s, ['٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9', '٫' => '.', '−' => '-']);

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

    private static function asArr($v): array
    {
        return is_array($v) ? $v : (self::filled($v) ? [(string) $v] : []);
    }

    /** يتحقق شرطًا واحدًا {q, in|not_in|has|not_has} أو مركّبًا {any|all} */
    public static function cond(array $c, array $answers): bool
    {
        if (isset($c['any'])) {
            foreach ($c['any'] as $sub) {
                if (self::cond($sub, $answers)) {
                    return true;
                }
            }

            return false;
        }
        if (isset($c['all'])) {
            foreach ($c['all'] as $sub) {
                if (! self::cond($sub, $answers)) {
                    return false;
                }
            }

            return true;
        }
        if (empty($c['q'])) {
            return true;
        }
        $v = $answers['q'.$c['q']] ?? null;
        if (isset($c['in'])) {
            return ! is_array($v) && in_array((string) $v, $c['in'], true);
        }
        if (isset($c['not_in'])) {
            return ! self::filled($v) || (! is_array($v) && ! in_array((string) $v, $c['not_in'], true));
        }
        $arr = self::asArr($v);
        if (isset($c['has'])) {
            return count(array_intersect($arr, $c['has'])) > 0;
        }
        if (isset($c['not_has'])) {
            return count(array_intersect($arr, $c['not_has'])) === 0;
        }

        return true;
    }

    /** هل يظهر السؤال بحسب إجابات الأسئلة الأخرى؟ */
    public static function visible(array $meta, array $answers): bool
    {
        $c = $meta['show_if'] ?? null;
        if (! $c) {
            return true;
        }

        return self::cond($c, $answers);
    }

    /** الخيارات المثبّتة إلزاميًا بحسب force */
    public static function forced(array $meta, array $answers): array
    {
        $f = $meta['force'] ?? null;
        if (! $f || empty($f['options'])) {
            return [];
        }
        if (! empty($f['q'])) {
            $arr = self::asArr($answers['q'.$f['q']] ?? null);
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
        if (($spec['min'] ?? null) === 0 && $n < 0) {
            return $pfx.'لا يمكن أن تكون هذه القيمة سالبة. أدخل قيمة تساوي صفرًا أو أكثر';
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

    /** رقم هاتف أو تحويلة: أرقام فقط مع + - ( ) والمسافات، من 3 إلى 15 رقمًا */
    private static function checkPhone($raw, array $spec): ?string
    {
        $s = strtr(trim((string) $raw), ['٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9']);
        $digits = preg_replace('/\D/', '', $s);
        if (! preg_match('/^[\d\s+\-()]+$/u', $s) || strlen($digits) < 3 || strlen($digits) > 15) {
            return $spec['msg'] ?? 'أدخل رقم الاتصال أو رقم التحويلة بالأرقام';
        }

        return null;
    }

    /** نص حر يحوي رقمًا سالبًا (مثل «-100 ريال» أو «- 5 أيام») */
    public static function hasNegative($raw): bool
    {
        $s = strtr((string) $raw, ['٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9', '−' => '-']);

        return (bool) preg_match('/(^|[^\p{L}\p{N}])-\s*\d/u', $s);
    }

    /** القيمة الرقمية لسؤال آخر (أو لخانة فيه) */
    private static function otherNum(array $answers, $qid, ?string $field): ?float
    {
        if ($field) {
            $p = $answers['q'.$qid.'__parts'] ?? null;

            return is_array($p) ? self::num($p[$field] ?? null) : null;
        }

        return self::num($answers['q'.$qid] ?? null);
    }

    /** تعارض مع إجابة سؤال آخر */
    private static function conflict(array $meta, $value, array $answers): ?string
    {
        $mine = self::asArr($value);
        foreach ($meta['conflicts'] ?? [] as $c) {
            $selfHit = isset($c['self_in']) ? (! is_array($value) && in_array((string) $value, $c['self_in'], true))
                : (isset($c['self_has']) ? count(array_intersect($mine, $c['self_has'])) > 0 : true);
            if (! $selfHit) {
                continue;
            }
            $ov = $answers['q'.$c['q']] ?? null;
            if (! self::filled($ov)) {
                continue;
            }
            if (self::cond(array_intersect_key($c, array_flip(['q', 'in', 'not_in', 'has', 'not_has'])), $answers)) {
                return $c['msg'] ?? 'هذه الإجابة تتعارض مع إجابة سابقة';
            }
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
            $any = false;
            $visibleKeys = [];
            foreach ($meta['fields'] as $f) {
                if (! empty($f['show_if_opt'])) {
                    $arr = self::asArr($answers['q'.$f['show_if_opt']['q']] ?? null);
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
                $any = true;
                $input = $f['input'] ?? 'text';
                if ($input === 'number' && ($e = self::checkNumber($pv, $f, $f['label'] ?? ''))) {
                    return ['status' => 'invalid', 'msg' => $e];
                }
                if ($input === 'date' && ($e = self::checkDate($pv))) {
                    return ['status' => 'invalid', 'msg' => ($f['label'] ?? '').': '.$e];
                }
                if ($input === 'phone' && ($e = self::checkPhone($pv, $f))) {
                    return ['status' => 'invalid', 'msg' => ($f['label'] ?? '').': '.$e];
                }
                if ($input === 'text' && self::hasNegative($pv)) {
                    return ['status' => 'invalid', 'msg' => '«'.($f['label'] ?? '').'»: لا يمكن أن تكون هذه القيمة سالبة. أدخل قيمة صحيحة'];
                }
            }
            if ($missing) {
                // سؤال اختياري: يكفي تركه فارغًا كله؛ أما بدء تعبئته فيستلزم إكمال خاناته المطلوبة
                if ($req) {
                    return ['status' => 'missing', 'msg' => 'أكمل جميع الخانات المطلوبة'];
                }
                if ($any) {
                    return ['status' => 'invalid', 'msg' => 'أكمل بقية خانات هذا السؤال أو اتركها كلها فارغة'];
                }

                return ['status' => 'ok', 'msg' => null];
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
                if (isset($c['sum_eq'])) {
                    [$keys, $total] = $c['sum_eq'];
                    $sum = 0;
                    $all = true;
                    foreach ($keys as $k) {
                        $n = self::num($parts[$k] ?? null);
                        if ($n === null) {
                            $all = false;
                            break;
                        }
                        $sum += $n;
                    }
                    if ($all && abs($sum - $total) > 0.01) {
                        return ['status' => 'invalid', 'msg' => $c['msg'] ?? "مجموع القيم يجب أن يساوي {$total}"];
                    }
                }
                if (isset($c['lte_q'])) {
                    [$a, $qid] = $c['lte_q'];
                    $na = self::num($parts[$a] ?? null);
                    $nb = self::otherNum($answers, $qid, $c['lte_q'][2] ?? null);
                    if ($na !== null && $nb !== null && $na > $nb) {
                        return ['status' => 'invalid', 'msg' => $c['msg'] ?? 'القيمة تتجاوز الحد المرتبط بها'];
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
            if (! empty($meta['require']['all'])) {
                $r = $meta['require'];
                $alt = count(array_intersect($vals, $r['or_any'] ?? [])) > 0;
                if (! $alt && count(array_diff($r['all'], $vals)) > 0) {
                    return ['status' => 'invalid', 'msg' => $r['msg'] ?? 'يجب أن يشمل الاختيار: '.implode('، ', $r['all'])];
                }
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
            if ($input === 'phone' && ($e = self::checkPhone($value, $meta))) {
                return ['status' => 'invalid', 'msg' => $e];
            }
            if ($input === 'text' && ! empty($meta['no_negative']) && self::hasNegative($value)) {
                return ['status' => 'invalid', 'msg' => 'لا يمكن أن تكون هذه القيمة سالبة. أدخل قيمة صحيحة'];
            }
        }

        // ── «أخرى» وما يشبهها تستلزم توضيحًا
        $other = $meta['other'] ?? null;
        if ($other && ! empty($other['options'])) {
            $chosen = is_array($value) ? count(array_intersect($value, $other['options'])) > 0 : in_array((string) $value, $other['options'], true);
            if ($chosen) {
                $ov = $answers[$key.'__other'] ?? null;
                if (! self::filled($ov)) {
                    if (empty($other['optional'])) {
                        return ['status' => 'missing', 'msg' => ($other['label'] ?? 'حدّد المقصود بـ«أخرى»').' — مطلوب'];
                    }
                } else {
                    $oi = $other['input'] ?? 'text';
                    if ($oi === 'date' && ($e = self::checkDate($ov))) {
                        return ['status' => 'invalid', 'msg' => $e];
                    }
                    if ($oi === 'number' && ($e = self::checkNumber($ov, $other, $other['label'] ?? ''))) {
                        return ['status' => 'invalid', 'msg' => $e];
                    }
                    if ($oi === 'text' && self::hasNegative($ov)) {
                        return ['status' => 'invalid', 'msg' => '«'.($other['label'] ?? '').'»: لا يمكن أن تكون هذه القيمة سالبة'];
                    }
                }
            }
        }

        if ($e = self::conflict($meta, $value, $answers)) {
            return ['status' => 'invalid', 'msg' => $e];
        }

        return ['status' => 'ok', 'msg' => null];
    }
}
