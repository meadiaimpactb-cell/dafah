import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { adminApi } from '../../api/admin';
import { C, clone, norm, inputStyle, Field, SmallBtn, StrList, ObjList, Optional, Section, TableEditor } from './StrategicContentEditor';
import { OpSection, OpFormIntro, OpBlocks } from '../operational/OpContent';
import { OpTemplateRenderer } from '../operational/OperationalRoadmap';

/*
 * محرر المحتوى الكامل لوحدة تخطيط تشغيلي — كل ما يراه المستخدم في الوحدة قابل للتعديل من هنا:
 * الاسم والفيديو، النبذة، الشرح، الإرشادات، وتعليمات نموذج العمل مع مثالها التوضيحي (نافذة منبثقة)
 * وتوضيحات ⓘ للحقول. كل قسم بطاقة واحدة مكوّنة من كتل (فقرة، عنوان فرعي، قائمة، خطوة مرقّمة، نصيحة،
 * عناوين وقيم، جدول، مخطط جانت). المعاينة تستخدم مكونات صفحة الوحدة نفسها.
 */

const FONT = "'Cairo', sans-serif";

const TABS = [
  { key: 'general',     label: 'عام' },
  { key: 'overview',    label: 'النبذة' },
  { key: 'explanation', label: 'الشرح' },
  { key: 'guidelines',  label: 'الإرشادات' },
  { key: 'form',        label: 'نماذج العمل' },
];

const SECTION_LABEL = { overview: 'النبذة', explanation: 'الشرح', guidelines: 'الإرشادات' };

// عناوين الحقول/الأعمدة التي يمكن إضافة ⓘ لها في كل نموذج (للاقتراح فقط — يُقبل أي عنوان مطابق)
const FIELD_LABELS = {
  op_import:      [],
  op_activities:  ['اسم النشاط', 'وصف النشاط', 'المخرج المتوقع'],
  op_gantt:       [],
  op_responsible: ['النشاط', 'المبادرة', 'مسؤول التنفيذ', 'القسم / الإدارة'],
  op_budget:      ['النشاط', 'بند التكلفة', 'تكلفة الوحدة', 'العدد', 'الإجمالي'],
};

// بيانات معاينة النموذج (لا تُحفظ) حتى تظهر الحقول وتوضيحاتها
const PREVIEW_DATA = {
  op_import:      { items: [{ name: 'مبادرة للمعاينة', checked: true }] },
  op_activities:  { groups: [{ initiative: 'مبادرة للمعاينة', activities: [{ id: 'preview', name: '', desc: '', output: '' }] }] },
  op_gantt:       { activities: [{ name: 'نشاط للمعاينة', months: [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0] }] },
  op_responsible: { rows: [{ activity: '', initiative: '', responsible: '', department: '' }] },
  op_budget:      { rows: [{ activity: '', item: '', unitCost: '', count: '', total: '' }] },
};

const emptyCard = () => ({ title: '', heading: null, blocks: [] });

/** ضمان وجود الأقسام حتى يعمل المحرر على أي وحدة */
function withShape(content) {
  const c = clone(content) || {};
  ['overview', 'explanation', 'guidelines'].forEach(k => {
    c[k] = { ...emptyCard(), ...(c[k] || {}) };
    c[k].blocks = Array.isArray(c[k].blocks) ? c[k].blocks : [];
  });
  c.form = { ...emptyCard(), example_button: null, example: null, tooltips: [], ...(c.form || {}) };
  c.form.blocks = Array.isArray(c.form.blocks) ? c.form.blocks : [];
  c.form.tooltips = Array.isArray(c.form.tooltips) ? c.form.tooltips : [];
  return c;
}

/* ───────────── الكتل ───────────── */

const BLOCK_TYPES = [
  { key: 'paragraph', label: 'فقرة' },
  { key: 'heading',   label: 'عنوان فرعي' },
  { key: 'list',      label: 'قائمة (مرقّمة أو نقطية)' },
  { key: 'step',      label: 'خطوة مرقّمة (عنوان + نص + نقاط)' },
  { key: 'tip',       label: 'نصيحة' },
  { key: 'fields',    label: 'عناوين وقيم (العنوان — القيمة)' },
  { key: 'table',     label: 'جدول' },
  { key: 'gantt',     label: 'مخطط جانت' },
];

