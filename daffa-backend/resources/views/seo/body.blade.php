{{-- محتوى الصفحة العامة كما يصل في HTML (لمحركات البحث وقبل تشغيل JavaScript). التطبيق يستبدله بالتصميم الكامل. --}}
@php
    $sc = fn ($k, $d = '') => (isset($c[$k]) && trim((string) $c[$k]) !== '') ? $c[$k] : $d;
    $L = \App\Support\SeoPages::LABELS;
    $P = \App\Support\SeoPages::PATHS;
    $paras = function ($text) {
        $out = '';
        foreach (preg_split("/\R{2,}/u", trim((string) $text)) as $block) {
            $block = trim($block);
            if ($block === '') continue;
            if (str_starts_with($block, '## ')) { $out .= '<h2>'.e(mb_substr($block, 3)).'</h2>'; continue; }
            $lines = preg_split("/\R/u", $block);
            if (count($lines) > 1 && collect($lines)->every(fn ($l) => str_starts_with(trim($l), '- '))) {
                $out .= '<ul>'.collect($lines)->map(fn ($l) => '<li>'.e(trim(mb_substr(trim($l), 2))).'</li>')->implode('').'</ul>';
            } else {
                $out .= '<p>'.nl2br(e($block)).'</p>';
            }
        }
        return $out;
    };
@endphp
<div class="df-shell">
  <header class="df-shell-nav">
    <a class="brand" href="/" aria-label="منصة دفة — الرئيسية">منصة دفة</a>
    <nav aria-label="روابط الموقع">
      @foreach (['about', 'services', 'pricing', 'contact', 'login'] as $k)
        <a href="{{ $P[$k] }}">{{ $L[$k] }}</a>
      @endforeach
    </nav>
  </header>

@if ($page === 'home')
  <main>
    <section class="df-shell-hero">
      <div class="in">
        <h1>{{ $sc('hero_title', 'نظام البناء الاستراتيجي والتشغيلي للمنظمات غير الربحية') }}</h1>
        <p>ابنِ خطة منظمتك الاستراتيجية والتشغيلية وسياساتها خطوة بخطوة، مع فيديوهات ونماذج عمل، ومراجعة واعتماد من مستشار متخصص عن بعد.</p>
        <div class="df-shell-cta">
          <a class="primary" href="/register">ابدأ مجانًا الآن</a>
          <a class="ghost" href="/services">استعرض الخدمات</a>
        </div>
      </div>
    </section>
    <div class="df-shell-main">
      <h2>لماذا دفة سهلة لغير المتخصص؟</h2>
      <h3>شرح بلغة بسيطة</h3><p>كل مصطلح عليه علامة «؟» تشرحه بمثال من واقع الجمعيات — لا تحتاج خبرة سابقة.</p>
      <h3>نماذج جاهزة للتعبئة</h3><p>تعبّئ خانات واضحة خطوة بخطوة، وتخرج لك وثيقة مصمّمة جاهزة للاعتماد.</p>
      <h3>مستشار معك في كل خطوة</h3><p>خبير يراجع كل وحدة ويعتمدها أو يوجّهك بملاحظات واضحة، وتراسله متى شئت.</p>

      <h2>أربع خطوات… وخطتك جاهزة</h2>
      <p>{{ $sc('how_it_works_desc', 'يعمل النظام بشكل شبه آلي، بحيث يوجد مستشار متخصص يراجع عن بعد مخرجات كل مرحلة.') }}</p>
      <ol>
        @foreach ([['step1', 'اختر الخدمة', 'التخطيط الاستراتيجي أو التشغيلي أو السياسات'], ['step2', 'ادفع واختر المستشار', 'أسعار مناسبة مع اختيار المستشار المناسب'], ['step3', 'تعلّم ونفّذ', 'فيديوهات + شرح + إرشادات + نماذج عمل'], ['step4', 'المستشار يراجع ويعتمد', 'مراجعة واعتماد من مستشار متخصص عن بعد']] as [$k, $t, $d])
          <li><strong>{{ $sc($k.'_title', $t) }}</strong> — {{ $sc($k.'_desc', $d) }}</li>
        @endforeach
      </ol>

      <h2>ثلاث خدمات مستقلة… ابدأ بما تحتاجه</h2>
      <h3><a href="/services#strategic">نظام التخطيط الاستراتيجي</a></h3><p>{{ $sc('comp_strategic_desc', '11 وحدة تخطيطية لبناء خطة استراتيجية متكاملة') }}</p>
      <h3><a href="/services#operational">نظام التخطيط التشغيلي</a></h3><p>{{ $sc('comp_operational_desc', '5 وحدات لتحويل الاستراتيجية إلى خطة تنفيذية') }}</p>
      <h3><a href="/services#policies">نظام بناء السياسات واللوائح</a></h3><p>{{ $sc('comp_policies_desc', '19 سياسة ولائحة ضمن «حزمة دفة v3.0» تُبنى عبر استبيانات ذكية موجهة') }}</p>

      <h2>تكلفة في متناول كل جمعية</h2>
      <ul>
        @foreach ([1, 2, 3, 4, 5] as $i)
          @if ($sc('pricing_point'.$i)) <li>{{ $sc('pricing_point'.$i) }}</li> @endif
        @endforeach
      </ul>
      <p><a href="/pricing">عرض أسعار خدمات دفة بالتفصيل</a></p>
      <h2>{{ $sc('cta_title', 'ابدأ رحلة التخطيط الاستراتيجي لمنظمتك الآن') }}</h2>
      <p><a href="/register">أنشئ حساب منظمتك مجانًا</a></p>
    </div>
  </main>
