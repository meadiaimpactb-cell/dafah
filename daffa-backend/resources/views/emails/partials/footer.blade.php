@php($site = rtrim(config('app.url'), '/'))
<div class="footer" style="background:#f8fafb;padding:16px 32px;text-align:center;color:#9ca3af;font-size:12px;line-height:1.7;">
  رسالة آلية من منصة دفة — <a href="{{ $site }}/" target="_blank" rel="noopener" style="color:#1A6B7C;text-decoration:none;font-weight:bold;">daffah.org</a><br>
  © {{ date('Y') }} منصة دفة — جميع الحقوق محفوظة
</div>
