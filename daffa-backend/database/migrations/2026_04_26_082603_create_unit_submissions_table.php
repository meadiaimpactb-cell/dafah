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
        Schema::create('unit_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('strategic_workflows')->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained('strategic_units');
            $table->unsignedTinyInteger('unit_number');
            $table->enum('status', ['not_started', 'in_progress', 'submitted', 'reviewing', 'revision', 'approved'])->default('not_started');
            $table->json('form_data')->nullable();
            $table->text('consultant_notes')->nullable();
            $table->unsignedTinyInteger('revision_count')->default(0);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['workflow_id', 'unit_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unit_submissions');
    }
};
