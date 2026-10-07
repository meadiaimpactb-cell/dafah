import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { adminApi } from '../../api/admin';

const C = {
  teal: '#1A6B7C', tealDark: '#14505E', tealLight: '#E8F4F6',
  green: '#16A34A', greenLight: '#F0FDF4',
  orange: '#E8620A', orangeLight: '#FFF7ED',
  gray: '#6B7280', grayLight: '#F3F4F6', grayBorder: '#E5E7EB',
  red: '#DC2626',
  white: '#FFFFFF', dark: '#111827',
};

const TABS = [
  { key: 'strategic',   label: 'التخطيط الاستراتيجي',  count: 11 },
  { key: 'operational', label: 'التخطيط التشغيلي',      count: 5  },
  { key: 'policies',    label: 'السياسات واللوائح',     count: 7  },
];

// Content fields with their sections and labels
const CONTENT_FIELDS = [
  { key: 'overview',            label: 'نبذة',    section: 'content' },
  { key: 'written_description', label: 'شرح',     section: 'content' },
  { key: 'tip',                 label: 'إرشادات', section: 'content' },
  { key: 'video_url',           label: 'فيديو',   section: 'content' },
];

// ─── Primitives ──────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === 'success' ? C.green : C.red;
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', bottom: 24, left: 24, background: bg, color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
      {msg}
    </div>,
    document.body
  );
}

function Modal({ title, subtitle, onClose, children, wide }) {
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 16, width: '100%', maxWidth: wide ? 680 : 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,.25)', direction: 'rtl', fontFamily: 'inherit' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.grayBorder}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.tealDark, fontFamily: 'inherit' }}>{title}</div>
              {subtitle && <div style={{ fontSize: 12, color: C.gray, marginTop: 3, fontFamily: 'inherit' }}>{subtitle}</div>}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.gray, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
          </div>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

function Btn({ children, onClick, variant = 'primary', small, disabled }) {
  const v = {
    primary: { background: C.teal,      color: '#fff'     },
    ghost:   { background: C.grayLight, color: C.tealDark },
    danger:  { background: C.red,       color: '#fff'     },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ padding: small ? '5px 13px' : '10px 22px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', opacity: disabled ? .55 : 1, lineHeight: 1.4, ...v[variant] }}>
      {children}
    </button>
  );
}

// Clickable badge — filled=green, empty=gray, always clickable
function ContentBadge({ filled, label, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
        background: filled
          ? (hover ? '#15803d' : C.greenLight)
          : (hover ? C.teal : C.grayLight),
        color: filled
          ? (hover ? '#fff' : C.green)
          : (hover ? '#fff' : C.gray),
        border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        transition: 'all .15s',
      }}
    >
      {filled ? '✓' : '+'} {label}
    </button>
  );
}

// Clickable name badge for identity section
function NameBadge({ onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
        background: hover ? C.teal : C.tealLight,
        color: hover ? '#fff' : C.tealDark,
        border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        transition: 'all .15s',
      }}
    >
      ✏️ الاسم
    </button>
  );
}

// ─── Field component with forwarded ref ───────────────────────────────────────