const newBlock = type => ({
  paragraph: { type, text: '' },
  heading:   { type, text: '' },
  list:      { type, ordered: true, items: [''] },
  step:      { type, title: '', text: '', items: [] },
  tip:       { type, label: 'نصيحة', text: '' },
  fields:    { type, items: [{ label: '', value: '' }] },
  table:     { type, headers: ['', ''], rows: [['', '']] },
  gantt:     { type, months: ['يناير', 'فبراير', 'مارس'], rows: [{ label: '', marks: [0, 0, 0] }] },
}[type] || { type: 'paragraph', text: '' });

const blockTitle = (b, i) => {
  const t = BLOCK_TYPES.find(x => x.key === b.type)?.label || 'كتلة';
  const s = b.title || b.text || b.label || '';
  return `${i + 1}. ${t}${s ? ` — ${String(s).replace(/\*\*/g, '').slice(0, 45)}` : ''}`;
};

const RICH_HINT = 'للخط العريض ضع النص بين ** و ** (مثل **تكلفة الوحدة × العدد**)، وكل سطر جديد فقرة مستقلة.';

/** محرر مخطط جانت للأمثلة: أعمدة الأشهر + صف لكل نشاط مع تحديد أشهره */
function GanttEditor({ block, onChange }) {
  const months = block.months || [];
  const rows = (block.rows || []).map(r => ({ ...r, marks: months.map((_, j) => (r.marks?.[j] ? 1 : 0)) }));
  // كل تعديل على الأعمدة يُطبَّق على علامات كل صف بالطريقة نفسها حتى تبقى الأشرطة على أشهرها
  const apply = (nextMonths, mapMarks) => onChange({ ...block, months: nextMonths, rows: rows.map(r => ({ ...r, marks: mapMarks(r.marks) })) });
  const setMonth = (i, v) => apply(months.map((m, j) => (j === i ? v : m)), mk => mk);
  const addMonth = () => apply([...months, ''], mk => [...mk, 0]);
  const removeMonth = i => apply(months.filter((_, j) => j !== i), mk => mk.filter((_, j) => j !== i));
  const moveMonth = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= months.length) return;
    const swap = arr => { const n = [...arr]; [n[i], n[j]] = [n[j], n[i]]; return n; };
    apply(swap(months), swap);
  };
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.tealDark }}>الأشهر (أعمدة المخطط بالترتيب)</span>
          <SmallBtn onClick={addMonth}>+ شهر</SmallBtn>
        </div>
        {months.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <input type="text" value={m} onChange={e => setMonth(i, e.target.value)} aria-label={`شهر ${i + 1}`} style={inputStyle} />
            <SmallBtn tone="gray" onClick={() => moveMonth(i, -1)} disabled={i === 0} title="تحريك لأعلى">↑</SmallBtn>
            <SmallBtn tone="gray" onClick={() => moveMonth(i, 1)} disabled={i === months.length - 1} title="تحريك لأسفل">↓</SmallBtn>
            <SmallBtn tone="red" onClick={() => removeMonth(i)} title="حذف">حذف</SmallBtn>
          </div>
        ))}
      </div>
      <ObjList label="الأنشطة" items={rows} onChange={v => onChange({ ...block, rows: v })} newItem={() => ({ label: '', marks: months.map(() => 0) })} addLabel="+ نشاط"
        itemTitle={(r, i) => r.label || `نشاط ${i + 1}`}
        render={(r, set) => (
          <>
            <Field label="اسم النشاط" value={r.label} onChange={v => set({ ...r, label: v })} />
            <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>أشهر التنفيذ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {months.map((m, j) => (
                <label key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!r.marks[j]} onChange={e => set({ ...r, marks: r.marks.map((x, q) => (q === j ? (e.target.checked ? 1 : 0) : x)) })} />
                  {m || `شهر ${j + 1}`}
                </label>
              ))}
            </div>
          </>
        )} />
    </div>
  );
}

