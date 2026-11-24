import { Help } from '../../components/ui/Help';
import DfIcon from '../../components/ui/DfIcon';
import { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { strategicApi } from '../../api/strategic';
import TemplateRenderer from './TemplateRenderer';
import { DEMO_DATA } from './demoData';
import { validateTemplate, hasAnyInput, ORG_CYCLE_MSG } from './templateValidation';
import { OverviewContent, ExplanationContent, GuidelinesContent, templateLabel } from './UnitContent';
import UnitVideo from '../shared/UnitVideo';
import { unitTimeLabel } from '../../utils/duration';

const colors = { amber: '#EF6A2C', primary: '#235D7F', ink: '#0E2A3D', orange: '#EF6A2C', amberText: '#A33F12', amberLine: '#E05A1F' };

const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(14,42,61,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', maxWidth: 420, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(14,42,61,0.25)', direction: 'rtl' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#D9E8F1', margin: '0 auto 16px' }}>
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#235D7F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1 1 .03 2.798-1.442 2.798H4.24c-1.47 0-2.441-1.798-1.442-2.798L4.8 15.3" />
          </svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0E2A3D', marginBottom: 10 }}>{title}</div>
        <p style={{ fontSize: 13, color: '#5E6B78', marginBottom: 28, lineHeight: 1.8 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onConfirm} style={{ padding: '10px 30px', background: '#235D7F', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit" }}>تأكيد</button>
          <button onClick={onCancel}  style={{ padding: '10px 30px', background: '#F3EFE8', color: '#334452', border: '1.5px solid #E8E3DA', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit" }}>إلغاء</button>
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

// التسمية نفسها في رأس الوحدة وبطاقة الخطة: «مسودة» بعد أول حفظ
export const STATUS_MAP = {
  not_started: { label: 'لم يبدأ',      color: '#5E6B78' },
  in_progress: { label: 'مسودة',        color: '#A33F12' },
  submitted:   { label: 'مُرسل',        color: '#1F74C4' },
  reviewing:   { label: 'قيد المراجعة', color: '#235D7F' },
  revision:    { label: 'يحتاج تعديل',  color: '#C53A3A' },
  approved:    { label: 'معتمد',        color: '#0B7F5D' },
};

const SUBMITTED_STATUSES = ['submitted', 'reviewing', 'revision', 'approved'];
const AUTOSAVE_DELAY = 1500;
const draftKey = (wid, num) => `df_draft_${wid || 'cur'}_${num}`;
const readBackup = (k) => { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const writeBackup = (k, data) => { try { sessionStorage.setItem(k, JSON.stringify(data)); } catch { /* المتصفح يمنع التخزين */ } };
const clearBackup = (k) => { try { sessionStorage.removeItem(k); } catch { /* تجاهل */ } };

// رسالة ما بعد الحفظ بحسب حالة الوحدة
const savedMessage = (status) => {
  if (status === 'revision') return 'حُفظت تعديلاتك كمسودة. راجع ملاحظة المستشار، ثم اضغط إعادة الإرسال للمراجعة.';
  if (status === 'submitted' || status === 'reviewing') return 'حُفظت المسودة. اضغط «إعادة الإرسال» ليراجع المستشار النسخة المحدّثة.';
  return 'حُفظت إجاباتك كمسودة. يمكنك إكمالها لاحقًا أو إرسالها للمراجعة.';
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
  // حالة المسودة: idle | dirty | saving | saved | error | restored
  const [draft,      setDraft]      = useState('idle');
  const [showErrors, setShowErrors] = useState(false);
  const [preview,    setPreview]    = useState(null);

  const savedJsonRef  = useRef('{}');          // آخر نسخة وصلت إلى الخادم
  const formRef       = useRef(formData);      // أحدث بيانات النموذج (للحفظ المؤجّل وعند المغادرة)
  const timerRef      = useRef(null);
  const lockedRef     = useRef(false);
  const formAreaRef   = useRef(null);
  formRef.current = formData;

  const key = draftKey(workflowId, unitSummary.unit_number);

  useEffect(() => {
    Promise.all([
      strategicApi.getUnit(workflowId, unitSummary.unit_number),
      strategicApi.getUnits(workflowId),
    ]).then(([unitRes, unitsRes]) => {
      setUnitData(unitRes.data);
      const saved = unitRes.data.submission?.form_data || {};
      savedJsonRef.current = JSON.stringify(saved);
      lockedRef.current = unitRes.data.submission?.status === 'approved';
      // ما كُتب قبل انقطاع الحفظ يبقى في هذا المتصفح ويُستعاد عند العودة
      const backup = lockedRef.current ? null : readBackup(key);
      if (backup && JSON.stringify(backup) !== savedJsonRef.current) {
        setFormData(backup);
        setDraft('restored');
      } else {
        clearBackup(key);
        setFormData(saved);
        setDraft('idle');
      }
      setAllUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
    }).finally(() => setLoading(false));
  }, [workflowId, unitSummary.unit_number]); // eslint-disable-line react-hooks/exhaustive-deps

  const msgTimer = useRef(null);
  const showMsg = (type, text) => {
    clearTimeout(msgTimer.current);
    setMsg({ type, text });
    msgTimer.current = setTimeout(() => setMsg(null), 4000);
  };

  const isDirty = JSON.stringify(formData) !== savedJsonRef.current;

  // حفظ المسودة (تلقائي أو يدوي): يُعيد true عند النجاح
  const doSave = useCallback(async (manual = false) => {
    if (lockedRef.current) return true;
    const data = formRef.current;
    const json = JSON.stringify(data);
    if (!manual && json === savedJsonRef.current) return true;
    clearTimeout(timerRef.current);
    setSaving(true);
    setDraft('saving');
    try {
      const res = await strategicApi.saveUnit(workflowId, unitSummary.unit_number, { form_data: data });
      savedJsonRef.current = json;
      clearBackup(key);
      const sub = res.data?.submission;
      if (sub) {
        setUnitData(prev => (prev ? { ...prev, submission: sub } : prev));
        setAllUnits(prev => prev.map(u => (u.unit_number === unitSummary.unit_number ? { ...u, submission_status: sub.status } : u)));
      }
      setDraft(JSON.stringify(formRef.current) === json ? 'saved' : 'dirty');
      if (manual) showMsg('success', savedMessage(sub?.status));
      return true;
    } catch (e) {
      writeBackup(key, data);
      setDraft('error');
      if (manual) showMsg('error', e.response?.data?.message || 'تعذّر حفظ المسودة. حاول مرة أخرى — ما كتبته محفوظ في هذا المتصفح.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [workflowId, unitSummary.unit_number, key]); // eslint-disable-line react-hooks/exhaustive-deps

  // الحفظ التلقائي بعد توقف الكتابة
  useEffect(() => {
    if (loading || lockedRef.current) return undefined;
    if (!isDirty) return undefined;
    if (!hasAnyInput(formData)) return undefined;
    setDraft(d => (d === 'saving' ? d : 'dirty'));
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { doSave(false); }, AUTOSAVE_DELAY);
    return () => clearTimeout(timerRef.current);
  }, [formData, isDirty, loading, doSave]);

  // تنبيه قبل إغلاق الصفحة إذا بقي تعديل غير محفوظ
  useEffect(() => {
    const handler = (e) => {
      if (lockedRef.current) return;
      if (JSON.stringify(formRef.current) === savedJsonRef.current) return;
      writeBackup(key, formRef.current);
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [key]);

  // المغادرة (رجوع أو وحدة أخرى): نحفظ أولًا، وعند تعذّر الحفظ نسأل قبل المغادرة ونحتفظ بالنص في المتصفح
  const leave = async (go) => {
    if (!lockedRef.current && JSON.stringify(formRef.current) !== savedJsonRef.current) {
      const ok = await doSave(false);
      if (!ok) {
        const proceed = window.confirm('تعذّر حفظ المسودة. ما كتبته سيبقى في هذا المتصفح لتعيد المحاولة لاحقًا. هل تريد المغادرة الآن؟');
        if (!proceed) return;
      }
    }
    go();
  };
  const handleBack = () => leave(() => onBack && onBack());
  const goToUnit = (target) => leave(() => onNavigate && onNavigate(target));

  const handleSave = () => doSave(true);

  // يجب حساب هذا قبل أي return مبكر لأن validateTemplate ليست hook
  const unit       = unitData?.unit || {};
  const submission = unitData?.submission || {};
  const validation = validateTemplate(unit.template_type, formData, unit);
  // تبعية ذاتية أو دائرية في الهيكل التنظيمي: زر الإرسال معطّل بصريًا ووظيفيًا حتى تصحيح العلاقة
  const submitBlocked = (validation.errors || []).includes(ORG_CYCLE_MSG);

  const handleSubmit = async () => {
    if (submitBlocked) { setShowErrors(true); return; }
    if (!validation.valid) {
      setShowErrors(true);
      showMsg('error', 'أكمل الحقول المطلوبة أولًا، ثم أعد الإرسال. مسودتك محفوظة.');
      return;
    }
    clearTimeout(timerRef.current);
    setSubmitting(true);
    setMsg(null);
    const wasRevision = submission.status === 'revision';
    try {
      const data = formRef.current;
      const res = await strategicApi.submitUnit(workflowId, unitSummary.unit_number, { form_data: data });
      savedJsonRef.current = JSON.stringify(data);
      clearBackup(key);
      setDraft('saved');
      const updatedSub = res.data.submission;
      setUnitData(prev => ({ ...prev, submission: updatedSub }));
      const unitsRes = await strategicApi.getUnits(workflowId);
      setAllUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
      showMsg('success', wasRevision ? 'أُعيد إرسال الوحدة. يراجعها المستشار الآن ✓' : 'تم إرسال الوحدة للمراجعة بنجاح ✓');
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'حدث خطأ في الإرسال');
    } finally {
      setSubmitting(false);
    }
  };

  // معاينة مخرجات وحدة سابقة من داخل «الوثيقة الاستراتيجية» (للقراءة فقط)
  const openUnitPreview = async (stageName) => {
    const target = allUnits.find(u => u.name === stageName) || allUnits.find(u => (u.name || '').includes(stageName));
    if (!target) return;
    setPreview({ name: stageName, loading: true });
    try {
      const res = await strategicApi.getUnit(workflowId, target.unit_number);
      setPreview({ name: stageName, loading: false, unit: res.data.unit, submission: res.data.submission });
    } catch {
      setPreview({ name: stageName, loading: false, error: 'تعذّر تحميل مخرجات هذه الوحدة. حاول مرة أخرى.' });
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: colors.primary }}>جاري تحميل الوحدة...</div>
  );

  const st       = STATUS_MAP[submission.status] || STATUS_MAP.not_started;
  // فقط الوحدة المعتمدة نهائياً (approved) تُقفل — باقي الحالات قابلة للتعديل
  const isLocked = submission.status === 'approved';
  lockedRef.current = isLocked;

  // الوحدة التالية تُتاح فقط بعد إرسال الحالية (submitted أو أعلى)
  const currentSubmitted   = SUBMITTED_STATUSES.includes(submission.status);

  const currentIdx = allUnits.findIndex(u => u.unit_number === unitSummary.unit_number);
  const prevUnit   = currentIdx > 0 ? allUnits[currentIdx - 1] : null;
  const nextUnit   = currentIdx < allUnits.length - 1 ? allUnits[currentIdx + 1] : null;

  const openForms = () => {
    setTab(5);
    setTimeout(() => formAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const submitLabel = submission.status === 'revision'
    ? 'إعادة الإرسال للمراجعة ←'
    : (submission.status === 'submitted' || submission.status === 'reviewing' ? 'إعادة الإرسال ←' : 'إرسال للمراجعة ←');

  const DRAFT_LINE = {
    dirty:    { text: 'تغييرات غير محفوظة — تُحفظ تلقائيًا خلال لحظات', color: '#8C97A3' },
    saving:   { text: 'جارٍ حفظ المسودة…', color: '#1B5E9E' },
    saved:    { text: 'حُفظت المسودة', color: '#0B7F5D' },
    error:    { text: 'تعذّر حفظ المسودة — ما كتبته محفوظ في هذا المتصفح، اضغط «حفظ» لإعادة المحاولة', color: '#C53A3A' },
    restored: { text: 'استعدنا ما كتبته قبل انقطاع الحفظ — اضغط «حفظ» لإرساله إلى حسابك', color: '#A33F12' },
  };
  const draftLine = !isLocked ? DRAFT_LINE[draft] : null;

  return (
    <div className="animate-in">
      {/* رأس الصفحة */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 14, boxShadow: '0 1px 8px rgba(14,42,61,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleBack}
          style={{ padding: '7px 14px', background: '#F3EFE8', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: "inherit", color: '#334452', whiteSpace: 'nowrap' }}
        >
          ← رجوع
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
              {unitSummary.unit_number}
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.ink, margin: 0, display: 'flex', alignItems: 'center' }}>{unit.name}<Help term={unit.template_type} /></h2>
            <span style={{ fontSize: 11, color: '#8C97A3' }}>الوحدة {unitSummary.unit_number} من {allUnits.length || '?'}</span>
          </div>
          {unit.video_duration && (
            <div style={{ fontSize: 11, color: '#8C97A3', marginTop: 3, marginRight: 40 }}><DfIcon name="timer" size={14} style={{ marginInlineEnd: 6 }} />{unitTimeLabel(unit.video_duration)}</div>
          )}
        </div>
        <span data-unit-badge={submission.status || 'not_started'} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600, color: st.color, background: st.color + '18', whiteSpace: 'nowrap' }}>{st.label}</span>
      </div>

      {/* التنقل بين الوحدات */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        {prevUnit ? (
          <button
            onClick={() => goToUnit(prevUnit)}
            style={{ padding: '7px 16px', background: '#F3EFE8', border: '1.5px solid #E8E3DA', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: "inherit", color: '#334452' }}
          >
            → {prevUnit.name}
          </button>
        ) : <div />}

        {nextUnit && currentSubmitted ? (
          <button
            onClick={() => goToUnit(nextUnit)}
            style={{ padding: '7px 18px', background: colors.primary, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: "inherit", color: '#fff', fontWeight: 700 }}
          >
            التالي: {nextUnit.name} ←
          </button>
        ) : nextUnit && !currentSubmitted ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: '#F3EFE8', borderRadius: 8, fontSize: 12, color: '#8C97A3' }}>
            <DfIcon name="lock" size={18} style={{ marginInlineEnd: 6 }} />{nextUnit.name} — أرسل الوحدة الحالية أولاً
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#8C97A3', padding: '7px 0' }}>آخر وحدة</div>
        )}
      </div>

      {/* حالة الوحدة بوضوح */}
      {['submitted', 'reviewing'].includes(submission.status) && (
        <div role="status" style={{ background: '#CFE5FA', border: '1.5px solid #9CC9F2', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#1B5E9E', fontWeight: 700, lineHeight: 1.8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DfIcon name="check" size={18} />
          <span>أرسلت هذه الوحدة للمستشار{submission.submitted_at ? ` في ${new Date(submission.submitted_at).toLocaleDateString('ar-SA-u-ca-gregory', { day: 'numeric', month: 'long' })}` : ''} — بانتظار مراجعته. بياناتك محفوظة ولا يلزمك إدخالها مرة أخرى؛ يمكنك الانتقال للوحدة التالية.</span>
        </div>
      )}
      {submission.status === 'approved' && (
        <div role="status" style={{ background: '#C9EFE1', border: '1.5px solid #7FD3B5', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#086449', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DfIcon name="check" size={18} />اعتمد المستشار هذه الوحدة ✓ — لا يلزمك أي إجراء عليها.
        </div>
      )}
      {submission.status === 'in_progress' && (
        <div role="status" style={{ background: '#FEF3EC', border: '1.5px solid #FBC3A3', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#A33F12', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <DfIcon name="save" size={18} />
          <span style={{ flex: 1 }}>حُفظت إجاباتك كمسودة ولم تُرسل للمراجعة بعد — يمكنك إكمالها لاحقًا أو إرسالها للمراجعة من تبويب «نماذج العمل».</span>
        </div>
      )}

      {/* ملاحظة المستشار — تبقى ظاهرة مع حالة «يحتاج تعديل» حتى يُعاد الإرسال */}
      {submission.status === 'revision' && (
        <div role="alert" data-consultant-note style={{ background: '#FCEBEB', border: '1px solid #F1B2B2', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#C53A3A', lineHeight: 1.8 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}><DfIcon name="warning" size={18} style={{ marginInlineEnd: 6 }} />ملاحظة المستشار</div>
          <div style={{ color: '#7F1D1D' }}>{submission.consultant_notes || 'طلب المستشار تعديل هذه الوحدة.'}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={openForms} style={{ padding: '7px 16px', background: colors.amber, color: '#0E2A3D', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>فتح نماذج العمل ←</button>
            <span style={{ fontSize: 12, color: '#7F1D1D' }}>عدّل المطلوب ثم اضغط «إعادة الإرسال للمراجعة».</span>
          </div>
        </div>
      )}

      {/* التبويبات */}
      <div ref={formAreaRef} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(14,42,61,0.06)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #F3EFE8', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '12px 18px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? colors.primary : '#5E6B78',
                borderBottom: `2px solid ${tab === t.id ? colors.primary : 'transparent'}`,
                marginBottom: -2, whiteSpace: 'nowrap', fontFamily: "inherit",
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
              context={{ plan_period: unitData?.plan_period, workflowId, openUnitPreview: unit.template_type === 'document' ? openUnitPreview : undefined }}
            />
          )}
        </div>
      </div>

      {/* رسائل — عبر Portal تختفي تلقائياً */}
      {msg && ReactDOM.createPortal(
        <div role="status" style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: msg.type === 'success' ? '#0B7F5D' : '#C53A3A',
          color: '#fff', borderRadius: 12, padding: '14px 24px',
          fontSize: 14, fontWeight: 700, maxWidth: 'min(92vw, 560px)', lineHeight: 1.7,
          boxShadow: '0 8px 30px rgba(14,42,61,0.25)',
          zIndex: 999999,
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeInUp 0.3s ease',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{msg.type === 'success' ? <DfIcon name="check" size={20} /> : <DfIcon name="x" size={20} />}</span>
          <span>{msg.text}</span>
        </div>,
        document.body
      )}

      {/* أزرار الحفظ والإرسال */}
      {tab === 5 && (
        <div style={{ marginTop: 20 }}>
          {/* الحقول اللازمة للإرسال (حفظ المسودة متاح دائمًا) */}
          {!isLocked && !validation.valid && (
            <div data-missing-fields style={{ background: showErrors ? '#FCEBEB' : '#FEF3EC', border: `1.5px solid ${showErrors ? '#F1B2B2' : '#FBC3A3'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 14, direction: 'rtl' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: showErrors ? '#C53A3A' : '#A33F12', marginBottom: 6 }}>
                <DfIcon name="warning" size={18} style={{ marginInlineEnd: 6 }} />يجب إكمال ما يلي قبل «الإرسال للمراجعة» — ويمكنك حفظ المسودة الآن:
              </div>
              <ul style={{ margin: 0, padding: '0 20px', fontSize: 12, color: '#7F310E', lineHeight: 2 }}>
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          {!isLocked && validation.warnings?.length > 0 && (
            <div data-soft-warning style={{ background: '#EAF4FD', border: '1px solid #A9D2F5', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 12.5, color: '#1A65AD', lineHeight: 1.8 }}>
              {validation.warnings.map((w, i) => <div key={i}>{w}</div>)}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {!isLocked && (
              <>
                {DEMO_DATA[unit.template_type] && (
                  <>
                    <button
                      onClick={() => setDemoConfirm(true)}
                      style={{ padding: '11px 22px', background: '#EAF4FD', color: '#1A65AD', border: '1.5px solid #A9D2F5', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "inherit" }}
                    >
                      <DfIcon name="flask" size={18} style={{ marginInlineEnd: 6 }} />تعبئة تجريبية
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
                  disabled={saving}
                  title="يحفظ ما كتبته كمسودة حتى لو بقيت خانات فارغة"
                  style={{
                    padding: '11px 28px',
                    background: '#F3EFE8', color: '#334452',
                    border: '1.5px solid #E8E3DA',
                    borderRadius: 10, fontSize: 14, fontWeight: 600,
                    cursor: saving ? 'wait' : 'pointer',
                    fontFamily: "inherit",
                    opacity: saving ? 0.75 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {saving ? 'جارٍ حفظ المسودة…' : 'حفظ'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || submitBlocked}
                  aria-disabled={submitBlocked ? 'true' : undefined}
                  aria-describedby={submitBlocked ? 'submit-blocked-msg' : undefined}
                  title={submitBlocked ? 'صحّح علاقات التبعية في الهيكل أولًا' : !validation.valid ? 'أكمل الحقول المطلوبة أولاً' : ''}
                  data-can-submit={validation.valid ? '1' : '0'}
                  data-submit-blocked={submitBlocked ? '1' : undefined}
                  style={{
                    padding: '11px 28px',
                    background: validation.valid ? colors.amber : '#E8E3DA',
                    color: validation.valid ? '#0E2A3D' : '#8C97A3',
                    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    cursor: submitBlocked ? 'not-allowed' : submitting ? 'wait' : 'pointer',
                    fontFamily: "inherit",
                    opacity: validation.valid ? 1 : 0.75,
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? 'جاري الإرسال...' : submitLabel}
                </button>
                {submitBlocked && (
                  <span id="submit-blocked-msg" role="status" style={{ fontSize: 12, color: '#C53A3A', fontWeight: 700, alignSelf: 'center' }}>
                    الإرسال معطّل: صحّح التبعية الذاتية أو الدائرية في الهيكل، ثم يتفعّل الزر. حفظ المسودة متاح.
                  </span>
                )}
                {currentSubmitted && nextUnit && (
                  <button
                    onClick={() => goToUnit(nextUnit)}
                    style={{ padding: '11px 28px', background: colors.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit" }}
                  >
                    التالي: {nextUnit.name} ←
                  </button>
                )}
              </>
            )}
            {isLocked && nextUnit && (
              <button
                onClick={() => goToUnit(nextUnit)}
                style={{ padding: '11px 32px', background: colors.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit" }}
              >
                التالي: {nextUnit.name} ←
              </button>
            )}
          </div>
          {draftLine && (
            <div data-draft-state={draft} role="status" style={{ textAlign: 'center', fontSize: 12, color: draftLine.color, marginTop: 10, fontWeight: 600 }}>
              {draftLine.text}
            </div>
          )}
        </div>
      )}

      {isLocked && (
        <div style={{ background: '#C9EFE1', border: '1px solid #7FD3B5', borderRadius: 10, padding: '10px 16px', marginTop: 14, fontSize: 13, color: '#0B7F5D', textAlign: 'center' }}>
          <DfIcon name="check" size={18} style={{ marginInlineEnd: 6 }} />هذه الوحدة معتمدة نهائياً من المستشار
        </div>
      )}

      {/* لوحة معاينة مخرجات وحدة سابقة (من نموذج الوثيقة) */}
      {preview && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', justifyContent: 'flex-start' }} onClick={() => setPreview(null)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,42,61,0.35)' }} />
          <aside role="dialog" aria-label={`مخرجات ${preview.name}`} onClick={e => e.stopPropagation()}
            style={{ position: 'relative', width: 'min(640px, 100%)', height: '100%', background: '#fff', boxShadow: '0 0 40px rgba(14,42,61,0.25)', display: 'flex', flexDirection: 'column', direction: 'rtl' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #E8E3DA', gap: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>{preview.name}</div>
                <div style={{ fontSize: 11.5, color: '#8C97A3' }}>مخرجاتك المحفوظة في هذه الخطة — للقراءة فقط، ونصّ الوثيقة الذي تكتبه يبقى كما هو</div>
              </div>
              <button type="button" onClick={() => setPreview(null)} style={{ padding: '7px 14px', background: '#F3EFE8', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: '#334452' }}>إغلاق ✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
              {preview.loading && <div style={{ textAlign: 'center', padding: 40, color: colors.primary }}>جارٍ تحميل المخرجات…</div>}
              {preview.error && <div style={{ color: '#C53A3A', fontSize: 13 }}>{preview.error}</div>}
              {!preview.loading && !preview.error && preview.unit && (
                preview.submission?.form_data && Object.keys(preview.submission.form_data).length > 0
                  ? <TemplateRenderer unit={preview.unit} formData={preview.submission.form_data} setFormData={() => {}} disabled context={{}} />
                  : <div style={{ fontSize: 13, color: '#8C97A3', padding: 20, textAlign: 'center' }}>لم تُحفظ إجابات بعد في هذه الوحدة.</div>
              )}
            </div>
          </aside>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ─── تبويب النبذة ─── */
function TabOverview({ unit }) {
  if (unit.content?.overview) return <OverviewContent unit={unit} />;
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 10 }}>عن هذه الوحدة</div>
      <p style={{ fontSize: 14, color: '#334452', lineHeight: 1.9, marginBottom: 14 }}>{unit.overview || '—'}</p>
      {unit.overview2 && (
        <p style={{ fontSize: 13, color: '#465564', lineHeight: 1.8, padding: '10px 14px', background: '#EAF4FD', borderRadius: 8, borderRight: `3px solid ${colors.primary}`, marginBottom: 16 }}>
          {unit.overview2}
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', maxWidth: 360 }}>
        <InfoBox label="نوع النموذج" value={templateLabel(unit)} />
      </div>
    </div>
  );
}

/* ─── تبويب الشرح المكتوب ─── */
function TabDescription({ unit }) {
  if (unit.content?.explanation) return <ExplanationContent unit={unit} />;
  const topics = unit.topics || [];
  const hasText = !!unit.written_description;
  const hasTopics = topics.length > 0;

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>الشرح المكتوب</div>
      {hasText && (
        <p style={{ fontSize: 14, color: '#334452', lineHeight: 1.9, marginBottom: hasTopics ? 20 : 0, whiteSpace: 'pre-line' }}>
          {unit.written_description}
        </p>
      )}
      {hasTopics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {topics.map((topic, i) => (
            <div key={i} style={{ background: '#FBF9F5', borderRadius: 10, padding: '14px 18px', borderRight: `3px solid ${colors.primary}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>{topic.t}</div>
              <div style={{ fontSize: 13, color: '#465564', lineHeight: 1.8 }}>{topic.d}</div>
            </div>
          ))}
        </div>
      )}
      {!hasText && !hasTopics && (
        <p style={{ color: '#8C97A3', fontSize: 13 }}>لا يوجد شرح مكتوب لهذه الوحدة بعد</p>
      )}
    </div>
  );
}

/* ─── تبويب الإرشادات ─── */
function TabGuide({ unit }) {
  if (unit.content?.guidelines) return <GuidelinesContent unit={unit} />;
  const steps = unit.steps || [];
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>إرشادات العمل</div>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#FBF9F5', borderRadius: 10, alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 3 }}>{step.t}</div>
            <div style={{ fontSize: 13, color: '#5E6B78', lineHeight: 1.7 }}>{step.d}</div>
          </div>
        </div>
      ))}
      {unit.tip && (
        <div style={{ background: '#FEF3EC', border: '1px solid #FBC3A3', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, marginTop: 8 }}>
          <span style={{ fontSize: 18 }}><DfIcon name="bulb" size={18} /></span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7F310E', marginBottom: 2 }}>نصيحة</div>
            <div style={{ fontSize: 13, color: '#5E240A', lineHeight: 1.7 }}>{unit.tip}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── تبويب الفيديو ─── */
function TabVideo({ unit }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>الفيديو التعليمي</div>
      {unit.video_url || unit.video_url_alt ? (
        <UnitVideo url={unit.video_url} altUrl={unit.video_url_alt} title={unit.name} />
      ) : (
        <div style={{ background: '#F3EFE8', borderRadius: 12, padding: 60, color: '#8C97A3', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}><DfIcon name="film" size={40} /></div>
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
      <div style={{ fontSize: 40, marginBottom: 14 }}><DfIcon name="chat" size={40} /></div>
      <div style={{ fontSize: 16, fontWeight: 700, color: colors.ink, marginBottom: 8 }}>خدمة الدردشة مع المستشار</div>
      <p style={{ fontSize: 13, color: '#5E6B78', maxWidth: 400, margin: '0 auto 24px' }}>تواصل مع المستشار للحصول على توجيه وإجابة أسئلتك</p>
      <button style={{ padding: '11px 32px', background: colors.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit" }}
        onClick={() => onNavigate && onNavigate('client-chat')}>بدء المحادثة</button>
    </div>
  );
}

const InfoBox = ({ label, value }) => (
  <div style={{ background: '#FBF9F5', borderRadius: 8, padding: '12px 16px' }}>
    <div style={{ fontSize: 11, color: '#8C97A3', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: '#334452' }}>{value}</div>
  </div>
);
