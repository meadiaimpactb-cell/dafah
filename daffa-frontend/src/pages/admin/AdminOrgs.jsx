import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { adminApi } from '../../api/admin';

const C = {
  teal:       '#1A6B7C',
  tealDark:   '#14505E',
  orange:     '#E8620A',
  gray:       '#6b7280',
  grayLight:  '#f3f4f6',
  grayBorder: '#e5e7eb',
  red:        '#dc2626',
  green:      '#16a34a',
};

const ORG_TYPES = ['غير ربحية', 'وقفية', 'اجتماعية', 'خيرية', 'تطوعية'];

const emptyForm = {
  org_name: '', org_type: '', rep_name: '',
  email: '', phone: '', sector: '', password: '',
};

const OrgAvatar = ({ org, size = 40 }) => (
  <div style={{
    width: size, height: size, minWidth: size, minHeight: size,
    borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
    border: `2px solid ${C.grayBorder}`,
    background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {org.logo_url ? (
      <img
        src={org.logo_url}
        alt={org.org_name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    ) : (
      <span style={{ color: '#fff', fontSize: size * 0.38, fontWeight: 700, lineHeight: 1 }}>
        {(org.org_name || '?')[0]}
      </span>
    )}
  </div>
);

const CACHE_KEY = 'admin_orgs_cache';

// ── helpers ─────────────────────────────────────────────────────────────────
const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: `1.5px solid ${C.grayBorder}`, fontSize: 13,
  fontFamily: "'Cairo', sans-serif", outline: 'none', boxSizing: 'border-box',
};

const statusColor = (s) => s === 'نشط' ? C.green : s === 'معلق' ? C.orange : C.teal;
const statusBg    = (s) => s === 'نشط' ? '#dcfce7' : s === 'معلق' ? '#fff7ed' : '#eff6ff';

const Badge = ({ text }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 700,
    background: statusBg(text), color: statusColor(text),
  }}>{text}</span>
);

const Field = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.tealDark, marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

const Overlay = ({ children, onClose, closeOnBackdrop = false }) =>
  ReactDOM.createPortal(
    <div
      onClick={closeOnBackdrop ? onClose : undefined}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 20,
      }}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>,
    document.body,
  );

const Toast = ({ toast }) =>
  toast ? ReactDOM.createPortal(
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: toast.type === 'success' ? '#16a34a' : '#dc2626',
      color: '#fff', padding: '12px 28px', borderRadius: 12,
      fontSize: 14, fontWeight: 700, zIndex: 99999, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      fontFamily: "'Cairo', sans-serif",
    }}>{toast.text}</div>,
    document.body,
  ) : null;

