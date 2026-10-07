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
        Schema::create('consultants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('specialty');
            $table->decimal('rating', 3, 1)->default(5.0);
            $table->unsignedTinyInteger('experience_years')->default(0);
            $table->unsignedSmallInteger('completed_projects')->default(0);
            $table->boolean('available')->default(true);
            $table->text('bio')->nullable();
            $table->string('avatar_initial', 5)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultants');
    }
};
