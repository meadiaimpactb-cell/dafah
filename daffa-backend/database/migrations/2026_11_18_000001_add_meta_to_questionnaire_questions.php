<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * إعدادات متقدمة لكل سؤال في استبيانات السياسات (JSON):
 * نوع الإدخال (تاريخ/رقم مع حدود ووحدة)، الظهور الشرطي، الخيارات الحصرية والإلزامية،
 * حقل «أخرى» بتوضيح، الأسئلة المركّبة بعدة خانات، وجداول معلومات مرجعية.
 * يقرؤها App\Support\QuestionRules (الخادم) و questionRules.js (الواجهة) بالدلالة نفسها.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('questionnaire_questions', function (Blueprint $table) {
            $table->json('meta')->nullable()->after('display_condition');
        });
    }

    public function down(): void
    {
        Schema::table('questionnaire_questions', function (Blueprint $table) {
            $table->dropColumn('meta');
        });
    }
};
