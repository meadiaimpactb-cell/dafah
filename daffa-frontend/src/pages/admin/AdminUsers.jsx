import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api/axios';
import { adminApi } from '../../api/admin';
import { PERMISSIONS_BY_ROLE, getAllPermKeys, syncPermissionsToStorage, usePermissions } from '../../utils/permissions';

const C = {
  teal: '#1A6B7C', tealDark: '#14505E', tealLight: '#E8F4F6',
  orange: '#E8620A', green: '#16a34a', red: '#dc2626',
  gray: '#6B7280', grayLight: '#F3F4F6', grayBorder: '#E5E7EB',
};

const CACHE_KEY = 'admin_users_cache';
function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || []; } catch { return []; }
}
function writeCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

const ROLES = [
  { key: 'all',        label: 'الكل' },
  { key: 'admin',      label: 'المدراء' },
  { key: 'consultant', label: 'المستشارين' },
  { key: 'client',     label: 'العملاء' },
];

const ROLE_META = {
  admin:      { label: 'مدير نظام', bg: '#FEF3C7', color: '#D97706' },
  consultant: { label: 'مستشار',    bg: C.tealLight, color: C.teal },
  client:     { label: 'عميل',      bg: '#EFF6FF',  color: '#1D4ED8' },
};


// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) =>
  toast ? ReactDOM.createPortal(
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9999999, padding: '12px 24px', borderRadius: 12, background: toast.type === 'success' ? '#065f46' : '#7f1d1d', color: 'white', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
      {toast.msg}
    </div>, document.body
  ) : null;

// ── Confirm Delete Modal ───────────────────────────────────────────────────────
const ConfirmDelete = ({ user, onConfirm, onCancel }) =>
  ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 420, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', animation: 'modalIn 0.22s ease-out both' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px', background: '#FEF2F2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 26, color: C.red, fontWeight: 700 }}>!</span></div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.tealDark, marginBottom: 8 }}>حذف المستخدم</div>
        <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.8, marginBottom: 24 }}>
          هل أنت متأكد من حذف <strong style={{ color: C.red }}>{user?.name}</strong>؟<br />لا يمكن التراجع عن هذا الإجراء.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, background: 'white', color: C.gray, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>إلغاء</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: C.red, color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>نعم، حذف</button>
        </div>
      </div>
    </div>, document.body
  );

