import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { adminApi } from '../../api/admin';

const C = {
  teal: '#1A6B7C', tealDark: '#14505E',
  orange: '#E8620A', orangeLight: '#FFF3ED',
  green: '#16A34A', greenLight: '#F0FDF4',
  red: '#DC2626', redLight: '#FEF2F2',
  gray: '#6B7280', grayLight: '#F3F4F6', grayBorder: '#E5E7EB',
  white: '#FFFFFF', dark: '#111827',
};

const fmt = (n) => Number(n).toLocaleString('en-US');

const SERVICE_META = {
  strategic_base:      { units: 11, group: 'main'  },
  operational_base:    { units: 5,  group: 'main'  },
  addon_certification: {            group: 'addon' },
  addon_design:        {            group: 'addon' },
  policy_arbitration:  {            group: 'addon' },
  policy_design:       {            group: 'addon' },
  tax_rate:            {            group: 'tax'   },
};

// ─── primitives ──────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === 'success' ? C.green : type === 'error' ? C.red : C.teal;
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', bottom: 24, left: 24, background: bg, color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,.2)', fontFamily: 'inherit' }}>
      {msg}
    </div>,
    document.body
  );
}

function Modal({ title, onClose, children }) {
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,.25)', direction: 'rtl', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: `1px solid ${C.grayBorder}` }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.tealDark, fontFamily: 'inherit' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.gray, fontFamily: 'inherit', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.tealDark, marginBottom: 6, fontFamily: 'inherit' }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = 'text', placeholder, min, step }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} step={step}
      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
    />
  );
}

function Btn({ children, onClick, variant = 'primary', small, disabled, style: s }) {
  const variants = {
    primary: { background: C.teal,      color: '#fff'     },
    danger:  { background: C.red,       color: '#fff'     },
    ghost:   { background: C.grayLight, color: C.tealDark },
    success: { background: C.green,     color: '#fff'     },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        padding: small ? '5px 13px' : '10px 20px',
        borderRadius: 8, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: small ? 13 : 14,
        fontWeight: 600,
        fontFamily: 'inherit',
        opacity: disabled ? 0.55 : 1,
        lineHeight: 1.4,
        ...variants[variant], ...s,
      }}
    >
      {children}
    </button>
  );
}

