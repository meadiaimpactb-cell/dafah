import React, { useState, useEffect } from 'react';
import { operationalApi } from '../../api/operational';
import OperationalTemplateRenderer from './OperationalTemplateRenderer';
import { IcSave } from '../../utils/icons';

const colors = { primary: '#5546D6', ink: '#1B1746', orange: '#F5A524', amber: '#F5A524', amberText: '#9A5B07', amberLine: '#E0920F' };

const TABS = [
  { id: 0, label: 'نبذة' },
  { id: 1, label: 'إرشادات' },
  { id: 2, label: 'نماذج العمل' },
];

const STATUS_MAP = {
  not_started: { label: 'لم يبدأ',      color: '#67637A' },
  in_progress: { label: 'قيد العمل',    color: '#9A5B07' },
  submitted:   { label: 'مُرسل',        color: '#1F74C4' },
  reviewing:   { label: 'قيد المراجعة', color: '#5546D6' },
  revision:    { label: 'يحتاج تعديل',  color: '#D03F2A' },
  approved:    { label: 'معتمد',        color: '#0B7F5D' },
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

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: colors.primary, fontSize: 16 }}>جاري تحميل الوحدة...</div>;

  const unit       = unitData?.unit || unitSummary;
  const submission = unitData?.submission;
  const status     = submission?.status || 'not_started';
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.not_started;
  const isApproved = status === 'approved';
  const isReadOnly = isApproved;

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 8px rgba(27,23,70,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ background: '#F3EFE8', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "inherit", color: '#34314A' }}>
          → رجوع
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#8F8BA3', marginBottom: 2 }}>التخطيط التشغيلي › {unit.name}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>{unit.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600, color: statusInfo.color, background: statusInfo.color + '18' }}>{statusInfo.label}</span>
          <span style={{ fontSize: 12, color: '#8F8BA3' }}>⏱ {unit.video_duration}</span>
        </div>
      </div>

      {/* Revision note */}
      {status === 'revision' && submission?.consultant_notes && (
        <div style={{ background: '#FDECE9', border: '1px solid #F5B8AE', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#D03F2A' }}>
          ⚠️ <strong>ملاحظة المستشار:</strong> {submission.consultant_notes}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: 10, padding: 6, boxShadow: '0 1px 8px rgba(27,23,70,0.06)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 7, background: tab === t.id ? colors.primary : 'transparent', color: tab === t.id ? '#fff' : '#67637A', fontSize: 13, fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer', fontFamily: "inherit", transition: 'all 0.2s' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(27,23,70,0.06)', minHeight: 260 }}>
        {tab === 0 && (
          <div>
            {unit.overview && <p style={{ fontSize: 14, color: '#34314A', lineHeight: 1.8, marginBottom: 14 }}>{unit.overview}</p>}
            {unit.overview2 && <p style={{ fontSize: 13, color: '#67637A', lineHeight: 1.8, marginBottom: 18 }}>{unit.overview2}</p>}
            {unit.topics?.length > 0 && (
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>المحاور الرئيسية</h4>
                {unit.topics.map((topic, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, padding: '10px 12px', background: '#FBF9F5', borderRight: `3px solid ${colors.primary}`, borderRadius: '0 6px 6px 0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 3 }}>{topic.t}</div>
                      <div style={{ fontSize: 12, color: '#67637A' }}>{topic.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {unit.tip && (
              <div style={{ background: '#FFF8EA', border: '1px solid #FCD98B', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#7A4706', marginTop: 14 }}>
                💡 <strong>نصيحة:</strong> {unit.tip}
              </div>
            )}
          </div>
        )}

        {tab === 1 && (
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>خطوات العمل</h4>
            {unit.written_description && (
              <p style={{ fontSize: 14, color: '#34314A', lineHeight: 1.9, whiteSpace: 'pre-line', marginBottom: unit.steps?.length ? 20 : 0 }}>
                {unit.written_description}
              </p>
            )}
            {unit.steps?.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: colors.amber, color: '#1B1746', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 3 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: '#67637A' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 2 && (
          <div>
            {isReadOnly && (
              <div style={{ background: '#E8F8F2', border: '1px solid #7FD3B5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#0B7F5D' }}>
                ✅ هذه الوحدة معتمدة — العرض فقط
              </div>
            )}
            <OperationalTemplateRenderer unit={unit} formData={formData} setFormData={isReadOnly ? () => {} : setFormData} />
          </div>
        )}
      </div>

      {/* Message */}
      {msg && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '12px 20px', borderRadius: 10, background: msg.type === 'success' ? '#C9EFE1' : '#FAD4CE', color: msg.type === 'success' ? '#0B7F5D' : '#D03F2A', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 16px rgba(27,23,70,0.12)', zIndex: 9999 }}>
          {msg.type === 'success' ? '✓ ' : '✗ '}{msg.text}
        </div>
      )}

      {/* Actions */}
      {tab === 2 && !isReadOnly && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 32px', background: '#F3EFE8', color: '#34314A', border: '1.5px solid #E8E3DA', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "inherit" }}>
            {saving ? 'جاري الحفظ...' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><IcSave width={14} height={14}/>حفظ مسودة</span>}
          </button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: '12px 40px', background: colors.amber, color: '#1B1746', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit" }}>
            {submitting ? 'جاري الإرسال...' : 'إرسال للمراجعة ←'}
          </button>
        </div>
      )}
    </div>
  );
}
