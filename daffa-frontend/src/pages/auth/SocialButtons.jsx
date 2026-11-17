import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useGoogleOneTap, OrDivider } from './GoogleAuthButton';

/*
 * أزرار الدخول/التسجيل عبر Google وFacebook وLinkedIn.
 * تظهر فقط المزوّدات المفعّلة على الخادم (المفاتيح في ‎.env‏) — لا يظهر زر معطّل للزائر.
 * الضغط ينقل المتصفح إلى صفحة المزوّد ثم يعود إلى المنصة مسجَّلًا (انظر SocialAuthController).
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// تُخزَّن القائمة في الذاكرة فقط عند نجاح الجلب بنتيجة غير فارغة؛ الفشل أو الفراغ لا يُخزَّن حتى لا يختفي الزر
// بعد عودة من المزوّد (كانت عودة ملغاة تُثبّت [] للجلسة كلها فتختفي الأزرار).
let providersCache = null;
let providersPromise = null;
export function useSocialProviders() {
  const [list, setList] = useState(providersCache || []);
  useEffect(() => {
    let alive = true;
    if (providersCache) { setList(providersCache); return undefined; }
    providersPromise = providersPromise || api.get('/auth/social/providers')
      .then(r => {
        const d = Array.isArray(r.data) ? r.data : [];
        if (d.length) providersCache = d;
        return d;
      })
      .catch(() => [])
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
  const google = providers.find(p => p.key === 'google');

  useGoogleOneTap(google?.client_id, { onLogin, onError, context: intent === 'register' ? 'signup' : 'signin' });

  if (!providers.length) return null;

  const go = (key) => {
    setBusy(key);
    window.location.assign(`${API_BASE}/auth/social/${key}/redirect?intent=${intent}`);
  };

  return (
    <div>
      <style>{CSS}</style>
      {label && <OrDivider label={label} />}
      <div className="df-social" role="group" aria-label="الدخول عبر حساباتك">
        {providers.map(p => (
          <button key={p.key} type="button" onClick={() => go(p.key)} disabled={!!busy}
            aria-label={`${intent === 'register' ? 'التسجيل' : 'الدخول'} عبر ${p.label}`}>
            <span className="lbl">{busy === p.key ? '...' : p.label}</span>
            {ICONS[p.key]}
          </button>
        ))}
      </div>
      {note && <p style={{ fontSize: 12, color: '#8C97A3', textAlign: 'center', margin: '10px 0 0', lineHeight: 1.8 }}>{note}</p>}
      {after && <OrDivider label={after} />}
    </div>
  );
}
