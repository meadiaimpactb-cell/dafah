<?php

use Database\Seeders\StrategicUnitContentSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * تعديلات الوحدات الاستراتيجية (السجل الرئيسي — أكتوبر 2026):
 * - الترتيب الجديد: نظرية التغيير (4) قبل التحليل الاستراتيجي، والتوجهات (6) قبل المبادرات (7).
 * - عمود content لمحتوى النبذة والشرح والإرشادات وتعليمات النماذج المنظَّم.
 * تُنقل أرقام وحدات الخطط القائمة مع وحداتها، فلا تُفقد أي بيانات.
 */
return new class extends Migration {
    public const ORDER = [
        'swot' => 1, 'pestel' => 2, 'needs' => 3, 'toc' => 4, 'tows' => 5, 'directions' => 6,
        'initiatives' => 7, 'bmc' => 8, 'kpis' => 9, 'orgchart' => 10, 'document' => 11,
    ];

    public function up(): void
    {
        if (!Schema::hasColumn('strategic_units', 'content')) {
            Schema::table('strategic_units', function (Blueprint $table) {
                $table->json('content')->nullable()->after('tip');
            });
        }

        DB::transaction(function () {
            // أرقام مؤقتة لتفادي تعارض الفهرس الفريد أثناء التبديل
            DB::table('strategic_units')->update(['unit_number' => DB::raw('unit_number + 100')]);
            foreach (self::ORDER as $type => $number) {
                DB::table('strategic_units')->where('template_type', $type)->update(['unit_number' => $number]);
            }

            // مزامنة رقم الوحدة في تسليمات الخطط القائمة مع وحدتها
            foreach (DB::table('strategic_units')->pluck('unit_number', 'id') as $unitId => $number) {
                DB::table('unit_submissions')->where('unit_id', $unitId)->update(['unit_number' => $number]);
            }
        });

        (new StrategicUnitContentSeeder())->run();
    }

    public function down(): void
    {
        $old = [
            'swot' => 1, 'pestel' => 2, 'needs' => 3, 'tows' => 4, 'initiatives' => 5, 'directions' => 6,
            'toc' => 7, 'bmc' => 8, 'kpis' => 9, 'orgchart' => 10, 'document' => 11,
        ];

        DB::transaction(function () use ($old) {
            DB::table('strategic_units')->update(['unit_number' => DB::raw('unit_number + 100')]);
            foreach ($old as $type => $number) {
                DB::table('strategic_units')->where('template_type', $type)->update(['unit_number' => $number]);
            }
            foreach (DB::table('strategic_units')->pluck('unit_number', 'id') as $unitId => $number) {
                DB::table('unit_submissions')->where('unit_id', $unitId)->update(['unit_number' => $number]);
            }
        });

        if (Schema::hasColumn('strategic_units', 'content')) {
            Schema::table('strategic_units', fn (Blueprint $table) => $table->dropColumn('content'));
        }
    }
};
