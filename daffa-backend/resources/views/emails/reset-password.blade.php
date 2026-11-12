<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>إعادة تعيين كلمة المرور — منصة دفة</title>
<style>
  body { font-family: Tahoma, Arial, sans-serif; direction: rtl; background: #f8fafb; margin: 0; padding: 20px; color: #1a1a2e; }
  .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
  .header { background: #1A6B7C; padding: 28px 32px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: bold; }
  .header p { color: #b2dde6; margin: 6px 0 0; font-size: 13px; }
  .body { padding: 32px; text-align: center; }
  .greeting { font-size: 16px; font-weight: bold; margin: 0 0 8px; }
  .subtitle { color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0 0 22px; }
  .btn { display: inline-block; background: #E8620A; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 15px; padding: 13px 30px; border-radius: 10px; }
  .note { color: #6b7280; font-size: 13px; line-height: 1.9; margin: 22px 0 0; }
  .link { color: #1A6B7C; font-size: 12px; word-break: break-all; direction: ltr; display: block; margin-top: 6px; }
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
    <p class="greeting">مرحبًا {{ $name }}،</p>
    <p class="subtitle">وصلنا طلب لإعادة تعيين كلمة المرور لحسابك في منصة دفة.<br>اضغط الزر التالي لاختيار كلمة مرور جديدة:</p>
    <a class="btn" href="{{ $url }}">إعادة تعيين كلمة المرور</a>
    <p class="note">
      الرابط صالح لمدة {{ $minutes }} دقيقة ويُستخدم مرة واحدة.<br>
      إذا لم تطلب إعادة التعيين فتجاهل هذه الرسالة، وستبقى كلمة المرور كما هي.<br><br>
      إن لم يعمل الزر فانسخ هذا الرابط في المتصفح:
      <span class="link">{{ $url }}</span>
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
