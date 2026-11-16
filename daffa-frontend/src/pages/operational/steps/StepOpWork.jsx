import DfIcon from '../../../components/ui/DfIcon';
import React, { useState, useEffect } from 'react';
import { operationalApi } from '../../../api/operational';

const colors = { primary: '#235D7F', ink: '#0E2A3D', orange: '#EF6A2C', amber: '#EF6A2C', amberText: '#A33F12', amberLine: '#E05A1F' };

const STATUS_MAP = {
  not_started: { label: 'لم يبدأ',    bg: '#F3EFE8', color: '#5E6B78' },
  in_progress: { label: 'قيد العمل',  bg: '#FDE2D2', color: '#A33F12' },
  submitted:   { label: 'مُرسل',      bg: '#CFE5FA', color: '#1F74C4' },
  reviewing:   { label: 'قيد المراجعة', bg: '#D9E8F1', color: '#235D7F' },
  revision:    { label: 'يحتاج تعديل', bg: '#F8D3D3', color: '#C53A3A' },
  approved:    { label: 'معتمد',      bg: '#C9EFE1', color: '#0B7F5D' },
};

export default function StepOpWork({ setActiveUnit, initialUnits }) {
  const [units,   setUnits]   = useState(initialUnits || []);
  const [loading, setLoading] = useState(!initialUnits);

  useEffect(() => {
    if (initialUnits) return;
    operationalApi.getUnits()
      .then(res => setUnits(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: colors.primary }}>جاري تحميل الوحدات...</div>;

  const approved = units.filter(u => u.submission_status === 'approved').length;
  const percent  = Math.round((approved / 5) * 100);

  return (
    <div className="animate-in">
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 8px rgba(14,42,61,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>التقدم الكلي</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.amberText }}>{approved}/5 وحدات معتمدة</span>
        </div>
        <div style={{ background: '#E8E3DA', borderRadius: 20, height: 10 }}>
          <div style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.amber})`, height: '100%', borderRadius: 20, width: `${percent}%`, transition: 'width 0.5s' }} />
        </div>
        <div style={{ fontSize: 12, color: '#8C97A3', marginTop: 4, textAlign: 'left' }}>{percent}%</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-3)', gap: 14 }}>
        {units.map((unit, i) => {
          const st = STATUS_MAP[unit.submission_status] || STATUS_MAP.not_started;
          const SUBMITTED = ['submitted', 'reviewing', 'revision', 'approved'];
          const prevSubmitted = i === 0 || SUBMITTED.includes(units[i - 1].submission_status);
          const locked = !prevSubmitted;

          return (
            <div
              key={unit.id}
              onClick={() => !locked && setActiveUnit(unit)}
              style={{
                background: '#fff', borderRadius: 12, padding: 20,
                boxShadow: '0 1px 8px rgba(14,42,61,0.06)',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.5 : 1,
                border: `1.5px solid ${unit.submission_status === 'approved' ? '#7FD3B5' : unit.submission_status === 'revision' ? '#E88E8E' : '#F3EFE8'}`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!locked) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: locked ? '#8C97A3' : colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: st.bg, color: st.color }}>{locked ? 'مقفل' : st.label}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: locked ? '#8C97A3' : colors.ink, marginBottom: 4 }}>{unit.name}</div>
              <div style={{ fontSize: 11, color: '#8C97A3' }}><DfIcon name="timer" size={14} style={{ marginInlineEnd: 6 }} />{unit.video_duration}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#EAF4FD', border: '1px solid #A9D2F5', borderRadius: 10, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#1A65AD' }}>
        <DfIcon name="bulb" size={18} style={{ marginInlineEnd: 6 }} />اضغط على أي وحدة لبدء العمل عليها. يجب إتمام كل وحدة قبل الانتقال للتالية.
      </div>
    </div>
  );
}
