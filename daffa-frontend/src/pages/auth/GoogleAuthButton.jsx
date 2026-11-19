import { useEffect, useRef } from 'react';
import api from '../../api/axios';

/*
 * نافذة Google للدخول بنقرة واحدة (One Tap): تظهر تلقائيًا لمن لديه جلسة Google في المتصفح.
 * معرّف العميل (عام) يأتي من الخادم وقت التشغيل (/auth/social/providers) — لا حاجة لإعادة بناء الواجهة عند ضبطه.
 * الخادم يتحقق من الرمز ومن أنه صادر لعميل دفة نفسه (POST /auth/google).
 */

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let googleScriptPromise = null;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => { googleScriptPromise = null; reject(); });
        return;
      }
      const script = document.createElement('script');
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => { googleScriptPromise = null; reject(); };
      document.head.appendChild(script);
    });
  }
  return googleScriptPromise;
}

/** يعرض نافذة One Tap متى توفّر clientId. onLogin(user, { needsProfile, isNew })، onError(message) */
export function useGoogleOneTap(clientId, { onLogin, onError, context = 'signin' } = {}) {
  const handlers = useRef({ onLogin, onError });
  handlers.current = { onLogin, onError };

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          context,
          cancel_on_tap_outside: true,
          itp_support: true,
          callback: async (response) => {
            const { onLogin: done, onError: fail } = handlers.current;
            if (!response?.credential) return;
            try {
              const res = await api.post('/auth/google', { token: response.credential });
              localStorage.setItem('token', res.data.token);
              localStorage.setItem('user', JSON.stringify(res.data.user));
              done?.(res.data.user, { needsProfile: res.data.needs_profile, isNew: res.data.is_new });
            } catch (err) {
              fail?.(err.response?.data?.message || 'تعذّر الدخول عبر Google. حاول مرة أخرى.');
            }
          },
        });
        window.google.accounts.id.prompt();
      })
      .catch(() => { /* النافذة اختيارية — يبقى زر Google العادي متاحًا */ });

    return () => {
      cancelled = true;
      try { window.google?.accounts?.id?.cancel(); } catch { /* لا شيء */ }
    };
  }, [clientId, context]);
}

/** فاصل «أو» */
export const OrDivider = ({ label = 'أو' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 12px' }} aria-hidden="true">
    <span style={{ flex: 1, height: 1, background: '#E8E3DA' }} />
    <span style={{ fontSize: 12.5, color: '#8C97A3', fontWeight: 600 }}>{label}</span>
    <span style={{ flex: 1, height: 1, background: '#E8E3DA' }} />
  </div>
);
