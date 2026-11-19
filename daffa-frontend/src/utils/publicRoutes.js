// عناوين URL وبيانات SEO للصفحات العامة — المصدر الوحيد لربط المسار بالصفحة (view).
// الصفحات المسجَّلة هنا يخدمها الخادم بحالة 200 (انظر public/.htaccess)، وأي مسار آخر → 404 داخل الواجهة.
export const SITE_NAME = 'منصة دفة';

export const PUBLIC_PATHS = {
  landing: '/',
  about: '/about',
  services: '/services',
  pricing: '/pricing',
  contact: '/contact',
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

export const SEO = {
  landing: { title: 'منصة دفة | التخطيط الاستراتيجي والتشغيلي وصناعة السياسات للمنظمات غير الربحية', description: DESC },
  about: { title: 'عن منصة دفة | فكرة النظام وآلية العمل', description: 'تعرّف على منصة دفة: نظام متكامل يرشد المنظمات غير الربحية خطوة بخطوة لبناء خططها وسياساتها بإشراف مستشارين متخصصين.' },
  services: { title: 'خدمات دفة | التخطيط الاستراتيجي والتشغيلي والسياسات واللوائح', description: 'ثلاث خدمات متكاملة للمنظمات غير الربحية: بناء الخطة الاستراتيجية، وإعداد الخطة التشغيلية، وصياغة السياسات واللوائح، مع فيديوهات ونماذج عمل ومراجعة مستشار.' },
  pricing: { title: 'أسعار خدمات منصة دفة', description: 'أسعار واضحة لخدمات التخطيط الاستراتيجي والتشغيلي وحزمة السياسات واللوائح، مع اختيار المستشار قبل الدفع.' },
  contact: { title: 'تواصل معنا | منصة دفة', description: 'تواصل مع فريق منصة دفة للاستفسارات والدعم الفني وطلبات الشراكة.' },
  login: { title: 'تسجيل الدخول | منصة دفة', description: 'سجّل دخولك إلى منصة دفة لمتابعة خططك وسياساتك.', noindex: true },
  register: { title: 'أنشئ حسابًا مجانًا | منصة دفة', description: 'أنشئ حساب منظمتك في منصة دفة وابدأ رحلة التخطيط الاستراتيجي والتشغيلي وصناعة السياسات.' },
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
  const s = SEO[view] || SEO.landing;
  const url = window.location.origin + (PUBLIC_PATHS[view] || '/');
  document.title = s.title;
  setMeta('name', 'description', s.description);
  setMeta('name', 'robots', s.noindex ? 'noindex, nofollow' : 'index, follow');
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
