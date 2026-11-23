import DfIcon from '../../components/ui/DfIcon';
import React, { useEffect, useMemo, useId, useState, useRef } from 'react';
import { formGuide, GuideBlocks, GuideExamples, LabelWithTip, InfoTip } from './UnitContent';
import { buildOrgTree, OrgNode } from './OrgChart';
import { useIsPhone } from '../../utils/useMediaQuery';
import { isNonNegativeAmount, AMOUNT_MSG } from '../../utils/numbers';

const colors = { amber: '#EF6A2C', primary: '#235D7F', ink: '#0E2A3D', orange: '#EF6A2C', amberText: '#A33F12', amberLine: '#E05A1F' };

export default function TemplateRenderer({ unit, formData, setFormData, disabled, context }) {
  const set = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  // تعليمات النموذج من المحتوى المنظَّم: إطارات حسب الموضع، وتوضيحات ⓘ حسب عنوان الحقل
  const guide = useMemo(() => formGuide(unit), [unit]);
  const props = { formData, set, setFormData, disabled, unit, guide, context: context || {} };

  switch (unit.template_type) {
    case 'swot':        return <SwotTemplate {...props} />;
    case 'pestel':      return <PestelTemplate {...props} />;
    case 'needs':       return <NeedsTemplate {...props} />;
    case 'tows':        return <TowsTemplate {...props} />;
    case 'initiatives': return <InitiativesTemplate {...props} />;
    case 'directions':  return <DirectionsTemplate {...props} />;
    case 'toc':         return <TocTemplate {...props} />;
    case 'bmc':         return <BmcTemplate {...props} />;
    case 'kpis':        return <KpisTemplate {...props} />;
    case 'orgchart':    return <OrgchartTemplate {...props} />;
    case 'document':    return <DocumentTemplate {...props} />;
    default:            return <GenericTemplate {...props} />;
  }
}

/* ─────────────── مكونات مشتركة ─────────────── */
const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 700, color: colors.primary, marginBottom: 10, marginTop: 20 }}>{children}</div>
);

const TaInput = ({ value, onChange, placeholder, rows = 3, disabled, id }) => (
  <textarea
    id={id}
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    disabled={disabled}
    style={{
      width: '100%', padding: '8px 10px', border: `1px solid ${disabled ? '#F3EFE8' : '#E8E3DA'}`,
      borderRadius: 6, fontSize: 12, fontFamily: "inherit",
      resize: 'vertical', direction: 'rtl', boxSizing: 'border-box', lineHeight: 1.7,
      background: disabled ? '#FBF9F5' : '#fff',
    }}
  />
);

const TextInput = ({ value, onChange, placeholder, disabled }) => (
  <input
    type="text"
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    style={{
      width: '100%', padding: '7px 10px', border: `1px solid ${disabled ? '#F3EFE8' : '#E8E3DA'}`,
      borderRadius: 6, fontSize: 12, fontFamily: "inherit",
      direction: 'rtl', boxSizing: 'border-box',
      background: disabled ? '#FBF9F5' : '#fff',
    }}
  />
);

// لا تُعرض قيمة جاهزة قبل أن يختار العميل: الخيار الأول «اختر…» فارغ، والقيمة المحفوظة تُستعاد كما هي
const SelectInput = ({ value, onChange, options, disabled, placeholder = 'اختر…', label }) => (
  <select
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    aria-label={label}
    style={{
      width: '100%', padding: '7px 10px', border: `1px solid ${disabled ? '#F3EFE8' : '#E8E3DA'}`,
      borderRadius: 6, fontSize: 12, fontFamily: "inherit",
      direction: 'rtl', boxSizing: 'border-box',
      color: value ? '#0E2A3D' : '#8C97A3',
      background: disabled ? '#FBF9F5' : '#fff', cursor: disabled ? 'default' : 'pointer',
    }}
  >
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

/** عنوان خانة إدخال مرتبط بها (الضغط عليه ينقل المؤشر إلى الخانة) */
const FieldLabel = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334452', marginBottom: 6 }}>{children}</label>
);

const thStyle = {
  padding: '9px 10px', background: colors.primary, color: '#fff',
  fontSize: 12, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap',
};

/**
 * توضيح ⓘ لحقل: يُبحث داخل موضعه بالاسم الظاهر (مع الرمز إن وُجد مثل «(S)»)، ثم بالاسم الظاهر، ثم بالاسم الأصلي
 * (حتى لا ينفصل التوضيح إذا أعاد المدير تسمية الحقل). المحرر في لوحة التحكم يستخدم الدالة نفسها.
 */
export const resolveTip = (guide, anchor, label, suffix = '') => {
  const shown = guide.rename(label);
  return (suffix && guide.tipIn(anchor, `${shown}${suffix}`))
    || guide.tipIn(anchor, shown)
    || (shown !== label && guide.tipIn(anchor, label))
    || null;
};

/** عنوان عمود/حقل مع ⓘ عند وجود توضيح له */
const Th = ({ guide, anchor, label, style }) => (
  <th style={{ ...thStyle, ...style }}>
    <LabelWithTip label={guide.rename(label)} tip={resolveTip(guide, anchor, label)} />
  </th>
);
const Lbl = ({ guide, anchor, label, suffix }) => (
  <LabelWithTip label={guide.rename(label)} tip={resolveTip(guide, anchor, label, suffix)} />
);
const SectionTitleTip = ({ guide, anchor, label }) => (
  <SectionTitle><Lbl guide={guide} anchor={anchor} label={label} /></SectionTitle>
);

const addBtnStyle = {
  padding: '7px 16px', background: 'transparent', border: `1.5px dashed ${colors.primary}`, color: colors.primary,
  borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: "inherit", fontWeight: 600,
};
const norm = s => (s || '').replace(/\s+/g, ' ').trim();
const tdStyle = { padding: '6px 6px', borderBottom: '1px solid #F3EFE8', verticalAlign: 'middle' };
const tdLabelStyle = { ...tdStyle, padding: '8px 10px', fontSize: 12, fontWeight: 600, background: '#FBF9F5', whiteSpace: 'nowrap' };
// العمود الأول (اسم الصف) مثبّت أثناء التمرير الأفقي حتى يعرف المستخدم أي صف يعدّل على الجوال
const stickyTh = { position: 'sticky', right: 0, zIndex: 2, boxShadow: '-1px 0 0 rgba(255,255,255,0.25) inset' };
const stickyTd = { position: 'sticky', right: 0, zIndex: 1, boxShadow: '-1px 0 0 #E8E3DA inset' };
const tdStickyLabel = { ...tdLabelStyle, ...stickyTd };

/* ─────────────── 1. SWOT ─────────────── */
// نقاط القوة/الضعف في الملخص تُجمع تلقائيًا من الجدول بترتيب المجالات، مع تجاهل الخانات الفارغة
export const swotAutoPoints = (unit, table, col) =>
  (unit.table_rows || []).map(row => norm(table?.[`${row}__${col}`])).filter(Boolean);

export const SWOT_SUMMARY_TITLE = 'ملخص التحليل الداخلي المستند إلى إطار SWOT';

