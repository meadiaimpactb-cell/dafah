import DfIcon from '../../components/ui/DfIcon';
import React, { useState } from 'react';
import api from '../../api/axios';
import OtpVerification from './OtpVerification';
import SocialButtons from './SocialButtons';
import AuthShell, { PasswordInput } from './AuthShell';

function LoginForm({ onLogin, onGoRegister, onForgot, onNeedsVerification, initialError }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(initialError || '');
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
          message: data.message || 'أرسلنا رمز التأكيد إلى بريدك الإلكتروني.',
          retryAfter: data.retry_after ?? 60,
          sendFailed: data.send_status === 'failed',
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
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            style={{ ...S.input, direction: 'ltr', textAlign: 'right' }}
            required
          />
        </div>

        <div style={S.field}>
          <label style={S.label}>كلمة المرور</label>
          <PasswordInput
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            style={S.input}
            required
          />
        </div>

        <div style={{ textAlign: 'left', marginBottom: 12 }}>
          <button type="button" onClick={onForgot} style={S.link}>نسيت كلمة المرور؟</button>
        </div>

        {error && <div style={S.error}>{error}</div>}

        <button type="submit" disabled={loading} style={S.btn}>
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>

        <SocialButtons intent="login" label="أو الدخول عبر" onLogin={onLogin} onError={setError} />

        <p style={S.footer}>
          ليس لديك حساب؟{' '}
          <button type="button" onClick={onGoRegister} style={S.link}>أنشئ حسابًا الآن</button>
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
        <div style={S.mailIcon}><DfIcon name="mail" size={18} /></div>
        <h2 style={{ ...S.title, marginBottom: 12 }}>تحقق من بريدك</h2>
        <p style={S.forgotText}>
          إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة تحتوي على رابط إعادة التعيين خلال دقائق.
        </p>
        <button type="button" onClick={onBack} style={{ ...S.btn, background: '#235D7F' }}>
          العودة لتسجيل الدخول
        </button>
      </div>
    );
  }

  return (
    <>
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

export default function Login({ onLogin, onGoRegister, onBack, onHome, initialError }) {
  const [view, setView] = useState('login');
  const [verification, setVerification] = useState(null);

  const showVerification = (payload) => {
    setVerification(payload);
    setView('verify');
  };

  // زر «رجوع» العلوي: داخل الشاشات الفرعية يعود لنموذج الدخول، وإلا يغادر صفحة الدخول
  const back = view === 'login' ? onBack : () => setView('login');

  return (
    <AuthShell onBack={back} onHome={onHome}>
      {view === 'login' && (
        <LoginForm
          onLogin={onLogin}
          onGoRegister={onGoRegister}
          onForgot={() => setView('forgot')}
          onNeedsVerification={showVerification}
          initialError={initialError}
        />
      )}

      {view === 'forgot' && <ForgotForm onBack={() => setView('login')} />}

      {view === 'verify' && verification && (
        <OtpVerification
          email={verification.email}
          message={verification.message}
          retryAfter={verification.retryAfter}
          sendFailed={verification.sendFailed}
          onVerified={onLogin}
          onBack={() => setView('login')}
        />
      )}
    </AuthShell>
  );
}

const S = {
  overlay: {
    minHeight: '100vh',
    background: 'radial-gradient(rgba(35,93,127,0.08) 1.2px, transparent 1.3px) 0 0 / 22px 22px, #FBF9F5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    direction: 'rtl',
    fontFamily: "inherit",
    padding: '24px 16px',
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    border: '1px solid #E8E3DA',
    padding: '36px min(44px, 7vw)',
    width: '100%',
    maxWidth: 460,
    boxSizing: 'border-box',
    boxShadow: '0 4px 32px rgba(14,42,61,0.08)',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: { fontSize: 22, fontWeight: 700, color: '#235D7F', marginTop: 6 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#0E2A3D', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 0 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#334452', marginBottom: 6, textAlign: 'right' },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #E8E3DA',
    borderRadius: 8,
    fontSize: 14,
    color: '#0E2A3D',
    background: '#FBF9F5',
    textAlign: 'right',
    direction: 'rtl',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: "inherit",
  },
  btn: {
    width: '100%',
    padding: '13px',
    background: '#EF6A2C',
    color: '#0E2A3D',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
    fontFamily: "inherit",
  },
  error: {
    background: '#FCEBEB',
    color: '#C53A3A',
    border: '1px solid #F1B2B2',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'right',
  },
  footer: { textAlign: 'center', fontSize: 14, color: '#5E6B78', marginTop: 16 },
  link: { color: '#235D7F', cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#235D7F',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
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
    background: '#E8E3DA',
    flex: 1,
  },
  dividerText: {
    fontSize: 12,
    color: '#8C97A3',
  },
  mailIcon: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: '#C9EFE1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: 32,
  },
  forgotText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#5E6B78',
    lineHeight: 1.8,
    marginBottom: 24,
  },
};
