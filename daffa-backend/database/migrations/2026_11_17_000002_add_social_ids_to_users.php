<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * معرّفات حسابات Facebook وLinkedIn لربطها بحساب المستخدم (مثل google_id) عند الدخول الاجتماعي.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            if (!Schema::hasColumn('users', 'facebook_id')) {
                $t->string('facebook_id')->nullable()->unique()->after('google_id');
            }
            if (!Schema::hasColumn('users', 'linkedin_id')) {
                $t->string('linkedin_id')->nullable()->unique()->after('facebook_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $t) {
            foreach (['linkedin_id', 'facebook_id'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $t->dropUnique([$col]);
                    $t->dropColumn($col);
                }
            }
        });
    }
};