function BlockEditor({ block, onChange }) {
  const b = block || {};
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 5 }}>نوع الكتلة</span>
        <select value={b.type || 'paragraph'} onChange={e => { if (window.confirm('تغيير النوع يمسح محتوى هذه الكتلة. متابعة؟')) onChange(newBlock(e.target.value)); }} style={{ ...inputStyle, cursor: 'pointer' }}>
          {BLOCK_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </label>
      {b.type === 'paragraph' && <Field label="النص" multiline rows={4} value={b.text} onChange={v => onChange({ ...b, text: v })} hint={RICH_HINT} />}
      {b.type === 'heading' && <Field label="العنوان" value={b.text} onChange={v => onChange({ ...b, text: v })} />}
      {b.type === 'list' && (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={b.ordered !== false} onChange={e => onChange({ ...b, ordered: e.target.checked })} />
            قائمة مرقّمة (١، ٢، ٣) — ألغِ التحديد لقائمة نقطية
          </label>
          <StrList label="العناصر" items={b.items} onChange={v => onChange({ ...b, items: v })} itemName="عنصر" hint={RICH_HINT} />
        </>
      )}
      {b.type === 'step' && (
        <>
          <div style={{ fontSize: 11, color: C.gray, marginBottom: 8 }}>تُرقَّم الخطوات تلقائيًا بترتيبها داخل البطاقة.</div>
          <Field label="عنوان الخطوة (اختياري)" value={b.title} onChange={v => onChange({ ...b, title: v })} />
          <Field label="النص" multiline rows={3} value={b.text} onChange={v => onChange({ ...b, text: v })} hint={RICH_HINT} />
          <StrList label="نقاط تحت الخطوة (اختياري)" items={b.items} onChange={v => onChange({ ...b, items: v })} itemName="نقطة" addLabel="+ نقطة" />
        </>
      )}
      {b.type === 'tip' && (
        <>
          <Field label="العنوان (اختياري، مثل: نصيحة)" value={b.label} onChange={v => onChange({ ...b, label: v })} />
          <Field label="النص" multiline rows={3} value={b.text} onChange={v => onChange({ ...b, text: v })} hint={RICH_HINT} />
        </>
      )}
      {b.type === 'fields' && (
        <ObjList label="العناصر" items={b.items} onChange={v => onChange({ ...b, items: v })} newItem={() => ({ label: '', value: '' })} addLabel="+ عنصر"
          hint="يُعرض كل عنصر في سطر: العنوان بخط عريض — القيمة. تُعرض الكتلة في إطار مستقل."
          itemTitle={(it, i) => it.label || `عنصر ${i + 1}`}
          render={(it, set) => (
            <>
              <Field label="العنوان" value={it.label} onChange={v => set({ ...it, label: v })} />
              <Field label="القيمة" multiline rows={2} value={it.value} onChange={v => set({ ...it, value: v })} />
            </>
          )} />
      )}
      {b.type === 'table' && <TableEditor headers={b.headers} rows={b.rows} onChange={v => onChange({ ...b, ...v })} />}
      {b.type === 'gantt' && <GanttEditor block={b} onChange={onChange} />}
    </div>
  );
}

function BlocksEditor({ label, blocks, onChange, hint }) {
  return (
    <ObjList label={label} items={blocks} onChange={onChange} newItem={() => newBlock('paragraph')} addLabel="+ كتلة"
      hint={hint || 'محتوى البطاقة كتل متتالية: فقرة، عنوان فرعي، قائمة، خطوة مرقّمة، نصيحة، عناوين وقيم، جدول، أو مخطط جانت.'}
      itemTitle={blockTitle}
      render={(b, set) => <BlockEditor block={b} onChange={set} />} />
  );
}

/** بطاقة قسم: العنوان والعنوان الفرعي والكتل */
function CardEditor({ card, onChange, headingHint }) {
  const c = card || emptyCard();
  return (
    <>
      <Field label="عنوان البطاقة" value={c.title} onChange={v => onChange({ ...c, title: v })} />
      <Field label="عنوان فرعي (اختياري)" value={c.heading} onChange={v => onChange({ ...c, heading: v || null })} hint={headingHint} />
      <BlocksEditor label="المحتوى" blocks={c.blocks} onChange={v => onChange({ ...c, blocks: v })} />
    </>
  );
}

/* ───────────── التبويبات ───────────── */

function GeneralTab({ draft, setDraft }) {
  return (
    <Section title="بيانات الوحدة">
      <Field label="اسم الوحدة" value={draft.name} onChange={v => setDraft(d => ({ ...d, name: v }))}
        hint="يظهر في قائمة الوحدات وعنوان الصفحة ومسار التنقل والتقرير النهائي (PDF)." />
      <Field label="رابط الفيديو" value={draft.video_url} onChange={v => setDraft(d => ({ ...d, video_url: v }))} dir="ltr" placeholder="https://youtube.com/..." />
      <Field label="مدة الفيديو" value={draft.video_duration} onChange={v => setDraft(d => ({ ...d, video_duration: v }))} dir="ltr" placeholder="10:00" />
    </Section>
  );
}

function SectionTab({ section, content, setContent }) {
  return (
    <Section title={`${SECTION_LABEL[section]} — بطاقة واحدة بخلفية زرقاء فاتحة`}>
      <CardEditor card={content[section]} onChange={v => setContent({ ...content, [section]: v })} />
    </Section>
  );
}

