import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api/axios';
import { IcCheck, IcLightbulb, IcShield, IcBriefcase, IcBuilding, IcUser, IcLock, IcDocument, IcSave } from '../../utils/icons';

const C = {
  teal: '#1A6B7C', tealDark: '#14505E', tealLight: '#E8F4F6',
  orange: '#E8620A', green: '#16a34a', red: '#dc2626',
  gray: '#6B7280', grayLight: '#F3F4F6', grayBorder: '#E5E7EB',
};

// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) =>
  toast ? ReactDOM.createPortal(
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999999, padding: '12px 24px', borderRadius: 12,
      background: toast.type === 'success' ? '#065f46' : '#7f1d1d',
      color: 'white', fontSize: 14, fontWeight: 600,
      fontFamily: "'Cairo', sans-serif", boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      whiteSpace: 'nowrap', animation: 'fadeInUp 0.3s ease-out both',
    }}>
      {toast.msg}
    </div>,
    document.body
  ) : null;

// ── Field input ────────────────────────────────────────────────────────────────
const Field = ({ label, name, value, onChange, type = 'text', placeholder, disabled, textarea }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: C.tealDark }}>{label}</label>
    {textarea ? (
      <textarea
        name={name} value={value || ''} onChange={onChange}
        placeholder={placeholder} rows={3}
        style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: "'Cairo', sans-serif", resize: 'vertical', outline: 'none', transition: 'border 0.2s', background: disabled ? C.grayLight : 'white', color: disabled ? C.gray : '#1F2937' }}
        onFocus={e => !disabled && (e.target.style.borderColor = C.teal)}
        onBlur={e => (e.target.style.borderColor = C.grayBorder)}
        disabled={disabled}
      />
    ) : (
      <input
        type={type} name={name} value={value || ''} onChange={onChange}
        placeholder={placeholder || label}
        style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: "'Cairo', sans-serif", outline: 'none', transition: 'border 0.2s', background: disabled ? C.grayLight : 'white', color: disabled ? C.gray : '#1F2937' }}
        onFocus={e => !disabled && (e.target.style.borderColor = C.teal)}
        onBlur={e => (e.target.style.borderColor = C.grayBorder)}
        disabled={disabled}
      />
    )}
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
          background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: size * 0.38,
          boxShadow: `0 4px 16px ${C.teal}40`,
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
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: showOverlay ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}>
          {uploading
            ? <span style={{ fontSize: size * 0.28 }}>⏳</span>
            : <span style={{ fontSize: size * 0.3 }}>📷</span>}
        </div>
      </div>

    </div>
  );
};

