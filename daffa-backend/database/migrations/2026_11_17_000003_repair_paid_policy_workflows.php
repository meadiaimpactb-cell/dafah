<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * إصلاح خطط السياسات المدفوعة التي أعادها خلل سابق للخطوة 1:
 * كان الضغط على «التالي: الدفع» في وضع مراجعة خطوة الاختيار (بعد الدفع) يحفظ اختيارًا جديدًا ويعيد الخطة للخطوة 1،
 * فتعلق عند الدفع («تم الدفع مسبقاً») وتتغير المبالغ والسياسات المختارة عن الفاتورة.
 * الإصلاح (للخطط المدفوعة في خطوة < 3 فقط):
 *  - السياسات المختارة = سياسات استمارات الخطة الفعلية.
 *  - المبالغ = طلب الدفع (POL-) المسجّل للخطة.
 *  - الخطوة = 5 إن اكتملت/اعتُمد الكل، 4 إن أُرسل الكل، وإلا 3 (التعبئة).
 */
return new class extends Migration {
    public function up(): void
    {
        $rows = DB::table('policy_workflows')->where('payment_status', 'paid')->where('current_step', '<', 3)->get();

        foreach ($rows as $wf) {
            $selections = DB::table('policy_selections')->where('workflow_id', $wf->id)->get(['policy_type_id', 'status']);
            if ($selections->isEmpty()) {
                continue;
            }

            $statuses = $selections->pluck('status');
            $step = ($wf->status === 'completed' || $statuses->every(fn ($s) => $s === 'approved')) ? 5
                : ($statuses->every(fn ($s) => in_array($s, ['submitted', 'reviewing', 'revision', 'approved'], true)) ? 4 : 3);

            $update = [
                'current_step'      => $step,
                'selected_policies' => json_encode($selections->pluck('policy_type_id')->map(fn ($id) => (int) $id)->sort()->values()->all()),
                'updated_at'        => now(),
            ];

            $order = DB::table('orders')->where('service_type', 'policies')->where('workflow_id', $wf->id)
                ->where('payment_status', 'paid')->where('order_number', 'like', 'POL-%')->orderByDesc('id')->first();
            if ($order) {
                $update += [
                    'subtotal'        => $order->subtotal,
                    'tax_amount'      => $order->tax_amount,
                    'discount_amount' => $order->discount_amount,
                    'total'           => $order->total,
                ];
            }

            DB::table('policy_workflows')->where('id', $wf->id)->update($update);
            Log::info("policy workflow {$wf->id} repaired: step {$wf->current_step} → {$step}" . ($order ? " (amounts from {$order->order_number})" : ''));
        }
    }

    public function down(): void
    {
        // إصلاح بيانات — لا تراجع عنه
    }
};
