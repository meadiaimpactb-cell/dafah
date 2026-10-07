import React from 'react';

const colors = {
  teal: '#1A6B7C', tealDark: '#14505E', tealLight: '#E8F4F6',
  orange: '#E8620A', green: '#16a34a',
  gray: '#6B7280', grayLight: '#F3F4F6', grayBorder: '#E5E7EB',
};

// ── ترجمة المفاتيح ─────────────────────────────────────────────────────────────
const LABELS = {
  // هيكل عام
  table: 'الجدول', matrix: 'المصفوفة', tows: 'مصفوفة TOWS',
  factors: 'عوامل البيئة الخارجية', stakeholders: 'أصحاب المصلحة',
  needs_table: 'جدول الاحتياجات', target_community: 'المجتمع المستهدف',
  gap_analysis: 'تحليل الفجوات', positions: 'الهيكل الوظيفي',
  directions: 'التوجهات الاستراتيجية', values_list: 'القيم المؤسسية',
  goals_list: 'الأهداف الاستراتيجية', initiatives: 'المبادرات',
  kpis: 'مؤشرات الأداء الرئيسية', toc: 'نظرية التغيير',
  bmc: 'نموذج العمل المؤسسي', document: 'الوثيقة الاستراتيجية',

  // SWOT
  strengths: 'نقاط القوة', weaknesses: 'نقاط الضعف',
  opportunities: 'الفرص', threats: 'التهديدات',

  // TOC / بنية TOC
  inputs: 'المدخلات', activities: 'الأنشطة', outputs: 'المخرجات',
  outcomes: 'النتائج', impact: 'الأثر', assumptions: 'الافتراضات',

  // BMC
  customer_segments: 'شرائح العملاء / المستفيدين',
  value_proposition: 'القيمة المقدمة', channels: 'قنوات الوصول',
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

  // وثيقة
  executive_summary: 'الملخص التنفيذي',
  key_findings: 'أبرز النتائج',
  implementation: 'خطة التنفيذ',

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
  <div style={{ fontSize: 13, color: '#374151', padding: '8px 12px', background: colors.grayLight, borderRadius: 6, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
    {String(value ?? '')}
  </div>
);

// ── قائمة نصية ────────────────────────────────────────────────────────────────
const ListValue = ({ items }) => (
  <ul style={{ margin: 0, paddingRight: 20 }}>
    {items.map((item, i) => (
      <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.9, padding: '2px 0' }}>{item}</li>
    ))}
  </ul>
);

// ── جدول عام ──────────────────────────────────────────────────────────────────
const TableView = ({ headers, rows }) => (
  <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${colors.grayBorder}` }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: '8px 12px', background: colors.teal, color: 'white', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${colors.grayBorder}`, background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '8px 12px', color: '#374151', verticalAlign: 'top', lineHeight: 1.7 }}>{cell || '—'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── عارض بيانات SWOT table ────────────────────────────────────────────────────
const SwotTableViewer = ({ data }) => {
  const groups = {};
  Object.entries(data).forEach(([k, v]) => {
    const [rowKey, colKey] = k.split('__');
    if (!groups[rowKey]) groups[rowKey] = {};
    groups[rowKey][colKey] = v;
  });
  const rows = Object.entries(groups).map(([row, cols]) => [row, cols.strength || '—', cols.weakness || '—', cols.notes || '—']);
  return <TableView headers={['المحور', 'نقطة قوة', 'نقطة ضعف', 'ملاحظات']} rows={rows} />;
};

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
            <div style={{ padding: '10px 14px', background: colors.tealLight, borderBottom: `1px solid ${colors.grayBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 13, color: colors.tealDark }}>{ini.name}</strong>
              {ini.budget && <span style={{ fontSize: 11, color: colors.teal, fontWeight: 600 }}>💰 {ini.budget} ريال</span>}
            </div>
            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              {[
                ['الهدف', ini.goal], ['المسؤول', ini.owner],
                ['تاريخ البدء', ini.start_date], ['تاريخ الانتهاء', ini.end_date],
              ].map(([lbl, val]) => val ? (
                <div key={lbl} style={{ fontSize: 12 }}>
                  <span style={{ color: colors.gray }}>{lbl}: </span>
                  <span style={{ color: '#374151', fontWeight: 600 }}>{val}</span>
                </div>
              ) : null)}
              {ini.description && (
                <div style={{ gridColumn: '1/-1', fontSize: 12, color: '#374151', lineHeight: 1.7 }}>
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
        <div key={i} style={{ padding: '8px 12px', background: colors.grayLight, borderRadius: 8, fontSize: 13, color: '#374151' }}>
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
  const icons = { inputs: '📥', activities: '⚙️', outputs: '📤', outcomes: '🎯', impact: '🌟', assumptions: '📋' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {order.map(k => data[k] ? (
        <div key={k} style={{ border: `1px solid ${colors.grayBorder}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: colors.tealLight, fontSize: 13, fontWeight: 700, color: colors.tealDark }}>
            {icons[k]} {LABELS[k] || k}
          </div>
          <div style={{ padding: '10px 14px', fontSize: 13, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{data[k]}</div>
        </div>
      ) : null)}
    </div>
  );
};

