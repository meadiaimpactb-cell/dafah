<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * أُعيد إنتاج فيديوهات شرح وحدات التخطيط الاستراتيجي والتشغيلي (بحسب ملف «التعديلات المطلوبة على فيديوهات دفة»)
 * ورُفعت بالأسماء نفسها. نُلحق رقم إصدار بالروابط المستضافة على المنصة حتى لا يعرض المتصفح النسخة القديمة المخزّنة.
 * يُمس فقط ما يبدأ بـ /media/units/ — أي رابط وضعه المدير غير ذلك (يوتيوب مثلًا) لا يتغيّر.
 */
return new class extends Migration {
    private const VERSION = '20261117';
    private const TABLES = ['strategic_units', 'operational_units'];
    private const COLUMNS = ['video_url', 'video_url_alt'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            foreach (DB::table($table)->get(['id', ...self::COLUMNS]) as $row) {
                $update = [];
                foreach (self::COLUMNS as $col) {
                    $url = $row->$col;
                    if (is_string($url) && str_starts_with($url, '/media/units/')) {
                        $update[$col] = strtok($url, '?') . '?v=' . self::VERSION;
                    }
                }
                if ($update) DB::table($table)->where('id', $row->id)->update($update + ['updated_at' => now()]);
            }
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            foreach (DB::table($table)->get(['id', ...self::COLUMNS]) as $row) {
                $update = [];
                foreach (self::COLUMNS as $col) {
                    $url = $row->$col;
                    if (is_string($url) && str_starts_with($url, '/media/units/') && str_ends_with($url, '?v=' . self::VERSION)) {
                        $update[$col] = strtok($url, '?');
                    }
                }
                if ($update) DB::table($table)->where('id', $row->id)->update($update);
            }
        }
    }
};
