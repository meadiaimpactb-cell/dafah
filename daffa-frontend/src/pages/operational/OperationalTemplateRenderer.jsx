import React, { useState, useEffect } from 'react';
import { operationalApi } from '../../api/operational';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };
const inp = { width: '100%', padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 12, fontFamily: "'Cairo', sans-serif", boxSizing: 'border-box', direction: 'rtl', textAlign: 'right' };

// ══ Unit 1: المبادرات الاستراتيجية (استيراد) ══════════════════════════════
function TemplateOpImport({ formData, setFormData }) {
  const [initiatives, setInitiatives] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);

  useEffect(() => {
    if (formData.initiatives?.length) {
      setInitiatives(formData.initiatives);
      setLoadingInit(false);
      return;
    }
    operationalApi.getStrategicInitiatives()
      .then(res => {
        const inits = res.data.initiatives || [];
        setInitiatives(inits);
        setFormData(prev => ({ ...prev, initiatives: inits, confirmed: false }));
      })
      .finally(() => setLoadingInit(false));
  }, []);

  if (loadingInit) return <div style={{ textAlign: 'center', padding: 30, color: colors.teal }}>جاري تحميل المبادرات من الخطة الاستراتيجية...</div>;

  return (
    <div>
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#0369a1' }}>
        📥 تم استيراد المبادرات الاستراتيجية المعتمدة تلقائياً من خطتك الاستراتيجية
      </div>
      {initiatives.length === 0 ? (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: 16, fontSize: 13, color: '#92400e', textAlign: 'center' }}>
          ⚠️ لا توجد مبادرات في الخطة الاستراتيجية. تأكد من إكمال الوحدة الخامسة في التخطيط الاستراتيجي.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {initiatives.map((init, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{init}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: 20, fontWeight: 600 }}>معتمدة</span>
              </div>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: formData.confirmed ? '#f0fdf4' : '#f9fafb', border: `1.5px solid ${formData.confirmed ? '#86efac' : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!formData.confirmed} onChange={e => setFormData(prev => ({ ...prev, confirmed: e.target.checked }))} style={{ width: 16, height: 16, accentColor: colors.teal }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>أؤكد استيراد هذه المبادرات والمضي قدماً في التخطيط التشغيلي</span>
          </label>
        </>
      )}
    </div>
  );
}

// ══ Unit 2: المبادرات التشغيلية ═══════════════════════════════════════════
function TemplateOpActivities({ formData, setFormData }) {
  const rows = formData.rows || [];

  const addRow = () => setFormData(prev => ({
    ...prev,
    rows: [...(prev.rows || []), { initiative: '', activity: '', description: '', expected_output: '' }],
  }));

  const updateRow = (i, field, value) => setFormData(prev => {
    const r = [...(prev.rows || [])];
    r[i] = { ...r[i], [field]: value };
    return { ...prev, rows: r };
  });

  const removeRow = i => setFormData(prev => {
    const r = [...(prev.rows || [])];
    r.splice(i, 1);
    return { ...prev, rows: r };
  });

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['المبادرة الاستراتيجية', 'النشاط التشغيلي', 'الوصف', 'المخرج المتوقع', ''].map((h, i) => (
                <th key={i} style={{ background: colors.teal, color: '#fff', padding: '8px 10px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}><input value={row.initiative || ''} onChange={e => updateRow(i, 'initiative', e.target.value)} style={inp} placeholder="اسم المبادرة" /></td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}><input value={row.activity || ''} onChange={e => updateRow(i, 'activity', e.target.value)} style={inp} placeholder="اسم النشاط" /></td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}><input value={row.description || ''} onChange={e => updateRow(i, 'description', e.target.value)} style={inp} placeholder="وصف النشاط" /></td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}><input value={row.expected_output || ''} onChange={e => updateRow(i, 'expected_output', e.target.value)} style={inp} placeholder="المخرج المتوقع" /></td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}><button onClick={() => removeRow(i)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 13 }}>لا توجد أنشطة بعد. أضف نشاطاً لكل مبادرة استراتيجية.</div>}
      <button onClick={addRow} style={{ marginTop: 12, padding: '9px 20px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>+ إضافة نشاط</button>
    </div>
  );
}

// ══ Unit 3: شهور التنفيذ (Gantt) ═════════════════════════════════════════
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function TemplateOpGantt({ formData, setFormData }) {
  const timeline = formData.timeline || [];

  const addRow = () => setFormData(prev => ({
    ...prev,
    timeline: [...(prev.timeline || []), { activity: '', start_month: 1, end_month: 1 }],
  }));

  const updateRow = (i, field, value) => setFormData(prev => {
    const t = [...(prev.timeline || [])];
    t[i] = { ...t[i], [field]: value };
    return { ...prev, timeline: t };
  });

  const removeRow = i => setFormData(prev => {
    const t = [...(prev.timeline || [])];
    t.splice(i, 1);
    return { ...prev, timeline: t };
  });

  const selStyle = { ...inp, padding: '6px 8px' };

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ background: colors.teal, color: '#fff', padding: '8px 10px', textAlign: 'right', fontWeight: 700, minWidth: 180 }}>النشاط التشغيلي</th>
              <th style={{ background: colors.teal, color: '#fff', padding: '8px 10px', textAlign: 'center', fontWeight: 700, minWidth: 130 }}>شهر البدء</th>
              <th style={{ background: colors.teal, color: '#fff', padding: '8px 10px', textAlign: 'center', fontWeight: 700, minWidth: 130 }}>شهر الانتهاء</th>
              {MONTHS.map((m, i) => (
                <th key={i} style={{ background: colors.teal, color: '#fff', padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: 10, minWidth: 38 }}>{m.slice(0, 3)}</th>
              ))}
              <th style={{ background: colors.teal, color: '#fff', padding: '8px', minWidth: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}>
                  <input value={row.activity || ''} onChange={e => updateRow(i, 'activity', e.target.value)} style={inp} placeholder="اسم النشاط" />
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}>
                  <select value={row.start_month || 1} onChange={e => updateRow(i, 'start_month', +e.target.value)} style={selStyle}>
                    {MONTHS.map((m, mi) => <option key={mi} value={mi + 1}>{m}</option>)}
                  </select>
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}>
                  <select value={row.end_month || 1} onChange={e => updateRow(i, 'end_month', +e.target.value)} style={selStyle}>
                    {MONTHS.map((m, mi) => <option key={mi} value={mi + 1}>{m}</option>)}
                  </select>
                </td>
                {[...Array(12)].map((_, mi) => {
                  const active = (row.start_month <= mi + 1) && (row.end_month >= mi + 1);
                  return (
                    <td key={mi} style={{ border: '1px solid #e5e7eb', textAlign: 'center', padding: 2 }}>
                      <div style={{ width: 28, height: 18, borderRadius: 4, background: active ? colors.teal : '#f3f4f6', margin: '0 auto' }} />
                    </td>
                  );
                })}
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <button onClick={() => removeRow(i)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {timeline.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 13 }}>أضف الأنشطة وحدد شهور تنفيذها.</div>}
      <button onClick={addRow} style={{ marginTop: 12, padding: '9px 20px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>+ إضافة نشاط</button>
    </div>
  );
}

// ══ Unit 4: مسؤول التنفيذ ═════════════════════════════════════════════════
function TemplateOpResponsible({ formData, setFormData }) {
  const responsibilities = formData.responsibilities || [];

  const addRow = () => setFormData(prev => ({
    ...prev,
    responsibilities: [...(prev.responsibilities || []), { activity: '', responsible: '', department: '', notes: '' }],
  }));

  const updateRow = (i, field, value) => setFormData(prev => {
    const r = [...(prev.responsibilities || [])];
    r[i] = { ...r[i], [field]: value };
    return { ...prev, responsibilities: r };
  });

  const removeRow = i => setFormData(prev => {
    const r = [...(prev.responsibilities || [])];
    r.splice(i, 1);
    return { ...prev, responsibilities: r };
  });

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['النشاط التشغيلي', 'المسؤول', 'القسم / الإدارة', 'ملاحظات', ''].map((h, i) => (
                <th key={i} style={{ background: colors.teal, color: '#fff', padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responsibilities.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}><input value={row.activity || ''} onChange={e => updateRow(i, 'activity', e.target.value)} style={inp} placeholder="اسم النشاط" /></td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}><input value={row.responsible || ''} onChange={e => updateRow(i, 'responsible', e.target.value)} style={inp} placeholder="اسم المسؤول" /></td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}><input value={row.department || ''} onChange={e => updateRow(i, 'department', e.target.value)} style={inp} placeholder="القسم أو الإدارة" /></td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}><input value={row.notes || ''} onChange={e => updateRow(i, 'notes', e.target.value)} style={inp} placeholder="ملاحظات إضافية" /></td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}><button onClick={() => removeRow(i)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {responsibilities.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 13 }}>أضف الأنشطة وعيّن المسؤولين عنها.</div>}
      <button onClick={addRow} style={{ marginTop: 12, padding: '9px 20px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>+ إضافة نشاط</button>
    </div>
  );
}

// ══ Unit 5: التكلفة المالية ════════════════════════════════════════════════
const COST_TYPES = ['رواتب وأجور', 'مواد ومستلزمات', 'نقل ومواصلات', 'تقنية وبرمجيات', 'تسويق وإعلان', 'استشارات', 'إدارة وتشغيل', 'أخرى'];

function TemplateOpBudget({ formData, setFormData }) {
  const costs = formData.costs || [];
  const total = costs.reduce((s, r) => s + (+(r.cost) || 0), 0);

  const addRow = () => setFormData(prev => ({
    ...prev,
    costs: [...(prev.costs || []), { activity: '', cost_type: 'أخرى', cost: '', notes: '' }],
  }));

  const updateRow = (i, field, value) => setFormData(prev => {
    const c = [...(prev.costs || [])];
    c[i] = { ...c[i], [field]: value };
    return { ...prev, costs: c, total: c.reduce((s, r) => s + (+(r.cost) || 0), 0) };
  });

  const removeRow = i => setFormData(prev => {
    const c = [...(prev.costs || [])];
    c.splice(i, 1);
    return { ...prev, costs: c, total: c.reduce((s, r) => s + (+(r.cost) || 0), 0) };
  });

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['النشاط', 'بند التكلفة', 'التكلفة (ريال)', 'ملاحظات', ''].map((h, i) => (
                <th key={i} style={{ background: colors.teal, color: '#fff', padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {costs.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}><input value={row.activity || ''} onChange={e => updateRow(i, 'activity', e.target.value)} style={inp} placeholder="اسم النشاط" /></td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}>
                  <select value={row.cost_type || 'أخرى'} onChange={e => updateRow(i, 'cost_type', e.target.value)} style={{ ...inp, padding: '6px 8px' }}>
                    {COST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}><input type="number" value={row.cost || ''} onChange={e => updateRow(i, 'cost', e.target.value)} style={{ ...inp, textAlign: 'left', direction: 'ltr' }} placeholder="0" min="0" /></td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb' }}><input value={row.notes || ''} onChange={e => updateRow(i, 'notes', e.target.value)} style={inp} placeholder="ملاحظات" /></td>
                <td style={{ padding: '6px 8px', border: '1px solid #e5e7eb', textAlign: 'center' }}><button onClick={() => removeRow(i)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>حذف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {costs.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 13 }}>أضف بنود التكلفة لكل نشاط.</div>}
      <button onClick={addRow} style={{ marginTop: 12, padding: '9px 20px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>+ إضافة بند</button>

      {costs.length > 0 && (
        <div style={{ marginTop: 16, padding: '14px 18px', background: `${colors.teal}0d`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark }}>الإجمالي التقديري</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: colors.teal }}>{total.toLocaleString('en-US')} ريال</span>
        </div>
      )}
    </div>
  );
}

// ══ الـ Main Renderer ══════════════════════════════════════════════════════
export default function OperationalTemplateRenderer({ unit, formData, setFormData }) {
  const type = unit?.template_type;
  if (type === 'op_import')      return <TemplateOpImport      formData={formData} setFormData={setFormData} />;
  if (type === 'op_activities')  return <TemplateOpActivities  formData={formData} setFormData={setFormData} />;
  if (type === 'op_gantt')       return <TemplateOpGantt       formData={formData} setFormData={setFormData} />;
  if (type === 'op_responsible') return <TemplateOpResponsible formData={formData} setFormData={setFormData} />;
  if (type === 'op_budget')      return <TemplateOpBudget      formData={formData} setFormData={setFormData} />;
  return <div style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>نوع النموذج غير معروف: {type}</div>;
}
