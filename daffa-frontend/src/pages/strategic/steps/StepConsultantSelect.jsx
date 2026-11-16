import React, { useState, useEffect } from 'react';
import { strategicApi } from '../../../api/strategic';

const colors = { primary: '#235D7F', ink: '#0E2A3D', orange: '#EF6A2C', amberText: '#A33F12', amberLine: '#E05A1F' };

export default function StepConsultantSelect({ setWorkflow, setStep, workflowId }) {
  const [consultants, setConsultants] = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    strategicApi.getConsultants()
      .then(res => setConsultants(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await strategicApi.selectConsultant(workflowId, { consultant_id: selected });
      setWorkflow(res.data.workflow);
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.message || 'حدث خطأ، حاول مجدداً');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: colors.primary }}>جاري تحميل المستشارين...</div>;

  return (
    <div className="animate-in">
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 8px rgba(14,42,61,0.06)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>اختيار المستشار</h2>
        <p style={{ fontSize: 13, color: '#5E6B78' }}>اختر المستشار المناسب لمرافقتك في رحلة التخطيط الاستراتيجي</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 16, marginBottom: 24 }}>
        {consultants.map(c => {
          const isSelected = selected === c.id;
          return (
            <div
              key={c.id}
              onClick={() => c.available && setSelected(c.id)}
              style={{
                background: '#fff', borderRadius: 12, padding: 20,
                border: `2px solid ${isSelected ? colors.primary : '#E8E3DA'}`,
                boxShadow: isSelected ? `0 0 0 3px ${colors.primary}22` : '0 1px 8px rgba(14,42,61,0.06)',
                cursor: c.available ? 'pointer' : 'not-allowed',
                opacity: c.available ? 1 : 0.55,
                transition: 'all 0.2s', position: 'relative',
              }}
            >
              {!c.available && (
                <div style={{ position: 'absolute', top: 12, left: 12, background: '#F8D3D3', color: '#C53A3A', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>غير متاح</div>
              )}
              {isSelected && (
                <div style={{ position: 'absolute', top: 12, left: 12, background: colors.primary, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>✓ محدد</div>
              )}
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${colors.primary}, ${colors.ink})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                  {c.avatar_initial || c.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#5E6B78', marginBottom: 8 }}>{c.specialty}</div>
                  <div style={{ fontSize: 12, color: '#334452', lineHeight: 1.5 }}>{c.bio}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid #F3EFE8' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= Math.round(c.rating) ? '#A33F12' : '#E8E3DA'} stroke={i <= Math.round(c.rating) ? '#A33F12' : '#E8E3DA'} strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#8C97A3' }}>{c.rating}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>{c.experience_years}</div>
                  <div style={{ fontSize: 11, color: '#8C97A3' }}>سنة خبرة</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>{c.completed_projects}</div>
                  <div style={{ fontSize: 11, color: '#8C97A3' }}>مشروع</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <div style={{ background: '#FCEBEB', color: '#C53A3A', border: '1px solid #F1B2B2', borderRadius: 8, padding: '10px 14px', marginBottom: 16, textAlign: 'center', fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleConfirm}
          disabled={!selected || submitting}
          style={{ padding: '13px 44px', background: selected ? colors.amber : '#D9D3C7', color: '#0E2A3D', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed', fontFamily: "inherit", transition: 'background 0.2s' }}
        >
          {submitting ? 'جاري الحفظ...' : 'التالي: الدفع ←'}
        </button>
      </div>
    </div>
  );
}
