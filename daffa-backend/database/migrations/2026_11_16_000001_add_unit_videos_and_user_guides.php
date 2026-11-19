<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * فيديوهات شرح الوحدات وأدلة الاستخدام (حزمة «دفة — جميع التحديثات»):
 * - عمود video_url_alt (نسخة اللهجة السعودية) بجانب video_url (الفصحى) للوحدات والسياسات.
 * - روابط الفيديوهات المستضافة على المنصة (/media/...) تُضبط فقط حيث لا يوجد رابط — لا يُستبدل رابط وضعه المدير.
 * - روابط أدلة الاستخدام وفيديوهاتها لكل دور، وفيديو رحلة السياسات، في «محتوى الموقع» (مجموعة guides) ليعدّلها المدير.
 */
return new class extends Migration
{
    private const TABLES = ['strategic_units', 'operational_units', 'policy_type_contents'];

    private const STRATEGIC = ['swot', 'pestel', 'needs', 'toc', 'tows', 'directions', 'initiatives', 'bmc', 'kpis', 'orgchart', 'document'];

    private const OPERATIONAL = ['op_import', 'op_activities', 'op_gantt', 'op_responsible', 'op_budget'];

    private const GUIDES = [
        ['guide_client_video',     'فيديو دليل العميل',              '/media/guides/client-guide.mp4'],
        ['guide_client_pdf',       'ملف دليل العميل (PDF)',          '/media/guides/client-guide.pdf'],
        ['guide_consultant_video', 'فيديو دليل المستشار',            '/media/guides/consultant-guide.mp4'],
        ['guide_consultant_pdf',   'ملف دليل المستشار (PDF)',        '/media/guides/consultant-guide.pdf'],
        ['guide_admin_video',      'فيديو دليل مدير النظام',         '/media/guides/admin-guide.mp4'],
        ['guide_admin_pdf',        'ملف دليل مدير النظام (PDF)',     '/media/guides/admin-guide.pdf'],
        ['policies_video_url',     'فيديو شرح السياسات — الفصحى',     '/media/units/policies/policies-fusha.mp4'],
        ['policies_video_url_alt', 'فيديو شرح السياسات — اللهجة السعودية', '/media/units/policies/policies-saudi.mp4'],
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'video_url_alt')) {
                Schema::table($table, fn (Blueprint $t) => $t->string('video_url_alt', 500)->nullable()->after('video_url'));
            }
        }

        foreach (['strategic' => [self::STRATEGIC, 'strategic_units'], 'operational' => [self::OPERATIONAL, 'operational_units']] as $dir => [$types, $table]) {
            foreach ($types as $type) {
                foreach (['video_url' => 'fusha', 'video_url_alt' => 'saudi'] as $col => $suffix) {
                    DB::table($table)->where('template_type', $type)
                        ->where(fn ($q) => $q->whereNull($col)->orWhere($col, ''))
                        ->update([$col => "/media/units/{$dir}/{$type}-{$suffix}.mp4"]);
                }
            }
        }

        foreach (self::GUIDES as [$key, $label, $value]) {
            if (! DB::table('site_contents')->where('key', $key)->exists()) {
                DB::table('site_contents')->insert([
                    'group' => 'guides', 'key' => $key, 'label' => $label, 'type' => 'text', 'value' => $value,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('site_contents')->whereIn('key', array_column(self::GUIDES, 0))->delete();
        foreach (['strategic_units', 'operational_units'] as $table) {
            DB::table($table)->where('video_url', 'like', '/media/units/%')->update(['video_url' => null]);
        }
        foreach (self::TABLES as $table) {
            if (Schema::hasColumn($table, 'video_url_alt')) {
                Schema::table($table, fn (Blueprint $t) => $t->dropColumn('video_url_alt'));
            }
        }
    }
};
