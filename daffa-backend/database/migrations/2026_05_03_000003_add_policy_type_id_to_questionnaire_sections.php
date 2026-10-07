<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('questionnaire_sections', function (Blueprint $table) {
            $table->unsignedTinyInteger('policy_type_id')->nullable()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('questionnaire_sections', function (Blueprint $table) {
            $table->dropColumn('policy_type_id');
        });
    }
};
