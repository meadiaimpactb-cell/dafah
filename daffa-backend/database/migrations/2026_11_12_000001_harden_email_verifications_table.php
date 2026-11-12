<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * تقوية رموز التحقق من البريد:
 * - الرمز يُخزَّن مُجزّأً (HMAC-SHA256) لا نصًا صريحًا.
 * - عدد المحاولات الخاطئة لكل رمز (يُلغى الرمز بعد 5 محاولات).
 * - الغرض (تأكيد الحساب / تغيير البريد) والمستخدم صاحب طلب تغيير البريد.
 * الرموز القديمة (نص صريح، صلاحيتها 10 دقائق) تُحذف لأنها لن تطابق التجزئة.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('email_verifications')->delete();

        Schema::table('email_verifications', function (Blueprint $table) {
            $table->string('code', 64)->change();
            $table->string('purpose', 20)->default('verify')->after('code');
            $table->unsignedBigInteger('user_id')->nullable()->after('purpose')->index();
            $table->unsignedTinyInteger('attempts')->default(0)->after('user_id');
        });
    }

    public function down(): void
    {
        DB::table('email_verifications')->delete();

        Schema::table('email_verifications', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropColumn(['purpose', 'user_id', 'attempts']);
            $table->string('code', 6)->change();
        });
    }
};
