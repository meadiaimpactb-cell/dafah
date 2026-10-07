import React from 'react';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

export default function TemplateRenderer({ unit, formData, setFormData, disabled }) {
  const set = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const props = { formData, set, disabled, unit };

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
const tdStyle = { padding: '6px 6px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };
const tdLabelStyle = { ...tdStyle, padding: '8px 10px', fontSize: 12, fontWeight: 600, background: '#f8fafb', whiteSpace: 'nowrap' };

/* ─────────────── 1. SWOT ─────────────── */
function SwotTemplate({ formData, set, disabled, unit }) {
  const tableRows = unit.table_rows || [];
  const tbl = formData.table || {};
  const matrix = formData.matrix || {};

  const setTbl = (row, col, v) => set('table', { ...tbl, [`${row}__${col}`]: v });
  const setMx  = (k, v) => set('matrix', { ...matrix, [k]: v });

  return (
    <div>
      <SectionTitle>تحليل الموارد الداخلية</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <th style={thStyle}>العنصر</th>
              <th style={thStyle}>نقاط القوة</th>
              <th style={thStyle}>نقاط الضعف</th>
              <th style={thStyle}>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map(row => (
              <tr key={row}>
                <td style={tdLabelStyle}>{row}</td>
                <td style={tdStyle}><TextInput value={tbl[`${row}__strength`]} onChange={v => setTbl(row, 'strength', v)} placeholder="اكتب هنا..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={tbl[`${row}__weakness`]} onChange={v => setTbl(row, 'weakness', v)} placeholder="اكتب هنا..." disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={tbl[`${row}__notes`]}    onChange={v => setTbl(row, 'notes',    v)} placeholder="ملاحظات..." disabled={disabled} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle>مصفوفة SWOT</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { key: 'strengths',    title: 'نقاط القوة (S)',     color: '#16a34a', bg: '#f0fdf4' },
          { key: 'weaknesses',   title: 'نقاط الضعف (W)',    color: '#dc2626', bg: '#fef2f2' },
          { key: 'opportunities',title: 'الفرص (O)',           color: '#2563eb', bg: '#eff6ff' },
          { key: 'threats',      title: 'التهديدات (T)',       color: '#d97706', bg: '#fffbeb' },
        ].map(q => (
          <div key={q.key} style={{ border: `2px solid ${q.color}25`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '7px 12px', background: q.bg, fontSize: 13, fontWeight: 600, color: q.color }}>{q.title}</div>
            <TaInput value={matrix[q.key]} onChange={v => setMx(q.key, v)} placeholder="اكتب هنا..." rows={4} disabled={disabled} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── 2. PESTEL ─────────────── */
function PestelTemplate({ formData, set, disabled, unit }) {
  const tableRows = unit.table_rows || ['سياسي', 'اقتصادي', 'اجتماعي', 'تقني', 'بيئي', 'قانوني'];
  const factors = formData.factors || {};
  const stakes  = formData.stakeholders || {};

  const setF = (row, col, v) => set('factors', { ...factors, [`${row}__${col}`]: v });
  const setS = (row, col, v) => set('stakeholders', { ...stakes, [`${row}__${col}`]: v });

  const stakeRows = ['الجهات الحكومية', 'المانحون', 'المستفيدون', 'الموظفون', 'الشركاء'];

  return (
    <div>
      <SectionTitle>تحليل PESTEL</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <th style={thStyle}>العامل</th>
              <th style={thStyle}>وصف العامل</th>
              <th style={thStyle}>التأثير</th>
              <th style={thStyle}>المستوى</th>
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

      <SectionTitle>خريطة أصحاب المصلحة</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <th style={thStyle}>صاحب المصلحة</th>
              <th style={thStyle}>مستوى التأثير</th>
              <th style={thStyle}>مستوى الاهتمام</th>
              <th style={thStyle}>استراتيجية التعامل</th>
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
    </div>
  );
}

/* ─────────────── 3. دراسة الاحتياجات ─────────────── */
function NeedsTemplate({ formData, set, disabled, unit }) {
  const tableRows = unit.table_rows || ['الدعم التعليمي', 'التأهيل المهني', 'الدعم النفسي', 'الرعاية الصحية', 'الإسكان'];
  const tbl = formData.needs_table || {};
  const setT = (row, col, v) => set('needs_table', { ...tbl, [`${row}__${col}`]: v });

  return (
    <div>
      <SectionTitle>تعريف المجتمع المستهدف</SectionTitle>
      <TaInput value={formData.target_community} onChange={v => set('target_community', v)}
        placeholder="صف الفئة المستهدفة بدقة: من هم؟ أين يقعون؟ ما خصائصهم؟" rows={3} disabled={disabled} />

      <SectionTitle>جدول الاحتياجات</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={thStyle}>الاحتياج</th>
              <th style={thStyle}>الوصف</th>
              <th style={thStyle}>الأولوية</th>
              <th style={thStyle}>المصدر</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map(row => (
              <tr key={row}>
                <td style={tdLabelStyle}>{row}</td>
                <td style={tdStyle}><TextInput value={tbl[`${row}__desc`]}     onChange={v => setT(row, 'desc',     v)} placeholder="وصف الاحتياج..." disabled={disabled} /></td>
                <td style={{ ...tdStyle, minWidth: 90 }}><SelectInput value={tbl[`${row}__priority`]} onChange={v => setT(row, 'priority', v)} options={['عالية', 'متوسطة', 'منخفضة']} disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={tbl[`${row}__source`]}   onChange={v => setT(row, 'source',   v)} placeholder="المصدر..." disabled={disabled} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle>تحليل الفجوات</SectionTitle>
      <TaInput value={formData.gap_analysis} onChange={v => set('gap_analysis', v)}
        placeholder="ما الفجوة بين الاحتياجات الفعلية والخدمات المتاحة حالياً؟" rows={3} disabled={disabled} />
    </div>
  );
}

/* ─────────────── 4. مصفوفة TOWS ─────────────── */
function TowsTemplate({ formData, set, disabled }) {
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cells.map(c => (
          <div key={c.key} style={{ border: `2px solid ${c.color}25`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '9px 12px', background: c.bg }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{c.title}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{c.sub}</div>
            </div>
            <TaInput value={tows[c.key]} onChange={v => update(c.key, v)} placeholder="اكتب الاستراتيجيات هنا..." rows={5} disabled={disabled} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── 5. المبادرات الاستراتيجية ─────────────── */
function InitiativesTemplate({ formData, set, disabled }) {
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

      {init.map((row, i) => (
        <div key={i} style={{ background: '#f8fafb', border: `1.5px solid ${colors.teal}20`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.teal }}>مبادرة {i + 1}</div>
            {!disabled && init.length > 1 && (
              <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FieldBox label="اسم المبادرة">
              <TextInput value={row.name} onChange={v => updateRow(i, 'name', v)} placeholder="اسم المبادرة" disabled={disabled} />
            </FieldBox>
            <FieldBox label="الهدف الاستراتيجي المرتبط">
              <TextInput value={row.goal} onChange={v => updateRow(i, 'goal', v)} placeholder="الهدف" disabled={disabled} />
            </FieldBox>
            <FieldBox label="وصف المبادرة" style={{ gridColumn: '1 / -1' }}>
              <TaInput value={row.description} onChange={v => updateRow(i, 'description', v)} placeholder="صف المبادرة بالتفصيل..." rows={2} disabled={disabled} />
            </FieldBox>
            <FieldBox label="المخرجات المتوقعة">
              <TextInput value={row.outputs} onChange={v => updateRow(i, 'outputs', v)} placeholder="ما الذي ستنتجه هذه المبادرة؟" disabled={disabled} />
            </FieldBox>
            <FieldBox label="الميزانية التقديرية (ريال)">
              <TextInput value={row.budget} onChange={v => updateRow(i, 'budget', v)} placeholder="50,000" disabled={disabled} />
            </FieldBox>
            <FieldBox label="تاريخ البداية">
              <input type="date" value={row.start_date || ''} onChange={e => updateRow(i, 'start_date', e.target.value)} disabled={disabled}
                style={{ width: '100%', padding: '7px 10px', border: `1px solid ${disabled ? '#f3f4f6' : '#e5e7eb'}`, borderRadius: 6, fontSize: 12, fontFamily: "'Cairo', sans-serif", direction: 'rtl', boxSizing: 'border-box', background: disabled ? '#f9fafb' : '#fff' }} />
            </FieldBox>
            <FieldBox label="تاريخ النهاية">
              <input type="date" value={row.end_date || ''} onChange={e => updateRow(i, 'end_date', e.target.value)} disabled={disabled}
                style={{ width: '100%', padding: '7px 10px', border: `1px solid ${disabled ? '#f3f4f6' : '#e5e7eb'}`, borderRadius: 6, fontSize: 12, fontFamily: "'Cairo', sans-serif", direction: 'rtl', boxSizing: 'border-box', background: disabled ? '#f9fafb' : '#fff' }} />
            </FieldBox>
            <FieldBox label="المسؤول">
              <TextInput value={row.owner} onChange={v => updateRow(i, 'owner', v)} placeholder="اسم المسؤول..." disabled={disabled} />
            </FieldBox>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── 6. التوجهات الاستراتيجية ─────────────── */
function DirectionsTemplate({ formData, set, disabled }) {
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
      <SectionTitle>الرؤية</SectionTitle>
      <TaInput value={d.vision} onChange={v => update('vision', v)} placeholder="أن نكون المنظمة الرائدة في..." rows={2} disabled={disabled} />

      <SectionTitle>الرسالة</SectionTitle>
      <TaInput value={d.mission} onChange={v => update('mission', v)} placeholder="نعمل على تقديم... لفئة... من خلال..." rows={2} disabled={disabled} />

      <SectionTitle>القيم</SectionTitle>
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

      <SectionTitle>الأهداف الاستراتيجية</SectionTitle>
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
function TocTemplate({ formData, set, disabled }) {
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
      <SectionTitle>سلسلة نظرية التغيير</SectionTitle>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, alignItems: 'stretch' }}>
        {stages.map((s, i) => (
          <React.Fragment key={s.key}>
            <div style={{ flex: 1, minWidth: 140, border: `2px solid ${s.color}30`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '7px 10px', background: `${s.color}15`, fontWeight: 700, fontSize: 12, color: s.color, textAlign: 'center' }}>{s.title}</div>
              <TaInput value={t[s.key]} onChange={v => update(s.key, v)} placeholder={s.placeholder} rows={5} disabled={disabled} />
            </div>
            {i < stages.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 22, color: colors.orange, fontWeight: 700, flexShrink: 0, paddingBottom: 8 }}>←</div>
            )}
          </React.Fragment>
        ))}
      </div>

      <SectionTitle>الافتراضات الأساسية</SectionTitle>
      <TaInput value={t.assumptions} onChange={v => update('assumptions', v)} placeholder="ما الشروط التي يجب توفرها لنجاح نظرية التغيير؟" rows={3} disabled={disabled} />
    </div>
  );
}

/* BmcCell مُعرَّف خارج BmcTemplate تماماً لمنع إعادة الإنشاء عند كل render */
function BmcCell({ block, accent, value, onChange, disabled }) {
  return (
    <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '5px 8px', background: accent ? colors.orange : colors.teal, color: '#fff', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>
        {block.t}
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
function BmcTemplate({ formData, set, disabled }) {
  const b      = formData.bmc || {};
  const update = (k, v) => set('bmc', { ...formData.bmc, [k]: v });

  return (
    <div>
      <SectionTitle>نموذج عمل المنظمة (Business Model Canvas)</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 6 }}>
        {BMC_ROW1.map(bl => (
          <BmcCell key={bl.key} block={bl} value={b[bl.key]} onChange={v => update(bl.key, v)} disabled={disabled} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        {BMC_ROW2.map(bl => (
          <BmcCell key={bl.key} block={bl} value={b[bl.key]} onChange={v => update(bl.key, v)} disabled={disabled} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {BMC_ROW3.map(bl => (
          <BmcCell key={bl.key} block={bl} accent value={b[bl.key]} onChange={v => update(bl.key, v)} disabled={disabled} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────── 9. مؤشرات الأداء ─────────────── */
function KpisTemplate({ formData, set, disabled, unit }) {
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
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={thStyle}>المؤشر</th>
              <th style={thStyle}>الهدف المرتبط</th>
              <th style={thStyle}>المستهدف</th>
              <th style={thStyle}>طريقة القياس</th>
              <th style={thStyle}>التكرار</th>
              <th style={thStyle}>المسؤول</th>
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
function OrgchartTemplate({ formData, set, disabled }) {
  const positions = formData.positions || [
    { title: 'المدير التنفيذي', dept: 'الإدارة العليا', reports_to: '' },
  ];
  const updatePos = (i, k, v) => { const arr = [...positions]; arr[i] = { ...arr[i], [k]: v }; set('positions', arr); };
  const addPos    = () => set('positions', [...positions, { title: '', dept: '', reports_to: '' }]);
  const removePos = i  => set('positions', positions.filter((_, idx) => idx !== i));

  return (
    <div>
      <SectionTitle>الهيكل التنظيمي</SectionTitle>

      {/* عرض مرئي بسيط */}
      <div style={{ background: '#f8fafb', borderRadius: 10, padding: 20, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ padding: '8px 22px', background: colors.tealDark, color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
            {positions[0]?.title || 'المدير التنفيذي'}
          </div>
          <div style={{ width: 2, height: 16, background: '#d1d5db' }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {positions.slice(1).filter(p => p.title).map((p, i) => (
              <div key={i} style={{ padding: '6px 14px', background: colors.teal, color: '#fff', borderRadius: 7, fontSize: 12 }}>{p.title}</div>
            ))}
          </div>
        </div>
      </div>

      {/* جدول المناصب */}
      <div style={{ overflowX: 'auto', marginBottom: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={thStyle}>المسمى الوظيفي</th>
              <th style={thStyle}>القسم</th>
              <th style={thStyle}>يتبع لـ</th>
              {!disabled && <th style={{ ...thStyle, width: 32 }}></th>}
            </tr>
          </thead>
          <tbody>
            {positions.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={tdStyle}><TextInput value={p.title}     onChange={v => updatePos(i, 'title',     v)} placeholder="المسمى الوظيفي" disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={p.dept}      onChange={v => updatePos(i, 'dept',      v)} placeholder="اسم القسم"       disabled={disabled} /></td>
                <td style={tdStyle}><TextInput value={p.reports_to}onChange={v => updatePos(i, 'reports_to',v)} placeholder="يتبع لـ..."      disabled={disabled} /></td>
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
function DocumentTemplate({ formData, set, disabled }) {
  const doc = formData.document || {};
  const update = (k, v) => set('document', { ...doc, [k]: v });

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
          <div style={{ fontSize: 18, fontWeight: 800 }}>الخطة الاستراتيجية 2025–2028</div>
        </div>
        <div style={{ padding: '14px 20px', background: '#f8fafb', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['الملخص التنفيذي', 'التحليل الداخلي', 'التحليل الخارجي', 'الاحتياجات', 'التحليل الاستراتيجي', 'المبادرات', 'التوجهات', 'نظرية التغيير', 'نموذج العمل', 'المؤشرات', 'الهيكل'].map((s, i) => (
            <span key={i} style={{ fontSize: 11, color: colors.teal, padding: '3px 8px', background: '#e0f2fe', borderRadius: 4 }}>← {s}</span>
          ))}
        </div>
      </div>

      {/* حقول الإدخال */}
      {sections.map(s => (
        <div key={s.key} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>{s.label}</div>
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
