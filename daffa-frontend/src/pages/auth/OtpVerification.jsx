import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

/** يقبل الأرقام العربية-الهندية (٠-٩) والفارسية (۰-۹) ويحوّلها إلى أرقام لاتينية */
const toLatinDigits = s => s
  .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
  .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

const fmtWait = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * شاشة إدخال رمز التأكيد المرسل إلى البريد (6 أرقام).
 * - إعادة الإرسال متاحة بعد انتهاء العدّاد (retryAfter ثانية، الافتراضي 60).
 * - verifyRequest / resendRequest اختياريان؛ الافتراضي تأكيد حساب جديد عبر /auth/verify-email.
 */
export default function OtpVerification({
  email, message, onVerified, onBack,
  retryAfter = 60, sendFailed = false,
  verifyRequest, resendRequest,
  title = 'تأكيد بريدك الإلكتروني',
  submitLabel = 'تأكيد البريد والدخول',
  compact = false,
}) {
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState(sendFailed ? '' : (message || ''));
  const [error, setError] = useState(sendFailed ? (message || 'تعذّر إرسال الرمز الآن. اطلب رمزًا جديدًا.') : '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [wait, setWait] = useState(sendFailed ? 0 : Math.max(0, retryAfter || 0));

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = verifyRequest || (async c => {
    const res = await api.post('/auth/verify-email', { email, code: c });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res;
  });
  const resendFn = resendRequest || (() => api.post('/auth/resend-otp', { email }));

  const submit = async (e) => {
    e.preventDefault();
    if (code.length !== 6 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await verify(code);
      onVerified(res.data.user || res.data, res);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.errors?.code?.[0] || d?.message || 'تعذّر التحقق من الرمز، حاول مرة أخرى.');
      if (d?.locked) setCode('');
      if (d?.retry_after) setWait(w => Math.max(w, d.retry_after));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (wait > 0 || resending) return;
    setResending(true);
    setError('');
    setNotice('');
    try {
      const res = await resendFn();
      setNotice(res.data?.message || 'أرسلنا رمزًا جديدًا إلى بريدك الإلكتروني.');
      setWait(res.data?.retry_after || 60);
      setCode('');
    } catch (err) {
      const d = err.response?.data;
      setError(d?.errors?.email?.[0] || d?.message || 'تعذّر إرسال رمز جديد، حاول لاحقًا.');
      if (d?.retry_after) setWait(d.retry_after);
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      {onBack && <button type="button" onClick={onBack} style={styles.backBtn}>{compact ? 'إلغاء' : 'رجوع'}</button>}
      <h2 style={compact ? styles.titleCompact : styles.title}>{title}</h2>
      <p style={compact ? { ...styles.subtitle, textAlign: 'right', marginBottom: 14 } : styles.subtitle}>
        أدخل الرمز المكوّن من 6 أرقام المرسل إلى
        {compact ? ' ' : <br />}
        <strong style={styles.email} dir="ltr">{email}</strong>
      </p>

      <form onSubmit={submit} style={styles.form} noValidate>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label="رمز التأكيد"
          maxLength={6}
          value={code}
          onChange={(e) => {
            setCode(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 6));
            setError('');
          }}
          placeholder="000000"
          style={styles.otpInput}
          autoFocus
        />

        {notice && <div style={styles.notice} role="status" aria-live="polite">{notice}</div>}
        {error && <div style={styles.error} role="alert" aria-live="assertive">{error}</div>}

        <button type="submit" disabled={loading || code.length !== 6}
          style={{ ...styles.btn, opacity: loading || code.length !== 6 ? 0.6 : 1, cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer' }}>
          {loading ? 'جارٍ التحقق...' : submitLabel}
        </button>

        <button type="button" disabled={resending || wait > 0} onClick={resend}
          style={{ ...styles.linkBtn, color: wait > 0 ? '#9ca3af' : '#1A6B7C', cursor: wait > 0 ? 'default' : 'pointer' }}>
          {resending ? 'جارٍ الإرسال...' : wait > 0 ? `إرسال رمز جديد بعد ${fmtWait(wait)}` : 'إرسال رمز جديد'}
        </button>

        <p style={styles.hint}>
          لم تصلك الرسالة؟ تحقق من مجلد البريد غير الهام (Spam)، وتأكد من كتابة البريد بشكل صحيح.
          الرمز صالح لمدة 10 دقائق.
        </p>
      </form>
    </>
  );
}

const styles = {
  title: { textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 },
  titleCompact: { fontSize: 15, fontWeight: 700, color: '#14505E', margin: '0 0 6px' },
  subtitle: { textAlign: 'center', fontSize: 14, color: '#6b7280', lineHeight: 1.8, marginBottom: 24 },
  email: { unicodeBidi: 'isolate', overflowWrap: 'anywhere', color: '#1a1a2e' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  otpInput: {
    width: '100%', padding: '14px 16px', border: '1.5px solid #e5e7eb', borderRadius: 10,
    fontSize: 28, fontWeight: 700, color: '#1A6B7C', background: '#fafafa', textAlign: 'center',
    direction: 'ltr', letterSpacing: 10, boxSizing: 'border-box', outline: 'none', fontFamily: "'Cairo', sans-serif",
  },
  btn: {
    width: '100%', padding: '13px', background: '#E8620A', color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 16, fontWeight: 700, fontFamily: "'Cairo', sans-serif",
  },
  linkBtn: { background: 'none', border: 'none', fontSize: 14, fontWeight: 700, fontFamily: "'Cairo', sans-serif", padding: 8, minHeight: 44 },
  backBtn: {
    background: 'none', border: 'none', color: '#1A6B7C', cursor: 'pointer', fontSize: 14, fontWeight: 600,
    fontFamily: "'Cairo', sans-serif", padding: '0 0 16px 0', display: 'block',
  },
  notice: { background: '#ecfeff', color: '#0f766e', border: '1px solid #a5f3fc', borderRadius: 8, padding: '10px 14px', fontSize: 13, textAlign: 'right', lineHeight: 1.7 },
  error: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, textAlign: 'right', lineHeight: 1.7 },
  hint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 1.8, margin: '2px 0 0' },
};