const FieldRef = React.forwardRef(function Field({ label, fkey, form, set, rows, placeholder, type = 'text', suffix, highlight }, ref) {
  return (
    <div
      ref={ref}
      style={{
        marginBottom: 16,
        borderRadius: 10,
        padding: highlight ? '10px 12px' : '0',
        background: highlight ? C.tealLight : 'transparent',
        transition: 'background .3s',
      }}
    >
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 6, fontFamily: 'inherit' }}>{label}</label>
      {rows ? (
        <textarea
          value={form[fkey] || ''}
          onChange={e => set(fkey, e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${highlight ? C.teal : C.grayBorder}`, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6, transition: 'border .3s' }}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type={type}
            value={form[fkey] || ''}
            onChange={e => set(fkey, e.target.value)}
            placeholder={placeholder}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${highlight ? C.teal : C.grayBorder}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border .3s' }}
          />
          {suffix && <span style={{ fontSize: 13, color: C.gray, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{suffix}</span>}
        </div>
      )}
    </div>
  );
});

// ─── Dynamic list editor (topics / steps) ────────────────────────────────────

function ListEditor({ label, value, onChange, placeholder = 'العنوان', placeholderD = 'الوصف' }) {
  const items = Array.isArray(value) ? value : [];
  const add    = () => onChange([...items, { t: '', d: '' }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, k, v) => onChange(items.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, fontFamily: 'inherit' }}>{label}</label>
        <button onClick={add} style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${C.teal}`, background: C.tealLight, color: C.tealDark, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ إضافة</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length === 0 && (
          <div style={{ fontSize: 12, color: C.gray, fontStyle: 'italic', padding: '8px 12px', background: C.grayLight, borderRadius: 6, fontFamily: 'inherit' }}>لا توجد عناصر — اضغط + إضافة</div>
        )}
        {items.map((item, i) => (
          <div key={i} style={{ border: `1px solid ${C.grayBorder}`, borderRadius: 8, padding: '10px 12px', background: '#fafafa', position: 'relative' }}>
            <button onClick={() => remove(i)} style={{ position: 'absolute', top: 6, left: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 16, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
            <div style={{ marginBottom: 6 }}>
              <input value={item.t} onChange={e => update(i, 't', e.target.value)} placeholder={placeholder}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${C.grayBorder}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', fontWeight: 600 }} />
            </div>
            <textarea value={item.d} onChange={e => update(i, 'd', e.target.value)} placeholder={placeholderD} rows={2}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${C.grayBorder}`, fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6, color: '#4b5563' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Edit Modal with focus field support ──────────────────────────────────────

function EditModal({ unit, section, focusField, onClose, onSaved }) {
  const isPolicies = section === 'policies';
  const hasLists   = !isPolicies;

  const [form, setForm] = useState({
    name:                unit.name                || '',
    description:         unit.description         || '',
    price:               unit.price != null ? String(unit.price) : '',
    overview:            unit.overview            || '',
    overview2:           unit.overview2           || '',
    written_description: unit.written_description || '',
    topics:              Array.isArray(unit.topics) ? unit.topics : [],
    steps:               Array.isArray(unit.steps)  ? unit.steps  : [],
    tip:                 unit.tip                 || '',
    video_url:           unit.video_url           || '',
    video_duration:      unit.video_duration      || '',
  });
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState('');
  const [highlight, setHighlight] = useState(focusField || null);

  const refs = {
    name:                useRef(null),
    description:         useRef(null),
    price:               useRef(null),
    overview:            useRef(null),
    written_description: useRef(null),
    tip:                 useRef(null),
    video_url:           useRef(null),
  };

  useEffect(() => {
    if (!focusField) return;
    const timer = setTimeout(() => {
      const ref = refs[focusField];
      if (ref?.current) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = ref.current.querySelector('input, textarea');
        if (input) input.focus();
      }
      const clear = setTimeout(() => setHighlight(null), 1500);
      return () => clearTimeout(clear);
    }, 120);
    return () => clearTimeout(timer);
  }, [focusField]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setErr('');
    try {
      let res;
      const payload = isPolicies
        ? { name: form.name, description: form.description, price: form.price ? parseFloat(form.price) : null, overview: form.overview, written_description: form.written_description, tip: form.tip, video_url: form.video_url, video_duration: form.video_duration }
        : { name: form.name, overview: form.overview, overview2: form.overview2, written_description: form.written_description, topics: form.topics, steps: form.steps, tip: form.tip, video_url: form.video_url, video_duration: form.video_duration };

      if (section === 'strategic')   res = await adminApi.updateStrategicContent(unit.id, payload);
      if (section === 'operational') res = await adminApi.updateOperationalContent(unit.id, payload);
      if (section === 'policies')    res = await adminApi.updatePolicyContent(unit.id, payload);

      onSaved({ ...unit, ...form, price: form.price ? parseFloat(form.price) : unit.price }, res.data);
      onClose();
    } catch { setErr('حدث خطأ، حاول مجدداً'); }
    finally { setSaving(false); }
  };

  const unitLabel = unit.unit_number ? `الوحدة ${unit.unit_number}` : `النوع ${unit.id}`;

  return (
    <Modal title={`تعديل — ${unit.name}`} subtitle={unitLabel} onClose={onClose} wide>

      {/* Identity section */}
      <div style={{ background: C.tealLight, borderRadius: 8, padding: '12px 14px', marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 10, fontFamily: 'inherit' }}>الهوية والاسم</div>
        <FieldRef ref={refs.name} label="الاسم / العنوان" fkey="name" form={form} set={set} placeholder="اسم الوحدة..." highlight={highlight === 'name'} />
        {isPolicies && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <FieldRef ref={refs.description} label="وصف مختصر (يظهر للعميل)" fkey="description" form={form} set={set} placeholder="وصف موجز..." highlight={highlight === 'description'} />
            <FieldRef ref={refs.price} label="السعر" fkey="price" form={form} set={set} type="number" placeholder="0" suffix="ريال" highlight={highlight === 'price'} />
          </div>
        )}
      </div>

      {/* Educational content */}
      <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 10, fontFamily: 'inherit' }}>
        المحتوى التعليمي (يظهر في تبويبات الوحدة)
      </div>

      {/* نبذة */}
      <FieldRef ref={refs.overview} label="نبذة — السطر الأول" fkey="overview" form={form} set={set} rows={2} placeholder="مقدمة مختصرة..." highlight={highlight === 'overview'} />
      {hasLists && (
        <FieldRef label="نبذة — السطر الثاني (اختياري)" fkey="overview2" form={form} set={set} rows={2} placeholder="فقرة ثانية اختيارية..." />
      )}

      {/* شرح مكتوب */}
      <FieldRef ref={refs.written_description} label="شرح مكتوب (نص حر)" fkey="written_description" form={form} set={set} rows={4} placeholder="أدخل الشرح التفصيلي..." highlight={highlight === 'written_description'} />
      {hasLists && (
        <ListEditor label="محاور الشرح المكتوب (قائمة)" value={form.topics} onChange={v => set('topics', v)} placeholder="عنوان المحور" placeholderD="شرح المحور..." />
      )}

      {/* إرشادات */}
      <FieldRef ref={refs.tip} label="نصيحة / تنبيه (إرشادات)" fkey="tip" form={form} set={set} rows={2} placeholder="أدخل نصيحة مهمة..." highlight={highlight === 'tip'} />
      {hasLists && (
        <ListEditor label="خطوات العمل التفصيلية (إرشادات)" value={form.steps} onChange={v => set('steps', v)} placeholder="عنوان الخطوة" placeholderD="شرح الخطوة..." />
      )}

      {/* Video row */}
      <div ref={refs.video_url} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end', borderRadius: 10, padding: highlight === 'video_url' ? '10px 12px' : '0', background: highlight === 'video_url' ? C.tealLight : 'transparent', transition: 'background .3s', marginBottom: 16 }}>
        <div style={{ marginBottom: 0 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 6, fontFamily: 'inherit' }}>رابط الفيديو التوجيهي (YouTube)</label>
          <input type="text" value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..."
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${highlight === 'video_url' ? C.teal : C.grayBorder}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border .3s' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 6, fontFamily: 'inherit' }}>مدة الفيديو</label>
          <input type="text" value={form.video_duration} onChange={e => set('video_duration', e.target.value)} placeholder="5:30"
            style={{ width: 90, padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${highlight === 'video_url' ? C.teal : C.grayBorder}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border .3s' }} />
        </div>
      </div>

      {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 10, fontFamily: 'inherit' }}>{err}</div>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid ${C.grayBorder}`, paddingTop: 16, marginTop: 4 }}>
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
        <Btn onClick={save} disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</Btn>
      </div>
    </Modal>
  );
}

// ─── Unit Row ─────────────────────────────────────────────────────────────────

function UnitRow({ unit, section, onEdit }) {
  const num = unit.unit_number || unit.id;
  const isPolicies = section === 'policies';

  return (
    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.grayBorder}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>

        {/* Left: number + name (clickable → opens on 'name' field) */}
        <div
          style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => onEdit(unit, 'name')}
          title="اضغط لتعديل الاسم"
        >
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: 'inherit', marginTop: 2 }}>
            {num}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, fontFamily: 'inherit' }}>{unit.name}</div>
            {isPolicies && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {unit.description && (
                  <span style={{ fontSize: 12, color: C.gray, fontFamily: 'inherit' }}>{unit.description}</span>
                )}
                {unit.price != null && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, fontFamily: 'inherit', background: C.orangeLight, padding: '1px 8px', borderRadius: 12 }}>
                    {Number(unit.price).toLocaleString('en-US')} ريال
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: clickable content badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <ContentBadge filled={!!unit.overview}            label="نبذة"    onClick={() => onEdit(unit, 'overview')} />
          <ContentBadge filled={!!unit.written_description} label="شرح"     onClick={() => onEdit(unit, 'written_description')} />
          <ContentBadge filled={!!unit.tip}                 label="إرشادات" onClick={() => onEdit(unit, 'tip')} />
          <ContentBadge filled={!!unit.video_url}           label="فيديو"   onClick={() => onEdit(unit, 'video_url')} />
        </div>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ units, section }) {
  const extraFields = section === 'policies' ? ['name', 'description', 'price'] : ['name'];
  const allFields   = [...extraFields, ...CONTENT_FIELDS.map(f => f.key)];
  const total  = units.length * allFields.length;
  const filled = units.reduce((acc, u) => acc + allFields.filter(k => {
    const v = u[k];
    return v !== null && v !== undefined && v !== '' && v !== 0;
  }).length, 0);
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 16, padding: '12px 18px', background: C.grayLight, borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.gray, fontFamily: 'inherit' }}>اكتمال المحتوى</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, fontFamily: 'inherit' }}>{filled} / {total} حقل ({pct}%)</span>
      </div>
      <div style={{ height: 6, background: C.grayBorder, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? C.green : C.teal, borderRadius: 3, transition: 'width .4s' }} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState('strategic');
  const [data,      setData]      = useState({ strategic: [], operational: [], policies: [] });
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState(null);
  // editState = { unit, focusField } | null
  const [editState, setEditState] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, o, p] = await Promise.all([
        adminApi.getStrategicContent(),
        adminApi.getOperationalContent(),
        adminApi.getPoliciesContent(),
      ]);
      setData({ strategic: s.data, operational: o.data, policies: p.data });
    } catch { showToast('فشل تحميل البيانات', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // onEdit(unit, field?) — field is optional, defaults to null (shows all)
  const openEdit = (unit, field = null) => setEditState({ unit, focusField: field });

  const onSaved = (updated) => {
    setData(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(u => u.id === updated.id ? { ...u, ...updated } : u),
    }));
    showToast('تم حفظ التغييرات بنجاح');
  };

  const units = data[activeTab] || [];

  return (
    <div style={{ direction: 'rtl', fontFamily: 'inherit' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {editState && (
        <EditModal
          unit={editState.unit}
          section={activeTab}
          focusField={editState.focusField}
          onClose={() => setEditState(null)}
          onSaved={onSaved}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.tealDark, margin: '0 0 6px', fontFamily: 'inherit' }}>إدارة مكونات النظام</h2>
        <p style={{ fontSize: 13, color: C.gray, margin: 0, lineHeight: 1.7, fontFamily: 'inherit' }}>
          اضغط على أي حقل (نبذة، شرح، إرشادات، فيديو) مباشرة لتحريره — المودل يفتح على الحقل المحدد تلقائياً.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: C.grayLight, borderRadius: 12, padding: 4, marginBottom: 16, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 400, background: activeTab === t.key ? C.white : 'transparent', color: activeTab === t.key ? C.teal : C.gray, boxShadow: activeTab === t.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none', transition: 'all .18s', whiteSpace: 'nowrap' }}>
            {t.label}
            <span style={{ marginRight: 6, padding: '1px 7px', borderRadius: 12, background: activeTab === t.key ? C.tealLight : 'transparent', color: activeTab === t.key ? C.teal : C.gray, fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: C.gray, fontSize: 13, fontFamily: 'inherit' }}>جارٍ التحميل...</div>
      ) : (
        <>
          <ProgressBar units={units} section={activeTab} />

          <div style={{ background: C.white, borderRadius: 12, border: `1.5px solid ${C.grayBorder}`, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', background: C.grayLight, borderBottom: `1px solid ${C.grayBorder}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.gray, fontFamily: 'inherit' }}>
                {activeTab === 'policies' ? 'نوع السياسة' : 'الوحدة'} — اضغط على الاسم أو أي حقل لتعديله
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.gray, fontFamily: 'inherit' }}>حالة المحتوى (اضغط للتعديل)</span>
            </div>

            {units.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.gray, fontSize: 13, fontFamily: 'inherit' }}>لا توجد بيانات</div>
            ) : (
              units.map((u, i) => (
                <UnitRow key={u.id || i} unit={u} section={activeTab} onEdit={openEdit} />
              ))
            )}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: C.gray, fontFamily: 'inherit' }}>الحالة:</span>
            <span style={{ fontSize: 11, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ padding: '2px 10px', borderRadius: 12, background: C.greenLight, color: C.green, fontWeight: 600, fontSize: 11 }}>✓ نبذة</span>
              <span style={{ color: C.gray }}>محتوى مُضاف</span>
            </span>
            <span style={{ fontSize: 11, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ padding: '2px 10px', borderRadius: 12, background: C.grayLight, color: C.gray, fontWeight: 600, fontSize: 11 }}>+ نبذة</span>
              <span style={{ color: C.gray }}>لم يُضف بعد — اضغط للإضافة</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
