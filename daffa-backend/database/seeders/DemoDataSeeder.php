<?php

namespace Database\Seeders;

use App\Models\Consultant;
use App\Models\ConsultantReview;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Order;
use App\Models\StrategicUnit;
use App\Models\StrategicWorkflow;
use App\Models\UnitSubmission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

/**
 * بيانات تجريبية للعرض والتدريب وتصوير الأدلة — لا تُشغَّل على الإنتاج.
 *   php artisan db:seed --class=DemoDataSeeder
 * كلمة المرور لكل الحسابات التجريبية: Demo@1234
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('DemoDataSeeder: متوقف — بيئة الإنتاج.');
            return;
        }

        $this->call([AdminSeeder::class, ConsultantSeeder::class, StrategicUnitSeeder::class, OperationalUnitSeeder::class]);

        // في البيئة التجريبية فقط: اعتبر بريد المدير مؤكَّدًا حتى يدخل دون رمز
        User::where('email', 'admin@daffa.sa')->whereNull('email_verified_at')->update(['email_verified_at' => now()]);

        $pass = Hash::make('Demo@1234');
        $forms = json_decode(file_get_contents(__DIR__ . '/demo/strategic_form_data.json'), true);

        // ── حسابات المستشارين ──
        $consultantUsers = [];
        foreach ([1 => 'ahmed@daffa.sa', 2 => 'sara@daffa.sa'] as $cid => $email) {
            $c = Consultant::find($cid);
            if (! $c) {
                continue;
            }
            $u = User::updateOrCreate(['email' => $email], [
                'org_name' => $c->name, 'rep_name' => $c->name, 'password' => $pass,
                'role' => 'consultant', 'is_active' => true, 'email_verified_at' => now(),
            ]);
            $c->update(['user_id' => $u->id, 'available' => true]);
            $consultantUsers[$cid] = $u;
        }

        // ── العملاء ──
        $clients = [
            ['email' => 'athar@demo.sa',  'org' => 'جمعية أثر للتنمية الاجتماعية', 'rep' => 'عبدالله الحربي', 'type' => 'جمعية أهلية', 'sector' => 'التنمية الاجتماعية',
             'consultant' => 1, 'plan' => [1 => 'approved', 2 => 'approved', 3 => 'approved', 4 => 'submitted', 5 => 'in_progress']],
            ['email' => 'namaa@demo.sa',  'org' => 'مؤسسة نماء الخيرية',          'rep' => 'هند السبيعي',   'type' => 'مؤسسة خيرية',  'sector' => 'التعليم',
             'consultant' => 1, 'plan' => [1 => 'approved', 2 => 'revision', 3 => 'submitted']],
            ['email' => 'baseera@demo.sa', 'org' => 'جمعية بصيرة لرعاية المكفوفين', 'rep' => 'فهد الدوسري',  'type' => 'جمعية أهلية', 'sector' => 'الرعاية الصحية',
             'consultant' => 2, 'plan' => [1 => 'approved', 2 => 'approved', 3 => 'approved', 4 => 'approved', 5 => 'approved', 6 => 'submitted']],
            ['email' => 'new@demo.sa',    'org' => 'جمعية غراس البيئية',          'rep' => 'ريم الزهراني',  'type' => 'جمعية أهلية', 'sector' => 'البيئة',
             'consultant' => null, 'plan' => []],
        ];

        $units = StrategicUnit::orderBy('unit_number')->get()->keyBy('unit_number');
        $notes = [
            'approved' => 'عمل ممتاز وواضح، تم اعتماد المخرج. نوصي بالحفاظ على هذا المستوى في الوحدات القادمة.',
            'revision' => 'نحتاج توضيح أثر كل عامل بشكل أدق، وإضافة مصدر لكل معلومة. راجع الملاحظات وأعد الإرسال.',
        ];

        foreach ($clients as $i => $cl) {
            $user = User::updateOrCreate(['email' => $cl['email']], [
                'org_name' => $cl['org'], 'rep_name' => $cl['rep'], 'org_type' => $cl['type'], 'sector' => $cl['sector'],
                'phone' => '05' . str_pad((string) (51234567 + $i * 1111), 8, '0', STR_PAD_LEFT),
                'password' => $pass, 'role' => 'client', 'is_active' => true, 'email_verified_at' => now(),
            ]);
            if (! $cl['consultant']) {
                continue; // عميل جديد لم يبدأ بعد — لتجربة الانطلاق
            }

            $wf = StrategicWorkflow::updateOrCreate(['user_id' => $user->id], [
                'consultant_id' => $cl['consultant'], 'current_step' => 3, 'status' => 'active',
                'subtotal' => 15000, 'tax_amount' => 2250, 'total' => 17250,
                'payment_status' => 'paid', 'payment_method' => 'card', 'paid_at' => now()->subDays(30 - $i * 5),
                'started_at' => now()->subDays(30 - $i * 5),
            ]);

            Order::updateOrCreate(['workflow_id' => $wf->id, 'service_type' => 'strategic'], [
                'user_id' => $user->id, 'order_number' => 'STR-DEMO' . ($i + 1), 'consultant_id' => $cl['consultant'],
                'consultant_share' => 12000, 'subtotal' => 15000, 'tax_amount' => 2250, 'discount_amount' => 0,
                'total' => 17250, 'payment_method' => 'card', 'payment_status' => 'paid', 'paid_at' => $wf->paid_at,
            ]);

            foreach ($units as $num => $unit) {
                $status = $cl['plan'][$num] ?? 'not_started';
                $data = in_array($status, ['not_started'], true) ? null : ($forms[$unit->template_type] ?? null);
                UnitSubmission::updateOrCreate(['workflow_id' => $wf->id, 'unit_id' => $unit->id], [
                    'unit_number' => $num, 'status' => $status, 'form_data' => $data,
                    'consultant_notes' => $notes[$status] ?? null,
                    'revision_count' => $status === 'revision' ? 1 : 0,
                    'submitted_at' => in_array($status, ['submitted', 'approved', 'revision'], true) ? now()->subDays(12 - $num) : null,
                    'reviewed_at' => in_array($status, ['approved', 'revision'], true) ? now()->subDays(10 - $num) : null,
                ]);
            }

            // محادثة قصيرة مع المستشار
            $cu = $consultantUsers[$cl['consultant']] ?? null;
            if ($cu && Schema::hasTable('conversations')) {
                $conv = Conversation::firstOrCreate(['client_id' => $user->id, 'consultant_user_id' => $cu->id], ['last_message' => 'تم، شكراً على التوجيه.', 'last_at' => now()]);
                if (! $conv->messages()->exists()) {
                    foreach ([
                        [$user->id, 'السلام عليكم، أرسلنا تحليل البيئة الداخلية. هل نحتاج إضافة شيء؟'],
                        [$cu->id, 'وعليكم السلام، العمل جيد. أضيفوا مثالاً واحداً على كل نقطة قوة وسأعتمده مباشرة.'],
                        [$user->id, 'تم، شكراً على التوجيه.'],
                    ] as [$sender, $body]) {
                        Message::create(['conversation_id' => $conv->id, 'sender_id' => $sender, 'body' => $body]);
                    }
                }
            }

            Notification::firstOrCreate(['user_id' => $user->id, 'title' => 'تم اعتماد وحدة تحليل البيئة الداخلية'], [
                'body' => 'اعتمد المستشار مخرج الوحدة الأولى. يمكنك الانتقال للوحدة التالية.', 'type' => 'approval',
            ]);

            if ($i === 0) {
                ConsultantReview::firstOrCreate(['user_id' => $user->id, 'consultant_id' => $cl['consultant'], 'workflow_type' => 'strategic', 'workflow_id' => $wf->id], [
                    'rating' => 5, 'comment' => 'متابعة دقيقة وتوجيهات واضحة ساعدتنا كثيراً.',
                ]);
            }
        }

        $this->command?->info('DemoDataSeeder: جاهز — admin@daffa.sa / Admin@1234 · ahmed@daffa.sa · athar@demo.sa · new@demo.sa (Demo@1234)');
    }
}
