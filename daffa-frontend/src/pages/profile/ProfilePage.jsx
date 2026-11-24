import DfIcon from '../../components/ui/DfIcon';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api/axios';
import OtpVerification from '../auth/OtpVerification';
import { IcCheck, IcLightbulb } from '../../utils/icons';

const C = {
  primary: '#235D7F', ink: '#0E2A3D', primarySoft: '#D9E8F1',
  orange: '#EF6A2C', amber: '#EF6A2C', amberText: '#A33F12', amberLine: '#E05A1F', green: '#0B7F5D', red: '#C53A3A',
  gray: '#5E6B78', grayLight: '#F3EFE8', grayBorder: '#E8E3DA',
};

// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) =>
  toast ? ReactDOM.createPortal(
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999999, padding: '12px 24px', borderRadius: 12,
      background: toast.type === 'success' ? '#086449' : '#842525',
      color: 'white', fontSize: 14, fontWeight: 600,
      fontFamily: "inherit", boxShadow: '0 4px 20px rgba(14,42,61,0.3)',
      whiteSpace: 'nowrap', animation: 'fadeInUp 0.3s ease-out both',
    }}>
      {toast.msg}
    </div>,
    document.body
  ) : null;

// ── Field input ────────────────────────────────────────────────────────────────
const Field = ({ label, name, value, onChange, type = 'text', placeholder, disabled, textarea, error }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label htmlFor={`pf-${name}`} style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{label}</label>
    {textarea ? (
      <textarea
        name={name} value={value || ''} onChange={onChange}
        placeholder={placeholder} rows={3}
        style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: "inherit", resize: 'vertical', outline: 'none', transition: 'border 0.2s', background: disabled ? C.grayLight : 'white', color: disabled ? C.gray : '#0E2A3D' }}
        onFocus={e => !disabled && (e.target.style.borderColor = C.primary)}
        onBlur={e => (e.target.style.borderColor = C.grayBorder)}
        disabled={disabled}
      />
    ) : (
      <input
        id={`pf-${name}`} type={type} name={name} value={value || ''} onChange={onChange}
        placeholder={placeholder || label}
        aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `pf-${name}-err` : undefined}
        style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${error ? '#C53A3A' : C.grayBorder}`, fontSize: 13, fontFamily: "inherit", outline: 'none', transition: 'border 0.2s', background: disabled ? C.grayLight : 'white', color: disabled ? C.gray : '#0E2A3D' }}
        onFocus={e => !disabled && (e.target.style.borderColor = C.primary)}
        onBlur={e => (e.target.style.borderColor = error ? '#C53A3A' : C.grayBorder)}
        disabled={disabled}
      />
    )}
    {error && <div id={`pf-${name}-err`} role="alert" style={{ fontSize: 12, color: '#C53A3A', fontWeight: 600 }}>{error}</div>}
  </div>
);

// ── Avatar Circle (with optional image) ───────────────────────────────────────
const AvatarCircle = ({ name, email, logoUrl, size = 72, onClick, uploading }) => {
  const [hovered, setHovered] = React.useState(false);
  const initial = (name?.[0] || email?.[0] || '?').toUpperCase();
  const showOverlay = onClick && (hovered || uploading);

  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      {/* main circle */}
      <div
        onClick={onClick}
        onMouseEnter={() => onClick && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={onClick ? 'انقر لتغيير الصورة' : undefined}
        style={{
          width: size, height: size, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.primary}, ${C.ink})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: size * 0.38,
          boxShadow: `0 4px 16px ${C.primary}40`,
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative', overflow: 'hidden',
          transition: 'transform 0.15s',
          transform: hovered && onClick ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        ) : initial}

        {/* dark overlay on hover */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(14,42,61,0.45)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: showOverlay ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}>
          {uploading
            ? <span style={{ fontSize: size * 0.28 }}><DfIcon name="hourglass" size={18} /></span>
            : <span style={{ fontSize: size * 0.3 }}><DfIcon name="camera" size={18} /></span>}
        </div>
      </div>

    </div>
  );
};

// ── Section header ─────────────────────────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 16, paddingBottom: 8, borderBottom: `2px solid ${C.primarySoft}` }}>
    {children}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
// أنواع المنظمات: قائمة نموذج التسجيل وقائمة الإعدادات معًا (حتى لا تختفي قيمة حساب قائم)
const ORG_TYPES = ['جمعية أهلية', 'جمعية خيرية', 'مؤسسة أهلية', 'مؤسسة غير ربحية', 'جمعية تعاونية', 'وقف', 'اتحاد', 'جمعية', 'مؤسسة', 'غير ربحية', 'هيئة حكومية', 'أخرى'];
const MISSING_LABEL = { org_name: 'اسم المنظمة', org_type: 'نوع المنظمة', phone: 'رقم الجوال' };

export default function ProfilePage({ authUser, onUpdate, active = true, onCompleted }) {
  const role = authUser?.role || 'client';

  const [tab,        setTab]       = useState('profile');
  const [form,       setForm]      = useState({});
  const [pwForm,     setPwForm]    = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [saving,     setSaving]    = useState(false);
  const [pwSaving,   setPwSaving]  = useState(false);
  const [toast,      setToast]     = useState(null);
  const [errors,     setErrors]    = useState({});
  // حساب عميل لم يكمل بيانات منظمته بعد (أُنشئ عبر Google وأخواتها)
  const completing = role === 'client' && !!authUser && !authUser.profile_completed_at;
  const [justCompleted, setJustCompleted] = useState(false);
  // تغيير البريد بانتظار التأكيد برمز يُرسل إلى البريد الجديد: { email, message, retryAfter, sendFailed }
  const [emailChange, setEmailChange] = useState(null);
  const [pwErrors,   setPwErrors]  = useState({});
  const [avatarUrl,  setAvatarUrl] = useState(authUser?.logo_url || null);
  const [uploading,  setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (authUser?.logo_url) setAvatarUrl(authUser.logo_url);
  }, [authUser?.logo_url]);

  // عند فتح الصفحة من جديد تُعرض البيانات المحفوظة (لا مسودة لم تُحفظ أو رُفض حفظها)
  useEffect(() => {
    if (!authUser || !active) return;
    setErrors({});
    setForm({
      rep_name:         authUser.rep_name         || '',
      email:            authUser.email            || '',
      phone:            authUser.phone            || '',
      org_name:         authUser.org_name         || '',
      org_type:         authUser.org_type         || '',
      sector:           authUser.sector           || '',
      specialty:        authUser.specialty        || '',
      bio:              authUser.bio              || '',
      experience_years: authUser.experience_years || '',
    });
  }, [authUser, active]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }));
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm(f => ({ ...f, [name]: value }));
    if (pwErrors[name]) setPwErrors(er => ({ ...er, [name]: null }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // immediate local preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.post('/auth/profile/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = { ...authUser, ...res.data };
      setAvatarUrl(res.data.logo_url);
      localStorage.setItem('user', JSON.stringify(updated));
      onUpdate?.(updated);
      showToast('success', 'تم تحديث صورة الملف الشخصي');
    } catch {
      setAvatarUrl(authUser?.logo_url || null);
      showToast('error', 'فشل رفع الصورة، حاول مجدداً');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    // الحقول الإلزامية لا تُحفظ فارغة أو بمسافات فقط، ويبقى الاسم المحفوظ كما هو حتى إدخال قيمة صالحة
    const required = role === 'client'
      ? { org_name: 'اسم المنظمة مطلوب. أدخل اسم منظمتك ثم احفظ — يبقى الاسم المحفوظ سابقًا كما هو.', rep_name: 'اسم الممثل مطلوب.',
          org_type: 'اختر نوع المنظمة.', phone: 'رقم الجوال مطلوب للتواصل معك بخصوص خططك.' }
      : { rep_name: 'الاسم مطلوب.' };
    const local = {};
    for (const [k, msg] of Object.entries(required)) if (!String(form[k] ?? '').trim()) local[k] = [msg];
    if (Object.keys(local).length) {
      setErrors(local);
      showToast('error', 'لم يُحفظ التغيير — أكمل الحقول المطلوبة');
      document.getElementById(`pf-${Object.keys(local)[0]}`)?.focus();
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const res = await api.put('/auth/profile', { ...form, org_name: String(form.org_name ?? '').trim(), rep_name: String(form.rep_name ?? '').trim() });
      const { email_change: change, ...fresh } = res.data;
      const updated = { ...authUser, ...fresh };
      localStorage.setItem('user', JSON.stringify(updated));
      onUpdate?.(updated);
      if (completing && updated.profile_completed_at) setJustCompleted(true);
      if (change) {
        setEmailChange({
          email: change.pending,
          message: change.message,
          retryAfter: change.retry_after ?? 60,
          sendFailed: change.send_status === 'failed',
        });
        showToast('success', 'تم حفظ البيانات — أكّد البريد الجديد بالرمز المرسل إليه');
      } else {
        showToast('success', 'تم حفظ الملف الشخصي بنجاح');
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        showToast('error', 'يوجد أخطاء في البيانات المدخلة');
      } else {
        showToast('error', err.response?.data?.message || 'حدث خطأ أثناء الحفظ');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwSaving(true);
    setPwErrors({});
    try {
      await api.put('/auth/password', pwForm);
      setPwForm({ current_password: '', new_password: '', new_password_confirmation: '' });
      showToast('success', 'تم تغيير كلمة المرور بنجاح');
    } catch (err) {
      if (err.response?.status === 422) {
        setPwErrors(err.response.data.errors || {});
        showToast('error', err.response?.data?.message || 'يوجد أخطاء في البيانات');
      } else {
        showToast('error', err.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور');
      }
    } finally {
      setPwSaving(false);
    }
  };

  const displayName = role === 'client' ? (authUser?.org_name || authUser?.rep_name) : authUser?.rep_name;
  const orgTypes = form.org_type && !ORG_TYPES.includes(form.org_type) ? [form.org_type, ...ORG_TYPES] : ORG_TYPES;
  // ما ينقص الآن (يتحدّث مع الكتابة) — للحساب المنشأ عبر Google وأخواتها
  const missingNow = Object.keys(MISSING_LABEL).filter((k) => !String(form[k] ?? '').trim());

  return (
    <div className="animate-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Toast toast={toast} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={handleAvatarChange}
      />

      {/* Profile Header Card */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(14,42,61,0.07)', display: 'flex', alignItems: 'center', gap: 20 }}>
        <AvatarCircle
          name={displayName}
          email={authUser?.email}
          logoUrl={avatarUrl}
          size={72}
          onClick={() => !uploading && fileInputRef.current?.click()}
          uploading={uploading}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{displayName || '—'}</div>
          <div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>{authUser?.email}</div>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: role === 'admin' ? '#FDE2D2' : role === 'consultant' ? C.primarySoft : C.grayLight, color: role === 'admin' ? '#A33F12' : role === 'consultant' ? C.primary : C.gray }}>
              {role === 'admin' ? 'مدير النظام' : role === 'consultant' ? 'مستشار' : 'عميل'}
            </span>
            {role === 'client' && authUser?.org_type && (
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', background: C.grayLight, color: C.gray }}>
                {authUser.org_type}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: C.grayLight, borderRadius: 12, padding: 3, marginBottom: 20, width: 'fit-content' }}>
        {[['profile', 'الملف الشخصي'], ['security', 'الأمان']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '9px 22px', borderRadius: 10, border: 'none',
            background: tab === id ? 'white' : 'transparent',
            color: tab === id ? C.primary : C.gray,
            fontWeight: tab === id ? 700 : 500, fontSize: 13,
            fontFamily: "inherit", cursor: 'pointer',
            boxShadow: tab === id ? '0 1px 4px rgba(14,42,61,0.08)' : 'none',
            transition: 'all 0.2s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {tab === 'profile' && (
        <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 1px 4px rgba(14,42,61,0.07)' }}>

          {/* استكمال الملف: حساب أُنشئ عبر Google ببياناته الأساسية فقط */}
          {completing && (
            <div role="status" data-profile-completion style={{ background: '#FEF3EC', border: '1.5px solid #FBC3A3', borderRadius: 14, padding: '16px 18px', marginBottom: 22, color: '#5E240A', lineHeight: 1.9 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#7F310E', marginBottom: 4 }}>أهلًا {authUser?.rep_name || ''}، خطوة أخيرة لإكمال حسابك</div>
              <div style={{ fontSize: 13.5 }}>أخذنا من حسابك البيانات الأساسية (الاسم والبريد{authUser?.logo_url ? ' والصورة' : ''}). أكمل بيانات منظمتك حتى تبدأ خدماتك ويتواصل معك مستشارك:</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 13.5, fontWeight: 700 }}>
                {Object.entries(MISSING_LABEL).map(([k, l]) => {
                  const ok = !missingNow.includes(k);
                  return <li key={k} data-missing={ok ? undefined : k} style={{ color: ok ? '#0B7F5D' : '#A33F12' }}>{ok ? '✓' : '○'} {l}</li>;
                })}
              </ul>
              <div style={{ fontSize: 12.5, marginTop: 8 }}>ثم اضغط «حفظ التغييرات» أسفل الصفحة.</div>
            </div>
          )}
          {justCompleted && (
            <div role="status" data-profile-completed style={{ background: '#C9EFE1', border: '1.5px solid #7FD3B5', borderRadius: 14, padding: '14px 18px', marginBottom: 22, color: '#086449', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800 }}>اكتمل ملف منظمتك. يمكنك الآن اختيار خدمتك والبدء.</span>
              {onCompleted && <button type="button" onClick={onCompleted} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#0B7F5D', color: '#fff', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>الانتقال إلى لوحة التحكم ←</button>}
            </div>
          )}

          {/* ── Client Fields ── */}
          {role === 'client' && (
            <>
              <SectionTitle>بيانات المنظمة</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 16, marginBottom: 24 }}>
                <Field label="اسم المنظمة *" name="org_name" value={form.org_name} onChange={handleChange} error={errors.org_name?.[0]} />
                <div>
                  <label htmlFor="pf-org_type" style={{ fontSize: 12, fontWeight: 600, color: C.ink, display: 'block', marginBottom: 6 }}>نوع المنظمة *</label>
                  <select
                    id="pf-org_type" name="org_type" value={form.org_type || ''} onChange={handleChange}
                    aria-invalid={errors.org_type ? 'true' : undefined}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${errors.org_type ? '#C53A3A' : C.grayBorder}`, fontSize: 13, fontFamily: "inherit", outline: 'none', background: 'white' }}
                  >
                    <option value="">اختر النوع</option>
                    {orgTypes.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {errors.org_type?.[0] && <div role="alert" style={{ fontSize: 12, color: '#C53A3A', fontWeight: 600, marginTop: 6 }}>{errors.org_type[0]}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.ink, display: 'block', marginBottom: 6 }}>القطاع</label>
                  <select
                    name="sector" value={form.sector || ''} onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: "inherit", outline: 'none', background: 'white' }}
                  >
                    <option value="">اختر القطاع</option>
                    {['تعليم', 'صحة', 'بيئة', 'تنمية اجتماعية', 'إغاثة', 'رياضة', 'ثقافة', 'أخرى'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <SectionTitle>بيانات الممثل</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 16, marginBottom: 24 }}>
                <Field label="اسم الممثل *" name="rep_name" value={form.rep_name} onChange={handleChange} error={errors.rep_name?.[0]} />
                <Field label="البريد الإلكتروني *" name="email" value={form.email} onChange={handleChange} error={errors.email?.[0]} type="email" />
                <Field label="رقم الجوال *" name="phone" value={form.phone} onChange={handleChange} error={errors.phone?.[0]} type="tel" placeholder="05xxxxxxxx" />
              </div>
            </>
          )}

          {/* ── Consultant Fields ── */}
          {role === 'consultant' && (
            <>
              <SectionTitle>المعلومات الشخصية</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 16, marginBottom: 24 }}>
                <Field label="الاسم الكامل *" name="rep_name" value={form.rep_name} onChange={handleChange} error={errors.rep_name?.[0]} />
                <Field label="البريد الإلكتروني *" name="email" value={form.email} onChange={handleChange} error={errors.email?.[0]} type="email" />
                <Field label="رقم الجوال" name="phone" value={form.phone} onChange={handleChange} error={errors.phone?.[0]} type="tel" placeholder="05xxxxxxxx" />
                <Field label="التخصص" name="specialty" value={form.specialty} onChange={handleChange} error={errors.specialty?.[0]} placeholder="مثال: التخطيط الاستراتيجي" />
                <Field label="سنوات الخبرة" name="experience_years" value={form.experience_years} onChange={handleChange} error={errors.experience_years?.[0]} type="number" placeholder="مثال: 8" />
              </div>
              <SectionTitle>النبذة التعريفية</SectionTitle>
              <div style={{ marginBottom: 24 }}>
                <Field label="" name="bio" value={form.bio} onChange={handleChange} textarea placeholder="اكتب نبذة مختصرة عن خبرتك وتخصصاتك..." />
              </div>
            </>
          )}

          {/* ── Admin Fields ── */}
          {role === 'admin' && (
            <>
              <SectionTitle>بيانات المدير</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 16, marginBottom: 24 }}>
                <Field label="الاسم الكامل *" name="rep_name" value={form.rep_name} onChange={handleChange} error={errors.rep_name?.[0]} />
                <Field label="البريد الإلكتروني *" name="email" value={form.email} onChange={handleChange} error={errors.email?.[0]} type="email" />
                <Field label="رقم الجوال" name="phone" value={form.phone} onChange={handleChange} error={errors.phone?.[0]} type="tel" placeholder="05xxxxxxxx" />
                <Field label="الدور" name="_role" value="مدير النظام" disabled />
              </div>
            </>
          )}

          {/* تأكيد البريد الجديد قبل تطبيقه */}
          {emailChange && (
            <div style={{ border: `1.5px solid ${C.primary}40`, background: '#FBF9F5', borderRadius: 12, padding: '14px 18px', marginBottom: 18, maxWidth: 520 }}>
              <OtpVerification
                compact
                key={emailChange.email}
                title="تأكيد البريد الإلكتروني الجديد"
                submitLabel="تأكيد البريد الجديد"
                email={emailChange.email}
                message={emailChange.message}
                retryAfter={emailChange.retryAfter}
                sendFailed={emailChange.sendFailed}
                verifyRequest={code => api.post('/auth/profile/email/confirm', { email: emailChange.email, code })}
                resendRequest={() => api.post('/auth/profile/email/resend', { email: emailChange.email })}
                onVerified={(user) => {
                  const updated = { ...authUser, ...user };
                  localStorage.setItem('user', JSON.stringify(updated));
                  onUpdate?.(updated);
                  setEmailChange(null);
                  showToast('success', 'تم تأكيد البريد الجديد وتحديثه');
                }}
                onBack={() => {
                  setEmailChange(null);
                  setForm(f => ({ ...f, email: authUser?.email || '' }));
                }}
              />
              <div style={{ fontSize: 12, color: C.gray, marginTop: 8, lineHeight: 1.7 }}>
                يبقى بريد حسابك الحالي <strong dir="ltr" style={{ unicodeBidi: 'isolate' }}>{authUser?.email}</strong> فعّالًا حتى تأكيد البريد الجديد.
              </div>
            </div>
          )}

          {/* Error messages */}
          {Object.keys(errors).length > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FCEBEB', border: '1px solid #F1B2B2', marginBottom: 16 }}>
              {Object.values(errors).flat().map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: C.red }}>• {e}</div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              style={{
                padding: '11px 32px', borderRadius: 12, border: 'none',
                background: saving ? C.grayLight : C.primary,
                color: saving ? C.gray : 'white',
                fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: saving ? 'none' : `0 4px 14px ${C.primary}40`,
              }}
            >
              {saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      )}

      {/* ── Security Tab ── */}
      {tab === 'security' && (
        <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 1px 4px rgba(14,42,61,0.07)' }}>
          <SectionTitle>تغيير كلمة المرور</SectionTitle>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 440, marginBottom: 24 }}>
            <Field
              label="كلمة المرور الحالية *"
              name="current_password"
              value={pwForm.current_password}
              onChange={handlePwChange}
              type="password"
              placeholder="••••••••"
            />
            {pwErrors.current_password && <div style={{ fontSize: 11, color: C.red, marginTop: -8 }}>• {pwErrors.current_password[0]}</div>}

            <Field
              label="كلمة المرور الجديدة * (8 أحرف على الأقل)"
              name="new_password"
              value={pwForm.new_password}
              onChange={handlePwChange}
              type="password"
              placeholder="••••••••"
            />
            {pwErrors.new_password && <div style={{ fontSize: 11, color: C.red, marginTop: -8 }}>• {pwErrors.new_password[0]}</div>}

            <Field
              label="تأكيد كلمة المرور الجديدة *"
              name="new_password_confirmation"
              value={pwForm.new_password_confirmation}
              onChange={handlePwChange}
              type="password"
              placeholder="••••••••"
            />

            {/* Password strength indicator */}
            {pwForm.new_password && (
              <div>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>قوة كلمة المرور</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1,2,3,4].map(i => {
                    const len = pwForm.new_password.length;
                    const hasUpper = /[A-Z]/.test(pwForm.new_password);
                    const hasNum = /\d/.test(pwForm.new_password);
                    const hasSpecial = /[!@#$%^&*]/.test(pwForm.new_password);
                    const score = (len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasUpper || hasNum ? 1 : 0) + (hasSpecial ? 1 : 0);
                    const colors = ['#C53A3A', '#A33F12', '#A33F12', '#0B7F5D'];
                    return (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? colors[score - 1] || '#C53A3A' : C.grayBorder, transition: 'background 0.3s' }} />
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={pwSaving || !pwForm.current_password || !pwForm.new_password || !pwForm.new_password_confirmation}
              style={{
                marginTop: 8, padding: '11px 24px', borderRadius: 12, border: 'none',
                background: (!pwForm.current_password || !pwForm.new_password) ? C.grayLight : C.amber,
                color: (!pwForm.current_password || !pwForm.new_password) ? C.gray : '#0E2A3D',
                fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                cursor: (pwSaving || !pwForm.current_password || !pwForm.new_password) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                alignSelf: 'flex-start',
              }}
            >
              {pwSaving ? 'جارٍ التغيير…' : 'تغيير كلمة المرور'}
            </button>
          </div>

          {/* Security info */}
          <div style={{ padding: 16, borderRadius: 12, background: C.primarySoft, border: `1px solid ${C.primary}20` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><IcLightbulb width={14} height={14}/> نصائح لكلمة مرور آمنة</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['استخدم 8 أحرف على الأقل', 'اجمع بين الأحرف والأرقام والرموز', 'تجنب استخدام معلوماتك الشخصية', 'لا تستخدم كلمة المرور ذاتها في أكثر من موقع'].map((t, i) => (
                <div key={i} style={{ fontSize: 12, color: C.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: C.green, display: 'inline-flex' }}><IcCheck width={12} height={12}/></span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
