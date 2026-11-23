<?php

use App\Support\PublicCache;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * دفعة التعديلات الثالثة — نصوص المحتوى:
 *  - وصف خدمة التخطيط التشغيلي لم يعد يشترط إكمال التخطيط الاستراتيجي (الخدمات مستقلة).
 *  - خانة «القيم المقترحة» في نموذج عمل المنظمة تُسمّى «القيمة المقترحة للمستفيدين» في المحتوى المُدار من لوحة التحكم.
 */
return new class extends Migration
{
    public function up(): void
    {
        $old = 'يتطلب إكمال التخطيط الاستراتيجي أولاً.';
        $new = 'يمكنك بدء خطتك التشغيلية بإدخال أسماء المبادرات التي ستعمل عليها هذا العام، حتى لو لم تُكمل خطة استراتيجية على منصة دفة.';
        $row = DB::table('site_contents')->where('key', 'operational_service_desc')->first();
        if ($row && str_contains((string) $row->value, $old)) {
            DB::table('site_contents')->where('id', $row->id)->update([
                'value' => trim(str_replace($old, $new, $row->value)),
                'updated_at' => now(),
            ]);
        }

        foreach (DB::table('strategic_units')->where('template_type', 'bmc')->get(['id', 'content']) as $unit) {
            if (! $unit->content || ! str_contains($unit->content, 'القيم المقترحة')) {
                continue;
            }
            DB::table('strategic_units')->where('id', $unit->id)->update([
                'content' => str_replace(['"القيم المقترحة"', '«القيم المقترحة»'], ['"القيمة المقترحة للمستفيدين"', '«القيمة المقترحة للمستفيدين»'], $unit->content),
                'updated_at' => now(),
            ]);
        }

        if (class_exists(PublicCache::class)) {
            PublicCache::forget('site-content');
        }
    }

    public function down(): void
    {
        // تصحيحات محتوى؛ لا تراجع آلي
    }
};
