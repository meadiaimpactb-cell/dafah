<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * قسم «الظهور والقياس» في لوحة الأدمن:
 *  - seo_pages: عنوان ووصف وصورة مشاركة وكلمات مفتاحية وإخفاء عن البحث لكل صفحة عامة.
 *  - إعدادات (site_contents مجموعة seo): قواعد robots.txt الخاصة، وقرار زواحف الذكاء الاصطناعي،
 *    ورموز التوثيق، ومعرّفات أدوات القياس، وسجل التوثيق وإرسال الخريطة وIndexNow.
 * الفارغ يعني النص الافتراضي المبني من محتوى الصفحة (app/Support/SeoPages.php).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('seo_pages')) {
            Schema::create('seo_pages', function (Blueprint $t) {
                $t->id();
                $t->string('page', 30)->unique();
                $t->string('title', 200)->nullable();
                $t->string('description', 500)->nullable();
                $t->string('og_image', 255)->nullable();
                $t->json('keywords')->nullable();
                $t->string('primary_keyword', 120)->nullable();
                $t->boolean('noindex')->default(false);
                $t->timestamps();
            });
        }
        foreach (['home', 'about', 'services', 'pricing', 'contact', 'privacy', 'terms'] as $p) {
            DB::table('seo_pages')->insertOrIgnore(['page' => $p, 'keywords' => json_encode([]), 'created_at' => now(), 'updated_at' => now()]);
        }

        $old = DB::table('site_contents')->whereIn('key', ['ga4_measurement_id', 'bing_site_verification'])->pluck('value', 'key');
        $rows = [
            ['seo_verify_google', 'رمز توثيق Google Search Console', 'text', 'Zme9alewB3DVUoct6ZcIWAgYS1yDNgqS_7kU1r3nE7M'],
            ['seo_verify_bing', 'رمز توثيق Bing Webmaster Tools', 'text', (string) ($old['bing_site_verification'] ?? '')],
            ['track_gtm', 'معرّف Google Tag Manager', 'text', ''],
            ['track_ga4', 'معرّف Google Analytics 4', 'text', (string) ($old['ga4_measurement_id'] ?? '')],
            ['track_meta_pixel', 'معرّف Meta Pixel', 'text', ''],
            ['track_clarity', 'معرّف Microsoft Clarity', 'text', ''],
            ['track_tiktok', 'معرّف TikTok Pixel', 'text', ''],
            ['track_snap', 'معرّف Snap Pixel', 'text', ''],
            ['seo_robots_custom', 'قواعد robots.txt الخاصة (فارغ = الافتراضي)', 'textarea', ''],
            ['seo_ai_bots', 'زواحف الذكاء الاصطناعي (allow | block)', 'text', 'allow'],
            ['seo_log_verified_at', 'تاريخ التوثيق في Search Console', 'text', ''],
            ['seo_log_sitemap_at', 'تاريخ إرسال خريطة الموقع', 'text', ''],
            ['seo_indexnow_last', 'آخر إرسال إلى IndexNow', 'text', ''],
        ];
        foreach ($rows as [$key, $label, $type, $value]) {
            if (! DB::table('site_contents')->where('key', $key)->exists()) {
                DB::table('site_contents')->insert(['group' => 'seo', 'key' => $key, 'label' => $label, 'type' => $type, 'value' => $value, 'created_at' => now(), 'updated_at' => now()]);
            }
        }
        // روابط الحسابات الرسمية تعود إلى «محتوى الموقع ← تواصل معنا» (مجموعة seo صارت لقسم الظهور والقياس)
        DB::table('site_contents')->whereIn('key', ['social_twitter', 'social_linkedin', 'social_instagram', 'social_youtube', 'social_facebook'])->update(['group' => 'contact']);
        // المفاتيح القديمة انتقلت إلى «أدوات القياس والتتبّع»
        DB::table('site_contents')->whereIn('key', ['ga4_measurement_id', 'bing_site_verification'])->delete();

        try {
            \App\Support\PublicCache::forget(\App\Support\PublicCache::SITE_CONTENT, 'seo-pages');
        } catch (\Throwable) {
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_pages');
        DB::table('site_contents')->whereIn('key', ['seo_verify_google', 'seo_verify_bing', 'track_gtm', 'track_ga4', 'track_meta_pixel', 'track_clarity', 'track_tiktok', 'track_snap', 'seo_robots_custom', 'seo_ai_bots', 'seo_log_verified_at', 'seo_log_sitemap_at', 'seo_indexnow_last'])->delete();
    }
};
