import React, { useEffect, useRef, useState } from 'react';
import DfIcon from '../../components/ui/DfIcon';
import api from '../../api/axios';
import OtpVerification from './OtpVerification';
import GoogleAuthButton, { GOOGLE_ENABLED, OrDivider } from './GoogleAuthButton';
import AuthShell, { PasswordInput, TermsModal, useSiteContent } from './AuthShell';

const SECTORS = ['تعليم', 'صحة', 'بيئة', 'اجتماعي', 'ثقافة', 'رياضة', 'تنمية', 'حقوق الإنسان', 'أخرى'];
const ORG_TYPES = ['غير ربحية', 'جمعية', 'مؤسسة', 'اتحاد'];
const LOGO_MAX = 2 * 1024 * 1024;

// الأرقام العربية/الفارسية ← أرقام لاتينية (لرقم الجوال)
const toLatinDigits = (v) => String(v).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
const SAUDI_MOBILE = /^(05\d{8}|\+?9665\d{8}|009665\d{8})$/;

function passwordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-zA-Z؀-ۿ]/.test(pw) && /\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9؀-ۿ]/.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw))) score++;
  if (pw.length < 8) return { level: 0, label: 'قصيرة — 8 أحرف على الأقل', color: '#DC4A4A' };
  if (score <= 2) return { level: 1, label: 'مقبولة — أضف أرقامًا ورموزًا لتقويتها', color: '#E0A100' };
  if (score === 3) return { level: 2, label: 'جيدة', color: '#2E8B57' };
  return { level: 3, label: 'قوية', color: '#0E9F74' };
}