function SwotTemplate({ formData, set, setFormData, disabled, unit, guide }) {
  const tableRows = unit.table_rows || [];
  const tbl = formData.table || {};
  const matrix = formData.matrix || {};

  const setTbl = (row, col, v) => set('table', { ...tbl, [`${row}__${col}`]: v });
  const setMx  = (k, v) => set('matrix', { ...matrix, [k]: v });

  const strengths  = swotAutoPoints(unit, tbl, 'strength');
  const weaknesses = swotAutoPoints(unit, tbl, 'weakness');

  // تحديث الملخص المحفوظ تلقائيًا عند تعديل الجدول (لا يُحرَّر يدويًا)
  const sJoined = strengths.map(p => `• ${p}`).join('\n');
  const wJoined = weaknesses.map(p => `• ${p}`).join('\n');
  useEffect(() => {
    if (disabled) return;
    if ((matrix.strengths || '') === sJoined && (matrix.weaknesses || '') === wJoined) return;
    setFormData(prev => ({ ...prev, matrix: { ...(prev.matrix || {}), strengths: sJoined, weaknesses: wJoined } }));
  }, [sJoined, wJoined, disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const summaryTip = resolveTip(guide, 'summary', SWOT_SUMMARY_TITLE);
  const autoBox = (points, empty) => (
    <div style={{ minHeight: 88, padding: '8px 12px', fontSize: 12, lineHeight: 1.9, color: '#334452', background: '#FBF9F5' }}>
      {points.length > 0
        ? <ul style={{ margin: 0, paddingRight: 16 }}>{points.map((p, i) => <li key={i}>{p}</li>)}</ul>
        : <span style={{ color: '#8C97A3' }}>{empty}</span>}
    </div>
  );

  return (
    <div>
      <SectionTitle>تحليل الموارد الداخلية</SectionTitle>
      <GuideBlocks guide={guide} anchor="table" sectionTitle="تحليل الموارد الداخلية" />
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <Th guide={guide} anchor="table" label="العنصر" style={stickyTh} />
              <Th guide={guide} anchor="table" label="نقاط القوة" />
              <Th guide={guide} anchor="table" label="نقاط الضعف" />
              <Th guide={guide} anchor="table" label="ملاحظات" />
            </tr>
          </thead>
          <tbody>
            {tableRows.map(row => (
              <tr key={row}>
                <td style={tdStickyLabel}><Lbl guide={guide} anchor="table" label={row} /></td>
                <td style={tdStyle}><TextInput value={tbl[`${row}__strength`]} onChange={v => setTbl(row, 'strength', v)} placeholder="اكتب هنا..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={tbl[`${row}__weakness`]} onChange={v => setTbl(row, 'weakness', v)} placeholder="اكتب هنا..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={tbl[`${row}__notes`]}    onChange={v => setTbl(row, 'notes',    v)} placeholder="ملاحظات..." disabled={disabled} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20, marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.primary, display: 'flex', alignItems: 'center', gap: 2 }}>
          {SWOT_SUMMARY_TITLE}
          {summaryTip && <InfoTip text={summaryTip.text} example={summaryTip.example} title={summaryTip.example?.title} label={SWOT_SUMMARY_TITLE} />}
        </div>
        <div style={{ fontSize: 11.5, color: '#5E6B78', marginTop: 2 }}>مكيّف للتركيز على البيئة الداخلية للمنظمة</div>
      </div>
      <GuideBlocks guide={guide} anchor="summary" />
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 8 }}>
        {[
          { key: 'strengths',    label: 'نقاط القوة',       code: 'S', color: '#0B7F5D', bg: '#E8F8F2', auto: strengths },
          { key: 'weaknesses',   label: 'نقاط الضعف',       code: 'W', color: '#C53A3A', bg: '#FCEBEB', auto: weaknesses },
          { key: 'opportunities',label: 'فرص التحسين',      code: 'O', color: '#1F74C4', bg: '#EAF4FD' },
          { key: 'threats',      label: 'المخاطر الداخلية', code: 'T', color: '#A33F12', bg: '#FEF3EC' },
        ].map(q => (
          <div key={q.key} style={{ border: `2px solid ${q.color}25`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '7px 12px', background: q.bg, fontSize: 13, fontWeight: 600, color: q.color, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span><Lbl guide={guide} anchor="summary" label={q.label} suffix={` (${q.code})`} /> ({q.code})</span>
              {q.auto && <span style={{ fontSize: 10.5, fontWeight: 500, color: '#5E6B78' }}>تظهر تلقائيًا من الجدول</span>}
            </div>
            {q.auto
              ? autoBox(q.auto, `تظهر هنا ${q.label} المسجّلة في الجدول أعلاه`)
              : <TaInput value={matrix[q.key]} onChange={v => setMx(q.key, v)} placeholder="اكتب هنا..." rows={4} disabled={disabled} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── 2. PESTEL ─────────────── */
export const STAKEHOLDER_FIXED_ROWS = ['الجهات الحكومية', 'المانحون', 'المستفيدون', 'الموظفون', 'الشركاء'];

/** صفوف خريطة أصحاب المصلحة: الخمسة الثابتة + ما أضافه العميل (stakeholders_extra) */
export const stakeholderRows = (formData) => {
  const stakes = formData.stakeholders || {};
  const fixed = STAKEHOLDER_FIXED_ROWS.map(name => ({ name, impact: stakes[`${name}__impact`] || '', interest: stakes[`${name}__interest`] || '', strategy: stakes[`${name}__strategy`] || '', fixed: true }));
  const extra = Array.isArray(formData.stakeholders_extra) ? formData.stakeholders_extra : [];
  return [...fixed, ...extra.map(r => ({ name: r.name || '', impact: r.impact || '', interest: r.interest || '', strategy: r.strategy || '', fixed: false }))];
};

function PestelTemplate({ formData, set, disabled, unit, guide }) {
  const tableRows = unit.table_rows || ['سياسي', 'اقتصادي', 'اجتماعي', 'تقني', 'بيئي', 'قانوني'];
  const factors = formData.factors || {};
  const stakes  = formData.stakeholders || {};
  const extra   = Array.isArray(formData.stakeholders_extra) ? formData.stakeholders_extra : [];

  const setF = (row, col, v) => set('factors', { ...factors, [`${row}__${col}`]: v });
  const setS = (row, col, v) => set('stakeholders', { ...stakes, [`${row}__${col}`]: v });
  const setExtra = (i, col, v) => set('stakeholders_extra', extra.map((r, idx) => (idx === i ? { ...r, [col]: v } : r)));
  const addExtra = () => set('stakeholders_extra', [...extra, { name: '', impact: '', interest: '', strategy: '' }]);
  const removeExtra = i => set('stakeholders_extra', extra.filter((_, idx) => idx !== i));

  const stakeRows = STAKEHOLDER_FIXED_ROWS;

  return (
    <div>
      <SectionTitle>تحليل PESTEL</SectionTitle>
      {/* وفق المواصفات: التعليمات فوق الجدول، وزر «عرض مثال مكتمل» أسفله */}
      <GuideBlocks guide={guide} anchor="pestel" sectionTitle="تحليل PESTEL" examplesBelow />
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <Th guide={guide} anchor="pestel" label="العامل" style={stickyTh} />
              <Th guide={guide} anchor="pestel" label="وصف العامل" />
              <Th guide={guide} anchor="pestel" label="التأثير" />
              <Th guide={guide} anchor="pestel" label="المستوى" />
            </tr>
          </thead>
          <tbody>
            {tableRows.map(row => (
              <tr key={row}>
                <td style={tdStickyLabel}>{row}</td>
                <td style={tdStyle}><TextInput value={factors[`${row}__desc`]}   onChange={v => setF(row, 'desc',   v)} placeholder="وصف العامل..." disabled={disabled} /></td>
                <td style={{ ...tdStyle, minWidth: 110 }}><SelectInput value={factors[`${row}__impact`]} onChange={v => setF(row, 'impact', v)} options={['إيجابي', 'سلبي', 'محايد']} placeholder="اختر التأثير" label={`${row} — التأثير`} disabled={disabled} /></td>
                <td style={{ ...tdStyle, minWidth: 110 }}><SelectInput value={factors[`${row}__level`]}  onChange={v => setF(row, 'level',  v)} options={['عالي', 'متوسط', 'منخفض']}  placeholder="اختر المستوى" label={`${row} — المستوى`} disabled={disabled} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <GuideExamples guide={guide} anchor="pestel" />

      <SectionTitle>خريطة أصحاب المصلحة</SectionTitle>
      <GuideBlocks guide={guide} anchor="stakeholders" sectionTitle="خريطة أصحاب المصلحة" examplesBelow />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <Th guide={guide} anchor="stakeholders" label="صاحب المصلحة" style={stickyTh} />
              <Th guide={guide} anchor="stakeholders" label="مستوى التأثير" />
              <Th guide={guide} anchor="stakeholders" label="مستوى الاهتمام" />
              <Th guide={guide} anchor="stakeholders" label="استراتيجية التعامل" />
              {!disabled && <th style={{ ...thStyle, width: 70 }} aria-label="إجراءات"></th>}
            </tr>
          </thead>
          <tbody>
            {stakeRows.map(row => (
              <tr key={row}>
                <td style={tdStickyLabel}>{row}</td>
                <td style={tdStyle}><TextInput value={stakes[`${row}__impact`]}    onChange={v => setS(row, 'impact',    v)} placeholder="..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={stakes[`${row}__interest`]}  onChange={v => setS(row, 'interest',  v)} placeholder="..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={stakes[`${row}__strategy`]}  onChange={v => setS(row, 'strategy',  v)} placeholder="..." disabled={disabled} /></td>
                {!disabled && <td style={tdStyle}></td>}
              </tr>
            ))}
            {/* أطراف أضافها العميل (مثل وسائل الإعلام المحلية) */}
            {extra.map((r, i) => (
              <tr key={`extra-${i}`} data-extra-stakeholder>
                <td style={{ ...tdStickyLabel, minWidth: 150, whiteSpace: 'normal' }}>
                  <TextInput value={r.name} onChange={v => setExtra(i, 'name', v)} placeholder="اسم صاحب المصلحة..." disabled={disabled} />
                </td>
                <td style={tdStyle}><TextInput value={r.impact}   onChange={v => setExtra(i, 'impact',   v)} placeholder="..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={r.interest} onChange={v => setExtra(i, 'interest', v)} placeholder="..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={r.strategy} onChange={v => setExtra(i, 'strategy', v)} placeholder="..." disabled={disabled} /></td>
                {!disabled && (
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button type="button" onClick={() => removeExtra(i)} aria-label={`حذف صاحب المصلحة: ${r.name || 'الصف المضاف'}`} title="حذف الصف"
                      style={{ background: 'none', border: '1px solid #F1B2B2', borderRadius: 6, color: '#C53A3A', cursor: 'pointer', fontSize: 11, padding: '3px 8px', fontFamily: "inherit", whiteSpace: 'nowrap' }}>
                      حذف
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!disabled && <button type="button" onClick={addExtra} style={addBtnStyle}>+ إضافة صاحب مصلحة</button>}
      <GuideExamples guide={guide} anchor="stakeholders" />
    </div>
  );
}

/* ─────────────── 3. دراسة الاحتياجات ─────────────── */
const NEEDS_DEFAULT_ROWS = ['الدعم التعليمي', 'التأهيل المهني', 'الدعم النفسي', 'الرعاية الصحية', 'الإسكان'];

// صفوف الاحتياجات قابلة للإضافة والتسمية والحذف؛ المصدر needs_items، ويُشتق منه needs_table للتوافق
export const needsItems = (formData, unit) => {
  if (Array.isArray(formData.needs_items)) return formData.needs_items;
  const tbl = formData.needs_table || {};
  return (unit.table_rows || NEEDS_DEFAULT_ROWS).map(name => ({
    name, desc: tbl[`${name}__desc`] || '', priority: tbl[`${name}__priority`] || '', source: tbl[`${name}__source`] || '',
  }));
};

function NeedsTemplate({ formData, setFormData, set, disabled, unit, guide }) {
  const items = needsItems(formData, unit);
  const communityId = useId();
  // حذف صف مُعبَّأ قابل للتراجع لبضع ثوانٍ
  const [undo, setUndo] = useState(null);
  const undoTimer = useRef(null);
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const commit = next => {
    const table = {};
    next.forEach(it => {
      const name = norm(it.name);
      if (!name) return;
      if (it.desc)     table[`${name}__desc`]     = it.desc;
      if (it.priority) table[`${name}__priority`] = it.priority;
      if (it.source)   table[`${name}__source`]   = it.source;
    });
    setFormData(prev => ({ ...prev, needs_items: next, needs_table: table }));
  };
  const update = (i, k, v) => commit(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const addRow = () => commit([...items, { name: '', desc: '', priority: '', source: '' }]);
  const removeRow = i => {
    const removed = items[i];
    commit(items.filter((_, idx) => idx !== i));
    if (removed && (norm(removed.name) || norm(removed.desc) || norm(removed.source))) {
      clearTimeout(undoTimer.current);
      setUndo({ row: removed, index: i });
      undoTimer.current = setTimeout(() => setUndo(null), 8000);
    }
  };
  const restoreRow = () => {
    if (!undo) return;
    const next = [...needsItems(formData, unit)];
    next.splice(Math.min(undo.index, next.length), 0, undo.row);
    commit(next);
    clearTimeout(undoTimer.current);
    setUndo(null);
  };

  const names = items.map(it => norm(it.name)).filter(Boolean);
  const dup = name => norm(name) && names.filter(n => n === norm(name)).length > 1;

  return (
    <div>
      <GuideBlocks guide={guide} anchor="top" />
      <SectionTitleTip guide={guide} anchor="community" label="تعريف المجتمع المستهدف" />
      <GuideBlocks guide={guide} anchor="community" sectionTitle="تعريف المجتمع المستهدف" />
      {/* عنوان الخانة نفسها (يتبع الاسم الظاهر للحقل إن غيّره المدير من لوحة التحكم) */}
      <FieldLabel htmlFor={communityId}>{guide.rename('تعريف المجتمع المستهدف')}</FieldLabel>
      <TaInput id={communityId} value={formData.target_community} onChange={v => set('target_community', v)}
        placeholder="صف الفئة المستهدفة بدقة: من هم؟ أين يقعون؟ ما خصائصهم؟" rows={3} disabled={disabled} />

      <SectionTitleTip guide={guide} anchor="needs_table" label="جدول الاحتياجات" />
      <GuideBlocks guide={guide} anchor="needs_table" sectionTitle="جدول الاحتياجات" />
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <Th guide={guide} anchor="needs_table" label="الاحتياج" style={stickyTh} />
              <Th guide={guide} anchor="needs_table" label="الوصف" />
              <Th guide={guide} anchor="needs_table" label="الأولوية" />
              <Th guide={guide} anchor="needs_table" label="المصدر" />
              {!disabled && <th style={{ ...thStyle, width: 70 }}></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, ...stickyTd, minWidth: 150, background: '#FBF9F5' }}>
                  <TextInput value={it.name} onChange={v => update(i, 'name', v)} placeholder="اسم الاحتياج..." disabled={disabled} />
                  {dup(it.name) && <div style={{ fontSize: 10.5, color: '#C53A3A', marginTop: 2 }}>اسم الاحتياج مكرر، يُرجى تمييزه.</div>}
                </td>
                <td style={tdStyle}><TextInput value={it.desc}   onChange={v => update(i, 'desc',   v)} placeholder="وصف الاحتياج..." disabled={disabled} /></td>
                <td style={{ ...tdStyle, minWidth: 110 }}><SelectInput value={it.priority} onChange={v => update(i, 'priority', v)} options={['عالية', 'متوسطة', 'منخفضة']} placeholder="اختر الأولوية" label={`أولوية: ${it.name || `الاحتياج ${i + 1}`}`} disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={it.source} onChange={v => update(i, 'source', v)} placeholder="المصدر..." disabled={disabled} /></td>
                {!disabled && (
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeRow(i)} title={`حذف صف: ${it.name || `الاحتياج ${i + 1}`}`} aria-label={`حذف صف: ${it.name || `الاحتياج ${i + 1}`}`}
                        style={{ background: 'none', border: '1px solid #F1B2B2', borderRadius: 6, color: '#C53A3A', cursor: 'pointer', fontSize: 11, padding: '3px 8px', fontFamily: "inherit", whiteSpace: 'nowrap' }}>
                        حذف الصف
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!disabled && <button type="button" onClick={addRow} style={addBtnStyle}>+ إضافة احتياج</button>}
      {undo && (
        <div role="status" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#FEF3EC', border: '1px solid #FBC3A3', borderRadius: 8, fontSize: 12, color: '#7F310E' }}>
          <span>حُذف صف «{undo.row.name || 'بلا اسم'}»</span>
          <button type="button" onClick={restoreRow} style={{ background: '#fff', border: '1px solid #E05A1F', color: '#A33F12', borderRadius: 6, padding: '3px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>تراجع</button>
        </div>
      )}

      <SectionTitleTip guide={guide} anchor="gaps" label="تحليل الفجوات" />
      <GuideBlocks guide={guide} anchor="gaps" sectionTitle="تحليل الفجوات" />
      <TaInput value={formData.gap_analysis} onChange={v => set('gap_analysis', v)}
        placeholder="ما الفجوة بين الاحتياجات الفعلية والخدمات المتاحة حالياً؟" rows={3} disabled={disabled} />
    </div>
  );
}

/* ─────────────── 4. مصفوفة TOWS ─────────────── */
function TowsTemplate({ formData, set, disabled, guide }) {
  const tows = formData.tows || {};
  const update = (k, v) => set('tows', { ...tows, [k]: v });

  const cells = [
    { key: 'so', title: 'SO — استراتيجيات القوة والفرص',       sub: 'كيف نستخدم نقاط القوة لاستثمار الفرص؟',       color: '#0B7F5D', bg: '#E8F8F2' },
    { key: 'wo', title: 'WO — استراتيجيات الضعف والفرص',       sub: 'كيف نعالج نقاط الضعف لاستثمار الفرص؟',        color: '#1F74C4', bg: '#EAF4FD' },
    { key: 'st', title: 'ST — استراتيجيات القوة والتهديدات',    sub: 'كيف نستخدم نقاط القوة لمواجهة التهديدات؟',    color: '#A33F12', bg: '#FEF3EC' },
    { key: 'wt', title: 'WT — استراتيجيات الضعف والتهديدات',   sub: 'كيف نتجنب التهديدات في ظل نقاط الضعف؟',       color: '#C53A3A', bg: '#FCEBEB' },
  ];

  return (
    <div>
      <SectionTitle>مصفوفة TOWS (التحليل المتقاطع)</SectionTitle>
      <GuideBlocks guide={guide} anchor="top" sectionTitle="مصفوفة TOWS (التحليل المتقاطع) التحليل الاستراتيجي" />
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 10 }}>
        {cells.map(c => {
          const tip = resolveTip(guide, c.key, c.key.toUpperCase());
          return (
          <div key={c.key} style={{ border: `2px solid ${c.color}25`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '9px 12px', background: c.bg }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.color, display: 'flex', alignItems: 'center', gap: 2 }}>
                {c.title}
                {tip && <InfoTip text={tip.text} example={tip.example} title={tip.example?.title} label={c.key.toUpperCase()} />}
              </div>
              <div style={{ fontSize: 11, color: '#8C97A3', marginTop: 2 }}>{c.sub}</div>
            </div>
            <TaInput value={tows[c.key]} onChange={v => update(c.key, v)} placeholder="اكتب الاستراتيجيات هنا..." rows={5} disabled={disabled} />
          </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── 5. المبادرات الاستراتيجية ─────────────── */
/** أخطاء بطاقة مبادرة واحدة: تاريخ نهاية يسبق البداية، أو ميزانية ليست رقمًا ≥ 0 (تُعرض بجوار الخانة وفي قائمة الإرسال) */
export function initiativeIssues(row = {}) {
  const issues = {};
  const has = v => (v || '').trim().length > 0;
  if (has(row.start_date) && has(row.end_date) && row.end_date < row.start_date) issues.end_date = 'يجب أن يوافق تاريخ النهاية تاريخ البداية أو يأتي بعده';
  if (!isNonNegativeAmount(row.budget)) issues.budget = AMOUNT_MSG;
  return issues;
}
const FieldError = ({ text }) => text ? <div role="alert" style={{ fontSize: 11, color: '#C53A3A', marginTop: 4, lineHeight: 1.6 }}>{text}</div> : null;

function InitiativesTemplate({ formData, set, disabled, guide }) {
  // FieldBox بعنوان وتوضيح ⓘ (مكوّن على مستوى الملف حتى لا تفقد الحقول التركيز أثناء الكتابة)
  const FieldBox = FieldBoxTip;
  const fb = { guide, anchor: 'top' };
  const init = formData.initiatives || [emptyInit()];

  function emptyInit() {
    return { name: '', goal: '', description: '', outputs: '', budget: '', start_date: '', end_date: '', owner: '' };
  }

  const updateRow = (i, k, v) => {
    const arr = [...init];
    arr[i] = { ...arr[i], [k]: v };
    set('initiatives', arr);
  };
  const addRow    = () => set('initiatives', [...init, emptyInit()]);
  const removeRow = i  => set('initiatives', init.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SectionTitle style={{ margin: 0 }}>المبادرات الاستراتيجية</SectionTitle>
        {!disabled && (
          <button onClick={addRow} style={{ padding: '6px 14px', background: colors.primary, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "inherit" }}>
            + إضافة مبادرة
          </button>
        )}
      </div>
      <GuideBlocks guide={guide} anchor="top" sectionTitle="المبادرات الاستراتيجية" />

      {init.map((row, i) => { const issues = initiativeIssues(row); return (
        <div key={i} style={{ background: '#FBF9F5', border: `1.5px solid ${colors.primary}20`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>مبادرة {i + 1}</div>
            {!disabled && init.length > 1 && (
              <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: '#C53A3A', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 10 }}>
            <FieldBox {...fb} label="اسم المبادرة">
              <TextInput value={row.name} onChange={v => updateRow(i, 'name', v)} placeholder="اسم المبادرة" disabled={disabled} />
            </FieldBox>
            <FieldBox {...fb} label="الهدف الاستراتيجي المرتبط">
              <TextInput value={row.goal} onChange={v => updateRow(i, 'goal', v)} placeholder="الهدف" disabled={disabled} />
            </FieldBox>
            <FieldBox {...fb} label="وصف المبادرة" style={{ gridColumn: '1 / -1' }}>
              <TaInput value={row.description} onChange={v => updateRow(i, 'description', v)} placeholder="صف المبادرة بالتفصيل..." rows={2} disabled={disabled} />
            </FieldBox>
            <FieldBox {...fb} label="المخرجات المتوقعة">
              <TextInput value={row.outputs} onChange={v => updateRow(i, 'outputs', v)} placeholder="ما الذي ستنتجه هذه المبادرة؟" disabled={disabled} />
            </FieldBox>
            <FieldBox {...fb} label="الميزانية التقديرية (ريال)">
              <TextInput value={row.budget} onChange={v => updateRow(i, 'budget', v)} placeholder="50,000" disabled={disabled} />
              <FieldError text={issues.budget} />
            </FieldBox>
            <FieldBox {...fb} label="تاريخ البداية">
              <input type="date" value={row.start_date || ''} onChange={e => updateRow(i, 'start_date', e.target.value)} disabled={disabled}
                style={{ width: '100%', padding: '7px 10px', border: `1px solid ${disabled ? '#F3EFE8' : '#E8E3DA'}`, borderRadius: 6, fontSize: 12, fontFamily: "inherit", direction: 'rtl', boxSizing: 'border-box', background: disabled ? '#FBF9F5' : '#fff' }} />
            </FieldBox>
            <FieldBox {...fb} label="تاريخ النهاية">
              <input type="date" value={row.end_date || ''} min={row.start_date || undefined} onChange={e => updateRow(i, 'end_date', e.target.value)} disabled={disabled} aria-label={`تاريخ النهاية — مبادرة ${i + 1}`}
                style={{ width: '100%', padding: '7px 10px', border: `1px solid ${issues.end_date ? '#E88E8E' : disabled ? '#F3EFE8' : '#E8E3DA'}`, borderRadius: 6, fontSize: 12, fontFamily: "inherit", direction: 'rtl', boxSizing: 'border-box', background: disabled ? '#FBF9F5' : '#fff' }} />
              <FieldError text={issues.end_date} />
            </FieldBox>
            <FieldBox {...fb} label="المسؤول">
              <TextInput value={row.owner} onChange={v => updateRow(i, 'owner', v)} placeholder="اسم المسؤول..." disabled={disabled} />
            </FieldBox>
          </div>
        </div>
      ); })}
    </div>
  );
}

/* ─────────────── 6. التوجهات الاستراتيجية ─────────────── */
function DirectionsTemplate({ formData, set, disabled, guide }) {
  const d = formData.directions || {};
  const update = (k, v) => set('directions', { ...d, [k]: v });
  const values = formData.values_list || [];
  const goals  = formData.goals_list  || [''];

  const addValue = () => {
    const v = prompt('أدخل القيمة الجديدة:');
    if (v) set('values_list', [...values, v]);
  };
  const removeValue = i => set('values_list', values.filter((_, idx) => idx !== i));
  const updateGoal  = (i, v) => { const arr = [...goals]; arr[i] = v; set('goals_list', arr); };
  const addGoal     = () => set('goals_list', [...goals, '']);
  const removeGoal  = i => set('goals_list', goals.filter((_, idx) => idx !== i));

  return (
    <div>
      <GuideBlocks guide={guide} anchor="top" />
      <SectionTitleTip guide={guide} anchor="vision" label="الرؤية" />
      <GuideBlocks guide={guide} anchor="vision" />
      <TaInput value={d.vision} onChange={v => update('vision', v)} placeholder="أن نكون المنظمة الرائدة في..." rows={2} disabled={disabled} />

      <SectionTitleTip guide={guide} anchor="mission" label="الرسالة" />
      <GuideBlocks guide={guide} anchor="mission" />
      <TaInput value={d.mission} onChange={v => update('mission', v)} placeholder="نعمل على تقديم... لفئة... من خلال..." rows={2} disabled={disabled} />

      <SectionTitleTip guide={guide} anchor="values" label="القيم" />
      <div style={{ fontSize: 12, color: '#5E6B78', marginBottom: 8, lineHeight: 1.7 }}>يمكنك حفظ المسودة قبل إضافة القيم. لإضافة قيمة تعبّر عن منظمتك، اضغط على «إضافة قيمة».</div>
      <GuideBlocks guide={guide} anchor="values" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {values.map((val, i) => (
          <span key={i} style={{ padding: '5px 14px', borderRadius: 20, background: '#FEF3EC', color: colors.amberText, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #FBC3A3' }}>
            {val}
            {!disabled && <button onClick={() => removeValue(i)} style={{ background: 'none', border: 'none', color: '#C53A3A', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>}
          </span>
        ))}
        {!disabled && (
          <button onClick={addValue} style={{ padding: '5px 14px', borderRadius: 20, background: '#F3EFE8', color: '#5E6B78', fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: "inherit" }}>
            + إضافة قيمة
          </button>
        )}
      </div>
      {values.length === 0 && <div style={{ fontSize: 12, color: '#8C97A3', marginBottom: 8 }}>مثال: الشفافية، الإتقان، العمل الجماعي، الابتكار</div>}

      <SectionTitleTip guide={guide} anchor="goals" label="الأهداف الاستراتيجية" />
      <GuideBlocks guide={guide} anchor="goals" />
      {goals.map((g, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <TextInput value={g} onChange={v => updateGoal(i, v)} placeholder="اكتب الهدف الاستراتيجي..." disabled={disabled} />
          </div>
          {!disabled && goals.length > 1 && (
            <button onClick={() => removeGoal(i)} style={{ background: 'none', border: 'none', color: '#C53A3A', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>✕</button>
          )}
        </div>
      ))}
      {!disabled && (
        <button onClick={addGoal} style={{ padding: '7px 16px', background: 'transparent', border: `1.5px dashed ${colors.primary}`, color: colors.primary, borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: "inherit", fontWeight: 600 }}>
          + إضافة هدف
        </button>
      )}
    </div>
  );
}

/* ─────────────── 7. نظرية التغيير ─────────────── */
function TocTemplate({ formData, set, disabled, guide }) {
  const t = formData.toc || {};
  const update = (k, v) => set('toc', { ...t, [k]: v });
  const impactId = useId();
  // التعليمات تقول «ابدأ بخانة الأثر» وهي آخر خانة في السلسلة (خارج الشاشة على الجوال): الزر يُظهرها وينقل المؤشر إليها
  const focusImpact = () => {
    const el = document.getElementById(impactId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    setTimeout(() => el.focus({ preventScroll: true }), 350);
  };

  const stages = [
    { key: 'inputs',     title: 'المدخلات',  color: '#33769C', placeholder: 'الموارد البشرية\nالموارد المالية\nالبنية التحتية' },
    { key: 'activities', title: 'الأنشطة',   color: colors.primary,  placeholder: 'برامج تدريب\nحملات توعية\nخدمات مباشرة' },
    { key: 'outputs',    title: 'المخرجات',  color: '#1F74C4', placeholder: 'عدد المستفيدين\nبرامج منفذة\nمواد منشورة' },
    { key: 'outcomes',   title: 'النتائج',   color: colors.amberText, placeholder: 'تحسن المعرفة\nتغير السلوك\nزيادة الوعي' },
    { key: 'impact',     title: 'الأثر',     color: '#0B7F5D', placeholder: 'تحسن نوعية الحياة\nتمكين المجتمع' },
  ];

  return (
    <div>
      <GuideBlocks guide={guide} anchor="top" />
      <SectionTitleTip guide={guide} anchor="chain" label="سلسلة نظرية التغيير" />
      <GuideBlocks guide={guide} anchor="chain" />
      {!disabled && (
        <button type="button" onClick={focusImpact} style={{ ...addBtnStyle, marginBottom: 10 }}>ابدأ بخانة الأثر ←</button>
      )}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, alignItems: 'stretch' }}>
        {stages.map((s, i) => (
          <React.Fragment key={s.key}>
            <div style={{ flex: 1, minWidth: 140, border: `2px solid ${s.color}30`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '7px 10px', background: `${s.color}15`, fontWeight: 700, fontSize: 12, color: s.color, textAlign: 'center' }}><Lbl guide={guide} anchor="chain" label={s.title} /></div>
              <TaInput id={s.key === 'impact' ? impactId : undefined} value={t[s.key]} onChange={v => update(s.key, v)} placeholder={s.placeholder} rows={5} disabled={disabled} />
            </div>
            {i < stages.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 22, color: colors.amberText, fontWeight: 700, flexShrink: 0, paddingBottom: 8 }}>←</div>
            )}
          </React.Fragment>
        ))}
      </div>

      <SectionTitleTip guide={guide} anchor="assumptions" label="الافتراضات الأساسية" />
      <GuideBlocks guide={guide} anchor="assumptions" />
      <TaInput value={t.assumptions} onChange={v => update('assumptions', v)} placeholder="ما الشروط التي يجب توفرها لنجاح نظرية التغيير؟" rows={3} disabled={disabled} />
    </div>
  );
}

/* BmcCell مُعرَّف خارج BmcTemplate تماماً لمنع إعادة الإنشاء عند كل render */
function BmcCell({ block, accent, value, onChange, disabled, guide }) {
  return (
    <div style={{ border: '1.5px solid #E8E3DA', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '5px 8px', background: accent ? colors.amber : colors.primary, color: accent ? '#0E2A3D' : '#fff', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>
        {guide ? <Lbl guide={guide} anchor="top" label={block.t} /> : block.t}
      </div>
      <TaInput value={value} onChange={onChange} placeholder={block.p} rows={3} disabled={disabled} />
    </div>
  );
}

const BMC_ROW1 = [
  { key: 'customer_segments', t: 'شرائح المستفيدين',     p: 'من هم المستفيدون؟' },
  { key: 'relationships',     t: 'العلاقة مع المستفيدين', p: 'كيف نتواصل معهم؟' },
  { key: 'value_proposition', t: 'القيمة المقترحة للمستفيدين', p: 'ما المنفعة التي يحصل عليها المستفيد من خدمات منظمتك؟' },
  { key: 'key_activities',    t: 'الأنشطة الرئيسة',       p: 'ما الأنشطة الأساسية؟' },
  { key: 'partners',          t: 'الشراكات الرئيسة',      p: 'من الشركاء؟' },
];
const BMC_ROW2 = [
  { key: 'channels',      t: 'القنوات',          p: 'كيف نوصل الخدمات؟' },
  { key: 'key_resources', t: 'الموارد الأساسية', p: 'ما الموارد المطلوبة؟' },
];
const BMC_ROW3 = [
  { key: 'revenue_streams', t: 'مصادر الدخل',    p: 'تبرعات، منح، رسوم...' },
  { key: 'cost_structure',  t: 'هيكل التكاليف',  p: 'رواتب، إيجار، برامج...' },
];

/* ─────────────── 8. نموذج العمل (BMC) ─────────────── */
function BmcTemplate({ formData, set, disabled, guide }) {
  const b      = formData.bmc || {};
  const update = (k, v) => set('bmc', { ...formData.bmc, [k]: v });

  return (
    <div>
      <SectionTitle>نموذج عمل المنظمة (Business Model Canvas)</SectionTitle>
      <GuideBlocks guide={guide} anchor="top" sectionTitle="نموذج عمل المنظمة (Business Model Canvas)" />
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-5)', gap: 6, marginBottom: 6 }}>
        {BMC_ROW1.map(bl => (
          <BmcCell key={bl.key} guide={guide} block={bl} value={b[bl.key]} onChange={v => update(bl.key, v)} disabled={disabled} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 6, marginBottom: 6 }}>
        {BMC_ROW2.map(bl => (
          <BmcCell key={bl.key} guide={guide} block={bl} value={b[bl.key]} onChange={v => update(bl.key, v)} disabled={disabled} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 6 }}>
        {BMC_ROW3.map(bl => (
          <BmcCell key={bl.key} guide={guide} block={bl} accent value={b[bl.key]} onChange={v => update(bl.key, v)} disabled={disabled} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────── 9. مؤشرات الأداء ─────────────── */
function KpisTemplate({ formData, set, disabled, guide }) {
  const kpis = formData.kpis || [emptyKpi()];
  const isPhone = useIsPhone();

  function emptyKpi() {
    return { name: '', goal: '', target: '', measurement: '', frequency: '', owner: '' };
  }

  const updateRow = (i, k, v) => { const arr = [...kpis]; arr[i] = { ...arr[i], [k]: v }; set('kpis', arr); };
  const addRow    = () => set('kpis', [...kpis, emptyKpi()]);
  const removeRow = i  => set('kpis', kpis.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <SectionTitle style={{ margin: 0 }}>جدول مؤشرات الأداء</SectionTitle>
        {!disabled && (
          <button onClick={addRow} style={{ padding: '6px 14px', background: colors.primary, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "inherit" }}>
            + إضافة مؤشر
          </button>
        )}
      </div>
      <GuideBlocks guide={guide} anchor="top" sectionTitle="جدول مؤشرات الأداء" />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <Th guide={guide} anchor="top" label="المؤشر" style={stickyTh} />
              <Th guide={guide} anchor="top" label="الهدف المرتبط" />
              <Th guide={guide} anchor="top" label="المستهدف" />
              <Th guide={guide} anchor="top" label="طريقة القياس" />
              <Th guide={guide} anchor="top" label="التكرار" />
              <Th guide={guide} anchor="top" label="المسؤول" />
              {!disabled && <th style={{ ...thStyle, width: 32 }}></th>}
            </tr>
          </thead>
          <tbody>
            {kpis.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F3EFE8' }}>
                <td style={{ ...tdStyle, ...stickyTd, background: '#fff', minWidth: 150 }}><TextInput value={row.name}        onChange={v => updateRow(i, 'name',        v)} placeholder="اسم المؤشر"         disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={row.goal}        onChange={v => updateRow(i, 'goal',        v)} placeholder="الهدف المرتبط"       disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={row.target}      onChange={v => updateRow(i, 'target',      v)} placeholder="الهدف الرقمي"        disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={row.measurement} onChange={v => updateRow(i, 'measurement', v)} placeholder="الطريقة"            disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={row.frequency}   onChange={v => updateRow(i, 'frequency',   v)} placeholder="شهري / ربعي"        disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={row.owner}       onChange={v => updateRow(i, 'owner',       v)} placeholder="المسؤول"             disabled={disabled} /></td>
                {!disabled && (
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    {kpis.length > 1 && (
                      <button type="button" onClick={() => removeRow(i)} aria-label={`حذف مؤشر: ${row.name || `الصف ${i + 1}`}`} title={`حذف مؤشر: ${row.name || `الصف ${i + 1}`}`}
                        style={{ background: 'none', border: isPhone ? '1px solid #F1B2B2' : 'none', borderRadius: 6, color: '#C53A3A', cursor: 'pointer', fontSize: isPhone ? 11 : 16, padding: isPhone ? '3px 8px' : 0, fontFamily: 'inherit' }}>
                        {isPhone ? `حذف مؤشر: ${row.name || `الصف ${i + 1}`}` : '✕'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────── 10. الهيكل التنظيمي ─────────────── */
// الصف الأول المقترح عند أول فتح؛ يُحفظ كما هو بعد مراجعته أو يُعدَّل
export const ORG_SUGGESTED_POSITIONS = [{ title: 'المدير التنفيذي', dept: 'الإدارة العليا', reports_to: '' }];

function OrgchartTemplate({ formData, set, disabled, guide }) {
  const suggested = !Array.isArray(formData.positions);
  const positions = suggested ? ORG_SUGGESTED_POSITIONS : formData.positions;
  const updatePos = (i, k, v) => { const arr = [...positions]; arr[i] = { ...arr[i], [k]: v }; set('positions', arr); };
  const addPos    = () => set('positions', [...positions, { title: '', dept: '', reports_to: '' }]);
  const removePos = i  => set('positions', positions.filter((_, idx) => idx !== i));

  // تغيير مسمى مسؤول له وظائف تابعة: نعرض خيار تحديث «يتبع لـ» في الوظائف التابعة حتى لا ينقسم الرسم إلى هيكلين
  const focusTitle = useRef({});
  const [renamePrompt, setRenamePrompt] = useState(null);
  const onTitleFocus = (i) => { focusTitle.current[i] = norm(positions[i]?.title); };
  const onTitleBlur = (i) => {
    const before = focusTitle.current[i];
    const after = norm(positions[i]?.title);
    if (!before || before === after) return;
    const dependents = positions.filter((p, idx) => idx !== i && norm(p.reports_to) === before).length;
    if (dependents > 0) setRenamePrompt({ from: before, to: after, count: dependents });
  };
  const applyRename = () => {
    if (!renamePrompt) return;
    set('positions', positions.map(p => (norm(p.reports_to) === renamePrompt.from ? { ...p, reports_to: renamePrompt.to } : p)));
    setRenamePrompt(null);
  };

  const { roots, issues } = useMemo(() => buildOrgTree(positions), [positions]);
  const issueCount = Object.keys(issues).length;

  return (
    <div>
      <SectionTitle>الهيكل التنظيمي</SectionTitle>
      <GuideBlocks guide={guide} anchor="top" sectionTitle="الهيكل التنظيمي" />
      {suggested && !disabled && (
        <div role="note" style={{ background: '#EAF4FD', border: '1px solid #A9D2F5', borderRadius: 8, padding: '9px 14px', marginBottom: 12, fontSize: 12.5, color: '#1A65AD', lineHeight: 1.8 }}>
          راجع بيانات المدير التنفيذي، ثم احتفظ بالصف أو عدّله بما يناسب منظمتك. أضف بقية الوظائف وحدّد لكل منها «يتبع لـ».
        </div>
      )}
      {renamePrompt && (
        <div role="dialog" aria-label="تحديث الوظائف التابعة" style={{ background: '#FEF3EC', border: '1px solid #FBC3A3', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12.5, color: '#7F310E', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: '1 1 260px' }}>غيّرت مسمى «{renamePrompt.from}» إلى «{renamePrompt.to}» وتتبع له {renamePrompt.count === 1 ? 'وظيفة واحدة' : `${renamePrompt.count} وظائف`}. هل تريد تحديث المسمى في الوظائف التابعة أيضًا؟</span>
          <button type="button" onClick={applyRename} style={{ background: colors.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>تحديث الوظائف التابعة</button>
          <button type="button" onClick={() => setRenamePrompt(null)} style={{ background: '#fff', border: '1px solid #E8E3DA', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#334452' }}>تعديل هذا الصف فقط</button>
        </div>
      )}

      {/* الخريطة التنظيمية — تُشتق من الجدول وتتحدّث مع كل تعديل */}
      <div style={{ background: '#FBF9F5', borderRadius: 10, padding: '18px 10px', marginBottom: 16, overflowX: 'auto' }}>
        {roots.length > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 18, minWidth: 'fit-content', margin: '0 auto' }}>
            {roots.map(r => <OrgNode key={r.key} node={r} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#8C97A3' }}>أضف الوظائف في الجدول لتظهر الخريطة التنظيمية.</div>
        )}
        {issueCount > 0 && (
          <div style={{ marginTop: 12, fontSize: 11.5, color: '#7F310E', textAlign: 'center' }}>
            <DfIcon name="warning" size={18} style={{ marginInlineEnd: 6 }} />{issueCount === 1 ? 'وظيفة واحدة لم تُرسم' : `${issueCount} وظائف لم تُرسم`} لعدم وضوح التبعية — راجع التنبيه عند الصف في الجدول.
          </div>
        )}
      </div>

      {/* جدول المناصب */}
      <div style={{ overflowX: 'auto', marginBottom: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <Th guide={guide} anchor="top" label="المسمى الوظيفي" style={stickyTh} />
              <Th guide={guide} anchor="top" label="القسم" />
              <Th guide={guide} anchor="top" label="يتبع لـ" />
              {!disabled && <th style={{ ...thStyle, width: 32 }}></th>}
            </tr>
          </thead>
          <tbody>
            {positions.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F3EFE8' }}>
                <td style={{ ...tdStyle, ...stickyTd, background: '#fff', minWidth: 150 }} onFocus={() => onTitleFocus(i)} onBlur={() => onTitleBlur(i)}><TextInput value={p.title}     onChange={v => updatePos(i, 'title',     v)} placeholder="المسمى الوظيفي" disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={p.dept}      onChange={v => updatePos(i, 'dept',      v)} placeholder="اسم القسم"       disabled={disabled} /></td>
                <td style={tdStyle}>
                  <TextInput value={p.reports_to} onChange={v => updatePos(i, 'reports_to', v)} placeholder="يتبع لـ..." disabled={disabled} />
                  {issues[i] && <div style={{ fontSize: 10.5, color: '#7F310E', marginTop: 3, lineHeight: 1.6 }}><DfIcon name="warning" size={14} style={{ marginInlineEnd: 6 }} />{issues[i]}</div>}
                </td>
                {!disabled && (
                  <td style={tdStyle}>
                    {positions.length > 1 && <button onClick={() => removePos(i)} style={{ background: 'none', border: 'none', color: '#C53A3A', cursor: 'pointer', fontSize: 16 }}>✕</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!disabled && (
        <button onClick={addPos} style={{ padding: '7px 16px', background: 'transparent', border: `1.5px dashed ${colors.primary}`, color: colors.primary, borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: "inherit", fontWeight: 600 }}>
          + إضافة وظيفة
        </button>
      )}
    </div>
  );
}

/* ─────────────── 11. الوثيقة الاستراتيجية ─────────────── */
// ترتيب المراحل في الشريط (من اليمين إلى اليسار) بعد إعادة ترتيب الوحدات، مع إبقاء «الملخص التنفيذي» أولًا
export const DOCUMENT_STAGES = [
  'الملخص التنفيذي',
  'تحليل البيئة الداخلية', 'تحليل البيئة الخارجية', 'دراسة الاحتياجات المجتمعية', 'بناء نظرية التغيير',
  'التحليل الاستراتيجي', 'التوجهات الاستراتيجية', 'المبادرات الاستراتيجية', 'نموذج عمل المنظمة',
  'مؤشرات الأداء', 'الهيكل التنظيمي',
];

function DocumentTemplate({ formData, set, disabled, guide, context }) {
  const doc = formData.document || {};
  const update = (k, v) => set('document', { ...doc, [k]: v });
  // فترة الخطة الفعلية (من تواريخ المبادرات الاستراتيجية) بدل تاريخ ثابت
  const period = context.plan_period;

  const sections = [
    { key: 'executive_summary', label: 'الملخص التنفيذي',          placeholder: 'ملخص شامل للخطة الاستراتيجية...' },
    { key: 'key_findings',      label: 'أبرز النتائج والتحليلات',  placeholder: 'أهم ما توصلت إليه من التحليلات...' },
    { key: 'implementation',    label: 'الخطة التنفيذية (ملخص)',    placeholder: 'الخطوات التنفيذية الرئيسية والجدول الزمني...' },
    { key: 'monitoring',        label: 'آلية المتابعة والتقييم',    placeholder: 'كيفية متابعة تنفيذ الخطة وقياس النتائج...' },
    { key: 'closing_notes',     label: 'ملاحظات ختامية',           placeholder: 'توصيات أو ملاحظات إضافية...' },
  ];

  return (
    <div>
      {/* معاينة */}
      <div style={{ border: `2px solid #E8E3DA`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '20px 24px', background: `linear-gradient(135deg, ${colors.primary}, ${colors.ink})`, color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>خطة استراتيجية</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            الخطة الاستراتيجية
            {period && (
              <>
                {' '}
                <span style={{ direction: 'ltr', unicodeBidi: 'isolate', display: 'inline-block' }}>
                  {period.start === period.end ? period.start : `${period.start}–${period.end}`}
                </span>
              </>
            )}
          </div>
          {!period && <div style={{ fontSize: 10.5, opacity: 0.75, marginTop: 4 }}>تظهر فترة الخطة من تواريخ البداية والنهاية في المبادرات الاستراتيجية</div>}
        </div>
        <div style={{ padding: '14px 20px', background: '#FBF9F5', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DOCUMENT_STAGES.map((s, i) => {
            const openable = i > 0 && typeof context.openUnitPreview === 'function';
            return openable ? (
              <button key={i} type="button" onClick={() => context.openUnitPreview(s)} title={`عرض مخرجات «${s}» المحفوظة`}
                style={{ fontSize: 11, color: colors.primary, padding: '3px 8px', background: '#CFE5FA', borderRadius: 4, border: '1px solid transparent', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline dotted' }}>
                {`${i}. `}{s}
              </button>
            ) : (
              <span key={i} style={{ fontSize: 11, color: colors.primary, padding: '3px 8px', background: '#CFE5FA', borderRadius: 4 }}>
                {i > 0 ? `${i}. ` : ''}{s}
              </span>
            );
          })}
        </div>
        {typeof context.openUnitPreview === 'function' && (
          <div style={{ padding: '0 20px 12px', background: '#FBF9F5', fontSize: 11.5, color: '#5E6B78' }}>اضغط اسم أي وحدة لعرض ما حفظته فيها دون مغادرة هذا النموذج.</div>
        )}
      </div>

      <GuideBlocks guide={guide} anchor="top" />

      {/* حقول الإدخال */}
      {sections.map(s => (
        <div key={s.key} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>
            <Lbl guide={guide} anchor="top" label={s.label} />
            {s.key === 'closing_notes' && <span style={{ fontSize: 11, fontWeight: 400, color: '#8C97A3' }}> (اختياري)</span>}
          </div>
          <TaInput value={doc[s.key]} onChange={v => update(s.key, v)} placeholder={s.placeholder} rows={4} disabled={disabled} />
        </div>
      ))}
    </div>
  );
}

/* ─── Generic fallback ─── */
function GenericTemplate({ formData, set, disabled }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>محتوى الوحدة</div>
      <TaInput value={formData.content} onChange={v => set('content', v)} placeholder="اكتب محتوى العمل هنا..." rows={10} disabled={disabled} />
    </div>
  );
}

/* ─── Helper components ─── */
const FieldBoxTip = ({ guide, anchor, label, children, style }) => (
  <div style={style}>
    <div style={{ fontSize: 12, fontWeight: 600, color: '#334452', marginBottom: 4 }}><Lbl guide={guide} anchor={anchor} label={label} /></div>
    {children}
  </div>
);

/* ─────────────── خريطة مواضع التعليمات والحقول (يستخدمها محرر لوحة التحكم) ───────────────
 * anchors: المواضع التي تُعرض فيها إطارات التعليمات (GuideBlocks) في كل نموذج.
 * fields : الحقول التي يمكن أن تحمل توضيح ⓘ (resolveTip)، وهل يمكن تغيير اسمها الظاهر (rename).
 *          rows: true = أسماء صفوف الجدول من unit.table_rows.
 * يجب تحديثها عند إضافة حقل أو موضع جديد في النماذج أعلاه.
 */
const F = (anchor, label, extra = {}) => ({ anchor, label, renamable: true, ...extra });
export const GUIDE_SPEC = {
  swot: {
    anchors: { table: 'أعلى جدول «تحليل الموارد الداخلية»', summary: `أعلى «${SWOT_SUMMARY_TITLE}»` },
    fields: [
      F('table', 'العنصر'), F('table', 'نقاط القوة'), F('table', 'نقاط الضعف'), F('table', 'ملاحظات'),
      { anchor: 'table', rows: true, renamable: true },
      F('summary', SWOT_SUMMARY_TITLE, { renamable: false }),
      F('summary', 'نقاط القوة', { suffix: ' (S)' }), F('summary', 'نقاط الضعف', { suffix: ' (W)' }),
      F('summary', 'فرص التحسين', { suffix: ' (O)' }), F('summary', 'المخاطر الداخلية', { suffix: ' (T)' }),
    ],
  },
  pestel: {
    anchors: { pestel: 'جدول «تحليل PESTEL» (أزرار الأمثلة تظهر أسفل الجدول)', stakeholders: 'جدول «خريطة أصحاب المصلحة» (أزرار الأمثلة تظهر أسفل الجدول)' },
    fields: [
      F('pestel', 'العامل'), F('pestel', 'وصف العامل'), F('pestel', 'التأثير'), F('pestel', 'المستوى'),
      F('stakeholders', 'صاحب المصلحة'), F('stakeholders', 'مستوى التأثير'), F('stakeholders', 'مستوى الاهتمام'), F('stakeholders', 'استراتيجية التعامل'),
    ],
  },
  needs: {
    anchors: { top: 'أعلى النموذج', community: '«تعريف المجتمع المستهدف»', needs_table: '«جدول الاحتياجات»', gaps: '«تحليل الفجوات»' },
    fields: [
      F('community', 'تعريف المجتمع المستهدف'),
      F('needs_table', 'جدول الاحتياجات'), F('needs_table', 'الاحتياج'), F('needs_table', 'الوصف'), F('needs_table', 'الأولوية'), F('needs_table', 'المصدر'),
      F('gaps', 'تحليل الفجوات'),
    ],
  },
  tows: {
    anchors: { top: 'أعلى «مصفوفة TOWS»' },
    fields: [
      F('so', 'SO', { renamable: false, title: 'SO — استراتيجيات القوة والفرص' }),
      F('wo', 'WO', { renamable: false, title: 'WO — استراتيجيات الضعف والفرص' }),
      F('st', 'ST', { renamable: false, title: 'ST — استراتيجيات القوة والتهديدات' }),
      F('wt', 'WT', { renamable: false, title: 'WT — استراتيجيات الضعف والتهديدات' }),
    ],
  },
  initiatives: {
    anchors: { top: 'أعلى «المبادرات الاستراتيجية»' },
    fields: ['اسم المبادرة', 'الهدف الاستراتيجي المرتبط', 'وصف المبادرة', 'المخرجات المتوقعة', 'الميزانية التقديرية (ريال)', 'تاريخ البداية', 'تاريخ النهاية', 'المسؤول'].map(l => F('top', l)),
  },
  directions: {
    anchors: { top: 'أعلى النموذج', vision: '«الرؤية»', mission: '«الرسالة»', values: '«القيم»', goals: '«الأهداف الاستراتيجية»' },
    fields: [F('vision', 'الرؤية'), F('mission', 'الرسالة'), F('values', 'القيم'), F('goals', 'الأهداف الاستراتيجية')],
  },
  toc: {
    anchors: { top: 'أعلى النموذج', chain: '«سلسلة نظرية التغيير»', assumptions: '«الافتراضات الأساسية»' },
    fields: [
      F('chain', 'سلسلة نظرية التغيير'),
      ...['المدخلات', 'الأنشطة', 'المخرجات', 'النتائج', 'الأثر'].map(l => F('chain', l)),
      F('assumptions', 'الافتراضات الأساسية'),
    ],
  },
  bmc: {
    anchors: { top: 'أعلى «نموذج عمل المنظمة»' },
    fields: [...BMC_ROW1, ...BMC_ROW2, ...BMC_ROW3].map(b => F('top', b.t)),
  },
  kpis: {
    anchors: { top: 'أعلى «جدول مؤشرات الأداء»' },
    fields: ['المؤشر', 'الهدف المرتبط', 'المستهدف', 'طريقة القياس', 'التكرار', 'المسؤول'].map(l => F('top', l)),
  },
  orgchart: {
    anchors: { top: 'أعلى «الهيكل التنظيمي»' },
    fields: ['المسمى الوظيفي', 'القسم', 'يتبع لـ'].map(l => F('top', l)),
  },
  document: {
    anchors: { top: 'أعلى حقول «الوثيقة الاستراتيجية»' },
    fields: ['الملخص التنفيذي', 'أبرز النتائج والتحليلات', 'الخطة التنفيذية (ملخص)', 'آلية المتابعة والتقييم', 'ملاحظات ختامية'].map(l => F('top', l)),
  },
};

/** حقول نموذج الوحدة بعد توسيع صفوف الجدول (للمحرر) */
export const guideFields = unit => (GUIDE_SPEC[unit?.template_type]?.fields || []).flatMap(f =>
  f.rows ? (unit.table_rows || []).map(r => ({ anchor: f.anchor, label: r, renamable: f.renamable })) : [f]);
