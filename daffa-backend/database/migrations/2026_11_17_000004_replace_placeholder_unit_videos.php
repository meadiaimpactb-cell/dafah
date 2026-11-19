<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * وحدتان كان رابط فيديو الفصحى فيهما مقطعًا تجريبيًا من يوتيوب لا علاقة له بالمنصة (مقاطع تحفيزية عن إدارة الوقت)،
 * فبقيتا خارج فيديوهات حزمة الشرح. تُستبدلان بفيديو الحزمة المستضاف على المنصة — بمطابقة الرابط التجريبي نفسه فقط،
 * فأي رابط وضعه المدير غير هذين لا يُمس.
 */
return new class extends Migration
{
    private const MAP = [
        ['strategic_units',   'pestel',        'https://www.youtube.com/watch?v=VpQn48MV1Js', '/media/units/strategic/pestel-fusha.mp4'],
        ['operational_units', 'op_activities', 'https://www.youtube.com/watch?v=I7kXTX7lCKY', '/media/units/operational/op_activities-fusha.mp4'],
    ];

    public function up(): void
    {
        foreach (self::MAP as [$table, $type, $placeholder, $video]) {
            DB::table($table)->where('template_type', $type)->where('video_url', $placeholder)->update(['video_url' => $video, 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        foreach (self::MAP as [$table, $type, $placeholder, $video]) {
            DB::table($table)->where('template_type', $type)->where('video_url', $video)->update(['video_url' => $placeholder]);
        }
    }
};