// ── Permissions Modal (action-level granularity) ──────────────────────────────
const PermissionsModal = ({ user, onClose, onSaved }) => {
  const modules = PERMISSIONS_BY_ROLE[user.role] || [];
  const allKeys = getAllPermKeys(user.role);
  const rm      = ROLE_META[user.role] || ROLE_META.client;

  const [selected, setSelected] = useState(() => {
    // Filter old-format keys (e.g. 'admin.users') — only keep 3-part keys (e.g. 'admin.users.edit')
    const stored = (Array.isArray(user.permissions) ? user.permissions : [])
      .filter(k => typeof k === 'string' && k.split('.').length >= 3 && allKeys.includes(k));
    if (stored.length === 0) return new Set(allKeys); // empty or old-format → full access
    return new Set(stored);
  });
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  const toggleKey = (key) => setSelected(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const toggleModule = (mod) => {
    const keys = mod.actions.map(a => `${mod.module}.${a.key}`);
    const allOn = keys.every(k => selected.has(k));
    setSelected(prev => {
      const next = new Set(prev);
      keys.forEach(k => allOn ? next.delete(k) : next.add(k));
      return next;
    });
  };

  const moduleStatus = (mod) => {
    const keys = mod.actions.map(a => `${mod.module}.${a.key}`);
    const count = keys.filter(k => selected.has(k)).length;
    if (count === 0) return 'none';
    if (count === keys.length) return 'all';
    return 'partial';
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await adminApi.updateUserPermissions(user.id, [...selected]);
      syncPermissionsToStorage(user.id, res.data.permissions);
      onSaved(res.data);
    } catch {
      setSaveError('حدث خطأ أثناء الحفظ، حاول مجدداً');
      setSaving(false);
    }
  };

  const totalSelected = selected.size;
  const isFullAccess  = totalSelected === allKeys.length;
  const isNone        = totalSelected === 0;

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 28, width: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'modalIn 0.22s ease-out both' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.tealDark }}>🔐 إدارة الصلاحيات</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.tealDark }}>{user.name}</span>
              <span style={{ background: rm.bg, color: rm.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{rm.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: C.grayLight, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>✕</button>
        </div>

        {modules.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.gray }}>لا توجد صلاحيات لهذا الدور</div>
        ) : (
          <>
            {/* Status + global actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderRadius: 10, marginBottom: 14, background: isFullAccess ? '#F0FDF4' : isNone ? '#FEF2F2' : '#FEF9C3', border: `1px solid ${isFullAccess ? '#bbf7d0' : isNone ? '#fecaca' : '#fde68a'}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'inherit', color: isFullAccess ? C.green : isNone ? C.red : '#92400e' }}>
                {isFullAccess ? 'وصول كامل' : isNone ? 'بدون أي صلاحية' : `${totalSelected} من ${allKeys.length} صلاحية مفعّلة`}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setSelected(new Set(allKeys))} style={{ padding: '4px 13px', borderRadius: 7, border: `1.5px solid ${C.teal}`, background: 'white', color: C.teal, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>منح الكل</button>
                <button onClick={() => setSelected(new Set())} style={{ padding: '4px 13px', borderRadius: 7, border: `1.5px solid ${C.grayBorder}`, background: 'white', color: C.gray, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>سحب الكل</button>
              </div>
            </div>

            {/* Module cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modules.map(mod => {
                const status  = moduleStatus(mod);
                const modKeys = mod.actions.map(a => `${mod.module}.${a.key}`);
                const borderColor = status === 'all' ? C.teal : status === 'partial' ? '#f59e0b' : C.grayBorder;
                const bgColor     = status === 'all' ? `${C.teal}07` : status === 'partial' ? '#fffbeb' : 'white';
                return (
                  <div key={mod.module} style={{ borderRadius: 12, border: `1.5px solid ${borderColor}`, background: bgColor, overflow: 'hidden' }}>
                    {/* Module header */}
                    <div onClick={() => toggleModule(mod)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', userSelect: 'none' }}>
                      {/* Module checkbox */}
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${status === 'all' ? C.teal : status === 'partial' ? '#f59e0b' : C.grayBorder}`, background: status === 'all' ? C.teal : status === 'partial' ? '#f59e0b' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {status === 'all'     && <span style={{ color: 'white', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                        {status === 'partial' && <span style={{ color: 'white', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>−</span>}
                      </div>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{mod.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, flex: 1 }}>{mod.label}</span>
                      <span style={{ fontSize: 10, color: C.gray, flexShrink: 0 }}>
                        {modKeys.filter(k => selected.has(k)).length}/{modKeys.length}
                      </span>
                    </div>
                    {/* Actions grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, padding: '0 14px 12px' }}>
                      {mod.actions.map(action => {
                        const key    = `${mod.module}.${action.key}`;
                        const active = selected.has(key);
                        return (
                          <div key={key} onClick={() => toggleKey(key)}
                            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${active ? C.teal : C.grayBorder}`, background: active ? `${C.teal}10` : '#fafafa', cursor: 'pointer', userSelect: 'none', transition: 'all 0.12s' }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${active ? C.teal : C.grayBorder}`, background: active ? C.teal : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {active && <span style={{ color: 'white', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: active ? C.tealDark : C.gray, lineHeight: 1.3 }}>{action.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {saveError && <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', color: C.red, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>{saveError}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, background: 'white', color: C.gray, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>إلغاء</button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: '11px 0', borderRadius: 12, border: 'none', background: saving ? C.grayLight : C.teal, color: saving ? C.gray : 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : `0 4px 14px ${C.teal}40` }}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ الصلاحيات'}
          </button>
        </div>
      </div>
    </div>, document.body
  );
};

// ── User Form Modal ────────────────────────────────────────────────────────────
const UserModal = ({ mode, user, onClose, onSaved }) => {
  const isEdit = mode === 'edit';
  const [form, setForm]           = useState({
    rep_name: user?.rep_name || '',
    email:    user?.email    || '',
    phone:    user?.phone    || '',
    org_name: user?.org_name || '',
    role:     user?.role     || 'client',
    password: '',
  });
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});
  const [formError,     setFormError]     = useState(null);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      let res;
      if (isEdit) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        res = await api.put(`/admin/users/${user.id}`, payload);
      } else {
        res = await api.post('/admin/users', form);
      }
      let savedUser = res.data;

      if (avatarFile) {
        const uploadRes = await adminApi.uploadUserAvatar(savedUser.id, avatarFile);
        savedUser = uploadRes.data;
      }

      onSaved(savedUser, isEdit);
    } catch (err) {
      if (err.response?.status === 422) {
        const errs = err.response.data.errors || {};
        setErrors(errs);
        const first = Object.values(errs)[0]?.[0];
        if (first) setFormError(first);
      } else {
        setFormError(err.response?.data?.message || 'حدث خطأ، حاول مجدداً');
      }
      setSaving(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder, required }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.tealDark }}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>
      <input
        type={type} name={name} value={form[name]} onChange={handleChange}
        placeholder={placeholder || label}
        style={{ padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${errors[name] ? C.red : C.grayBorder}`, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        onFocus={e => e.target.style.borderColor = C.teal}
        onBlur={e => e.target.style.borderColor = errors[name] ? C.red : C.grayBorder}
      />
      {errors[name] && <div style={{ fontSize: 11, color: C.red }}>• {errors[name][0]}</div>}
    </div>
  );

  const previewSrc = avatarPreview || user?.avatar_url || null;
  const initials   = (form.rep_name || '?')[0];

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'modalIn 0.22s ease-out both' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.tealDark }}>{isEdit ? '✏️ تعديل المستخدم' : '➕ إضافة مستخدم جديد'}</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: C.grayLight, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {formError && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: `1px solid #fecaca`, color: C.red, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
            ⚠️ {formError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Avatar upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.tealDark }}>الصورة الشخصية (اختياري)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 64, height: 64, minWidth: 64, minHeight: 64, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.grayBorder}`, background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {previewSrc ? (
                  <img src={previewSrc} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <span style={{ color: '#fff', fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{initials}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${C.grayBorder}`, background: 'white', color: C.teal, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                  {previewSrc ? 'تغيير الصورة' : 'اختر صورة'}
                </button>
                {avatarFile && (
                  <div style={{ marginTop: 4, fontSize: 12, color: C.gray, fontFamily: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{avatarFile.name}</div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="الاسم الكامل" name="rep_name" required />
            <Field label="البريد الإلكتروني" name="email" type="email" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="رقم الجوال" name="phone" type="tel" placeholder="05xxxxxxxx" />
            <Field label="اسم المنظمة" name="org_name" placeholder="اختياري للمستشار/المدير" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.tealDark }}>الدور <span style={{ color: C.red }}>*</span></label>
            <select name="role" value={form.role} onChange={handleChange}
              style={{ padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'white' }}>
              <option value="client">عميل</option>
              <option value="consultant">مستشار</option>
              <option value="admin">مدير نظام</option>
            </select>
          </div>

          <Field
            label={isEdit ? 'كلمة مرور جديدة (اتركها فارغة إن لم تريد التغيير)' : 'كلمة المرور'}
            name="password"
            type="password"
            placeholder="••••••••"
            required={!isEdit}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, background: 'white', color: C.gray, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>إلغاء</button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex: 2, padding: '11px 0', borderRadius: 12, border: 'none', background: saving ? C.grayLight : C.teal, color: saving ? C.gray : 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : `0 4px 14px ${C.teal}40` }}>
            {saving ? 'جارٍ الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إضافة المستخدم')}
          </button>
        </div>
      </div>
    </div>, document.body
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const cached                         = readCache();
  const [users,        setUsers]       = useState(cached);
  const [loading,      setLoading]     = useState(cached.length === 0);
  const [error,        setError]       = useState(null);
  const [roleFilter,   setRoleFilter]  = useState('all');
  const [search,       setSearch]      = useState('');
  const [modal,           setModal]          = useState(null); // null | {mode:'add'} | {mode:'edit', user}
  const [deleteUser,      setDeleteUser]     = useState(null);
  const [permissionsUser, setPermissionsUser] = useState(null);
  const [toast,           setToast]          = useState(null);
  const { can } = usePermissions();
  const searchTimer                    = useRef(null);
  const skipRoleEffect                 = useRef(true);
  const skipSearchEffect               = useRef(true);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/users', { params: { role: roleFilter !== 'all' ? roleFilter : undefined, search: search || undefined } });
      setUsers(res.data);
      if (roleFilter === 'all' && !search) writeCache(res.data);
    } catch (e) {
      if (!silent || users.length === 0) setError(e.response?.data?.message || 'تعذّر التحميل');
    } finally {
      setLoading(false);
    }
  };

  // Mount: show spinner only if no cached data, otherwise refresh silently
  useEffect(() => {
    load(cached.length > 0);
  }, []);

  // roleFilter change (skip mount — handled above)
  useEffect(() => {
    if (skipRoleEffect.current) { skipRoleEffect.current = false; return; }
    load(true);
  }, [roleFilter]);

  // search change with debounce (skip mount)
  useEffect(() => {
    if (skipSearchEffect.current) { skipSearchEffect.current = false; return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(true), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const handleToggle = async (user) => {
    try {
      const res = await api.post(`/admin/users/${user.id}/toggle`);
      setUsers(prev => prev.map(u => u.id === user.id ? res.data : u));
      showToast('success', res.data.is_active ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب');
    } catch {
      showToast('error', 'فشل تغيير الحالة');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${deleteUser.id}`);
      setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
      showToast('success', 'تم حذف المستخدم بنجاح');
    } catch (e) {
      showToast('error', e.response?.data?.message || 'فشل الحذف');
    } finally {
      setDeleteUser(null);
    }
  };

  const handleSaved = (savedUser, isEdit) => {
    if (isEdit) {
      setUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u));
      showToast('success', 'تم تحديث بيانات المستخدم');
    } else {
      setUsers(prev => [savedUser, ...prev]);
      showToast('success', 'تم إضافة المستخدم بنجاح');
    }
    setModal(null);
  };

  const counts = {
    all:        users.length,
    admin:      users.filter(u => u.role === 'admin').length,
    consultant: users.filter(u => u.role === 'consultant').length,
    client:     users.filter(u => u.role === 'client').length,
  };

  return (
    <div className="animate-in">
      <Toast toast={toast} />
      {modal && <UserModal mode={modal.mode} user={modal.user} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {deleteUser && <ConfirmDelete user={deleteUser} onConfirm={handleDelete} onCancel={() => setDeleteUser(null)} />}
      {permissionsUser && (
        <PermissionsModal
          user={permissionsUser}
          onClose={() => setPermissionsUser(null)}
          onSaved={(updated) => {
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            setPermissionsUser(null);
            showToast('success', 'تم حفظ الصلاحيات بنجاح');
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.tealDark, margin: 0 }}>إدارة المستخدمين</h2>
        {can('admin.users.add') && (
          <button onClick={() => setModal({ mode: 'add' })}
            style={{ padding: '9px 20px', borderRadius: 12, border: 'none', background: C.orange, color: 'white', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 3px 10px ${C.orange}40` }}>
            + إضافة مستخدم
          </button>
        )}
      </div>

      {/* Tabs + Search */}
      <div style={{ background: 'white', borderRadius: 14, padding: '14px 18px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: C.grayLight, borderRadius: 12, padding: 3 }}>
          {ROLES.map(r => (
            <button key={r.key} onClick={() => setRoleFilter(r.key)}
              style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: roleFilter === r.key ? 'white' : 'transparent', color: roleFilter === r.key ? C.teal : C.gray, fontWeight: roleFilter === r.key ? 700 : 400, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s', boxShadow: roleFilter === r.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap' }}>
              {r.label}
              <span style={{ marginRight: 4, padding: '0 6px', borderRadius: 10, background: roleFilter === r.key ? `${C.teal}15` : 'transparent', color: roleFilter === r.key ? C.teal : C.gray, fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                {counts[r.key] || 0}
              </span>
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الإيميل..."
            style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 240 }}
            onFocus={e => e.target.style.borderColor = C.teal}
            onBlur={e => e.target.style.borderColor = C.grayBorder}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: C.gray, fontFamily: 'inherit', fontSize: 13 }}>جارٍ التحميل...</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.red, fontFamily: 'inherit', fontSize: 13 }}>{error} <button onClick={() => load(false)} style={{ marginRight: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: C.teal, color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>إعادة المحاولة</button></div>
        ) : users.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: C.gray }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>👤</div>
            <div style={{ fontSize: 14 }}>{search ? 'لا توجد نتائج للبحث' : 'لا يوجد مستخدمون'}</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['المستخدم', 'البريد الإلكتروني', 'الدور', 'الجوال', 'تاريخ الإنشاء', 'الحالة', 'إجراءات'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', background: C.grayLight, fontSize: 11, fontWeight: 700, color: C.gray, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const rm = ROLE_META[u.role] || ROLE_META.client;
                  return (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${C.grayBorder}`, background: i % 2 === 0 ? 'white' : '#FAFAFA', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = `${C.teal}05`}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#FAFAFA'}
                    >
                      {/* Avatar + Name */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, borderRadius: '50%', overflow: 'hidden', background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${C.grayBorder}` }}>
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            ) : (
                              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{u.avatar}</span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.tealDark }}>{u.name}</div>
                            {u.org_name && u.org_name !== u.rep_name && (
                              <div style={{ fontSize: 11, color: C.gray }}>{u.org_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: C.gray }}>{u.email}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: rm.bg, color: rm.color }}>{rm.label}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: C.gray }}>{u.phone || '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: C.gray, whiteSpace: 'nowrap' }}>{u.created_at}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {can('admin.users.toggle') ? (
                          <button onClick={() => handleToggle(u)}
                            style={{ padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', border: 'none', cursor: 'pointer', background: u.is_active ? '#F0FDF4' : '#FEF2F2', color: u.is_active ? C.green : C.red, transition: 'all 0.2s' }}>
                            {u.is_active ? 'نشط' : 'معلق'}
                          </button>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: u.is_active ? '#F0FDF4' : '#FEF2F2', color: u.is_active ? C.green : C.red }}>
                            {u.is_active ? 'نشط' : 'معلق'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {can('admin.users.edit') && (
                            <button onClick={() => setModal({ mode: 'edit', user: u })}
                              style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${C.grayBorder}`, background: 'white', color: C.teal, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                              ✏️ تعديل
                            </button>
                          )}
                          {can('admin.users.permissions') && (() => {
                            const total   = getAllPermKeys(u.role).length;
                            const stored  = Array.isArray(u.permissions) ? u.permissions : [];
                            const granted = stored.length === 0 ? total : stored.length;
                            const full    = granted === total;
                            return (
                              <button onClick={() => setPermissionsUser(u)}
                                style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${full ? '#bbf7d0' : '#fde68a'}`, background: full ? '#F0FDF4' : '#FFFBEB', color: full ? C.green : '#92400e', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                🔐 {full ? 'كامل' : `${granted}/${total}`}
                              </button>
                            );
                          })()}
                          {can('admin.users.delete') && (
                            <button onClick={() => setDeleteUser(u)}
                              style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid #fecaca`, background: '#FEF2F2', color: C.red, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Footer count */}
        {!loading && users.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.grayBorder}`, fontSize: 13, color: C.gray, textAlign: 'center', fontFamily: 'inherit' }}>
            إجمالي: {users.length} مستخدم
          </div>
        )}
      </div>
    </div>
  );
}
