import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { strategicApi } from '../../api/strategic';
import TemplateRenderer from './TemplateRenderer';
import { DEMO_DATA } from './demoData';
import { validateTemplate } from './templateValidation';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', maxWidth: 420, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', direction: 'rtl' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#E8F4F6', margin: '0 auto 16px' }}>
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#1A6B7C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1 1 .03 2.798-1.442 2.798H4.24c-1.47 0-2.441-1.798-1.442-2.798L4.8 15.3" />
          </svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#14505E', marginBottom: 10 }}>{title}</div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 28, lineHeight: 1.8 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onConfirm} style={{ padding: '10px 30px', background: '#1A6B7C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>تأكيد</button>
          <button onClick={onCancel}  style={{ padding: '10px 30px', background: '#f3f4f6', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>إلغاء</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const TABS = [
  { id: 0, label: 'نبذة' },
  { id: 1, label: 'شرح مكتوب' },
  { id: 2, label: 'إرشادات' },
  { id: 3, label: 'فيديو' },
  { id: 4, label: 'خدمة الدردشة' },
  { id: 5, label: 'نماذج العمل' },
];

const STATUS_MAP = {
  not_started: { label: 'لم يبدأ',      color: '#6b7280' },
  in_progress: { label: 'قيد العمل',    color: '#d97706' },
  submitted:   { label: 'مُرسل',        color: '#2563eb' },
  reviewing:   { label: 'قيد المراجعة', color: '#7c3aed' },
  revision:    { label: 'يحتاج تعديل',  color: '#dc2626' },
  approved:    { label: 'معتمد',        color: '#16a34a' },
};

export default function UnitPage({ unit: unitSummary, onBack, onNavigate, workflowId }) {
  const [tab,        setTab]        = useState(0);
  const [unitData,   setUnitData]   = useState(null);
  const [allUnits,   setAllUnits]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData,   setFormData]   = useState({});
  const [msg,        setMsg]        = useState(null);
  const [demoConfirm, setDemoConfirm] = useState(false);

  useEffect(() => {
    Promise.all([
      strategicApi.getUnit(workflowId, unitSummary.unit_number),
      strategicApi.getUnits(workflowId),
    ]).then(([unitRes, unitsRes]) => {
      setUnitData(unitRes.data);
      setFormData(unitRes.data.submission?.form_data || {});
      setAllUnits(unitsRes.data);
    }).finally(() => setLoading(false));
  }, [workflowId, unitSummary.unit_number]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await strategicApi.saveUnit(workflowId, unitSummary.unit_number, { form_data: formData });
      showMsg('success', 'تم حفظ البيانات بنجاح');
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'حدث خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await strategicApi.submitUnit(workflowId, unitSummary.unit_number, { form_data: formData });
      const updatedSub = res.data.submission;
      setUnitData(prev => ({ ...prev, submission: updatedSub }));
      const unitsRes = await strategicApi.getUnits(workflowId);
      setAllUnits(unitsRes.data);
      showMsg('success', 'تم إرسال الوحدة للمراجعة بنجاح ✓');
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'حدث خطأ في الإرسال');
    } finally {
      setSubmitting(false);
    }
  };

  // يجب حساب هذا قبل أي return مبكر لأن validateTemplate ليست hook
  const unit       = unitData?.unit || {};
  const submission = unitData?.submission || {};
  const validation = validateTemplate(unit.template_type, formData, unit);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: colors.teal }}>جاري تحميل الوحدة...</div>
  );

  const st       = STATUS_MAP[submission.status] || STATUS_MAP.not_started;
  // فقط الوحدة المعتمدة نهائياً (approved) تُقفل — باقي الحالات قابلة للتعديل
  const isLocked = submission.status === 'approved';

  // الوحدة التالية تُتاح فقط بعد إرسال الحالية (submitted أو أعلى)
  const SUBMITTED_STATUSES = ['submitted', 'reviewing', 'revision', 'approved'];
  const currentSubmitted   = SUBMITTED_STATUSES.includes(submission.status);

  const currentIdx = allUnits.findIndex(u => u.unit_number === unitSummary.unit_number);
  const prevUnit   = currentIdx > 0 ? allUnits[currentIdx - 1] : null;
  const nextUnit   = currentIdx < allUnits.length - 1 ? allUnits[currentIdx + 1] : null;

  const goToUnit = (target) => {
    if (onNavigate) onNavigate(target);
  };

  return (
    <div className="animate-in">
      {/* رأس الصفحة */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ padding: '7px 14px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: "'Cairo', sans-serif", color: '#374151', whiteSpace: 'nowrap' }}
        >
          ← رجوع
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
              {unitSummary.unit_number}
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, margin: 0 }}>{unit.name}</h2>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>الوحدة {unitSummary.unit_number} من {allUnits.length || '?'}</span>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, marginRight: 40 }}>⏱ {unit.video_duration}</div>
        </div>
        <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600, color: st.color, background: st.color + '18', whiteSpace: 'nowrap' }}>{st.label}</span>
      </div>

      {/* التنقل بين الوحدات */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        {/* زر الوحدة السابقة — متاح دائماً */}
        {prevUnit ? (
          <button
            onClick={() => goToUnit(prevUnit)}
            style={{ padding: '7px 16px', background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: "'Cairo', sans-serif", color: '#374151' }}
          >
            → {prevUnit.name}
          </button>
        ) : <div />}

        {/* زر الوحدة التالية — يظهر فقط بعد إرسال الحالية */}
        {nextUnit && currentSubmitted ? (
          <button
            onClick={() => goToUnit(nextUnit)}
            style={{ padding: '7px 18px', background: colors.teal, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: "'Cairo', sans-serif", color: '#fff', fontWeight: 700 }}
          >
            التالي: {nextUnit.name} ←
          </button>
        ) : nextUnit && !currentSubmitted ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: '#f3f4f6', borderRadius: 8, fontSize: 12, color: '#9ca3af' }}>
            🔒 {nextUnit.name} — أرسل الوحدة الحالية أولاً
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#9ca3af', padding: '7px 0' }}>آخر وحدة</div>
        )}
      </div>

      {/* ملاحظة المستشار — تظهر فقط عند status=revision */}
      {submission.status === 'revision' && submission.consultant_notes && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#dc2626' }}>
          ⚠️ ملاحظة المستشار: {submission.consultant_notes}
        </div>
      )}

      {/* التبويبات */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #f3f4f6', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '12px 18px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? colors.teal : '#6b7280',
                borderBottom: `2px solid ${tab === t.id ? colors.teal : 'transparent'}`,
                marginBottom: -2, whiteSpace: 'nowrap', fontFamily: "'Cairo', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {tab === 0 && <TabOverview unit={unit} />}
          {tab === 1 && <TabDescription unit={unit} />}
          {tab === 2 && <TabGuide unit={unit} />}
          {tab === 3 && <TabVideo unit={unit} />}
          {tab === 4 && <TabChat onNavigate={onNavigate} />}
          {tab === 5 && (
            <TemplateRenderer
              unit={unit}
              formData={formData}
              setFormData={setFormData}
              disabled={isLocked}
            />
          )}
        </div>
      </div>

      {/* رسائل — عبر Portal تختفي تلقائياً */}
      {msg && ReactDOM.createPortal(
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: msg.type === 'success' ? '#16a34a' : '#dc2626',
          color: '#fff', borderRadius: 12, padding: '14px 32px',
          fontSize: 15, fontWeight: 700,
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          zIndex: 999999, whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeInUp 0.3s ease',
        }}>
          <span style={{ fontSize: 18 }}>{msg.type === 'success' ? '✅' : '❌'}</span>
          {msg.text}
        </div>,
        document.body
      )}

      {/* أزرار الحفظ والإرسال */}
      {tab === 5 && (
        <div style={{ marginTop: 20 }}>
          {/* رسالة الحقول المطلوبة */}
          {!isLocked && !validation.valid && (
            <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10, padding: '12px 16px', marginBottom: 14, direction: 'rtl' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c2410c', marginBottom: 6 }}>
                ⚠️ يجب تعبئة الحقول التالية قبل الحفظ:
              </div>
              <ul style={{ margin: 0, padding: '0 20px', fontSize: 12, color: '#9a3412', lineHeight: 2 }}>
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isLocked && (
              <>
                {/* زر التعبئة التجريبية */}
                {DEMO_DATA[unit.template_type] && (
                  <>
                    <button
                      onClick={() => setDemoConfirm(true)}
                      style={{ padding: '11px 22px', background: '#f0f9ff', color: '#0369a1', border: '1.5px solid #bae6fd', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}
                    >
                      🧪 تعبئة تجريبية
                    </button>
                    <ConfirmModal
                      open={demoConfirm}
                      title="تعبئة تجريبية"
                      message="سيتم تعبئة جميع الحقول ببيانات تجريبية. هل تريد المتابعة؟"
                      onConfirm={() => { setFormData(DEMO_DATA[unit.template_type]); setDemoConfirm(false); }}
                      onCancel={() => setDemoConfirm(false)}
                    />
                  </>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !validation.valid}
                  title={!validation.valid ? 'يجب تعبئة جميع الحقول المطلوبة أولاً' : ''}
                  style={{
                    padding: '11px 28px',
                    background: validation.valid ? '#f3f4f6' : '#e5e7eb',
                    color: validation.valid ? '#374151' : '#9ca3af',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 10, fontSize: 14, fontWeight: 600,
                    cursor: validation.valid && !saving ? 'pointer' : 'not-allowed',
                    fontFamily: "'Cairo', sans-serif",
                    opacity: validation.valid ? 1 : 0.65,
                    transition: 'all 0.2s',
                  }}
                >
                  {saving ? 'جاري الحفظ...' : '💾 حفظ'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !validation.valid}
                  title={!validation.valid ? 'يجب تعبئة جميع الحقول المطلوبة أولاً' : ''}
                  style={{
                    padding: '11px 28px',
                    background: validation.valid ? colors.orange : '#e5e7eb',
                    color: validation.valid ? '#fff' : '#9ca3af',
                    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    cursor: validation.valid && !submitting ? 'pointer' : 'not-allowed',
                    fontFamily: "'Cairo', sans-serif",
                    opacity: validation.valid ? 1 : 0.65,
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? 'جاري الإرسال...' : (
                    submission.status === 'submitted' || submission.status === 'reviewing'
                      ? 'إعادة الإرسال ←'
                      : 'إرسال للمراجعة ←'
                  )}
                </button>
                {/* زر الانتقال للتالي متاح بعد الإرسال */}
                {currentSubmitted && nextUnit && (
                  <button
                    onClick={() => goToUnit(nextUnit)}
                    style={{ padding: '11px 28px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}
                  >
                    التالي: {nextUnit.name} ←
                  </button>
                )}
              </>
            )}
            {/* وحدة معتمدة — فقط التالي */}
            {isLocked && nextUnit && (
              <button
                onClick={() => goToUnit(nextUnit)}
                style={{ padding: '11px 32px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}
              >
                التالي: {nextUnit.name} ←
              </button>
            )}
          </div>
        </div>
      )}

      {isLocked && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '10px 16px', marginTop: 14, fontSize: 13, color: '#16a34a', textAlign: 'center' }}>
          ✅ هذه الوحدة معتمدة نهائياً من المستشار
        </div>
      )}
    </div>
  );
}

/* ─── تبويب النبذة ─── */
function TabOverview({ unit }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 10 }}>عن هذه الوحدة</div>
      <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.9, marginBottom: 14 }}>{unit.overview || '—'}</p>
      {unit.overview2 && (
        <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.8, padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, borderRight: `3px solid ${colors.teal}`, marginBottom: 16 }}>
          {unit.overview2}
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <InfoBox label="مدة الفيديو"  value={unit.video_duration || '—'} />
        <InfoBox label="نوع النموذج" value={unit.template_type || '—'} />
      </div>
    </div>
  );
}