function FormTab({ content, setContent, unit }) {
  const f = content.form;
  const setForm = patch => setContent({ ...content, form: { ...f, ...patch } });
  const suggestions = FIELD_LABELS[unit.template_type] || [];
  const listId = `op-field-labels-${unit.id}`;
  return (
    <>
      <Section title="تعليمات نموذج العمل (أعلى النموذج)">
        <CardEditor card={f} onChange={v => setForm({ title: v.title, heading: v.heading, blocks: v.blocks })} />
      </Section>
      <Section title="المثال التوضيحي (نافذة منبثقة مع زر «إغلاق»)">
        <Optional label="عرض زر المثال أسفل التعليمات" value={f.example}
          make={() => ({ title: '', blocks: [newBlock('paragraph')] })}
          onChange={v => setForm(v ? { example: v, example_button: f.example_button || 'عرض مثال توضيحي' } : { example: null, example_button: null })}>
          <Field label="نص الزر" value={f.example_button} onChange={v => setForm({ example_button: v })} placeholder="عرض مثال توضيحي" />
          <Field label="عنوان النافذة" value={f.example?.title} onChange={v => setForm({ example: { ...f.example, title: v } })} />
          <BlocksEditor label="محتوى المثال" blocks={f.example?.blocks || []} onChange={v => setForm({ example: { ...f.example, blocks: v } })} />
        </Optional>
      </Section>
      <Section title="توضيحات الحقول ⓘ (تُفتح بالضغط فقط)">
        <div style={{ fontSize: 11.5, color: C.gray, marginBottom: 10, lineHeight: 1.7 }}>
          اكتب عنوان الحقل أو العمود كما يظهر في النموذج، فتظهر ⓘ بجانبه وتعرض النص عند الضغط عليها.
          {suggestions.length > 0 && <> العناوين المتاحة في هذا النموذج: {suggestions.map((s, i) => <span key={s}>{i ? '، ' : ''}«{s}»</span>)}.</>}
        </div>
        <datalist id={listId}>{suggestions.map(s => <option key={s} value={s} />)}</datalist>
        <ObjList label="التوضيحات" items={f.tooltips} onChange={v => setForm({ tooltips: v })} newItem={() => ({ label: '', text: '' })} addLabel="+ توضيح"
          itemTitle={(t, i) => t.label || `توضيح ${i + 1}`}
          render={(t, set) => (
            <>
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 5 }}>عنوان الحقل</span>
                <input type="text" list={listId} value={t.label ?? ''} onChange={e => set({ ...t, label: e.target.value })} style={inputStyle} />
                {norm(t.label) && suggestions.length > 0 && !suggestions.some(s => norm(s) === norm(t.label)) && (
                  <span style={{ display: 'block', fontSize: 11, color: C.orange, marginTop: 4 }}>لا يطابق عنوانًا في هذا النموذج — لن تظهر ⓘ حتى يطابق العنوان.</span>
                )}
              </label>
              <Field label="نص التوضيح" multiline rows={3} value={t.text} onChange={v => set({ ...t, text: v })} />
            </>
          )} />
      </Section>
    </>
  );
}

/* ───────────── المعاينة ───────────── */

