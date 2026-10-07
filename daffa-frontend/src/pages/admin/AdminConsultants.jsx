import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { adminApi } from '../../api/admin';
import { usePermissions } from '../../utils/permissions';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

const SPECIALTIES = [
  'تخطيط استراتيجي',
  'تخطيط تشغيلي',
  'سياسات HR',
  'حوكمة',
  'سياسات مالية',
  'سياسات ولوائح',
  'حوكمة وتطوير',
];

const emptyForm = {
  name: '', specialty: '', bio: '',
  experience_years: 5, completed_projects: 0,
  rating: 5.0, available: true, avatar_initial: '',
  email: '', password: '',
};

const CACHE_KEY = 'admin_consultants_cache';

export default function AdminConsultants() {
  // تهيئة من الـ cache فوراً — لا spinner إذا يوجد بيانات مخزّنة
  const cached = (() => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || []; } catch { return []; } })();

  const [consultants, setConsultants] = useState(cached);
  const [loading,     setLoading]     = useState(cached.length === 0); // spinner فقط إذا لا يوجد cache
  const [refreshing,  setRefreshing]  = useState(false);               // مؤشر تحديث خفي
  const [loadError,   setLoadError]   = useState(null);
  const [modal,       setModal]       = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [form,        setForm]        = useState(emptyForm);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const [avatarFile,  setAvatarFile]  = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const load = (silent = false) => {
    if (!silent) setLoading(cached.length === 0);
    else setRefreshing(true);
    setLoadError(null);
    adminApi.getConsultants()
      .then(r => {
        setConsultants(r.data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(r.data));
      })
      .catch(e => {
        if (cached.length === 0) setLoadError(e.response?.data?.message || 'تعذّر الاتصال بالخادم');
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => {
    if (cached.length > 0) {
      // عنده cache: اعرض فوراً واجلب تحديث في الخلفية
      load(true);
    } else {
      load(false);
    }
  }, []);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const resetAvatar = () => { setAvatarFile(null); setAvatarPreview(null); };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setSelected(null);
    resetAvatar();
    setModal('add');
  };

  const openEdit = (c, e) => {
    e.stopPropagation();
    setForm({
      name: c.name, specialty: c.specialty, bio: c.bio || '',
      experience_years: c.experience_years, completed_projects: c.completed_projects,
      rating: c.rating, available: c.available, avatar_initial: c.avatar_initial || '',
      email: '', password: '',
    });
    setSelected(c);
    resetAvatar();
    setModal('edit');
  };

  const openView = (c) => {
    setSelected(c);
    setModal('view');
  };

  const openDelete = (c, e) => {
    e.stopPropagation();
    setSelected(c);
    setModal('delete');
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.specialty.trim()) return;
    if (modal === 'add' && form.email && !form.password) {
      showToast('error', 'كلمة المرور مطلوبة عند إدخال البريد الإلكتروني');
      return;
    }
    setSaving(true);
    try {
      let consultantData;
      if (modal === 'add') {
        const res = await adminApi.createConsultant(form);
        consultantData = res.data;
      } else {
        const res = await adminApi.updateConsultant(selected.id, form);
        consultantData = res.data;
      }

      if (avatarFile) {
        try {
          const avatarRes = await adminApi.uploadConsultantAvatar(consultantData.id, avatarFile);
          consultantData = avatarRes.data;
        } catch {
          showToast('error', 'تم الحفظ لكن تعذّر رفع الصورة');
        }
      }

      if (modal === 'add') {
        const updated = [...consultants, consultantData];
        setConsultants(updated);
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        showToast('success', 'تم إضافة المستشار بنجاح ✓');
      } else {
        const updated = consultants.map(x => x.id === consultantData.id ? consultantData : x);
        setConsultants(updated);
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        showToast('success', 'تم تحديث بيانات المستشار ✓');
      }
      setModal(null);
    } catch (e) {
      const errors = e.response?.data?.errors;
      const firstError = errors ? Object.values(errors)[0]?.[0] : null;
      showToast('error', firstError || e.response?.data?.message || 'حدث خطأ، حاول مجدداً');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminApi.deleteConsultant(selected.id);
      const updated = consultants.filter(x => x.id !== selected.id);
      setConsultants(updated);
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      showToast('success', 'تم حذف المستشار ✓');
      setModal(null);
    } catch {
      showToast('error', 'حدث خطأ في الحذف');
    } finally {
      setSaving(false);
    }
  };

  const openToggleConfirm = (c, e) => {
    e.stopPropagation();
    setSelected(c);
    setModal('toggle-confirm');
  };

  const handleToggle = async () => {
    const c = selected;
    setSaving(true);
    setModal(null);
    const updated = consultants.map(x => x.id === c.id ? { ...x, available: !x.available } : x);
    setConsultants(updated);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    try {
      await adminApi.toggleConsultant(c.id);
      showToast('success', c.available ? `تم إيقاف ${c.name} ✓` : `تم تفعيل ${c.name} ✓`);
    } catch {
      setConsultants(consultants);
      localStorage.setItem(CACHE_KEY, JSON.stringify(consultants));
      showToast('error', 'تعذّر تغيير الحالة');
    } finally {
      setSaving(false);
    }
  };

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const { can } = usePermissions();

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
      <div style={{ fontSize: 15, color: colors.teal, fontWeight: 600 }}>جاري تحميل المستشارين...</div>
    </div>
  );

  if (!can('admin.consultants.view')) return (
    <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 12 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>غير مصرح بالوصول</div>
      <div style={{ fontSize: 13, color: '#6b7280' }}>ليس لديك صلاحية لعرض إدارة المستشارين</div>
    </div>
  );

  if (loadError) return (
    <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 12 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>فشل تحميل البيانات</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>{loadError}</div>
      <button onClick={load} style={{ padding: '10px 28px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
        إعادة المحاولة
      </button>
    </div>
  );

  return (
    <div className="animate-in">
      {/* رأس الصفحة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.tealDark }}>إدارة المستشارين</h2>
          {refreshing && (
            <span style={{ fontSize: 11, color: '#9ca3af', padding: '3px 10px', background: '#f3f4f6', borderRadius: 20 }}>
              ↻ تحديث...
            </span>
          )}
        </div>
        {can('admin.consultants.add') && (
          <button
            onClick={openAdd}
            style={{ padding: '10px 22px', background: colors.orange, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}
          >
            + إضافة مستشار
          </button>
        )}
      </div>

      {/* إحصائيات سريعة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="إجمالي المستشارين" value={consultants.length}         color={colors.teal}    icon="👥" />
        <StatCard label="متاحون الآن"        value={consultants.filter(c => c.available).length}  color="#16a34a" icon="✅" />
        <StatCard label="غير متاحين"         value={consultants.filter(c => !c.available).length} color="#dc2626" icon="⏸" />
      </div>

      {/* قائمة المستشارين */}
      {consultants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', background: '#fff', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>لا يوجد مستشارون بعد</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>اضغط "إضافة مستشار" للبدء</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {consultants.map(c => (
            <div
              key={c.id}
              onClick={() => openView(c)}
              style={{
                background: '#fff', borderRadius: 14, padding: 20,
                boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
                border: `1.5px solid ${c.available ? '#e5e7eb' : '#fecaca'}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.07)'; }}
            >
              <div style={{ textAlign: 'center' }}>
                {/* أفاتار */}
                <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700, border: '2px solid #e5e7eb' }}>
                  {c.avatar_url
                    ? <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : (c.avatar_initial || c.name[0])
                  }
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark }}>{c.name}</div>
                <div style={{ display: 'inline-block', marginTop: 4, padding: '3px 10px', background: '#f0f9ff', color: colors.teal, fontSize: 11, borderRadius: 20, fontWeight: 600 }}>{c.specialty}</div>
                {c.user ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 5, fontSize: 10, color: '#16a34a', fontWeight: 600 }}>
                    <span>🔑</span><span>{c.user.email}</span>
                  </div>
                ) : (
                  <div style={{ marginTop: 5, fontSize: 10, color: '#9ca3af' }}>بدون حساب دخول</div>
                )}

                {/* تقييم */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, marginTop: 10 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: 12, color: s <= Math.round(c.rating) ? '#f59e0b' : '#e5e7eb' }}>★</span>
                  ))}
                  <span style={{ fontSize: 12, color: '#6b7280', marginRight: 4 }}>{c.rating}</span>
                </div>

                {/* إحصائيات */}
                <div style={{ display: 'flex', justifyContent: 'space-around', margin: '12px 0', paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark }}>{c.experience_years}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>سنة خبرة</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark }}>{c.completed_projects}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>مشروع</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: c.available ? '#dcfce7' : '#fee2e2',
                      color: c.available ? '#16a34a' : '#dc2626',
                    }}>
                      {c.available ? 'متاح' : 'غير متاح'}
                    </div>
                  </div>
                </div>

                {/* أزرار التحكم */}
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <button
                    onClick={e => { e.stopPropagation(); openView(c); }}
                    style={{ flex: 1, padding: '7px 0', background: '#f0f9ff', color: colors.teal, border: `1px solid #bae6fd`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}
                  >
                    👁 عرض
                  </button>
                  {can('admin.consultants.toggle') && (
                    <button
                      onClick={e => openToggleConfirm(c, e)}
                      style={{ flex: 1, padding: '7px 0', background: c.available ? '#fef2f2' : '#f0fdf4', color: c.available ? '#dc2626' : '#16a34a', border: `1px solid ${c.available ? '#fecaca' : '#86efac'}`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}
                    >
                      {c.available ? '⏸ إيقاف' : '▶ تفعيل'}
                    </button>
                  )}
                  {can('admin.consultants.edit') && (
                    <button
                      onClick={e => openEdit(c, e)}
                      style={{ flex: 1, padding: '7px 0', background: '#fff7ed', color: colors.orange, border: `1px solid #fed7aa`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}
                    >
                      ✏️ تعديل
                    </button>
                  )}
                  {can('admin.consultants.delete') && (
                    <button
                      onClick={e => openDelete(c, e)}
                      style={{ padding: '7px 12px', background: '#fef2f2', color: '#dc2626', border: `1px solid #fecaca`, borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {(modal === 'add' || modal === 'edit') && (
        <Overlay onClose={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.tealDark }}>
                {modal === 'add' ? 'إضافة مستشار جديد' : 'تعديل بيانات المستشار'}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>

            {/* ── صورة المستشار ── */}
            <div style={{ marginBottom: 20, padding: '16px', background: '#f3f4f6', borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>
                الصورة الشخصية
                <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280', marginRight: 6 }}>(اختياري)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: '2px solid #e5e7eb', background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(avatarPreview || (modal === 'edit' && selected?.avatar_url)) ? (
                    <img src={avatarPreview || selected.avatar_url} alt="صورة" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <span style={{ color: '#fff', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                      {(form.name || '؟')[0]}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {avatarFile ? (
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      ✅ {avatarFile.name}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>PNG / JPG / WebP — بحد أقصى 2 ميغابايت</div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: colors.tealDark, fontFamily: "'Cairo', sans-serif", flexShrink: 0 }}>
                      📷 {avatarFile || (modal === 'edit' && selected?.avatar_url) ? 'تغيير الصورة' : 'اختر صورة'}
                      <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                    </label>
                    {(avatarFile || (modal === 'edit' && selected?.avatar_url)) && (
                      <button
                        onClick={() => { resetAvatar(); if (modal === 'edit') setSelected(p => ({ ...p, avatar_url: null })); }}
                        style={{ padding: '7px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", flexShrink: 0 }}
                      >
                        ✕ حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="اسم المستشار *">
                <input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="الاسم الكامل" style={inputStyle} />
              </FormField>
              <FormField label="التخصص *">
                <select value={form.specialty} onChange={e => setF('specialty', e.target.value)} style={inputStyle}>
                  <option value="">-- اختر التخصص --</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="سنوات الخبرة">
                <input type="number" min="0" max="50" value={form.experience_years} onChange={e => setF('experience_years', +e.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="عدد المشاريع المنجزة">
                <input type="number" min="0" value={form.completed_projects} onChange={e => setF('completed_projects', +e.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="التقييم (0–5)">
                <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => setF('rating', +e.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="الحرف الأول (للأفاتار)">
                <input value={form.avatar_initial} onChange={e => setF('avatar_initial', e.target.value)} placeholder="مثال: أ" maxLength={3} style={inputStyle} />
              </FormField>
              <FormField label="نبذة عن المستشار" style={{ gridColumn: '1/-1' }}>
                <textarea value={form.bio} onChange={e => setF('bio', e.target.value)} placeholder="خبرة ومؤهلات المستشار..." rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
              </FormField>
              <FormField label="الحالة" style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.available} onChange={e => setF('available', e.target.checked)} style={{ width: 16, height: 16, accentColor: colors.teal }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: form.available ? '#16a34a' : '#dc2626' }}>
                    {form.available ? 'متاح للعملاء' : 'غير متاح حالياً'}
                  </span>
                </label>
              </FormField>

              {/* حساب الدخول */}
              {(modal === 'add' || (modal === 'edit' && selected && !selected.user_id)) && (
                <div style={{ gridColumn: '1/-1', borderTop: '1.5px dashed #e5e7eb', paddingTop: 16, marginTop: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 4 }}>
                    🔑 حساب دخول للمستشار
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>
                    {modal === 'add'
                      ? 'اختياري — يتيح للمستشار الدخول على بوابته الخاصة'
                      : 'هذا المستشار ليس لديه حساب دخول بعد — أنشئ له واحداً الآن'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FormField label="البريد الإلكتروني">
                      <input type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="consultant@example.com" style={inputStyle} />
                    </FormField>
                    <FormField label={`كلمة المرور${form.email ? ' *' : ''}`}>
                      <input type="password" value={form.password} onChange={e => setF('password', e.target.value)} placeholder="6 أحرف على الأقل" style={inputStyle} />
                    </FormField>
                  </div>
                </div>
              )}

              {/* مستشار لديه حساب مسبقاً */}
              {modal === 'edit' && selected?.user_id && (
                <div style={{ gridColumn: '1/-1', borderTop: '1.5px dashed #e5e7eb', paddingTop: 14, marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: 16 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>لديه حساب دخول</div>
                      <div style={{ fontSize: 11, color: '#4ade80' }}>{selected.user?.email}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>إلغاء</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.specialty.trim()}
                style={{ padding: '10px 28px', background: (!form.name.trim() || !form.specialty.trim()) ? '#d1d5db' : colors.orange, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}
              >
                {saving ? 'جاري الحفظ...' : (modal === 'add' ? 'إضافة المستشار' : 'حفظ التعديلات')}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {modal === 'view' && selected && (
        <Overlay onClose={() => setModal(null)} closeOnBackdrop>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26, fontWeight: 700, border: '2px solid #e5e7eb' }}>
                {selected.avatar_url
                  ? <img src={selected.avatar_url} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : (selected.avatar_initial || selected.name[0])
                }
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: colors.tealDark }}>{selected.name}</h3>
              <div style={{ display: 'inline-block', marginTop: 6, padding: '4px 14px', background: '#f0f9ff', color: colors.teal, fontSize: 12, borderRadius: 20, fontWeight: 600 }}>{selected.specialty}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 10 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 16, color: s <= Math.round(selected.rating) ? '#f59e0b' : '#e5e7eb' }}>★</span>)}
                <span style={{ fontSize: 13, color: '#6b7280', marginRight: 4 }}>{selected.rating}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <InfoBox label="سنوات الخبرة"     value={selected.experience_years} />
              <InfoBox label="المشاريع المنجزة" value={selected.completed_projects} />
              <InfoBox label="الحالة"           value={selected.available ? 'متاح' : 'غير متاح'} valueColor={selected.available ? '#16a34a' : '#dc2626'} />
            </div>
            {selected.bio && (
              <div style={{ background: '#f8fafb', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#4b5563', lineHeight: 1.8, marginBottom: 16 }}>
                {selected.bio}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 22px', background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", color: '#374151' }}>إغلاق</button>
              <button onClick={e => openEdit(selected, e)} style={{ padding: '9px 22px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>✏️ تعديل</button>
            </div>
          </div>
        </Overlay>
      )}

      {modal === 'toggle-confirm' && selected && (
        <Overlay onClose={() => setModal(null)} closeOnBackdrop>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, textAlign: 'center' }}>
            <div style={{
              width: 70, height: 70, borderRadius: '50%', margin: '0 auto 18px',
              background: selected.available ? '#fef2f2' : '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
            }}>
              {selected.available ? '⏸' : '▶'}
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>
              {selected.available ? 'إيقاف المستشار' : 'تفعيل المستشار'}
            </h3>

            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
              هل تريد {selected.available ? 'إيقاف' : 'تفعيل'}
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>
              {selected.name}؟
            </p>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 26 }}>
              {selected.available
                ? 'لن يظهر للعملاء في قائمة المستشارين المتاحين'
                : 'سيظهر للعملاء ويمكنهم اختياره'}
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setModal(null)}
                style={{ padding: '10px 28px', background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleToggle}
                disabled={saving}
                style={{
                  padding: '10px 28px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Cairo', sans-serif", color: '#fff',
                  background: selected.available ? '#dc2626' : '#16a34a',
                }}
              >
                {saving ? 'جاري...' : (selected.available ? '⏸ نعم، إيقاف' : '▶ نعم، تفعيل')}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {modal === 'delete' && selected && (
        <Overlay onClose={() => setModal(null)} closeOnBackdrop>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>⚠️</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>حذف المستشار</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>هل أنت متأكد من حذف</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 20 }}>{selected.name}؟</p>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24 }}>لا يمكن التراجع عن هذا الإجراء</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setModal(null)} style={{ padding: '10px 28px', background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", color: '#374151' }}>إلغاء</button>
              <button onClick={handleDelete} disabled={saving} style={{ padding: '10px 28px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
                {saving ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Toast — عبر Portal لتجاوز overflow الأب */}
      <Toast toast={toast} />
    </div>
  );
}

/* ── Toast — يُرسم خارج شجرة DOM عبر Portal ── */
const Toast = ({ toast }) => {
  if (!toast) return null;
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: toast.type === 'success' ? '#16a34a' : '#dc2626',
      color: '#fff', borderRadius: 12, padding: '14px 32px',
      fontSize: 15, fontWeight: 700,
      boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      zIndex: 999999, whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'fadeInUp 0.3s ease',
    }}>
      <span style={{ fontSize: 18 }}>{toast.type === 'success' ? '✅' : '❌'}</span>
      {toast.text}
    </div>,
    document.body
  );
};

/* ── Portal Overlay — يُرسم خارج شجرة DOM ── */
const Overlay = ({ children, onClose, closeOnBackdrop = false }) =>
  ReactDOM.createPortal(
    <div
      onClick={closeOnBackdrop ? e => { if (e.target === e.currentTarget) onClose(); } : undefined}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      {children}
    </div>,
    document.body
  );

const FormField = ({ label, children, style }) => (
  <div style={style}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

const InfoBox = ({ label, value, valueColor }) => (
  <div style={{ background: '#f8fafb', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
    <div style={{ fontSize: 16, fontWeight: 700, color: valueColor || colors.tealDark }}>{value}</div>
    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{label}</div>
  </div>
);

const StatCard = ({ label, value, color, icon }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #e5e7eb', borderRadius: 8,
  fontSize: 13, fontFamily: "'Cairo', sans-serif",
  direction: 'rtl', boxSizing: 'border-box',
  background: '#fff', outline: 'none',
};
