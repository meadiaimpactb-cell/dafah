import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { policiesApi, policiesDesignApi } from "../../api/policies";
import api from "../../api/axios";
import { ConsultantRating } from "../strategic/steps/StepApproval";
import { PaymentReceipt } from "../strategic/steps/StepPayment";
import { IcCheckCircle, IcArrowPath, IcUpload, IcSearch, IcWarning, IcLock, IcLightbulb, IcSave, IcDocument, IcUser, IcCalendar, IcCreditCard, IcSparkles, IcCheck, IcPencil, IcEye, IcPalette, IcBeaker, IcChat, IcScroll, IcClock } from '../../utils/icons';

// ── Payment Gateway Mock ──────────────────────────────────────────────────────
// To go live: replace ONLY the body of this function with the real provider SDK
// (Moyasar, HyperPay, Tap…). All other code stays unchanged.
async function gatewayCharge({ method, card }) {
  // Test card: 4111 1111 1111 1111 | Expiry: 12/26 | CVV: 123 | Name: أي اسم
  await new Promise(r => setTimeout(r, 1600));
  if (method === 'card' || method === 'mada') {
    const num = (card.number || '').replace(/\s/g, '');
    if (num.length !== 16)                    throw new Error('رقم البطاقة يجب أن يكون 16 رقماً');
    const [mm, yy] = (card.expiry || '').split('/');
    if (!mm || !yy || Number(mm) < 1 || Number(mm) > 12) throw new Error('تاريخ الانتهاء غير صحيح (MM/YY)');
    const now = new Date();
    if (Number('20' + yy) < now.getFullYear() || (Number('20' + yy) === now.getFullYear() && Number(mm) < now.getMonth() + 1))
      throw new Error('البطاقة منتهية الصلاحية');
    if ((card.cvv || '').length < 3)          throw new Error('رمز CVV يجب أن يكون 3 أرقام');
    if (!(card.name || '').trim())            throw new Error('اسم حامل البطاقة مطلوب');
    if (num === '4000000000000002')           throw new Error('البطاقة مرفوضة — استخدم 4111 1111 1111 1111 للاختبار');
  }
}

// ── Card input formatting ─────────────────────────────────────────────────────
const fmtCardNum = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExpiry  = v => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; };
const fmtCvv     = v => v.replace(/\D/g, '').slice(0, 3);

// ── Design tokens (نفس ألوان المنصة) ──────────────────────────────────────────
const C = {
  teal: "#1A6B7C", tealDark: "#145A68", tealCard: "#1E5E6E",
  orange: "#E8713A", orangeLight: "#FDF0E8",
  bg: "#F8FAFB", white: "#FFFFFF",
  gray: "#6B7280", grayLight: "#F3F4F6", grayBorder: "#E5E7EB",
  green: "#10B981", greenLight: "#D1FAE5",
  blue: "#3B82F6", blueLight: "#DBEAFE",
  red: "#EF4444", redLight: "#FEE2E2",
  yellow: "#F59E0B", yellowLight: "#FEF3C7",
};

// ── Confirm Modal ─────────────────────────────────────────────────────────────
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

// ── Shared UI helpers ─────────────────────────────────────────────────────────
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.white, borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", disabled, small, full, icon }) => {
  const s = {
    primary:   { bg: C.orange,  color: "white", border: "none" },
    secondary: { bg: "transparent", color: C.teal, border: `2px solid ${C.teal}` },
    ghost:     { bg: "transparent", color: C.teal, border: "none" },
    success:   { bg: C.green,   color: "white", border: "none" },
    danger:    { bg: C.red,     color: "white", border: "none" },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: small ? "6px 14px" : "10px 24px", borderRadius: 10, fontSize: small ? 12 : 14,
        fontWeight: 600, fontFamily: "'Cairo',sans-serif",
        background: disabled ? C.grayLight : s.bg, color: disabled ? C.gray : s.color,
        border: s.border || "none", cursor: disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : "auto", opacity: disabled ? 0.6 : 1, transition: "all 0.2s" }}>
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  );
};

const Badge = ({ text, color = "gray" }) => {
  const map = { green: [C.greenLight, C.green], blue: [C.blueLight, C.blue], orange: [C.orangeLight, C.orange], gray: [C.grayLight, C.gray], yellow: [C.yellowLight, C.yellow], red: [C.redLight, C.red] };
  const [bg, fg] = map[color] || map.gray;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color: fg, whiteSpace: "nowrap" }}>{text}</span>;
};

const ProgressBar = ({ percent }) => (
  <div style={{ width: "100%", height: 8, background: C.grayLight, borderRadius: 8, overflow: "hidden" }}>
    <div style={{ width: `${percent}%`, height: "100%", background: `linear-gradient(90deg,${C.teal},${C.orange})`, borderRadius: 8, transition: "width 0.8s ease" }} />
  </div>
);

const statusBadge = (status) => ({
  not_started: <Badge text="لم يبدأ" color="gray" />,
  in_progress: <Badge text="جارٍ التعبئة" color="yellow" />,
  submitted:   <Badge text="أُرسل للمراجعة" color="blue" />,
  reviewing:   <Badge text="قيد المراجعة" color="blue" />,
  approved:    <Badge text="معتمد" color="green" />,
  revision:    <Badge text="يحتاج تعديل" color="orange" />,
}[status] || <Badge text={status} color="gray" />);

// ── Workflow stepper ──────────────────────────────────────────────────────────
const STEPS = [
  { label: "بناء السياسات",              icon: <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg> },
  { label: "اختيار السياسات المرادة",    icon: <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> },
  { label: "الدفع",                       icon: <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/></svg> },
  { label: "تعبئة الاستمارات ومشاهدة الفيديوهات", icon: <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-2.207 2.207L3 13.172V16h2.828l8.38-8.379-2.83-2.828z"/></svg> },
  { label: "مراجعة المستشار",            icon: <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg> },
  { label: "اعتماد",                      icon: <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> },
  { label: "تحميل السياسات",             icon: <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg> },
  { label: "هل تود التصميم؟",            icon: <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 12v3h3l-.293.293a1 1 0 01-.707.293H4a1 1 0 01-1-1v-4a1 1 0 01.293-.707L5 8.172V12z"/></svg>, diamond: true },
];

const Stepper = ({ step, allDone, realStep, onStepClick }) => {
  const effective = realStep ?? step; // الخطوة الحقيقية في قاعدة البيانات
  const reviewing = onStepClick && step < effective;

  return (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "14px 0", overflowX: "auto" }}>
      {STEPS.map((ws, i) => {
        const done      = allDone || i < effective;
        const current   = !allDone && i === step;
        const clickable = done && onStepClick;
        return (
          <React.Fragment key={i}>
            <div
              onClick={() => clickable && onStepClick(i)}
              title={clickable && !current ? `مراجعة: ${ws.label}` : undefined}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 60, cursor: clickable ? "pointer" : "default" }}
            >
              <div style={{
                width: 32, height: 32,
                borderRadius: done ? "50%" : ws.diamond ? 0 : current ? 8 : "50%",
                transform: (!done && ws.diamond) ? "rotate(45deg)" : "none",
                background: done ? (current ? C.orange : C.green) : current ? C.orange : C.grayLight,
                color: (done || current) ? "white" : C.gray,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, transition: "all 0.3s",
                boxShadow: current ? `0 3px 10px ${C.orange}40` : done ? `0 2px 8px ${C.green}40` : "none",
                outline: clickable && !current ? `2px solid ${C.teal}30` : "none",
                outlineOffset: 2,
              }}>
                <span style={{ transform: (!done && ws.diamond) ? "rotate(-45deg)" : "none", display: "flex" }}>
                  {done && !current
                    ? <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    : ws.icon}
                </span>
              </div>
              <span style={{ fontSize: 8, fontWeight: current ? 700 : 400, color: done ? (current ? C.orange : C.green) : C.gray, textAlign: "center", maxWidth: 70, lineHeight: 1.2 }}>
                {ws.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: (allDone || i < effective) ? C.green : C.grayBorder, margin: "0 2px", marginBottom: 18, transition: "background 0.3s" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>

    {/* مؤشر وضع المراجعة */}
    {reviewing && (
      <div style={{ marginTop: 6, padding: '6px 14px', background: '#fff8f0', borderRadius: 8, border: `1px solid ${C.orange}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: C.orange, fontWeight: 600 }}>
          🔍 وضع المراجعة — تستعرض: {STEPS[step]?.label}
        </span>
        <button
          onClick={() => onStepClick(effective)}
          style={{ background: 'none', border: 'none', color: C.teal, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}
        >
          العودة للخطوة الحالية ←
        </button>
      </div>
    )}
  </div>
  );
};

// ── Step 0: Intro ──────────────────────────────────────────────────────────────
const StepIntro = ({ policyTypes, onStart, loading, operationalCompleted }) => (
  <div className="animate-in">
    <Card style={{ padding: 32, textAlign: "center", marginBottom: 20, borderBottom: `3px solid ${C.orange}` }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.orange }}><IcScroll width={28} height={28}/></div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: C.tealDark }}>نظام بناء السياسات واللوائح</h2>
      <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.8, maxWidth: 600, margin: "12px auto 0" }}>
        بناء السياسات واللوائح الداخلية لمنظمتك من خلال استبيانات ذكية موجهة — أجب على الأسئلة والنظام يولّد السياسة تلقائياً
      </p>
    </Card>

    {!operationalCompleted && (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", background: C.yellowLight, border: `1.5px solid ${C.yellow}`, borderRadius: 12, marginBottom: 20 }}>
        <span style={{ flexShrink: 0, color: "#92400E" }}><IcWarning width={22} height={22}/></span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>
            يتطلب إكمال التخطيط التشغيلي أولاً
          </div>
          <div style={{ fontSize: 13, color: "#78350F", lineHeight: 1.7 }}>
            يجب اعتماد جميع وحدات التخطيط التشغيلي الخمس واكتمال مرحلة المراجعة قبل البدء بمرحلة السياسات واللوائح.
          </div>
        </div>
      </div>
    )}

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.tealDark, marginBottom: 14 }}>كيف يعمل النظام</h3>
        {["اختر السياسات التي تحتاجها منظمتك", "ادفع حسب السياسات المختارة (تسعير مستقل)", "أجب على استبيان ذكي لكل سياسة", "شاهد الفيديوهات التعليمية المرفقة", "النظام يولّد السياسة تلقائياً من إجاباتك", "المستشار يراجع ويعتمد", "حمّل السياسات بتصميم تلقائي أو احترافي"].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 6 ? `1px solid ${C.grayLight}` : "none" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.teal, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 13, color: C.tealDark }}>{item}</span>
          </div>
        ))}
      </Card>

      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.tealDark, marginBottom: 14 }}>السياسات المتاحة ({policyTypes.length})</h3>
        {policyTypes.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < policyTypes.length - 1 ? `1px solid ${C.grayLight}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: C.teal }}><IcDocument width={16} height={16}/></span>
              <span style={{ fontSize: 13 }}>{p.name}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.teal }}>{p.price.toLocaleString('en-US')} ريال</span>
          </div>
        ))}
      </Card>
    </div>

    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Btn onClick={onStart} disabled={loading || !operationalCompleted}>
          {loading ? "جارٍ التحميل..." : "التالي: اختيار السياسات ←"}
        </Btn>
        {!operationalCompleted && (
          <div style={{ marginTop: 8, fontSize: 12, color: C.yellow, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
            <IcLock width={12} height={12}/> أكمل التخطيط التشغيلي أولاً للمتابعة
          </div>
        )}
      </div>
    </div>
  </div>
);

// ── Step 1: Select policies ───────────────────────────────────────────────────
const StepSelect = ({ policyTypes, workflow, onNext, onSave, loading }) => {
  const saved = workflow?.selected_policies || [];
  const [selected, setSelected] = useState(saved.map(Number));

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const total  = selected.reduce((sum, id) => sum + (policyTypes.find(p => p.id === id)?.price || 0), 0);

  const handleNext = async () => {
    await onSave(selected);
    onNext();
  };

  return (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>اختر السياسات واللوائح المرادة</h2>
      <p style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>يمكنك اختيار سياسة واحدة أو أكثر — التسعير مستقل لكل سياسة</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
        {policyTypes.map(p => {
          const sel = selected.includes(p.id);
          return (
            <Card key={p.id} style={{ cursor: "pointer", border: sel ? `2px solid ${C.orange}` : "2px solid transparent", transition: "all 0.2s" }}
              onClick={() => toggle(p.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", color: C.orange }}><IcDocument width={22} height={22}/></div>
                {sel && <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><IcCheck width={14} height={14}/></div>}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.tealDark, marginTop: 10 }}>{p.name}</h3>
              <p style={{ fontSize: 11, color: C.gray, marginTop: 4, lineHeight: 1.5 }}>{p.description}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.teal }}>{p.price.toLocaleString('en-US')} ريال</span>
                <span style={{ fontSize: 11, color: C.gray }}>{p.sections.length} أقسام</span>
              </div>
            </Card>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div style={{ position: "sticky", bottom: 0, background: C.white, padding: "14px 20px", borderTop: `2px solid ${C.grayBorder}`, borderRadius: "14px 14px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -4px 12px rgba(0,0,0,0.1)" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.tealDark }}>السياسات المحددة: {selected.length}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.teal, marginRight: 16 }}> | الإجمالي: {total.toLocaleString('en-US')} ريال</span>
          </div>
          <Btn onClick={handleNext} disabled={loading}>التالي: الدفع ←</Btn>
        </div>
      )}
    </div>
  );
};

// ── Step 2: Payment ───────────────────────────────────────────────────────────
const PAY_METHODS = [
  { key: 'card',          label: 'بطاقة ائتمان' },
  { key: 'mada',          label: 'مدى' },
  { key: 'apple_pay',     label: 'Apple Pay' },
  { key: 'bank_transfer', label: 'تحويل بنكي' },
];

const EMPTY_CARD = { number: '', expiry: '', cvv: '', name: '' };

const CardInputForm = ({ card, onChange, isMada }) => {
  const inp = { padding: '10px 14px', border: `1.5px solid ${C.grayBorder}`, borderRadius: 10, fontSize: 13, fontFamily: "'Cairo',sans-serif", width: '100%', boxSizing: 'border-box', outline: 'none', direction: 'ltr' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Test card hint */}
      <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 11, color: '#15803d', direction: 'rtl', lineHeight: 1.8 }}>
        بطاقة الاختبار: <strong>4111 1111 1111 1111</strong> | تاريخ: <strong>12/26</strong> | CVV: <strong>123</strong>
      </div>
      {isMada && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <svg viewBox="0 0 68 22" width={74} height={24}>
            <rect width="68" height="22" rx="4" fill="#00623b"/>
            <text x="34" y="16" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="13" fill="#fff" letterSpacing="1">mada</text>
          </svg>
        </div>
      )}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.tealDark, display: 'block', marginBottom: 4 }}>رقم البطاقة</label>
        <input value={card.number} onChange={e => onChange({ ...card, number: fmtCardNum(e.target.value) })}
          placeholder="XXXX XXXX XXXX XXXX" maxLength={19} style={inp} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.tealDark, display: 'block', marginBottom: 4 }}>تاريخ الانتهاء</label>
          <input value={card.expiry} onChange={e => onChange({ ...card, expiry: fmtExpiry(e.target.value) })}
            placeholder="MM/YY" maxLength={5} style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.tealDark, display: 'block', marginBottom: 4 }}>CVV</label>
          <input value={card.cvv} onChange={e => onChange({ ...card, cvv: fmtCvv(e.target.value) })}
            placeholder="123" maxLength={3} type="password" style={{ ...inp, letterSpacing: 4 }} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.tealDark, display: 'block', marginBottom: 4 }}>اسم حامل البطاقة</label>
        <input value={card.name} onChange={e => onChange({ ...card, name: e.target.value })}
          placeholder="كما هو مكتوب على البطاقة" style={{ ...inp, direction: 'rtl' }} />
      </div>
    </div>
  );
};

