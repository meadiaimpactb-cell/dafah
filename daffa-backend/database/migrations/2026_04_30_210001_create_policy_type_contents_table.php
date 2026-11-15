<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('policy_type_contents', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('policy_type_id')->unique();
            $table->text('overview')->nullable();
            $table->text('written_description')->nullable();
            $table->text('tip')->nullable();
            $table->string('video_url')->nullable();
            $table->string('video_duration')->nullable();
            $table->timestamps();
        });

        // Columns from 2026_04_30_120104 (skipped on fresh installs because it ran first).
        Schema::table('policy_type_contents', function (Blueprint $table) {
            if (! Schema::hasColumn('policy_type_contents', 'name')) {
                $table->string('name')->nullable()->after('policy_type_id');
            }
            if (! Schema::hasColumn('policy_type_contents', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (! Schema::hasColumn('policy_type_contents', 'price')) {
                $table->decimal('price', 10, 2)->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_type_contents');
    }
};
