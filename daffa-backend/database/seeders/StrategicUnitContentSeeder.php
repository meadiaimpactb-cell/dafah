<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * محتوى الوحدات الاستراتيجية المنظَّم (النبذة، الشرح، الإرشادات، تعليمات النماذج)
 * من resources/strategic/units.json — مُعدّ من وثائق مواصفات «تحسينات موقع دفة — 11 وحدة».
 * آمن لإعادة التشغيل: يستبدل عمود content فقط، ولا يمس بيانات العملاء.
 */
class StrategicUnitContentSeeder extends Seeder
{
    public function run(): void
    {
        $path = resource_path('strategic/units.json');
        if (!is_file($path)) {
            return;
        }

        $units = json_decode(file_get_contents($path), true) ?: [];

        foreach ($units as $type => $content) {
            DB::table('strategic_units')
                ->where('template_type', $type)
                ->update(['content' => json_encode($content, JSON_UNESCAPED_UNICODE)]);
        }
    }
}
