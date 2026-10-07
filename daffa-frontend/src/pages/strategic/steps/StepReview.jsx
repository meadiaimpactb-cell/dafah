import React, { useState, useEffect } from 'react';
import { strategicApi } from '../../../api/strategic';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

const STATUS_MAP = {
  not_started: { label: 'لم يبدأ',      bg: '#f3f4f6', color: '#6b7280' },
  in_progress: { label: 'قيد العمل',    bg: '#fef3c7', color: '#d97706' },
  submitted:   { label: 'بانتظار المراجعة', bg: '#dbeafe', color: '#2563eb' },
  reviewing:   { label: 'قيد المراجعة', bg: '#ede9fe', color: '#7c3aed' },
  revision:    { label: 'يحتاج تعديل',  bg: '#fee2e2', color: '#dc2626' },
  approved:    { label: 'معتمد',        bg: '#dcfce7', color: '#16a34a' },
};

export default function StepReview({ workflow, setActiveUnit, workflowId, refreshWorkflow }) {
  const [units,      setUnits]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [proceeding, setProceeding] = useState(false);

  const loadUnits = () => strategicApi.getUnits(workflowId).then(res => setUnits(res.data));

  useEffect(() => {
    setLoading(true);
    loadUnits().finally(() => setLoading(false));
  }, [workflowId]);

  // تحديث دوري كل 30 ثانية للتحقق من حالة المراجعة
  useEffect(() => {
    if (!workflowId) return;
    const interval = setInterval(loadUnits, 30000);
    return () => clearInterval(interval);
  }, [workflowId]);

  const handleProceed = async () => {
    setProceeding(true);
    try { await refreshWorkflow?.(); } finally { setProceeding(false); }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: colors.teal }}>جاري تحميل البيانات...</div>
  );

  const approved    = units.filter(u => u.submission_status === 'approved').length;
  const revision    = units.filter(u => u.submission_status === 'revision').length;
  const reviewing   = units.filter(u => ['submitted', 'reviewing'].includes(u.submission_status)).length;
  const allApproved = units.length > 0 && approved === units.length;

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>مراجعة المستشار</h2>
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          يقوم المستشار <strong>{workflow?.consultant?.name}</strong> بمراجعة نماذج العمل التي قدمتها
        </p>
      </div>

      {/* إحصائيات سريعة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="معتمدة" value={approved}  bg="#dcfce7" color="#16a34a" icon="✓" />
        <StatCard label="قيد المراجعة" value={reviewing} bg="#dbeafe" color="#2563eb" icon="⏳" />
        <StatCard label="تحتاج تعديل" value={revision}  bg="#fee2e2" color="#dc2626" icon="⚠" />
      </div>

      {/* قائمة الوحدات */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {units.map((unit, i) => {
          const st = STATUS_MAP[unit.submission_status] || STATUS_MAP.not_started;
          const isRevision = unit.submission_status === 'revision';
          const isApproved = unit.submission_status === 'approved';
          const borderColor = isRevision ? '#fca5a5' : isApproved ? '#86efac' : '#f3f4f6';
          return (
            <div
              key={unit.id}
              onClick={() => setActiveUnit(unit)}
              style={{
                background: '#fff', borderRadius: 12, padding: '16px 20px',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                border: `1.5px solid ${borderColor}`,
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)'; }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {i + 1}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark }}>{unit.name}</div>
                {unit.submission_status === 'revision' && unit.consultant_notes && (
                  <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4, background: '#fef2f2', padding: '4px 8px', borderRadius: 6 }}>
                    ⚠️ ملاحظة المستشار: {unit.consultant_notes}
                  </div>
                )}
              </div>

              <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                {st.label}
              </span>

              <UnitActionButton unit={unit} setActiveUnit={setActiveUnit} />
            </div>
          );
        })}
      </div>

      {allApproved && (
        <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 12, padding: '18px 22px', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>تهانينا! تم اعتماد جميع الوحدات</div>
              <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>خطتك الاستراتيجية جاهزة للاعتماد النهائي وتحميل الوثيقة</div>
            </div>
          </div>
          <button
            onClick={handleProceed}
            disabled={proceeding}
            style={{ padding: '11px 26px', background: proceeding ? '#9ca3af' : colors.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: proceeding ? 'not-allowed' : 'pointer', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(26,107,124,0.3)' }}
          >
            {proceeding ? '...' : 'الاعتماد النهائي ←'}
          </button>
        </div>
      )}

      {!allApproved && revision === 0 && reviewing === 0 && approved < 11 && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#0369a1' }}>
          ⏳ جميع الوحدات بانتظار مراجعة المستشار. يتم تحديث الحالة تلقائياً كل 30 ثانية.
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

const UnitActionButton = ({ unit, setActiveUnit }) => {
  const s = unit.submission_status;
  if (s === 'approved') {
    return (
      <button
        onClick={e => { e.stopPropagation(); setActiveUnit(unit); }}
        style={{ padding: '7px 14px', background: '#f3f4f6', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap' }}
      >
        عرض
      </button>
    );
  }
  if (s === 'revision') {
    return (
      <button
        onClick={e => { e.stopPropagation(); setActiveUnit(unit); }}
        style={{ padding: '7px 14px', background: colors.orange, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap' }}
      >
        تعديل ←
      </button>
    );
  }
  return (
    <button
      onClick={e => { e.stopPropagation(); setActiveUnit(unit); }}
      style={{ padding: '7px 14px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap' }}
    >
      فتح ←
    </button>
  );
};

const StatCard = ({ label, value, bg, color, icon }) => (
  <div style={{ background: bg, borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{icon} {value}</div>
    <div style={{ fontSize: 12, color, marginTop: 4, fontWeight: 600 }}>{label}</div>
  </div>
);
