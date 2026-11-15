import React, { useState, useEffect } from 'react';
import { strategicApi } from '../../../api/strategic';

const colors = { primary: '#5546D6', ink: '#1B1746', orange: '#F5A524', amber: '#F5A524', amberText: '#9A5B07', amberLine: '#E0920F' };

const STATUS_MAP = {
  not_started: { label: 'لم يبدأ',    bg: '#F3EFE8', color: '#67637A' },
  in_progress: { label: 'قيد العمل',  bg: '#FEEDC6', color: '#9A5B07' },
  submitted:   { label: 'مُرسل',      bg: '#CFE5FA', color: '#1F74C4' },
  reviewing:   { label: 'قيد المراجعة', bg: '#E7E5FD', color: '#5546D6' },
  revision:    { label: 'يحتاج تعديل', bg: '#FAD4CE', color: '#D03F2A' },
  approved:    { label: 'معتمد',      bg: '#C9EFE1', color: '#0B7F5D' },
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

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: colors.primary }}>جاري تحميل الوحدات...</div>;

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
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 8px rgba(27,23,70,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>التقدم الكلي</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.amberText }}>{approved}/{total} {total === 1 ? 'وحدة' : 'وحدات'} معتمدة</span>
        </div>
        <div style={{ background: '#E8E3DA', borderRadius: 20, height: 10 }}>
          <div style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.amber})`, height: '100%', borderRadius: 20, width: `${percent}%`, transition: 'width 0.5s' }} />
        </div>
        <div style={{ fontSize: 12, color: '#8F8BA3', marginTop: 4, textAlign: 'left' }}>{percent}%</div>
      </div>

      {/* شبكة الوحدات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-3)', gap: 14 }}>
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
                boxShadow: '0 1px 8px rgba(27,23,70,0.06)',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.5 : 1,
                border: `1.5px solid ${unit.submission_status === 'approved' ? '#7FD3B5' : unit.submission_status === 'revision' ? '#EE9A8C' : '#F3EFE8'}`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!locked) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: locked ? '#8F8BA3' : colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: st.bg, color: st.color }}>{locked ? '🔒 مقفل' : st.label}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: locked ? '#8F8BA3' : colors.ink }}>{unit.name}</div>
              <div style={{ fontSize: 11, color: '#8F8BA3', marginTop: 4 }}>⏱ {unit.video_duration}</div>
            </div>
          );
        })}
      </div>

      {allSubmitted ? (
        <div style={{ background: '#C9EFE1', border: '1.5px solid #7FD3B5', borderRadius: 12, padding: '16px 20px', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#086449' }}>تم إرسال جميع الوحدات الـ {total} للمراجعة</div>
              <div style={{ fontSize: 12, color: '#086449', marginTop: 2 }}>المستشار يراجع الآن — ستصلك إشعارات عند اعتماد كل وحدة</div>
            </div>
          </div>
          <button
            onClick={handleProceed}
            disabled={proceeding}
            style={{ padding: '10px 22px', background: proceeding ? '#8F8BA3' : colors.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: proceeding ? 'not-allowed' : 'pointer', fontFamily: "inherit", whiteSpace: 'nowrap' }}
          >
            {proceeding ? '...' : 'متابعة المراجعة ←'}
          </button>
        </div>
      ) : (
        <div style={{ background: '#EAF4FD', border: '1px solid #A9D2F5', borderRadius: 10, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#1A65AD' }}>
          💡 اضغط على أي وحدة لبدء العمل عليها. يجب إتمام كل وحدة قبل الانتقال للتالية.
        </div>
      )}
    </div>
  );
}
