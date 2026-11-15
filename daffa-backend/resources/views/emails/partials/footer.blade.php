@php($site = rtrim(config('app.url'), '/'))
<div class="footer" style="background:#FBF9F5;padding:16px 32px;text-align:center;color:#8F8BA3;font-size:12px;line-height:1.7;">
  رسالة آلية من منصة دفة — <a href="{{ $site }}/" target="_blank" rel="noopener" style="color:#5546D6;text-decoration:none;font-weight:bold;">daffah.org</a><br>
  © {{ date('Y') }} منصة دفة — جميع الحقوق محفوظة
</div>
