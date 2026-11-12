import React, { useEffect, useMemo } from 'react';
import { formGuide, GuideBlocks, GuideExamples, LabelWithTip, InfoTip } from './UnitContent';
import { buildOrgTree, OrgNode } from './OrgChart';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

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
  <div style={{ fontSize: 14, fontWeight: 700, color: colors.teal, marginBottom: 10, marginTop: 20 }}>{children}</div>
);

const TaInput = ({ value, onChange, placeholder, rows = 3, disabled }) => (
  <textarea
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    disabled={disabled}
    style={{
      width: '100%', padding: '8px 10px', border: `1px solid ${disabled ? '#f3f4f6' : '#e5e7eb'}`,
      borderRadius: 6, fontSize: 12, fontFamily: "'Cairo', sans-serif",
      resize: 'vertical', direction: 'rtl', boxSizing: 'border-box', lineHeight: 1.7,
      background: disabled ? '#f9fafb' : '#fff',
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
      width: '100%', padding: '7px 10px', border: `1px solid ${disabled ? '#f3f4f6' : '#e5e7eb'}`,
      borderRadius: 6, fontSize: 12, fontFamily: "'Cairo', sans-serif",
      direction: 'rtl', boxSizing: 'border-box',
      background: disabled ? '#f9fafb' : '#fff',
    }}
  />
);

