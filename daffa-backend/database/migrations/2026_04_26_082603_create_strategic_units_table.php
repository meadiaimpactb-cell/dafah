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
        Schema::create('strategic_units', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('unit_number')->unique();
            $table->string('name');
            $table->string('template_type', 30);
            $table->string('video_duration', 10)->nullable();
            $table->text('overview')->nullable();
            $table->text('overview2')->nullable();
            $table->json('table_headers')->nullable();
            $table->json('table_rows')->nullable();
            $table->json('topics')->nullable();
            $table->json('steps')->nullable();
            $table->text('tip')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('strategic_units');
    }
};
