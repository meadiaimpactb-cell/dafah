<?php

namespace App\Support;

use App\Models\PolicySelection;
use App\Models\QuestionnaireSection;

/**
 * مدى اكتمال استمارة سياسة: عدد الأسئلة المُجابة والمطلوبة الناقصة وأقسامها.
 * يُعرض للعميل (حالة واضحة + زر الإرسال) ويُستخدم للتحقق قبل الإرسال للمراجعة.
 * قاعدة «مُجاب» مطابقة للواجهة: الاختيار المتعدد مصفوفة غير فارغة، وغيره نص غير فارغ.
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
        if (is_array($value)) {
            return count($value) > 0;
        }
        return $value !== null && trim((string) $value) !== '';
    }

    /**
     * @return array{total:int,answered:int,required:int,required_missing:int,complete:bool,missing_sections:array<int,string>}
     */
    public static function of(PolicySelection $selection, ?array $answers = null): array
    {
        $answers ??= is_array($selection->form_data) ? $selection->form_data : [];
        $total = $answered = $required = $missing = 0;
        $missingSections = [];

        foreach (self::sections((int) $selection->policy_type_id) as $section) {
            $sectionMissing = 0;
            foreach ($section->questions as $q) {
                $total++;
                $isFilled = self::filled($answers["q{$q->id}"] ?? null);
                if ($isFilled) {
                    $answered++;
                }
                if ($q->required) {
                    $required++;
                    if (!$isFilled) {
                        $missing++;
                        $sectionMissing++;
                    }
                }
            }
            if ($sectionMissing > 0) {
                $missingSections[] = $section->name;
            }
        }

        return [
            'total'            => $total,
            'answered'         => $answered,
            'required'         => $required,
            'required_missing' => $missing,
            'complete'         => $total > 0 && $missing === 0,
            'missing_sections' => $missingSections,
        ];
    }
}
