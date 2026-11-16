import DfIcon from '../../../components/ui/DfIcon';
import React, { useState, useEffect } from 'react';
import { operationalApi } from '../../../api/operational';

const colors = { primary: '#235D7F', ink: '#0E2A3D', orange: '#EF6A2C' };

const STATUS_MAP = {
  not_started: { label: 'لم يبدأ',         bg: '#F3EFE8', color: '#5E6B78' },
  in_progress: { label: 'قيد العمل',       bg: '#FDE2D2', color: '#A33F12' },
  submitted:   { label: 'بانتظار المراجعة', bg: '#CFE5FA', color: '#1F74C4' },
  reviewing:   { label: 'قيد المراجعة',    bg: '#D9E8F1', color: '#235D7F' },
  revision:    { label: 'يحتاج تعديل',     bg: '#F8D3D3', color: '#C53A3A' },
  approved:    { label: 'معتمد',           bg: '#C9EFE1', color: '#0B7F5D' },
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

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: colors.primary }}>جاري تحميل البيانات...</div>;

  const approved  = units.filter(u => u.submission_status === 'approved').length;
  const revision  = units.filter(u => u.submission_status === 'revision').length;
  const reviewing = units.filter(u => ['submitted', 'reviewing'].includes(u.submission_status)).length;

  return (
    <div className="animate-in">
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 8px rgba(14,42,61,0.06)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>مراجعة المستشار</h2>
        <p style={{ fontSize: 13, color: '#5E6B78' }}>
          يقوم المستشار <strong>{workflow?.consultant?.name}</strong> بمراجعة نماذج العمل التشغيلية
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-3)', gap: 14, marginBottom: 20 }}>
        <StatCard label="معتمدة"       value={approved}  bg="#C9EFE1" color="#0B7F5D" icon="✓" />
        <StatCard label="قيد المراجعة" value={reviewing} bg="#CFE5FA" color="#1F74C4" icon={<DfIcon name="hourglass" size={20} />} />
        <StatCard label="تحتاج تعديل"  value={revision}  bg="#F8D3D3" color="#C53A3A" icon={<DfIcon name="warning" size={20} />} />
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
                boxShadow: '0 1px 8px rgba(14,42,61,0.06)',
                border: `1.5px solid ${isRevision ? '#E88E8E' : isApproved ? '#7FD3B5' : '#F3EFE8'}`,
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,42,61,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(14,42,61,0.06)'; }}
            >
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>{unit.name}</div>
                {isRevision && unit.consultant_notes && (
                  <div style={{ fontSize: 12, color: '#C53A3A', marginTop: 4, background: '#FCEBEB', padding: '4px 8px', borderRadius: 6 }}>
                    <DfIcon name="warning" size={18} style={{ marginInlineEnd: 6 }} />ملاحظة: {unit.consultant_notes}
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
        <div style={{ background: '#EAF4FD', border: '1px solid #A9D2F5', borderRadius: 10, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#1A65AD' }}>
          <DfIcon name="hourglass" size={18} style={{ marginInlineEnd: 6 }} />جميع الوحدات بانتظار مراجعة المستشار. سيتم إشعارك عند اكتمال المراجعة.
        </div>
      )}
      {revision > 0 && (
        <div style={{ background: '#FCEBEB', border: '1px solid #F1B2B2', borderRadius: 10, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#C53A3A' }}>
          <DfIcon name="warning" size={18} style={{ marginInlineEnd: 6 }} />يوجد {revision} وحدة تحتاج إلى تعديل. اضغط على "تعديل" لإجراء التعديلات المطلوبة.
        </div>
      )}
    </div>
  );
}

const ActionBtn = ({ unit, setActiveUnit }) => {
  const s = unit.submission_status;
  if (s === 'approved') return (
    <button onClick={e => { e.stopPropagation(); setActiveUnit(unit); }} style={{ padding: '7px 14px', background: '#F3EFE8', color: '#5E6B78', border: '1.5px solid #E8E3DA', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit", whiteSpace: 'nowrap' }}>عرض</button>
  );
  if (s === 'revision') return (
    <button onClick={e => { e.stopPropagation(); setActiveUnit(unit); }} style={{ padding: '7px 14px', background: '#EF6A2C', color: '#0E2A3D', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit", whiteSpace: 'nowrap' }}>تعديل ←</button>
  );
  return (
    <button onClick={e => { e.stopPropagation(); setActiveUnit(unit); }} style={{ padding: '7px 14px', background: '#235D7F', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit", whiteSpace: 'nowrap' }}>فتح ←</button>
  );
};

const StatCard = ({ label, value, bg, color, icon }) => (
  <div style={{ background: bg, borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{icon} {value}</div>
    <div style={{ fontSize: 12, color, marginTop: 4, fontWeight: 600 }}>{label}</div>
  </div>
);