// ── Section header ─────────────────────────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 700, color: C.tealDark, marginBottom: 16, paddingBottom: 8, borderBottom: `2px solid ${C.tealLight}` }}>
    {children}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ProfilePage({ authUser, onUpdate }) {
  const role = authUser?.role || 'client';

  const [tab,        setTab]       = useState('profile');
  const [form,       setForm]      = useState({});
  const [pwForm,     setPwForm]    = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [saving,     setSaving]    = useState(false);
  const [pwSaving,   setPwSaving]  = useState(false);
  const [toast,      setToast]     = useState(null);
  const [errors,     setErrors]    = useState({});
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

  useEffect(() => {
    if (!authUser) return;
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
  }, [authUser]);

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
    setSaving(true);
    setErrors({});
    try {
      const res = await api.put('/auth/profile', form);
      const updated = { ...authUser, ...res.data };
      localStorage.setItem('user', JSON.stringify(updated));
      onUpdate?.(updated);
      showToast('success', 'تم حفظ الملف الشخصي بنجاح');
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

  const roleName = role === 'admin' ? 'مدير النظام' : role === 'consultant' ? 'مستشار' : (authUser?.org_type || 'عميل');
  const displayName = role === 'client' ? (authUser?.org_name || authUser?.rep_name) : authUser?.rep_name;

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
      <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 20 }}>
        <AvatarCircle
          name={displayName}
          email={authUser?.email}
          logoUrl={avatarUrl}
          size={72}
          onClick={() => !uploading && fileInputRef.current?.click()}
          uploading={uploading}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.tealDark }}>{displayName || '—'}</div>
          <div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>{authUser?.email}</div>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: role === 'admin' ? '#FEF3C7' : role === 'consultant' ? C.tealLight : C.grayLight, color: role === 'admin' ? '#D97706' : role === 'consultant' ? C.teal : C.gray }}>
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
            color: tab === id ? C.teal : C.gray,
            fontWeight: tab === id ? 700 : 500, fontSize: 13,
            fontFamily: "'Cairo', sans-serif", cursor: 'pointer',
            boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {tab === 'profile' && (
        <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>

          {/* ── Client Fields ── */}
          {role === 'client' && (
            <>
              <SectionTitle>بيانات المنظمة</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <Field label="اسم المنظمة *" name="org_name" value={form.org_name} onChange={handleChange} />
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.tealDark, display: 'block', marginBottom: 6 }}>نوع المنظمة</label>
                  <select
                    name="org_type" value={form.org_type || ''} onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: "'Cairo', sans-serif", outline: 'none', background: 'white' }}
                  >
                    <option value="">اختر النوع</option>
                    {['جمعية خيرية', 'مؤسسة غير ربحية', 'وقف', 'هيئة حكومية', 'أخرى'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.tealDark, display: 'block', marginBottom: 6 }}>القطاع</label>
                  <select
                    name="sector" value={form.sector || ''} onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: "'Cairo', sans-serif", outline: 'none', background: 'white' }}
                  >
                    <option value="">اختر القطاع</option>
                    {['تعليم', 'صحة', 'بيئة', 'تنمية اجتماعية', 'إغاثة', 'رياضة', 'ثقافة', 'أخرى'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <SectionTitle>بيانات الممثل</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <Field label="اسم الممثل *" name="rep_name" value={form.rep_name} onChange={handleChange} />
                <Field label="البريد الإلكتروني *" name="email" value={form.email} onChange={handleChange} type="email" />
                <Field label="رقم الجوال" name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="05xxxxxxxx" />
              </div>
            </>
          )}

          {/* ── Consultant Fields ── */}
          {role === 'consultant' && (
            <>
              <SectionTitle>المعلومات الشخصية</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <Field label="الاسم الكامل *" name="rep_name" value={form.rep_name} onChange={handleChange} />
                <Field label="البريد الإلكتروني *" name="email" value={form.email} onChange={handleChange} type="email" />
                <Field label="رقم الجوال" name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="05xxxxxxxx" />
                <Field label="التخصص" name="specialty" value={form.specialty} onChange={handleChange} placeholder="مثال: التخطيط الاستراتيجي" />
                <Field label="سنوات الخبرة" name="experience_years" value={form.experience_years} onChange={handleChange} type="number" placeholder="مثال: 8" />
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <Field label="الاسم الكامل *" name="rep_name" value={form.rep_name} onChange={handleChange} />
                <Field label="البريد الإلكتروني *" name="email" value={form.email} onChange={handleChange} type="email" />
                <Field label="رقم الجوال" name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="05xxxxxxxx" />
                <Field label="الدور" name="_role" value="مدير النظام" disabled />
              </div>
            </>
          )}

          {/* Error messages */}
          {Object.keys(errors).length > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #fecaca', marginBottom: 16 }}>
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
                background: saving ? C.grayLight : C.teal,
                color: saving ? C.gray : 'white',
                fontWeight: 700, fontSize: 14, fontFamily: "'Cairo', sans-serif",
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: saving ? 'none' : `0 4px 14px ${C.teal}40`,
              }}
            >
              {saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      )}

      {/* ── Security Tab ── */}
      {tab === 'security' && (
        <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
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
                    const colors = ['#dc2626', '#f97316', '#eab308', '#16a34a'];
                    return (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? colors[score - 1] || '#dc2626' : C.grayBorder, transition: 'background 0.3s' }} />
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
                background: (!pwForm.current_password || !pwForm.new_password) ? C.grayLight : C.orange,
                color: (!pwForm.current_password || !pwForm.new_password) ? C.gray : 'white',
                fontWeight: 700, fontSize: 14, fontFamily: "'Cairo', sans-serif",
                cursor: (pwSaving || !pwForm.current_password || !pwForm.new_password) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                alignSelf: 'flex-start',
              }}
            >
              {pwSaving ? 'جارٍ التغيير…' : 'تغيير كلمة المرور'}
            </button>
          </div>

          {/* Security info */}
          <div style={{ padding: 16, borderRadius: 12, background: C.tealLight, border: `1px solid ${C.teal}20` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><IcLightbulb width={14} height={14}/> نصائح لكلمة مرور آمنة</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['استخدم 8 أحرف على الأقل', 'اجمع بين الأحرف والأرقام والرموز', 'تجنب استخدام معلوماتك الشخصية', 'لا تستخدم كلمة المرور ذاتها في أكثر من موقع'].map((t, i) => (
                <div key={i} style={{ fontSize: 12, color: C.tealDark, display: 'flex', alignItems: 'center', gap: 6 }}>
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
