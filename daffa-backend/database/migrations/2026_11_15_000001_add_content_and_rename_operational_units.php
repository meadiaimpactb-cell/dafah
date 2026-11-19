<?php

use Database\Seeders\OperationalUnitContentSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * تعديلات التخطيط التشغيلي («دفة — الحزم الموحّدة للمطور»، الأجزاء 01–05):
 * - عمود content للمحتوى المنظَّم (النبذة، الشرح، الإرشادات، تعليمات نموذج العمل وأمثلته وتوضيحات ⓘ).
 * - الاسم الكامل للجزء الأول، وتغيير اسم الجزء الثالث من «شهور التنفيذ» إلى «الجدول الزمني للتنفيذ».
 *   يُغيَّر الاسم فقط إن كان ما يزال الاسم القديم (لا يُستبدل اسم عدّله المدير). لا تُمس بيانات الخطط.
 */
return new class extends Migration
{
    public const RENAMES = [
        'op_import' => ['المبادرات الاستراتيجية', 'المبادرات الاستراتيجية في التخطيط التشغيلي'],
        'op_gantt' => ['شهور التنفيذ', 'الجدول الزمني للتنفيذ'],
    ];

    public function up(): void
    {
        if (! Schema::hasColumn('operational_units', 'content')) {
            Schema::table('operational_units', function (Blueprint $table) {
                $table->json('content')->nullable()->after('tip');
            });
        }

        foreach (self::RENAMES as $type => [$old, $new]) {
            DB::table('operational_units')->where('template_type', $type)->where('name', $old)->update(['name' => $new]);
        }

        (new OperationalUnitContentSeeder)->run();
    }

    public function down(): void
    {
        foreach (self::RENAMES as $type => [$old, $new]) {
            DB::table('operational_units')->where('template_type', $type)->where('name', $new)->update(['name' => $old]);
        }

        if (Schema::hasColumn('operational_units', 'content')) {
            Schema::table('operational_units', fn (Blueprint $table) => $table->dropColumn('content'));
        }
    }
};
