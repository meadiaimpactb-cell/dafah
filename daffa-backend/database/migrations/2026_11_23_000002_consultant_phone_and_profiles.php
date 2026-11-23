<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * المستشارون:
 *  - رقم جوال للمستشار (كان الحساب يُنشأ برقم وهمي 0000000000 لأن النموذج بلا خانة جوال).
 *  - كل مستخدم بدور «مستشار» له ملف مستشار يظهر في صفحة المستشارين (كانت الإضافة من صفحة المستخدمين لا تُنشئه).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('consultants', 'phone')) {
            Schema::table('consultants', function (Blueprint $table) {
                $table->string('phone', 20)->nullable()->after('specialty');
            });
        }

        // جوال المستشار من حسابه المرتبط إن كان حقيقيًا
        foreach (DB::table('consultants')->whereNotNull('user_id')->whereNull('phone')->get(['id', 'user_id']) as $c) {
            $phone = DB::table('users')->where('id', $c->user_id)->value('phone');
            if ($phone && ! preg_match('/^0+$/', $phone)) {
                DB::table('consultants')->where('id', $c->id)->update(['phone' => $phone]);
            }
        }

        // ملف مستشار لكل حساب بدور مستشار لا يملك واحدًا
        $linked = DB::table('consultants')->whereNotNull('user_id')->pluck('user_id')->all();
        $users = DB::table('users')->where('role', 'consultant')->whereNotIn('id', $linked ?: [0])->get();
        foreach ($users as $u) {
            $name = $u->rep_name ?: ($u->org_name ?: $u->email);
            $phone = ($u->phone && ! preg_match('/^0+$/', $u->phone)) ? $u->phone : null;
            DB::table('consultants')->insert([
                'user_id' => $u->id,
                'name' => $name,
                'specialty' => 'تخطيط استراتيجي',
                'phone' => $phone,
                'rating' => 0,
                'experience_years' => 0,
                'completed_projects' => 0,
                'available' => true,
                'bio' => null,
                'avatar_initial' => mb_substr($name, 0, 1),
                'created_at' => $u->created_at ?? now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('consultants', 'phone')) {
            Schema::table('consultants', function (Blueprint $table) {
                $table->dropColumn('phone');
            });
        }
    }
};
