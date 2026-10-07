<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policy_type_contents', function (Blueprint $table) {
            $table->string('name')->nullable()->after('policy_type_id');
            $table->text('description')->nullable()->after('name');
            $table->decimal('price', 10, 2)->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('policy_type_contents', function (Blueprint $table) {
            $table->dropColumn(['name', 'description', 'price']);
        });
    }
};