@else
  <nav class="df-crumbs" aria-label="مسار التنقل">
    <ol><li><a href="/">{{ $L['home'] }}</a></li><li aria-current="page">{{ $L[$page] }}</li></ol>
  </nav>
  <main>
    <section class="df-shell-band">
      <h1>{{ ['about' => 'عن منصة دفة', 'services' => 'خدمات منصة دفة', 'pricing' => 'الأسعار', 'contact' => 'تواصل معنا', 'privacy' => 'سياسة الخصوصية', 'terms' => 'شروط الاستخدام', 'login' => 'تسجيل الدخول', 'register' => 'أنشئ حساب منظمتك'][$page] }}</h1>
      <p>{{ match ($page) {
          'about' => $sc('about_hero_subtitle', 'للتخطيط الاستراتيجي وصناعة السياسات'),
          'services' => $sc('services_hero_subtitle', 'ثلاثة أنظمة متكاملة لبناء منظمتك'),
          'pricing' => $sc('pricing_hero_subtitle', 'أسعار مناسبة لجميع المنظمات غير الربحية'),
          'contact' => $sc('contact_hero_subtitle', 'نسعد بتواصلكم والإجابة على استفساراتكم'),
          'privacy' => 'كيف نجمع بياناتك ونستخدمها ونحميها',
          'terms' => 'الشروط التي تنظّم استخدام منصة دفة',
          default => 'منصة دفة للتخطيط الاستراتيجي والتشغيلي وبناء السياسات',
      } }}</p>
    </section>
    <div class="df-shell-main">
    @switch($page)
      @case('about')
        <h2>رؤيتنا</h2><p>{{ $sc('vision_text', 'أن نكون المنصة الرائدة في تمكين المنظمات غير الربحية.') }}</p>
        <h2>رسالتنا</h2><p>{{ $sc('mission_text', 'نقدم نظاماً شبه آلي يوفر أدوات تخطيط متكاملة مع إشراف مستشارين متخصصين.') }}</p>
        <h2>كيف يعمل النظام</h2>
        @foreach ([1 => ['نظام شبه آلي', 'محتوى تعليمي مسجل مع نماذج عمل جاهزة'], 2 => ['إشراف المستشار', 'مستشار متخصص يراجع عن بعد مخرجات كل مرحلة'], 3 => ['مخرجات احترافية', 'وثائق نهائية مصممة تلقائياً']] as $i => [$t, $d])
          <h3>{{ $sc("howworks{$i}_title", $t) }}</h3><p>{{ $sc("howworks{$i}_desc", $d) }}</p>
        @endforeach
        <p>تعرّف على <a href="/services">خدمات منصة دفة</a> و<a href="/pricing">أسعارها</a>، أو <a href="/contact">تواصل معنا</a>.</p>
        @break

      @case('services')
        @foreach (\App\Support\SeoPages::services($c) as $s)
          <section id="{{ $s['id'] }}">
            <h2>{{ $s['name'] }}</h2>
            <p>{{ $s['desc'] }}</p>
            @if ($s['id'] !== 'policies' && ! empty($units[$s['id']]))
              <h3>وحدات {{ $s['id'] === 'strategic' ? 'الخطة الاستراتيجية' : 'الخطة التشغيلية' }}</h3>
              <ol>@foreach ($units[$s['id']] as $u)<li>{{ $u }}</li>@endforeach</ol>
            @elseif ($s['id'] === 'policies' && $policies)
              <h3>السياسات واللوائح المتاحة</h3>
              <ul>@foreach ($policies as $p)<li>{{ $p['name'] }}</li>@endforeach</ul>
            @endif
            @if ($s['price'] !== null)<p>السعر: {{ $s['from'] ? 'يبدأ من ' : '' }}{{ number_format($s['price']) }} ريال — <a href="/pricing">تفاصيل الأسعار</a></p>@endif
          </section>
        @endforeach
        <h2>هيكل الوحدة التخطيطية</h2>
        <p>كل وحدة تخطيطية في الأنظمة الثلاثة تتكون من: نبذة، وشرح مكتوب، وإرشادات، وفيديو، وخدمة الدردشة، ونماذج عمل، ثم اعتماد المستشار.</p>
        @break

      @case('pricing')
        @foreach (\App\Support\SeoPages::services($c) as $s)
          <h2>{{ $s['name'] }}</h2>
          @if ($s['price'] !== null)<p><strong>{{ $s['from'] ? 'من ' : '' }}{{ number_format($s['price']) }} ريال</strong></p>@endif
          <p>{{ $s['desc'] }}</p>
        @endforeach
        <h2>الخدمات الإضافية</h2>
        <ul>
          @foreach ([1 => ['اعتماد الخطة من جهة استشارية', '2,000', 'اعتماد رسمي من جهة معتمدة'], 2 => ['تحكيم السياسات من مستشار', '2,000', 'تحكيم ومراجعة متعمقة'], 3 => ['تصميم احترافي للوثائق', '1,500', 'تصميم بهوية المنظمة']] as $i => [$t, $p, $d])
            <li>{{ $sc("addon{$i}_title", $t) }}: {{ $sc("addon{$i}_price", $p) }} ريال — {{ $sc("addon{$i}_desc", $d) }}</li>
          @endforeach
        </ul>
        @if ($policies)
          <h2>تسعير السياسات واللوائح (مستقل)</h2>
          <table>
            <thead><tr><th>الرمز</th><th>السياسة</th><th>السعر</th></tr></thead>
            <tbody>@foreach ($policies as $p)<tr><td dir="ltr">{{ $p['code'] ?? '' }}</td><td>{{ $p['name'] }}</td><td>{{ number_format((float) ($p['price'] ?? 0)) }} ريال</td></tr>@endforeach</tbody>
          </table>
        @endif
        @break

      @case('contact')
        <h2>معلومات التواصل</h2>
        <ul>
          @if ($email)<li>البريد الإلكتروني: <a href="mailto:{{ $email }}" dir="ltr">{{ $email }}</a></li>@endif
          @if ($phone)<li>الهاتف: <a href="tel:{{ preg_replace('/\s+/', '', $phone) }}" dir="ltr">{{ $phone }}</a></li>@endif
          <li>العنوان: {{ $sc('contact_address', 'الرياض، المملكة العربية السعودية') }}</li>
          <li>ساعات العمل: {{ $sc('contact_hours', 'الأحد - الخميس: 8 ص - 5 م') }}</li>
        </ul>
        <p>يمكنك إرسال رسالتك عبر نموذج التواصل في هذه الصفحة، وسيرد عليك فريق منصة دفة.</p>
        @break

      @case('privacy')
        {!! $paras($sc('privacy_policy')) !!}
        @break

      @case('terms')
        {!! $paras($sc('terms_of_use')) !!}
        @break

      @default
        <p><a href="/register">أنشئ حسابًا</a> أو <a href="/login">سجّل الدخول</a> لمتابعة خطط منظمتك.</p>
    @endswitch
    </div>
  </main>
@endif

  <footer class="df-shell-foot">
    <nav aria-label="روابط التذييل">
      @foreach (['home', 'about', 'services', 'pricing', 'contact', 'privacy', 'terms'] as $k)
        <a href="{{ $P[$k] }}">{{ $L[$k] }}</a>
      @endforeach
    </nav>
    <div>{{ $sc('footer_copyright', 'جميع الحقوق محفوظة © 2026 منصة دفة') }}</div>
  </footer>
</div>
