<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('strategic_units', function (Blueprint $table) {
            $table->text('written_description')->nullable()->after('overview2');
            $table->json('tips')->nullable()->after('written_description');
            $table->string('video_url')->nullable()->after('tips');
        });
    }

    public function down(): void
    {
        Schema::table('strategic_units', function (Blueprint $table) {
            $table->dropColumn(['written_description', 'tips', 'video_url']);
        });
    }
};
