<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('operational_workflows', function (Blueprint $table) {
            $table->tinyInteger('arbitration_step')->default(0)->after('current_step');
        });
    }

    public function down(): void
    {
        Schema::table('operational_workflows', function (Blueprint $table) {
            $table->dropColumn('arbitration_step');
        });
    }
};
