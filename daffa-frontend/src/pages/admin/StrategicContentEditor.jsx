import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { adminApi } from '../../api/admin';
import {
  OverviewContent, ExplanationContent, GuidelinesContent, ExampleBody, formGuide, pdfUrl,
} from '../strategic/UnitContent';
import TemplateRenderer, { GUIDE_SPEC, guideFields, resolveTip } from '../strategic/TemplateRenderer';

/*
 * محرر المحتوى الكامل لوحدة استراتيجية — كل ما يراه المستخدم في الوحدة قابل للتعديل من هنا:
 * الاسم ونوع النموذج والفيديو، النبذة، الشرح (البطاقات، للتعمّق، الأمثلة، زر PDF وملفه)،
 * الإرشادات (قبل أن تبدأ، الخطوات، التحقق النهائي، المثال، زر PDF وملفه)،
 * ونماذج العمل (إطارات التعليمات وأمثلتها، أسماء الحقول، وتوضيحات ⓘ وأمثلتها).
 * المعاينة تستخدم مكونات صفحة الوحدة نفسها، فما يظهر فيها هو ما سيراه المستخدم بعد الحفظ.
 */

const C = {
  teal: '#1A6B7C', tealDark: '#14505E', tealLight: '#E8F4F6',
  green: '#16A34A', greenLight: '#F0FDF4', orange: '#E8620A', orangeLight: '#FFF7ED',
  gray: '#6B7280', grayLight: '#F3F4F6', grayBorder: '#E5E7EB', red: '#DC2626', redLight: '#FEF2F2',
  white: '#FFFFFF', dark: '#111827', amberBg: '#fffbeb', amberBorder: '#fde68a', amberText: '#92400e',
};

const TABS = [
  { key: 'general',     label: 'عام' },
  { key: 'overview',    label: 'النبذة' },
  { key: 'explanation', label: 'الشرح' },
  { key: 'guidelines',  label: 'الإرشادات' },
  { key: 'form',        label: 'نماذج العمل' },
];

const PDF_KIND_LABEL = { explanation: 'الشرح التفصيلي', guidelines: 'الإرشادات التفصيلية' };

/* ───────────── أدوات ───────────── */

const clone = v => JSON.parse(JSON.stringify(v ?? null));
const norm = s => (s || '').replace(/\s+/g, ' ').trim();

/** ضمان وجود الأقسام الأساسية في المحتوى حتى يعمل المحرر على أي وحدة */
function withShape(content) {
  const c = clone(content) || {};
  c.overview    = c.overview    || { title: '', paragraphs: [] };
  c.explanation = c.explanation || { title: 'الشرح', cards: [] };
  c.guidelines  = c.guidelines  || { title: 'الإرشادات', steps: [] };
  c.form        = c.form        || {};
  c.form.blocks   = c.form.blocks   || [];
  c.form.tooltips = c.form.tooltips || [];
  c.form.renames  = c.form.renames  || [];
  // مسارات ملفات PDF تُدار من الرفع فقط
  ['explanation', 'guidelines'].forEach(k => { delete c[k].pdf_file; delete c[k].pdf_name; });
  return c;
}

const emptyExample = () => ({ title: '', blocks: [{ type: 'paragraph', text: '' }], note: null });

/* ───────────── عناصر إدخال ───────────── */

const inputStyle = {
  width: '100%', padding: '8px 11px', borderRadius: 8, border: `1.5px solid ${C.grayBorder}`,
  fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', lineHeight: 1.7, background: '#fff',
};

function Field({ label, hint, value, onChange, multiline, rows = 3, placeholder, dir }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      {label && <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 5 }}>{label}</span>}
      {multiline ? (
        <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} dir={dir}
          style={{ ...inputStyle, resize: 'vertical' }} />
      ) : (
        <input type="text" value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} dir={dir} style={inputStyle} />
      )}
      {hint && <span style={{ display: 'block', fontSize: 11, color: C.gray, marginTop: 4, lineHeight: 1.6 }}>{hint}</span>}
    </label>
  );
}

function SmallBtn({ children, onClick, tone = 'teal', title, disabled }) {
  const tones = {
    teal:  { background: C.tealLight, color: C.tealDark, border: `1px solid ${C.teal}40` },
    red:   { background: C.redLight, color: C.red, border: '1px solid #fecaca' },
    gray:  { background: C.grayLight, color: C.gray, border: `1px solid ${C.grayBorder}` },
    solid: { background: C.teal, color: '#fff', border: `1px solid ${C.teal}` },
  };
  return (
    <button type="button" onClick={disabled ? undefined : onClick} title={title} disabled={disabled}
      style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', ...tones[tone] }}>
      {children}
    </button>
  );
}

/** أزرار ترتيب/حذف عنصر في قائمة */
function ItemTools({ i, n, move, remove }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
      <SmallBtn tone="gray" onClick={() => move(i, -1)} disabled={i === 0} title="تحريك لأعلى">↑</SmallBtn>
      <SmallBtn tone="gray" onClick={() => move(i, 1)} disabled={i === n - 1} title="تحريك لأسفل">↓</SmallBtn>
      <SmallBtn tone="red" onClick={() => remove(i)} title="حذف">حذف</SmallBtn>
    </div>
  );
}

