import React, { useState } from 'react';
import api from '../../api/axios';

export default function OtpVerification({ email, message, onVerified, onBack }) {
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState(message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-email', { email, code });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onVerified(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'تعذر التحقق من الرمز، حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError('');
    setNotice('');

    try {
      const res = await api.post('/auth/resend-otp', { email });
      setNotice(res.data.message || 'تم إرسال رمز جديد إلى بريدك الإلكتروني.');
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذر إرسال رمز جديد، حاول لاحقاً.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <button type="button" onClick={onBack} style={styles.backBtn}>رجوع</button>
      <h2 style={styles.title}>تحقق من بريدك الإلكتروني</h2>
      <p style={styles.subtitle}>
        أدخل رمز التحقق المرسل إلى
        <br />
        <strong>{email}</strong>
      </p>

      <form onSubmit={submit} style={styles.form}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
            setError('');
          }}
          placeholder="000000"
          style={styles.otpInput}
          required
        />

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" disabled={loading || code.length !== 6} style={styles.btn}>
          {loading ? 'جاري التحقق...' : 'تأكيد البريد والدخول'}
        </button>

        <button type="button" disabled={resending} onClick={resend} style={styles.linkBtn}>
          {resending ? 'جاري الإرسال...' : 'إرسال رمز جديد'}
        </button>
      </form>
    </>
  );
}

const styles = {
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 1.8,
    marginBottom: 24,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  otpInput: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 28,
    fontWeight: 700,
    color: '#1A6B7C',
    background: '#fafafa',
    textAlign: 'center',
    direction: 'ltr',
    letterSpacing: 10,
    boxSizing: 'border-box',
    outline: 'none',
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
    fontFamily: "'Cairo', sans-serif",
    opacity: 1,
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#1A6B7C',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    padding: 8,
  },
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
  notice: {
    background: '#ecfeff',
    color: '#0f766e',
    border: '1px solid #a5f3fc',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    textAlign: 'right',
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    textAlign: 'right',
  },
};