// ── عارض BMC ──────────────────────────────────────────────────────────────────
const BmcViewer = ({ data }) => {
  const blocks = [
    ['value_proposition', '💎'], ['customer_segments', '👥'], ['channels', '📡'],
    ['relationships', '🤝'], ['key_activities', '⚙️'], ['key_resources', '🔧'],
    ['partners', '🏛️'], ['revenue_streams', '💰'], ['cost_structure', '📊'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {blocks.map(([k, icon]) => data[k] ? (
        <div key={k} style={{ border: `1px solid ${colors.grayBorder}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '7px 12px', background: colors.tealLight, fontSize: 12, fontWeight: 700, color: colors.tealDark }}>
            {icon} {LABELS[k]}
          </div>
          <div style={{ padding: '8px 12px', fontSize: 12, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{data[k]}</div>
        </div>
      ) : null)}
    </div>
  );
};

// ── المكوّن الرئيسي ────────────────────────────────────────────────────────────
export default function FormDataViewer({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <p style={{ color: colors.gray, fontSize: 13, textAlign: 'center', padding: 20 }}>لا توجد بيانات</p>;
  }

  const renderSection = (key, value) => {
    const sectionLabel = LABELS[key] || key;

    // ── قوائم ──
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      const firstItem = value[0];
      // تحديد النوع
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
              <SwotTableViewer data={value} />
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['so','#F0FDF4','#16a34a'], ['wo','#FFF7ED','#E8620A'], ['st','#EFF6FF','#1D4ED8'], ['wt','#FEF2F2','#dc2626']].map(([k, bg, clr]) => value[k] ? (
                <div key={k} style={{ padding: 12, background: bg, borderRadius: 10, border: `1px solid ${clr}30` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: clr, marginBottom: 6 }}>{LABELS[k]}</div>
                  <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{value[k]}</div>
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
                <div key={k} style={{ padding: 12, background: colors.tealLight, borderRadius: 10, border: `1px solid ${colors.teal}30` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: colors.tealDark, marginBottom: 4 }}>{LABELS[k]}</div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>{value[k]}</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['strengths','#F0FDF4','#16a34a','💪'], ['weaknesses','#FEF2F2','#dc2626','⚠️'], ['opportunities','#EFF6FF','#1D4ED8','🚀'], ['threats','#FFF7ED','#E8620A','🛡️']].map(([k, bg, clr, ico]) => value[k] ? (
                <div key={k} style={{ padding: 12, background: bg, borderRadius: 10, border: `1px solid ${clr}30` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: clr, marginBottom: 6 }}>{ico} {LABELS[k]}</div>
                  <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{value[k]}</div>
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
            {Object.entries(value).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>{LABELS[k] || k}</div>
                <TextValue value={v} />
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
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.teal, marginBottom: 4 }}>{LABELS[k] || k}</div>
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
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.teal, marginBottom: 4 }}>{sectionLabel}</div>
        <TextValue value={value} />
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {Object.entries(data).map(([k, v]) => renderSection(k, v))}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div>
    <div style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${colors.tealLight}`, display: 'flex', alignItems: 'center', gap: 6 }}>
      {title}
    </div>
    {children}
  </div>
);
