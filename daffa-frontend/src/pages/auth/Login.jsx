import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import OtpVerification from './OtpVerification';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let googleScriptPromise = null;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

      if (existingScript) {
        existingScript.addEventListener('load', resolve, { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
}

function GoogleLoginButton({ onLogin, onError }) {
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return undefined;

    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (!response?.credential) {
              onError('تعذر الحصول على بيانات Google.');
              return;
            }

            setLoading(true);
            onError('');

            try {
              const res = await api.post('/auth/google', { token: response.credential });
              localStorage.setItem('token', res.data.token);
              localStorage.setItem('user', JSON.stringify(res.data.user));
              onLogin(res.data.user, { needsProfile: res.data.needs_profile });
            } catch (err) {
              onError(err.response?.data?.message || 'تعذر تسجيل الدخول عبر Google.');
            } finally {
              setLoading(false);
            }
          },
        });

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'continue_with',
          width: Math.min(buttonRef.current.offsetWidth || 320, 360),
          locale: 'ar',
        });
      })
      .catch(() => {
        onError('تعذر تحميل خدمة تسجيل الدخول عبر Google.');
      });

    return () => {
      cancelled = true;
    };
  }, [onError, onLogin]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div style={S.googleWrap}>
      <div ref={buttonRef} style={{ display: 'flex', justifyContent: 'center', opacity: loading ? 0.65 : 1 }} />
    </div>
  );
}

function LoginForm({ onLogin, onGoRegister, onForgot, onNeedsVerification }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      const data = err.response?.data;

      if (data?.needs_verification && data?.email) {
        onNeedsVerification({
          email: data.email,
          message: data.message || 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.',
        });
        return;
      }

      const msg = data?.errors?.email?.[0]
        || data?.message
        || 'حدث خطأ، حاول مجدداً';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 style={S.title}>تسجيل الدخول</h2>
      <form onSubmit={handleSubmit} style={S.form}>
        <div style={S.field}>
          <label style={S.label}>البريد الإلكتروني</label>
          <input
            name="email"
            type="email"
            placeholder="example@org.sa"
            value={form.email}
            onChange={handleChange}
            style={S.input}
            required
          />
        </div>

        <div style={S.field}>
          <label style={S.label}>كلمة المرور</label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            style={S.input}
            required
          />
        </div>

        <div style={{ textAlign: 'left', marginBottom: 12 }}>
          <span onClick={onForgot} style={S.link}>نسيت كلمة المرور؟</span>
        </div>

        {error && <div style={S.error}>{error}</div>}

        <button type="submit" disabled={loading} style={S.btn}>
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>

        {GOOGLE_CLIENT_ID && (
          <div style={S.divider}>
            <span style={S.dividerLine} />
            <span style={S.dividerText}>أو</span>
            <span style={S.dividerLine} />
          </div>
        )}

        <GoogleLoginButton onLogin={onLogin} onError={setError} />

        <p style={S.footer}>
          ليس لديك حساب؟{' '}
          <span onClick={onGoRegister} style={S.link}>سجل الآن</span>
        </p>
      </form>
    </>
  );
}

function ForgotForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={S.mailIcon}>✉</div>
        <h2 style={{ ...S.title, marginBottom: 12 }}>تحقق من بريدك</h2>
        <p style={S.forgotText}>
          إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة تحتوي على رابط إعادة التعيين خلال دقائق.
        </p>
        <button type="button" onClick={onBack} style={{ ...S.btn, background: '#1A6B7C' }}>
          العودة لتسجيل الدخول
        </button>
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={onBack} style={S.backBtn}>رجوع</button>
      <h2 style={{ ...S.title, marginBottom: 8 }}>نسيت كلمة المرور؟</h2>
      <p style={S.forgotText}>
        أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
      </p>
      <form onSubmit={handleSubmit} style={S.form}>
        <div style={S.field}>
          <label style={S.label}>البريد الإلكتروني</label>
          <input
            type="email"
            placeholder="example@org.sa"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            style={S.input}
            required
          />
        </div>
        {error && <div style={S.error}>{error}</div>}
        <button type="submit" disabled={loading} style={S.btn}>
          {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
        </button>
      </form>
    </>
  );
}

export default function Login({ onLogin, onGoRegister }) {
  const [view, setView] = useState('login');
  const [verification, setVerification] = useState(null);

  const showVerification = (payload) => {
    setVerification(payload);
    setView('verify');
  };

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <div style={S.logo}>
          <img src="/logo.png" alt="دفة" style={{ height: 60 }} onError={(e) => { e.target.style.display = 'none'; }} />
          <div style={S.logoText}>دفة</div>
        </div>

        {view === 'login' && (
          <LoginForm
            onLogin={onLogin}
            onGoRegister={onGoRegister}
            onForgot={() => setView('forgot')}
            onNeedsVerification={showVerification}
          />
        )}

        {view === 'forgot' && <ForgotForm onBack={() => setView('login')} />}

        {view === 'verify' && verification && (
          <OtpVerification
            email={verification.email}
            message={verification.message}
            onVerified={onLogin}
            onBack={() => setView('login')}
          />
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: {
    minHeight: '100vh',
    background: '#F8FAFB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    direction: 'rtl',
    fontFamily: "'Cairo', sans-serif",
    padding: '24px 16px',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px min(48px, 7vw)',
    width: '100%',
    maxWidth: 460,
    boxSizing: 'border-box',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: { fontSize: 22, fontWeight: 700, color: '#1A6B7C', marginTop: 6 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 0 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6, textAlign: 'right' },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    color: '#1a1a2e',
    background: '#fafafa',
    textAlign: 'right',
    direction: 'rtl',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: "'Cairo', sans-serif",
  },
  btn: {
    width: '100%',
    padding: '13px',
    background: '#E8620A',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
    fontFamily: "'Cairo', sans-serif",
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'right',
  },
  footer: { textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 16 },
  link: { color: '#1A6B7C', cursor: 'pointer', fontWeight: 600 },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#1A6B7C',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Cairo', sans-serif",
    padding: '0 0 16px 0',
    display: 'block',
  },
  googleWrap: {
    marginTop: 14,
    display: 'flex',
    justifyContent: 'center',
    direction: 'ltr',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  dividerLine: {
    height: 1,
    background: '#e5e7eb',
    flex: 1,
  },
  dividerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  mailIcon: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: '#dcfce7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: 32,
  },
  forgotText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 1.8,
    marginBottom: 24,
  },
};