function Badge({ text, color }) {
  const map = {
    green:  [C.greenLight,  C.green],
    red:    [C.redLight,    C.red],
    gray:   [C.grayLight,   C.gray],
    orange: [C.orangeLight, C.orange],
  };
  const [bg, fg] = map[color] || map.gray;
  return (
    <span style={{ background: bg, color: fg, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
      {text}
    </span>
  );
}

function Section({ title, action, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.tealDark, margin: 0, fontFamily: 'inherit' }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Edit Setting Modal ───────────────────────────────────────────────────────

function EditSettingModal({ setting, onClose, onSaved }) {
  const [value,    setValue]    = useState(String(setting.value));
  const [isActive, setIsActive] = useState(setting.is_active);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');

  const save = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) { setErr('أدخل قيمة صحيحة'); return; }
    setSaving(true); setErr('');
    try {
      const res = await adminApi.updateSetting(setting.key, { value: num, is_active: isActive });
      onSaved(res.data); onClose();
    } catch { setErr('حدث خطأ، حاول مجدداً'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`تعديل: ${setting.label}`} onClose={onClose}>
      <Field label={`القيمة (${setting.unit})`}>
        <Input type="number" value={value} onChange={e => setValue(e.target.value)} min="0" step={setting.unit === '%' ? '0.5' : '50'} />
      </Field>
      <Field label="الحالة">
        <div style={{ display: 'flex', gap: 10 }}>
          {[true, false].map(v => (
            <label key={String(v)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${isActive === v ? C.teal : C.grayBorder}`, background: isActive === v ? '#E8F4F6' : C.white }}>
              <input type="radio" checked={isActive === v} onChange={() => setIsActive(v)} style={{ accentColor: C.teal }} />
              {v ? 'مفعّل' : 'معطّل'}
            </label>
          ))}
        </div>
      </Field>
      {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 10, fontFamily: 'inherit' }}>{err}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        <Btn onClick={save} disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</Btn>
      </div>
    </Modal>
  );
}

// ─── Discount Modal ───────────────────────────────────────────────────────────

const emptyDiscount = { code: '', type: 'percentage', value: '', expires_at: '', max_uses: '', is_active: true };

function DiscountModal({ discount, onClose, onSaved }) {
  const isEdit = !!discount?.id;
  const [form,   setForm]   = useState(isEdit
    ? { ...discount, value: String(discount.value), expires_at: discount.expires_at || '', max_uses: discount.max_uses || '' }
    : emptyDiscount);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.code.trim())                         { setErr('أدخل كود الخصم');  return; }
    if (!form.value || parseFloat(form.value) <= 0){ setErr('أدخل قيمة صحيحة'); return; }
    setSaving(true); setErr('');
    const payload = {
      code:       form.code.toUpperCase().trim(),
      type:       form.type,
      value:      parseFloat(form.value),
      expires_at: form.expires_at || null,
      max_uses:   form.max_uses ? parseInt(form.max_uses) : null,
      is_active:  form.is_active,
    };
    try {
      const res = isEdit ? await adminApi.updateDiscount(discount.id, payload) : await adminApi.createDiscount(payload);
      onSaved(res.data, isEdit); onClose();
    } catch (e) { setErr(e?.response?.data?.message || 'حدث خطأ، حاول مجدداً'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={isEdit ? 'تعديل كود الخصم' : 'إضافة كود خصم'} onClose={onClose}>
      <Field label="كود الخصم">
        <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="مثال: SUMMER20" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="نوع الخصم">
          <select value={form.type} onChange={e => set('type', e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: 'inherit' }}>
            <option value="percentage">نسبة مئوية %</option>
            <option value="fixed">مبلغ ثابت ريال</option>
          </select>
        </Field>
        <Field label={form.type === 'percentage' ? 'النسبة (%)' : 'المبلغ (ريال)'}>
          <Input type="number" value={form.value} onChange={e => set('value', e.target.value)} min="0" step={form.type === 'percentage' ? '1' : '100'} />
        </Field>
        <Field label="تاريخ الانتهاء (اختياري)">
          <Input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} />
        </Field>
        <Field label="الحد الأقصى للاستخدام (اختياري)">
          <Input type="number" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} min="1" placeholder="غير محدود" />
        </Field>
      </div>
      {isEdit && (
        <Field label="الحالة">
          <div style={{ display: 'flex', gap: 10 }}>
            {[true, false].map(v => (
              <label key={String(v)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${form.is_active === v ? C.teal : C.grayBorder}`, background: form.is_active === v ? '#E8F4F6' : C.white }}>
                <input type="radio" checked={form.is_active === v} onChange={() => set('is_active', v)} style={{ accentColor: C.teal }} />
                {v ? 'نشط' : 'معطّل'}
              </label>
            ))}
          </div>
        </Field>
      )}
      {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 10, fontFamily: 'inherit' }}>{err}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        <Btn onClick={save} disabled={saving}>{saving ? 'جارٍ الحفظ...' : (isEdit ? 'حفظ التعديلات' : 'إضافة')}</Btn>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminServices() {
  const [settings,     setSettings]     = useState([]);
  const [discounts,    setDiscounts]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState(null);
  const [editSetting,  setEditSetting]  = useState(null);
  const [editDiscount, setEditDiscount] = useState(null);
  const [delConfirm,   setDelConfirm]   = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([adminApi.getSettings(), adminApi.getDiscounts()]);
      setSettings(s.data);
      setDiscounts(d.data);
    } catch { showToast('فشل تحميل البيانات', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSettingSaved = (updated) => {
    setSettings(prev => prev.map(s => s.key === updated.key ? updated : s));
    showToast('تم حفظ الإعداد بنجاح');
  };

  const onDiscountSaved = (saved, isEdit) => {
    setDiscounts(prev => isEdit ? prev.map(d => d.id === saved.id ? saved : d) : [...prev, saved]);
    showToast(isEdit ? 'تم تعديل كود الخصم' : 'تمت إضافة كود الخصم');
  };

  const toggleDiscount = async (id) => {
    try {
      const res = await adminApi.toggleDiscount(id);
      setDiscounts(prev => prev.map(d => d.id === id ? res.data : d));
    } catch { showToast('فشل تغيير الحالة', 'error'); }
  };

  const deleteDiscount = async (id) => {
    try {
      await adminApi.deleteDiscount(id);
      setDiscounts(prev => prev.filter(d => d.id !== id));
      setDelConfirm(null);
      showToast('تم حذف كود الخصم');
    } catch { showToast('فشل الحذف', 'error'); }
  };

  const mainSettings  = settings.filter(s => SERVICE_META[s.key]?.group === 'main');
  const addonSettings = settings.filter(s => SERVICE_META[s.key]?.group === 'addon');
  const taxSetting    = settings.find(s => s.key === 'tax_rate');

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: C.gray, fontSize: 13, direction: 'rtl', fontFamily: 'inherit' }}>جارٍ التحميل...</div>;
  }

  return (
    <div style={{ direction: 'rtl', padding: '0 4px', fontFamily: 'inherit' }}>
      {toast        && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {editSetting  && <EditSettingModal setting={editSetting}  onClose={() => setEditSetting(null)}  onSaved={onSettingSaved} />}
      {editDiscount !== null && <DiscountModal discount={editDiscount?.id ? editDiscount : undefined} onClose={() => setEditDiscount(null)} onSaved={onDiscountSaved} />}

      {delConfirm && (
        <Modal title="تأكيد الحذف" onClose={() => setDelConfirm(null)}>
          <p style={{ fontSize: 13, color: C.dark, marginBottom: 20, fontFamily: 'inherit' }}>هل أنت متأكد من حذف كود <strong>{delConfirm.code}</strong>؟</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setDelConfirm(null)}>إلغاء</Btn>
            <Btn variant="danger" onClick={() => deleteDiscount(delConfirm.id)}>حذف</Btn>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.tealDark, margin: 0, fontFamily: 'inherit' }}>إدارة الخدمات والتسعير</h2>
        {taxSetting && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.grayLight, padding: '8px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: 13, color: C.gray, fontFamily: 'inherit' }}>نسبة الضريبة:</span>
            <strong style={{ fontSize: 14, color: C.tealDark, fontFamily: 'inherit' }}>{taxSetting.value}%</strong>
            <Btn small variant="ghost" onClick={() => setEditSetting(taxSetting)}>✏️ تعديل</Btn>
          </div>
        )}
      </div>

      {/* الخدمات الأساسية */}
      <Section title="الخدمات الأساسية">
        {mainSettings.map(s => {
          const meta = SERVICE_META[s.key] || {};
          return (
            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', background: C.white, borderRadius: 12, marginBottom: 10, border: `1.5px solid ${s.is_active ? C.teal + '44' : C.grayBorder}`, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.tealDark, fontFamily: 'inherit' }}>{s.label}</div>
                <div style={{ fontSize: 13, color: C.gray, marginTop: 3, fontFamily: 'inherit' }}>
                  {meta.units && <span>{meta.units} وحدات  •  </span>}
                  <span style={{ color: C.teal, fontWeight: 600 }}>{fmt(s.value)} ريال</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge text={s.is_active ? 'مفعّل' : 'معطّل'} color={s.is_active ? 'green' : 'gray'} />
                <Btn small variant="ghost" onClick={() => setEditSetting(s)}>✏️ تعديل</Btn>
              </div>
            </div>
          );
        })}
      </Section>

      {/* الخدمات الإضافية */}
      <Section title="الخدمات الإضافية">
        <div style={{ background: C.white, borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, overflow: 'hidden' }}>
          {addonSettings.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: i < addonSettings.length - 1 ? `1px solid ${C.grayBorder}` : 'none' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.tealDark, fontFamily: 'inherit' }}>{s.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Badge text={s.is_active ? 'مفعّل' : 'معطّل'} color={s.is_active ? 'green' : 'gray'} />
                <span style={{ fontWeight: 700, color: C.teal, fontSize: 14, fontFamily: 'inherit', minWidth: 90, textAlign: 'left' }}>{fmt(s.value)} ريال</span>
                <Btn small variant="ghost" onClick={() => setEditSetting(s)}>✏️ تعديل</Btn>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* أكواد الخصم */}
      <Section title="أكواد الخصم" action={<Btn small onClick={() => setEditDiscount({})}>+ إضافة كود</Btn>}>
        {discounts.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: C.gray, fontSize: 13, fontFamily: 'inherit' }}>لا توجد أكواد خصم</div>
        ) : (
          <div style={{ background: C.white, borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: 10, padding: '10px 18px', background: C.grayLight, fontSize: 12, fontWeight: 700, color: C.gray, fontFamily: 'inherit' }}>
              <span>الكود</span><span>الخصم</span><span>الانتهاء</span><span>الاستخدام</span><span>الإجراءات</span>
            </div>
            {discounts.map((d, i) => {
              const expired     = d.expires_at && new Date(d.expires_at) < new Date();
              const maxed       = d.max_uses && d.used_count >= d.max_uses;
              const statusColor = (!d.is_active || expired || maxed) ? 'gray' : 'green';
              const statusText  = !d.is_active ? 'معطّل' : expired ? 'منتهي' : maxed ? 'مستنفد' : 'نشط';
              return (
                <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: 10, padding: '12px 18px', alignItems: 'center', borderTop: i > 0 ? `1px solid ${C.grayBorder}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.tealDark, fontFamily: 'inherit', letterSpacing: '0.04em' }}>{d.code}</span>
                    <Badge text={statusText} color={statusColor} />
                  </div>
                  <span style={{ fontSize: 13, color: C.dark, fontFamily: 'inherit' }}>
                    {d.type === 'percentage' ? `${d.value}%` : `${fmt(d.value)} ريال`}
                  </span>
                  <span style={{ fontSize: 13, color: expired ? C.red : C.gray, fontFamily: 'inherit' }}>
                    {d.expires_at ? new Date(d.expires_at).toLocaleDateString('en-US') : '—'}
                  </span>
                  <span style={{ fontSize: 13, color: C.gray, fontFamily: 'inherit' }}>
                    {d.used_count}{d.max_uses ? ` / ${d.max_uses}` : ''}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn small variant="ghost"   onClick={() => setEditDiscount(d)}>✏️ تعديل</Btn>
                    <Btn small variant={d.is_active ? 'ghost' : 'success'} onClick={() => toggleDiscount(d.id)}>
                      {d.is_active ? 'تعطيل' : 'تفعيل'}
                    </Btn>
                    <Btn small variant="danger"  onClick={() => setDelConfirm(d)}>🗑️ حذف</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
