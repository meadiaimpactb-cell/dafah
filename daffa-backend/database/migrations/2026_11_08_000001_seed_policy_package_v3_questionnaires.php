<?php

use Database\Seeders\PolicyQuestionnaireV3Seeder;
use Illuminate\Database\Migrations\Migration;

/**
 * يحمّل استبيانات حزمة سياسات دفة الإصدار 3.0 عند تشغيل migrate على أي بيئة.
 */
return new class extends Migration {
    public function up(): void
    {
        (new PolicyQuestionnaireV3Seeder())->run();
    }

    public function down(): void
    {
        // بيانات محتوى — لا تُحذف عند التراجع حتى لا تفقد إجابات العملاء مرجعها.
    }
};
