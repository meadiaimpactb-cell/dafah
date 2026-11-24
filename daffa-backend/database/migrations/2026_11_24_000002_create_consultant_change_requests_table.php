<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * طلبات تغيير المستشار وسجل إعادة الإسناد.
 *  - source=client: طلب من العميل بسببه، يدرسه المشرف فيعتمده (ويختار المستشار الجديد) أو يرفضه بملاحظة.
 *  - source=admin : تغيير مباشر من المشرف (يُسجَّل معتمدًا مع سببه) — يبقى السجل كاملًا لكل خطة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultant_change_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();          // العميل صاحب الخطة
            $table->string('system', 20);                                              // strategic | operational | policies
            $table->unsignedBigInteger('workflow_id');
            $table->unsignedBigInteger('from_consultant_id')->nullable();             // المستشار وقت الطلب
            $table->unsignedBigInteger('requested_consultant_id')->nullable();        // تفضيل العميل (اختياري)
            $table->unsignedBigInteger('to_consultant_id')->nullable();               // المستشار المعتمد بعد القرار
            $table->string('source', 10)->default('client');                          // client | admin
            $table->string('reason_category', 30);
            $table->text('reason');
            $table->string('status', 15)->default('pending');                         // pending | approved | rejected | cancelled
            $table->text('admin_note')->nullable();                                    // يظهر للعميل
            $table->text('internal_note')->nullable();                                 // للمشرفين فقط
            $table->boolean('earnings_transferred')->nullable();
            $table->json('snapshot')->nullable();                                      // حال الخطة لحظة الطلب (لدراسة الحالة)
            $table->unsignedBigInteger('decided_by')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->index(['system', 'workflow_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultant_change_requests');
    }
};
