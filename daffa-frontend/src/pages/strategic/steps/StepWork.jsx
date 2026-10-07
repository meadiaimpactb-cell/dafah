import React, { useState, useEffect } from 'react';
import { strategicApi } from '../../../api/strategic';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

const STATUS_MAP = {
  not_started: { label: 'لم يبدأ',    bg: '#f3f4f6', color: '#6b7280' },
  in_progress: { label: 'قيد العمل',  bg: '#fef3c7', color: '#d97706' },
  submitted:   { label: 'مُرسل',      bg: '#dbeafe', color: '#2563eb' },
  reviewing:   { label: 'قيد المراجعة', bg: '#ede9fe', color: '#7c3aed' },
  revision:    { label: 'يحتاج تعديل', bg: '#fee2e2', color: '#dc2626' },
  approved:    { label: 'معتمد',      bg: '#dcfce7', color: '#16a34a' },
};

export default function StepWork({ workflow, setActiveUnit, workflowId, refreshWorkflow, refreshKey }) {
  const [units,   setUnits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [proceeding, setProceeding] = useState(false);

  useEffect(() => {
    setLoading(true);
    strategicApi.getUnits(workflowId)
      .then(res => setUnits(res.data))
      .finally(() => setLoading(false));
  }, [workflowId, refreshKey]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: colors.teal }}>جاري تحميل الوحدات...</div>;

  const SUBMITTED_ST = ['submitted', 'reviewing', 'revision', 'approved'];
  const total        = units.length || 1;
  const approved     = units.filter(u => u.submission_status === 'approved').length;
  const percent      = Math.round((approved / total) * 100);
  const allSubmitted = units.length > 0 && units.every(u => SUBMITTED_ST.includes(u.submission_status));

  const handleProceed = async () => {
    setProceeding(true);
    try { await refreshWorkflow?.(); } finally { setProceeding(false); }
  };

  return (
    <div className="animate-in">
      {/* شريط التقدم */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark }}>التقدم الكلي</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.orange }}>{approved}/{total} {total === 1 ? 'وحدة' : 'وحدات'} معتمدة</span>
        </div>
        <div style={{ background: '#e5e7eb', borderRadius: 20, height: 10 }}>
          <div style={{ background: `linear-gradient(90deg, ${colors.teal}, ${colors.orange})`, height: '100%', borderRadius: 20, width: `${percent}%`, transition: 'width 0.5s' }} />
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'left' }}>{percent}%</div>
      </div>

      {/* شبكة الوحدات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {units.map((unit, i) => {
          const st = STATUS_MAP[unit.submission_status] || STATUS_MAP.not_started;
          // الوحدة مقفلة إذا لم تُرسَل أي وحدة سابقة
          const SUBMITTED = ['submitted', 'reviewing', 'revision', 'approved'];
          const allPrevSubmitted = units.slice(0, i).every(u => SUBMITTED.includes(u.submission_status));
          const locked = !allPrevSubmitted;
          return (
            <div
              key={unit.id}
              onClick={() => !locked && setActiveUnit(unit)}
              style={{
                background: '#fff', borderRadius: 12, padding: 18,
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.5 : 1,
                border: `1.5px solid ${unit.submission_status === 'approved' ? '#86efac' : unit.submission_status === 'revision' ? '#fca5a5' : '#f3f4f6'}`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!locked) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: locked ? '#9ca3af' : colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: st.bg, color: st.color }}>{locked ? '🔒 مقفل' : st.label}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: locked ? '#9ca3af' : colors.tealDark }}>{unit.name}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>⏱ {unit.video_duration}</div>
            </div>
          );
        })}
      </div>

      {allSubmitted ? (
        <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 12, padding: '16px 20px', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>تم إرسال جميع الوحدات الـ {total} للمراجعة</div>
              <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>المستشار يراجع الآن — ستصلك إشعارات عند اعتماد كل وحدة</div>
            </div>
          </div>
          <button
            onClick={handleProceed}
            disabled={proceeding}
            style={{ padding: '10px 22px', background: proceeding ? '#9ca3af' : colors.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: proceeding ? 'not-allowed' : 'pointer', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap' }}
          >
            {proceeding ? '...' : 'متابعة المراجعة ←'}
          </button>
        </div>
      ) : (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#0369a1' }}>
          💡 اضغط على أي وحدة لبدء العمل عليها. يجب إتمام كل وحدة قبل الانتقال للتالية.
        </div>
      )}
    </div>
  );
}
