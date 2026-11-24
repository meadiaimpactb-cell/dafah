<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * اكتمال الملف الشخصي: الحساب المنشأ عبر Google/Facebook/LinkedIn يحمل البيانات الأساسية فقط (الاسم والبريد والصورة)،
 * ويُطلب من العميل إكمال بيانات منظمته (الاسم والنوع والجوال). الحسابات القائمة المكتملة تُعلَّم مكتملة.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'profile_completed_at')) {
            Schema::table('users', function (Blueprint $t) {
                $t->timestamp('profile_completed_at')->nullable()->after('email_verified_at');
            });
        }
        // غير العملاء لا يحتاجون الاستكمال، والعميل المكتمل (اسم منظمة ونوع وجوال) يُعلَّم مكتملًا
        DB::table('users')->whereNull('profile_completed_at')->where(function ($q) {
            $q->where('role', '!=', 'client')
                ->orWhere(fn ($c) => $c->whereNotNull('phone')->where('phone', '!=', '')->where('org_name', '!=', '')->where('org_type', '!=', ''));
        })->update(['profile_completed_at' => now()]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'profile_completed_at')) {
            Schema::table('users', fn (Blueprint $t) => $t->dropColumn('profile_completed_at'));
        }
    }
};
