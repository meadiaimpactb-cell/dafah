import DfIcon from '../../components/ui/DfIcon';
import { useIsPhone } from '../../utils/useMediaQuery';

const colors = {
  primary: '#235D7F', ink: '#0E2A3D', primarySoft: '#D9E8F1',
  orange: '#EF6A2C', green: '#0B7F5D',
  gray: '#5E6B78', grayLight: '#F3EFE8', grayBorder: '#E8E3DA',
};

// ── ترجمة المفاتيح ─────────────────────────────────────────────────────────────
const LABELS = {
  // هيكل عام
  table: 'الجدول', matrix: 'ملخص التحليل الداخلي المستند إلى إطار SWOT', tows: 'مصفوفة TOWS',
  factors: 'عوامل البيئة الخارجية', stakeholders: 'أصحاب المصلحة',
  needs_table: 'جدول الاحتياجات', target_community: 'المجتمع المستهدف',
  gap_analysis: 'تحليل الفجوات', positions: 'الهيكل الوظيفي',
  directions: 'التوجهات الاستراتيجية', values_list: 'القيم المؤسسية',
  goals_list: 'الأهداف الاستراتيجية', initiatives: 'المبادرات',
  kpis: 'مؤشرات الأداء الرئيسية', toc: 'نظرية التغيير',
  bmc: 'نموذج العمل المؤسسي', document: 'الوثيقة الاستراتيجية',

  // SWOT
  strengths: 'نقاط القوة', weaknesses: 'نقاط الضعف',
  opportunities: 'فرص التحسين', threats: 'المخاطر الداخلية',

  // TOC / بنية TOC
  inputs: 'المدخلات', activities: 'الأنشطة', outputs: 'المخرجات',
  outcomes: 'النتائج', impact: 'الأثر', assumptions: 'الافتراضات',

  // BMC
  customer_segments: 'شرائح العملاء / المستفيدين',
  value_proposition: 'القيمة المقترحة للمستفيدين', channels: 'قنوات الوصول',
  relationships: 'علاقات المستفيدين', revenue_streams: 'مصادر التمويل',
  key_resources: 'الموارد الرئيسية', key_activities: 'الأنشطة الرئيسية',
  partners: 'الشركاء الرئيسيون', cost_structure: 'هيكل التكاليف',

  // التوجهات
  vision: 'الرؤية', mission: 'الرسالة',

  // TOWS
  so: 'قوة × فرصة (S-O)', wo: 'ضعف × فرصة (W-O)',
  st: 'قوة × تهديد (S-T)', wt: 'ضعف × تهديد (W-T)',

  // مبادرات / KPIs / orgchart
  name: 'الاسم', goal: 'الهدف', description: 'الوصف',
  outputs_field: 'المخرجات', budget: 'الميزانية (ريال)',
  start_date: 'تاريخ البدء', end_date: 'تاريخ الانتهاء', owner: 'المسؤول',
  target: 'المستهدف', measurement: 'طريقة القياس',
  frequency: 'دورية القياس',
  title: 'المسمى الوظيفي', dept: 'القسم / الإدارة',
  reports_to: 'يرفع إلى',

  // وثيقة (بأسماء الحقول نفسها في نموذج العميل)
  executive_summary: 'الملخص التنفيذي',
  key_findings: 'أبرز النتائج والتحليلات',
  implementation: 'الخطة التنفيذية (ملخص)',
  monitoring: 'آلية المتابعة والتقييم',
  closing_notes: 'ملاحظات ختامية',
  stakeholders_extra: 'أصحاب مصلحة أضافهم العميل',

  // PESTEL / احتياجات — لواحق مزدوجة
  desc: 'الوصف', priority: 'الأولوية', source: 'المصدر',
  strength: 'نقطة قوة', weakness: 'نقطة ضعف', notes: 'ملاحظات',
  level: 'مستوى التأثير', strategy: 'استراتيجية التعامل',
  interest: 'درجة الاهتمام',
};

const label = (key) => {
  const clean = String(key).replace(/__[a-z_]+$/, '').replace(/_/g, ' ');
  const suffix = String(key).match(/__([a-z_]+)$/)?.[1];
  const suffixLabel = suffix ? (LABELS[suffix] || suffix) : '';
  const baseLabel = LABELS[String(key).replace(/__[a-z_]+$/, '')] || LABELS[clean] || clean;
  return suffixLabel ? `${baseLabel} — ${suffixLabel}` : baseLabel;
};