const StepPayment = ({ policyTypes, workflow, onPay, onBack }) => {
  const [methodIdx,    setMethodIdx]   = useState(0);
  const [card,         setCard]        = useState(EMPTY_CARD);
  const [discountCode, setDiscountCode]= useState('');
  const [arbitration,  setArbitration] = useState(false);
  const [discAmt,      setDiscAmt]     = useState(0);
  const [paying,       setPaying]      = useState(false);
  const [payError,     setPayError]    = useState(null);

  const selected  = (workflow?.selected_policies || []).map(Number);
  const baseTotal = selected.reduce((sum, id) => sum + (policyTypes.find(p => p.id === id)?.price || 0), 0);
  const arbExtra  = arbitration ? 2000 : 0;
  const subtotal  = baseTotal + arbExtra;
  const taxable   = subtotal - discAmt;
  const vat       = Math.round(taxable * 0.15);
  const total     = taxable + vat;
  const methodKey = PAY_METHODS[methodIdx]?.key ?? 'card';

  if (workflow?.payment_status === 'paid') {
    return (
      <PaymentReceipt
        workflow={workflow}
        serviceLabel="السياسات واللوائح"
        extraRows={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
            {selected.map(id => {
              const p = policyTypes.find(x => x.id === id);
              return p ? (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.gray }}>
                  <span>{p.name}</span>
                  <span style={{ color: '#374151', fontWeight: 600 }}>{p.price.toLocaleString('en-US')} ر.س</span>
                </div>
              ) : null;
            })}
            {workflow?.include_arbitration && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.gray }}>
                <span>تحكيم السياسات</span>
                <span style={{ color: '#374151', fontWeight: 600 }}>2,000 ر.س</span>
              </div>
            )}
          </div>
        }
      />
    );
  }

  const applyDiscount = () => {
    if (discountCode.trim().toUpperCase() === 'DAFFA10') setDiscAmt(Math.round(subtotal * 0.10));
    else { setDiscAmt(0); alert('كود الخصم غير صحيح'); }
  };

  const handlePay = async () => {
    setPayError(null);
    setPaying(true);
    try {
      await gatewayCharge({ method: methodKey, card });
      await onPay({
        payment_method:      methodKey,
        policy_type_ids:     selected,
        discount_code:       discountCode.trim() || null,
        include_arbitration: arbitration,
      });
    } catch (e) {
      setPayError(e.response?.data?.message || e.message || 'حدث خطأ في عملية الدفع، يرجى المحاولة مرة أخرى.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.tealDark, marginBottom: 20 }}>إتمام الدفع — السياسات واللوائح</h2>

      {payError && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: C.redLight, border: `1.5px solid ${C.red}30`, borderRadius: 10, fontSize: 13, color: C.red, fontWeight: 600 }}>
          ⚠ {payError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ── Order summary ── */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.tealDark, marginBottom: 14 }}>ملخص الطلب</h3>
          {selected.map(id => { const p = policyTypes.find(x => x.id === id); return p && (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.grayLight}`, fontSize: 13 }}>
              <span>{p.icon} {p.name}</span>
              <span style={{ fontWeight: 600 }}>{p.price.toLocaleString('en-US')} ريال</span>
            </div>
          ); })}

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={arbitration} onChange={e => setArbitration(e.target.checked)} style={{ accentColor: C.teal }} />
              <span style={{ fontSize: 13 }}>تحكيم السياسات من مستشار</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.orange }}>2,000 ريال</span>
          </label>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input value={discountCode} onChange={e => setDiscountCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyDiscount()}
              placeholder="كود الخصم" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: "'Cairo',sans-serif", outline: 'none' }} />
            <Btn small onClick={applyDiscount}>تطبيق</Btn>
          </div>

          <div style={{ marginTop: 14, padding: '12px 0', borderTop: `2px solid ${C.grayBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>المجموع الفرعي</span><span>{subtotal.toLocaleString('en-US')} ريال</span></div>
            {discAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: C.green }}><span>خصم</span><span>-{discAmt.toLocaleString('en-US')} ريال</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>ضريبة 15%</span><span>{vat.toLocaleString('en-US')} ريال</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: C.tealDark, marginTop: 8 }}><span>الإجمالي</span><span>{total.toLocaleString('en-US')} ريال</span></div>
          </div>
        </Card>

        {/* ── Payment method ── */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.tealDark, marginBottom: 14 }}>طريقة الدفع</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {PAY_METHODS.map((m, i) => (
              <button key={i} onClick={() => { setMethodIdx(i); setCard(EMPTY_CARD); setPayError(null); }}
                style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: methodIdx === i ? `2px solid ${C.teal}` : `1.5px solid ${C.grayBorder}`, background: methodIdx === i ? `${C.teal}08` : C.white, fontSize: 11, fontWeight: methodIdx === i ? 700 : 400, fontFamily: "'Cairo',sans-serif", cursor: 'pointer', color: methodIdx === i ? C.teal : C.gray, transition: 'all 0.15s' }}>
                {m.label}
              </button>
            ))}
          </div>

          {(methodKey === 'card' || methodKey === 'mada') && (
            <CardInputForm card={card} onChange={setCard} isMada={methodKey === 'mada'} />
          )}
          {methodKey === 'apple_pay' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <button style={{ background: 'black', color: 'white', border: 'none', borderRadius: 12, padding: '14px 0', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontFamily: 'sans-serif' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Apple Pay
              </button>
              <p style={{ fontSize: 12, color: C.gray, marginTop: 10, fontFamily: "'Cairo',sans-serif" }}>سيتم فتح نافذة Apple Pay لإتمام عملية الدفع</p>
            </div>
          )}
          {methodKey === 'bank_transfer' && (
            <div style={{ background: C.blueLight, borderRadius: 10, padding: '16px 18px', fontSize: 13, color: '#1e40af', lineHeight: 1.9 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>تفاصيل التحويل البنكي</div>
              <div>البنك: بنك الرياض</div>
              <div>رقم الحساب: SA12 3456 7890 1234 5678</div>
              <div>الاسم: شركة دفة للتخطيط</div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#1e40af99' }}>أرسل إيصال التحويل لمستشارك بعد الدفع</div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '10px 14px', background: C.greenLight, borderRadius: 8, fontSize: 12, color: C.green }}>
            <IcLock width={12} height={12}/> دفع آمن ومشفر
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
        <Btn variant="secondary" onClick={onBack} disabled={paying}>→ السابق</Btn>
        <button onClick={handlePay} disabled={paying}
          style={{ padding: '14px 40px', background: paying ? C.gray : C.orange, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', fontFamily: "'Cairo',sans-serif", display: 'flex', alignItems: 'center', gap: 8, boxShadow: paying ? 'none' : `0 4px 16px ${C.orange}40`, transition: 'all 0.2s' }}>
          <IcLock width={16} height={16}/>
          {paying ? '⏳ جارٍ معالجة الدفع…' : `ادفع الآن — ${total.toLocaleString('en-US')} ريال`}
        </button>
      </div>
    </div>
  );
};

// ── Demo-fill data builder (dynamic) ─────────────────────────────────────────
const buildDemoAnswers = (apiSections) => {
  const data = {};
  apiSections.forEach(sec => {
    (sec.questions || []).forEach(q => {
      const key = `q${q.id}`;
      if (q.type === "text")     data[key] = "إجابة تجريبية على هذا السؤال لأغراض الاختبار";
      else if (q.type === "single")   data[key] = q.options?.[0] ?? "نعم";
      else if (q.type === "multiple") data[key] = q.options?.slice(0, 2) ?? [];
      else if (q.type === "yesno")    data[key] = "نعم";
      else if (q.type === "scale")    data[key] = "3";
    });
  });
  return data;
};

// ── Section validation (dynamic) ─────────────────────────────────────────────
const isSectionComplete = (sectionIndex, answers, apiSections) => {
  const sec = apiSections?.[sectionIndex];
  if (!sec) return true;
  return (sec.questions || []).every(q => {
    if (!q.required) return true;
    const val = answers[`q${q.id}`];
    if (q.type === "multiple") return Array.isArray(val) && val.length > 0;
    return val !== undefined && val !== null && String(val).trim() !== "";
  });
};

// ── Policy content info panel (shows admin-saved content to client) ───────────
const PolicyInfoPanel = ({ policyType }) => {
  const hasOverview = !!policyType?.overview;
  const hasDesc     = !!policyType?.written_description;
  const hasTip      = !!policyType?.tip;
  const hasVideo    = !!policyType?.video_url;
  const hasAny      = hasOverview || hasDesc || hasTip || hasVideo;

  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState(
    hasOverview ? 'overview' : hasDesc ? 'desc' : hasTip ? 'tip' : 'video'
  );

  if (!hasAny) return null;

  const tabs = [
    hasOverview && { key: 'overview', label: 'نبذة' },
    hasDesc     && { key: 'desc',     label: 'شرح' },
    hasTip      && { key: 'tip',      label: 'إرشادات' },
    hasVideo    && { key: 'video',    label: 'فيديو' },
  ].filter(Boolean);

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderRadius: open ? '10px 10px 0 0' : 10,
          background: `${C.teal}12`, border: `1.5px solid ${C.teal}30`,
          cursor: 'pointer', fontFamily: "'Cairo',sans-serif", fontSize: 13, fontWeight: 600,
          color: C.tealDark, transition: 'all .2s',
        }}
      >
        <span>معلومات هذه السياسة</span>
        <span style={{ fontSize: 11, color: C.teal }}>{open ? '▲ إخفاء' : '▼ عرض'}</span>
      </button>

      {open && (
        <div style={{ background: C.white, border: `1.5px solid ${C.teal}30`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px 18px' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontFamily: "'Cairo',sans-serif", fontSize: 12, fontWeight: tab === t.key ? 700 : 400,
                  background: tab === t.key ? C.teal : C.grayLight,
                  color: tab === t.key ? '#fff' : C.gray, transition: 'all .15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.9, margin: 0 }}>
              {policyType.overview}
            </p>
          )}

          {tab === 'desc' && (
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.9, whiteSpace: 'pre-line', margin: 0 }}>
              {policyType.written_description}
            </p>
          )}

          {tab === 'tip' && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10 }}>
              <span style={{ color: '#92400e', flexShrink: 0 }}><IcLightbulb width={20} height={20}/></span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>نصيحة</div>
                <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>{policyType.tip}</div>
              </div>
            </div>
          )}

          {tab === 'video' && (
            policyType.video_url ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 10, overflow: 'hidden' }}>
                <iframe
                  src={(() => { try { const u = new URL(policyType.video_url); if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) return `https://www.youtube.com/embed/${u.searchParams.get('v')}`; if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed${u.pathname}`; } catch(_){} return policyType.video_url; })()}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                  title={policyType.name}
                />
              </div>
            ) : (
              <div style={{ background: C.grayLight, borderRadius: 10, padding: 40, color: C.gray, textAlign: 'center', fontSize: 13 }}>
                الفيديو قيد الإعداد
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

// ── Questionnaire section for a single policy ─────────────────────────────────
const QuestionnaireView = ({ selection, policyType, onSave, onSubmit, onBack, loading, readOnly = false }) => {
  const [apiSections, setApiSections] = useState([]);
  const [loadingQ,    setLoadingQ]    = useState(true);
  const [section,     setSection]     = useState(0);
  const [answers,     setAnswers]     = useState(selection?.form_data || {});
  const [validErr,    setValidErr]    = useState(false);
  const [demoConfirm, setDemoConfirm] = useState(false);

  useEffect(() => {
    if (!policyType?.id) return;
    setLoadingQ(true);
    api.get(`/questionnaire/${policyType.id}`)
      .then(r => { setApiSections(r.data); setSection(0); })
      .catch(() => setApiSections([]))
      .finally(() => setLoadingQ(false));
  }, [policyType?.id]);

  const setAns = (qId, value) => { setValidErr(false); setAnswers(prev => ({ ...prev, [`q${qId}`]: value })); };
  const getAns = (qId) => answers[`q${qId}`] ?? "";

  const autoSave = useCallback(async () => {
    await onSave(selection.id, answers).catch(() => {});
  }, [answers, selection?.id, onSave]);

  const handleNextSection = async () => {
    if (!isSectionComplete(section, answers, apiSections)) { setValidErr(true); return; }
    setValidErr(false);
    await autoSave();
    setSection(s => s + 1);
  };

  // Validates before allowing tab/direct jump to any section index
  const handleSectionJump = async (target) => {
    if (readOnly) { setSection(target); return; }
    if (target < section) {
      // Going backward is always allowed — save first
      await autoSave();
      setValidErr(false);
      setSection(target);
      return;
    }
    if (target === section) return;
    // Going forward: every section from current up to target-1 must be complete
    for (let k = section; k < target; k++) {
      if (!isSectionComplete(k, answers, apiSections)) {
        setValidErr(true);
        return;
      }
    }
    await autoSave();
    setValidErr(false);
    setSection(target);
  };

  const allSectionsComplete = apiSections.every((_, i) => isSectionComplete(i, answers, apiSections));
  const currentSection = apiSections[section];

  const renderQuestion = (q) => {
    const key = `q${q.id}`;
    const label = <label style={{ fontSize: 14, fontWeight: 600, color: C.tealDark, display: "block", marginBottom: 8 }}>{q.question}{q.required && <span style={{ color: C.red }}> *</span>}</label>;
    const hint  = q.hint && <div style={{ fontSize: 12, color: C.gray, marginBottom: 6 }}>{q.hint}</div>;
    if (q.type === "text") return (
      <div key={q.id}>{label}{hint}<textarea value={getAns(q.id)} onChange={e => setAns(q.id, e.target.value)} rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: "'Cairo',sans-serif", resize: "vertical", boxSizing: "border-box" }} /></div>
    );
    if (q.type === "single") return (
      <div key={q.id}>{label}{hint}
        {(q.options || []).map((o, i) => (
          <label key={i} onClick={() => setAns(q.id, o)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", border: `1.5px solid ${getAns(q.id) === o ? C.teal : C.grayBorder}`, background: getAns(q.id) === o ? `${C.teal}08` : "transparent" }}>
            <input type="radio" checked={getAns(q.id) === o} onChange={() => setAns(q.id, o)} style={{ accentColor: C.teal }} />
            <span style={{ fontSize: 13 }}>{o}</span>
          </label>
        ))}
      </div>
    );
    if (q.type === "multiple") {
      const vals = Array.isArray(getAns(q.id)) ? getAns(q.id) : [];
      const toggle = (o) => setAns(q.id, vals.includes(o) ? vals.filter(x => x !== o) : [...vals, o]);
      return (
        <div key={q.id}>{label}{hint}
          {(q.options || []).map((o, i) => (
            <label key={i} onClick={() => toggle(o)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", border: `1.5px solid ${vals.includes(o) ? C.teal : C.grayBorder}`, background: vals.includes(o) ? `${C.teal}08` : "transparent" }}>
              <input type="checkbox" checked={vals.includes(o)} onChange={() => toggle(o)} style={{ accentColor: C.teal }} />
              <span style={{ fontSize: 13 }}>{o}</span>
            </label>
          ))}
        </div>
      );
    }
    if (q.type === "yesno") return (
      <div key={q.id}>{label}{hint}
        {["نعم", "لا"].map((o) => (
          <label key={o} onClick={() => setAns(q.id, o)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 8, marginLeft: 8, cursor: "pointer", border: `1.5px solid ${getAns(q.id) === o ? C.teal : C.grayBorder}`, background: getAns(q.id) === o ? `${C.teal}08` : "transparent" }}>
            <input type="radio" checked={getAns(q.id) === o} onChange={() => setAns(q.id, o)} style={{ accentColor: C.teal }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{o}</span>
          </label>
        ))}
      </div>
    );
    if (q.type === "scale") return (
      <div key={q.id}>{label}{hint}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setAns(q.id, String(n))} style={{ width: 44, height: 44, borderRadius: 10, border: `2px solid ${String(getAns(q.id)) === String(n) ? C.teal : C.grayBorder}`, background: String(getAns(q.id)) === String(n) ? C.teal : "#fff", color: String(getAns(q.id)) === String(n) ? "#fff" : C.gray, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>{n}</button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.gray, marginTop: 4 }}><span>منخفض جداً</span><span>مرتفع جداً</span></div>
      </div>
    );
    return null;
  };

  if (loadingQ) return (
    <div style={{ padding: 60, textAlign: "center", color: C.gray, fontSize: 13 }}>جارٍ تحميل الاستبيان…</div>
  );

  if (apiSections.length === 0) return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.teal, fontSize: 20, marginBottom: 12 }}>←</button>
      <div style={{ padding: 40, textAlign: "center", color: C.gray, fontSize: 13 }}>لم يتم إعداد أسئلة لهذه السياسة بعد. يمكن للمشرف إضافتها من لوحة التحكم.</div>
    </div>
  );

  return (
    <div className="animate-in">
      <ConfirmModal
        open={demoConfirm}
        title="تعبئة تجريبية"
        message="سيتم تعبئة جميع أقسام هذه السياسة ببيانات تجريبية. هل تريد المتابعة؟"
        onConfirm={() => { setAnswers(buildDemoAnswers(apiSections)); setValidErr(false); setDemoConfirm(false); }}
        onCancel={() => setDemoConfirm(false)}
      />
      {/* Read-only banner */}
      {readOnly && (
        <div style={{ marginBottom: 12, padding: '10px 16px', background: C.blueLight, border: `1.5px solid ${C.blue}30`, borderRadius: 10, fontSize: 13, color: C.blue, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IcEye width={16} height={16}/> وضع العرض — لا يمكن التعديل
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.teal, fontSize: 20 }}>←</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.tealDark }}>{policyType?.name}</h2>
        </div>
        {!readOnly && (
          <button onClick={() => setDemoConfirm(true)} style={{ fontSize: 12, color: C.blue, background: C.blueLight, border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <IcBeaker width={14} height={14}/> تعبئة تجريبية
          </button>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.gray }}>القسم {section + 1} من {apiSections.length}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.teal }}>{Math.round(((section + 1) / apiSections.length) * 100)}%</span>
        </div>
        <ProgressBar percent={((section + 1) / apiSections.length) * 100} />
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto", padding: "4px 0" }}>
        {apiSections.map((s, i) => {
          const done   = isSectionComplete(i, answers, apiSections);
          const active = i === section;
          // A section is locked if it's ahead and some earlier section is incomplete
          const locked = !readOnly && i > section &&
            Array.from({ length: i }, (_, k) => k).some(k => !isSectionComplete(k, answers, apiSections));
          return (
            <button key={s.id} onClick={() => handleSectionJump(i)}
              title={locked ? 'أكمل الأقسام السابقة أولاً' : ''}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 20, fontSize: 10,
                fontWeight: active ? 700 : 400, fontFamily: "'Cairo',sans-serif",
                background: active ? C.teal : done ? C.greenLight : locked ? '#f3f4f6' : C.grayLight,
                color: active ? "white" : done ? C.green : locked ? '#9ca3af' : C.gray,
                border: locked ? `1px dashed #d1d5db` : "none",
                cursor: locked ? "not-allowed" : "pointer",
                whiteSpace: "nowrap", opacity: locked ? 0.65 : 1 }}>
              {done && !active && <IcCheck width={10} height={10}/>}
              {locked && <IcLock width={9} height={9}/>}
              {s.name}
            </button>
          );
        })}
      </div>

      <PolicyInfoPanel policyType={policyType} />

      {["submitted","reviewing"].includes(selection?.status) && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: C.yellowLight, borderRadius: 8, fontSize: 12, color: "#92400E", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <IcWarning width={14} height={14}/> هذه الاستمارة مُرسَلة للمراجعة — يمكنك التعديل وإعادة الإرسال وستُحدَّث مراجعة المستشار تلقائياً
        </div>
      )}
      {selection?.status === "revision" && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: C.orangeLight, borderRadius: 8, fontSize: 12, color: C.orange, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <IcArrowPath width={14} height={14}/> طلب المستشار تعديلاً — عدّل الإجابات وأعد الإرسال
        </div>
      )}
      {!readOnly && validErr && (
        <div style={{ marginBottom: 12, padding: "12px 16px", background: C.redLight, border: `1.5px solid ${C.red}40`, borderRadius: 10, fontSize: 13, color: C.red, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IcWarning width={16} height={16}/> يرجى تعبئة جميع الحقول المطلوبة (*) في هذا القسم قبل الانتقال للقسم التالي
        </div>
      )}

      <Card>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>القسم {section + 1}: {currentSection?.name}</h3>
        <p style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>
          {readOnly ? 'استعراض إجاباتك على هذا القسم' : 'أجب على الأسئلة التالية — سيتم توليد السياسة تلقائياً بناءً على إجاباتك'}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, pointerEvents: readOnly ? 'none' : 'auto', opacity: readOnly ? 0.85 : 1 }}>
          {(currentSection?.questions || []).map(q => renderQuestion(q))}
          {(currentSection?.questions || []).length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: C.gray, fontSize: 13 }}>لا توجد أسئلة في هذا القسم</div>
          )}
        </div>

        {!readOnly && (
          <div style={{ fontSize: 11, color: C.green, marginTop: 12 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><IcSave width={11} height={11}/>سيتم الحفظ عند الانتقال</span></div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <Btn variant="secondary" disabled={section === 0} onClick={async () => { if (!readOnly) await autoSave(); setValidErr(false); setSection(s => s - 1); }}>← القسم السابق</Btn>

          {readOnly ? (
            <Btn variant="ghost" onClick={onBack}>إغلاق</Btn>
          ) : (
            <Btn variant="ghost" onClick={async () => { await autoSave(); onBack(); }}>حفظ ومتابعة لاحقاً</Btn>
          )}

          {section < apiSections.length - 1 ? (
            <Btn onClick={async () => { if (readOnly) { setSection(s => s + 1); } else { await handleNextSection(); } }}>القسم التالي →</Btn>
          ) : (
            !readOnly && (
              <Btn onClick={() => { if (!allSectionsComplete) { setValidErr(true); return; } onSubmit(selection.id, answers); }} disabled={loading}>
                {selection?.status === "revision" ? "إعادة الإرسال بعد التعديل" : ["submitted","reviewing"].includes(selection?.status) ? "إعادة الإرسال" : "إرسال هذه السياسة"}
              </Btn>
            )
          )}
        </div>
      </Card>
    </div>
  );
};


// ── Step 3: Work (Questionnaire grid) ─────────────────────────────────────────
const StepWork = ({ policyTypes, selections, onSave, onSubmit, onSubmitAll, loading, externalEditId, onExternalEditDone, onView }) => {
  const [active, setActive] = useState(externalEditId || null);

  // support opening from outside (e.g. StepReview edit button)
  useEffect(() => {
    if (externalEditId) setActive(externalEditId);
  }, [externalEditId]);

  const handleClose = () => {
    setActive(null);
    if (onExternalEditDone) onExternalEditDone();
  };

  const handleSubmitAndClose = async (id, data) => {
    const ok = await onSubmit(id, data);
    if (ok) handleClose();
  };

  if (active) {
    const sel     = selections.find(s => s.id === active);
    const polType = policyTypes.find(p => p.id === sel?.policy_type_id);
    return <QuestionnaireView selection={sel} policyType={polType} onSave={onSave} onSubmit={handleSubmitAndClose} onBack={handleClose} loading={loading} />;
  }

  const allDone = selections.every(s => ["submitted","reviewing","approved"].includes(s.status));

  return (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>تعبئة الاستمارات ومشاهدة الفيديوهات</h2>
      <p style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>اضغط على أي سياسة لبدء تعبئة الاستبيان أو تعديله في أي وقت</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {selections.map(sel => {
          const p = policyTypes.find(x => x.id === sel.policy_type_id) || sel.policy_type;
          const isSubmitted = ["submitted","reviewing"].includes(sel.status);
          const isApproved  = sel.status === "approved";
          const isViewable  = ["submitted","reviewing","approved","revision"].includes(sel.status);
          return (
            <Card key={sel.id} style={{ cursor: "pointer", textAlign: "center", border: isApproved ? `2px solid ${C.green}30` : isSubmitted ? `2px solid ${C.blue}30` : "2px solid transparent" }}
              onClick={() => isApproved ? onView && onView(sel.id) : setActive(sel.id)}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: isApproved ? C.greenLight : C.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: isApproved ? C.green : C.orange }}><IcDocument width={26} height={26}/></div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.tealDark }}>{p?.name || "سياسة"}</h3>
              <div style={{ marginTop: 8 }}>{statusBadge(sel.status)}</div>
              <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}>{p?.sections?.length || 0} أقسام</div>
              {isSubmitted && <div style={{ fontSize: 10, color: C.blue, marginTop: 4, display: "flex", alignItems: "center", gap: 3, justifyContent: "center" }}><IcPencil width={10} height={10}/> يمكن التعديل وإعادة الإرسال</div>}
              {isApproved && <div style={{ fontSize: 10, color: C.green, marginTop: 4, display: "flex", alignItems: "center", gap: 3, justifyContent: "center" }}><IcEye width={10} height={10}/> اضغط لاستعراض</div>}
              {isViewable && !isApproved && (
                <button onClick={e => { e.stopPropagation(); onView && onView(sel.id); }}
                  style={{ marginTop: 8, fontSize: 10, color: C.teal, background: `${C.teal}10`, border: `1px solid ${C.teal}20`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <IcEye width={10} height={10}/> عرض فقط
                </button>
              )}
              {sel.consultant_notes && sel.status === "revision" && (
                <div style={{ marginTop: 8, padding: "8px 10px", background: C.orangeLight, borderRadius: 8, fontSize: 11, color: C.orange, textAlign: "right" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><IcChat width={12} height={12}/>{sel.consultant_notes}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {allDone && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Btn onClick={onSubmitAll} disabled={loading}>إرسال الكل لمراجعة المستشار ←</Btn>
        </div>
      )}
    </div>
  );
};

// ── Step 4: Consultant Review ─────────────────────────────────────────────────
const StepReview = ({ policyTypes, selections, onEdit, onView, refreshData }) => {
  const [proceeding, setProceeding] = React.useState(false);

  React.useEffect(() => {
    if (!refreshData) return;
    const interval = setInterval(() => refreshData(), 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const allApproved = selections.length > 0 && selections.every(s => s.status === 'approved');

  const handleProceed = async () => {
    setProceeding(true);
    try { await refreshData?.(); } finally { setProceeding(false); }
  };

  return (
  <div className="animate-in">
    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>مراجعة المستشار — السياسات واللوائح</h2>
    <Card style={{ marginBottom: 16, padding: "16px 20px", background: C.blueLight, borderRight: `4px solid ${C.blue}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: C.blue }}><IcSearch width={24} height={24}/></span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>جاري مراجعة السياسات</div>
            <div style={{ fontSize: 12, color: C.gray }}>يتم تحديث الحالة تلقائياً كل 30 ثانية</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.gray, background: C.white, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.grayBorder}`, display: "flex", alignItems: "center", gap: 4 }}>
          <IcPencil width={11} height={11}/> يمكنك تعديل أي سياسة غير معتمدة
        </div>
      </div>
    </Card>

    <Card style={{ padding: 0, overflow: "hidden" }}>
      {selections.map((sel, i) => {
        const p = policyTypes.find(x => x.id === sel.policy_type_id) || sel.policy_type;
        const canEdit = sel.status !== "approved";
        return (
          <div key={sel.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: i < selections.length - 1 ? `1px solid ${C.grayLight}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: C.teal }}><IcDocument width={20} height={20}/></span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{p?.name || "سياسة"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {statusBadge(sel.status)}
              <button onClick={() => onView && onView(sel.id)}
                style={{ fontSize: 11, color: C.blue, background: C.blueLight, border: `1px solid ${C.blue}30`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><IcEye width={11} height={11}/>عرض</span>
              </button>
              {canEdit && (
                <button onClick={() => onEdit(sel.id)} style={{ fontSize: 11, color: C.teal, background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><IcPencil width={11} height={11}/>تعديل</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </Card>

    {allApproved && (
      <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 12, padding: '18px 22px', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🎉</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>تهانينا! تم اعتماد جميع السياسات</div>
            <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>انتقل للخطوة التالية لمراجعة الاعتماد النهائي</div>
          </div>
        </div>
        <button
          onClick={handleProceed}
          disabled={proceeding}
          style={{ padding: '11px 26px', background: proceeding ? '#9ca3af' : C.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: proceeding ? 'not-allowed' : 'pointer', fontFamily: "'Cairo', sans-serif", whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(26,107,124,0.3)' }}
        >
          {proceeding ? '...' : 'الاعتماد النهائي ←'}
        </button>
      </div>
    )}
  </div>
  );
};

// ── Step 5: Approval ──────────────────────────────────────────────────────────
const StepApproval = ({ workflow, selections, policyTypes, onNext, onView }) => (
  <div className="animate-in" style={{ textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
    <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.greenLight, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: C.tealDark, marginBottom: 8 }}>تم اعتماد السياسات!</h2>
    <p style={{ fontSize: 14, color: C.gray, marginBottom: 8 }}>تهانينا! تم اعتماد جميع السياسات المحددة من المستشار.</p>

    {selections?.length > 0 && onView && (
      <div style={{ marginBottom: 20, textAlign: 'right', maxWidth: 400, margin: '0 auto 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 8, textAlign: 'center' }}>استعراض السياسات المعتمدة</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {selections.map(sel => {
            const p = policyTypes?.find(x => x.id === sel.policy_type_id) || sel.policy_type;
            return (
              <button key={sel.id} onClick={() => onView(sel.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.green}30`, background: C.greenLight, cursor: 'pointer', fontFamily: "'Cairo',sans-serif" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.tealDark }}>{p?.name || 'سياسة'}</span>
                <span style={{ fontSize: 11, color: C.green, display: 'inline-flex', alignItems: 'center', gap: 3 }}><IcEye width={12} height={12}/>عرض</span>
              </button>
            );
          })}
        </div>
      </div>
    )}

    {workflow?.consultant && (
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: "12px 24px", textAlign: "center" }}>
          <span style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <div style={{ fontSize: 11, color: C.gray }}>المستشار المشرف</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.tealDark }}>{workflow.consultant.name}</div>
        </Card>
      </div>
    )}
    <Btn onClick={onNext}>التالي: تحميل السياسات ←</Btn>
  </div>
);

// ── Step 6: Download ──────────────────────────────────────────────────────────
const StepDownload = ({ policyTypes, selections, workflow, onNext, onDownload, loadingId, onView }) => (
  <div className="animate-in">
    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.tealDark, marginBottom: 20, textAlign: "center" }}>تحميل السياسات</h2>
    {selections.map(sel => {
      const p = policyTypes.find(x => x.id === sel.policy_type_id) || sel.policy_type;
      return (
        <Card key={sel.id} style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.tealCard, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><IcDocument width={20} height={20}/></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p?.name || "سياسة"}</div>
              <div style={{ fontSize: 11, color: C.gray }}>تصميم تلقائي — PDF</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onView && (
              <button onClick={() => onView(sel.id)}
                style={{ fontSize: 11, color: C.teal, background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <IcEye width={11} height={11}/>عرض
              </button>
            )}
            <Btn small onClick={() => onDownload(sel.id)} disabled={loadingId === sel.id}>
              {loadingId === sel.id ? "جارٍ التحميل..." : "تحميل PDF"}
            </Btn>
          </div>
        </Card>
      );
    })}
    {workflow?.consultant_id && workflow?.id && (
      <div style={{ marginTop: 20 }}>
        <ConsultantRating
          consultantId={workflow.consultant_id}
          consultantName={workflow.consultant?.name}
          workflowType="policy"
          workflowId={workflow.id}
        />
      </div>
    )}
    <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
      <Btn onClick={onNext}>التالي ←</Btn>
    </div>
  </div>
);

// ── Step 7: Design Decision ───────────────────────────────────────────────────
const StepDesign = ({
  onComplete, onApprove, onRevision, loading,
  navigate, workflow, selections, designPrice, designTax, designTotal, designFileUrl,
}) => {
  const [method,        setMethod]        = useState("card");
  const [card,          setCard]          = useState(EMPTY_CARD);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [showRevision,  setShowRevision]  = useState(false);
  const [paying,        setPaying]        = useState(false);
  const [cardErr,       setCardErr]       = useState("");

  const designStatus   = workflow?.design_status;
  const isCompleted    = workflow?.status === 'completed';
  const wantedDesign   = workflow?.want_design;
  const consultantName = workflow?.consultant?.name ?? '—';
  const selCount       = selections?.length ?? 0;
  const price          = designPrice  ?? 1500;
  const tax            = designTax    ?? Math.round(price * 0.15);
  const total          = designTotal  ?? price + tax;
  const paidAt         = workflow?.design_paid_at
    ? new Date(workflow.design_paid_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';
  const paymentLabels = { card: "كارد", mada: "مدى", apple_pay: "Apple Pay", bank_transfer: "تحويل بنكي" };

  // ── ١. تم الدفع، في انتظار رفع التصميم من المستشار ──
  if (wantedDesign && (designStatus === 'pending' || designStatus === 'revision_requested')) {
    return (
      <div className="animate-in" style={{ textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", color: C.teal }}><IcClock width={52} height={52}/></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.tealDark, marginBottom: 8 }}>
          {designStatus === 'revision_requested' ? 'تم طلب التعديل — بانتظار التصميم المعدّل' : 'تم الدفع — بانتظار رفع التصميم'}
        </h2>
        <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.8, marginBottom: 20 }}>
          {designStatus === 'revision_requested'
            ? 'تم إرسال ملاحظاتك لفريق التصميم. سيتم رفع التصميم المعدّل في أقرب وقت.'
            : 'تم استلام دفعتك بنجاح. سيقوم فريق التصميم بمنصة دفة برفع التصميم الاحترافي خلال 3-5 أيام عمل.'}
        </p>

        {workflow?.design_revision_notes && (
          <Card style={{ marginBottom: 16, textAlign: "right", border: `1px solid ${C.yellow}50`, background: C.yellowLight }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.yellow, marginBottom: 4 }}>ملاحظات التعديل المُرسلة:</div>
            <div style={{ fontSize: 12, color: C.tealDark }}>{workflow.design_revision_notes}</div>
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            ["الجهة المنفذة",   'فريق التصميم — دفة', <IcUser width={20} height={20}/>],
            ["تاريخ الدفع",     paidAt,               <IcCalendar width={20} height={20}/>],
            ["المبلغ المدفوع",  `${(workflow?.design_fee ?? price).toLocaleString('en-US')} ريال`, <IcCreditCard width={20} height={20}/>],
            ["عدد السياسات",    `${selCount} سياسة`,  <IcScroll width={20} height={20}/>],
          ].map(([lbl, val, icon]) => (
            <Card key={lbl} style={{ padding: "12px 14px", textAlign: "center" }}>
              <div style={{ marginBottom: 3, display: "flex", justifyContent: "center", color: C.teal }}>{icon}</div>
              <div style={{ fontSize: 10, color: C.gray, marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark }}>{val}</div>
            </Card>
          ))}
        </div>

        <div style={{ padding: 12, background: C.blueLight, borderRadius: 10, fontSize: 12, color: C.blue }}>
          سيتم إشعارك عند رفع التصميم لمراجعته واعتماده
        </div>
      </div>
    );
  }

  // ── ٢. التصميم جاهز — مراجعة واعتماد ──
  if (wantedDesign && designStatus === 'uploaded') {
    return (
      <div className="animate-in" style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", color: C.orange }}><IcPalette width={48} height={48}/></div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.tealDark, marginBottom: 6 }}>التصميم الاحترافي جاهز للمراجعة</h2>
          <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.8 }}>
            قام <strong>فريق التصميم</strong> برفع التصميم الاحترافي لمنظمتك. يرجى المراجعة ثم الاعتماد أو طلب التعديل.
          </p>
        </div>

        {/* معاينة الملف */}
        {designFileUrl && (
          <Card style={{ marginBottom: 16, textAlign: "center", border: `2px dashed ${C.teal}40` }}>
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", color: C.teal }}><IcDocument width={40} height={40}/></div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.tealDark, marginBottom: 12 }}>ملف التصميم</div>
            <a href={designFileUrl} target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 8, background: C.teal, color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              <IcEye width={14} height={14}/> معاينة / تحميل التصميم
            </a>
          </Card>
        )}

        {!showRevision ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Btn variant="success" full onClick={onApprove} disabled={loading}>
              {loading ? "جارٍ المعالجة..." : "اعتماد التصميم النهائي"}
            </Btn>
            <Btn variant="secondary" full onClick={() => setShowRevision(true)} disabled={loading}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><IcPencil width={12} height={12}/>طلب تعديل</span>
            </Btn>
          </div>
        ) : (
          <Card style={{ border: `1px solid ${C.yellow}60` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 8 }}>اذكر ملاحظات التعديل المطلوبة:</div>
            <textarea value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)}
              placeholder="مثال: يرجى تغيير لون الشعار وتعديل الخط..."
              style={{ width: "100%", minHeight: 90, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.grayBorder}`, fontSize: 12, fontFamily: "'Cairo',sans-serif", resize: "vertical", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Btn full onClick={() => { if (revisionNotes.trim()) onRevision(revisionNotes); }} disabled={loading || !revisionNotes.trim()}>
                {loading ? "جارٍ الإرسال..." : "إرسال طلب التعديل"}
              </Btn>
              <Btn variant="ghost" onClick={() => { setShowRevision(false); setRevisionNotes(""); }}>إلغاء</Btn>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── عنصر مشترك: رحلتك الإدارية المكتملة ──
  const journeyEl = (
    <div style={{ background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', padding: 20, marginBottom: 20, textAlign: 'right' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <IcSparkles width={15} height={15} /> اكتملت رحلتك الإدارية الكاملة!
      </div>
      {[
        { icon: '📊', label: 'التخطيط الاستراتيجي', note: 'وضع رؤية وأهداف المنظمة' },
        { icon: '📋', label: 'التخطيط التشغيلي',   note: 'تحويل الأهداف إلى خطط عمل' },
        { icon: '📜', label: 'السياسات واللوائح',  note: 'بناء الإطار التنظيمي والحوكمة' },
      ].map((s, i, arr) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #bbf7d050' : 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>{s.label}</div>
            <div style={{ fontSize: 11, color: C.gray }}>{s.note}</div>
          </div>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
        </div>
      ))}
    </div>
  );

  // ── ٣. تم الاعتماد النهائي (completed + approved) ──
  if (isCompleted && wantedDesign && designStatus === 'approved') {
    return (
      <div className="animate-in" style={{ textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.greenLight, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 38 }}>🎉</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.tealDark, marginBottom: 8 }}>تم اعتماد التصميم النهائي</h2>
        <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.8, marginBottom: 20 }}>
          اكتمل نظام السياسات واللوائح مع التصميم الاحترافي المعتمد بهوية منظمتك.
        </p>
        {designFileUrl && (
          <a href={designFileUrl} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 24px", borderRadius: 10, background: C.teal, color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none", marginBottom: 20 }}>
            تحميل التصميم المعتمد
          </a>
        )}
        {journeyEl}
        {navigate && <Btn full onClick={() => navigate("client-dash")}>← الذهاب للوحة التحكم</Btn>}
      </div>
    );
  }

  // ── ٤. تم الإكمال بدون تصميم ──
  if (isCompleted && !wantedDesign) {
    return (
      <div className="animate-in" style={{ textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.greenLight, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 38 }}>🎉</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.tealDark, marginBottom: 8 }}>اكتملت السياسات واللوائح</h2>
        <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.8, marginBottom: 24 }}>
          تم بناء {selCount} سياسة بالتصميم التلقائي بنجاح.
        </p>
        {journeyEl}
        {navigate && <Btn full onClick={() => navigate("client-dash")}>← الذهاب للوحة التحكم</Btn>}
      </div>
    );
  }

  // ── ٥. شاشة الاختيار → المتطلبات → المراجعة → الدفع ──
  // subStep: 'choice' | 'brief-identity' | 'brief-design' | 'review' | 'payment'
  const [subStep,    setSubStep]    = useState('choice');
  const [briefPage,  setBriefPage]  = useState(1); // 1 or 2 within brief
  const [brief,      setBrief]      = useState({
    // هوية المنظمة
    org_name:    '', org_name_en: '', org_type:   '',
    org_slogan:  '', org_phone:   '', org_email:  '',
    org_website: '', org_city:    '',
    // التصميم
    design_scope: 'unified',           // 'unified' | 'color_coded' | 'per_policy'
    primary_color: '#1A6B7C', secondary_color: '#E8713A',
    design_style:  'corporate',        // 'modern' | 'corporate' | 'classic'
    language:      'arabic',           // 'arabic' | 'english' | 'bilingual'
    include_cover: true, include_toc: true,
    notes: '',
  });
  const [logoFile,   setLogoFile]   = useState(null);
  const [logoPreview,setLogoPreview]= useState(null);

  const orgTypes  = ['شركة','مؤسسة','جمعية','هيئة حكومية','مؤسسة تعليمية','أخرى'];
  const styleOpts = [
    { key: 'modern',    label: 'عصري وبسيط',     icon: '✨', desc: 'مساحات واسعة، ألوان فاتحة' },
    { key: 'corporate', label: 'مؤسسي واحترافي',  icon: '🏢', desc: 'رسمي ومهني، مناسب للجهات الحكومية' },
    { key: 'classic',   label: 'كلاسيكي وأنيق',   icon: '📜', desc: 'تقليدي بتفاصيل دقيقة' },
  ];
  const langOpts  = [
    { key: 'arabic',    label: 'عربي فقط',    flag: '🇸🇦' },
    { key: 'english',   label: 'إنجليزي فقط', flag: '🇺🇸' },
    { key: 'bilingual', label: 'ثنائي اللغة', flag: '🌐' },
  ];
  const scopeOpts = [
    { key: 'unified',    icon: '📋', label: 'تصميم موحد للجميع',
      desc: `نفس القالب الاحترافي لجميع السياسات بهوية بصرية واحدة — موصى به (${selCount} سياسة بسعر واحد)` },
    { key: 'color_coded', icon: '🎨', label: 'قالب موحد بلون مختلف لكل سياسة',
      desc: 'نفس التصميم لكن كل سياسة بلون تمييزي خاص بها — سهل التمييز بين الوثائق' },
    { key: 'per_policy',  icon: '🖌️', label: 'تصميم مستقل لكل سياسة',
      desc: 'كل سياسة بتصميم فريد ومختلف كلياً — الأكثر تميزاً ومناسب للجهات الكبيرة' },
  ];

  const handleLogoChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setLogoFile(f);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(f);
  };
  const upd = (k, v) => setBrief(b => ({ ...b, [k]: v }));

  const isPage1Valid = brief.org_name.trim().length >= 2 && brief.org_type;
  const isPage2Valid = brief.design_scope && brief.design_style && brief.language;

  const handlePay = async () => {
    setCardErr("");
    setPaying(true);
    try {
      await gatewayCharge({ method, card });
      await onComplete(true, method, brief, logoFile);
    } catch (e) {
      setCardErr(e.response?.data?.message || e.message || 'حدث خطأ في الدفع، حاول مرة أخرى.');
    } finally {
      setPaying(false);
    }
  };

  // ── شاشة الاختيار (مع عرض قيمة واضح) ──
  if (subStep === 'choice') return (
    <div className="animate-in" style={{ maxWidth: 660, margin: "0 auto" }}>
      {/* العنوان */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, background: C.orange, transform: 'rotate(45deg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <IcPalette width={26} height={26} style={{ transform: 'rotate(-45deg)', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.tealDark, marginBottom: 6 }}>هل تود تصميم احترافي لسياساتك؟</h2>
        <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.8 }}>
          تم اعتماد <strong>{selCount}</strong> {selCount === 1 ? 'سياسة' : 'سياسات'} بنجاح. يمكنك الحصول على وثائق رسمية مصممة بهوية منظمتك.
        </p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
          {selections?.map(s => <span key={s.id} style={{ padding: '3px 12px', borderRadius: 20, background: `${C.teal}15`, color: C.teal, fontSize: 11, fontWeight: 600 }}>{s.policy_type?.name}</span>)}
        </div>
      </div>

      {/* ما الذي يشمله التصميم */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 12 }}>📦 ماذا يشمل التصميم الاحترافي؟</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['🖼️ صفحة غلاف', 'غلاف احترافي لكل سياسة بشعار منظمتك'],
            ['📑 فهرس المحتوى', 'جدول محتويات مرتب وقابل للتنقل'],
            ['🎨 هوية بصرية', 'ألوانك وخطوطك المفضلة في كل الصفحات'],
            ['📄 تنسيق احترافي', 'ترقيم صفحات، رأس وتذييل مع معلومات منظمتك'],
            ['🔖 تصميم الأقسام', 'فواصل وعناوين أقسام بتصميم متناسق'],
            ['📤 ملف PDF جاهز', 'وثيقة نهائية جاهزة للطباعة والنشر الرسمي'],
          ].map(([icon_label, desc]) => (
            <div key={icon_label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', background: '#f8fafb', borderRadius: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, minWidth: 100 }}>{icon_label}</span>
              <span style={{ fontSize: 11, color: C.gray, lineHeight: 1.5 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* الخيارات */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* لا شكراً */}
        <Card style={{ border: `2px solid ${C.grayBorder}`, textAlign: 'center' }}>
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center', color: '#9ca3af', fontSize: 36 }}>📃</div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>التصميم التلقائي</h3>
          <p style={{ fontSize: 11, color: C.gray, lineHeight: 1.7, marginBottom: 12 }}>
            وثيقة نصية بسيطة جاهزة للتحميل<br />
            <span style={{ color: C.green, fontWeight: 600 }}>بدون رسوم إضافية</span>
          </p>
          <div style={{ padding: '8px 10px', background: '#f8fafb', borderRadius: 8, fontSize: 10, color: C.gray, marginBottom: 14, textAlign: 'right', lineHeight: 1.6 }}>
            ✓ تنزيل PDF فوري<br/>
            ✗ بدون شعار أو هوية بصرية<br/>
            ✗ تصميم موحد لجميع المنظمات
          </div>
          <Btn variant="secondary" full onClick={() => onComplete(false, null)} disabled={loading}>متابعة بدون تصميم</Btn>
        </Card>

        {/* التصميم الاحترافي */}
        <Card style={{ border: `2px solid ${C.orange}`, background: `${C.orange}05` }}>
          <div style={{ background: C.orange, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>موصى به</div>
          <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center', color: C.orange, fontSize: 32 }}>🎨</div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.tealDark, marginBottom: 6, textAlign: 'center' }}>تصميم بهوية منظمتك</h3>
          <p style={{ fontSize: 11, color: C.gray, lineHeight: 1.7, marginBottom: 10, textAlign: 'center' }}>
            وثيقة احترافية كاملة بشعارك وألوانك<br />
            لجميع السياسات الـ{selCount} المعتمدة
          </p>
          <div style={{ padding: '8px 10px', background: `${C.orange}10`, borderRadius: 8, fontSize: 10, color: '#92400e', marginBottom: 10, textAlign: 'right', lineHeight: 1.6 }}>
            ✓ شعار منظمتك في كل صفحة<br/>
            ✓ ألوانك وهويتك البصرية الكاملة<br/>
            ✓ خيار تصميم مستقل لكل سياسة
          </div>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.gray }}>لجميع السياسات الـ{selCount}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.orange }}>{total.toLocaleString('en-US')} ريال</div>
            <div style={{ fontSize: 10, color: C.gray }}>شامل ضريبة القيمة المضافة 15%</div>
          </div>
          <Btn full onClick={() => { setSubStep('brief'); setBriefPage(1); }}>
            ابدأ وأدخل متطلباتك ←
          </Btn>
        </Card>
      </div>

      <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, fontSize: 11, color: '#065f46', textAlign: 'center' }}>
        🔒 الدفع آمن ومشفر — سيتم بدء التصميم خلال 3-5 أيام عمل بعد إتمام الدفع
      </div>
    </div>
  );

  // ── شاشة المتطلبات (صفحتان) ──
  if (subStep === 'brief') {
    const prog = briefPage === 1 ? 50 : 100;
    return (
    <div className="animate-in" style={{ maxWidth: 580, margin: '0 auto' }}>
      {/* Progress bar */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.tealDark }}>
            {briefPage === 1 ? '🏢 هوية المنظمة' : '🎨 تفضيلات التصميم'}
          </span>
          <span style={{ fontSize: 11, color: C.gray }}>{briefPage}/2</span>
        </div>
        <div style={{ height: 6, background: C.grayBorder, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${prog}%`, height: '100%', background: C.teal, borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {briefPage === 1 && (<>
          {/* الشعار */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 4 }}>شعار المنظمة</div>
            <div style={{ fontSize: 11, color: C.gray, marginBottom: 8 }}>سيظهر في رأس وغلاف جميع الوثائق — PNG أو SVG بخلفية شفافة مثالي</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', border: `2px dashed ${logoPreview ? C.teal : C.grayBorder}`, borderRadius: 12, cursor: 'pointer', background: logoPreview ? `${C.teal}05` : '#fafafa', transition: 'all 0.2s' }}>
              {logoPreview
                ? <img src={logoPreview} alt="شعار" style={{ height: 60, maxWidth: 120, objectFit: 'contain', borderRadius: 6 }} />
                : <div style={{ width: 60, height: 60, borderRadius: 10, background: C.grayLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🖼️</div>
              }
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: logoPreview ? C.teal : C.tealDark }}>
                  {logoPreview ? logoFile?.name : 'اضغط لرفع الشعار'}
                </div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>PNG • JPG • SVG • حد أقصى 5MB</div>
                {logoFile && <button onClick={e => { e.preventDefault(); setLogoFile(null); setLogoPreview(null); }} style={{ fontSize: 10, color: C.red, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>✕ إزالة</button>}
              </div>
              <input type="file" accept=".png,.jpg,.jpeg,.svg,.webp" style={{ display: 'none' }} onChange={handleLogoChange} />
            </label>
          </div>

          {/* الاسم الرسمي */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>الاسم الرسمي بالعربية <span style={{ color: C.red }}>*</span></div>
              <input value={brief.org_name} onChange={e => upd('org_name', e.target.value)}
                placeholder="جمعية البر الخيرية بالرياض"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${brief.org_name.trim().length >= 2 ? C.teal : C.grayBorder}`, fontSize: 12, fontFamily: "'Cairo',sans-serif", outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>الاسم بالإنجليزية <span style={{ fontSize: 10, fontWeight: 400, color: C.gray }}>(اختياري)</span></div>
              <input value={brief.org_name_en} onChange={e => upd('org_name_en', e.target.value)}
                placeholder="Al-Birr Charity Society"
                dir="ltr"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 12, fontFamily: "'Cairo',sans-serif", outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* نوع المنظمة */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 8 }}>نوع المنظمة <span style={{ color: C.red }}>*</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {orgTypes.map(t => (
                <button key={t} onClick={() => upd('org_type', t)}
                  style={{ padding: '5px 14px', borderRadius: 20, fontSize: 11, fontFamily: "'Cairo',sans-serif", cursor: 'pointer', fontWeight: brief.org_type === t ? 700 : 400, background: brief.org_type === t ? C.teal : '#f8fafb', color: brief.org_type === t ? '#fff' : C.gray, border: `1.5px solid ${brief.org_type === t ? C.teal : C.grayBorder}` }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* الشعار النصي والتواصل */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>شعار/وصف المنظمة <span style={{ fontSize: 10, fontWeight: 400, color: C.gray }}>(سيظهر في التذييل)</span></div>
            <input value={brief.org_slogan} onChange={e => upd('org_slogan', e.target.value)}
              placeholder="معاً نبني مجتمعاً أفضل"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 12, fontFamily: "'Cairo',sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['org_phone','📞 رقم الهاتف','0112345678'],
                ['org_email','📧 البريد الإلكتروني','info@example.sa'],
                ['org_website','🌐 الموقع الإلكتروني','www.example.sa'],
                ['org_city','📍 المدينة','الرياض'],
              ].map(([key, label, ph]) => (
                <div key={key}>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>{label}</div>
                  <input value={brief[key]} onChange={e => upd(key, e.target.value)}
                    placeholder={ph} dir={key === 'org_website' || key === 'org_email' ? 'ltr' : 'rtl'}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.grayBorder}`, fontSize: 11, fontFamily: "'Cairo',sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
          </div>
        </>)}

        {briefPage === 2 && (<>
          {/* كيفية التعامل مع السياسات المتعددة */}
          {selCount > 1 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 4 }}>
                كيف تريد تصميم سياساتك الـ{selCount}؟ <span style={{ color: C.red }}>*</span>
              </div>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 10 }}>
                لديك {selCount} سياسات معتمدة — اختر طريقة التصميم الأنسب
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scopeOpts.map(o => (
                  <button key={o.key} onClick={() => upd('design_scope', o.key)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'right', fontFamily: "'Cairo',sans-serif", background: brief.design_scope === o.key ? `${C.teal}10` : '#f8fafb', border: `2px solid ${brief.design_scope === o.key ? C.teal : C.grayBorder}`, transition: 'all 0.2s' }}>
                    <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{o.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: brief.design_scope === o.key ? 700 : 600, color: brief.design_scope === o.key ? C.teal : C.tealDark }}>{o.label}</div>
                      <div style={{ fontSize: 11, color: C.gray, marginTop: 3, lineHeight: 1.5 }}>{o.desc}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${brief.design_scope === o.key ? C.teal : C.grayBorder}`, background: brief.design_scope === o.key ? C.teal : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      {brief.design_scope === o.key && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* الألوان */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 4 }}>ألوان الهوية البصرية</div>
            <div style={{ fontSize: 11, color: C.gray, marginBottom: 10 }}>ستُطبَّق على الغلاف والرأس والتذييل والعناوين</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                ['primary_color','اللون الرئيسي'],
                ['secondary_color','اللون الثانوي'],
              ].map(([k, label]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={brief[k]} onChange={e => upd(k, e.target.value)}
                    style={{ width: 42, height: 42, borderRadius: 8, border: `2px solid ${C.grayBorder}`, cursor: 'pointer', padding: 2 }} />
                  <div>
                    <div style={{ fontSize: 11, color: C.gray }}>{label}</div>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.tealDark, fontWeight: 600 }}>{brief[k]}</div>
                  </div>
                </div>
              ))}
              {/* معاينة */}
              <div style={{ flex: 1, minWidth: 80, height: 42, borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
                <div style={{ flex: 1, background: brief.primary_color }} />
                <div style={{ flex: 1, background: brief.secondary_color }} />
              </div>
            </div>
          </div>

          {/* نمط التصميم */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 10 }}>نمط التصميم</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {styleOpts.map(s => (
                <button key={s.key} onClick={() => upd('design_style', s.key)}
                  style={{ flex: 1, padding: '10px 6px', borderRadius: 10, fontSize: 11, fontFamily: "'Cairo',sans-serif", cursor: 'pointer', textAlign: 'center', background: brief.design_style === s.key ? `${C.teal}12` : '#f8fafb', color: brief.design_style === s.key ? C.teal : C.gray, border: `1.5px solid ${brief.design_style === s.key ? C.teal : C.grayBorder}`, fontWeight: brief.design_style === s.key ? 700 : 400 }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                  <div>{s.label}</div>
                  <div style={{ fontSize: 10, color: C.gray, marginTop: 3 }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* اللغة */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 8 }}>لغة الوثائق</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {langOpts.map(l => (
                <button key={l.key} onClick={() => upd('language', l.key)}
                  style={{ flex: 1, padding: '9px 6px', borderRadius: 10, fontSize: 12, fontFamily: "'Cairo',sans-serif", cursor: 'pointer', textAlign: 'center', background: brief.language === l.key ? C.teal : '#f8fafb', color: brief.language === l.key ? '#fff' : C.gray, border: `1.5px solid ${brief.language === l.key ? C.teal : C.grayBorder}`, fontWeight: brief.language === l.key ? 700 : 400 }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{l.flag}</div>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* خيارات إضافية */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 8 }}>عناصر الوثيقة</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                ['include_cover', '🖼️ صفحة غلاف لكل سياسة'],
                ['include_toc',   '📑 جدول المحتويات'],
              ].map(([k, label]) => (
                <button key={k} onClick={() => upd(k, !brief[k])}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, fontSize: 12, fontFamily: "'Cairo',sans-serif", cursor: 'pointer', background: brief[k] ? `${C.teal}12` : '#f8fafb', color: brief[k] ? C.teal : C.gray, border: `1.5px solid ${brief[k] ? C.teal : C.grayBorder}`, fontWeight: brief[k] ? 700 : 400 }}>
                  <span style={{ fontSize: 16 }}>{brief[k] ? '✅' : '⬜'}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>
              ملاحظات وتعليمات إضافية للمصمم <span style={{ fontWeight: 400, color: C.gray }}>(اختياري)</span>
            </div>
            <textarea value={brief.notes} onChange={e => upd('notes', e.target.value)} rows={3}
              placeholder="مثال: أريد خطاً عربياً رسمياً، لا أريد خلفيات داكنة، أرجو أن يكون التصميم محافظاً..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 12, fontFamily: "'Cairo',sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.7 }} />
          </div>
        </>)}
      </div>

      {/* التنقل بين الصفحتين */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button
          onClick={() => briefPage === 1 ? setSubStep('choice') : setBriefPage(1)}
          style={{ padding: '10px 20px', background: 'none', border: `1.5px solid ${C.grayBorder}`, borderRadius: 10, fontSize: 13, color: C.gray, cursor: 'pointer', fontFamily: "'Cairo',sans-serif" }}>
          ← رجوع
        </button>
        <Btn full
          disabled={briefPage === 1 ? !isPage1Valid : !isPage2Valid}
          onClick={() => briefPage === 1 ? setBriefPage(2) : setSubStep('payment')}>
          {briefPage === 1 ? 'التالي: تفضيلات التصميم ←' : 'مراجعة وإتمام الدفع ←'}
        </Btn>
      </div>
      {briefPage === 1 && !isPage1Valid && (
        <div style={{ marginTop: 8, fontSize: 11, color: C.red, textAlign: 'center' }}>يرجى تعبئة الاسم الرسمي ونوع المنظمة</div>
      )}
    </div>
  );}

  // ── شاشة الدفع ──
  return (
    <div className="animate-in" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* ملخص المتطلبات */}
      <div style={{ background: `${C.teal}08`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, border: `1px solid ${C.teal}20`, direction: 'rtl' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 8 }}>ملخص المتطلبات المُدخلة:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {logoPreview && <img src={logoPreview} alt="شعار" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, border: `1px solid ${C.grayBorder}` }} />}
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: `${C.teal}15`, color: C.teal }}>{brief.org_name}</span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: `${C.teal}15`, color: C.teal }}>{brief.org_type}</span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: `${C.teal}15`, color: C.teal }}>{styleOpts.find(s => s.key === brief.design_style)?.label}</span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: `${C.teal}15`, color: C.teal }}>{langOpts.find(l => l.key === brief.language)?.label}</span>
          <span title={brief.primary_color} style={{ width: 22, height: 22, borderRadius: '50%', background: brief.primary_color, border: `1px solid ${C.grayBorder}` }} />
          <span title={brief.secondary_color} style={{ width: 22, height: 22, borderRadius: '50%', background: brief.secondary_color, border: `1px solid ${C.grayBorder}` }} />
        </div>
        <button onClick={() => setSubStep('brief')} style={{ background: 'none', border: 'none', color: C.teal, cursor: 'pointer', fontSize: 11, fontFamily: "'Cairo',sans-serif", marginTop: 6, padding: 0, fontWeight: 600 }}>✎ تعديل المتطلبات</button>
      </div>

      {/* بطاقة الدفع */}
      <Card style={{ border: `2px solid ${C.orange}`, background: `${C.orange}05` }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "center", color: C.orange, marginBottom: 6 }}><IcPalette width={32} height={32}/></div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.tealDark }}>إتمام الدفع</div>
        </div>
        <div style={{ background: C.white, borderRadius: 8, padding: "8px 12px", marginBottom: 12, border: `1px solid ${C.grayBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.gray, marginBottom: 3 }}>
            <span>قبل الضريبة</span><span>{price.toLocaleString('en-US')} ريال</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.gray, marginBottom: 6 }}>
            <span>ضريبة 15%</span><span>{tax.toLocaleString('en-US')} ريال</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: C.orange, borderTop: `1px solid ${C.grayBorder}`, paddingTop: 6 }}>
            <span>الإجمالي</span><span>{total.toLocaleString('en-US')} ريال</span>
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>طريقة الدفع:</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {["card","mada","apple_pay"].map(m => (
            <button key={m} onClick={() => { setMethod(m); setCardErr(""); }} style={{ flex: 1, padding: "6px 4px", borderRadius: 8, fontSize: 10, fontFamily: "'Cairo',sans-serif", border: `1.5px solid ${method === m ? C.teal : C.grayBorder}`, background: method === m ? `${C.teal}12` : C.white, color: method === m ? C.teal : C.gray, fontWeight: method === m ? 700 : 400, cursor: "pointer" }}>
              {paymentLabels[m]}
            </button>
          ))}
        </div>
        {(method === "card" || method === "mada") && (
          <div style={{ marginBottom: 12 }}>
            <CardInputForm card={card} onChange={setCard} isMada={method === "mada"} />
            <div style={{ marginTop: 6, padding: '6px 10px', background: '#f0fdf4', borderRadius: 7, fontSize: 10, color: '#15803d' }}>
              بطاقة الاختبار: <strong>4111 1111 1111 1111</strong> | تاريخ: <strong>12/26</strong> | CVV: <strong>123</strong>
            </div>
          </div>
        )}
        {method === "apple_pay" && (
          <div style={{ padding: "12px 14px", background: C.grayLight, borderRadius: 8, textAlign: "center", fontSize: 12, color: C.gray, marginBottom: 12 }}>
            ستُفتح نافذة Apple Pay عند الضغط على الدفع
          </div>
        )}
        {cardErr && (
          <div style={{ padding: "6px 10px", background: "#FEE2E2", borderRadius: 6, fontSize: 11, color: C.red, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><IcWarning width={11} height={11}/> {cardErr}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: C.greenLight, borderRadius: 7, fontSize: 11, color: C.green, marginBottom: 10 }}>
          <IcLock width={11} height={11}/> دفع آمن ومشفر
        </div>
        <Btn full onClick={handlePay} disabled={loading || paying}>
          {(loading || paying) ? "⏳ جارٍ معالجة الدفع…" : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IcLock width={14} height={14}/>ادفع الآن — {total.toLocaleString('en-US')} ريال</span>}
        </Btn>
        <button onClick={() => setSubStep('brief')} style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: C.gray, cursor: 'pointer', fontSize: 11, fontFamily: "'Cairo',sans-serif", padding: '6px 0' }}>← العودة لتعديل المتطلبات</button>
      </Card>
    </div>
  );

  return (
    <div className="animate-in" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, background: C.orange, transform: "rotate(45deg)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ transform: "rotate(-45deg)", color: "white", fontWeight: 700, fontSize: 16 }}>؟</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.tealDark }}>هل تود تصميم احترافي؟</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, alignItems: "start" }}>
      </div>

      <div style={{ padding: 12, background: C.greenLight, borderRadius: 12, border: `1px solid ${C.green}30`, textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 3, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}><IcSparkles width={14} height={14}/> مبروك! اكتمل نظام بناء السياسات واللوائح</div>
        <div style={{ fontSize: 11, color: C.gray }}>يمكنك الآن العودة للوحة التحكم أو مراجعة خدماتك الأخرى</div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── WorkflowsList ─────────────────────────────────────────────────────────────
const WorkflowsList = ({ onSelect, onNew }) => {
  const [workflows,   setWorkflows]   = useState([]);
  const [canCreate,   setCanCreate]   = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [creating,    setCreating]    = useState(false);

  useEffect(() => {
    policiesApi.workflows()
      .then(r => {
        setWorkflows(r.data.workflows || []);
        setCanCreate(r.data.can_create_new ?? true);
      })
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, []);

  const handleNew = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const res = await policiesApi.start(true);
      onNew(res.data.workflow.id);
    } catch (e) {
      alert(e?.response?.data?.message || 'فشل إنشاء الخطة. حاول مرة أخرى.');
    } finally {
      setCreating(false);
    }
  };

  const statusInfo = (wf) => {
    if (wf.status === 'completed')          return { text: 'مكتملة',      color: 'green'  };
    if (wf.status === 'design_in_progress') return { text: 'تصميم جارٍ',  color: 'blue'   };
    if ((wf.current_step ?? 0) >= 3)        return { text: 'جارٍ العمل',  color: 'yellow' };
    return { text: 'مبدئية', color: 'gray' };
  };

  const stepLabel = (n) => ['التعريف','اختيار السياسات','الدفع','التعبئة','مراجعة المستشار','الاعتماد','التحميل','التصميم'][n] || `الخطوة ${n}`;

  if (listLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: `4px solid ${C.teal}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ background: C.white, borderRadius: 16, padding: '28px 32px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.tealDark, marginBottom: 4 }}>خططك للسياسات واللوائح</h2>
          <p style={{ fontSize: 13, color: C.gray }}>استعرض خطة موجودة أو أنشئ خطة جديدة بعد اكتمال الحالية</p>
        </div>
        {/* New plan button — only enabled if all existing plans are completed */}
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={handleNew}
            disabled={!canCreate || creating}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: (!canCreate || creating) ? C.grayLight : C.orange,
              color: (!canCreate || creating) ? C.gray : '#fff',
              fontSize: 14, fontWeight: 700, fontFamily: "'Cairo',sans-serif",
              cursor: (!canCreate || creating) ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              boxShadow: (!canCreate || creating) ? 'none' : `0 4px 14px ${C.orange}40`,
            }}
          >
            <IcDocument width={16} height={16}/>
            {creating ? 'جارٍ الإنشاء…' : '+ إنشاء خطة سياسات جديدة'}
          </button>
          {!canCreate && (
            <div style={{ fontSize: 11, color: C.yellow, marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <IcLock width={11} height={11}/>
              أكمل الخطة الحالية أولاً لتفعيل هذا الخيار
            </div>
          )}
        </div>
      </div>

      {/* Block message when incomplete plan exists */}
      {!canCreate && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 18px', background: C.yellowLight, border: `1.5px solid ${C.yellow}`, borderRadius: 12, marginBottom: 16 }}>
          <span style={{ flexShrink: 0, color: '#92400E', marginTop: 2 }}><IcWarning width={20} height={20}/></span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 2 }}>خطة نشطة موجودة</div>
            <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.7 }}>
              يجب إكمال الخطة الحالية وجميع مراحلها (الاعتماد من المستشار + التحميل + قرار التصميم) قبل إنشاء خطة سياسات جديدة.
            </div>
          </div>
        </div>
      )}

      {workflows.length === 0 ? (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.tealDark, marginBottom: 8 }}>لا توجد خطط بعد</h3>
          <p style={{ fontSize: 13, color: C.gray, marginBottom: 24 }}>ابدأ بإنشاء خطة سياسات ولوائح لمنظمتك</p>
          <Btn onClick={handleNew} disabled={creating}>
            {creating ? 'جارٍ الإنشاء…' : '+ إنشاء خطة جديدة'}
          </Btn>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {workflows.map((wf) => {
            const si       = statusInfo(wf);
            const stepN    = wf.current_step ?? 0;
            const pct      = wf.status === 'completed' ? 100 : Math.round(stepN / 7 * 100);
            const selCount = wf.selections_count ?? 0;
            const aprvd    = wf.approved_count ?? 0;
            const planNum  = wf.plan_number;           // sequential per-user number from backend
            const isActive = wf.status !== 'completed';
            return (
              <Card key={wf.id} style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', border: isActive ? `2px solid ${C.orange}20` : '2px solid transparent' }}>
                {/* Number badge */}
                <div style={{ width: 52, height: 52, borderRadius: 14, background: isActive ? C.orangeLight : C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, flexDirection: 'column' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: isActive ? C.orange : C.green, lineHeight: 1 }}>#{planNum}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.tealDark }}>
                      خطة السياسات #{planNum}
                    </span>
                    <Badge text={si.text} color={si.color} />
                    {isActive && <Badge text="نشطة" color="orange" />}
                    {selCount > 0 && (
                      <span style={{ fontSize: 11, color: C.gray }}>{aprvd}/{selCount} سياسة معتمدة</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: C.gray, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span>المرحلة: <strong style={{ color: C.tealDark }}>{stepLabel(stepN)}</strong></span>
                    {wf.consultant?.name && <span>المستشار: <strong style={{ color: C.tealDark }}>{wf.consultant.name}</strong></span>}
                    {wf.created_at && <span>{new Date(wf.created_at).toLocaleDateString('ar-SA')}</span>}
                    {wf.total > 0 && <span>المبلغ: <strong style={{ color: C.teal }}>{Number(wf.total).toLocaleString('en-US')} ريال</strong></span>}
                  </div>
                  <ProgressBar percent={pct} />
                  {(wf.approved_names?.length > 0) && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {wf.approved_names.map((n, i) => (
                        <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: C.greenLight, color: C.green, fontWeight: 600 }}>{n}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action */}
                <div style={{ flexShrink: 0 }}>
                  <Btn onClick={() => onSelect(wf.id)} variant={isActive ? 'primary' : 'secondary'} small>
                    {isActive ? 'متابعة ←' : 'عرض ←'}
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main PoliciesRoadmap component ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function PoliciesRoadmap({ navigate, workflowId, onWorkflowSelect }) {
  const [pageData,   setPageData]   = useState(null);
  const [loading,    setLoading]    = useState(!!workflowId);
  const [actLoading, setActLoading] = useState(false);
  const [dlLoading,  setDlLoading]  = useState(null);
  const [error,      setError]      = useState(null);
  const [editingId,  setEditingId]  = useState(null);
  const [viewingId,  setViewingId]  = useState(null);

  const workflow    = pageData?.workflow;
  const selections  = pageData?.selections || [];
  const policyTypes = pageData?.policy_types || [];
  const currentStep = workflow?.current_step ?? 0;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await policiesApi.getPageData(workflowId);
      setPageData(res.data);
    } catch {
      setError("تعذّر تحميل البيانات. تأكد من تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    // Reset overlay state whenever the active workflow changes
    setViewingId(null);
    setEditingId(null);
    if (workflowId) load();
    else setPageData(null);
  }, [workflowId, load]);

  const handleStart = async () => {
    setActLoading(true);
    try {
      const res = await policiesApi.start();
      setPageData(prev => ({ ...prev, workflow: res.data.workflow }));
    } finally { setActLoading(false); }
  };

  const handleSavePolicies = async (ids) => {
    setActLoading(true);
    try {
      const res = await policiesApi.selectPolicies(workflowId, { policy_type_ids: ids });
      setPageData(prev => ({ ...prev, workflow: res.data.workflow }));
    } finally { setActLoading(false); }
  };

  const handlePay = async (data) => {
    setActLoading(true);
    try {
      const res = await policiesApi.pay(workflowId, data);
      setPageData(prev => ({ ...prev, workflow: res.data.workflow, selections: res.data.selections }));
    } catch (e) {
      alert(e?.response?.data?.message || "فشل الدفع. حاول مرة أخرى.");
    } finally { setActLoading(false); }
  };

  const handleSave = async (id, formData) => {
    try {
      await policiesApi.saveSelection(workflowId, id, { form_data: formData });
    } catch {}
  };

  const handleSubmit = async (id, formData) => {
    setActLoading(true);
    try {
      await policiesApi.submitSelection(workflowId, id, { form_data: formData });
      await load();
      return true;
    } catch (e) {
      alert(e?.response?.data?.message || "فشل الإرسال.");
      return false;
    } finally { setActLoading(false); }
  };

  const handleSubmitAll = () => load();

  const handleDownload = async (selId) => {
    setDlLoading(selId);
    try {
      const res = await policiesApi.getPdfLink(workflowId, selId);
      window.open(res.data.url, "_blank");
    } catch {
      try {
        const res = await policiesApi.downloadPdf(workflowId, selId);
        const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const a = document.createElement("a"); a.href = url; a.download = `policy-${selId}.pdf`; a.click();
      } catch { alert("فشل تحميل PDF."); }
    } finally { setDlLoading(null); }
  };

  const handleComplete = async (wantDesign, method, brief, logoFile) => {
    setActLoading(true);
    try {
      if (wantDesign && brief) {
        await policiesApi.requestDesignWithBrief(workflowId, brief, logoFile, method || 'card');
      } else {
        await policiesApi.requestDesign(workflowId, { want_design: false, payment_method: method || 'card' });
      }
      await load();
      if (!wantDesign && navigate) navigate("client-dash");
    } catch { alert("فشل الإجراء. حاول مرة أخرى."); }
    finally { setActLoading(false); }
  };

  const handleApproveDesign = async () => {
    setActLoading(true);
    try {
      await policiesDesignApi.approve(workflowId);
      await load();
    } catch (e) { alert(e?.response?.data?.message || "فشل الاعتماد."); }
    finally { setActLoading(false); }
  };

  const handleRevisionDesign = async (notes) => {
    setActLoading(true);
    try {
      await policiesDesignApi.requestRevision(workflowId, notes);
      await load();
    } catch (e) { alert(e?.response?.data?.message || "فشل إرسال طلب التعديل."); }
    finally { setActLoading(false); }
  };

  const setStep = (n) => {
    setPageData(prev => ({ ...prev, workflow: { ...prev.workflow, current_step: n } }));
    setViewStep(null); // إلغاء وضع المراجعة عند الانتقال لخطوة جديدة
  };

  // ── وضع المراجعة: يسمح للعميل بمراجعة الخطوات المنجزة ──────────────────────
  const [viewStep, setViewStep] = useState(null);
  const displayStep = viewStep !== null ? viewStep : currentStep;

  const handleStepClick = (targetStep) => {
    if (!workflow) return;
    const fullyDone = workflow.status === 'completed' || workflow.status === 'design_in_progress';
    const maxReviewable = fullyDone ? 7 : workflow.current_step;
    if (targetStep <= maxReviewable) {
      setViewStep(targetStep === currentStep ? null : targetStep);
    }
  };

  // ── No workflow selected → show the list ────────────────────────────────────
  if (!workflowId) {
    return (
      <WorkflowsList
        onSelect={id => onWorkflowSelect && onWorkflowSelect(id)}
        onNew={id => onWorkflowSelect && onWorkflowSelect(id)}
      />
    );
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: `4px solid ${C.teal}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ color: C.gray, fontSize: 14 }}>جارٍ التحميل...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", color: C.red }}><IcWarning width={48} height={48}/></div>
      <p style={{ color: C.red, fontSize: 14, marginBottom: 16 }}>{error}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Btn onClick={load}>إعادة المحاولة</Btn>
        <Btn variant="ghost" onClick={() => onWorkflowSelect && onWorkflowSelect(null)}>← العودة للقائمة</Btn>
      </div>
    </div>
  );

  // ── Overlay: view a selection (read-only) ───────────────────────────────────
  if (viewingId) {
    const viewSel = selections.find(s => s.id === viewingId);
    const viewPol = policyTypes.find(p => p.id === viewSel?.policy_type_id);
    // Safety: if selection not found in current workflow, close the overlay
    if (!viewSel) { setViewingId(null); return null; }
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => { setViewingId(null); onWorkflowSelect && onWorkflowSelect(null); }}
            style={{ background: 'none', border: 'none', color: C.teal, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Cairo', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
            ← خططي للسياسات
          </button>
        </div>
        <Stepper step={currentStep} allDone={workflow?.status === 'completed'} />
        <QuestionnaireView
          selection={viewSel}
          policyType={viewPol}
          onSave={handleSave}
          onSubmit={handleSubmit}
          onBack={() => setViewingId(null)}
          loading={actLoading}
          readOnly={true}
        />
      </div>
    );
  }

  // ── Overlay: edit a selection from any step (e.g. from StepReview) ──────────
  if (editingId) {
    const editSel = selections.find(s => s.id === editingId);
    const editPol = policyTypes.find(p => p.id === editSel?.policy_type_id);
    // Safety: if selection not found in current workflow, close the overlay
    if (!editSel) { setEditingId(null); return null; }
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => { setEditingId(null); onWorkflowSelect && onWorkflowSelect(null); }}
            style={{ background: 'none', border: 'none', color: C.teal, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Cairo', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
            ← خططي للسياسات
          </button>
        </div>
        <Stepper step={currentStep} allDone={workflow?.status === 'completed'} />
        <QuestionnaireView
          selection={editSel}
          policyType={editPol}
          onSave={handleSave}
          onSubmit={async (id, data) => { const ok = await handleSubmit(id, data); if (ok) setEditingId(null); return ok; }}
          onBack={() => setEditingId(null)}
          loading={actLoading}
        />
      </div>
    );
  }

  const isFullyDone = workflow?.status === 'completed';

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 14 }}>
        <button onClick={() => onWorkflowSelect && onWorkflowSelect(null)}
          style={{ background: 'none', border: 'none', color: C.teal, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Cairo', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          ← خططي للسياسات
        </button>
      </div>

      <Stepper step={displayStep} realStep={currentStep} allDone={isFullyDone} onStepClick={workflow ? handleStepClick : undefined} />

      {displayStep === 0 && (
        <StepIntro
          policyTypes={policyTypes}
          operationalCompleted={pageData?.operational_completed ?? false}
          onStart={async () => {
            if (!workflow) await handleStart();
            setStep(1);
          }}
          loading={actLoading}
        />
      )}

      {displayStep === 1 && (
        <StepSelect policyTypes={policyTypes} workflow={workflow} onSave={handleSavePolicies}
          onNext={() => setStep(2)} loading={actLoading} />
      )}

      {displayStep === 2 && (
        <StepPayment policyTypes={policyTypes} workflow={workflow} onPay={handlePay}
          onBack={() => setStep(1)} loading={actLoading} />
      )}

      {displayStep === 3 && (
        <StepWork policyTypes={policyTypes} selections={selections}
          onSave={handleSave} onSubmit={handleSubmit} onSubmitAll={handleSubmitAll}
          loading={actLoading} onView={setViewingId} />
      )}

      {displayStep === 4 && (
        <StepReview policyTypes={policyTypes} selections={selections}
          onEdit={setEditingId} onView={setViewingId} refreshData={load} />
      )}

      {displayStep === 5 && (
        <StepApproval workflow={workflow} selections={selections} policyTypes={policyTypes}
          onNext={() => setStep(6)} onView={setViewingId} />
      )}

      {displayStep === 6 && (
        <StepDownload policyTypes={policyTypes} selections={selections} workflow={workflow}
          onNext={() => setStep(7)} onDownload={handleDownload} loadingId={dlLoading} onView={setViewingId} />
      )}

      {displayStep === 7 && (
        <StepDesign
          onComplete={handleComplete}
          onApprove={handleApproveDesign}
          onRevision={handleRevisionDesign}
          loading={actLoading}
          navigate={navigate}
          workflow={workflow}
          selections={selections}
          designPrice={pageData?.design_price}
          designTax={pageData?.design_tax}
          designTotal={pageData?.design_total}
          designFileUrl={pageData?.design_file_url}
        />
      )}
    </div>
  );
}