export default function Register({ onLogin, onGoLogin, onBack, onHome }) {
  const sc = useSiteContent();
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
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const formRef = useRef(null);

  useEffect(() => () => { if (logoPreview) URL.revokeObjectURL(logoPreview); }, [logoPreview]);

  const set = (name, value) => {
    setForm(f => ({ ...f, [name]: value }));
    setErrors(e => ({ ...e, [name]: '', general: '' }));
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : name === 'phone' ? toLatinDigits(value).replace(/[^\d+]/g, '') : value);
  };

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.type)) { setErrors(er => ({ ...er, logo: ['صيغة الشعار غير مدعومة — استخدم PNG أو JPG أو WebP.'] })); return; }
    if (file.size > LOGO_MAX) { setErrors(er => ({ ...er, logo: ['حجم الشعار أكبر من 2 ميغابايت.'] })); return; }
    setErrors(er => ({ ...er, logo: '' }));
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };
  const removeLogo = () => { setLogo(null); setLogoPreview(null); };

  const strength = passwordStrength(form.password);
  const mismatch = form.password_confirmation && form.password !== form.password_confirmation;
  const phoneHint = form.phone && form.phone.length >= 10 && !SAUDI_MOBILE.test(form.phone);

  const focusFirstError = (errs) => {
    const first = Object.keys(errs).find(k => errs[k]);
    const el = first && formRef.current?.querySelector(`[name="${first}"]`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus({ preventScroll: true }); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const local = {};
    if (form.password.length < 8) local.password = ['كلمة المرور يجب ألا تقل عن 8 أحرف'];
    if (mismatch) local.password_confirmation = ['تأكيد كلمة المرور غير مطابق'];
    if (!form.terms) local.terms = 'يجب الموافقة على الشروط والأحكام';
    if (Object.keys(local).length) { setErrors(local); focusFirstError(local); return; }

    setLoading(true);
    setErrors({});

    try {
      let res;
      if (logo) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (k !== 'terms') fd.append(k, v); });
        fd.append('logo', logo);
        res = await api.post('/auth/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/auth/register', form);
      }

      if (res.data.needs_verification) {
        setVerification({
          email: res.data.email || form.email,
          message: res.data.message || 'أرسلنا رمز التأكيد إلى بريدك الإلكتروني.',
          retryAfter: res.data.retry_after ?? 60,
          sendFailed: res.data.send_status === 'failed',
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
        focusFirstError(err.response.data.errors);
      } else {
        setErrors({ general: err.response?.data?.message || 'حدث خطأ، حاول مجدداً' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (verification) {
    return (
      <AuthShell onBack={() => setVerification(null)} onHome={onHome}>
        <OtpVerification
          email={verification.email}
          message={verification.message}
          retryAfter={verification.retryAfter}
          sendFailed={verification.sendFailed}
          onVerified={onLogin}
          onBack={() => setVerification(null)}
        />
      </AuthShell>
    );
  }

  const err = (k) => errors[k] && <span role="alert" style={styles.fieldError}>{Array.isArray(errors[k]) ? errors[k][0] : errors[k]}</span>;
  const inp = (k, extra) => ({ ...styles.input, ...(errors[k] ? styles.inputError : null), ...extra });

  return (
    <AuthShell onBack={onBack} onHome={onHome} panel>
      <h2 style={styles.title}>إنشاء حساب جديد</h2>
      <p style={styles.subtitle}>دقيقتان فقط وتبدأ أول خطة لمنظمتك.</p>

      {GOOGLE_ENABLED && (
        <div style={{ marginBottom: 6 }}>
          <GoogleAuthButton
            text="signup_with"
            oneTap
            onLogin={onLogin}
            onError={msg => setErrors(msg ? { general: msg } : {})}
          />
          <p style={{ fontSize: 12, color: '#8C97A3', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.7 }}>
            بالتسجيل عبر Google يُؤكَّد بريدك تلقائيًا، وتوافق على الشروط والأحكام. ستُكمل بيانات منظمتك بعد الدخول.
          </p>
          <OrDivider label="أو سجّل بالبريد الإلكتروني" />
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit}>
        <div style={styles.sectionLabel}><DfIcon name="building" size={14} /> بيانات المنظمة</div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="reg-org">اسم المنظمة</label>
            <input id="reg-org" name="org_name" placeholder="جمعية أثر" autoComplete="organization" value={form.org_name} onChange={handleChange} style={inp('org_name')} required />
            {err('org_name')}
          </div>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="reg-type">نوع المنظمة</label>
            <select id="reg-type" name="org_type" value={form.org_type} onChange={handleChange} style={inp('org_type')}>
              {ORG_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            {err('org_type')}
          </div>
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="reg-sector">القطاع <span style={styles.optional}>(اختياري)</span></label>
            <select id="reg-sector" name="sector" value={form.sector} onChange={handleChange} style={inp('sector')}>
              <option value="">اختر القطاع</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {err('sector')}
          </div>
          <div style={styles.field}>
            <span style={styles.label}>شعار المنظمة <span style={styles.optional}>(اختياري)</span></span>
            <div style={styles.logoBox}>
              <div style={styles.logoThumb}>
                {logoPreview
                  ? <img src={logoPreview} alt="معاينة الشعار" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <DfIcon name="image" size={18} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <label style={styles.smallBtn}>
                    {logo ? 'تغيير' : 'اختر شعارًا'}
                    <input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={pickLogo} style={{ display: 'none' }} />
                  </label>
                  {logo && <button type="button" onClick={removeLogo} style={{ ...styles.smallBtn, color: '#C53A3A', borderColor: '#F1B2B2', background: '#FCEBEB' }}>حذف</button>}
                </div>
                <div style={{ fontSize: 11, color: '#8C97A3', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {logo ? logo.name : 'PNG / JPG / WebP — حتى 2 ميغابايت'}
                </div>
              </div>
            </div>
            {err('logo')}
          </div>
        </div>

        <div style={styles.sectionLabel}><DfIcon name="user" size={14} /> بيانات ممثل المنظمة</div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="reg-rep">اسم الممثل</label>
            <input id="reg-rep" name="rep_name" placeholder="الاسم الكامل" autoComplete="name" value={form.rep_name} onChange={handleChange} style={inp('rep_name')} required />
            {err('rep_name')}
          </div>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="reg-phone">رقم الجوال</label>
            <input id="reg-phone" name="phone" type="tel" inputMode="tel" placeholder="05XXXXXXXX" autoComplete="tel" value={form.phone} onChange={handleChange} style={inp('phone', { direction: 'ltr', textAlign: 'right' })} maxLength={20} required />
            {err('phone') || (phoneHint && <span style={styles.hint}>تأكد من الرقم — الصيغة المعتادة 05XXXXXXXX</span>)}
          </div>
        </div>
        <div style={styles.row}>
          <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
            <label style={styles.label} htmlFor="reg-email">البريد الإلكتروني</label>
            <input id="reg-email" name="email" type="email" placeholder="email@org.sa" autoComplete="email" value={form.email} onChange={handleChange} style={inp('email', { direction: 'ltr', textAlign: 'right' })} required />
            {err('email') || <span style={styles.hint}>سنرسل إليه رمز تأكيد لتفعيل الحساب.</span>}
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="reg-pass">كلمة المرور</label>
            <PasswordInput id="reg-pass" name="password" placeholder="8 أحرف على الأقل" autoComplete="new-password" value={form.password} onChange={handleChange} style={inp('password')} required />
            {strength && (
              <div aria-live="polite" style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2, 3].map(i => <span key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= strength.level ? strength.color : '#E8E3DA', transition: 'background .2s' }} />)}
                </div>
                <span style={{ fontSize: 11.5, color: strength.color, fontWeight: 600 }}>{strength.label}</span>
              </div>
            )}
            {err('password')}
          </div>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="reg-pass2">تأكيد كلمة المرور</label>
            <PasswordInput id="reg-pass2" name="password_confirmation" placeholder="أعد كتابة كلمة المرور" autoComplete="new-password" value={form.password_confirmation} onChange={handleChange} style={inp('password_confirmation', mismatch ? styles.inputError : null)} required />
            {err('password_confirmation') || (form.password_confirmation && (
              mismatch
                ? <span style={styles.fieldError}>غير مطابقة</span>
                : <span style={{ ...styles.hint, color: '#0E9F74', fontWeight: 600 }}>✓ مطابقة</span>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'right', margin: '4px 0 18px' }}>
          <label style={{ fontSize: 13, color: '#334452', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input name="terms" type="checkbox" checked={form.terms} onChange={handleChange} style={{ width: 17, height: 17, accentColor: '#235D7F' }} />
            <span>
              أوافق على{' '}
              {sc.terms_text
                ? <button type="button" onClick={(e) => { e.preventDefault(); setShowTerms(true); }} style={styles.inlineLink}>الشروط والأحكام</button>
                : 'الشروط والأحكام'}
            </span>
          </label>
          {err('terms')}
        </div>

        {errors.general && <div role="alert" style={styles.error}>{errors.general}</div>}

        <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.75 : 1 }}>
          {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
        </button>

        <p style={styles.footer}>
          لديك حساب؟{' '}
          <button type="button" onClick={onGoLogin} style={styles.inlineLink}>تسجيل الدخول</button>
        </p>
      </form>

      {showTerms && (
        <TermsModal
          text={sc.terms_text}
          onClose={() => setShowTerms(false)}
          onAccept={() => { set('terms', true); setShowTerms(false); }}
        />
      )}
    </AuthShell>
  );
}

const styles = {
  title: { textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#0E2A3D', margin: '0 0 4px' },
  subtitle: { textAlign: 'center', fontSize: 13.5, color: '#5E6B78', margin: '0 0 20px' },
  sectionLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: '#235D7F', margin: '6px 0 10px', paddingBottom: 6, borderBottom: '1px dashed #E8E3DA' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 14 },
  field: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  label: { fontSize: 13, fontWeight: 700, color: '#334452', marginBottom: 5, textAlign: 'right' },
  optional: { fontSize: 11, fontWeight: 400, color: '#8C97A3' },
  input: {
    padding: '10px 12px', border: '1.5px solid #E8E3DA', borderRadius: 10, fontSize: 14, color: '#0E2A3D',
    background: '#FBF9F5', textAlign: 'right', direction: 'rtl', outline: 'none', fontFamily: 'inherit', width: '100%', minHeight: 44,
  },
  inputError: { borderColor: '#E59A9A', background: '#FFF7F7' },
  logoBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', border: '1.5px dashed #D9D2C5', borderRadius: 10, background: '#FBF9F5', minHeight: 44 },
  logoThumb: { width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: '#fff', border: '1px solid #E8E3DA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#235D7F', overflow: 'hidden' },
  smallBtn: { display: 'inline-flex', alignItems: 'center', padding: '4px 12px', background: '#fff', border: '1.5px solid #E8E3DA', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#0E2A3D', fontFamily: 'inherit' },
  btn: { width: '100%', padding: '13px', background: '#EF6A2C', color: '#0E2A3D', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
  error: { background: '#FCEBEB', color: '#C53A3A', border: '1px solid #F1B2B2', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12, textAlign: 'right' },
  fieldError: { color: '#C53A3A', fontSize: 12, marginTop: 4, display: 'block' },
  hint: { color: '#8C97A3', fontSize: 11.5, marginTop: 4, display: 'block' },
  footer: { textAlign: 'center', fontSize: 14, color: '#5E6B78', marginTop: 16, marginBottom: 0 },
  inlineLink: { background: 'none', border: 'none', padding: 0, color: '#235D7F', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 },
};
