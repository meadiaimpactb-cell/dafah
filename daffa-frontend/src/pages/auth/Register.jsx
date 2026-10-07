import React, { useState } from 'react';
import api from '../../api/axios';
import OtpVerification from './OtpVerification';

const SECTORS = ['تعليم', 'صحة', 'بيئة', 'اجتماعي', 'ثقافة', 'رياضة', 'تنمية', 'حقوق الإنسان', 'أخرى'];

export default function Register({ onLogin, onGoLogin }) {
  const [form, setForm] = useState({
    org_name: '',
    org_type: 'غير ربحية',
    rep_name: '',
    email: '',
    phone: '',
    sector: '',
    password: '',
    password_confirmation: '',
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.terms) {
      setErrors({ terms: 'يجب الموافقة على الشروط والأحكام' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await api.post('/auth/register', form);

      if (res.data.needs_verification) {
        setVerification({
          email: res.data.email || form.email,
          message: res.data.message || 'تم إرسال رمز التحقق إلى بريدك الإلكتروني.',
        });
        return;
      }

      if (res.data.token && res.data.user) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: err.response?.data?.message || 'حدث خطأ، حاول مجدداً' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (verification) {
    return (
      <div style={styles.overlay}>
        <div style={{ ...styles.card, maxWidth: 460 }}>
          <div style={styles.logo}>
            <img src="/logo.png" alt="دفة" style={{ height: 60 }} onError={(e) => { e.target.style.display = 'none'; }} />
            <div style={styles.logoText}>دفة</div>
          </div>
          <OtpVerification
            email={verification.email}
            message={verification.message}
            onVerified={onLogin}
            onBack={() => setVerification(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <img src="/logo.png" alt="دفة" style={{ height: 60 }} onError={(e) => { e.target.style.display = 'none'; }} />
          <div style={styles.logoText}>دفة</div>
        </div>

        <h2 style={styles.title}>إنشاء حساب جديد</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>اسم المنظمة</label>
              <input name="org_name" placeholder="جمعية أثر" value={form.org_name} onChange={handleChange} style={styles.input} required />
              {errors.org_name && <span style={styles.fieldError}>{errors.org_name[0]}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>نوع المنظمة</label>
              <select name="org_type" value={form.org_type} onChange={handleChange} style={styles.input}>
                <option>غير ربحية</option>
                <option>جمعية</option>
                <option>مؤسسة</option>
                <option>اتحاد</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>اسم الممثل</label>
              <input name="rep_name" placeholder="الاسم الكامل" value={form.rep_name} onChange={handleChange} style={styles.input} required />
              {errors.rep_name && <span style={styles.fieldError}>{errors.rep_name[0]}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>البريد الإلكتروني</label>
              <input name="email" type="email" placeholder="email@org.sa" value={form.email} onChange={handleChange} style={styles.input} required />
              {errors.email && <span style={styles.fieldError}>{errors.email[0]}</span>}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>رقم الجوال</label>
              <input name="phone" placeholder="05XXXXXXXX" value={form.phone} onChange={handleChange} style={styles.input} required />
              {errors.phone && <span style={styles.fieldError}>{errors.phone[0]}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>القطاع</label>
              <select name="sector" value={form.sector} onChange={handleChange} style={styles.input}>
                <option value="">تعليم، صحة...</option>
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>كلمة المرور</label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} style={styles.input} required />
              {errors.password && <span style={styles.fieldError}>{errors.password[0]}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>تأكيد كلمة المرور</label>
              <input name="password_confirmation" type="password" placeholder="••••••••" value={form.password_confirmation} onChange={handleChange} style={styles.input} required />
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>
              <input name="terms" type="checkbox" checked={form.terms} onChange={handleChange} style={{ marginLeft: 6 }} />
              أوافق على الشروط والأحكام
            </label>
            {errors.terms && <div style={styles.fieldError}>{errors.terms}</div>}
          </div>

          {errors.general && <div style={styles.error}>{errors.general}</div>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'جاري التسجيل...' : 'تسجيل'}
          </button>

          <p style={styles.footer}>
            لديك حساب؟{' '}
            <span onClick={onGoLogin} style={styles.link}>تسجيل الدخول</span>
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
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
    padding: '36px min(48px, 7vw)',
    width: '100%',
    maxWidth: 620,
    boxSizing: 'border-box',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1A6B7C',
    marginTop: 6,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 24,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 16,
  },
  field: { display: 'flex', flexDirection: 'column' },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 5,
    textAlign: 'right',
  },
  input: {
    padding: '10px 12px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    color: '#1a1a2e',
    background: '#fafafa',
    textAlign: 'right',
    direction: 'rtl',
    outline: 'none',
    fontFamily: "'Cairo', sans-serif",
    boxSizing: 'border-box',
    width: '100%',
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
  fieldError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 3,
    display: 'block',
  },
  footer: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    marginTop: 16,
  },
  link: {
    color: '#1A6B7C',
    cursor: 'pointer',
    fontWeight: 600,
  },
};
