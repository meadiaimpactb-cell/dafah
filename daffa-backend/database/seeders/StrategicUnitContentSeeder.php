<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StrategicUnit;
use App\Support\StrategicContent;

/**
 * محتوى الوحدات الاستراتيجية المنظَّم (النبذة، الشرح، الإرشادات، تعليمات النماذج)
 * من resources/strategic/units.json — مُعدّ من وثائق مواصفات «تحسينات موقع دفة — 11 وحدة».
 *
 * المحتوى يُدار من لوحة التحكم (إدارة مكونات النظام)، لذلك يملأ هذا الـSeeder الوحدات الفارغة فقط
 * ولا يستبدل ما عدّله المدير. للاستبدال المتعمَّد بالمحتوى المعتمد: STRATEGIC_CONTENT_FORCE=1
 * (مع الإبقاء على ملفات PDF المرفوعة). لا يمس بيانات العملاء.
 */
class StrategicUnitContentSeeder extends Seeder
{
    public function run(): void
    {
        $force = filter_var(env('STRATEGIC_CONTENT_FORCE', false), FILTER_VALIDATE_BOOL);

        foreach (StrategicContent::defaults() as $type => $content) {
            $unit = StrategicUnit::where('template_type', $type)->first();
            if (!$unit) {
                continue;
            }
            if (!empty($unit->content) && !$force) {
                $this->command?->line("  تخطّي {$type}: المحتوى موجود (يُدار من لوحة التحكم)");
                continue;
            }
            $unit->update(['content' => StrategicContent::normalize($content, $unit->content)]);
        }
    }
}
