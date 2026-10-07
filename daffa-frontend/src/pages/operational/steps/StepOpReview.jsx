import React, { useState, useEffect } from 'react';
import { operationalApi } from '../../../api/operational';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

const STATUS_MAP = {
  not_started: { label: 'لم يبدأ',         bg: '#f3f4f6', color: '#6b7280' },
  in_progress: { label: 'قيد العمل',       bg: '#fef3c7', color: '#d97706' },
  submitted:   { label: 'بانتظار المراجعة', bg: '#dbeafe', color: '#2563eb' },
  reviewing:   { label: 'قيد المراجعة',    bg: '#ede9fe', color: '#7c3aed' },
  revision:    { label: 'يحتاج تعديل',     bg: '#fee2e2', color: '#dc2626' },
  approved:    { label: 'معتمد',           bg: '#dcfce7', color: '#16a34a' },
};

export default function StepOpReview({ workflow, setActiveUnit, initialUnits }) {
  const [units,   setUnits]   = useState(initialUnits || []);
  const [loading, setLoading] = useState(!initialUnits);

  useEffect(() => {
    if (initialUnits) return;
    operationalApi.getUnits()
      .then(res => setUnits(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: colors.teal }}>جاري تحميل البيانات...</div>;

  const approved  = units.filter(u => u.submission_status === 'approved').length;
  const revision  = units.filter(u => u.submission_status === 'revision').length;
  const reviewing = units.filter(u => ['submitted', 'reviewing'].includes(u.submission_status)).length;

  return (
    <div className="animate-in">
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>مراجعة المستشار</h2>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          يقوم المستشار <strong>{workflow?.consultant?.name}</strong> بمراجعة نماذج العمل التشغيلية
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="معتمدة"       value={approved}  bg="#dcfce7" color="#16a34a" icon="✓" />
        <StatCard label="قيد المراجعة" value={reviewing} bg="#dbeafe" color="#2563eb" icon="⏳" />
        <StatCard label="تحتاج تعديل"  value={revision}  bg="#fee2e2" color="#dc2626" icon="⚠" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {units.map((unit, i) => {
          const st = STATUS_MAP[unit.submission_status] || STATUS_MAP.not_started;
          const isRevision = unit.submission_status === 'revision';
          const isApproved = unit.submission_status === 'approved';
          return (
            <div
              key={unit.id}
              onClick={() => setActiveUnit(unit)}
              style={{
                background: '#fff', borderRadius: 12, padding: '16px 20px',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                border: `1.5px solid ${isRevision ? '#fca5a5' : isApproved ? '#86efac' : '#f3f4f6'}`,
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)'; }}
            >
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark }}>{unit.name}</div>
                {isRevision && unit.consultant_notes && (
                  <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4, background: '#fef2f2', padding: '4px 8px', borderRadius: 6 }}>
                    ⚠️ ملاحظة: {unit.consultant_notes}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
              <ActionBtn unit={unit} setActiveUnit={setActiveUnit} />
            </div>
          );
        })}
      </div>

      {reviewing === 0 && revision === 0 && approved < 5 && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#0369a1' }}>
          ⏳ جميع الوحدات بانتظار مراجعة المستشار. سيتم إشعارك عند اكتمال المراجعة.
        </div>
      )}
      {revision > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#dc2626' }}>
          ⚠️ يوجد {revision} وحدة تحتاج إلى تعديل. اضغط على "تعديل" لإجراء التعديلات المطلوبة.
        </div>
      )}
    </div>
  );
}

const ActionBtn = ({ unit, setActiveUnit }) => {
  const s = unit.submission_status;
  if (s === 'approved') return (
    <button onClick={e => { e.stopPropagation(); setActiveUnit(unit); }} style={{ padding: '7px 14px', background: '#f3f4f6', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap' }}>عرض</button>
  );
  if (s === 'revision') return (
    <button onClick={e => { e.stopPropagation(); setActiveUnit(unit); }} style={{ padding: '7px 14px', background: '#E8620A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap' }}>تعديل ←</button>
  );
  return (
    <button onClick={e => { e.stopPropagation(); setActiveUnit(unit); }} style={{ padding: '7px 14px', background: '#1A6B7C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap' }}>فتح ←</button>
  );
};

const StatCard = ({ label, value, bg, color, icon }) => (
  <div style={{ background: bg, borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{icon} {value}</div>
    <div style={{ fontSize: 12, color, marginTop: 4, fontWeight: 600 }}>{label}</div>
  </div>
);
