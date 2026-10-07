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
        Schema::table('policy_workflows', function (Blueprint $table) {
            $table->json('design_brief')->nullable()->after('design_revision_notes');
            $table->string('design_logo')->nullable()->after('design_brief');
        });
    }

    public function down(): void
    {
        Schema::table('policy_workflows', function (Blueprint $table) {
            $table->dropColumn(['design_brief', 'design_logo']);
        });
    }
};
