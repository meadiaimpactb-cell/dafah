<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operational_units', function (Blueprint $table) {
            $table->id();
            $table->tinyInteger('unit_number')->unique();
            $table->string('name');
            $table->string('template_type');
            $table->text('overview')->nullable();
            $table->text('overview2')->nullable();
            $table->json('topics')->nullable();
            $table->json('steps')->nullable();
            $table->text('tip')->nullable();
            $table->string('video_duration')->default('—');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operational_units');
    }
};
