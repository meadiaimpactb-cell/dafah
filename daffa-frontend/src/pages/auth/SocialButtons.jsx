import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useGoogleOneTap, OrDivider } from './GoogleAuthButton';

/*
 * أزرار الدخول/التسجيل عبر Google وFacebook وLinkedIn.
 * الأزرار الثلاثة ظاهرة دائمًا؛ ويعمل الزر فقط متى فُعِّل مزوّده على الخادم (المفاتيح في ‎.env‏)،
 * وإلا ظهر معطّلًا مع توضيح «بانتظار التفعيل» — فتعرف الإدارة أن الميزة موجودة قبل ضبط المفاتيح.
 * الضغط على زر مفعّل ينقل المتصفح إلى صفحة المزوّد ثم يعود إلى المنصة مسجَّلًا (انظر SocialAuthController).
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// القائمة الافتراضية قبل الجلب أو عند تعذّره: المزوّدون الثلاثة معطّلون (لا يختفي زر أبدًا)
export const DEFAULT_PROVIDERS = [
  { key: 'google', label: 'Google', enabled: false },
  { key: 'facebook', label: 'Facebook', enabled: false },
  { key: 'linkedin', label: 'LinkedIn', enabled: false },
];
const normalize = (data) => {
  const got = Array.isArray(data) ? data : [];
  return DEFAULT_PROVIDERS.map(d => {
    const p = got.find(x => x && x.key === d.key);
    // استجابة قديمة بلا حقل enabled تعني أن المزوّد مفعّل (كانت تُعاد المفعّلة فقط)
    return p ? { ...d, ...p, enabled: p.enabled === undefined ? true : !!p.enabled } : d;
  });
};

// تُخزَّن القائمة في الذاكرة فقط عند نجاح الجلب؛ الفشل لا يُخزَّن حتى لا تبقى الأزرار معطّلة
// بعد عودة من المزوّد (كانت عودة ملغاة تُثبّت نتيجة فارغة للجلسة كلها).
let providersCache = null;
let providersPromise = null;
export function useSocialProviders() {
  const [list, setList] = useState(providersCache || DEFAULT_PROVIDERS);
  useEffect(() => {
    let alive = true;
    if (providersCache) { setList(providersCache); return undefined; }
    providersPromise = providersPromise || api.get('/auth/social/providers')
      .then(r => { providersCache = normalize(r.data); return providersCache; })
      .catch(() => DEFAULT_PROVIDERS)
      .finally(() => { providersPromise = null; });
    providersPromise.then(d => { if (alive) setList(d); });
    return () => { alive = false; };
  }, []);
  return list;
}

const ICONS = {
  google: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  ),
  facebook: (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path fill="#fff" d="M16.67 15.47 17.2 12h-3.32V9.75c0-.95.46-1.88 1.96-1.88h1.51V4.92s-1.37-.23-2.68-.23c-2.74 0-4.53 1.66-4.53 4.66V12H7.09v3.47h3.05V24h3.74v-8.53h2.79z" />
    </svg>
  ),
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="3" fill="#0A66C2" />
      <path fill="#fff" d="M7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28z" />
    </svg>
  ),
};

const CSS = `
.df-social{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px}
.df-social button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:50px;padding:10px 8px;background:#fff;border:1.5px solid #E8E3DA;border-radius:14px;font:inherit;font-size:14.5px;font-weight:800;color:#334452;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .1s;direction:ltr}
.df-social button:hover{border-color:#C9D7E1;box-shadow:0 4px 14px rgba(14,42,61,.08)}
.df-social button:active{transform:translateY(1px)}
.df-social button:focus-visible{outline:3px solid rgba(35,93,127,.3);outline-offset:1px}
.df-social button[disabled]{opacity:.6;cursor:wait}
.df-social button.off{cursor:not-allowed;background:#FAF8F4;border-style:dashed;color:#8C97A3;box-shadow:none;transform:none;position:relative}
.df-social button.off svg{filter:grayscale(1);opacity:.55}
.df-social button.off .soon{position:absolute;top:-9px;inset-inline-end:10px;background:#FFF3E8;color:#B5531D;border:1px solid #F5CDB0;border-radius:999px;padding:1px 8px;font-size:10px;font-weight:800;direction:rtl}
.df-social button svg{flex-shrink:0}
@media (max-width:380px){.df-social button span.lbl{font-size:13px}}
`;

/**
 * intent: 'login' | 'register' — يحدد أي صفحة تُفتح لو عاد المزوّد بخطأ.
 * label: نص الفاصل فوق الأزرار. after: فاصل يظهر بعد الأزرار (مثل «أو سجّل بالبريد الإلكتروني»).
 */
export default function SocialButtons({ intent = 'login', label, after, note, onLogin, onError }) {
  const providers = useSocialProviders();
  const [busy, setBusy] = useState(null);
  const [hint, setHint] = useState(null);
  const google = providers.find(p => p.key === 'google');
  const verb = intent === 'register' ? 'التسجيل' : 'الدخول';
  const off = providers.filter(p => !p.enabled);
  const allOff = off.length === providers.length;

  useGoogleOneTap(google?.enabled ? google.client_id : undefined, { onLogin, onError, context: intent === 'register' ? 'signup' : 'signin' });

  const go = (p) => {
    if (!p.enabled) { setHint(`${verb} عبر ${p.label} بانتظار التفعيل — استخدم البريد الإلكتروني حاليًا.`); return; }
    setBusy(p.key);
    window.location.assign(`${API_BASE}/auth/social/${p.key}/redirect?intent=${intent}`);
  };

  // توضيح حالة المزوّدين غير المفعّلين (يظهر بدل الملاحظة العادية عندما يكون الجميع معطّلًا)
  const offNote = off.length
    ? (allOff
        ? `${verb} عبر هذه الحسابات بانتظار التفعيل — سيعمل تلقائيًا فور اكتمال ربطها.`
        : `${verb} عبر ${off.map(p => p.label).join(' و')} بانتظار التفعيل.`)
    : null;

  return (
    <div>
      <style>{CSS}</style>
      {label && <OrDivider label={label} />}
      <div className="df-social" role="group" aria-label="الدخول عبر حساباتك">
        {providers.map(p => (
          <button key={p.key} type="button" onClick={() => go(p)} disabled={!!busy}
            className={p.enabled ? undefined : 'off'} aria-disabled={!p.enabled}
            data-provider={p.key} data-enabled={p.enabled ? '1' : '0'}
            title={p.enabled ? undefined : 'بانتظار التفعيل'}
            aria-label={`${verb} عبر ${p.label}${p.enabled ? '' : ' (بانتظار التفعيل)'}`}>
            {!p.enabled && <span className="soon" aria-hidden="true">قريبًا</span>}
            <span className="lbl">{busy === p.key ? '...' : p.label}</span>
            {ICONS[p.key]}
          </button>
        ))}
      </div>
      {hint && <p role="status" style={{ fontSize: 12, color: '#B5531D', textAlign: 'center', margin: '10px 0 0', lineHeight: 1.8, fontWeight: 700 }}>{hint}</p>}
      {(allOff ? offNote : note) && <p style={{ fontSize: 12, color: '#8C97A3', textAlign: 'center', margin: '10px 0 0', lineHeight: 1.8 }}>{allOff ? offNote : note}</p>}
      {!allOff && offNote && <p style={{ fontSize: 11.5, color: '#B5531D', textAlign: 'center', margin: '6px 0 0', lineHeight: 1.7 }}>{offNote}</p>}
      {after && <OrDivider label={after} />}
    </div>
  );
}
