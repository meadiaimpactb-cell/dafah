<?php

namespace App\Support;

use App\Models\PolicySelection;
use App\Models\QuestionnaireSection;

/**
 * مدى اكتمال استمارة سياسة: عدد الأسئلة المُجابة والمطلوبة الناقصة وأقسامها.
 * يُعرض للعميل (حالة واضحة + زر الإرسال) ويُستخدم للتحقق قبل الإرسال للمراجعة.
 * يعتمد على QuestionRules: الأسئلة المخفية بشرط لا تُحتسب، والإجابة غير الصالحة
 * (رقم سالب، تاريخ غير صحيح، «أخرى» بلا توضيح، خيارات متناقضة…) تُعدّ ناقصة.
 */
class PolicyCompletion
{
    private static array $sections = [];

    public static function sections(int $policyTypeId)
    {
        return self::$sections[$policyTypeId] ??= QuestionnaireSection::where('policy_type_id', $policyTypeId)
            ->with(['questions' => fn ($q) => $q->orderBy('sort_order')->orderBy('id')])
            ->orderBy('sort_order')->orderBy('id')
            ->get();
    }

    public static function filled($value): bool
    {
        return QuestionRules::filled($value);
    }

    /**
     * @return array{total:int,answered:int,required:int,required_missing:int,complete:bool,missing_sections:array<int,string>,problems:array}
     */
    public static function of(PolicySelection $selection, ?array $answers = null): array
    {
        $answers ??= is_array($selection->form_data) ? $selection->form_data : [];
        $total = $answered = $required = $missing = 0;
        $missingSections = [];
        $problems = [];

        foreach (self::sections((int) $selection->policy_type_id) as $section) {
            $sectionMissing = 0;
            foreach ($section->questions as $q) {
                $r = QuestionRules::evaluate($q, $answers);
                if ($r['status'] === 'hidden') {
                    continue;
                }
                $total++;
                $isFilled = QuestionRules::filled($answers["q{$q->id}"] ?? null) || (! empty($q->meta['fields']) && $r['status'] !== 'missing');
                if ($isFilled && $r['status'] === 'ok') {
                    $answered++;
                }
                if ($q->required) {
                    $required++;
                }
                if ($r['status'] !== 'ok' && ($q->required || $r['status'] === 'invalid')) {
                    $missing++;
                    $sectionMissing++;
                    $problems[] = ['q' => $q->id, 'section' => $section->name, 'msg' => $r['msg']];
                }
            }
            if ($sectionMissing > 0) {
                $missingSections[] = $section->name;
            }
        }

        return [
            'total' => $total,
            'answered' => $answered,
            'required' => $required,
            'required_missing' => $missing,
            'complete' => $total > 0 && $missing === 0,
            'missing_sections' => $missingSections,
            'problems' => $problems,
        ];
    }
}
