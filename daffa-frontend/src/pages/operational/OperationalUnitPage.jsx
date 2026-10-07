import React, { useState, useEffect } from 'react';
import { operationalApi } from '../../api/operational';
import OperationalTemplateRenderer from './OperationalTemplateRenderer';
import { IcSave } from '../../utils/icons';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

const TABS = [
  { id: 0, label: 'نبذة' },
  { id: 1, label: 'إرشادات' },
  { id: 2, label: 'نماذج العمل' },
];

const STATUS_MAP = {
  not_started: { label: 'لم يبدأ',      color: '#6b7280' },
  in_progress: { label: 'قيد العمل',    color: '#d97706' },
  submitted:   { label: 'مُرسل',        color: '#2563eb' },
  reviewing:   { label: 'قيد المراجعة', color: '#7c3aed' },
  revision:    { label: 'يحتاج تعديل',  color: '#dc2626' },
  approved:    { label: 'معتمد',        color: '#16a34a' },
};

export default function OperationalUnitPage({ unit: unitSummary, onBack }) {
  const [tab,        setTab]        = useState(0);
  const [unitData,   setUnitData]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData,   setFormData]   = useState({});
  const [msg,        setMsg]        = useState(null);

  useEffect(() => {
    operationalApi.getUnit(unitSummary.unit_number)
      .then(res => {
        setUnitData(res.data);
        setFormData(res.data.submission?.form_data || {});
      })
      .finally(() => setLoading(false));
  }, [unitSummary.unit_number]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await operationalApi.saveUnit(unitSummary.unit_number, { form_data: formData });
      showMsg('success', 'تم حفظ البيانات بنجاح');
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'حدث خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await operationalApi.submitUnit(unitSummary.unit_number, { form_data: formData });
      setUnitData(prev => ({ ...prev, submission: res.data.submission }));
      showMsg('success', 'تم إرسال الوحدة للمراجعة بنجاح ✓');
      setTimeout(() => onBack(), 2000);
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'حدث خطأ في الإرسال');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: colors.teal, fontSize: 16 }}>جاري تحميل الوحدة...</div>;

  const unit       = unitData?.unit || unitSummary;
  const submission = unitData?.submission;
  const status     = submission?.status || 'not_started';
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.not_started;
  const isApproved = status === 'approved';
  const isReadOnly = isApproved;

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Cairo', sans-serif", color: '#374151' }}>
          → رجوع
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>التخطيط التشغيلي › {unit.name}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark }}>{unit.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600, color: statusInfo.color, background: statusInfo.color + '18' }}>{statusInfo.label}</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>⏱ {unit.video_duration}</span>
        </div>
      </div>

      {/* Revision note */}
      {status === 'revision' && submission?.consultant_notes && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
          ⚠️ <strong>ملاحظة المستشار:</strong> {submission.consultant_notes}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: 10, padding: 6, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 7, background: tab === t.id ? colors.teal : 'transparent', color: tab === t.id ? '#fff' : '#6b7280', fontSize: 13, fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", transition: 'all 0.2s' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', minHeight: 260 }}>
        {tab === 0 && (
          <div>
            {unit.overview && <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 14 }}>{unit.overview}</p>}
            {unit.overview2 && <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8, marginBottom: 18 }}>{unit.overview2}</p>}
            {unit.topics?.length > 0 && (
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>المحاور الرئيسية</h4>
                {unit.topics.map((topic, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, padding: '10px 12px', background: '#f8fafb', borderRight: `3px solid ${colors.teal}`, borderRadius: '0 6px 6px 0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 3 }}>{topic.t}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{topic.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {unit.tip && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', marginTop: 14 }}>
                💡 <strong>نصيحة:</strong> {unit.tip}
              </div>
            )}
          </div>
        )}

        {tab === 1 && (
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>خطوات العمل</h4>
            {unit.written_description && (
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-line', marginBottom: unit.steps?.length ? 20 : 0 }}>
                {unit.written_description}
              </p>
            )}
            {unit.steps?.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: colors.orange, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 3 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 2 && (
          <div>
            {isReadOnly && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#16a34a' }}>
                ✅ هذه الوحدة معتمدة — العرض فقط
              </div>
            )}
            <OperationalTemplateRenderer unit={unit} formData={formData} setFormData={isReadOnly ? () => {} : setFormData} />
          </div>
        )}
      </div>

      {/* Message */}
      {msg && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '12px 20px', borderRadius: 10, background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 9999 }}>
          {msg.type === 'success' ? '✓ ' : '✗ '}{msg.text}
        </div>
      )}

      {/* Actions */}
      {tab === 2 && !isReadOnly && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 32px', background: '#f3f4f6', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
            {saving ? 'جاري الحفظ...' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><IcSave width={14} height={14}/>حفظ مسودة</span>}
          </button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: '12px 40px', background: colors.orange, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
            {submitting ? 'جاري الإرسال...' : 'إرسال للمراجعة ←'}
          </button>
        </div>
      )}
    </div>
  );
}
