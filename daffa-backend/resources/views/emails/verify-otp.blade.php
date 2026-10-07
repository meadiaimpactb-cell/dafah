<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: Arial, Tahoma, sans-serif; direction: rtl; background: #f8fafb; margin: 0; padding: 20px; color: #1a1a2e; }
  .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
  .header { background: #1A6B7C; padding: 28px 32px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: bold; }
  .header p { color: #b2dde6; margin: 6px 0 0; font-size: 13px; }
  .body { padding: 32px; text-align: center; }
  .greeting { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
  .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
  .code-box { background: #f0f9fa; border: 2px dashed #1A6B7C; border-radius: 12px; padding: 20px 32px; display: inline-block; margin: 8px 0 24px; }
  .code { font-size: 44px; font-weight: bold; letter-spacing: 14px; color: #1A6B7C; font-family: 'Courier New', monospace; }
  .note { color: #6b7280; font-size: 13px; line-height: 1.9; }
  .note strong { color: #E8620A; }
  .divider { border: none; border-top: 1px solid #f3f4f6; margin: 24px 0; }
  .footer { background: #f8fafb; padding: 16px 32px; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.7; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>منصة دافة</h1>
    <p>للتخطيط الاستراتيجي وصناعة السياسات</p>
  </div>
  <div class="body">
    <p class="greeting">مرحباً {{ $orgName }}،</p>
    <p class="subtitle">رمز التحقق من بريدك الإلكتروني:</p>
    <div class="code-box">
      <div class="code">{{ $code }}</div>
    </div>
    <p class="note">
      هذا الرمز صالح لمدة <strong>10 دقائق</strong> فقط.<br>
      أدخله في الصفحة للمتابعة وتفعيل حسابك.<br>
      <br>
      إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.
    </p>
  </div>
  <hr class="divider">
  <div class="footer">
    هذه رسالة آلية، يرجى عدم الرد عليها.<br>
    © {{ date('Y') }} منصة دافة — جميع الحقوق محفوظة
  </div>
</div>
</body>
</html>
