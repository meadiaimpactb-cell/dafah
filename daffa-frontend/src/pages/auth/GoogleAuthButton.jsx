import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

/*
 * زر Google الرسمي (Google Identity Services) للدخول أو التسجيل.
 * يظهر فقط عند ضبط VITE_GOOGLE_CLIENT_ID وقت البناء. الخادم يتحقق من الرمز ومن أنه صادر لعميل دفة نفسه.
 * حساب Google جديد ← يُنشأ حساب عميل مؤكَّد البريد، ثم يُوجَّه لإكمال بيانات المنظمة (needs_profile).
 */

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_ENABLED = !!GOOGLE_CLIENT_ID;

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let googleScriptPromise = null;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => { googleScriptPromise = null; reject(); };
      document.head.appendChild(script);
    });
  }
  return googleScriptPromise;
}

/**
 * text: 'signin_with' (الدخول عبر Google) | 'signup_with' (التسجيل عبر Google) | 'continue_with'
 * onLogin(user, { needsProfile })، onError(message)
 */
export default function GoogleAuthButton({ text = 'signin_with', onLogin, onError }) {
  const boxRef = useRef(null);
  const [loading, setLoading] = useState(false);
  // نحتفظ بآخر نسخة من الدوال دون إعادة رسم الزر عند كل تحديث
  const handlers = useRef({ onLogin, onError });
  handlers.current = { onLogin, onError };

  useEffect(() => {
    if (!GOOGLE_ENABLED || !boxRef.current) return undefined;
    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !boxRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          callback: async (response) => {
            const { onLogin: done, onError: fail } = handlers.current;
            if (!response?.credential) { fail?.('تعذّر الحصول على بيانات Google. حاول مرة أخرى.'); return; }
            setLoading(true);
            fail?.('');
            try {
              const res = await api.post('/auth/google', { token: response.credential });
              localStorage.setItem('token', res.data.token);
              localStorage.setItem('user', JSON.stringify(res.data.user));
              done?.(res.data.user, { needsProfile: res.data.needs_profile, isNew: res.data.is_new });
            } catch (err) {
              fail?.(err.response?.data?.message || 'تعذّر الدخول عبر Google. حاول مرة أخرى.');
            } finally {
              setLoading(false);
            }
          },
        });
        boxRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(boxRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          logo_alignment: 'center',
          text,
          width: Math.max(220, Math.min(boxRef.current.offsetWidth || 320, 400)),
          locale: 'ar',
        });
      })
      .catch(() => handlers.current.onError?.('تعذّر تحميل خدمة Google. تحقق من الاتصال ثم أعد تحميل الصفحة.'));

    return () => { cancelled = true; };
  }, [text]);

  if (!GOOGLE_ENABLED) return null;

  return (
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div ref={boxRef} aria-busy={loading}
        style={{ width: '100%', maxWidth: 400, minHeight: 44, display: 'flex', justifyContent: 'center', direction: 'ltr', opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }} />
      {loading && <span style={{ fontSize: 12, color: '#6b7280' }} role="status">جارٍ الدخول عبر Google...</span>}
    </div>
  );
}

/** فاصل «أو» بين النموذج وزر Google */
export const OrDivider = ({ label = 'أو' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 2px' }} aria-hidden="true">
    <span style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
    <span style={{ fontSize: 12.5, color: '#9ca3af', fontWeight: 600 }}>{label}</span>
    <span style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
  </div>
);
