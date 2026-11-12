import React, { useEffect, useState } from 'react';

/*
 * اختيار المستشار لخطة مستقلة (تشغيلي / سياسات) حين لا يوجد مستشار موروث من خطة أخرى.
 * loadConsultants(): Promise<axios response بقائمة المستشارين>
 * onSelect(id): Promise — يحفظ الاختيار في الخادم ويحدّث الخطة لدى الصفحة الأم
 */

const TEAL = '#1A6B7C';
const TEAL_DARK = '#14505E';

const Stars = ({ value }) => (
  <span style={{ display: 'inline-flex', gap: 1 }} aria-label={`التقييم ${value} من 5`}>
    {[1, 2, 3, 4, 5].map(i => (
      <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(value) ? '#f59e0b' : '#e5e7eb'} aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </span>
);

export default function ConsultantPicker({ loadConsultants, onSelect, selectedId, title = 'اختر مستشارك', subtitle }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    loadConsultants()
      .then(res => { if (alive) setList(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (alive) setError('تعذّر تحميل قائمة المستشارين. أعد تحميل الصفحة.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = async (c) => {
    if (!c.available || saving || c.id === selectedId) return;
    setSaving(c.id);
    setError('');
    try {
      await onSelect(c.id);
    } catch (e) {
      setError(e.response?.data?.message || 'تعذّر حفظ اختيار المستشار، حاول مرة أخرى.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div style={{ border: `1.5px solid ${selectedId ? '#e5e7eb' : '#f5c38b'}`, background: selectedId ? '#fff' : '#fffaf3', borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: TEAL_DARK }}>{title}</div>
      <div style={{ fontSize: 12.5, color: '#6b7280', margin: '4px 0 12px', lineHeight: 1.7 }}>
        {subtitle || 'يراجع المستشار عملك ويعتمده. اختر مستشارًا واحدًا لمتابعة هذه الخطة.'}
      </div>

      {loading && <div style={{ fontSize: 13, color: TEAL, padding: '10px 0' }}>جارٍ تحميل المستشارين...</div>}
      {!loading && !list.length && !error && <div style={{ fontSize: 13, color: '#6b7280' }}>لا يوجد مستشارون متاحون حاليًا. تواصل مع الدعم.</div>}

      <div role="radiogroup" aria-label="المستشارون" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 10 }}>
        {list.map(c => {
          const on = c.id === selectedId;
          return (
            <button key={c.id} type="button" role="radio" aria-checked={on} disabled={!c.available || !!saving} onClick={() => choose(c)}
              style={{
                position: 'relative', textAlign: 'right', display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12,
                border: on ? `2px solid ${TEAL}` : '1.5px solid #e5e7eb', background: on ? '#F3FAFB' : '#fff',
                boxShadow: on ? `0 0 0 4px ${TEAL}1F` : 'none', cursor: c.available ? 'pointer' : 'not-allowed', opacity: c.available ? 1 : 0.55,
                fontFamily: "'Cairo', sans-serif", transition: 'border-color .15s, box-shadow .15s', minHeight: 44,
              }}>
              <span style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, flexShrink: 0 }}>
                {c.avatar_initial || (c.name || '؟')[0]}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: TEAL_DARK }}>{c.name}</span>
                <span style={{ display: 'block', fontSize: 12, color: '#6b7280', margin: '1px 0 6px' }}>{c.specialty}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: '#6b7280', flexWrap: 'wrap' }}>
                  <Stars value={Number(c.rating) || 0} />
                  {c.experience_years != null && <span>{c.experience_years} سنة خبرة</span>}
                </span>
              </span>
              {on && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: TEAL, borderRadius: 20, padding: '2px 9px', flexShrink: 0 }}>✓ مستشارك</span>}
              {!c.available && <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fee2e2', borderRadius: 20, padding: '2px 9px', flexShrink: 0 }}>غير متاح</span>}
              {saving === c.id && <span style={{ fontSize: 11, color: TEAL, flexShrink: 0 }}>جارٍ الحفظ...</span>}
            </button>
          );
        })}
      </div>

      {error && <div role="alert" style={{ marginTop: 10, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12.5 }}>{error}</div>}
    </div>
  );
}
