{{-- رأس رسائل منصة دفة: الشعار (نسخة بيضاء على خلفية الهوية) ويفتح موقع المنصة عند الضغط عليه.
     الصورة برابط مطلق على موقع المنصة لأن برامج البريد لا تعرض الصور المضمّنة بصيغة data: --}}
@php($site = rtrim(config('app.url'), '/'))
<div class="header" style="background:#1A6B7C;padding:22px 24px 18px;text-align:center;">
  <a href="{{ $site }}/" target="_blank" rel="noopener" title="الانتقال إلى منصة دفة" style="display:inline-block;text-decoration:none;border:0;">
    <img src="{{ $site }}/logo-white.png" width="140" height="140"
         alt="منصة دفة — للتخطيط الاستراتيجي وصناعة السياسات"
         style="display:block;width:140px;height:140px;max-width:140px;border:0;outline:none;text-decoration:none;margin:0 auto;color:#ffffff;font-size:18px;font-weight:bold;font-family:Tahoma,Arial,sans-serif;line-height:1.6;">
  </a>
</div>
