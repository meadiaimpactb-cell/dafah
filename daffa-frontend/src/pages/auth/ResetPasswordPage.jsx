import React, { useState } from 'react';
import api from '../../api/axios';

const C = {
  teal: '#1A6B7C', orange: '#E8620A',
  gray: '#6b7280', grayLight: '#f3f4f6', grayBorder: '#e5e7eb',
};

export default function ResetPasswordPage({ token, email, onDone }) {
  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    if (form.password.length < 8) {
      setError('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        {/* Logo */}
        <div style={S.logo}>
          <img src="/logo.png" alt="دفة" style={{ height: 60 }} onError={e => e.target.style.display = 'none'} />
          <div style={S.logoText}>دفّة</div>
        </div>

        {done ? (
          /* ── Success State ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>
              ✅
            </div>
            <h2 style={{ ...S.title, marginBottom: 12 }}>تم تغيير كلمة المرور</h2>
            <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.8, marginBottom: 28 }}>
              يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
            </p>
            <button onClick={onDone} style={S.btn}>
              الذهاب لتسجيل الدخول
            </button>
          </div>
        ) : (
          /* ── Reset Form ── */
          <>
            <h2 style={S.title}>تعيين كلمة مرور جديدة</h2>
            <p style={{ textAlign: 'center', fontSize: 13, color: C.gray, marginBottom: 24 }}>
              {email}
            </p>

            <form onSubmit={handleSubmit} style={S.form}>
              {/* Password field */}
              <div style={S.field}>
                <label style={S.label}>كلمة المرور الجديدة</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="8 أحرف على الأقل"
                    value={form.password}
                    onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError(''); }}
                    style={S.input}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.gray }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                {/* Strength indicator */}
                {form.password.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: form.password.length >= i * 2 ? (form.password.length >= 12 ? '#16a34a' : form.password.length >= 8 ? '#f59e0b' : '#dc2626') : C.grayBorder,
                        transition: 'background 0.2s',
                      }} />
                    ))}
                    <span style={{ fontSize: 11, color: C.gray, marginRight: 6, whiteSpace: 'nowrap' }}>
                      {form.password.length < 6 ? 'ضعيفة' : form.password.length < 10 ? 'متوسطة' : 'قوية'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={S.field}>
                <label style={S.label}>تأكيد كلمة المرور</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="أعد كتابة كلمة المرور"
                  value={form.password_confirmation}
                  onChange={e => { setForm(p => ({ ...p, password_confirmation: e.target.value })); setError(''); }}
                  style={{
                    ...S.input,
                    borderColor: form.password_confirmation && form.password !== form.password_confirmation ? '#dc2626' : C.grayBorder,
                  }}
                  required
                />
                {form.password_confirmation && form.password !== form.password_confirmation && (
                  <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>كلمتا المرور غير متطابقتين</div>
                )}
              </div>

              {error && <div style={S.error}>{error}</div>}

              <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور الجديدة'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: {
    minHeight: '100vh', background: '#F8FAFB',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    direction: 'rtl', fontFamily: "'Cairo', sans-serif",
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '40px 48px',
    width: '100%', maxWidth: 460, boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
  },
  logo: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 },
  logoText: { fontSize: 22, fontWeight: 700, color: C.teal, marginTop: 6 },
  title: { textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 0 },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6, textAlign: 'right' },
  input: {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid #e5e7eb', borderRadius: 8,
    fontSize: 14, color: '#1a1a2e', background: '#fafafa',
    textAlign: 'right', direction: 'rtl', boxSizing: 'border-box',
    outline: 'none', transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%', padding: '13px', background: C.orange, color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
    cursor: 'pointer', marginTop: 4, fontFamily: "'Cairo', sans-serif",
  },
  error: {
    background: '#fef2f2', color: '#dc2626',
    border: '1px solid #fecaca', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, marginBottom: 12, textAlign: 'right',
  },
};
