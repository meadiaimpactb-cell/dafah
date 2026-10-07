<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('questionnaire_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('questionnaire_sections')->cascadeOnDelete();
            $table->text('question');
            $table->enum('type', ['single', 'multiple', 'yesno', 'text', 'scale'])->default('single');
            $table->boolean('required')->default(false);
            $table->string('hint')->nullable();
            $table->string('display_condition')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questionnaire_questions');
    }
};