const SelectInput = ({ value, onChange, options, disabled }) => (
  <select
    value={value || options[0]}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    style={{
      width: '100%', padding: '7px 10px', border: `1px solid ${disabled ? '#f3f4f6' : '#e5e7eb'}`,
      borderRadius: 6, fontSize: 12, fontFamily: "'Cairo', sans-serif",
      direction: 'rtl', boxSizing: 'border-box',
      background: disabled ? '#f9fafb' : '#fff', cursor: disabled ? 'default' : 'pointer',
    }}
  >
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const thStyle = {
  padding: '9px 10px', background: colors.teal, color: '#fff',
  fontSize: 12, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap',
};

/** عنوان عمود/حقل مع ⓘ عند وجود توضيح له في المواصفات */
const Th = ({ guide, anchor, label, style }) => (
  <th style={{ ...thStyle, ...style }}>
    <LabelWithTip label={guide.rename(label)} tip={guide.tip(anchor, guide.rename(label))} />
  </th>
);
const Lbl = ({ guide, anchor, label }) => (
  <LabelWithTip label={guide.rename(label)} tip={guide.tip(anchor, guide.rename(label))} />
);
const SectionTitleTip = ({ guide, anchor, label }) => (
  <SectionTitle><Lbl guide={guide} anchor={anchor} label={label} /></SectionTitle>
);

const addBtnStyle = {
  padding: '7px 16px', background: 'transparent', border: `1.5px dashed ${colors.teal}`, color: colors.teal,
  borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 600,
};
const norm = s => (s || '').replace(/\s+/g, ' ').trim();
const tdStyle = { padding: '6px 6px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };
const tdLabelStyle = { ...tdStyle, padding: '8px 10px', fontSize: 12, fontWeight: 600, background: '#f8fafb', whiteSpace: 'nowrap' };

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

  const summaryTip = guide.tip('summary', SWOT_SUMMARY_TITLE);
  const autoBox = (points, empty) => (
    <div style={{ minHeight: 88, padding: '8px 12px', fontSize: 12, lineHeight: 1.9, color: '#374151', background: '#fafafa' }}>
      {points.length > 0
        ? <ul style={{ margin: 0, paddingRight: 16 }}>{points.map((p, i) => <li key={i}>{p}</li>)}</ul>
        : <span style={{ color: '#9ca3af' }}>{empty}</span>}
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
              <Th guide={guide} anchor="table" label="العنصر" />
              <Th guide={guide} anchor="table" label="نقاط القوة" />
              <Th guide={guide} anchor="table" label="نقاط الضعف" />
              <Th guide={guide} anchor="table" label="ملاحظات" />
            </tr>
          </thead>
          <tbody>
            {tableRows.map(row => (
              <tr key={row}>
                <td style={tdLabelStyle}><Lbl guide={guide} anchor="table" label={row} /></td>
                <td style={tdStyle}><TextInput value={tbl[`${row}__strength`]} onChange={v => setTbl(row, 'strength', v)} placeholder="اكتب هنا..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={tbl[`${row}__weakness`]} onChange={v => setTbl(row, 'weakness', v)} placeholder="اكتب هنا..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={tbl[`${row}__notes`]}    onChange={v => setTbl(row, 'notes',    v)} placeholder="ملاحظات..." disabled={disabled} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20, marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.teal, display: 'flex', alignItems: 'center', gap: 2 }}>
          {SWOT_SUMMARY_TITLE}
          {summaryTip && <InfoTip text={summaryTip.text} example={summaryTip.example} title={summaryTip.example?.title} label={SWOT_SUMMARY_TITLE} />}
        </div>
        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>مكيّف للتركيز على البيئة الداخلية للمنظمة</div>
      </div>
      <GuideBlocks guide={guide} anchor="summary" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { key: 'strengths',    label: 'نقاط القوة',       code: 'S', color: '#16a34a', bg: '#f0fdf4', auto: strengths },
          { key: 'weaknesses',   label: 'نقاط الضعف',       code: 'W', color: '#dc2626', bg: '#fef2f2', auto: weaknesses },
          { key: 'opportunities',label: 'فرص التحسين',      code: 'O', color: '#2563eb', bg: '#eff6ff' },
          { key: 'threats',      label: 'المخاطر الداخلية', code: 'T', color: '#d97706', bg: '#fffbeb' },
        ].map(q => (
          <div key={q.key} style={{ border: `2px solid ${q.color}25`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '7px 12px', background: q.bg, fontSize: 13, fontWeight: 600, color: q.color, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span><Lbl guide={guide} anchor="summary" label={q.label} /> ({q.code})</span>
              {q.auto && <span style={{ fontSize: 10.5, fontWeight: 500, color: '#6b7280' }}>تظهر تلقائيًا من الجدول</span>}
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
function PestelTemplate({ formData, set, disabled, unit, guide }) {
  const tableRows = unit.table_rows || ['سياسي', 'اقتصادي', 'اجتماعي', 'تقني', 'بيئي', 'قانوني'];
  const factors = formData.factors || {};
  const stakes  = formData.stakeholders || {};

  const setF = (row, col, v) => set('factors', { ...factors, [`${row}__${col}`]: v });
  const setS = (row, col, v) => set('stakeholders', { ...stakes, [`${row}__${col}`]: v });

  const stakeRows = ['الجهات الحكومية', 'المانحون', 'المستفيدون', 'الموظفون', 'الشركاء'];

  return (
    <div>
      <SectionTitle>تحليل PESTEL</SectionTitle>
      {/* وفق المواصفات: التعليمات فوق الجدول، وزر «عرض مثال مكتمل» أسفله */}
      <GuideBlocks guide={guide} anchor="pestel" sectionTitle="تحليل PESTEL" examplesBelow />
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <Th guide={guide} anchor="pestel" label="العامل" />
              <Th guide={guide} anchor="pestel" label="وصف العامل" />
              <Th guide={guide} anchor="pestel" label="التأثير" />
              <Th guide={guide} anchor="pestel" label="المستوى" />
            </tr>
          </thead>
          <tbody>
            {tableRows.map(row => (
              <tr key={row}>
                <td style={tdLabelStyle}>{row}</td>
                <td style={tdStyle}><TextInput value={factors[`${row}__desc`]}   onChange={v => setF(row, 'desc',   v)} placeholder="وصف العامل..." disabled={disabled} /></td>
                <td style={{ ...tdStyle, minWidth: 90 }}><SelectInput value={factors[`${row}__impact`]} onChange={v => setF(row, 'impact', v)} options={['إيجابي', 'سلبي', 'محايد']} disabled={disabled} /></td>
                <td style={{ ...tdStyle, minWidth: 90 }}><SelectInput value={factors[`${row}__level`]}  onChange={v => setF(row, 'level',  v)} options={['عالي', 'متوسط', 'منخفض']}  disabled={disabled} /></td>
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
              <Th guide={guide} anchor="stakeholders" label="صاحب المصلحة" />
              <Th guide={guide} anchor="stakeholders" label="مستوى التأثير" />
              <Th guide={guide} anchor="stakeholders" label="مستوى الاهتمام" />
              <Th guide={guide} anchor="stakeholders" label="استراتيجية التعامل" />
            </tr>
          </thead>
          <tbody>
            {stakeRows.map(row => (
              <tr key={row}>
                <td style={tdLabelStyle}>{row}</td>
                <td style={tdStyle}><TextInput value={stakes[`${row}__impact`]}    onChange={v => setS(row, 'impact',    v)} placeholder="..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={stakes[`${row}__interest`]}  onChange={v => setS(row, 'interest',  v)} placeholder="..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={stakes[`${row}__strategy`]}  onChange={v => setS(row, 'strategy',  v)} placeholder="..." disabled={disabled} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const removeRow = i => commit(items.filter((_, idx) => idx !== i));

  const names = items.map(it => norm(it.name)).filter(Boolean);
  const dup = name => norm(name) && names.filter(n => n === norm(name)).length > 1;

  return (
    <div>
      <GuideBlocks guide={guide} anchor="top" />
      <SectionTitleTip guide={guide} anchor="community" label="تعريف المجتمع المستهدف" />
      <GuideBlocks guide={guide} anchor="community" sectionTitle="تعريف المجتمع المستهدف" />
      <TaInput value={formData.target_community} onChange={v => set('target_community', v)}
        placeholder="صف الفئة المستهدفة بدقة: من هم؟ أين يقعون؟ ما خصائصهم؟" rows={3} disabled={disabled} />

      <SectionTitleTip guide={guide} anchor="needs_table" label="جدول الاحتياجات" />
      <GuideBlocks guide={guide} anchor="needs_table" sectionTitle="جدول الاحتياجات" />
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <Th guide={guide} anchor="needs_table" label="الاحتياج" />
              <Th guide={guide} anchor="needs_table" label="الوصف" />
              <Th guide={guide} anchor="needs_table" label="الأولوية" />
              <Th guide={guide} anchor="needs_table" label="المصدر" />
              {!disabled && <th style={{ ...thStyle, width: 70 }}></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, minWidth: 150, background: '#f8fafb' }}>
                  <TextInput value={it.name} onChange={v => update(i, 'name', v)} placeholder="اسم الاحتياج..." disabled={disabled} />
                  {dup(it.name) && <div style={{ fontSize: 10.5, color: '#dc2626', marginTop: 2 }}>اسم الاحتياج مكرر، يُرجى تمييزه.</div>}
                </td>
                <td style={tdStyle}><TextInput value={it.desc}   onChange={v => update(i, 'desc',   v)} placeholder="وصف الاحتياج..." disabled={disabled} /></td>
                <td style={{ ...tdStyle, minWidth: 90 }}><SelectInput value={it.priority} onChange={v => update(i, 'priority', v)} options={['عالية', 'متوسطة', 'منخفضة']} disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={it.source} onChange={v => update(i, 'source', v)} placeholder="المصدر..." disabled={disabled} /></td>
                {!disabled && (
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeRow(i)} title="حذف الصف"
                        style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', cursor: 'pointer', fontSize: 11, padding: '3px 8px', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap' }}>
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
    { key: 'so', title: 'SO — استراتيجيات القوة والفرص',       sub: 'كيف نستخدم نقاط القوة لاستثمار الفرص؟',       color: '#16a34a', bg: '#f0fdf4' },
    { key: 'wo', title: 'WO — استراتيجيات الضعف والفرص',       sub: 'كيف نعالج نقاط الضعف لاستثمار الفرص؟',        color: '#2563eb', bg: '#eff6ff' },
    { key: 'st', title: 'ST — استراتيجيات القوة والتهديدات',    sub: 'كيف نستخدم نقاط القوة لمواجهة التهديدات؟',    color: '#d97706', bg: '#fffbeb' },
    { key: 'wt', title: 'WT — استراتيجيات الضعف والتهديدات',   sub: 'كيف نتجنب التهديدات في ظل نقاط الضعف؟',       color: '#dc2626', bg: '#fef2f2' },
  ];

  return (
    <div>
      <SectionTitle>مصفوفة TOWS (التحليل المتقاطع)</SectionTitle>
      <GuideBlocks guide={guide} anchor="top" sectionTitle="مصفوفة TOWS (التحليل المتقاطع) التحليل الاستراتيجي" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cells.map(c => {
          const tip = guide.tip(c.key, c.key.toUpperCase());
          return (
          <div key={c.key} style={{ border: `2px solid ${c.color}25`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '9px 12px', background: c.bg }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.color, display: 'flex', alignItems: 'center', gap: 2 }}>
                {c.title}
                {tip && <InfoTip text={tip.text} example={tip.example} title={tip.example?.title} label={c.key.toUpperCase()} />}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{c.sub}</div>
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
          <button onClick={addRow} style={{ padding: '6px 14px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
            + إضافة مبادرة
          </button>
        )}
      </div>
      <GuideBlocks guide={guide} anchor="top" sectionTitle="المبادرات الاستراتيجية" />

      {init.map((row, i) => (
        <div key={i} style={{ background: '#f8fafb', border: `1.5px solid ${colors.teal}20`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.teal }}>مبادرة {i + 1}</div>
            {!disabled && init.length > 1 && (
              <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
            </FieldBox>
            <FieldBox {...fb} label="تاريخ البداية">
              <input type="date" value={row.start_date || ''} onChange={e => updateRow(i, 'start_date', e.target.value)} disabled={disabled}
                style={{ width: '100%', padding: '7px 10px', border: `1px solid ${disabled ? '#f3f4f6' : '#e5e7eb'}`, borderRadius: 6, fontSize: 12, fontFamily: "'Cairo', sans-serif", direction: 'rtl', boxSizing: 'border-box', background: disabled ? '#f9fafb' : '#fff' }} />
            </FieldBox>
            <FieldBox {...fb} label="تاريخ النهاية">
              <input type="date" value={row.end_date || ''} onChange={e => updateRow(i, 'end_date', e.target.value)} disabled={disabled}
                style={{ width: '100%', padding: '7px 10px', border: `1px solid ${disabled ? '#f3f4f6' : '#e5e7eb'}`, borderRadius: 6, fontSize: 12, fontFamily: "'Cairo', sans-serif", direction: 'rtl', boxSizing: 'border-box', background: disabled ? '#f9fafb' : '#fff' }} />
            </FieldBox>
            <FieldBox {...fb} label="المسؤول">
              <TextInput value={row.owner} onChange={v => updateRow(i, 'owner', v)} placeholder="اسم المسؤول..." disabled={disabled} />
            </FieldBox>
          </div>
        </div>
      ))}
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
      <GuideBlocks guide={guide} anchor="values" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {values.map((val, i) => (
          <span key={i} style={{ padding: '5px 14px', borderRadius: 20, background: '#fff7ed', color: colors.orange, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #fed7aa' }}>
            {val}
            {!disabled && <button onClick={() => removeValue(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>}
          </span>
        ))}
        {!disabled && (
          <button onClick={addValue} style={{ padding: '5px 14px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
            + إضافة قيمة
          </button>
        )}
      </div>
      {values.length === 0 && <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>مثال: الشفافية، الإتقان، العمل الجماعي، الابتكار</div>}

      <SectionTitleTip guide={guide} anchor="goals" label="الأهداف الاستراتيجية" />
      <GuideBlocks guide={guide} anchor="goals" />
      {goals.map((g, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <TextInput value={g} onChange={v => updateGoal(i, v)} placeholder="اكتب الهدف الاستراتيجي..." disabled={disabled} />
          </div>
          {!disabled && goals.length > 1 && (
            <button onClick={() => removeGoal(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>✕</button>
          )}
        </div>
      ))}
      {!disabled && (
        <button onClick={addGoal} style={{ padding: '7px 16px', background: 'transparent', border: `1.5px dashed ${colors.teal}`, color: colors.teal, borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>
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

  const stages = [
    { key: 'inputs',     title: 'المدخلات',  color: '#6366f1', placeholder: 'الموارد البشرية\nالموارد المالية\nالبنية التحتية' },
    { key: 'activities', title: 'الأنشطة',   color: colors.teal,  placeholder: 'برامج تدريب\nحملات توعية\nخدمات مباشرة' },
    { key: 'outputs',    title: 'المخرجات',  color: '#2563eb', placeholder: 'عدد المستفيدين\nبرامج منفذة\nمواد منشورة' },
    { key: 'outcomes',   title: 'النتائج',   color: colors.orange, placeholder: 'تحسن المعرفة\nتغير السلوك\nزيادة الوعي' },
    { key: 'impact',     title: 'الأثر',     color: '#16a34a', placeholder: 'تحسن نوعية الحياة\nتمكين المجتمع' },
  ];

  return (
    <div>
      <GuideBlocks guide={guide} anchor="top" />
      <SectionTitleTip guide={guide} anchor="chain" label="سلسلة نظرية التغيير" />
      <GuideBlocks guide={guide} anchor="chain" />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, alignItems: 'stretch' }}>
        {stages.map((s, i) => (
          <React.Fragment key={s.key}>
            <div style={{ flex: 1, minWidth: 140, border: `2px solid ${s.color}30`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '7px 10px', background: `${s.color}15`, fontWeight: 700, fontSize: 12, color: s.color, textAlign: 'center' }}><Lbl guide={guide} anchor="chain" label={s.title} /></div>
              <TaInput value={t[s.key]} onChange={v => update(s.key, v)} placeholder={s.placeholder} rows={5} disabled={disabled} />
            </div>
            {i < stages.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 22, color: colors.orange, fontWeight: 700, flexShrink: 0, paddingBottom: 8 }}>←</div>
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
    <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '5px 8px', background: accent ? colors.orange : colors.teal, color: '#fff', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>
        {guide ? <Lbl guide={guide} anchor="top" label={block.t} /> : block.t}
      </div>
      <TaInput value={value} onChange={onChange} placeholder={block.p} rows={3} disabled={disabled} />
    </div>
  );
}

const BMC_ROW1 = [
  { key: 'customer_segments', t: 'شرائح المستفيدين',     p: 'من هم المستفيدون؟' },
  { key: 'relationships',     t: 'العلاقة مع المستفيدين', p: 'كيف نتواصل معهم؟' },
  { key: 'value_proposition', t: 'القيم المقترحة',         p: 'ما القيمة المقدمة؟' },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 6 }}>
        {BMC_ROW1.map(bl => (
          <BmcCell key={bl.key} guide={guide} block={bl} value={b[bl.key]} onChange={v => update(bl.key, v)} disabled={disabled} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        {BMC_ROW2.map(bl => (
          <BmcCell key={bl.key} guide={guide} block={bl} value={b[bl.key]} onChange={v => update(bl.key, v)} disabled={disabled} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {BMC_ROW3.map(bl => (
          <BmcCell key={bl.key} guide={guide} block={bl} accent value={b[bl.key]} onChange={v => update(bl.key, v)} disabled={disabled} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────── 9. مؤشرات الأداء ─────────────── */
function KpisTemplate({ formData, set, disabled, unit, guide }) {
  const kpis = formData.kpis || [emptyKpi()];

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
          <button onClick={addRow} style={{ padding: '6px 14px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
            + إضافة مؤشر
          </button>
        )}
      </div>
      <GuideBlocks guide={guide} anchor="top" sectionTitle="جدول مؤشرات الأداء" />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <Th guide={guide} anchor="top" label="المؤشر" />
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
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={tdStyle}><TextInput value={row.name}        onChange={v => updateRow(i, 'name',        v)} placeholder="اسم المؤشر"         disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={row.goal}        onChange={v => updateRow(i, 'goal',        v)} placeholder="الهدف المرتبط"       disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={row.target}      onChange={v => updateRow(i, 'target',      v)} placeholder="الهدف الرقمي"        disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={row.measurement} onChange={v => updateRow(i, 'measurement', v)} placeholder="الطريقة"            disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={row.frequency}   onChange={v => updateRow(i, 'frequency',   v)} placeholder="شهري / ربعي"        disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={row.owner}       onChange={v => updateRow(i, 'owner',       v)} placeholder="المسؤول"             disabled={disabled} /></td>
                {!disabled && (
                  <td style={tdStyle}>
                    {kpis.length > 1 && <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>}
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
function OrgchartTemplate({ formData, set, disabled, guide }) {
  const positions = formData.positions || [
    { title: 'المدير التنفيذي', dept: 'الإدارة العليا', reports_to: '' },
  ];
  const updatePos = (i, k, v) => { const arr = [...positions]; arr[i] = { ...arr[i], [k]: v }; set('positions', arr); };
  const addPos    = () => set('positions', [...positions, { title: '', dept: '', reports_to: '' }]);
  const removePos = i  => set('positions', positions.filter((_, idx) => idx !== i));

  const { roots, issues } = useMemo(() => buildOrgTree(positions), [positions]);
  const issueCount = Object.keys(issues).length;

  return (
    <div>
      <SectionTitle>الهيكل التنظيمي</SectionTitle>
      <GuideBlocks guide={guide} anchor="top" sectionTitle="الهيكل التنظيمي" />

      {/* الخريطة التنظيمية — تُشتق من الجدول وتتحدّث مع كل تعديل */}
      <div style={{ background: '#f8fafb', borderRadius: 10, padding: '18px 10px', marginBottom: 16, overflowX: 'auto' }}>
        {roots.length > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 18, minWidth: 'fit-content', margin: '0 auto' }}>
            {roots.map(r => <OrgNode key={r.key} node={r} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>أضف الوظائف في الجدول لتظهر الخريطة التنظيمية.</div>
        )}
        {issueCount > 0 && (
          <div style={{ marginTop: 12, fontSize: 11.5, color: '#b45309', textAlign: 'center' }}>
            ⚠️ {issueCount === 1 ? 'وظيفة واحدة لم تُرسم' : `${issueCount} وظائف لم تُرسم`} لعدم وضوح التبعية — راجع التنبيه عند الصف في الجدول.
          </div>
        )}
      </div>

      {/* جدول المناصب */}
      <div style={{ overflowX: 'auto', marginBottom: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <Th guide={guide} anchor="top" label="المسمى الوظيفي" />
              <Th guide={guide} anchor="top" label="القسم" />
              <Th guide={guide} anchor="top" label="يتبع لـ" />
              {!disabled && <th style={{ ...thStyle, width: 32 }}></th>}
            </tr>
          </thead>
          <tbody>
            {positions.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={tdStyle}><TextInput value={p.title}     onChange={v => updatePos(i, 'title',     v)} placeholder="المسمى الوظيفي" disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={p.dept}      onChange={v => updatePos(i, 'dept',      v)} placeholder="اسم القسم"       disabled={disabled} /></td>
                <td style={tdStyle}>
                  <TextInput value={p.reports_to} onChange={v => updatePos(i, 'reports_to', v)} placeholder="يتبع لـ..." disabled={disabled} />
                  {issues[i] && <div style={{ fontSize: 10.5, color: '#b45309', marginTop: 3, lineHeight: 1.6 }}>⚠️ {issues[i]}</div>}
                </td>
                {!disabled && (
                  <td style={tdStyle}>
                    {positions.length > 1 && <button onClick={() => removePos(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!disabled && (
        <button onClick={addPos} style={{ padding: '7px 16px', background: 'transparent', border: `1.5px dashed ${colors.teal}`, color: colors.teal, borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>
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
      <div style={{ border: `2px solid #e5e7eb`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '20px 24px', background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`, color: '#fff', textAlign: 'center' }}>
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
        <div style={{ padding: '14px 20px', background: '#f8fafb', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DOCUMENT_STAGES.map((s, i) => (
            <span key={i} style={{ fontSize: 11, color: colors.teal, padding: '3px 8px', background: '#e0f2fe', borderRadius: 4 }}>
              {i > 0 ? `${i}. ` : ''}{s}
            </span>
          ))}
        </div>
      </div>

      <GuideBlocks guide={guide} anchor="top" />

      {/* حقول الإدخال */}
      {sections.map(s => (
        <div key={s.key} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>
            <Lbl guide={guide} anchor="top" label={s.label} />
            {s.key === 'closing_notes' && <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}> (اختياري)</span>}
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
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>محتوى الوحدة</div>
      <TaInput value={formData.content} onChange={v => set('content', v)} placeholder="اكتب محتوى العمل هنا..." rows={10} disabled={disabled} />
    </div>
  );
}

/* ─── Helper components ─── */
const FieldBox = ({ label, children, style }) => (
  <div style={style}>
    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</div>
    {children}
  </div>
);

const FieldBoxTip = ({ guide, anchor, label, children, style }) => (
  <div style={style}>
    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}><Lbl guide={guide} anchor={anchor} label={label} /></div>
    {children}
  </div>
);
