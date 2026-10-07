import React, { useState, useEffect } from 'react';
import { strategicApi } from '../../../api/strategic';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

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

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: colors.teal }}>جاري تحميل المستشارين...</div>;

  return (
    <div className="animate-in">
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>اختيار المستشار</h2>
        <p style={{ fontSize: 13, color: '#6b7280' }}>اختر المستشار المناسب لمرافقتك في رحلة التخطيط الاستراتيجي</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        {consultants.map(c => {
          const isSelected = selected === c.id;
          return (
            <div
              key={c.id}
              onClick={() => c.available && setSelected(c.id)}
              style={{
                background: '#fff', borderRadius: 12, padding: 20,
                border: `2px solid ${isSelected ? colors.teal : '#e5e7eb'}`,
                boxShadow: isSelected ? `0 0 0 3px ${colors.teal}22` : '0 1px 8px rgba(0,0,0,0.06)',
                cursor: c.available ? 'pointer' : 'not-allowed',
                opacity: c.available ? 1 : 0.55,
                transition: 'all 0.2s', position: 'relative',
              }}
            >
              {!c.available && (
                <div style={{ position: 'absolute', top: 12, left: 12, background: '#fee2e2', color: '#dc2626', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>غير متاح</div>
              )}
              {isSelected && (
                <div style={{ position: 'absolute', top: 12, left: 12, background: colors.teal, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>✓ محدد</div>
              )}
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                  {c.avatar_initial || c.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{c.specialty}</div>
                  <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{c.bio}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= Math.round(c.rating) ? '#f59e0b' : '#e5e7eb'} stroke={i <= Math.round(c.rating) ? '#f59e0b' : '#e5e7eb'} strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.rating}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark }}>{c.experience_years}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>سنة خبرة</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark }}>{c.completed_projects}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>مشروع</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, textAlign: 'center', fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleConfirm}
          disabled={!selected || submitting}
          style={{ padding: '13px 44px', background: selected ? colors.orange : '#d1d5db', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed', fontFamily: "'Cairo', sans-serif", transition: 'background 0.2s' }}
        >
          {submitting ? 'جاري الحفظ...' : 'التالي: الدفع ←'}
        </button>
      </div>
    </div>
  );
}
