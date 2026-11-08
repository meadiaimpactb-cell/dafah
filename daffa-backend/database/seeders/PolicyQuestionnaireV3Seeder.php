<?php

namespace Database\Seeders;

use App\Models\QuestionnaireQuestion;
use App\Models\QuestionnaireSection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * استبيانات حزمة سياسات دفة الإصدار 3.0 (19 وثيقة).
 * المصدر: resources/policies/v3/questionnaires.json — مشتقة من حقول التخصيص في كل وثيقة.
 * آمن لإعادة التشغيل: لا يُنشئ إلا استبيانات السياسات التي لا تملك أقسامًا بعد،
 * حتى لا تتغير أرقام الأسئلة التي ترتبط بها إجابات العملاء أو تعديلات المشرف.
 */
class PolicyQuestionnaireV3Seeder extends Seeder
{
    public function run(): void
    {
        $path = resource_path('policies/v3/questionnaires.json');
        $data = json_decode(file_get_contents($path), true);

        DB::transaction(function () use ($data) {
            $seeded = QuestionnaireSection::whereIn('policy_type_id', collect($data)->pluck('policy_type_id'))
                ->distinct()
                ->pluck('policy_type_id')
                ->all();

            foreach ($data as $policy) {
                if (in_array($policy['policy_type_id'], $seeded)) {
                    continue;
                }

                foreach ($policy['sections'] as $sOrder => $sec) {
                    $section = QuestionnaireSection::create([
                        'policy_type_id' => $policy['policy_type_id'],
                        'name'           => $sec['name'],
                        'sort_order'     => $sOrder,
                    ]);

                    foreach ($sec['questions'] as $qOrder => $q) {
                        QuestionnaireQuestion::create([
                            'section_id' => $section->id,
                            'question'   => $q['question'],
                            'type'       => $q['type'],
                            'options'    => $q['options'] ?? null,
                            'required'   => (bool) ($q['required'] ?? false),
                            'hint'       => $q['hint'] ?? null,
                            'sort_order' => $qOrder,
                        ]);
                    }
                }
            }
        });
    }
}