// ── تحويل آمن لأي قيمة إلى نص قابل للعرض ────────────────────────────────────
const safeStr = (v) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? '✓' : '✗';
  if (Array.isArray(v)) {
    if (v.length === 0) return '—';
    if (typeof v[0] === 'object') return v.map(o => typeof o === 'object' ? Object.values(o).filter(x => x && typeof x !== 'boolean').join(' | ') : String(o)).join('\n');
    return v.filter(x => typeof x !== 'boolean').join('، ') || '—';
  }
  if (typeof v === 'object') return Object.entries(v).map(([k2, v2]) => `${k2}: ${v2}`).join(' | ');
  return String(v);
};

// ── عارض قيمة نصية ────────────────────────────────────────────────────────────
const TextValue = ({ value }) => (
  <div style={{ fontSize: 13, color: '#334452', padding: '8px 12px', background: colors.grayLight, borderRadius: 6, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
    {String(value ?? '')}
  </div>
);

// ── قائمة نصية ────────────────────────────────────────────────────────────────
const ListValue = ({ items }) => (
  <ul style={{ margin: 0, paddingRight: 20 }}>
    {items.map((item, i) => (
      <li key={i} style={{ fontSize: 13, color: '#334452', lineHeight: 1.9, padding: '2px 0' }}>{item}</li>
    ))}
  </ul>
);

// ── جدول عام ──────────────────────────────────────────────────────────────────
// على الجوال يُعرض كل صف بطاقةً عنوانها الخانة الأولى (المجال/النشاط) وتحته بقية الخانات بأسمائها
const TableView = ({ headers, rows }) => {
  const isPhone = useIsPhone();
  if (isPhone) {
    return (
      <div data-viewer-cards style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((row, i) => (
          <div key={i} style={{ border: `1px solid ${colors.grayBorder}`, borderRadius: 8, overflow: 'hidden', background: 'white' }}>
            <div style={{ padding: '7px 12px', background: colors.primarySoft, fontSize: 12.5, fontWeight: 700, color: colors.ink, overflowWrap: 'anywhere' }}>
              {row[0] || '—'}
            </div>
            <div style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {row.slice(1).map((cell, j) => (
                <div key={j} style={{ fontSize: 12, lineHeight: 1.7, overflowWrap: 'anywhere' }}>
                  <span style={{ color: colors.gray, fontWeight: 600 }}>{headers[j + 1]}: </span>
                  <span style={{ color: '#334452', whiteSpace: 'pre-wrap' }}>{cell || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
  <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${colors.grayBorder}` }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: '8px 12px', background: colors.primary, color: 'white', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${colors.grayBorder}`, background: i % 2 === 0 ? 'white' : '#FBF9F5' }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '8px 12px', color: '#334452', verticalAlign: 'top', lineHeight: 1.7 }}>{cell || '—'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  );
};

// ── عارض بيانات SWOT table ────────────────────────────────────────────────────
/** صفوف جدول الموارد بترتيب الوحدة كما يراه العميل؛ وصفوف إضافية (إن وُجدت) بعدها */
const swotRowOrder = (table, unitRows) => {
  const fromData = [...new Set(Object.keys(table || {}).map(k => k.split('__')[0]))];
  const base = Array.isArray(unitRows) && unitRows.length ? unitRows : [];
  return [...base, ...fromData.filter(r => !base.includes(r))];
};
const SwotTableViewer = ({ data, unitRows }) => {
  const rows = swotRowOrder(data, unitRows).map(row => [row, data[`${row}__strength`] || '—', data[`${row}__weakness`] || '—', data[`${row}__notes`] || '—']);
  return <TableView headers={['المجال', 'نقطة القوة', 'نقطة الضعف', 'الملاحظات']} rows={rows} />;
};
/** نقاط القوة/الضعف في الملخص تُشتق من صفوف الجدول المرسل (كما تظهر للعميل تلقائيًا) لا من نسخة مخزّنة قديمة */
const swotPoints = (table, unitRows, col) => swotRowOrder(table, unitRows)
  .map(r => String(table?.[`${r}__${col}`] ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);

// ── عارض PESTEL / احتياجات بلواحق مزدوجة ─────────────────────────────────────
const SuffixTableViewer = ({ data, colKeys, colLabels }) => {
  const groups = {};
  Object.entries(data).forEach(([k, v]) => {
    const parts = k.split('__');
    const rowKey = parts.slice(0, -1).join('__');
    const col = parts[parts.length - 1];
    if (!groups[rowKey]) groups[rowKey] = {};
    groups[rowKey][col] = v;
  });
  const rows = Object.entries(groups).map(([row, cols]) => [row, ...colKeys.map(c => cols[c] || '—')]);
  return <TableView headers={['العنصر', ...colLabels]} rows={rows} />;
};

// ── عارض قائمة كائنات (مبادرات / kpis / orgchart) ──────────────────────────
const ObjectListViewer = ({ items, type }) => {
  if (type === 'orgchart') {
    return <TableView
      headers={['المسمى الوظيفي', 'القسم / الإدارة', 'يرفع إلى']}
      rows={items.map(p => [p.title, p.dept, p.reports_to])}
    />;
  }
  if (type === 'kpis') {
    return <TableView
      headers={['المؤشر', 'الهدف', 'المستهدف', 'القياس', 'الدورية', 'المسؤول']}
      rows={items.map(k => [k.name, k.goal, k.target, k.measurement, k.frequency, k.owner])}
    />;
  }
  if (type === 'initiatives') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((ini, i) => (
          <div key={i} style={{ border: `1px solid ${colors.grayBorder}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: colors.primarySoft, borderBottom: `1px solid ${colors.grayBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 13, color: colors.ink }}>{ini.name}</strong>
              {ini.budget && <span style={{ fontSize: 11, color: colors.primary, fontWeight: 600 }}><DfIcon name="money" size={14} style={{ marginInlineEnd: 6 }} />{ini.budget} ريال</span>}
            </div>
            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: '6px 16px' }}>
              {[
                ['الهدف', ini.goal], ['المسؤول', ini.owner],
                ['تاريخ البدء', ini.start_date], ['تاريخ الانتهاء', ini.end_date],
              ].map(([lbl, val]) => val ? (
                <div key={lbl} style={{ fontSize: 12 }}>
                  <span style={{ color: colors.gray }}>{lbl}: </span>
                  <span style={{ color: '#334452', fontWeight: 600 }}>{val}</span>
                </div>
              ) : null)}
              {ini.description && (
                <div style={{ gridColumn: '1/-1', fontSize: 12, color: '#334452', lineHeight: 1.7 }}>
                  <span style={{ color: colors.gray }}>الوصف: </span>{ini.description}
                </div>
              )}
              {ini.outputs && (
                <div style={{ gridColumn: '1/-1', fontSize: 12, color: colors.green }}>
                  <span style={{ color: colors.gray }}>المخرجات: </span>{ini.outputs}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  // generic
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ padding: '8px 12px', background: colors.grayLight, borderRadius: 8, fontSize: 13, color: '#334452' }}>
          {typeof item === 'object' ? Object.entries(item).map(([k, v]) => (
            <div key={k} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              <strong>{label(k)}: </strong>{safeStr(v)}
            </div>
          )) : String(item ?? '')}
        </div>
      ))}
    </div>
  );
};

// ── عارض TOC ──────────────────────────────────────────────────────────────────
const TocViewer = ({ data }) => {
  const order = ['inputs', 'activities', 'outputs', 'outcomes', 'impact', 'assumptions'];
  const icons = { inputs: <DfIcon name="inbox" size={20} />, activities: <DfIcon name="gear" size={20} />, outputs: <DfIcon name="upload" size={20} />, outcomes: <DfIcon name="target" size={20} />, impact: <DfIcon name="star" size={20} />, assumptions: <DfIcon name="clipboard" size={20} /> };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {order.map(k => data[k] ? (
        <div key={k} style={{ border: `1px solid ${colors.grayBorder}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: colors.primarySoft, fontSize: 13, fontWeight: 700, color: colors.ink }}>
            {icons[k]} {LABELS[k] || k}
          </div>
          <div style={{ padding: '10px 14px', fontSize: 13, color: '#334452', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{data[k]}</div>
        </div>
      ) : null)}
    </div>
  );
};

// ── عارض BMC ──────────────────────────────────────────────────────────────────
const BmcViewer = ({ data }) => {
  const blocks = [
    ['value_proposition', <DfIcon key="gem" name="gem" size={20} />], ['customer_segments', <DfIcon key="users" name="users" size={20} />], ['channels', <DfIcon key="signal" name="signal" size={20} />],
    ['relationships', <DfIcon key="handshake" name="handshake" size={20} />], ['key_activities', <DfIcon key="gear" name="gear" size={20} />], ['key_resources', <DfIcon key="wrench" name="wrench" size={20} />],
    ['partners', <DfIcon key="building" name="building" size={20} />], ['revenue_streams', <DfIcon key="money" name="money" size={20} />], ['cost_structure', <DfIcon key="chart" name="chart" size={20} />],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 10 }}>
      {blocks.map(([k, icon]) => data[k] ? (
        <div key={k} style={{ border: `1px solid ${colors.grayBorder}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '7px 12px', background: colors.primarySoft, fontSize: 12, fontWeight: 700, color: colors.ink }}>
            {icon} {LABELS[k]}
          </div>
          <div style={{ padding: '8px 12px', fontSize: 12, color: '#334452', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{data[k]}</div>
        </div>
      ) : null)}
    </div>
  );
};

// ── عارض نماذج التخطيط التشغيلي (حسب نوع النموذج؛ تُخفى المفاتيح التقنية مثل معرّفات الربط) ──
const OP_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const opText = v => (v === null || v === undefined || v === '' ? '—' : String(v));
const opNum = v => parseFloat(String(v ?? '')
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/٫/g, '.')
  .replace(/[,٬\s]/g, '')) || 0;
const OP_EMPTY = <p style={{ color: colors.gray, fontSize: 13, textAlign: 'center', padding: 20 }}>لا توجد بيانات</p>;

function OperationalViewer({ template, data }) {
  const arr = v => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object') : []);
  if (template === 'op_import') {
    const items = arr(data.items);
    if (!items.length) return OP_EMPTY;
    return (
      <Section title="المبادرات">
        <TableView headers={['المبادرة', 'الاختيار لهذا العام']} rows={items.map(it => [opText(it.name), it.checked ? '✓ مختارة' : 'غير مختارة'])} />
      </Section>
    );
  }
  if (template === 'op_activities') {
    const groups = arr(data.groups);
    if (!groups.length) return OP_EMPTY;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map((g, i) => {
          const acts = arr(g.activities).filter(a => `${a.name || ''}${a.desc || ''}${a.output || ''}`.trim() !== '');
          return (
            <Section key={i} title={`المبادرة: ${opText(g.initiative)}`}>
              {acts.length
                ? <TableView headers={['اسم النشاط', 'وصف النشاط', 'المخرج المتوقع']} rows={acts.map(a => [opText(a.name), opText(a.desc), opText(a.output)])} />
                : <div style={{ fontSize: 12, color: colors.gray }}>لا توجد أنشطة</div>}
            </Section>
          );
        })}
      </div>
    );
  }
  if (template === 'op_gantt') {
    const acts = arr(data.activities);
    if (!acts.length) return OP_EMPTY;
    const months = a => (Array.isArray(a.months) ? OP_MONTHS.filter((_, j) => a.months[j]) : []);
    return (
      <Section title="الأنشطة وأشهر تنفيذها">
        <TableView headers={['النشاط', 'المبادرة', 'أشهر التنفيذ']}
          rows={acts.map(a => [opText(a.name), a.source_id ? opText(a.initiative) : 'مضاف يدويًا', months(a).join('، ') || 'لم تُحدَّد'])} />
      </Section>
    );
  }
  if (template === 'op_responsible') {
    const rows = arr(data.rows);
    if (!rows.length) return OP_EMPTY;
    return (
      <Section title="مسؤول التنفيذ لكل نشاط">
        <TableView headers={['النشاط', 'المبادرة', 'مسؤول التنفيذ', 'القسم / الإدارة']}
          rows={rows.map(r => [opText(r.activity), opText(r.initiative), opText(r.responsible), opText(r.department)])} />
      </Section>
    );
  }
  if (template === 'op_budget') {
    const rows = arr(data.rows);
    if (!rows.length) return OP_EMPTY;
    const total = r => (r.total !== undefined && r.total !== '' ? opNum(r.total) : opNum(r.unitCost) * opNum(r.count));
    const grand = rows.reduce((s, r) => s + total(r), 0);
    return (
      <Section title="بنود التكلفة">
        <TableView headers={['النشاط', 'بند التكلفة', 'تكلفة الوحدة', 'العدد', 'الإجمالي']}
          rows={[
            ...rows.map(r => [opText(r.activity), opText(r.item), opText(r.unitCost), opText(r.count), `${total(r).toLocaleString('en-US')} ريال`]),
            ['', '', '', 'الإجمالي الكلي', `${grand.toLocaleString('en-US')} ريال`],
          ]} />
      </Section>
    );
  }
  return null;
}

// ── المكوّن الرئيسي ────────────────────────────────────────────────────────────
const DOC_ORDER = ['executive_summary', 'key_findings', 'implementation', 'monitoring', 'closing_notes'];

export default function FormDataViewer({ data: rawData, template, unitRows }) {
  if (!rawData || Object.keys(rawData).length === 0) {
    return <p style={{ color: colors.gray, fontSize: 13, textAlign: 'center', padding: 20 }}>لا توجد بيانات</p>;
  }
  if (['op_import', 'op_activities', 'op_gantt', 'op_responsible', 'op_budget'].includes(template)) {
    return <OperationalViewer template={template} data={rawData} />;
  }
  // تحليل البيئة الداخلية: الملخص من الجدول المرسل بترتيب صفوفه (نفس ما يراه العميل)
  let data = rawData;
  if ((template === 'swot' || rawData.table) && rawData.table && typeof rawData.table === 'object' && rawData.matrix) {
    const bullet = pts => pts.map(p => `• ${p}`).join('\n');
    data = { ...rawData, matrix: { ...rawData.matrix,
      strengths: bullet(swotPoints(rawData.table, unitRows, 'strength')),
      weaknesses: bullet(swotPoints(rawData.table, unitRows, 'weakness')) } };
  }

  const renderSection = (key, value) => {
    const sectionLabel = LABELS[key] || key;

    // ── قوائم ──
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      const firstItem = value[0];
      // تحديد النوع
      if (key === 'stakeholders_extra') {
        const rowsX = value.filter(r => r && typeof r === 'object' && `${r.name || ''}${r.impact || ''}${r.interest || ''}${r.strategy || ''}`.trim());
        if (!rowsX.length) return null;
        return (
          <Section key={key} title={sectionLabel}>
            <TableView headers={['صاحب المصلحة', 'مستوى التأثير', 'مستوى الاهتمام', 'استراتيجية التعامل']} rows={rowsX.map(r => [r.name, r.impact, r.interest, r.strategy])} />
          </Section>
        );
      }
      const type = key === 'positions' ? 'orgchart'
                 : key === 'kpis'      ? 'kpis'
                 : key === 'initiatives' ? 'initiatives'
                 : 'generic';

      if (typeof firstItem === 'string') {
        return (
          <Section key={key} title={sectionLabel}>
            <ListValue items={value} />
          </Section>
        );
      }
      return (
        <Section key={key} title={sectionLabel}>
          <ObjectListViewer items={value} type={type} />
        </Section>
      );
    }

    // ── كائنات متداخلة ──
    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      if (entries.length === 0) return null;
      const firstKey = entries[0][0];

      // SWOT table (مفاتيح بصيغة عربي__suffix)
      if (firstKey.includes('__') && /^[؀-ۿ]/.test(firstKey)) {
        const suffixes = [...new Set(entries.map(([k]) => k.split('__').pop()))];
        // PESTEL factors
        if (suffixes.includes('impact') || suffixes.includes('level')) {
          return (
            <Section key={key} title={sectionLabel}>
              <SuffixTableViewer data={value} colKeys={['impact', 'level', 'desc']} colLabels={['التأثير', 'مستوى التأثير', 'الوصف']} />
            </Section>
          );
        }
        // PESTEL stakeholders
        if (suffixes.includes('strategy') || suffixes.includes('interest')) {
          return (
            <Section key={key} title={sectionLabel}>
              <SuffixTableViewer data={value} colKeys={['impact', 'interest', 'strategy']} colLabels={['التأثير', 'درجة الاهتمام', 'الاستراتيجية']} />
            </Section>
          );
        }
        // SWOT table (strength, weakness, notes)
        if (suffixes.includes('strength') || suffixes.includes('weakness')) {
          return (
            <Section key={key} title={sectionLabel}>
              <SwotTableViewer data={value} unitRows={unitRows} />
            </Section>
          );
        }
        // Needs table (desc, priority, source)
        if (suffixes.includes('priority') || suffixes.includes('source')) {
          return (
            <Section key={key} title={sectionLabel}>
              <SuffixTableViewer data={value} colKeys={['desc', 'priority', 'source']} colLabels={['الوصف', 'الأولوية', 'المصدر']} />
            </Section>
          );
        }
        // generic suffix table
        return (
          <Section key={key} title={sectionLabel}>
            <SuffixTableViewer data={value} colKeys={suffixes} colLabels={suffixes.map(s => LABELS[s] || s)} />
          </Section>
        );
      }

      // TOC
      if (key === 'toc') {
        return <Section key={key} title={sectionLabel}><TocViewer data={value} /></Section>;
      }
      // BMC
      if (key === 'bmc') {
        return <Section key={key} title={sectionLabel}><BmcViewer data={value} /></Section>;
      }
      // TOWS (so, wo, st, wt)
      if ('so' in value || 'wo' in value) {
        return (
          <Section key={key} title={sectionLabel}>
            <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 10 }}>
              {[['so','#E8F8F2','#0B7F5D'], ['wo','#FEF3EC','#A33F12'], ['st','#EAF4FD','#1A65AD'], ['wt','#FCEBEB','#C53A3A']].map(([k, bg, clr]) => value[k] ? (
                <div key={k} style={{ padding: 12, background: bg, borderRadius: 10, border: `1px solid ${clr}30` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: clr, marginBottom: 6 }}>{LABELS[k]}</div>
                  <div style={{ fontSize: 12, color: '#334452', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{value[k]}</div>
                </div>
              ) : null)}
            </div>
          </Section>
        );
      }
      // Directions (vision, mission)
      if ('vision' in value || 'mission' in value) {
        return (
          <Section key={key} title={sectionLabel}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['vision', 'mission'].map(k => value[k] ? (
                <div key={k} style={{ padding: 12, background: colors.primarySoft, borderRadius: 10, border: `1px solid ${colors.primary}30` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: colors.ink, marginBottom: 4 }}>{LABELS[k]}</div>
                  <div style={{ fontSize: 13, color: '#334452', lineHeight: 1.8 }}>{value[k]}</div>
                </div>
              ) : null)}
            </div>
          </Section>
        );
      }
      // SWOT matrix (strengths, weaknesses, opportunities, threats)
      if ('strengths' in value || 'weaknesses' in value) {
        return (
          <Section key={key} title={sectionLabel}>
            <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 10 }}>
              {[['strengths','#E8F8F2','#0B7F5D',<DfIcon key="muscle" name="muscle" size={20} />], ['weaknesses','#FCEBEB','#C53A3A',<DfIcon key="warning" name="warning" size={20} />], ['opportunities','#EAF4FD','#1A65AD',<DfIcon key="rocket" name="rocket" size={20} />], ['threats','#FEF3EC','#A33F12',<DfIcon key="shield" name="shield" size={20} />]].map(([k, bg, clr, ico]) => value[k] ? (
                <div key={k} style={{ padding: 12, background: bg, borderRadius: 10, border: `1px solid ${clr}30` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: clr, marginBottom: 6 }}>{ico} {LABELS[k]}</div>
                  <div style={{ fontSize: 12, color: '#334452', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{value[k]}</div>
                </div>
              ) : null)}
            </div>
          </Section>
        );
      }
      // Document sections
      if ('executive_summary' in value || 'key_findings' in value) {
        return (
          <Section key={key} title={sectionLabel}>
            {[...DOC_ORDER.filter(k => k in value), ...Object.keys(value).filter(k => !DOC_ORDER.includes(k))].map(k => (
              <div key={k} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>{LABELS[k] || k}</div>
                <TextValue value={value[k] || '—'} />
              </div>
            ))}
          </Section>
        );
      }
      // fallback generic object
      return (
        <Section key={key} title={sectionLabel}>
          {Object.entries(value).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.primary, marginBottom: 4 }}>{LABELS[k] || k}</div>
              {Array.isArray(v)
                ? (v.length > 0 && typeof v[0] === 'object'
                    ? <ObjectListViewer items={v} type="generic" />
                    : <ListValue items={v.map(x => safeStr(x))} />)
                : typeof v === 'object' && v !== null
                    ? <TextValue value={safeStr(v)} />
                    : <TextValue value={v} />}
            </div>
          ))}
        </Section>
      );
    }

    // ── قيمة بسيطة ──
    return (
      <div key={key} style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.primary, marginBottom: 4 }}>{sectionLabel}</div>
        <TextValue value={value} />
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* needs_items مصدر تحرير الجدول؛ يُعرض محتواه عبر needs_table */}
      {Object.entries(data).filter(([k]) => k !== 'needs_items').map(([k, v]) => renderSection(k, v))}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div>
    <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${colors.primarySoft}`, display: 'flex', alignItems: 'center', gap: 6 }}>
      {title}
    </div>
    {children}
  </div>
);
