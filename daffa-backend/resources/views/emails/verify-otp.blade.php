<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>رمز التحقق — منصة دفة</title>
<style>
  body { font-family: Tahoma, Arial, sans-serif; direction: rtl; background: #f8fafb; margin: 0; padding: 20px; color: #1a1a2e; }
  .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
  .header { background: #1A6B7C; padding: 28px 32px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: bold; }
  .header p { color: #b2dde6; margin: 6px 0 0; font-size: 13px; }
  .body { padding: 32px; text-align: center; }
  .greeting { font-size: 16px; font-weight: bold; margin: 0 0 8px; }
  .subtitle { color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0 0 20px; }
  .code-box { background: #f0f9fa; border: 2px dashed #1A6B7C; border-radius: 12px; padding: 18px 28px; display: inline-block; margin: 4px 0 22px; }
  .code { font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1A6B7C; font-family: 'Courier New', monospace; direction: ltr; }
  .note { color: #6b7280; font-size: 13px; line-height: 1.9; margin: 0; }
  .note strong { color: #E8620A; }
  .divider { border: none; border-top: 1px solid #f3f4f6; margin: 0; }
  .footer { background: #f8fafb; padding: 16px 32px; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.7; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>منصة دفة</h1>
    <p>للتخطيط الاستراتيجي وصناعة السياسات</p>
  </div>
  <div class="body">
    <p class="greeting">مرحبًا {{ $orgName }}،</p>
    @if ($purpose === 'email_change')
      <p class="subtitle">طلبتَ تغيير البريد الإلكتروني لحسابك في منصة دفة إلى هذا البريد.<br>أدخل الرمز التالي في صفحة الملف الشخصي لتأكيده:</p>
    @else
      <p class="subtitle">شكرًا لتسجيلك في منصة دفة.<br>أدخل الرمز التالي لتأكيد بريدك الإلكتروني وتفعيل حسابك:</p>
    @endif
    <div class="code-box">
      <div class="code">{{ $code }}</div>
    </div>
    <p class="note">
      الرمز صالح لمدة <strong>{{ $minutes }} دقائق</strong> ويُستخدم مرة واحدة.<br>
      لا تشارك هذا الرمز مع أي شخص؛ فريق دفة لن يطلبه منك أبدًا.<br><br>
      إذا لم تطلب هذا الرمز فتجاهل هذه الرسالة، ولن يتغير شيء في حسابك.
    </p>
  </div>
  <hr class="divider">
  <div class="footer">
    رسالة آلية من منصة دفة — daffah.org<br>
    © {{ date('Y') }} منصة دفة — جميع الحقوق محفوظة
  </div>
</div>
</body>
</html>