// ── main component ────────────────────────────────────────────────────────────
export default function AdminOrgs() {
  const cached = (() => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || []; } catch { return []; } })();

  const [orgs,       setOrgs]      = useState(cached);
  const [loading,    setLoading]   = useState(cached.length === 0);
  const [refreshing, setRefreshing]= useState(false);
  const [loadError,  setLoadError] = useState(null);
  const [modal,      setModal]     = useState(null);
  const [selected,   setSelected]  = useState(null);
  const [form,       setForm]      = useState(emptyForm);
  const [saving,     setSaving]    = useState(false);
  const [toast,      setToast]     = useState(null);
  const [search,     setSearch]    = useState('');
  const [typeFilter, setTypeFilter]= useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [logoFile,   setLogoFile]  = useState(null);
  const [logoPreview,setLogoPreview] = useState(null);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(cached.length === 0);
    else setRefreshing(true);
    setLoadError(null);
    adminApi.getOrganizations()
      .then(r => {
        setOrgs(r.data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(r.data));
      })
      .catch(e => {
        if (cached.length === 0) setLoadError(e.response?.data?.message || 'تعذّر الاتصال بالخادم');
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => {
    if (cached.length > 0) load(true);
    else load(false);
  }, []);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const resetLogo = () => { setLogoFile(null); setLogoPreview(null); };

  const openAdd = () => { setForm(emptyForm); setSelected(null); resetLogo(); setModal('add'); };

  const openEdit = (o, e) => {
    e?.stopPropagation();
    setForm({ org_name: o.org_name, org_type: o.org_type, rep_name: o.rep_name, email: o.email, phone: o.phone, sector: o.sector === '—' ? '' : o.sector, password: '' });
    setSelected(o);
    resetLogo();
    setModal('edit');
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const openView   = (o)    => { setSelected(o); setModal('view'); };
  const openDelete = (o, e) => { e?.stopPropagation(); setSelected(o); setModal('delete'); };

  const handleSave = async () => {
    const required = modal === 'add'
      ? ['org_name', 'org_type', 'rep_name', 'email', 'phone', 'password']
      : ['org_name', 'rep_name', 'email', 'phone'];
    for (const k of required) {
      if (!form[k]?.trim()) { showToast('error', 'يرجى تعبئة جميع الحقول المطلوبة'); return; }
    }
    setSaving(true);
    try {
      let orgData;
      if (modal === 'add') {
        const res = await adminApi.createOrg(form);
        orgData = res.data;
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        const res = await adminApi.updateOrg(selected.id, payload);
        orgData = res.data;
      }

      // رفع الشعار إذا تم اختياره
      if (logoFile) {
        try {
          const logoRes = await adminApi.uploadOrgLogo(orgData.id, logoFile);
          orgData = logoRes.data;
        } catch {
          showToast('error', 'تم الحفظ لكن تعذّر رفع الشعار');
        }
      }

      if (modal === 'add') {
        const updated = [orgData, ...orgs];
        setOrgs(updated);
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        showToast('success', 'تم إضافة المنظمة بنجاح ✓');
      } else {
        const updated = orgs.map(x => x.id === orgData.id ? orgData : x);
        setOrgs(updated);
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        showToast('success', 'تم تحديث بيانات المنظمة ✓');
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
      await adminApi.deleteOrg(selected.id);
      const updated = orgs.filter(x => x.id !== selected.id);
      setOrgs(updated);
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      showToast('success', 'تم حذف المنظمة ✓');
      setModal(null);
    } catch {
      showToast('error', 'حدث خطأ في الحذف');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (o, e) => {
    e?.stopPropagation();
    const prev = [...orgs];
    const newStatus = o.is_active ? 'معلق' : (o.services_count > 0 ? 'نشط' : 'جديد');
    const updated = orgs.map(x => x.id === o.id ? { ...x, is_active: !x.is_active, status: newStatus } : x);
    setOrgs(updated);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    try {
      const res = await adminApi.toggleOrg(o.id);
      const final = orgs.map(x => x.id === o.id ? res.data : x);
      setOrgs(final);
      localStorage.setItem(CACHE_KEY, JSON.stringify(final));
      showToast('success', o.is_active ? 'تم تعليق المنظمة ✓' : 'تم تفعيل المنظمة ✓');
    } catch {
      setOrgs(prev);
      localStorage.setItem(CACHE_KEY, JSON.stringify(prev));
      showToast('error', 'تعذّر تغيير الحالة');
    }
  };

  // client-side filter
  const filtered = orgs.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.org_name.toLowerCase().includes(q) || o.rep_name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
    const matchType   = typeFilter === 'all' || o.org_type === typeFilter;
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'active'    && o.status !== 'معلق')
      || (statusFilter === 'suspended' && o.status === 'معلق');
    return matchSearch && matchType && matchStatus;
  });

  const selStyle = {
    padding: '9px 14px', borderRadius: 10,
    border: `1.5px solid ${C.grayBorder}`, fontSize: 13,
    fontFamily: "'Cairo', sans-serif", background: '#fff', cursor: 'pointer',
  };

  // ── loading / error states
  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
      <div style={{ fontSize: 15, color: C.teal, fontWeight: 600 }}>جاري تحميل المنظمات...</div>
    </div>
  );

  if (loadError) return (
    <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 12 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.red, marginBottom: 8 }}>فشل تحميل البيانات</div>
      <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>{loadError}</div>
      <button onClick={() => load(false)} style={{ padding: '10px 28px', background: C.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
        إعادة المحاولة
      </button>
    </div>
  );

  return (
    <div className="animate-in">
      <Toast toast={toast} />

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.tealDark }}>إدارة المنظمات</h2>
          {refreshing && (
            <span style={{ fontSize: 11, color: '#9ca3af', padding: '3px 10px', background: '#f3f4f6', borderRadius: 20 }}>
              ↻ تحديث...
            </span>
          )}
        </div>
        <button onClick={openAdd} style={{ padding: '10px 22px', background: C.orange, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
          + إضافة منظمة
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'إجمالي المنظمات', value: orgs.length,                             icon: '🏢', color: C.teal },
          { label: 'نشطة',            value: orgs.filter(o => o.status !== 'معلق').length, icon: '✅', color: C.green },
          { label: 'معلقة',           value: orgs.filter(o => o.status === 'معلق').length, icon: '⏸', color: C.red },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 26 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.gray }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filters ── */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.gray, pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث عن منظمة..."
              style={{ ...inp, paddingRight: 36 }}
            />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selStyle}>
            <option value="all">جميع الأنواع</option>
            {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selStyle}>
            <option value="all">جميع الحالات</option>
            <option value="active">نشط / جديد</option>
            <option value="suspended">معلق</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.gray }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{search || typeFilter !== 'all' || statusFilter !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا توجد منظمات بعد'}</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['المنظمة', 'النوع', 'القطاع', 'التسجيل', 'الخدمات', 'المستشار', 'الحالة', 'إجراءات'].map(h => (
                  <th key={h} style={{ padding: '11px 10px', background: C.grayLight, fontSize: 11, fontWeight: 700, color: C.gray, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr
                  key={o.id}
                  style={{ borderBottom: `1px solid ${C.grayLight}`, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                  onClick={() => openView(o)}
                >
                  <td style={{ padding: '11px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <OrgAvatar org={o} size={36} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark }}>{o.org_name}</div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{o.rep_name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '11px 10px', fontSize: 12, color: C.gray }}>{o.org_type}</td>
                  <td style={{ padding: '11px 10px', fontSize: 12, color: C.gray }}>{o.sector}</td>
                  <td style={{ padding: '11px 10px', fontSize: 12, color: C.gray, whiteSpace: 'nowrap' }}>{o.created_at}</td>
                  <td style={{ padding: '11px 10px', fontSize: 13, fontWeight: 700, color: C.tealDark, textAlign: 'center' }}>{o.services_count}</td>
                  <td style={{ padding: '11px 10px', fontSize: 12, color: C.gray, whiteSpace: 'nowrap' }}>{o.consultant}</td>
                  <td style={{ padding: '11px 10px' }}><Badge text={o.status} /></td>
                  <td style={{ padding: '11px 10px' }}>
                    <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openView(o)} style={btnStyle('#f0f9ff', C.teal, '#bae6fd')}>عرض</button>
                      <button onClick={e => openEdit(o, e)} style={btnStyle('#fff7ed', C.orange, '#fed7aa')}>تعديل</button>
                      <button onClick={e => handleToggle(o, e)} style={btnStyle(o.is_active ? '#fef2f2' : '#f0fdf4', o.is_active ? C.red : C.green, o.is_active ? '#fecaca' : '#86efac')}>
                        {o.is_active ? 'تعليق' : 'تفعيل'}
                      </button>
                      <button onClick={e => openDelete(o, e)} style={btnStyle('#fef2f2', C.red, '#fecaca')}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── View Modal ── */}
      {modal === 'view' && selected && (
        <Overlay onClose={() => setModal(null)} closeOnBackdrop>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.tealDark }}>تفاصيل المنظمة</h3>
              <button onClick={() => setModal(null)} style={closeBtn}>✕</button>
            </div>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '14px 16px', background: C.grayLight, borderRadius: 12 }}>
              <OrgAvatar org={selected} size={56} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.tealDark }}>{selected.org_name}</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{selected.org_type}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['اسم المنظمة',   selected.org_name],
                ['نوع المنظمة',   selected.org_type],
                ['ممثل المنظمة',  selected.rep_name],
                ['البريد الإلكتروني', selected.email],
                ['رقم الهاتف',    selected.phone],
                ['القطاع',        selected.sector],
                ['الخدمات المشتركة', selected.services_count],
                ['المستشار',      selected.consultant],
                ['تاريخ التسجيل', selected.created_at],
                ['الحالة',        <Badge key="s" text={selected.status} />],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.tealDark }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={e => { setModal(null); openEdit(selected, e); }} style={{ flex: 1, padding: '10px 0', background: C.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
                تعديل
              </button>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '10px 0', background: C.grayLight, color: C.gray, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
                إغلاق
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Add / Edit Modal ── */}
      {(modal === 'add' || modal === 'edit') && (
        <Overlay onClose={() => setModal(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.tealDark }}>
                {modal === 'add' ? 'إضافة منظمة جديدة' : 'تعديل بيانات المنظمة'}
              </h3>
              <button onClick={() => setModal(null)} style={closeBtn}>✕</button>
            </div>

            {/* ── Logo Upload ── */}
            <div style={{ marginBottom: 20, padding: '16px', background: C.grayLight, borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 12 }}>
                شعار المنظمة
                <span style={{ fontSize: 11, fontWeight: 400, color: C.gray, marginRight: 6 }}>(اختياري)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* معاينة الشعار */}
                <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.grayBorder}`, background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(logoPreview || (modal === 'edit' && selected?.logo_url)) ? (
                    <img
                      src={logoPreview || selected.logo_url}
                      alt="شعار"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <span style={{ color: '#fff', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                      {(form.org_name || '؟')[0]}
                    </span>
                  )}
                </div>
                {/* أزرار الرفع */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {logoFile ? (
                    <div style={{ fontSize: 11, color: C.green, fontWeight: 600, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      ✅ {logoFile.name}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 8 }}>
                      PNG / JPG / WebP — بحد أقصى 2 ميغابايت
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#fff', border: `1.5px solid ${C.grayBorder}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: C.tealDark, fontFamily: "'Cairo', sans-serif", flexShrink: 0 }}>
                      📁 {logoFile || (modal === 'edit' && selected?.logo_url) ? 'تغيير الشعار' : 'اختر شعاراً'}
                      <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                    </label>
                    {(logoFile || (modal === 'edit' && selected?.logo_url)) && (
                      <button
                        onClick={() => { resetLogo(); if (modal === 'edit') setSelected(p => ({ ...p, logo_url: null })); }}
                        style={{ padding: '7px 12px', background: '#fef2f2', color: C.red, border: `1px solid #fecaca`, borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", flexShrink: 0 }}
                      >
                        ✕ حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="اسم المنظمة *">
                <input value={form.org_name} onChange={e => setF('org_name', e.target.value)} placeholder="مثال: جمعية أثر" style={inp} />
              </Field>
              <Field label="نوع المنظمة *">
                <select value={form.org_type} onChange={e => setF('org_type', e.target.value)} style={inp}>
                  <option value="">-- اختر النوع --</option>
                  {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="ممثل المنظمة *">
                <input value={form.rep_name} onChange={e => setF('rep_name', e.target.value)} placeholder="الاسم الكامل" style={inp} />
              </Field>
              <Field label="القطاع">
                <input value={form.sector} onChange={e => setF('sector', e.target.value)} placeholder="مثال: تعليم، صحة، بيئة" style={inp} />
              </Field>
              <Field label="البريد الإلكتروني *">
                <input value={form.email} onChange={e => setF('email', e.target.value)} placeholder="example@org.com" type="email" style={inp} />
              </Field>
              <Field label="رقم الهاتف *">
                <input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="05xxxxxxxx" style={inp} />
              </Field>
              <Field label={modal === 'add' ? 'كلمة المرور *' : 'كلمة المرور (اتركها فارغة للإبقاء)'}>
                <input value={form.password} onChange={e => setF('password', e.target.value)} placeholder="••••••••" type="password" style={inp} />
              </Field>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 1, padding: '11px 0', background: saving ? '#9ca3af' : C.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Cairo', sans-serif" }}
              >
                {saving ? 'جاري الحفظ...' : modal === 'add' ? 'إضافة المنظمة' : 'حفظ التعديلات'}
              </button>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '11px 0', background: C.grayLight, color: C.gray, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
                إلغاء
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Delete Confirm Modal ── */}
      {modal === 'delete' && selected && (
        <Overlay onClose={() => setModal(null)} closeOnBackdrop>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.tealDark, marginBottom: 8 }}>حذف المنظمة</h3>
            <p style={{ fontSize: 13, color: C.gray, marginBottom: 24 }}>
              هل أنت متأكد من حذف <strong>{selected.org_name}</strong>؟<br />
              لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleDelete}
                disabled={saving}
                style={{ flex: 1, padding: '11px 0', background: saving ? '#9ca3af' : C.red, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Cairo', sans-serif" }}
              >
                {saving ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '11px 0', background: C.grayLight, color: C.gray, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
                إلغاء
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

const btnStyle = (bg, color, border) => ({
  padding: '6px 10px', background: bg, color, border: `1px solid ${border}`,
  borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
  fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap',
});

const closeBtn = {
  background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af',
};