const listOps = (items, onChange) => ({
  set:    (i, v) => onChange(items.map((x, j) => (j === i ? v : x))),
  remove: i => onChange(items.filter((_, j) => j !== i)),
  move:   (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  },
  add:    v => onChange([...items, v]),
});

/** قائمة نصوص (فقرات، نقاط، خطوات تعليمات...) */
function StrList({ label, hint, items, onChange, multiline = true, addLabel = '+ إضافة', itemName = 'عنصر', rows = 2 }) {
  const list = Array.isArray(items) ? items : [];
  const ops = listOps(list, onChange);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.tealDark }}>{label}</span>
        <SmallBtn onClick={() => ops.add('')}>{addLabel}</SmallBtn>
      </div>
      {hint && <div style={{ fontSize: 11, color: C.gray, marginBottom: 6 }}>{hint}</div>}
      {list.length === 0 && <div style={{ fontSize: 12, color: C.gray, padding: '8px 12px', background: C.grayLight, borderRadius: 8 }}>لا توجد عناصر.</div>}
      {list.map((v, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: C.gray, paddingTop: 9, minWidth: 18, textAlign: 'center' }}>{i + 1}</span>
          <div style={{ flex: 1 }}>
            {multiline
              ? <textarea value={v ?? ''} onChange={e => ops.set(i, e.target.value)} rows={rows} aria-label={`${itemName} ${i + 1}`} style={{ ...inputStyle, resize: 'vertical' }} />
              : <input type="text" value={v ?? ''} onChange={e => ops.set(i, e.target.value)} aria-label={`${itemName} ${i + 1}`} style={inputStyle} />}
          </div>
          <div style={{ paddingTop: 5 }}><ItemTools i={i} n={list.length} move={ops.move} remove={ops.remove} /></div>
        </div>
      ))}
    </div>
  );
}

/** قائمة عناصر مركّبة (بطاقات، خطوات، كتل...) — كل عنصر في إطار قابل للطي */
function ObjList({ label, hint, items, onChange, newItem, addLabel = '+ إضافة', itemTitle, render }) {
  const list = Array.isArray(items) ? items : [];
  const ops = listOps(list, onChange);
  const [closed, setClosed] = useState({});
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: C.tealDark }}>{label}</span>
        <SmallBtn onClick={() => ops.add(newItem())}>{addLabel}</SmallBtn>
      </div>
      {hint && <div style={{ fontSize: 11, color: C.gray, marginBottom: 6, lineHeight: 1.6 }}>{hint}</div>}
      {list.length === 0 && <div style={{ fontSize: 12, color: C.gray, padding: '8px 12px', background: C.grayLight, borderRadius: 8 }}>لا توجد عناصر.</div>}
      {list.map((item, i) => (
        <div key={i} style={{ border: `1px solid ${C.grayBorder}`, borderRadius: 10, marginBottom: 8, background: '#fcfcfd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: closed[i] ? 'none' : `1px solid ${C.grayBorder}` }}>
            <button type="button" onClick={() => setClosed(c => ({ ...c, [i]: !c[i] }))} aria-expanded={!closed[i]}
              style={{ flex: 1, minWidth: 0, textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: 0 }}>
              {closed[i] ? '◂' : '▾'} {itemTitle(item, i)}
            </button>
            <ItemTools i={i} n={list.length} move={ops.move} remove={ops.remove} />
          </div>
          {!closed[i] && <div style={{ padding: '10px 12px 2px' }}>{render(item, v => ops.set(i, v), i)}</div>}
        </div>
      ))}
    </div>
  );
}

