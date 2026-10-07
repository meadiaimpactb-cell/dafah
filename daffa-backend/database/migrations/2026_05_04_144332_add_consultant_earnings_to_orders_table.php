<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('consultant_id')->nullable()->after('workflow_id');
            $table->decimal('consultant_share', 10, 2)->default(0)->after('total');
        });

        // نسبة عمولة المستشار — 80% تذهب للمستشار والمنصة تأخذ 20%
        DB::table('service_settings')->insertOrIgnore([
            'key'        => 'consultant_commission_rate',
            'label'      => 'نسبة حصة المستشار (%)',
            'value'      => 80.00,
            'unit'       => '%',
            'is_active'  => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['consultant_id', 'consultant_share']);
        });

        DB::table('service_settings')->where('key', 'consultant_commission_rate')->delete();
    }
};
