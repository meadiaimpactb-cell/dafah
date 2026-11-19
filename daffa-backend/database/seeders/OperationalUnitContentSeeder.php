<?php

namespace Database\Seeders;

use App\Models\OperationalUnit;
use App\Support\OperationalContent;
use Illuminate\Database\Seeder;

/**
 * محتوى وحدات التخطيط التشغيلي المنظَّم (النبذة، الشرح، الإرشادات، تعليمات النماذج وأمثلتها وتوضيحات ⓘ)
 * من resources/operational/units.json — مُعدّ من «دفة — الحزم الموحّدة للمطور» (الأجزاء 01–05).
 *
 * المحتوى يُدار من لوحة التحكم (إدارة مكونات النظام)، لذلك يملأ هذا الـSeeder الوحدات الفارغة فقط
 * ولا يستبدل ما عدّله المدير. للاستبدال المتعمَّد بالمحتوى المعتمد: OPERATIONAL_CONTENT_FORCE=1.
 * لا يمس بيانات العملاء.
 */
class OperationalUnitContentSeeder extends Seeder
{
    public function run(): void
    {
        $force = filter_var(env('OPERATIONAL_CONTENT_FORCE', false), FILTER_VALIDATE_BOOL);

        foreach (OperationalContent::defaults() as $type => $content) {
            $unit = OperationalUnit::where('template_type', $type)->first();
            if (! $unit) {
                continue;
            }
            if (! empty($unit->content) && ! $force) {
                $this->command?->line("  تخطّي {$type}: المحتوى موجود (يُدار من لوحة التحكم)");

                continue;
            }
            $unit->update(['content' => OperationalContent::normalize($content)]);
        }
    }
}
