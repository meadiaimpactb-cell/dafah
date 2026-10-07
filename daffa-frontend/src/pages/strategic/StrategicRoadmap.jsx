import React, { useState, useEffect, useCallback, useRef } from 'react';
import { strategicApi } from '../../api/strategic';
import StepServiceSelect    from './steps/StepServiceSelect';
import StepConsultantSelect from './steps/StepConsultantSelect';
import StepPayment          from './steps/StepPayment';
import StepWork             from './steps/StepWork';
import StepReview           from './steps/StepReview';
import StepApproval         from './steps/StepApproval';

const STEPS = [
  { id: 0, label: 'اختيار الخدمة' },
  { id: 1, label: 'اختيار المستشار' },
  { id: 2, label: 'الدفع' },
  { id: 3, label: 'تعبئة النماذج ومشاهدة المواد' },
  { id: 4, label: 'مراجعة المستشار' },
  { id: 5, label: 'الاعتماد' },
];

const C = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

const STATUS_CFG = {
  pending:   { label: 'جارٍ الإعداد',   color: '#6b7280', bg: '#f3f4f6' },
  active:    { label: 'جارٍ التنفيذ',   color: '#1A6B7C', bg: '#E8F4F6' },
  review:    { label: 'قيد المراجعة',   color: '#7c3aed', bg: '#ede9fe' },
  completed: { label: 'مكتملة',          color: '#16a34a', bg: '#dcfce7' },
};

