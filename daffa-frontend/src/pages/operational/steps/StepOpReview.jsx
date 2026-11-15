import DfIcon from '../../../components/ui/DfIcon';
import React, { useState, useEffect } from 'react';
import { operationalApi } from '../../../api/operational';

const colors = { primary: '#5546D6', ink: '#1B1746', orange: '#F5A524' };

const STATUS_MAP = {
  not_started: { label: 'لم يبدأ',         bg: '#F3EFE8', color: '#67637A' },
  in_progress: { label: 'قيد العمل',       bg: '#FEEDC6', color: '#9A5B07' },
  submitted:   { label: 'بانتظار المراجعة', bg: '#CFE5FA', color: '#1F74C4' },
  reviewing:   { label: 'قيد المراجعة',    bg: '#E7E5FD', color: '#5546D6' },
  revision:    { label: 'يحتاج تعديل',     bg: '#FAD4CE', color: '#D03F2A' },
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
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 8px rgba(27,23,70,0.06)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>مراجعة المستشار</h2>
        <p style={{ fontSize: 13, color: '#67637A' }}>
          يقوم المستشار <strong>{workflow?.consultant?.name}</strong> بمراجعة نماذج العمل التشغيلية
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-3)', gap: 14, marginBottom: 20 }}>
        <StatCard label="معتمدة"       value={approved}  bg="#C9EFE1" color="#0B7F5D" icon="✓" />
        <StatCard label="قيد المراجعة" value={reviewing} bg="#CFE5FA" color="#1F74C4" icon={<DfIcon name="hourglass" size={20} />} />
        <StatCard label="تحتاج تعديل"  value={revision}  bg="#FAD4CE" color="#D03F2A" icon={<DfIcon name="warning" size={20} />} />
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
                boxShadow: '0 1px 8px rgba(27,23,70,0.06)',
                border: `1.5px solid ${isRevision ? '#EE9A8C' : isApproved ? '#7FD3B5' : '#F3EFE8'}`,
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,23,70,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(27,23,70,0.06)'; }}
            >
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>{unit.name}</div>
                {isRevision && unit.consultant_notes && (
                  <div style={{ fontSize: 12, color: '#D03F2A', marginTop: 4, background: '#FDECE9', padding: '4px 8px', borderRadius: 6 }}>
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
        <div style={{ background: '#FDECE9', border: '1px solid #F5B8AE', borderRadius: 10, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#D03F2A' }}>
          <DfIcon name="warning" size={18} style={{ marginInlineEnd: 6 }} />يوجد {revision} وحدة تحتاج إلى تعديل. اضغط على "تعديل" لإجراء التعديلات المطلوبة.
        </div>
      )}
    </div>
  );
}

const ActionBtn = ({ unit, setActiveUnit }) => {
  const s = unit.submission_status;
  if (s === 'approved') return (
    <button onClick={e => { e.stopPropagation(); setActiveUnit(unit); }} style={{ padding: '7px 14px', background: '#F3EFE8', color: '#67637A', border: '1.5px solid #E8E3DA', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit", whiteSpace: 'nowrap' }}>عرض</button>
  );
  if (s === 'revision') return (
    <button onClick={e => { e.stopPropagation(); setActiveUnit(unit); }} style={{ padding: '7px 14px', background: '#F5A524', color: '#1B1746', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit", whiteSpace: 'nowrap' }}>تعديل ←</button>
  );
  return (
    <button onClick={e => { e.stopPropagation(); setActiveUnit(unit); }} style={{ padding: '7px 14px', background: '#5546D6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit", whiteSpace: 'nowrap' }}>فتح ←</button>
  );
};

const StatCard = ({ label, value, bg, color, icon }) => (
  <div style={{ background: bg, borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{icon} {value}</div>
    <div style={{ fontSize: 12, color, marginTop: 4, fontWeight: 600 }}>{label}</div>
  </div>
);
