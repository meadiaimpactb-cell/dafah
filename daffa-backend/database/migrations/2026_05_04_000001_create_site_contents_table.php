<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_contents', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('group', 50)->index();
            $table->string('label');
            $table->text('value')->nullable();
            $table->string('type', 20)->default('text');
            $table->timestamps();
        });

        $now = now();
        $rows = [
            // ── Landing ────────────────────────────────────────────────────────
            ['group'=>'landing','key'=>'hero_title',           'label'=>'عنوان الهيرو الرئيسي',            'type'=>'text',     'value'=>'نظام البناء الاستراتيجي والتشغيلي للمنظمات غير الربحية'],
            ['group'=>'landing','key'=>'hero_subtitle',        'label'=>'العنوان الفرعي للهيرو',            'type'=>'text',     'value'=>'فكرة النظام وآلية العمل'],
            ['group'=>'landing','key'=>'how_it_works_desc',    'label'=>'وصف آلية العمل',                  'type'=>'textarea', 'value'=>'يعمل النظام بشكل شبه آلي، بحيث يوجد مستشار متخصص يراجع عن بعد مخرجات كل مرحلة، بحيث يعتمد المخطط في الجهات غير الربحية على التوجيه المسجل لكل مرحلة لبناء الخطة والسياسات.'],
            ['group'=>'landing','key'=>'step1_title',          'label'=>'الخطوة 1 - العنوان',               'type'=>'text',     'value'=>'اختر الخدمة'],
            ['group'=>'landing','key'=>'step1_desc',           'label'=>'الخطوة 1 - الوصف',                'type'=>'text',     'value'=>'التخطيط الاستراتيجي أو التشغيلي أو السياسات'],
            ['group'=>'landing','key'=>'step2_title',          'label'=>'الخطوة 2 - العنوان',               'type'=>'text',     'value'=>'ادفع واختر المستشار'],
            ['group'=>'landing','key'=>'step2_desc',           'label'=>'الخطوة 2 - الوصف',                'type'=>'text',     'value'=>'أسعار مناسبة مع اختيار المستشار المناسب'],
            ['group'=>'landing','key'=>'step3_title',          'label'=>'الخطوة 3 - العنوان',               'type'=>'text',     'value'=>"تعلّم ونفّذ"],
            ['group'=>'landing','key'=>'step3_desc',           'label'=>'الخطوة 3 - الوصف',                'type'=>'text',     'value'=>'فيديوهات + شرح + إرشادات + نماذج عمل'],
            ['group'=>'landing','key'=>'step4_title',          'label'=>'الخطوة 4 - العنوان',               'type'=>'text',     'value'=>'المستشار يراجع ويعتمد'],
            ['group'=>'landing','key'=>'step4_desc',           'label'=>'الخطوة 4 - الوصف',                'type'=>'text',     'value'=>'مراجعة واعتماد من مستشار متخصص عن بعد'],
            ['group'=>'landing','key'=>'comp_strategic_desc',  'label'=>'وصف نظام الاستراتيجي (الرئيسية)', 'type'=>'textarea', 'value'=>'11 وحدة تخطيطية لبناء خطة استراتيجية متكاملة تشمل تحليل البيئة والتوجهات والمبادرات'],
            ['group'=>'landing','key'=>'comp_strategic_badge', 'label'=>'شارة نظام الاستراتيجي',           'type'=>'text',     'value'=>'11 وحدة'],
            ['group'=>'landing','key'=>'comp_operational_desc','label'=>'وصف نظام التشغيلي (الرئيسية)',    'type'=>'textarea', 'value'=>'5 وحدات لتحويل الاستراتيجية إلى خطة تنفيذية بالأنشطة والجدول الزمني والميزانية'],
            ['group'=>'landing','key'=>'comp_operational_badge','label'=>'شارة نظام التشغيلي',             'type'=>'text',     'value'=>'5 وحدات'],
            ['group'=>'landing','key'=>'comp_policies_desc',   'label'=>'وصف نظام السياسات (الرئيسية)',    'type'=>'textarea', 'value'=>'7 سياسات ولوائح تُبنى عبر استبيانات ذكية موجهة والنظام يولّد السياسة تلقائياً'],
            ['group'=>'landing','key'=>'comp_policies_badge',  'label'=>'شارة نظام السياسات',              'type'=>'text',     'value'=>'7 سياسات'],
            ['group'=>'landing','key'=>'pricing_point1',       'label'=>'نقطة التسعير 1',                  'type'=>'textarea', 'value'=>'يتم وضع أسعار قليلة التكلفة وللجهة اختيار المستشار عن بعد من القائمة'],
            ['group'=>'landing','key'=>'pricing_point2',       'label'=>'نقطة التسعير 2',                  'type'=>'textarea', 'value'=>'يتاح اعتماد الخطة من احدى الجهات في النظام بتكلفة إضافية'],
            ['group'=>'landing','key'=>'pricing_point3',       'label'=>'نقطة التسعير 3',                  'type'=>'textarea', 'value'=>'يتم عرض أنظمة بناء السياسات واللوائح بأسعار مستقلة'],
            ['group'=>'landing','key'=>'pricing_point4',       'label'=>'نقطة التسعير 4',                  'type'=>'textarea', 'value'=>'يتاح خيار تحكيم السياسات واللوائح من احد المستشارين بتكلفة إضافية'],
            ['group'=>'landing','key'=>'pricing_point5',       'label'=>'نقطة التسعير 5',                  'type'=>'textarea', 'value'=>'يتم إتاحة تنزيل الملفات بشكل مصمم تلقائياً ويتاح خدمة التصميم بمقابل'],
            ['group'=>'landing','key'=>'cta_title',            'label'=>'عنوان قسم CTA',                   'type'=>'text',     'value'=>'ابدأ رحلة التخطيط الاستراتيجي لمنظمتك الآن'],

            // ── About ──────────────────────────────────────────────────────────
            ['group'=>'about','key'=>'about_hero_subtitle',   'label'=>'العنوان الفرعي - عن دفة',         'type'=>'text',     'value'=>'للتخطيط الاستراتيجي وصناعة السياسات'],
            ['group'=>'about','key'=>'vision_text',           'label'=>'نص الرؤية',                       'type'=>'textarea', 'value'=>'أن نكون المنصة الرائدة في تمكين المنظمات غير الربحية من بناء خططها الاستراتيجية والتشغيلية وسياساتها الداخلية بكفاءة عالية وتكلفة مناسبة.'],
            ['group'=>'about','key'=>'mission_text',          'label'=>'نص الرسالة',                      'type'=>'textarea', 'value'=>'نقدم نظاماً شبه آلي يوفر أدوات تخطيط متكاملة مع إشراف مستشارين متخصصين، لتمكين المنظمات من بناء خططها بجودة عالية وتكلفة أقل.'],
            ['group'=>'about','key'=>'howworks1_title',       'label'=>'كيف يعمل 1 - العنوان',            'type'=>'text',     'value'=>'نظام شبه آلي'],
            ['group'=>'about','key'=>'howworks1_desc',        'label'=>'كيف يعمل 1 - الوصف',              'type'=>'textarea', 'value'=>'محتوى تعليمي مسجل (فيديو + شرح مكتوب + إرشادات) مع نماذج عمل جاهزة'],
            ['group'=>'about','key'=>'howworks2_title',       'label'=>'كيف يعمل 2 - العنوان',            'type'=>'text',     'value'=>'إشراف المستشار'],
            ['group'=>'about','key'=>'howworks2_desc',        'label'=>'كيف يعمل 2 - الوصف',              'type'=>'textarea', 'value'=>'مستشار متخصص يراجع عن بعد مخرجات كل مرحلة ويعتمدها أو يطلب تعديل'],
            ['group'=>'about','key'=>'howworks3_title',       'label'=>'كيف يعمل 3 - العنوان',            'type'=>'text',     'value'=>'مخرجات احترافية'],
            ['group'=>'about','key'=>'howworks3_desc',        'label'=>'كيف يعمل 3 - الوصف',              'type'=>'textarea', 'value'=>'وثائق نهائية مصممة تلقائياً مع إمكانية التصميم الاحترافي بمقابل إضافي'],
            ['group'=>'about','key'=>'stat1_n',               'label'=>'إحصاء 1 - الرقم',                 'type'=>'text',     'value'=>'120+'],
            ['group'=>'about','key'=>'stat1_l',               'label'=>'إحصاء 1 - الوصف',                 'type'=>'text',     'value'=>'منظمة مستفيدة'],
            ['group'=>'about','key'=>'stat2_n',               'label'=>'إحصاء 2 - الرقم',                 'type'=>'text',     'value'=>'50+'],
            ['group'=>'about','key'=>'stat2_l',               'label'=>'إحصاء 2 - الوصف',                 'type'=>'text',     'value'=>'خطة مكتملة'],
            ['group'=>'about','key'=>'stat3_n',               'label'=>'إحصاء 3 - الرقم',                 'type'=>'text',     'value'=>'15+'],
            ['group'=>'about','key'=>'stat3_l',               'label'=>'إحصاء 3 - الوصف',                 'type'=>'text',     'value'=>'مستشار معتمد'],
            ['group'=>'about','key'=>'stat4_n',               'label'=>'إحصاء 4 - الرقم',                 'type'=>'text',     'value'=>'200+'],
            ['group'=>'about','key'=>'stat4_l',               'label'=>'إحصاء 4 - الوصف',                 'type'=>'text',     'value'=>'سياسة مبنية'],

            // ── Services ───────────────────────────────────────────────────────
            ['group'=>'services','key'=>'services_hero_subtitle',   'label'=>'العنوان الفرعي - الخدمات',      'type'=>'text',     'value'=>'ثلاثة أنظمة متكاملة لبناء منظمتك'],
            ['group'=>'services','key'=>'strategic_service_desc',   'label'=>'وصف الخدمة الاستراتيجية',       'type'=>'textarea', 'value'=>'بناء الخطة الاستراتيجية الكاملة للمنظمة من خلال 11 وحدة تخطيطية متسلسلة. كل وحدة تحتوي على: نبذة + شرح مكتوب + إرشادات + فيديو تعليمي + خدمة دردشة مع المستشار + نماذج عمل تفاعلية.'],
            ['group'=>'services','key'=>'strategic_service_price',  'label'=>'سعر الخدمة الاستراتيجية',       'type'=>'text',     'value'=>'5,000'],
            ['group'=>'services','key'=>'operational_service_desc', 'label'=>'وصف الخدمة التشغيلية',          'type'=>'textarea', 'value'=>'تحويل المبادرات الاستراتيجية إلى خطة تشغيلية مفصلة بالأنشطة والجدول الزمني (جانت 12 شهر) والمسؤوليات والتكاليف المالية. يتطلب إكمال التخطيط الاستراتيجي أولاً.'],
            ['group'=>'services','key'=>'operational_service_price','label'=>'سعر الخدمة التشغيلية',          'type'=>'text',     'value'=>'3,500'],
            ['group'=>'services','key'=>'policies_service_desc',    'label'=>'وصف خدمة السياسات',              'type'=>'textarea', 'value'=>'بناء السياسات واللوائح الداخلية عبر استبيانات ذكية موجهة — أجب على الأسئلة والنظام يولّد السياسة تلقائياً. يشمل فيديوهات تعليمية ومراجعة مستشار. تسعير مستقل لكل سياسة.'],
            ['group'=>'services','key'=>'policies_min_price',       'label'=>'الحد الأدنى لسعر السياسات',     'type'=>'text',     'value'=>'1,000'],

            // ── Pricing ────────────────────────────────────────────────────────
            ['group'=>'pricing','key'=>'pricing_hero_subtitle', 'label'=>'العنوان الفرعي - الأسعار',      'type'=>'text',     'value'=>'أسعار مناسبة لجميع المنظمات غير الربحية'],
            ['group'=>'pricing','key'=>'strategic_price',       'label'=>'سعر التخطيط الاستراتيجي',       'type'=>'text',     'value'=>'5,000'],
            ['group'=>'pricing','key'=>'operational_price',     'label'=>'سعر التخطيط التشغيلي',          'type'=>'text',     'value'=>'3,500'],
            ['group'=>'pricing','key'=>'addon1_title',          'label'=>'خدمة إضافية 1 - العنوان',       'type'=>'text',     'value'=>'اعتماد الخطة من جهة استشارية'],
            ['group'=>'pricing','key'=>'addon1_price',          'label'=>'خدمة إضافية 1 - السعر',         'type'=>'text',     'value'=>'2,000'],
            ['group'=>'pricing','key'=>'addon1_desc',           'label'=>'خدمة إضافية 1 - الوصف',         'type'=>'text',     'value'=>'اعتماد رسمي من جهة معتمدة'],
            ['group'=>'pricing','key'=>'addon2_title',          'label'=>'خدمة إضافية 2 - العنوان',       'type'=>'text',     'value'=>'تحكيم السياسات من مستشار'],
            ['group'=>'pricing','key'=>'addon2_price',          'label'=>'خدمة إضافية 2 - السعر',         'type'=>'text',     'value'=>'2,000'],
            ['group'=>'pricing','key'=>'addon2_desc',           'label'=>'خدمة إضافية 2 - الوصف',         'type'=>'text',     'value'=>'تحكيم ومراجعة متعمقة'],
            ['group'=>'pricing','key'=>'addon3_title',          'label'=>'خدمة إضافية 3 - العنوان',       'type'=>'text',     'value'=>'تصميم احترافي للوثائق'],
            ['group'=>'pricing','key'=>'addon3_price',          'label'=>'خدمة إضافية 3 - السعر',         'type'=>'text',     'value'=>'1,500'],
            ['group'=>'pricing','key'=>'addon3_desc',           'label'=>'خدمة إضافية 3 - الوصف',         'type'=>'text',     'value'=>'تصميم بهوية المنظمة'],

            // ── Contact ────────────────────────────────────────────────────────
            ['group'=>'contact','key'=>'contact_hero_subtitle', 'label'=>'العنوان الفرعي - تواصل معنا',   'type'=>'text',     'value'=>'نسعد بتواصلكم والإجابة على استفساراتكم'],
            ['group'=>'contact','key'=>'contact_email',         'label'=>'البريد الإلكتروني',              'type'=>'text',     'value'=>'info@daffa.sa'],
            ['group'=>'contact','key'=>'contact_phone',         'label'=>'رقم الهاتف',                    'type'=>'text',     'value'=>'+966 55 XXX XXXX'],
            ['group'=>'contact','key'=>'contact_address',       'label'=>'العنوان',                        'type'=>'text',     'value'=>'الرياض، المملكة العربية السعودية'],
            ['group'=>'contact','key'=>'contact_hours',         'label'=>'ساعات العمل',                   'type'=>'text',     'value'=>'الأحد - الخميس: 8 ص - 5 م'],
            ['group'=>'contact','key'=>'social_twitter',        'label'=>'رابط تويتر / X',                'type'=>'url',      'value'=>''],
            ['group'=>'contact','key'=>'social_linkedin',       'label'=>'رابط لينكدإن',                  'type'=>'url',      'value'=>''],
            ['group'=>'contact','key'=>'social_instagram',      'label'=>'رابط انستغرام',                 'type'=>'url',      'value'=>''],

            // ── Footer ─────────────────────────────────────────────────────────
            ['group'=>'footer','key'=>'footer_desc',       'label'=>'وصف الفوتر',       'type'=>'textarea', 'value'=>'منصة دفة للتخطيط الاستراتيجي وصناعة السياسات — نظام شبه آلي لبناء الخطط الاستراتيجية والتشغيلية والسياسات واللوائح للمنظمات غير الربحية'],
            ['group'=>'footer','key'=>'footer_copyright',  'label'=>'نص حقوق النشر',    'type'=>'text',     'value'=>'جميع الحقوق محفوظة © 2026 منصة دفة للتخطيط الاستراتيجي وصناعة السياسات'],
        ];

        foreach ($rows as &$row) {
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
        }
        unset($row);

        DB::table('site_contents')->insert($rows);
    }

    public function down(): void
    {
        Schema::dropIfExists('site_contents');
    }
};
