<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * نصوص صفحتي الدخول والتسجيل في «محتوى الموقع» (مجموعة auth) ليعدّلها المدير من اللوحة:
 * اللوحة التعريفية بجانب نموذج التسجيل، ونص الشروط والأحكام (يظهر رابطها في التسجيل متى وُجد النص).
 * لا يُستبدل أي مفتاح موجود مسبقًا.
 */
return new class extends Migration {
    private const ITEMS = [
        ['auth_panel_title',  'عنوان اللوحة التعريفية في صفحة التسجيل', 'text',     'خطّط لمنظمتك بثقة'],
        ['auth_panel_text',   'نص اللوحة التعريفية',                    'textarea', 'منصة دفة ترافقك خطوة بخطوة في بناء خطتك الاستراتيجية والتشغيلية وسياسات منظمتك، بإشراف مستشار متخصص.'],
        ['auth_panel_points', 'مزايا اللوحة (ميزة في كل سطر)',           'textarea', "ثلاث خدمات مستقلة: التخطيط الاستراتيجي، والتشغيلي، والسياسات\nمستشار متخصص يراجع وحداتك ويعتمدها\nشروحات وفيديوهات لكل خطوة\nمخرجات جاهزة للتنزيل بصيغة PDF"],
        ['terms_text',        'نص الشروط والأحكام (يظهر عند التسجيل)',   'textarea', ''],
    ];

    public function up(): void
    {
        foreach (self::ITEMS as [$key, $label, $type, $value]) {
            if (!DB::table('site_contents')->where('key', $key)->exists()) {
                DB::table('site_contents')->insert([
                    'group' => 'auth', 'key' => $key, 'label' => $label, 'type' => $type, 'value' => $value,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('site_contents')->where('group', 'auth')->whereIn('key', array_column(self::ITEMS, 0))->delete();
    }
};
