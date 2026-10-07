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
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_type_contents');
    }
};