// ── PlansList ────────────────────────────────────────────────────────────────
function PlansList({ plans, onSelect, onCreateNew, canCreate, loading }) {
  if (loading) return (
    <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ height: 96, borderRadius: 10, background: '#f3f4f6', marginBottom: 12 }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 28px', marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.tealDark, marginBottom: 4 }}>خططك الاستراتيجية</h2>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            {plans.length === 0 ? 'لم تبدأ أي خطة بعد' : `لديك ${plans.length} ${plans.length === 1 ? 'خطة' : 'خطط'} استراتيجية`}
          </p>
        </div>
        <button
          onClick={canCreate ? onCreateNew : undefined}
          title={canCreate ? '' : 'يجب إكمال تسليم جميع الوحدات الـ11 في الخطة الحالية أولاً'}
          style={{
            padding: '11px 24px',
            background: canCreate ? C.orange : '#d1d5db',
            color: canCreate ? '#fff' : '#9ca3af',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: canCreate ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
            opacity: canCreate ? 1 : 0.75,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{canCreate ? '+' : '🔒'}</span> إنشاء خطة جديدة
        </button>
      </div>

      {/* Warning banner when creation is locked */}
      {!canCreate && plans.length > 0 && (
        <div style={{ marginBottom: 20, padding: '14px 20px', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 12, direction: 'rtl' }}>
          <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>لا يمكن إنشاء خطة جديدة حالياً</div>
            <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
              يجب إكمال تسليم جميع الوحدات الـ11 في الخطة الحالية قبل البدء في خطة جديدة. استمر في العمل على خطتك الحالية وأرسل جميع الوحدات للمستشار.
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {plans.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '60px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.tealDark, marginBottom: 10 }}>ابدأ خطتك الاستراتيجية الأولى</div>
          <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.7 }}>
            بناء خطة استراتيجية متكاملة للمنظمة من خلال 11 وحدة تخطيطية بمرافقة مستشار متخصص
          </p>
          <button
            onClick={onCreateNew}
            style={{ padding: '13px 36px', background: C.orange, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ابدأ الآن ←
          </button>
        </div>
      )}

      {/* Plans grid */}
      {plans.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...plans].reverse().map((plan, idx) => {
            const cfg     = STATUS_CFG[plan.status] || STATUS_CFG.pending;
            const approved = plan.approved_count ?? 0;
            const total    = plan.total_count    ?? 11;
            const pct      = total > 0 ? Math.round((approved / total) * 100) : 0;
            const planNum  = plans.length - idx;
            const stepLabel = STEPS[plan.current_step]?.label ?? '';
            const isDone   = plan.status === 'completed';

            return (
              <div
                key={plan.id}
                style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'box-shadow 0.2s', border: '1.5px solid transparent' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,107,124,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)'}
                onClick={() => onSelect(plan.id)}
              >
                {/* Plan number badge */}
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: isDone ? '#dcfce7' : '#E8F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: isDone ? '#16a34a' : C.teal }}>#{planNum}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.tealDark }}>الخطة الاستراتيجية #{planNum}</span>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                    {plan.consultant ? `المستشار: ${plan.consultant.name}` : 'لم يُختر مستشار بعد'}
                    {stepLabel && plan.status !== 'completed' && <span style={{ marginRight: 12 }}>· المرحلة: {stepLabel}</span>}
                  </div>
                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: isDone ? '#16a34a' : C.teal, borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{approved}/{total} وحدة معتمدة</span>
                  </div>
                </div>

                {/* Date + Action */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>
                    {new Date(plan.created_at).toLocaleDateString('ar-SA')}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onSelect(plan.id); }}
                    style={{ padding: '8px 20px', background: isDone ? '#dcfce7' : C.teal, color: isDone ? '#16a34a' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {isDone ? 'عرض' : 'استمرار'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ServiceSummary (Step 0 review — read-only) ───────────────────────────────
function ServiceSummary({ workflow, pricing, onContinue }) {
  const base  = pricing?.base                ?? 5000;
  const cert  = pricing?.addon_certification ?? 2000;
  const des   = pricing?.addon_design        ?? 1500;
  const items = [
    { label: 'الخطة الاستراتيجية الأساسية (11 وحدة)', price: base, included: true },
    { label: 'اعتماد الخطة من جهة استشارية',            price: cert, included: !!workflow?.addon_certification },
    { label: 'تصميم احترافي للوثيقة',                   price: des,  included: !!workflow?.addon_design },
  ];

  return (
    <div className="animate-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E8F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.tealDark }}>الخدمات المختارة</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>ملخص ما تم اختياره في بداية الخطة</div>
          </div>
        </div>

        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: item.included ? '#f0fdf4' : '#f9fafb', borderRadius: 8, marginBottom: 8, border: `1px solid ${item.included ? '#bbf7d0' : '#e5e7eb'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>{item.included ? '✅' : '⬜'}</span>
              <span style={{ fontSize: 13, color: item.included ? '#166534' : '#9ca3af', fontWeight: item.included ? 600 : 400 }}>{item.label}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: item.included ? '#16a34a' : '#9ca3af' }}>
              {item.price.toLocaleString('en-US')} ريال
            </span>
          </div>
        ))}

        <div style={{ marginTop: 16, padding: '14px 16px', background: '#f8fafb', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.tealDark }}>الإجمالي المدفوع</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.teal }}>{Number(workflow?.total ?? 0).toLocaleString('en-US')} ريال</span>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onContinue}
          style={{ padding: '11px 32px', background: C.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          العودة للخطوة الحالية ←
        </button>
      </div>
    </div>
  );
}

// ── WorkflowStepper ──────────────────────────────────────────────────────────
function WorkflowStepper({ step, workflow, onStepClick }) {
  const realStep = workflow?.current_step ?? step;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 0 }}>
        {STEPS.map((s, i) => {
          const isCompleted = workflow?.status === 'completed';
          // الخطوة "منجزة" إذا تجاوزها الـ workflow فعلاً
          const done        = isCompleted ? true : realStep > s.id;
          const current     = !done && step === s.id;
          // الخطوات المنجزة فقط قابلة للنقر للمراجعة (منطقي)
          const clickable   = done && onStepClick;

          return (
            <React.Fragment key={s.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90, flex: 1 }}>
                <div
                  onClick={() => clickable && onStepClick(s.id)}
                  title={clickable ? `مراجعة: ${s.label}` : undefined}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: done ? C.teal : current ? C.orange : '#e5e7eb',
                    color: done || current ? '#fff' : '#9ca3af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, transition: 'all 0.2s',
                    cursor: clickable ? 'pointer' : 'default',
                    outline: step === s.id && done ? `3px solid ${C.orange}` : 'none',
                    outlineOffset: 2,
                    boxShadow: clickable ? '0 2px 6px rgba(26,107,124,0.18)' : 'none',
                  }}
                  onMouseEnter={e => { if (clickable) e.currentTarget.style.background = C.tealDark; }}
                  onMouseLeave={e => { if (clickable) e.currentTarget.style.background = C.teal; }}
                >
                  {done ? '✓' : s.id + 1}
                </div>
                <div
                  onClick={() => clickable && onStepClick(s.id)}
                  style={{
                    fontSize: 11,
                    color: current ? C.orange : done ? C.teal : '#9ca3af',
                    marginTop: 6, textAlign: 'center',
                    fontWeight: current || (done && step === s.id) ? 700 : 400,
                    cursor: clickable ? 'pointer' : 'default',
                    textDecoration: clickable ? 'underline dotted' : 'none',
                    textDecorationColor: 'rgba(26,107,124,0.4)',
                  }}
                >
                  {s.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: (isCompleted || realStep > s.id) ? C.teal : '#e5e7eb', minWidth: 20, marginBottom: 20, transition: 'background 0.3s' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {/* مؤشر وضع المراجعة */}
      {workflow && step < realStep && (
        <div style={{ marginTop: 12, padding: '6px 14px', background: '#fff8f0', borderRadius: 8, border: `1px solid ${C.orange}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: C.orange, fontWeight: 600 }}>
            🔍 وضع المراجعة — تستعرض: {STEPS[step]?.label}
          </span>
          <button
            onClick={() => onStepClick && onStepClick(realStep)}
            style={{ background: 'none', border: 'none', color: C.teal, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
          >
            العودة للخطوة الحالية ←
          </button>
        </div>
      )}
    </div>
  );
}

// ── StrategicRoadmap (main) ──────────────────────────────────────────────────
export default function StrategicRoadmap({ activeUnit, setActiveUnit, navigate, workflowId, onWorkflowSelect }) {
  const [workflow,      setWorkflow]      = useState(null);
  const [units,         setUnits]         = useState(null);
  const [catalog,       setCatalog]       = useState(null);
  const [pricing,       setPricing]       = useState(null);
  const [step,          setStep]          = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [plansLoading,  setPlansLoading]  = useState(false);
  const [plans,         setPlans]         = useState([]);
  const [canCreate,     setCanCreate]     = useState(true);
  const [isCreatingNew,  setIsCreatingNew]  = useState(false);
  const [unitRefreshKey, setUnitRefreshKey] = useState(0);
  const prevActiveUnitRef = useRef(activeUnit);

  // "عرض القائمة" = لا يوجد workflowId ولا نحن في وضع الإنشاء
  const showPlansList = !workflowId && !isCreatingNew;

  const applyPageData = (data) => {
    if (data.catalog) setCatalog(data.catalog);
    if (data.pricing) setPricing(data.pricing);
    if (data.workflow) {
      const wf = data.workflow;
      if (data.submissions) wf.submissions = data.submissions;
      setWorkflow(wf);
      setStep(wf.current_step);
      if (data.units) setUnits(data.units);
    }
  };

  // ── عند العودة من صفحة الوحدة: تحديث بيانات الخطة ───────────────────
  useEffect(() => {
    if (prevActiveUnitRef.current && !activeUnit && workflowId) {
      refreshWorkflow().then(() => setUnitRefreshKey(k => k + 1));
    }
    prevActiveUnitRef.current = activeUnit;
  }, [activeUnit]);

  // ── جلب قائمة الخطط عند دخول الصفحة بدون workflowId ──────────────────
  useEffect(() => {
    if (!showPlansList) return;
    setPlansLoading(true);
    strategicApi.listWorkflows()
      .then(res => {
        const d = res.data;
        if (d && Array.isArray(d.workflows)) {
          setPlans(d.workflows);
          setCanCreate(d.can_create_new ?? true);
        } else {
          setPlans(Array.isArray(d) ? d : []);
          setCanCreate(true);
        }
      })
      .finally(() => setPlansLoading(false));
  }, [showPlansList]);

  // ── جلب بيانات الخطة المحددة ────────────────────────────────────────────
  useEffect(() => {
    if (!workflowId) return;
    setLoading(true);
    strategicApi.getPageData(workflowId)
      .then(res => applyPageData(res.data))
      .finally(() => setLoading(false));
  }, [workflowId]);

  const refreshWorkflow = useCallback(async () => {
    const res = await strategicApi.getPageData(workflowId);
    applyPageData(res.data);
  }, [workflowId]);

  // ── بعد إنشاء خطة جديدة: workflowId يتغير → تحميل بياناتها ────────────
  const handleWorkflowCreated = (newWorkflow) => {
    setWorkflow(newWorkflow);
    setStep(newWorkflow.current_step);
    setIsCreatingNew(false);
    if (onWorkflowSelect) onWorkflowSelect(newWorkflow.id);
  };

  // ── عرض قائمة الخطط ─────────────────────────────────────────────────────
  if (showPlansList) {
    return (
      <PlansList
        plans={plans}
        loading={plansLoading}
        canCreate={canCreate}
        onSelect={(id) => onWorkflowSelect && onWorkflowSelect(id)}
        onCreateNew={() => canCreate && setIsCreatingNew(true)}
      />
    );
  }

  // ── وضع إنشاء خطة جديدة (step 0) ───────────────────────────────────────
  if (isCreatingNew) {
    return (
      <div className="animate-in">
        {/* شريط تنقل علوي */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setIsCreatingNew(false)}
            style={{ background: 'none', border: 'none', color: C.teal, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
          >
            ← العودة إلى قائمة الخطط
          </button>
        </div>
        <WorkflowStepper step={0} workflow={null} />
        <StepServiceSelect
          catalog={catalog}
          pricing={pricing}
          setWorkflow={() => {}}
          setStep={() => {}}
          onWorkflowCreated={handleWorkflowCreated}
        />
      </div>
    );
  }

  // ── تحميل بيانات الخطة ──────────────────────────────────────────────────
  if (loading) return (
    <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', gap: 8 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb' }} />
            <div style={{ width: 60, height: 10, borderRadius: 4, background: '#e5e7eb' }} />
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '40%', height: 20, borderRadius: 4, background: '#e5e7eb', marginBottom: 16 }} />
        {[...Array(4)].map((_, i) => <div key={i} style={{ height: 56, borderRadius: 8, background: '#f3f4f6', marginBottom: 10 }} />)}
      </div>
    </div>
  );

  if (activeUnit) return null;

  const handleStepClick = (targetStep) => {
    // السماح فقط بالانتقال للخطوات المنجزة فعلاً في قاعدة البيانات
    if (workflow && targetStep <= workflow.current_step) {
      setStep(targetStep);
    }
  };

  const props = { workflow, setWorkflow, setStep, refreshWorkflow, navigate, workflowId };

  return (
    <div className="animate-in">
      {/* زر العودة للقائمة */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => onWorkflowSelect && onWorkflowSelect(null)}
          style={{ background: 'none', border: 'none', color: C.teal, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
        >
          ← العودة إلى قائمة الخطط
        </button>
      </div>

      <WorkflowStepper step={step} workflow={workflow} onStepClick={handleStepClick} />

      {/* الخطوة 0: ملخص الخدمة المختارة (للمراجعة فقط) */}
      {step === 0 && workflow && <ServiceSummary workflow={workflow} pricing={pricing} onContinue={() => setStep(workflow.current_step)} />}

      {step === 1 && <StepConsultantSelect {...props} />}
      {step === 2 && <StepPayment {...props} pricing={pricing} />}
      {step === 3 && <StepWork {...props} setActiveUnit={setActiveUnit} refreshKey={unitRefreshKey} />}
      {step === 4 && <StepReview {...props} setActiveUnit={setActiveUnit} />}
      {step === 5 && <StepApproval {...props} />}
    </div>
  );
}