function Preview({ tab, unit }) {
  const [formData, setFormData] = useState(() => clone(PREVIEW_DATA[unit.template_type] || {}));
  return (
    <div style={{ direction: 'rtl', fontFamily: FONT }}>
      {(tab === 'general' || tab === 'overview') && <OpSection unit={unit} section="overview" />}
      {tab === 'explanation' && <OpSection unit={unit} section="explanation" />}
      {tab === 'guidelines' && <OpSection unit={unit} section="guidelines" />}
      {tab === 'form' && (
        <>
          <OpFormIntro unit={unit} />
          <div style={{ marginTop: 14 }}>
            <OpTemplateRenderer unit={unit} formData={formData} setFormData={setFormData} readOnly={false} />
          </div>
          {unit.content?.form?.example && (
            <div style={{ marginTop: 16, border: `1px dashed ${C.grayBorder}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.gray, marginBottom: 8 }}>محتوى النافذة المنبثقة: {unit.content.form.example.title}</div>
              <OpBlocks blocks={unit.content.form.example.blocks} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ───────────── المحرر ───────────── */

export default function OperationalContentEditor({ unit: initialUnit, initialTab = 'general', onClose, onSaved, notify }) {
  const [unit, setUnit] = useState(initialUnit);
  const makeDraft = u => ({ name: u.name || '', video_url: u.video_url || '', video_duration: u.video_duration || '', content: withShape(u.content) });
  const [draft, setDraft] = useState(() => makeDraft(initialUnit));
  const [saved, setSaved] = useState(() => JSON.stringify(makeDraft(initialUnit)));
  const [tab, setTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const dirty = JSON.stringify(draft) !== saved;

  useEffect(() => {
    const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const setContent = content => setDraft(d => ({ ...d, content }));
  const previewUnit = useMemo(() => ({ ...unit, name: draft.name, content: draft.content }), [unit, draft]);

  const close = () => {
    if (dirty && !window.confirm('لديك تغييرات غير محفوظة. الخروج دون حفظ؟')) return;
    onClose();
  };

  const save = async () => {
    if (!norm(draft.name)) { notify('اسم الوحدة مطلوب', 'error'); setTab('general'); return; }
    setSaving(true);
    try {
      const res = await adminApi.updateOperationalContent(unit.id, draft);
      setUnit(res.data);
      const next = makeDraft(res.data);
      setDraft(next);
      setSaved(JSON.stringify(next));
      onSaved(res.data);
      notify('تم حفظ التغييرات ونشرها للمستخدمين');
    } catch (e) {
      notify(e?.response?.data?.message || 'تعذّر الحفظ، حاول مجددًا', 'error');
    } finally { setSaving(false); }
  };

  const restoreDefault = async () => {
    if (!window.confirm('تحميل المحتوى المعتمد الأصلي لهذه الوحدة في المحرر؟ لن يُحفظ إلا عند الضغط على «حفظ التغييرات».')) return;
    try {
      const res = await adminApi.getOperationalDefault(unit.id);
      setContent(withShape(res.data));
      notify('تم تحميل المحتوى المعتمد — راجعه ثم احفظ');
    } catch { notify('لا يوجد محتوى معتمد لهذه الوحدة', 'error'); }
  };

  const twoCols = showPreview && width > 1100;
  const tabProps = { content: draft.content, setContent, unit: previewUnit };

  return ReactDOM.createPortal(
    <div role="dialog" aria-modal="true" aria-label={`تعديل محتوى ${draft.name}`}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9000, display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: width > 700 ? 16 : 0 }}>
      <div style={{ background: '#f8fafb', borderRadius: width > 700 ? 14 : 0, width: '100%', maxWidth: 1500, display: 'flex', flexDirection: 'column', direction: 'rtl', fontFamily: FONT, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 18px', background: '#fff', borderBottom: `1px solid ${C.grayBorder}`, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.tealDark }}>تعديل محتوى الوحدة {unit.unit_number}: {draft.name}</div>
            <div style={{ fontSize: 11.5, color: dirty ? C.orange : C.gray, marginTop: 2 }}>{dirty ? '● تغييرات غير محفوظة' : 'كل التغييرات محفوظة ومنشورة'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {unit.has_default && <SmallBtn tone="gray" onClick={restoreDefault}>استعادة المحتوى المعتمد</SmallBtn>}
            <SmallBtn tone="gray" onClick={() => setShowPreview(p => !p)}>{showPreview ? 'إخفاء المعاينة' : 'إظهار المعاينة'}</SmallBtn>
            <button type="button" onClick={close} style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${C.grayBorder}`, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: C.dark }}>إغلاق</button>
            <button type="button" onClick={save} disabled={!dirty || saving}
              style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: C.teal, color: '#fff', cursor: !dirty || saving ? 'not-allowed' : 'pointer', opacity: !dirty || saving ? 0.55 : 1, fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>
              {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '8px 18px', background: '#fff', borderBottom: `1px solid ${C.grayBorder}`, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} aria-pressed={tab === t.key}
              style={{ padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.key ? 800 : 500, background: tab === t.key ? C.teal : C.grayLight, color: tab === t.key ? '#fff' : C.gray, whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: twoCols ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)', overflow: twoCols ? 'hidden' : 'auto' }}>
          <div style={{ overflowY: twoCols ? 'auto' : 'visible', padding: '16px 18px' }}>
            {tab === 'general' && <GeneralTab draft={draft} setDraft={setDraft} />}
            {['overview', 'explanation', 'guidelines'].includes(tab) && <SectionTab section={tab} {...tabProps} />}
            {tab === 'form' && <FormTab {...tabProps} />}
          </div>
          {showPreview && (
            <div style={{ overflowY: twoCols ? 'auto' : 'visible', padding: '16px 18px', borderRight: twoCols ? `1px solid ${C.grayBorder}` : 'none', borderTop: twoCols ? 'none' : `1px solid ${C.grayBorder}`, background: '#fff' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.gray, marginBottom: 10 }}>معاينة — كما ستظهر للمستخدم بعد الحفظ</div>
              <Preview tab={tab} unit={previewUnit} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
