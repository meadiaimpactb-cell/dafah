<?php

namespace Database\Seeders;

use App\Models\QuestionnaireSection;
use App\Models\QuestionnaireQuestion;
use Illuminate\Database\Seeder;

class QuestionnaireSeeder extends Seeder
{
    public function run(): void
    {
        QuestionnaireQuestion::query()->delete();
        QuestionnaireSection::query()->delete();

        $policies = [
            1 => [
                'معلومات المنظمة' => [
                    ['question' => 'ما هو الاسم الرسمي للمنظمة؟',    'type' => 'text',   'required' => true,  'hint' => 'الاسم كما في السجل الرسمي', 'options' => null],
                    ['question' => 'ما نوع المنظمة؟',                 'type' => 'single', 'required' => true,  'hint' => null, 'options' => ['جمعية أهلية','مؤسسة أهلية','مؤسسة وقفية','شركة غير ربحية','كيان تطوعي']],
                    ['question' => 'كم عدد الموظفين في المنظمة؟',    'type' => 'single', 'required' => true,  'hint' => 'أدخل النطاق الأقرب', 'options' => ['أقل من 10','10-50','51-200','أكثر من 200']],
                ],
                'التوظيف والاستقطاب' => [
                    ['question' => 'ما إجراءات الاستقطاب والتوظيف المتبعة؟', 'type' => 'multiple', 'required' => true, 'hint' => null, 'options' => ['إعلانات داخلية','إعلانات خارجية','توصيات الموظفين','شركات التوظيف','منصات العمل الإلكترونية']],
                    ['question' => 'هل تعتمد المنظمة على وصف وظيفي موثق؟',   'type' => 'yesno',    'required' => true, 'hint' => null, 'options' => null],
                    ['question' => 'كم تستغرق فترة التجربة عادةً؟',            'type' => 'single',   'required' => false,'hint' => null, 'options' => ['شهر','3 أشهر','6 أشهر','لا تُطبق']],
                ],
                'ساعات العمل والإجازات' => [
                    ['question' => 'ما هو نظام ساعات العمل المعتمد؟',    'type' => 'single',   'required' => true, 'hint' => 'اختر نظام الدوام الأساسي', 'options' => ['5 أيام (40 ساعة)','6 أيام (48 ساعة)','دوام مرن','عمل عن بُعد']],
                    ['question' => 'ما أنواع الإجازات المتاحة للموظفين؟', 'type' => 'multiple', 'required' => true, 'hint' => null, 'options' => ['إجازة سنوية','إجازة مرضية','إجازة أمومة/أبوة','إجازة الحج','إجازة طارئة']],
                    ['question' => 'هل تمنح المنظمة ساعات عمل إضافية؟',  'type' => 'yesno',   'required' => false,'hint' => null, 'options' => null],
                ],
                'التعويضات والمزايا' => [
                    ['question' => 'ما آلية صرف الرواتب؟',               'type' => 'single',   'required' => true, 'hint' => null, 'options' => ['شهرياً','كل أسبوعين','أسبوعياً']],
                    ['question' => 'هل توجد بدلات أو حوافز إضافية؟',    'type' => 'yesno',   'required' => true, 'hint' => null, 'options' => null],
                    ['question' => 'ما أنواع المزايا التي تقدمها المنظمة؟','type' => 'multiple','required' => false,'hint' => null, 'options' => ['تأمين طبي','بدل سكن','بدل مواصلات','تأمين على الحياة','مكافأة سنوية']],
                ],
                'تقييم الأداء' => [
                    ['question' => 'كم مرة يُجرى تقييم الأداء سنوياً؟', 'type' => 'single', 'required' => true, 'hint' => null, 'options' => ['مرة واحدة','مرتان','ربع سنوي','شهري']],
                    ['question' => 'ما معايير التقييم المستخدمة؟',       'type' => 'text',   'required' => true, 'hint' => 'صف المعايير الرئيسية', 'options' => null],
                ],
                'التدريب والتطوير' => [
                    ['question' => 'هل تُخصص ميزانية للتدريب؟',                  'type' => 'yesno',    'required' => true, 'hint' => null, 'options' => null],
                    ['question' => 'ما أنواع برامج التدريب المقدمة؟',             'type' => 'multiple', 'required' => false,'hint' => null, 'options' => ['تدريب داخلي','دورات خارجية','تدريب إلكتروني','مؤتمرات','إرشاد مهني']],
                    ['question' => 'كم الساعات التدريبية المخصصة للموظف سنوياً؟', 'type' => 'single',  'required' => false,'hint' => null, 'options' => ['أقل من 20 ساعة','20-40 ساعة','40-80 ساعة','أكثر من 80 ساعة']],
                ],
                'إنهاء الخدمة' => [
                    ['question' => 'ما إجراءات الاستقالة المعتمدة؟',         'type' => 'text',   'required' => true, 'hint' => null, 'options' => null],
                    ['question' => 'هل توجد مكافأة نهاية خدمة؟',             'type' => 'yesno',  'required' => true, 'hint' => null, 'options' => null],
                    ['question' => 'ما مدة الإشعار المطلوبة قبل الاستقالة؟', 'type' => 'single', 'required' => true, 'hint' => null, 'options' => ['أسبوع','شهر','شهران','3 أشهر']],
                ],
                'السلوك والانضباط' => [
                    ['question' => 'هل يوجد نظام إجراءات تأديبية موثق؟',    'type' => 'yesno',    'required' => true, 'hint' => null, 'options' => null],
                    ['question' => 'ما أنواع المخالفات الجسيمة في منظمتكم؟', 'type' => 'multiple', 'required' => false,'hint' => null, 'options' => ['التغيب بلا إذن','إساءة استخدام الموارد','التحرش','الاحتيال','إفشاء أسرار العمل']],
                ],
            ],
            2 => [
                'معلومات المنظمة'          => [['question' => 'ما هو الاسم الرسمي للمنظمة؟', 'type' => 'text', 'required' => true, 'hint' => null, 'options' => null]],
                'الهوية البصرية'           => [['question' => 'هل توجد هوية بصرية موحدة للمنظمة؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null], ['question' => 'ما عناصر الهوية البصرية المعتمدة؟', 'type' => 'multiple', 'required' => false, 'hint' => null, 'options' => ['شعار','ألوان مؤسسية','خط موحد','قوالب رسمية']]],
                'التواصل الإعلامي'         => [['question' => 'ما قنوات التواصل الإعلامي التي تستخدمها المنظمة؟', 'type' => 'multiple', 'required' => true, 'hint' => null, 'options' => ['بيانات صحفية','مؤتمرات صحفية','نشرات إخبارية','موقع إلكتروني','تلفزيون/راديو']]],
                'وسائل التواصل الاجتماعي' => [['question' => 'هل توجد سياسة واضحة لاستخدام وسائل التواصل؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null], ['question' => 'من المسؤول عن إدارة حسابات المنظمة؟', 'type' => 'text', 'required' => true, 'hint' => null, 'options' => null]],
                'الأزمات الإعلامية'        => [['question' => 'هل توجد خطة إعلامية للتعامل مع الأزمات؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
                'المتحدث الرسمي'           => [['question' => 'من يتحدث باسم المنظمة رسمياً؟', 'type' => 'text', 'required' => true, 'hint' => null, 'options' => null]],
            ],
            3 => [
                'معلومات المنظمة'       => [['question' => 'ما هو الاسم الرسمي للمنظمة؟', 'type' => 'text', 'required' => true, 'hint' => null, 'options' => null]],
                'مجلس الإدارة'          => [['question' => 'كم عدد أعضاء مجلس الإدارة؟', 'type' => 'single', 'required' => true, 'hint' => null, 'options' => ['3-5 أعضاء','6-9 أعضاء','10 فأكثر']], ['question' => 'كم مدة الدورة لعضوية مجلس الإدارة؟', 'type' => 'single', 'required' => true, 'hint' => null, 'options' => ['سنة','سنتان','3 سنوات','4 سنوات']]],
                'اللجان'                => [['question' => 'هل توجد لجان متخصصة في المنظمة؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null], ['question' => 'ما أنواع اللجان الموجودة؟', 'type' => 'multiple', 'required' => false, 'hint' => null, 'options' => ['لجنة تدقيق','لجنة ترشيح','لجنة مكافآت','لجنة استراتيجية']]],
                'التصويت واتخاذ القرار' => [['question' => 'ما نصاب التصويت المعتمد لاتخاذ القرارات؟', 'type' => 'single', 'required' => true, 'hint' => null, 'options' => ['الأغلبية البسيطة','الأغلبية المطلقة','الإجماع']]],
                'تضارب المصالح'         => [['question' => 'هل توجد سياسة للإفصاح عن تضارب المصالح؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
                'الشفافية والإفصاح'     => [['question' => 'ما تقارير الإفصاح التي تصدرها المنظمة؟', 'type' => 'multiple', 'required' => false, 'hint' => null, 'options' => ['تقرير سنوي','تقرير مالي','تقرير الأثر','نشرة للمستفيدين']]],
                'المحاسبية'             => [['question' => 'هل توجد آلية لمراجعة أداء المجلس؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
            ],
            4 => [
                'معلومات المنظمة'          => [['question' => 'ما هو الاسم الرسمي للمنظمة؟', 'type' => 'text', 'required' => true, 'hint' => null, 'options' => null]],
                'قنوات استقبال التبرعات'  => [['question' => 'ما قنوات استقبال التبرعات المعتمدة؟', 'type' => 'multiple', 'required' => true, 'hint' => null, 'options' => ['تحويل بنكي','نقد','بطاقة ائتمان','منصات رقمية','شيكات']]],
                'أنواع التبرعات'           => [['question' => 'ما أنواع التبرعات التي تقبلها المنظمة؟', 'type' => 'multiple', 'required' => true, 'hint' => null, 'options' => ['نقدية','عينية','وقفية','مشروطة','تطوعية']]],
                'التوثيق والإيصالات'      => [['question' => 'هل تُصدر المنظمة إيصالات رسمية للتبرعات؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
                'التبرعات المشروطة'       => [['question' => 'هل تقبل المنظمة التبرعات المشروطة؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null], ['question' => 'ما شروط قبول التبرعات المقيدة؟', 'type' => 'text', 'required' => false, 'hint' => null, 'options' => null]],
                'الإفصاح المالي'          => [['question' => 'هل تنشر المنظمة تقاريرها المالية علناً؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
            ],
            5 => [
                'معلومات المنظمة'   => [['question' => 'ما هو الاسم الرسمي للمنظمة؟', 'type' => 'text', 'required' => true, 'hint' => null, 'options' => null]],
                'الميزانية السنوية' => [['question' => 'كيف تُعد الميزانية السنوية في منظمتكم؟', 'type' => 'text', 'required' => true, 'hint' => null, 'options' => null]],
                'صلاحيات الصرف'    => [['question' => 'ما الحد الأقصى لصلاحيات الصرف دون موافقة عليا؟', 'type' => 'single', 'required' => true, 'hint' => null, 'options' => ['أقل من 5000 ريال','5000-50000 ريال','أكثر من 50000 ريال']]],
                'المشتريات'         => [['question' => 'هل توجد لجنة مشتريات في المنظمة؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
                'التقارير المالية'  => [['question' => 'ما دورية إعداد التقارير المالية؟', 'type' => 'single', 'required' => true, 'hint' => null, 'options' => ['شهرية','ربع سنوية','نصف سنوية','سنوية']]],
                'التدقيق والمراجعة'=> [['question' => 'هل تستعين المنظمة بمدقق خارجي؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
            ],
            6 => [
                'معلومات المنظمة'   => [['question' => 'ما هو الاسم الرسمي للمنظمة؟', 'type' => 'text', 'required' => true, 'hint' => null, 'options' => null]],
                'جمع البيانات'      => [['question' => 'ما أنواع البيانات التي تجمعها المنظمة؟', 'type' => 'multiple', 'required' => true, 'hint' => null, 'options' => ['بيانات شخصية','بيانات مالية','بيانات صحية','بيانات تواصل','بيانات سلوكية']]],
                'تخزين البيانات'    => [['question' => 'أين وكيف تُخزَّن بيانات المستفيدين؟', 'type' => 'text', 'required' => true, 'hint' => null, 'options' => null]],
                'مشاركة البيانات'   => [['question' => 'هل تُشارك المنظمة البيانات مع جهات خارجية؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
                'حقوق المستفيد'     => [['question' => 'هل يمكن للمستفيد طلب حذف بياناته؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
                'الإفصاح والشفافية' => [['question' => 'هل توجد سياسة خصوصية معلنة؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
            ],
            7 => [
                'معلومات المنظمة'  => [['question' => 'ما هو الاسم الرسمي للمنظمة؟', 'type' => 'text', 'required' => true, 'hint' => null, 'options' => null]],
                'إطار المتابعة'    => [['question' => 'ما الأداة المستخدمة لمتابعة الأهداف؟', 'type' => 'text', 'required' => true, 'hint' => null, 'options' => null]],
                'أدوات التقييم'    => [['question' => 'ما أدوات التقييم المستخدمة في المنظمة؟', 'type' => 'multiple', 'required' => true, 'hint' => null, 'options' => ['استبانات','مقابلات','ملاحظة مباشرة','مراجعة وثائق','مؤشرات رقمية']]],
                'مؤشرات الأداء'    => [['question' => 'هل توجد مؤشرات KPIs محددة للبرامج؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
                'التقارير الدورية' => [['question' => 'ما دورية إصدار تقارير الأداء؟', 'type' => 'single', 'required' => true, 'hint' => null, 'options' => ['شهرية','ربع سنوية','نصف سنوية','سنوية']]],
                'التحسين المستمر'  => [['question' => 'هل توجد آلية لتوظيف نتائج التقييم في التحسين؟', 'type' => 'yesno', 'required' => true, 'hint' => null, 'options' => null]],
            ],
        ];

        foreach ($policies as $policyTypeId => $sections) {
            $secOrder = 0;
            foreach ($sections as $secName => $questions) {
                $section = QuestionnaireSection::create([
                    'policy_type_id' => $policyTypeId,
                    'name'           => $secName,
                    'sort_order'     => $secOrder++,
                ]);
                foreach ($questions as $qOrder => $q) {
                    QuestionnaireQuestion::create([
                        'section_id'  => $section->id,
                        'question'    => $q['question'],
                        'type'        => $q['type'],
                        'options'     => $q['options'],
                        'required'    => $q['required'],
                        'hint'        => $q['hint'],
                        'sort_order'  => $qOrder,
                    ]);
                }
            }
        }
    }
}
