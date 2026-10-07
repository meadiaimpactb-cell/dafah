<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $rows = [
            // ── System general settings ────────────────────────────────────────
            ['group'=>'system','key'=>'system_platform_name', 'label'=>'اسم المنصة',          'type'=>'text',   'value'=>'منصة دفة'],
            ['group'=>'system','key'=>'system_tax_rate',      'label'=>'نسبة الضريبة (%)',     'type'=>'text',   'value'=>'15'],
            ['group'=>'system','key'=>'system_currency',      'label'=>'العملة',               'type'=>'text',   'value'=>'ريال سعودي (SAR)'],
            ['group'=>'system','key'=>'system_timezone',      'label'=>'المنطقة الزمنية',      'type'=>'text',   'value'=>'Asia/Riyadh'],
            ['group'=>'system','key'=>'system_language',      'label'=>'اللغة الافتراضية',     'type'=>'text',   'value'=>'العربية'],

            // ── Email settings ─────────────────────────────────────────────────
            ['group'=>'email', 'key'=>'email_from_name',     'label'=>'اسم المرسل',            'type'=>'text',   'value'=>'منصة دفة'],
            ['group'=>'email', 'key'=>'email_from_address',  'label'=>'بريد المرسل',           'type'=>'text',   'value'=>'info@daffa.sa'],
            ['group'=>'email', 'key'=>'email_reply_to',      'label'=>'الرد على',             'type'=>'text',   'value'=>'support@daffa.sa'],

            // ── Payment settings ───────────────────────────────────────────────
            ['group'=>'payment','key'=>'payment_gateway',    'label'=>'بوابة الدفع',           'type'=>'text',   'value'=>'Stripe'],
            ['group'=>'payment','key'=>'payment_currency',   'label'=>'عملة الدفع',            'type'=>'text',   'value'=>'SAR'],
            ['group'=>'payment','key'=>'payment_vat_number', 'label'=>'الرقم الضريبي',        'type'=>'text',   'value'=>''],

            // ── Security settings ──────────────────────────────────────────────
            ['group'=>'security','key'=>'security_session_timeout','label'=>'مدة انتهاء الجلسة (دقيقة)','type'=>'text','value'=>'120'],
            ['group'=>'security','key'=>'security_max_login_attempts','label'=>'محاولات تسجيل الدخول القصوى','type'=>'text','value'=>'5'],
            ['group'=>'security','key'=>'security_lockout_duration','label'=>'مدة الإيقاف (دقيقة)','type'=>'text','value'=>'15'],
        ];

        foreach ($rows as &$row) {
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
        }
        unset($row);

        DB::table('site_contents')->insertOrIgnore($rows);
    }

    public function down(): void
    {
        DB::table('site_contents')
            ->whereIn('group', ['system', 'email', 'payment', 'security'])
            ->delete();
    }
};
