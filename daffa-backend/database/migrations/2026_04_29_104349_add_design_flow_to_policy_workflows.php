<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policy_workflows', function (Blueprint $table) {
            // design_status: pending | uploaded | revision_requested | approved
            $table->string('design_status')->nullable()->after('design_paid_at');
            $table->string('design_file')->nullable()->after('design_status');
            $table->text('design_revision_notes')->nullable()->after('design_file');
            $table->timestamp('design_uploaded_at')->nullable()->after('design_revision_notes');
            $table->timestamp('design_approved_at')->nullable()->after('design_uploaded_at');
        });
    }

    public function down(): void
    {
        Schema::table('policy_workflows', function (Blueprint $table) {
            $table->dropColumn([
                'design_status', 'design_file',
                'design_revision_notes', 'design_uploaded_at', 'design_approved_at',
            ]);
        });
    }
};
