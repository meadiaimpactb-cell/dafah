<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_selections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('policy_workflows')->cascadeOnDelete();
            $table->tinyInteger('policy_type_id'); // 1-7 (static catalog)
            $table->string('status')->default('not_started'); // not_started, in_progress, submitted, reviewing, approved, revision
            $table->json('form_data')->nullable();
            $table->text('consultant_notes')->nullable();
            $table->tinyInteger('revision_count')->default(0);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['workflow_id', 'policy_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_selections');
    }
};