/* ─── تبويب الشرح المكتوب ─── */
function TabDescription({ unit }) {
  const topics = unit.topics || [];
  const hasText = !!unit.written_description;
  const hasTopics = topics.length > 0;

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>الشرح المكتوب</div>

      {/* نص الشرح المكتوب من الأدمين */}
      {hasText && (
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.9, marginBottom: hasTopics ? 20 : 0, whiteSpace: 'pre-line' }}>
          {unit.written_description}
        </p>
      )}

      {/* محاور منظمة (بيانات ثابتة من DB) */}
      {hasTopics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {topics.map((topic, i) => (
            <div key={i} style={{ background: '#f8fafb', borderRadius: 10, padding: '14px 18px', borderRight: `3px solid ${colors.teal}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>{topic.t}</div>
              <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.8 }}>{topic.d}</div>
            </div>
          ))}
        </div>
      )}

      {/* حالة فارغة */}
      {!hasText && !hasTopics && (
        <p style={{ color: '#9ca3af', fontSize: 13 }}>لا يوجد شرح مكتوب لهذه الوحدة بعد</p>
      )}
    </div>
  );
}

/* ─── تبويب الإرشادات ─── */
function TabGuide({ unit }) {
  const steps = unit.steps || [];
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>إرشادات العمل</div>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#f8fafb', borderRadius: 10, alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 3 }}>{step.t}</div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>{step.d}</div>
          </div>
        </div>
      ))}
      {unit.tip && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, marginTop: 8 }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>نصيحة</div>
            <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>{unit.tip}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function toEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v'))
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    if (u.hostname === 'youtu.be')
      return `https://www.youtube.com/embed${u.pathname}`;
  } catch (_) {}
  return url;
}

/* ─── تبويب الفيديو ─── */
function TabVideo({ unit }) {
  const embedUrl = toEmbedUrl(unit.video_url);
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>الفيديو التعليمي</div>
      {embedUrl ? (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden' }}>
          <iframe src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen title={unit.name} />
        </div>
      ) : (
        <div style={{ background: '#f3f4f6', borderRadius: 12, padding: 60, color: '#9ca3af', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
          <div style={{ fontSize: 14 }}>الفيديو التعليمي قيد الإعداد</div>
        </div>
      )}
    </div>
  );
}

/* ─── تبويب الدردشة ─── */
function TabChat({ onNavigate }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>💬</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>خدمة الدردشة مع المستشار</div>
      <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 400, margin: '0 auto 24px' }}>تواصل مع المستشار للحصول على توجيه وإجابة أسئلتك</p>
      <button style={{ padding: '11px 32px', background: colors.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}
        onClick={() => onNavigate && onNavigate('client-chat')}>بدء المحادثة</button>
    </div>
  );
}

const InfoBox = ({ label, value }) => (
  <div style={{ background: '#f8fafb', borderRadius: 8, padding: '12px 16px' }}>
    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{value}</div>
  </div>
);