/** قسم اختياري (يظهر/يُخفى للمستخدم) — قيمته null عند الإيقاف */
function Optional({ label, value, onChange, make, children, hint }) {
  const on = value !== null && value !== undefined;
  return (
    <div style={{ border: `1px dashed ${on ? C.teal : C.grayBorder}`, borderRadius: 10, padding: '9px 12px', marginBottom: 12, background: on ? '#fff' : '#fafafa' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: on ? C.tealDark : C.gray }}>
        <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked ? make() : null)} />
        {label}
        {!on && <span style={{ fontWeight: 400, fontSize: 11 }}>(غير ظاهر للمستخدم)</span>}
      </label>
      {hint && <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>{hint}</div>}
      {on && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

function Section({ title, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1.5px solid ${C.grayBorder}`, borderRadius: 12, marginBottom: 14, background: '#fff' }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '11px 14px', background: open ? C.tealLight : '#fff', border: 'none', borderRadius: open ? '12px 12px 0 0' : 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right' }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: C.tealDark }}>{open ? '▾' : '◂'} {title}</span>
        {badge}
      </button>
      {open && <div style={{ padding: '12px 14px 4px' }}>{children}</div>}
    </div>
  );
}

/* ───────────── محرر المثال ───────────── */

const BLOCK_TYPES = [
  { key: 'paragraph', label: 'فقرة نصية' },
  { key: 'list',      label: 'قائمة نقاط' },
  { key: 'fields',    label: 'عناوين وقيم' },
  { key: 'table',     label: 'جدول' },
  { key: 'orgchart',  label: 'هيكل تنظيمي (يُرسم تلقائيًا)' },
];
const FIELD_LAYOUTS = [
  { key: '',       label: 'قائمة عادية (عنوان: قيمة)' },
  { key: 'chain',  label: 'سلسلة بطاقات بأسهم (←)' },
  { key: 'combo',  label: 'عاملان ＋ ثم النتيجة ↓ (آخر عنصر هو النتيجة)' },
  { key: 'canvas', label: 'لوحة 5 / 2 / 2 (نموذج العمل)' },
];

const newBlock = type => ({
  paragraph: { type, text: '' },
  list:      { type, items: [''] },
  fields:    { type, items: [{ label: '', value: '' }] },
  table:     { type, headers: ['', ''], rows: [['', '']] },
  orgchart:  { type, rows: [['', '', '']] },
}[type]);

/** محرر جدول: عناوين أعمدة + صفوف (fixedCols لجدول الهيكل التنظيمي) */
function TableEditor({ headers, rows, onChange, fixedHeaders }) {
  const hs = fixedHeaders || headers || [];
  const cols = hs.length || 1;
  const rs = (rows || []).map(r => Array.from({ length: cols }, (_, k) => r?.[k] ?? ''));
  const emit = (h, r) => onChange(fixedHeaders ? { rows: r } : { headers: h, rows: r });
  const cell = { ...inputStyle, padding: '5px 7px', fontSize: 12, lineHeight: 1.5, minWidth: 110 };
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ overflowX: 'auto', border: `1px solid ${C.grayBorder}`, borderRadius: 8 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {hs.map((h, k) => (
                <th key={k} style={{ padding: 4, background: C.tealLight, verticalAlign: 'top' }}>
                  {fixedHeaders
                    ? <div style={{ fontSize: 11.5, color: C.tealDark, padding: '4px 6px', textAlign: 'right' }}>{h}</div>
                    : (
                      <div style={{ display: 'flex', gap: 3 }}>
                        <input value={h} placeholder={`عنوان العمود ${k + 1}`} aria-label={`عنوان العمود ${k + 1}`} onChange={e => emit(hs.map((x, j) => (j === k ? e.target.value : x)), rs)} style={{ ...cell, fontWeight: 700 }} />
                        {cols > 1 && <SmallBtn tone="red" title="حذف العمود" onClick={() => emit(hs.filter((_, j) => j !== k), rs.map(r => r.filter((_, j) => j !== k)))}>✕</SmallBtn>}
                      </div>
                    )}
                </th>
              ))}
              <th style={{ width: 40, background: C.tealLight }} />
            </tr>
          </thead>
          <tbody>
            {rs.map((r, i) => (
              <tr key={i}>
                {r.map((c, k) => (
                  <td key={k} style={{ padding: 3, borderTop: `1px solid ${C.grayBorder}`, verticalAlign: 'top' }}>
                    <textarea value={c} rows={1} aria-label={`الصف ${i + 1} العمود ${k + 1}`} onChange={e => emit(hs, rs.map((row, j) => (j === i ? row.map((x, q) => (q === k ? e.target.value : x)) : row)))} style={{ ...cell, resize: 'vertical' }} />
                  </td>
                ))}
                <td style={{ padding: 3, borderTop: `1px solid ${C.grayBorder}` }}>
                  <SmallBtn tone="red" title="حذف الصف" onClick={() => emit(hs, rs.filter((_, j) => j !== i))}>✕</SmallBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <SmallBtn onClick={() => emit(hs, [...rs, Array(cols).fill('')])}>+ صف</SmallBtn>
        {!fixedHeaders && <SmallBtn onClick={() => emit([...hs, ''], rs.map(r => [...r, '']))}>+ عمود</SmallBtn>}
      </div>
    </div>
  );
}

function ExampleBlockEditor({ block, onChange }) {
  const b = block || {};
  const changeType = type => onChange(newBlock(type));
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 5 }}>نوع الكتلة</span>
        <select value={b.type || 'paragraph'} onChange={e => { if (window.confirm('تغيير النوع يمسح محتوى هذه الكتلة. متابعة؟')) changeType(e.target.value); }} style={{ ...inputStyle, cursor: 'pointer' }}>
          {BLOCK_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </label>
      {b.type === 'paragraph' && <Field label="النص" multiline rows={3} value={b.text} onChange={v => onChange({ ...b, text: v })} />}
      {b.type === 'list' && <StrList label="النقاط" items={b.items} onChange={v => onChange({ ...b, items: v })} itemName="نقطة" />}
      {b.type === 'fields' && (
        <>
          <label style={{ display: 'block', marginBottom: 10 }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 5 }}>طريقة العرض</span>
            <select value={b.layout || ''} onChange={e => { const { layout, ...rest } = b; onChange(e.target.value ? { ...rest, layout: e.target.value } : rest); }} style={{ ...inputStyle, cursor: 'pointer' }}>
              {FIELD_LAYOUTS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
            </select>
          </label>
          <ObjList label="العناصر" items={b.items} onChange={v => onChange({ ...b, items: v })} newItem={() => ({ label: '', value: '' })} addLabel="+ عنصر"
            itemTitle={(it, i) => it.label || `عنصر ${i + 1}`}
            render={(it, set) => (
              <>
                <Field label="العنوان" value={it.label} onChange={v => set({ ...it, label: v })} />
                <Field label="القيمة" multiline rows={2} value={it.value} onChange={v => set({ ...it, value: v })} />
              </>
            )} />
        </>
      )}
      {b.type === 'table' && <TableEditor headers={b.headers} rows={b.rows} onChange={v => onChange({ ...b, ...v })} />}
      {b.type === 'orgchart' && (
        <>
          <div style={{ fontSize: 11, color: C.gray, marginBottom: 6 }}>تُرسم الخريطة من عمود «يتبع لـ». اترك «يتبع لـ» فارغًا لأعلى الهيكل.</div>
          <TableEditor fixedHeaders={['المسمى الوظيفي', 'القسم', 'يتبع لـ']} rows={b.rows} onChange={v => onChange({ ...b, ...v })} />
        </>
      )}
    </div>
  );
}

function ExampleEditor({ value, onChange }) {
  const ex = value || emptyExample();
  const [preview, setPreview] = useState(false);
  return (
    <div style={{ background: '#fffdf7', border: '1px dashed #f5c38b', borderRadius: 10, padding: '10px 12px 4px' }}>
      <Field label="عنوان المثال" value={ex.title} onChange={v => onChange({ ...ex, title: v })} />
      <ObjList label="محتوى المثال" items={ex.blocks} onChange={v => onChange({ ...ex, blocks: v })} newItem={() => newBlock('paragraph')} addLabel="+ كتلة"
        hint="يتكوّن المثال من كتل متتالية: فقرة، أو قائمة، أو عناوين وقيم، أو جدول، أو هيكل تنظيمي."
        itemTitle={(b, i) => `${i + 1}. ${BLOCK_TYPES.find(t => t.key === b.type)?.label || 'كتلة'}${b.type === 'paragraph' && b.text ? ` — ${b.text.slice(0, 40)}` : ''}`}
        render={(b, set) => <ExampleBlockEditor block={b} onChange={set} />} />
      <Field label="ملاحظة أسفل المثال (اختياري)" multiline rows={2} value={ex.note} onChange={v => onChange({ ...ex, note: v || null })} />
      <div style={{ marginBottom: 10 }}>
        <SmallBtn tone="gray" onClick={() => setPreview(p => !p)}>{preview ? 'إخفاء معاينة المثال' : 'معاينة المثال'}</SmallBtn>
        {preview && <div style={{ marginTop: 8, background: '#fff', border: `1px solid ${C.grayBorder}`, borderRadius: 8, padding: 10 }}><ExampleBody example={ex} /></div>}
      </div>
    </div>
  );
}

/**
 * زر مثال + المثال نفسه (اختياري). obj يحتوي المفتاحين exKey وbtnKey، ويُرسل التغيير دفعة واحدة عبر onPatch
 * (تفعيل المثال يضبط نص الزر الافتراضي في التحديث نفسه).
 */
function ExampleWithButton({ label, obj, exKey = 'example', btnKey = 'example_button', onPatch, defaultButton = 'عرض مثال' }) {
  const example = obj?.[exKey] ?? null;
  const button = obj?.[btnKey] ?? '';
  return (
    <Optional label={label} value={example} make={emptyExample}
      onChange={v => onPatch(v ? { [exKey]: v, [btnKey]: button || defaultButton } : { [exKey]: null, [btnKey]: null })}>
      <Field label="نص الزر" value={button} onChange={v => onPatch({ [btnKey]: v })} placeholder={defaultButton} />
      <ExampleEditor value={example} onChange={v => onPatch({ [exKey]: v })} />
    </Optional>
  );
}

/* ───────────── ملفات PDF ───────────── */

function PdfManager({ unit, kind, onUpdated, notify }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const uploaded = unit.pdf_urls?.[kind];
  const defaultHref = pdfUrl(unit.template_type, kind);
  const href = uploaded || defaultHref;
  const fileName = decodeURIComponent(href.split('/').pop());

  const upload = async file => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') { notify('يُقبل ملف PDF فقط', 'error'); return; }
    if (file.size > 50 * 1024 * 1024) { notify('حجم الملف أكبر من 50 ميجابايت', 'error'); return; }
    setBusy(true); setProgress(0);
    try {
      const res = await adminApi.uploadStrategicPdf(unit.id, kind, file, setProgress);
      onUpdated(res.data);
      notify(`تم رفع ملف «${PDF_KIND_LABEL[kind]}» ونشره للمستخدمين`);
    } catch (e) {
      notify(e?.response?.data?.message || e?.response?.data?.errors?.file?.[0] || 'تعذّر رفع الملف', 'error');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const restore = async () => {
    if (!window.confirm('حذف الملف المرفوع والرجوع إلى الملف المعتمد الافتراضي؟')) return;
    setBusy(true);
    try {
      const res = await adminApi.removeStrategicPdf(unit.id, kind);
      onUpdated(res.data);
      notify('تمت استعادة الملف المعتمد الافتراضي');
    } catch { notify('تعذّر حذف الملف', 'error'); } finally { setBusy(false); }
  };

  return (
    <div style={{ background: C.orangeLight, border: '1px solid #fed7aa', borderRadius: 10, padding: '11px 13px', marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: C.orange, marginBottom: 6 }}>ملف PDF — {PDF_KIND_LABEL[kind]}</div>
      <div style={{ fontSize: 12, color: C.dark, marginBottom: 8, lineHeight: 1.7, wordBreak: 'break-word' }}>
        الملف الحالي: <strong>{fileName}</strong>
        <span style={{ color: C.gray }}> — {uploaded ? 'مرفوع من لوحة التحكم' : 'الملف المعتمد الافتراضي'}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, fontWeight: 600, color: C.tealDark, background: '#fff', border: `1px solid ${C.grayBorder}`, borderRadius: 7, padding: '4px 10px', textDecoration: 'none' }}>فتح الملف</a>
        <SmallBtn tone="solid" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? `جارٍ الرفع ${progress}%` : (uploaded ? 'استبدال الملف' : 'رفع ملف جديد')}</SmallBtn>
        {uploaded && <SmallBtn tone="red" onClick={restore} disabled={busy}>استعادة الملف المعتمد</SmallBtn>}
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" style={{ display: 'none' }} onChange={e => upload(e.target.files?.[0])} />
      </div>
      <div style={{ fontSize: 11, color: C.gray, marginTop: 6, lineHeight: 1.6 }}>
        يُنشر الملف للمستخدمين فور رفعه (لا يحتاج زر الحفظ). يظهر باسم الملف المرفوع عند التنزيل، فسمِّه كما تريد أن يراه المستخدم. الحد الأقصى 50 ميجابايت.
      </div>
    </div>
  );
}

/* ───────────── تبويبات المحرر ───────────── */

function GeneralTab({ draft, setDraft }) {
  const c = draft.content;
  return (
    <>
      <Field label="اسم الوحدة" value={draft.name} onChange={v => setDraft(d => ({ ...d, name: v }))}
        hint="يظهر في قائمة الوحدات وعنوان صفحة الوحدة والتقارير." />
      <Field label="نوع النموذج (يظهر في بطاقة النبذة)" value={c.template_label} onChange={v => setDraft(d => ({ ...d, content: { ...d.content, template_label: v || null } }))}
        hint="اتركه فارغًا لاستخدام الاسم الافتراضي للنموذج." />
      <Field label="رابط الفيديو التوجيهي (YouTube)" dir="ltr" value={draft.video_url} onChange={v => setDraft(d => ({ ...d, video_url: v }))} placeholder="https://www.youtube.com/watch?v=..." />
      <Field label="مدة الفيديو" dir="ltr" value={draft.video_duration} onChange={v => setDraft(d => ({ ...d, video_duration: v }))} placeholder="5:30" />
    </>
  );
}

function OverviewTab({ content, setContent }) {
  const o = content.overview || {};
  const set = v => setContent({ ...content, overview: { ...o, ...v } });
  return (
    <>
      <Field label="عنوان النبذة" value={o.title} onChange={v => set({ title: v })} hint="إن تُرك فارغًا يُعرض اسم الوحدة." />
      <StrList label="فقرات النبذة" items={o.paragraphs} onChange={v => set({ paragraphs: v })} rows={3} addLabel="+ فقرة" itemName="فقرة" />
    </>
  );
}

function ExplanationTab({ content, setContent, unit, onUnitUpdated, notify }) {
  const e = content.explanation || {};
  const set = v => setContent({ ...content, explanation: { ...e, ...v } });
  return (
    <>
      <Field label="عنوان الصفحة" value={e.title} onChange={v => set({ title: v })} />
      <Field label="الوصف أسفل العنوان" multiline rows={2} value={e.subtitle} onChange={v => set({ subtitle: v })} />
      <ObjList label="بطاقات الشرح" items={e.cards} onChange={v => set({ cards: v })} newItem={() => ({ title: '', paragraphs: [''], bullets: [] })} addLabel="+ بطاقة"
        itemTitle={(c, i) => c.title || `بطاقة ${i + 1}`}
        render={(c, setC) => (
          <>
            <Field label="عنوان البطاقة" value={c.title} onChange={v => setC({ ...c, title: v })} />
            <StrList label="الفقرات" items={c.paragraphs} onChange={v => setC({ ...c, paragraphs: v })} addLabel="+ فقرة" itemName="فقرة" />
            <StrList label="النقاط" items={c.bullets} onChange={v => setC({ ...c, bullets: v })} addLabel="+ نقطة" itemName="نقطة" rows={1} />
          </>
        )} />
      <Optional label="فقرة «للتعمّق»" value={e.deep_dive} onChange={v => set({ deep_dive: v })} make={() => ({ title: 'للتعمّق', text: '' })}>
        <Field label="العنوان" value={e.deep_dive?.title} onChange={v => set({ deep_dive: { ...e.deep_dive, title: v } })} />
        <Field label="النص" multiline rows={3} value={e.deep_dive?.text} onChange={v => set({ deep_dive: { ...e.deep_dive, text: v } })} />
      </Optional>
      <ExampleWithButton label="المثال الأول (زر قبل زر الشرح التفصيلي)" obj={e} onPatch={set} />
      <ExampleWithButton label="المثال الثاني (اختياري)" obj={e} exKey="example_2" btnKey="example_button_2" onPatch={set} />
      <Field label="نص زر ملف PDF" value={e.pdf_button} onChange={v => set({ pdf_button: v })} placeholder="قراءة الشرح التفصيلي" />
      <Field label="الوصف أسفل زر PDF" value={e.pdf_caption} onChange={v => set({ pdf_caption: v })} />
      <PdfManager unit={unit} kind="explanation" onUpdated={onUnitUpdated} notify={notify} />
    </>
  );
}

function GuidelinesTab({ content, setContent, unit, onUnitUpdated, notify }) {
  const g = content.guidelines || {};
  const set = v => setContent({ ...content, guidelines: { ...g, ...v } });
  return (
    <>
      <Field label="عنوان الصفحة" value={g.title} onChange={v => set({ title: v })} />
      <Field label="الوصف أسفل العنوان" multiline rows={2} value={g.subtitle} onChange={v => set({ subtitle: v })} />
      <Optional label="مربع «قبل أن تبدأ»" value={g.before} onChange={v => set({ before: v })} make={() => ({ title: 'قبل أن تبدأ', text: '' })}>
        <Field label="العنوان" value={g.before?.title} onChange={v => set({ before: { ...g.before, title: v } })} />
        <Field label="النص" multiline rows={3} value={g.before?.text} onChange={v => set({ before: { ...g.before, text: v } })} />
      </Optional>
      <ObjList label="الخطوات المرقّمة" items={g.steps} onChange={v => set({ steps: v })} newItem={() => ({ title: '', text: '' })} addLabel="+ خطوة"
        itemTitle={(s, i) => `${i + 1}. ${s.title || 'خطوة'}`}
        render={(s, setS) => (
          <>
            <Field label="عنوان الخطوة" value={s.title} onChange={v => setS({ ...s, title: v })} />
            <Field label="نص الخطوة" multiline rows={3} value={s.text} onChange={v => setS({ ...s, text: v })} />
          </>
        )} />
      <Optional label="مربع التحقق النهائي (✓)" value={g.after} onChange={v => set({ after: v })} make={() => ({ title: '', text: '' })}>
        <Field label="العنوان" value={g.after?.title} onChange={v => set({ after: { ...g.after, title: v } })} />
        <Field label="النص" multiline rows={3} value={g.after?.text} onChange={v => set({ after: { ...g.after, text: v } })} />
      </Optional>
      <ExampleWithButton label="مثال (اختياري)" obj={g} onPatch={set} />
      <Field label="نص زر ملف PDF" value={g.pdf_button} onChange={v => set({ pdf_button: v })} placeholder="قراءة الإرشادات التفصيلية" />
      <Field label="الوصف أسفل زر PDF" value={g.pdf_caption} onChange={v => set({ pdf_caption: v })} />
      <PdfManager unit={unit} kind="guidelines" onUpdated={onUnitUpdated} notify={notify} />
    </>
  );
}

/* نماذج العمل: إطارات التعليمات حسب الموضع + الحقول (الاسم الظاهر وتوضيح ⓘ) */

function GuideBlockEditor({ block, onChange }) {
  const b = block;
  const set = v => onChange({ ...b, ...v });
  return (
    <>
      <Field label="العنوان (اختياري)" value={b.title} onChange={v => set({ title: v || null })} hint="يُخفى تلقائيًا إذا كان مطابقًا لعنوان القسم الظاهر فوقه." />
      <Field label="العنوان الفرعي (اختياري)" value={b.heading} onChange={v => set({ heading: v || null })} />
      <StrList label="التعليمات" items={b.items} onChange={v => set({ items: v })} addLabel="+ تعليمة" itemName="تعليمة" />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.tealDark, fontWeight: 600, marginBottom: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={b.ordered !== false} onChange={e => set({ ordered: e.target.checked })} />
        ترقيم التعليمات (1، 2، 3) — عند الإلغاء تظهر كنقاط
      </label>
      <Field label="ملاحظة أسفل التعليمات (اختياري)" multiline rows={2} value={b.note} onChange={v => set({ note: v || null })} />
      <ExampleWithButton label="زر مثال" obj={b} onPatch={set} />
      <ExampleWithButton label="زر مثال ثانٍ (اختياري)" obj={b} exKey="example_2" btnKey="example_button_2" onPatch={set} />
    </>
  );
}

function FieldTipEditor({ field, content, setContent }) {
  const form = content.form;
  const guide = formGuide({ content });
  const shown = guide.rename(field.label);
  const tip = resolveTip(guide, field.anchor, field.label, field.suffix);
  const idx = tip ? form.tooltips.indexOf(tip) : -1;

  const setForm = v => setContent({ ...content, form: { ...form, ...v } });
  const setTip = v => setForm({ tooltips: form.tooltips.map((t, i) => (i === idx ? { ...t, ...v } : t)) });

  const rename = value => {
    const others = form.renames.filter(r => norm(r.from) !== norm(field.label));
    const renames = norm(value) && norm(value) !== norm(field.label) ? [...others, { from: field.label, to: value }] : others;
    // إبقاء التوضيح مرتبطًا بالحقل بعد تغيير اسمه
    const tooltips = idx < 0 ? form.tooltips : form.tooltips.map((t, i) => {
      if (i !== idx) return t;
      const hadSuffix = field.suffix && norm(t.label) === norm(`${shown}${field.suffix}`);
      const base = norm(value) ? value : field.label;
      return { ...t, label: hadSuffix ? `${base}${field.suffix}` : base };
    });
    setForm({ renames, tooltips });
  };

  const toggleTip = on => {
    if (on) setForm({ tooltips: [...form.tooltips, { anchor: field.anchor, label: shown, text: '', example: null }] });
    else if (window.confirm(`حذف توضيح ⓘ من «${shown}»؟`)) setForm({ tooltips: form.tooltips.filter((_, i) => i !== idx) });
  };

  return (
    <div style={{ border: `1px solid ${C.grayBorder}`, borderRadius: 10, padding: '9px 12px', marginBottom: 8, background: idx >= 0 ? '#fff' : '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: C.dark }}>{field.title || shown}{field.suffix || ''}</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: idx >= 0 ? C.teal : C.gray, fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={idx >= 0} onChange={e => toggleTip(e.target.checked)} />
          توضيح ⓘ
        </label>
      </div>
      {field.renamable && (
        <div style={{ marginTop: 8 }}>
          <Field label="الاسم الظاهر للحقل" value={shown} onChange={rename}
            hint={shown !== field.label ? `الاسم الأصلي: «${field.label}» — امسح الحقل للرجوع إليه.` : null} />
        </div>
      )}
      {idx >= 0 && (
        <div style={{ marginTop: field.renamable ? 0 : 8 }}>
          <Field label="نص التوضيح" multiline rows={2} value={tip.text} onChange={v => setTip({ text: v || null })} />
          <Optional label="مثال داخل نافذة ⓘ" value={tip.example} onChange={v => setTip({ example: v })} make={emptyExample}>
            <ExampleEditor value={tip.example} onChange={v => setTip({ example: v })} />
          </Optional>
        </div>
      )}
    </div>
  );
}

function FormTab({ content, setContent, unit }) {
  const form = content.form;
  const spec = GUIDE_SPEC[unit.template_type] || { anchors: { top: 'أعلى النموذج' }, fields: [] };
  const fields = guideFields(unit);
  const setForm = v => setContent({ ...content, form: { ...form, ...v } });

  // كل المواضع: المعرّفة في النموذج + أي موضع موجود في البيانات
  const anchors = useMemo(() => {
    const keys = Object.keys(spec.anchors);
    form.blocks.forEach(b => { if (!keys.includes(b.anchor)) keys.push(b.anchor); });
    return keys;
  }, [spec, form.blocks]);

  const setGroup = (anchor, items) => {
    const out = [];
    let placed = false;
    form.blocks.forEach(b => {
      if (b.anchor === anchor) { if (!placed) { out.push(...items); placed = true; } } else out.push(b);
    });
    if (!placed) out.push(...items);
    setForm({ blocks: out });
  };

  // توضيحات لا تتصل بأي حقل ظاهر (لا تظهر للمستخدم)
  const guide = formGuide({ content });
  const linked = new Set(fields.map(f => resolveTip(guide, f.anchor, f.label, f.suffix)).filter(Boolean));
  const orphans = form.tooltips.map((t, i) => ({ t, i })).filter(({ t }) => !linked.has(t));

  const fieldGroups = [];
  fields.forEach(f => {
    let g = fieldGroups.find(x => x.anchor === f.anchor);
    if (!g) { g = { anchor: f.anchor, items: [] }; fieldGroups.push(g); }
    g.items.push(f);
  });

  return (
    <>
      <Section title="إطارات التعليمات" badge={<span style={{ fontSize: 11, color: C.gray }}>{form.blocks.length} إطار</span>}>
        <div style={{ fontSize: 11.5, color: C.gray, marginBottom: 10, lineHeight: 1.7 }}>
          تظهر التعليمات في إطار أزرق في الموضع المحدد من النموذج، مع أزرار الأمثلة إن وُجدت.
        </div>
        {anchors.map(a => (
          <ObjList key={a} label={`الموضع: ${spec.anchors[a] || a}`}
            items={form.blocks.filter(b => b.anchor === a)} onChange={items => setGroup(a, items)}
            newItem={() => ({ anchor: a, title: null, heading: null, items: [''], ordered: true, note: null, example_button: null, example: null })}
            addLabel="+ إطار تعليمات"
            itemTitle={(b, i) => b.heading || b.title || `إطار ${i + 1}`}
            render={(b, set) => <GuideBlockEditor block={b} onChange={set} />} />
        ))}
      </Section>

      <Section title="الحقول: الأسماء وتوضيحات ⓘ" badge={<span style={{ fontSize: 11, color: C.gray }}>{linked.size} توضيح</span>}>
        <div style={{ fontSize: 11.5, color: C.gray, marginBottom: 10, lineHeight: 1.7 }}>
          فعّل «توضيح ⓘ» لإظهار الأيقونة بجوار الحقل، واكتب نصها أو أضف مثالًا. تغيير الاسم الظاهر لا يمس بيانات المستخدمين المحفوظة.
        </div>
        {fieldGroups.map(g => (
          <div key={g.anchor} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.teal, margin: '4px 0 6px' }}>{spec.anchors[g.anchor] || g.items[0]?.title || g.anchor}</div>
            {g.items.map(f => <FieldTipEditor key={`${f.anchor}|${f.label}`} field={f} content={content} setContent={setContent} />)}
          </div>
        ))}
        {fields.length === 0 && <div style={{ fontSize: 12, color: C.gray }}>لا توجد حقول تقبل التوضيح في هذا النموذج.</div>}
      </Section>

      {orphans.length > 0 && (
        <Section title="توضيحات غير مرتبطة بحقل ظاهر" defaultOpen>
          <div style={{ fontSize: 11.5, color: C.amberText, background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
            هذه التوضيحات لا تظهر للمستخدم لأن اسمها لا يطابق أي حقل في النموذج. يمكنك حذفها.
          </div>
          {orphans.map(({ t, i }) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: `1px solid ${C.grayBorder}`, borderRadius: 8, padding: '7px 10px', marginBottom: 6 }}>
              <span style={{ fontSize: 12 }}>{t.label} <span style={{ color: C.gray }}>({t.anchor})</span></span>
              <SmallBtn tone="red" onClick={() => setForm({ tooltips: form.tooltips.filter((_, j) => j !== i) })}>حذف</SmallBtn>
            </div>
          ))}
        </Section>
      )}
    </>
  );
}

/* ───────────── المعاينة ───────────── */

function Preview({ tab, unit }) {
  const [formData, setFormData] = useState({});
  return (
    <div style={{ direction: 'rtl', fontFamily: "'Cairo', sans-serif" }}>
      {(tab === 'general' || tab === 'overview') && <OverviewContent unit={unit} />}
      {tab === 'explanation' && <ExplanationContent unit={unit} />}
      {tab === 'guidelines' && <GuidelinesContent unit={unit} />}
      {tab === 'form' && <TemplateRenderer unit={unit} formData={formData} setFormData={setFormData} disabled={false} context={{}} />}
    </div>
  );
}

/* ───────────── المحرر ───────────── */

export default function StrategicContentEditor({ unit: initialUnit, initialTab = 'general', onClose, onSaved, notify }) {
  const [unit, setUnit] = useState(initialUnit); // آخر نسخة محفوظة (تتحدّث عند رفع ملفات PDF)
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
      const res = await adminApi.updateStrategicContent(unit.id, draft);
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
      const res = await adminApi.getStrategicDefault(unit.id);
      setContent(withShape(res.data));
      notify('تم تحميل المحتوى المعتمد — راجعه ثم احفظ');
    } catch { notify('لا يوجد محتوى معتمد لهذه الوحدة', 'error'); }
  };

  // رفع/حذف ملف PDF يُحفظ مباشرة: نحدّث روابط الملفات فقط دون المساس بتعديلات المسودة غير المحفوظة
  const onUnitUpdated = u => {
    setUnit(prev => ({ ...prev, pdf_urls: u.pdf_urls }));
    onSaved(u);
  };

  const twoCols = showPreview && width > 1100;
  const tabProps = { content: draft.content, setContent, unit: previewUnit, onUnitUpdated, notify };

  return ReactDOM.createPortal(
    <div role="dialog" aria-modal="true" aria-label={`تعديل محتوى ${draft.name}`}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9000, display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: width > 700 ? 16 : 0 }}>
      <div style={{ background: '#f8fafb', borderRadius: width > 700 ? 14 : 0, width: '100%', maxWidth: 1500, display: 'flex', flexDirection: 'column', direction: 'rtl', fontFamily: "'Cairo', sans-serif", overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        {/* الرأس */}
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

        {/* التبويبات */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 18px', background: '#fff', borderBottom: `1px solid ${C.grayBorder}`, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} aria-pressed={tab === t.key}
              style={{ padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.key ? 800 : 500, background: tab === t.key ? C.teal : C.grayLight, color: tab === t.key ? '#fff' : C.gray, whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* المحرر + المعاينة */}
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: twoCols ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)', overflow: twoCols ? 'hidden' : 'auto' }}>
          <div style={{ overflowY: twoCols ? 'auto' : 'visible', padding: '16px 18px' }}>
            {tab === 'general' && <GeneralTab draft={draft} setDraft={setDraft} />}
            {tab === 'overview' && <OverviewTab {...tabProps} />}
            {tab === 'explanation' && <ExplanationTab {...tabProps} />}
            {tab === 'guidelines' && <GuidelinesTab {...tabProps} />}
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
