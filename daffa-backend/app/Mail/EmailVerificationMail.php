<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $orgName,
        public string $purpose = 'verify' // verify | email_change
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->purpose === 'email_change'
                ? 'تأكيد بريدك الإلكتروني الجديد — منصة دفة'
                : 'رمز تأكيد بريدك الإلكتروني — منصة دفة',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verify-otp',
            text: 'emails.verify-otp-text', // نسخة نصية تحسّن وصول الرسالة إلى صندوق الوارد
            with: ['minutes' => \App\Support\EmailOtp::TTL_MINUTES],
        );
    }
}
