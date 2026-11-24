// عناوين URL وبيانات SEO للصفحات العامة — المصدر الوحيد لربط المسار بالصفحة (view).
// الصفحات المسجَّلة هنا يخدمها الخادم بحالة 200 (انظر public/.htaccess)، وأي مسار آخر → 404 داخل الواجهة.
export const SITE_NAME = 'منصة دفة';

export const PUBLIC_PATHS = {
  landing: '/',
  about: '/about',
  services: '/services',
  pricing: '/pricing',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  login: '/login',
  register: '/register',
};

const VIEW_BY_PATH = Object.fromEntries(Object.entries(PUBLIC_PATHS).map(([v, p]) => [p, v]));

/** الصفحة المقابلة للمسار الحالي، أو not-found لمسار غير معروف. */
export function viewFromPath(pathname) {
  let p = (pathname || '/').replace(/\/+$/, '') || '/';
  if (p === '/index.html') p = '/';
  return VIEW_BY_PATH[p] || 'not-found';
}

const DESC = 'منصة دفة تساعد الجمعيات والمؤسسات غير الربحية على بناء الخطة الاستراتيجية والخطة التشغيلية وإعداد السياسات واللوائح خطوة بخطوة، مع مراجعة واعتماد من مستشار متخصص.';

// النصوص نفسها التي يرسلها الخادم في HTML (app/Support/SeoPages.php) — عدّلهما معًا
export const SEO = {
  landing: { title: 'منصة دفة | التخطيط الاستراتيجي والسياسات للمنظمات غير الربحية', description: 'ابنِ الخطة الاستراتيجية والتشغيلية وسياسات ولوائح جمعيتك خطوة بخطوة عبر منصة دفة، بفيديوهات ونماذج جاهزة ومراجعة واعتماد من مستشار متخصص عن بعد.' },
  about: { title: 'عن منصة دفة | كيف نبني خطط المنظمات غير الربحية', description: 'تعرّف على منصة دفة: رؤيتها ورسالتها وآلية عملها التي ترشد الجمعيات والمؤسسات غير الربحية لبناء خططها وسياساتها خطوة بخطوة بإشراف مستشار متخصص.' },
  services: { title: 'خدمات دفة: التخطيط الاستراتيجي والتشغيلي والسياسات', description: 'ثلاث خدمات مستقلة للمنظمات غير الربحية: خطة استراتيجية في 11 وحدة، وخطة تشغيلية في 5 وحدات، و19 سياسة ولائحة، مع مراجعة واعتماد مستشار متخصص.' },
  pricing: { title: 'أسعار منصة دفة | التخطيط الاستراتيجي والسياسات واللوائح', description: 'أسعار خدمات منصة دفة للتخطيط الاستراتيجي والتشغيلي والسياسات واللوائح، بسعر مستقل لكل سياسة، مع اختيار مستشارك قبل الدفع وخدمات إضافية اختيارية.' },
  contact: { title: 'تواصل مع منصة دفة | الاستفسارات والدعم الفني', description: 'تواصل مع فريق منصة دفة للاستفسار عن خدمات التخطيط الاستراتيجي والتشغيلي وبناء السياسات واللوائح، أو للدعم الفني وطلبات الشراكة مع منظمتك.' },
  privacy: { title: 'سياسة الخصوصية | منصة دفة', description: 'كيف تجمع منصة دفة بيانات المنظمات ومستخدميها وتستخدمها وتحميها، ومع من تشاركها، وحقوقك في الوصول إليها وتصحيحها وحذفها وفق نظام حماية البيانات الشخصية.' },
  terms: { title: 'شروط استخدام منصة دفة', description: 'الشروط التي تنظّم استخدام منصة دفة للتخطيط الاستراتيجي والتشغيلي وبناء السياسات: الحسابات، ودور المستشار، والمدفوعات، والملكية الفكرية للمخرجات، والمسؤولية.' },
  login: { title: 'تسجيل الدخول | منصة دفة', description: 'سجّل دخولك إلى منصة دفة لمتابعة خطط منظمتك وسياساتها.', noindex: true },
  register: { title: 'أنشئ حساب منظمتك | منصة دفة', description: 'أنشئ حساب منظمتك في منصة دفة وابدأ رحلة التخطيط الاستراتيجي والتشغيلي وبناء السياسات.', noindex: true },
  'not-found': { title: 'الصفحة غير موجودة | منصة دفة', description: DESC, noindex: true },
  app: { title: 'لوحة التحكم | منصة دفة', description: DESC, noindex: true },
};

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** يحدّث العنوان والوصف والرابط القانوني وبطاقات المشاركة حسب الصفحة المعروضة. */
export function applySeo(view) {
  if (typeof document === 'undefined') return;
  // أول عرض لصفحة جاءت من الخادم بوسومها الصحيحة (قد يكون الوصف فيها أدق، كالأسعار الفعلية) — لا نستبدلها
  const served = document.head.querySelector('meta[name="df-seo-view"]');
  if (served) {
    const same = served.getAttribute('content') === (view === 'landing' ? 'home' : view);
    served.remove();
    if (same) return;
  }
  const s = SEO[view] || SEO.landing;
  const url = window.location.origin + (PUBLIC_PATHS[view] || '/');
  document.title = s.title;
  setMeta('name', 'description', s.description);
  setMeta('name', 'robots', s.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
  setMeta('property', 'og:title', s.title);
  setMeta('property', 'og:description', s.description);
  setMeta('property', 'og:url', url);
  setMeta('name', 'twitter:title', s.title);
  setMeta('name', 'twitter:description', s.description);
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}
