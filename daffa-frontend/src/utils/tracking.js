// أدوات القياس في متصفح الزائر.
//  • لا يُحمَّل شيء ما لم يضبط المشرف معرّفًا صالحًا ويوافق الزائر صراحةً («موافق على الكل»).
//  • لا تعمل إلا في الصفحات العامة: لوحات التحكم وصفحات الدخول فيها بيانات المنظمات وخططها، ولا تخص شركات الإعلان.
//  • المعرّف يدخل كودًا يُنفَّذ، فلا يُقبل إلا ما يطابق صيغته تمامًا (utils/seoRules.js).
import { TRACKING_KEYS, isValidTracking } from './seoRules';

const CONSENT_KEY = 'df_measure';
export const CONSENT_EVENT = 'df-consent';

export function getMeasureConsent() {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'yes' || v === 'no' ? v : null;
  } catch {
    return null;
  }
}

export function setMeasureConsent(v) {
  try { localStorage.setItem(CONSENT_KEY, v); } catch { /* التخزين معطّل: يسري الاختيار حتى إغلاق الصفحة */ }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
}

function inline(id, code) {
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.textContent = code;
  document.head.appendChild(s);
}
function external(id, src) {
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id; s.async = true; s.src = src;
  document.head.appendChild(s);
}

let loaded = false;
let active = false;
export const trackersLoaded = () => loaded;
export const setTrackingActive = (v) => { active = v; };

/** يحمّل كل أداة مضبوطة مرة واحدة، ويرجع true إن حُمّل شيء */
export function applyTracking(settings) {
  const val = (k) => (isValidTracking(k, settings?.[k]) ? String(settings[k]).trim() : '');
  const [gtm, ga4, pixel, clarity, tiktok, snap] = TRACKING_KEYS.map(val);
  if (gtm) inline('df-gtm', `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`);
  if (ga4) {
    external('df-ga4-src', `https://www.googletagmanager.com/gtag/js?id=${ga4}`);
    inline('df-ga4', `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga4}',{send_page_view:false,anonymize_ip:true});`);
  }
  if (pixel) inline('df-meta-pixel', `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');`);
  if (clarity) inline('df-clarity', `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script','${clarity}');`);
  if (tiktok) inline('df-tiktok', `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktok}');}(window,document,'ttq');`);
  if (snap) inline('df-snap', `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${snap}');`);
  const any = !!(gtm || ga4 || pixel || clarity || tiktok || snap);
  if (any) loaded = true;
  return any;
}

/** زيارة صفحة: المسار وحده بلا معاملات (قد يحمل الرابط ما لا يخص شركات القياس) */
export function trackPageView(path, title) {
  if (!active) return;
  const w = window;
  w.dataLayer?.push({ event: 'page_view', page_path: path, page_title: title });
  w.gtag?.('event', 'page_view', { page_path: path, page_title: title });
  w.fbq?.('track', 'PageView');
  w.ttq?.page?.();
  w.snaptr?.('track', 'PAGE_VIEW');
}

/** حدث تحويل بلا أي بيانات شخصية */
export function trackEvent(name, data = {}) {
  if (!active) return;
  const w = window;
  w.dataLayer?.push({ event: name, ...data });
  w.gtag?.('event', name, data);
  w.fbq?.('trackCustom', name, data);
  w.ttq?.track?.(name, data);
}
