<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * نموذج «تواصل معنا» العام: يحفظ الرسالة ويرسلها إلى صندوق بريد المنصة (عنوان الإرسال في إعدادات البريد).
 */
class ContactController extends Controller
{
    public const SUBJECTS = ['استفسار عام', 'استفسار عن الأسعار', 'طلب عرض تقديمي', 'مشكلة تقنية', 'اقتراح تطوير', 'أخرى'];

    public function store(Request $request)
    {
        // حقل خفي للحماية من الرسائل الآلية: إن مُلئ نتجاهل الرسالة بصمت
        if (filled($request->input('website'))) {
            return response()->json(['message' => 'تم استلام رسالتك.'], 201);
        }
        $data = $request->validate([
            'name' => 'required|string|min:2|max:120',
            'org' => 'nullable|string|max:160',
            'email' => 'required|email:rfc|max:160',
            'phone' => 'nullable|string|max:30',
            'subject' => 'required|in:'.implode(',', self::SUBJECTS),
            'message' => 'required|string|min:10|max:4000',
        ], [
            'name.required' => 'اكتب اسمك.',
            'email.required' => 'اكتب بريدك الإلكتروني حتى نتمكن من الرد عليك.',
            'email.email' => 'البريد الإلكتروني غير صحيح.',
            'message.required' => 'اكتب رسالتك.',
            'subject.required' => 'اختر موضوع الرسالة.',
            'subject.in' => 'اختر موضوع الرسالة من القائمة.',
            'message.min' => 'وضّح رسالتك في جملة على الأقل.',
        ]);

        $msg = ContactMessage::create($data + ['ip' => $request->ip()]);

        $to = config('mail.from.address');
        try {
            if ($to) {
                $body = "رسالة جديدة من نموذج «تواصل معنا» في منصة دفة\n\n"
                    ."الاسم: {$data['name']}\nالمنظمة: ".($data['org'] ?? '—')."\nالبريد: {$data['email']}\nالجوال: ".($data['phone'] ?? '—')
                    ."\nالموضوع: {$data['subject']}\n\n{$data['message']}\n";
                Mail::raw($body, function ($m) use ($to, $data) {
                    $m->to($to)->replyTo($data['email'], $data['name'])->subject('تواصل معنا — '.$data['subject'].' — '.$data['name']);
                });
                $msg->update(['emailed_at' => now()]);
            }
        } catch (\Throwable $e) {
            Log::warning('Contact mail failed: '.$e->getMessage());
        }
        ActivityLog::record(null, 'رسالة من نموذج تواصل معنا', 'contact', 'guest', "{$data['subject']} — {$data['name']}");

        return response()->json(['message' => 'وصلتنا رسالتك، وسنرد عليك على بريدك الإلكتروني في أقرب وقت.'], 201);
    }
}
