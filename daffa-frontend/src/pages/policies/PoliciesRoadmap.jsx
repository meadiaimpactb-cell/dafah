import DfIcon from '../../components/ui/DfIcon';
import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { policiesApi, policiesDesignApi } from "../../api/policies";
import api from "../../api/axios";
import { ConsultantRating } from "../strategic/steps/StepApproval";
import { PaymentReceipt } from "../strategic/steps/StepPayment";
import ConsultantPicker from "../shared/ConsultantPicker";
import { PaymentMethodPicker, ApplePayButton, SecurePaymentBadge, CardNetworkLogo, detectCardNetwork } from "../shared/PaymentBrand";
import { IcCheckCircle, IcArrowPath, IcSearch, IcWarning, IcLock, IcLightbulb, IcSave, IcDocument, IcUser, IcCalendar, IcCreditCard, IcSparkles, IcCheck, IcPencil, IcEye, IcPalette, IcBeaker, IcChat, IcScroll, IcClock } from '../../utils/icons';
import UnitVideo from '../shared/UnitVideo';
import { useSiteContent } from '../auth/AuthShell';
import { isVisible, evaluate, toggleMultiple, forcedOptions, visibleFields, assembleParts, pruneAnswers, summarize, filled as isFilled } from './questionRules';

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
const C = { amber: '#EF6A2C', amberText: '#A33F12',
  primary: "#235D7F", ink: "#0E2A3D", primaryDeep: "#123247",
  orange: "#EF6A2C", amberLine: '#E05A1F', amberSoft: "#FEF3EC",
  bg: "#FBF9F5", white: "#FFFFFF",
  gray: "#5E6B78", grayLight: "#F3EFE8", grayBorder: "#E8E3DA",
  green: "#0E9F74", greenLight: "#C9EFE1",
  blue: "#2E8FE6", blueLight: "#CFE5FA",
  red: "#DC4A4A", redLight: "#F8D3D3",
  yellow: "#EF6A2C", yellowLight: "#FDE2D2",
};

// ── Confirm Modal ─────────────────────────────────────────────────────────────
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

// ── Shared UI helpers ─────────────────────────────────────────────────────────
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.white, borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(14,42,61,0.06)", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", disabled, small, full, icon }) => {
  const s = {
    primary:   { bg: C.amber,  color: "#0E2A3D", border: "none" },
    secondary: { bg: "transparent", color: C.primary, border: `2px solid ${C.primary}` },
    ghost:     { bg: "transparent", color: C.primary, border: "none" },
    success:   { bg: C.green,   color: "white", border: "none" },
    danger:    { bg: C.red,     color: "white", border: "none" },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: small ? "6px 14px" : "10px 24px", borderRadius: 10, fontSize: small ? 12 : 14,
        fontWeight: 600, fontFamily: "inherit",
        background: disabled ? C.grayLight : s.bg, color: disabled ? C.gray : s.color,
        border: s.border || "none", cursor: disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : "auto", opacity: disabled ? 0.6 : 1, transition: "all 0.2s" }}>
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  );
};

const Badge = ({ text, color = "gray" }) => {
  const map = { green: [C.greenLight, C.green], blue: [C.blueLight, C.blue], orange: [C.amberSoft, C.amberText], gray: [C.grayLight, C.gray], yellow: [C.yellowLight, C.amberText], red: [C.redLight, C.red] };
  const [bg, fg] = map[color] || map.gray;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color: fg, whiteSpace: "nowrap" }}>{text}</span>;
};

const ProgressBar = ({ percent }) => (
  <div style={{ width: "100%", height: 8, background: C.grayLight, borderRadius: 8, overflow: "hidden" }}>
    <div style={{ width: `${percent}%`, height: "100%", background: `linear-gradient(90deg,${C.primary},${C.amber})`, borderRadius: 8, transition: "width 0.8s ease" }} />
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
                background: done ? (current ? C.amber : C.green) : current ? C.amber : C.grayLight,
                color: (done || current) ? "#0E2A3D" : C.gray,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, transition: "all 0.3s",
                boxShadow: current ? `0 3px 10px ${C.amberLine}40` : done ? `0 2px 8px ${C.green}40` : "none",
                outline: clickable && !current ? `2px solid ${C.primary}30` : "none",
                outlineOffset: 2,
              }}>
                <span style={{ transform: (!done && ws.diamond) ? "rotate(-45deg)" : "none", display: "flex" }}>
                  {done && !current
                    ? <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    : ws.icon}
                </span>
              </div>
              <span style={{ fontSize: 8, fontWeight: current ? 700 : 400, color: done ? (current ? C.amberText : C.green) : C.gray, textAlign: "center", maxWidth: 70, lineHeight: 1.2 }}>
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
      <div style={{ marginTop: 6, padding: '6px 14px', background: '#FEF3EC', borderRadius: 8, border: `1px solid ${C.amberLine}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: C.amberText, fontWeight: 600 }}>
          <DfIcon name="search" size={18} style={{ marginInlineEnd: 6 }} />وضع المراجعة — تستعرض: {STEPS[step]?.label}
        </span>
        <button
          onClick={() => onStepClick(effective)}
          style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}
        >
          العودة للخطوة الحالية ←
        </button>
      </div>
    )}
  </div>
  );
};

// ── Step 0: Intro ──────────────────────────────────────────────────────────────
// السياسات المتاحة للشراء (حزمة الإصدار 3.0) مجمّعة حسب المجموعة
const groupActivePolicies = (policyTypes) => {
  const groups = [];
  policyTypes.filter(p => p.active !== false).forEach(p => {
    const name = p.group_name || "السياسات";
    let g = groups.find(x => x.name === name);
    if (!g) { g = { name, items: [] }; groups.push(g); }
    g.items.push(p);
  });
  return groups;
};

const StepIntro = ({ policyTypes, onStart, loading }) => (
  <div className="animate-in">
    <Card style={{ padding: 32, textAlign: "center", marginBottom: 20, borderBottom: `3px solid ${C.amberLine}` }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.amberText }}><IcScroll width={28} height={28}/></div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>نظام بناء السياسات واللوائح</h2>
      <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.8, maxWidth: 600, margin: "12px auto 0" }}>
        بناء السياسات واللوائح الداخلية لمنظمتك من خلال استبيانات ذكية موجهة — أجب على الأسئلة والنظام يولّد السياسة تلقائياً
      </p>
    </Card>

    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", background: C.blueLight, border: `1.5px solid ${C.blue}`, borderRadius: 12, marginBottom: 20 }}>
      <span style={{ flexShrink: 0, color: C.blue }}><IcLightbulb width={22} height={22}/></span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.blue, marginBottom: 4 }}>نظام مستقل</div>
        <div style={{ fontSize: 13, color: "#164F8A", lineHeight: 1.7 }}>
          يمكنك البدء ببناء السياسات واللوائح مباشرة دون التخطيط الاستراتيجي أو التشغيلي، وتختار مستشارك في خطوة الدفع.
        </div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 16, marginBottom: 20 }}>
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 14 }}>كيف يعمل النظام</h3>
        {["اختر السياسات التي تحتاجها منظمتك", "ادفع حسب السياسات المختارة (تسعير مستقل)", "أجب على استبيان ذكي لكل سياسة", "شاهد الفيديوهات التعليمية المرفقة", "النظام يولّد السياسة تلقائياً من إجاباتك", "المستشار يراجع ويعتمد", "حمّل السياسات بتصميم تلقائي أو احترافي"].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 6 ? `1px solid ${C.grayLight}` : "none" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 13, color: C.ink }}>{item}</span>
          </div>
        ))}
      </Card>

      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 4 }}>السياسات المتاحة ({policyTypes.filter(p => p.active !== false).length})</h3>
        <div style={{ fontSize: 11, color: C.gray, marginBottom: 10 }}>حزمة سياسات ولوائح القطاع غير الربحي — الإصدار 3.0</div>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {groupActivePolicies(policyTypes).map(g => (
            <div key={g.name} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.amberText, padding: "6px 0 2px" }}>{g.name}</div>
              {g.items.map((p, i) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: i < g.items.length - 1 ? `1px solid ${C.grayLight}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: C.primary, flexShrink: 0 }}><IcDocument width={14} height={14}/></span>
                    <span style={{ fontSize: 12 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, whiteSpace: "nowrap" }}>{p.price.toLocaleString('en-US')} ريال</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>

    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Btn onClick={onStart} disabled={loading}>
          {loading ? "جارٍ التحميل..." : "التالي: اختيار السياسات ←"}
        </Btn>
      </div>
    </div>
  </div>
);

// ── Step 1: Select policies ───────────────────────────────────────────────────
const StepSelect = ({ policyTypes, workflow, onNext, onSave, loading }) => {
  const activeIds = policyTypes.filter(p => p.active !== false).map(p => p.id);
  const saved = workflow?.selected_policies || [];
  // سياسات الإصدار السابق لم تعد متاحة للشراء — تُستبعد من الاختيار المحفوظ
  const [selected, setSelected] = useState(saved.map(Number).filter(id => activeIds.includes(id)));

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const total  = selected.reduce((sum, id) => sum + (policyTypes.find(p => p.id === id)?.price || 0), 0);

  const handleNext = async () => {
    const ok = await onSave(selected);
    if (ok !== false) onNext();
  };

  // بعد الدفع: عرض فقط — تغيير الاختيار كان يعيد الخطة للخطوة الأولى ويطلب الدفع مجددًا
  if (workflow?.payment_status === 'paid') {
    const paid = saved.map(Number).map(id => policyTypes.find(p => p.id === id)).filter(Boolean);
    return (
      <div className="animate-in">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 6 }}>السياسات المختارة في هذه الخطة</h2>
        <div style={{ margin: "10px 0 18px", padding: "12px 16px", background: C.greenLight, border: `1.5px solid ${C.green}40`, borderRadius: 12, fontSize: 13, color: "#086449", fontWeight: 600, display: "flex", alignItems: "flex-start", gap: 8, lineHeight: 1.8 }}>
          <IcCheckCircle width={18} height={18} style={{ flexShrink: 0, marginTop: 2 }}/>
          <span>تم الدفع لهذه السياسات، ولا يمكن تغيير الاختيار في هذه الخطة. لإضافة سياسات أخرى أنشئ خطة جديدة بعد اكتمال هذه الخطة.</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
          {paid.map(p => (
            <Card key={p.id} style={{ border: `2px solid ${C.green}40` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.greenLight, display: "flex", alignItems: "center", justifyContent: "center", color: C.green }}><IcDocument width={18} height={18}/></div>
                <Badge text="مدفوعة" color="green" />
              </div>
              {p.code && <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, marginTop: 10, direction: "ltr", textAlign: "right" }}>{p.code}</div>}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 4 }}>{p.name}</h3>
              <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}>{p.sections?.length || 0} أقسام</div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 6 }}>اختر السياسات واللوائح المرادة</h2>
      <p style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>يمكنك اختيار سياسة واحدة أو أكثر — التسعير مستقل لكل سياسة. جميع النماذج من حزمة سياسات دفة الإصدار 3.0.</p>

      {groupActivePolicies(policyTypes).map(g => {
        const groupIds = g.items.map(p => p.id);
        const allSel   = groupIds.every(id => selected.includes(id));
        return (
          <div key={g.name} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${C.amberSoft}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{g.name} <span style={{ fontSize: 12, color: C.gray, fontWeight: 400 }}>({g.items.length})</span></h3>
              <button onClick={() => setSelected(s => allSel ? s.filter(id => !groupIds.includes(id)) : [...new Set([...s, ...groupIds])])}
                style={{ fontSize: 12, color: C.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                {allSel ? "إلغاء تحديد المجموعة" : "تحديد المجموعة"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
              {g.items.map(p => {
                const sel = selected.includes(p.id);
                return (
                  <Card key={p.id} style={{ cursor: "pointer", border: sel ? `2px solid ${C.amberLine}` : "2px solid transparent", transition: "all 0.2s", display: "flex", flexDirection: "column" }}
                    onClick={() => toggle(p.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", color: C.amberText }}><IcDocument width={20} height={20}/></div>
                      {sel && <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.amber, display: "flex", alignItems: "center", justifyContent: "center", color: "#0E2A3D" }}><IcCheck width={14} height={14}/></div>}
                    </div>
                    {p.code && <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, marginTop: 10, direction: "ltr", textAlign: "right" }}>{p.code}</div>}
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 4 }}>{p.name}</h3>
                    <p style={{ fontSize: 11, color: C.gray, marginTop: 4, lineHeight: 1.6, flex: 1 }}>{p.description}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>{p.price.toLocaleString('en-US')} ريال</span>
                      <span style={{ fontSize: 11, color: C.gray }}>{p.sections.length} أقسام</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {selected.length > 0 && (
        <div style={{ position: "sticky", bottom: 0, background: C.white, padding: "14px 20px", borderTop: `2px solid ${C.grayBorder}`, borderRadius: "14px 14px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -4px 12px rgba(14,42,61,0.1)" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>السياسات المحددة: {selected.length}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.primary, marginRight: 16 }}> | الإجمالي: {total.toLocaleString('en-US')} ريال</span>
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
  const inp = { padding: '10px 14px', border: `1.5px solid ${C.grayBorder}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", width: '100%', boxSizing: 'border-box', outline: 'none', direction: 'ltr' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Test card hint */}
      <div style={{ padding: '8px 12px', background: '#E8F8F2', borderRadius: 8, fontSize: 11, color: '#086449', direction: 'rtl', lineHeight: 1.8 }}>
        بطاقة الاختبار: <strong>4111 1111 1111 1111</strong> | تاريخ: <strong>12/26</strong> | CVV: <strong>123</strong>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.ink, display: 'block', marginBottom: 4 }}>رقم البطاقة</label>
        <div style={{ position: 'relative' }}>
          <input value={card.number} onChange={e => onChange({ ...card, number: fmtCardNum(e.target.value) })}
            placeholder="XXXX XXXX XXXX XXXX" maxLength={19} inputMode="numeric" autoComplete="cc-number" aria-label="رقم البطاقة"
            style={{ ...inp, paddingRight: 70 }} />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <CardNetworkLogo brand={isMada ? 'mada' : detectCardNetwork(card.number)} />
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 10 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.ink, display: 'block', marginBottom: 4 }}>تاريخ الانتهاء</label>
          <input value={card.expiry} onChange={e => onChange({ ...card, expiry: fmtExpiry(e.target.value) })}
            placeholder="MM/YY" maxLength={5} style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.ink, display: 'block', marginBottom: 4 }}>CVV</label>
          <input value={card.cvv} onChange={e => onChange({ ...card, cvv: fmtCvv(e.target.value) })}
            placeholder="123" maxLength={3} type="password" style={{ ...inp, letterSpacing: 4 }} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.ink, display: 'block', marginBottom: 4 }}>اسم حامل البطاقة</label>
        <input value={card.name} onChange={e => onChange({ ...card, name: e.target.value })}
          placeholder="كما هو مكتوب على البطاقة" style={{ ...inp, direction: 'rtl' }} />
      </div>
    </div>
  );
};

const StepPayment = ({ policyTypes, workflow, onPay, onBack, onWorkflowUpdate }) => {
  // خطة مستقلة بلا مستشار موروث: يختار العميل مستشاره قبل الدفع
  const needsConsultant = !workflow?.consultant_id;
  const [pickedHere, setPickedHere] = useState(false);
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
                  <span style={{ color: '#334452', fontWeight: 600 }}>{p.price.toLocaleString('en-US')} ر.س</span>
                </div>
              ) : null;
            })}
            {workflow?.include_arbitration && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.gray }}>
                <span>تحكيم السياسات</span>
                <span style={{ color: '#334452', fontWeight: 600 }}>2,000 ر.س</span>
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
    if (needsConsultant) { setPayError('اختر المستشار أولًا لإتمام الدفع.'); return; }
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
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 20 }}>إتمام الدفع — السياسات واللوائح</h2>

      {(needsConsultant || pickedHere) && (
        <ConsultantPicker
          selectedId={workflow?.consultant_id}
          subtitle="يراجع المستشار السياسات التي تعبّئها ويعتمدها. اختر مستشارًا لمتابعة هذه الخطة."
          loadConsultants={() => policiesApi.getConsultants()}
          onSelect={async id => {
            const res = await policiesApi.selectConsultant(workflow.id, { consultant_id: id });
            setPickedHere(true);
            setPayError(null);
            const w = res.data.workflow;
            onWorkflowUpdate?.({ consultant_id: w.consultant_id, consultant: w.consultant });
          }}
        />
      )}

      {payError && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: C.redLight, border: `1.5px solid ${C.red}30`, borderRadius: 10, fontSize: 13, color: C.red, fontWeight: 600 }}>
          <DfIcon name="warning" size={18} style={{ marginInlineEnd: 6 }} />{payError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 20 }}>
        {/* ── Order summary ── */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 14 }}>ملخص الطلب</h3>
          {selected.map(id => { const p = policyTypes.find(x => x.id === id); return p && (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.grayLight}`, fontSize: 13 }}>
              <span>{p.icon} {p.name}</span>
              <span style={{ fontWeight: 600 }}>{p.price.toLocaleString('en-US')} ريال</span>
            </div>
          ); })}

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={arbitration} onChange={e => setArbitration(e.target.checked)} style={{ accentColor: C.primary }} />
              <span style={{ fontSize: 13 }}>تحكيم السياسات من مستشار</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.amberText }}>2,000 ريال</span>
          </label>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input value={discountCode} onChange={e => setDiscountCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyDiscount()}
              placeholder="كود الخصم" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: "inherit", outline: 'none' }} />
            <Btn small onClick={applyDiscount}>تطبيق</Btn>
          </div>

          <div style={{ marginTop: 14, padding: '12px 0', borderTop: `2px solid ${C.grayBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>المجموع الفرعي</span><span>{subtotal.toLocaleString('en-US')} ريال</span></div>
            {discAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: C.green }}><span>خصم</span><span>-{discAmt.toLocaleString('en-US')} ريال</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>ضريبة 15%</span><span>{vat.toLocaleString('en-US')} ريال</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: C.ink, marginTop: 8 }}><span>الإجمالي</span><span>{total.toLocaleString('en-US')} ريال</span></div>
          </div>
        </Card>

        {/* ── Payment method ── */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 14 }}>طريقة الدفع</h3>
          <div style={{ marginBottom: 16 }}>
            <PaymentMethodPicker
              value={methodKey}
              onChange={k => { setMethodIdx(Math.max(0, PAY_METHODS.findIndex(m => m.key === k))); setCard(EMPTY_CARD); setPayError(null); }}
            />
          </div>

          {(methodKey === 'card' || methodKey === 'mada') && (
            <CardInputForm card={card} onChange={setCard} isMada={methodKey === 'mada'} />
          )}
          {methodKey === 'apple_pay' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <ApplePayButton />
              <p style={{ fontSize: 12, color: C.gray, marginTop: 10, fontFamily: "inherit" }}>سيتم فتح نافذة Apple Pay لإتمام عملية الدفع</p>
            </div>
          )}
          {methodKey === 'bank_transfer' && (
            <div style={{ background: C.blueLight, borderRadius: 10, padding: '16px 18px', fontSize: 13, color: '#164F8A', lineHeight: 1.9 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>تفاصيل التحويل البنكي</div>
              <div>البنك: بنك الرياض</div>
              <div>رقم الحساب: SA12 3456 7890 1234 5678</div>
              <div>الاسم: شركة دفة للتخطيط</div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#164F8A99' }}>أرسل إيصال التحويل لمستشارك بعد الدفع</div>
            </div>
          )}

          <SecurePaymentBadge />
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
        <Btn variant="secondary" onClick={onBack} disabled={paying}>→ السابق</Btn>
        <button onClick={handlePay} disabled={paying || needsConsultant}
          style={{ padding: '14px 40px', background: paying || needsConsultant ? C.gray : C.amber, color: '#0E2A3D', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: paying || needsConsultant ? 'not-allowed' : 'pointer', fontFamily: "inherit", display: 'flex', alignItems: 'center', gap: 8, boxShadow: paying ? 'none' : `0 4px 16px ${C.amberLine}40`, transition: 'all 0.2s' }}>
          <IcLock width={16} height={16}/>
          {paying ? 'جارٍ معالجة الدفع…' : `ادفع الآن — ${total.toLocaleString('en-US')} ريال`}
        </button>
      </div>
    </div>
  );
};

// ── Demo-fill data builder (dynamic) ─────────────────────────────────────────
const buildDemoAnswers = (apiSections) => {
  const data = {};
  const demoVal = (spec) => {
    if (spec.input === 'date') return new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    if (spec.input === 'number') { const lo = spec.min ?? 0; const hi = spec.max ?? Math.max(lo + 10, 100); return String(Math.min(hi, Math.max(lo, lo + Math.round((hi - lo) / 2)))); }
    if (spec.input === 'select') return spec.options?.[0] ?? '';
    if (spec.input === 'phone') return '1234';
    return "إجابة تجريبية على هذا السؤال لأغراض الاختبار";
  };
  const questions = apiSections.flatMap(sec => sec.questions || []);
  // جولتان: الأولى للأسئلة المستقلة، والثانية للتابعة (تظهر بعد إجابة شرطها)
  for (let pass = 0; pass < 2; pass++) {
    questions.forEach(q => {
      const key = `q${q.id}`; const m = q.meta || {};
      if (!isVisible(q, data)) { delete data[key]; return; }
      if (data[key] !== undefined && pass === 1) return;
      if (m.fields?.length) {
        const parts = {}; visibleFields(q, data).forEach(f => { parts[f.key] = demoVal(f); });
        (m.checks || []).forEach(c => {
          if (c.lte) { const [a, b] = c.lte; if (parts[a] !== undefined && parts[b] !== undefined) parts[b] = String(Math.max(Number(parts[b]), Number(parts[a]))); }
          if (c.eq_product) { const [a, b, cc] = c.eq_product; parts[b] = '100'; parts[cc] = '10'; parts[a] = '1000'; }
          if (c.sum_eq) { const [keys, total] = c.sum_eq; const each = Math.floor(total / keys.length); keys.forEach((k, i) => { parts[k] = String(i === keys.length - 1 ? total - each * (keys.length - 1) : each); }); }
          if (c.lte_q) { const [a] = c.lte_q; if (parts[a] !== undefined) parts[a] = '0'; }
        });
        data[`${key}__parts`] = parts; data[key] = assembleParts(q, data, parts); return;
      }
      // الخيارات التي تستلزم توضيحًا إلزاميًا تُتجنب في التعبئة التجريبية؛ أما التوضيح الاختياري فلا يمنع اختيارها
      const nonOther = (q.options || []).filter(o => m.other?.optional || !(m.other?.options || []).includes(o));
      if (q.type === "text")          data[key] = demoVal(m);
      else if (q.type === "single")   data[key] = nonOther[0] ?? q.options?.[0] ?? "نعم";
      else if (q.type === "multiple") { const forced = forcedOptions(q, data); const pick = nonOther.filter(o => !(m.exclusive || []).includes(o)).slice(0, 2); data[key] = Array.from(new Set([...forced, ...(m.require?.all || []), ...pick])); }
      else if (q.type === "yesno")    data[key] = "نعم";
      else if (q.type === "scale")    data[key] = "3";
      // توضيح «أخرى» أو التفاصيل المرتبطة بالخيار المختار
      if (m.other?.options?.length) {
        const v = data[key]; const chosen = Array.isArray(v) ? v.some(x => m.other.options.includes(x)) : m.other.options.includes(String(v ?? ''));
        if (chosen) data[`${key}__other`] = demoVal({ input: m.other.input, min: m.other.min, max: m.other.max });
      }
    });
  }
  // إجابة تتعارض مع سؤال آخر: نجرّب بقية الخيارات حتى تتسق
  questions.forEach(q => {
    if (q.type !== 'single' || !isVisible(q, data) || evaluate(q, data).status !== 'invalid') return;
    const alt = (q.options || []).find(o => evaluate(q, { ...data, [`q${q.id}`]: o }).status === 'ok');
    if (alt) data[`q${q.id}`] = alt;
  });
  return pruneAnswers(questions, data);
};

// ── Section validation (dynamic) ─────────────────────────────────────────────
// القسم مكتمل إذا لم يبقَ فيه سؤال ظاهر مطلوب بلا إجابة أو بإجابة غير صالحة
const sectionProblems = (sectionIndex, answers, apiSections) => {
  const sec = apiSections?.[sectionIndex];
  if (!sec) return [];
  return (sec.questions || []).map(q => ({ q, r: evaluate(q, answers) })).filter(({ q, r }) => r.status !== 'ok' && r.status !== 'hidden' && (q.required || r.status === 'invalid'));
};
const isSectionComplete = (sectionIndex, answers, apiSections) => sectionProblems(sectionIndex, answers, apiSections).length === 0;

// ── Policy content info panel (shows admin-saved content to client) ───────────
const PolicyInfoPanel = ({ policyType }) => {
  const hasOverview = !!policyType?.overview;
  const hasDesc     = !!policyType?.written_description;
  const hasTip      = !!policyType?.tip;
  const hasVideo    = !!(policyType?.video_url || policyType?.video_url_alt);
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
          background: `${C.primary}12`, border: `1.5px solid ${C.primary}30`,
          cursor: 'pointer', fontFamily: "inherit", fontSize: 13, fontWeight: 600,
          color: C.ink, transition: 'all .2s',
        }}
      >
        <span>معلومات هذه السياسة</span>
        <span style={{ fontSize: 11, color: C.primary }}>{open ? '▲ إخفاء' : '▼ عرض'}</span>
      </button>

      {open && (
        <div style={{ background: C.white, border: `1.5px solid ${C.primary}30`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px 18px' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontFamily: "inherit", fontSize: 12, fontWeight: tab === t.key ? 700 : 400,
                  background: tab === t.key ? C.primary : C.grayLight,
                  color: tab === t.key ? '#fff' : C.gray, transition: 'all .15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <p style={{ fontSize: 14, color: '#334452', lineHeight: 1.9, margin: 0 }}>
              {policyType.overview}
            </p>
          )}

          {tab === 'desc' && (
            <p style={{ fontSize: 14, color: '#334452', lineHeight: 1.9, whiteSpace: 'pre-line', margin: 0 }}>
              {policyType.written_description}
            </p>
          )}

          {tab === 'tip' && (
            <div style={{ background: '#FEF3EC', border: '1px solid #FBC3A3', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10 }}>
              <span style={{ color: '#7F310E', flexShrink: 0 }}><IcLightbulb width={20} height={20}/></span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7F310E', marginBottom: 4 }}>نصيحة</div>
                <div style={{ fontSize: 13, color: '#5E240A', lineHeight: 1.7 }}>{policyType.tip}</div>
              </div>
            </div>
          )}

          {tab === 'video' && (
            hasVideo ? (
              <UnitVideo url={policyType.video_url} altUrl={policyType.video_url_alt} title={policyType.name} radius={10} />
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
      .then(r => { setApiSections(Array.isArray(r.data) ? r.data : []); setSection(0); })
      .catch(() => setApiSections([]))
      .finally(() => setLoadingQ(false));
  }, [policyType?.id]);

  // التمييز الأحمر يبقى على الأسئلة الناقصة فقط ويختفي عن كل سؤال فور الإجابة عنه
  const setAns = (qId, value) => { setAnswers(prev => ({ ...prev, [`q${qId}`]: value })); };
  const setExtra = (key, value) => { setAnswers(prev => ({ ...prev, [key]: value })); };
  const getAns = (qId) => answers[`q${qId}`] ?? "";
  const allQuestionsRef = apiSections.flatMap(s => s.questions || []);

  // يُحفظ ما يظهر فقط (إجابات الأسئلة المخفية بشرط لا تدخل الوثيقة)
  const autoSave = useCallback(async () => {
    await onSave(selection.id, pruneAnswers(allQuestionsRef, answers)).catch(() => {});
  }, [answers, selection?.id, onSave, apiSections]);

  // الأسئلة الناقصة أو غير الصالحة في قسم معيّن (لتمييزها والتمرير إليها)
  const missingIn = (idx) => sectionProblems(idx, answers, apiSections).map(({ q }) => q);
  const problemMsg = (qId) => { const q = allQuestionsRef.find(x => x.id === qId); return q ? evaluate(q, answers).msg : null; };
  const flagMissing = (idx = section) => {
    setValidErr(true);
    if (idx !== section) setSection(idx);
    setTimeout(() => {
      const first = missingIn(idx)[0];
      document.getElementById(first ? `pq-${first.id}` : "pq-top")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };
  const submitNow = () => {
    const firstIncomplete = apiSections.findIndex((_, i) => !isSectionComplete(i, answers, apiSections));
    if (firstIncomplete !== -1) { flagMissing(firstIncomplete); return; }
    onSubmit(selection.id, pruneAnswers(allQuestionsRef, answers));
  };

  const handleNextSection = async () => {
    if (!isSectionComplete(section, answers, apiSections)) { flagMissing(); return; }
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
        flagMissing(k);
        return;
      }
    }
    await autoSave();
    setValidErr(false);
    setSection(target);
  };

  const allSectionsComplete = apiSections.every((_, i) => isSectionComplete(i, answers, apiSections));
  const progress      = summarize(apiSections, answers);           // الأسئلة الظاهرة فقط
  const allQuestions  = { length: progress.total };
  const answeredCount = progress.answered;
  const completionPct = progress.total ? Math.round((progress.answered / progress.total) * 100) : 0;
  const isSent        = ["submitted", "reviewing"].includes(selection?.status);
  const sentDate      = selection?.submitted_at ? new Date(selection.submitted_at).toLocaleDateString("ar-SA-u-ca-gregory", { day: "numeric", month: "long" }) : null;
  const missingNow    = validErr ? missingIn(section).map(q => q.id) : [];
  const currentSection = apiSections[section];

  const inputBox = { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" };
  const unitTag = (u) => u ? <span style={{ fontSize: 12, color: C.gray, whiteSpace: "nowrap" }}>{u}</span> : null;

  // خانة فرعية بحسب نوعها (نص/رقم/تاريخ/قائمة)
  const renderInput = (spec, value, onChange, opts = {}) => {
    const kind = spec.input || 'text';
    if (kind === 'date') return (
      <input type="date" value={value || ""} onChange={e => onChange(e.target.value)} lang="en-GB" style={{ ...inputBox, direction: "ltr", textAlign: "right", maxWidth: 260 }} aria-label={opts.label} />
    );
    if (kind === 'number') return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="text" inputMode="decimal" value={value || ""} onChange={e => onChange(e.target.value)} placeholder={spec.placeholder || (spec.min !== undefined ? `${spec.min} فأكثر` : "0")} style={{ ...inputBox, direction: "ltr", textAlign: "right", maxWidth: 220 }} aria-label={opts.label} />
        {unitTag(spec.unit)}
      </div>
    );
    if (kind === 'phone') return (
      <input type="tel" inputMode="tel" value={value || ""} onChange={e => onChange(e.target.value)} placeholder={spec.placeholder || "مثال: 1234 أو 0112345678"} style={{ ...inputBox, direction: "ltr", textAlign: "right", maxWidth: 260 }} aria-label={opts.label} />
    );
    if (kind === 'select') return (
      <select value={value || ""} onChange={e => onChange(e.target.value)} style={{ ...inputBox, maxWidth: 320 }} aria-label={opts.label}>
        <option value="">— اختر —</option>
        {(spec.options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    return <input type="text" value={value || ""} onChange={e => onChange(e.target.value)} placeholder={spec.placeholder} style={{ ...inputBox, maxWidth: 420 }} aria-label={opts.label} />;
  };

  const renderQuestion = (q) => {
    const key  = `q${q.id}`;
    const m    = q.meta || {};
    const label = <label style={{ fontSize: 14, fontWeight: 600, color: C.ink, display: "block", marginBottom: 8 }}>{q.question}{q.required && <span style={{ color: C.red }}> *</span>}</label>;
    const hint  = q.hint && <div style={{ fontSize: 12, color: C.gray, marginBottom: 6 }}>{q.hint}</div>;
    const info  = m.info && (
      <div style={{ margin: "6px 0 12px", border: `1px solid ${C.primary}30`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "8px 12px", background: `${C.primary}10`, fontSize: 12, fontWeight: 700, color: C.primary }}>{m.info.title}</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            {m.info.headers && <thead><tr>{m.info.headers.map((h, i) => <th key={i} style={{ padding: "6px 10px", textAlign: "right", background: C.grayLight, color: C.ink, fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>}
            <tbody>{(m.info.rows || []).map((r, i) => <tr key={i} style={{ borderTop: `1px solid ${C.grayBorder}` }}>{r.map((c, j) => <td key={j} style={{ padding: "6px 10px", color: "#334452", verticalAlign: "top" }}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    );
    // حقل «أخرى»: يظهر فور اختيار خيار يستلزم توضيحًا
    const otherBox = (() => {
      if (!m.other?.options?.length) return null;
      const v = answers[key];
      const chosen = Array.isArray(v) ? v.some(x => m.other.options.includes(x)) : m.other.options.includes(String(v ?? ""));
      if (!chosen) return null;
      return (
        <div style={{ marginTop: 8, padding: "10px 12px", background: C.amberSoft, borderRadius: 10, border: `1px dashed ${C.amber}80` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.amberText, marginBottom: 6 }}>{m.other.label || "حدّد المقصود بـ«أخرى»"} {m.other.optional ? <span style={{ color: C.gray, fontWeight: 500 }}>(اختياري)</span> : <span style={{ color: C.red }}>*</span>}</div>
          {renderInput({ input: m.other.input || 'text', placeholder: m.other.placeholder, unit: m.other.unit, min: m.other.min }, answers[`${key}__other`], v2 => setExtra(`${key}__other`, v2), { label: m.other.label })}
        </div>
      );
    })();

    // سؤال مركّب بعدة خانات
    if (m.fields?.length) {
      const parts = (answers[`${key}__parts`] && typeof answers[`${key}__parts`] === 'object') ? answers[`${key}__parts`] : {};
      const setPart = (fk, v) => setAnswers(prev => {
        const np = { ...((prev[`${key}__parts`] && typeof prev[`${key}__parts`] === 'object') ? prev[`${key}__parts`] : {}), [fk]: v };
        return { ...prev, [`${key}__parts`]: np, [key]: assembleParts(q, prev, np) };
      });
      const fields = visibleFields(q, answers);
      return (
        <div key={q.id}>{label}{hint}{info}
          <div style={{ display: "grid", gridTemplateColumns: fields.length > 2 ? "repeat(auto-fit, minmax(220px, 1fr))" : "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {fields.map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#334452", marginBottom: 4 }}>{f.label}{f.required !== false && q.required && <span style={{ color: C.red }}> *</span>}</div>
                {renderInput(f, parts[f.key], v => setPart(f.key, v), { label: f.label })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (q.type === "text") return (
      <div key={q.id}>{label}{hint}{info}
        {m.input === 'date' || m.input === 'number' || m.input === 'phone'
          ? renderInput(m, getAns(q.id), v => setAns(q.id, v), { label: q.question })
          : <textarea value={getAns(q.id)} onChange={e => setAns(q.id, e.target.value)} rows={3} style={{ ...inputBox, resize: "vertical", direction: "rtl", textAlign: "right" }} />}
      </div>
    );
    if (q.type === "single") return (
      <div key={q.id}>{label}{hint}{info}
        {(q.options || []).map((o, i) => (
          <label key={i} onClick={() => setAns(q.id, o)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", border: `1.5px solid ${getAns(q.id) === o ? C.primary : C.grayBorder}`, background: getAns(q.id) === o ? `${C.primary}08` : "transparent" }}>
            <input type="radio" checked={getAns(q.id) === o} onChange={() => setAns(q.id, o)} style={{ accentColor: C.primary }} />
            <span style={{ fontSize: 13 }}>{o}</span>
          </label>
        ))}
        {otherBox}
      </div>
    );
    if (q.type === "multiple") {
      const vals = Array.isArray(getAns(q.id)) ? getAns(q.id) : [];
      const forced = forcedOptions(q, answers);
      // التبديل من آخر حالة (لا من نسخة قديمة)، والنقر على النص يصل إلى خانة الاختيار عبر <label> نفسها فلا نكرّر المعالجة
      const toggle = (o) => setAnswers(prev => ({ ...prev, [key]: toggleMultiple(q, prev, o) }));
      const excl = m.exclusive || [];
      return (
        <div key={q.id}>{label}{hint}{info}
          {forced.length > 0 && <div style={{ fontSize: 12, color: C.amberText, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><IcLock width={12} height={12}/> خيارات إلزامية في حالتكم ولا يمكن إلغاؤها: {forced.join("، ")}</div>}
          {(q.options || []).map((o, i) => {
            const on = vals.includes(o) || forced.includes(o); const locked = forced.includes(o); const isNeg = excl.includes(o);
            return (
              <label key={i} title={locked ? "خيار إلزامي" : isNeg ? "اختياره يلغي بقية الخيارات" : ""}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, marginBottom: 4, cursor: locked ? "not-allowed" : "pointer", border: `1.5px solid ${on ? C.primary : C.grayBorder}`, background: on ? `${C.primary}08` : "transparent", opacity: locked ? 0.85 : 1, marginTop: isNeg ? 8 : 0 }}>
                <input type="checkbox" checked={on} disabled={locked} onChange={() => !locked && toggle(o)} style={{ accentColor: C.primary }} />
                <span style={{ fontSize: 13 }}>{o}</span>
                {locked && <span style={{ marginInlineStart: "auto", color: C.gray, display: "inline-flex" }}><IcLock width={12} height={12}/></span>}
              </label>
            );
          })}
          {otherBox}
        </div>
      );
    }
    if (q.type === "yesno") return (
      <div key={q.id}>{label}{hint}{info}
        {["نعم", "لا"].map((o) => (
          <label key={o} onClick={() => setAns(q.id, o)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 8, marginLeft: 8, cursor: "pointer", border: `1.5px solid ${getAns(q.id) === o ? C.primary : C.grayBorder}`, background: getAns(q.id) === o ? `${C.primary}08` : "transparent" }}>
            <input type="radio" checked={getAns(q.id) === o} onChange={() => setAns(q.id, o)} style={{ accentColor: C.primary }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{o}</span>
          </label>
        ))}
        {otherBox}
      </div>
    );
    if (q.type === "scale") return (
      <div key={q.id}>{label}{hint}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setAns(q.id, String(n))} style={{ width: 44, height: 44, borderRadius: 10, border: `2px solid ${String(getAns(q.id)) === String(n) ? C.primary : C.grayBorder}`, background: String(getAns(q.id)) === String(n) ? C.primary : "#fff", color: String(getAns(q.id)) === String(n) ? "#fff" : C.gray, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{n}</button>
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
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, fontSize: 20, marginBottom: 12 }}>←</button>
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
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, fontSize: 20 }}>←</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>{policyType?.name}</h2>
        </div>
        {!readOnly && (
          <button onClick={() => setDemoConfirm(true)} style={{ fontSize: 12, color: C.blue, background: C.blueLight, border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <IcBeaker width={14} height={14}/> تعبئة تجريبية
          </button>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.gray }}>القسم الحالي: {section + 1} من {apiSections.length} · أجبت عن {answeredCount} من {allQuestions.length} سؤالًا</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }} title="تُحسب من الأسئلة المكتملة (الظاهرة) ولا تتغير بمجرد التنقل بين الأقسام">نسبة استكمال الإجابات {completionPct}%</span>
        </div>
        <ProgressBar percent={completionPct} />
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
                fontWeight: active ? 700 : 400, fontFamily: "inherit",
                background: active ? C.primary : done ? C.greenLight : locked ? '#F3EFE8' : C.grayLight,
                color: active ? "white" : done ? C.green : locked ? '#8C97A3' : C.gray,
                border: locked ? `1px dashed #D9D3C7` : "none",
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

      <div id="pq-top" />
      {isSent && (
        <div style={{ marginBottom: 12, padding: "12px 16px", background: C.blueLight, border: `1.5px solid ${C.blue}40`, borderRadius: 10, fontSize: 13, color: "#1B5E9E", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, lineHeight: 1.8 }}>
          <IcCheckCircle width={18} height={18}/> أُرسلت هذه السياسة للمستشار{sentDate ? ` في ${sentDate}` : ""} — بانتظار مراجعته، ولا يلزمك إدخالها مرة أخرى. يمكنك التعديل وإعادة الإرسال إن احتجت.
        </div>
      )}
      {!readOnly && !isSent && selection?.status !== "approved" && allSectionsComplete && (
        <div style={{ marginBottom: 12, padding: "12px 16px", background: C.greenLight, border: `1.5px solid ${C.green}50`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#086449", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <IcCheckCircle width={18} height={18}/> أكملت جميع الأقسام — الخطوة الأخيرة: أرسل السياسة لمراجعة المستشار
          </span>
          <Btn onClick={submitNow} disabled={loading}>{loading ? "جارٍ الإرسال..." : selection?.status === "revision" ? "إعادة الإرسال الآن" : "إرسال هذه السياسة الآن"}</Btn>
        </div>
      )}
      {selection?.status === "revision" && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: C.amberSoft, borderRadius: 8, fontSize: 12, color: C.amberText, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <IcArrowPath width={14} height={14}/> طلب المستشار تعديلاً — عدّل الإجابات وأعد الإرسال
        </div>
      )}
      {!readOnly && validErr && missingNow.length > 0 && (
        <div style={{ marginBottom: 12, padding: "12px 16px", background: C.redLight, border: `1.5px solid ${C.red}40`, borderRadius: 10, fontSize: 13, color: C.red, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IcWarning width={16} height={16}/> {`بقي ${missingNow.length} من الأسئلة في هذا القسم يحتاج إلى إجابة أو تصحيح — ميّزناها لك باللون الأحمر مع سبب كل واحدة`}
        </div>
      )}

      <Card>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 6 }}>القسم {section + 1}: {currentSection?.name}</h3>
        <p style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>
          {readOnly ? 'استعراض إجاباتك على هذا القسم' : 'أجب على الأسئلة التالية — سيتم توليد السياسة تلقائياً بناءً على إجاباتك'}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, pointerEvents: readOnly ? 'none' : 'auto', opacity: readOnly ? 0.85 : 1 }}>
          {(currentSection?.questions || []).filter(q => isVisible(q, answers)).map(q => {
            const liveMsg = !readOnly && isFilled(answers[`q${q.id}`]) && evaluate(q, answers).status === 'invalid' ? evaluate(q, answers).msg : null;
            const flagged = missingNow.includes(q.id);
            return (
              <div key={q.id} id={`pq-${q.id}`} style={flagged || liveMsg ? { border: `1.5px solid ${C.red}`, background: "#FFF7F7", borderRadius: 10, padding: 12 } : undefined}>
                {renderQuestion(q)}
                {(flagged || liveMsg) && <div role="alert" style={{ fontSize: 12, color: C.red, fontWeight: 700, marginTop: 6 }}>{liveMsg || problemMsg(q.id) || "هذا السؤال مطلوب"}</div>}
              </div>
            );
          })}
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
              <Btn onClick={submitNow} disabled={loading}>
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
// حالة كل سياسة واضحة: لم تبدأ / قيد التعبئة (كم سؤالًا) / مكتملة لم تُرسل / أُرسلت وبانتظار المستشار / تحتاج تعديلًا / معتمدة
const workState = (sel) => {
  if (sel.status === "approved") return "approved";
  if (sel.status === "revision") return "revision";
  if (["submitted", "reviewing"].includes(sel.status)) return "sent";
  if (sel.completion?.complete) return "ready";
  if (sel.status === "in_progress" || (sel.completion?.answered || 0) > 0) return "progress";
  return "new";
};

const WORK_STATE = {
  new:      { label: "لم تبدأ بعد",                     color: C.gray,      bg: C.grayLight,  border: "transparent" },
  progress: { label: "قيد التعبئة",                     color: C.amberText, bg: C.amberSoft,  border: `${C.amber}40` },
  ready:    { label: "مكتملة — لم تُرسل بعد",            color: "#7F310E",   bg: "#FDE2D2",    border: C.amber },
  sent:     { label: "أُرسلت — بانتظار مراجعة المستشار", color: "#1B5E9E",   bg: C.blueLight,  border: `${C.blue}60` },
  revision: { label: "طلب المستشار تعديلًا",             color: C.amberText, bg: C.amberSoft,  border: C.amber },
  approved: { label: "معتمدة",                           color: C.green,     bg: C.greenLight, border: `${C.green}60` },
};

const StepWork = ({ policyTypes, selections, onSave, onSubmit, loading, externalEditId, onExternalEditDone, onView, notice, onDismissNotice, onGoReview }) => {
  const [active, setActive] = useState(externalEditId || null);
  const [sendingId, setSendingId] = useState(null);

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

  const sendOne = async (sel) => {
    setSendingId(sel.id);
    try { await onSubmit(sel.id, sel.form_data || {}); } finally { setSendingId(null); }
  };
  const sendAllReady = async (list) => {
    for (const sel of list) {
      setSendingId(sel.id);
       
      const ok = await onSubmit(sel.id, sel.form_data || {});
      if (!ok) break;
    }
    setSendingId(null);
  };

  if (active) {
    const sel     = selections.find(s => s.id === active);
    const polType = policyTypes.find(p => p.id === sel?.policy_type_id);
    return <QuestionnaireView selection={sel} policyType={polType} onSave={onSave} onSubmit={handleSubmitAndClose} onBack={handleClose} loading={loading} />;
  }

  const states   = selections.map(workState);
  const sentN    = states.filter(st => ["sent", "approved"].includes(st)).length;
  const ready    = selections.filter((_, i) => states[i] === "ready");
  const revision = states.filter(st => st === "revision").length;
  const allSent  = selections.length > 0 && sentN === selections.length;
  const nextText = ready.length > 0
    ? `لديك ${ready.length === 1 ? "سياسة مكتملة لم تُرسل" : `${ready.length} سياسات مكتملة لم تُرسل`} — اضغط «إرسال للمراجعة» ليبدأ المستشار مراجعتها.`
    : revision > 0 ? "طلب المستشار تعديلات — افتح السياسة المعلَّمة، عدّل الإجابات ثم أعد إرسالها."
    : allSent ? "أُرسلت جميع السياسات ✓ — المستشار يراجعها الآن، وستصلك إشعارات عند الاعتماد أو طلب التعديل. لا يلزمك إدخال أي بيانات أخرى."
    : "افتح كل سياسة وأجب عن أسئلتها، ثم أرسلها لمراجعة المستشار.";

  return (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 6 }}>تعبئة الاستمارات ومشاهدة الفيديوهات</h2>
      <p style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>اضغط على أي سياسة لتعبئة استبيانها، وبعد اكتمالها أرسلها لمراجعة المستشار.</p>

      {notice && (
        <div role="status" style={{ marginBottom: 14, padding: "12px 16px", background: /تعذّر/.test(notice) ? C.amberSoft : C.greenLight, border: `1.5px solid ${/تعذّر/.test(notice) ? C.amber : C.green}50`, borderRadius: 12, fontSize: 13, color: /تعذّر/.test(notice) ? C.amberText : "#086449", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><IcCheckCircle width={18} height={18}/>{notice}</span>
          <button onClick={onDismissNotice} aria-label="إغلاق" style={{ background: "none", border: "none", cursor: "pointer", color: "#086449", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* ملخّص التقدّم والخطوة التالية */}
      <Card style={{ marginBottom: 18, border: `1.5px solid ${ready.length ? C.amber : allSent ? `${C.green}50` : C.grayBorder}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>أُرسل {sentN} من {selections.length} {selections.length === 1 ? "سياسة" : "سياسات"} للمراجعة</div>
          {ready.length > 1 && (
            <Btn onClick={() => sendAllReady(ready)} disabled={loading || !!sendingId}>إرسال جميع المكتملة ({ready.length})</Btn>
          )}
          {allSent && onGoReview && <Btn variant="secondary" onClick={onGoReview}>متابعة مراجعة المستشار ←</Btn>}
        </div>
        <ProgressBar percent={selections.length ? (sentN / selections.length) * 100 : 0} />
        <p style={{ fontSize: 13, color: ready.length ? "#7F310E" : allSent ? "#086449" : C.gray, fontWeight: 600, margin: "10px 0 0", lineHeight: 1.8 }}>{nextText}</p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "var(--g-3)", gap: 14, marginBottom: 20 }}>
        {selections.map((sel, i) => {
          const p   = policyTypes.find(x => x.id === sel.policy_type_id) || sel.policy_type;
          const st  = states[i];
          const cfg = WORK_STATE[st];
          const c   = sel.completion;
          const sentDate = sel.submitted_at ? new Date(sel.submitted_at).toLocaleDateString("ar-SA-u-ca-gregory", { day: "numeric", month: "long" }) : null;
          return (
            <Card key={sel.id} style={{ textAlign: "center", border: `2px solid ${cfg.border}`, display: "flex", flexDirection: "column" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: cfg.color }}>
                {["sent", "approved"].includes(st) ? <IcCheckCircle width={26} height={26}/> : <IcDocument width={26} height={26}/>}
              </div>
              {p?.code && <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, direction: "ltr" }}>{p.code}</div>}
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginTop: 2 }}>{p?.name || "سياسة"}</h3>
              <div style={{ marginTop: 10 }}>
                <span data-state={st} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
                  {["sent", "approved"].includes(st) && <IcCheck width={11} height={11}/>}{cfg.label}
                </span>
              </div>

              {c && c.total > 0 && !["sent", "approved"].includes(st) && (
                <div style={{ marginTop: 10, textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>أجبت عن {c.answered} من {c.total} سؤالًا{c.required_missing > 0 ? ` — بقي ${c.required_missing} مطلوبًا` : ""}</div>
                  <ProgressBar percent={(c.answered / c.total) * 100} />
                </div>
              )}
              {st === "sent" && (
                <div style={{ fontSize: 12, color: "#1B5E9E", marginTop: 8, lineHeight: 1.7 }}>
                  {sentDate ? `أُرسلت في ${sentDate}. ` : ""}لا يلزمك إدخالها مرة أخرى.
                </div>
              )}
              {st === "revision" && sel.consultant_notes && (
                <div style={{ marginTop: 10, padding: "8px 10px", background: C.amberSoft, borderRadius: 8, fontSize: 12, color: C.amberText, textAlign: "right", lineHeight: 1.7 }}>
                  <span style={{ display: "inline-flex", alignItems: "flex-start", gap: 4 }}><IcChat width={12} height={12}/>{sel.consultant_notes}</span>
                </div>
              )}

              <div style={{ marginTop: "auto", paddingTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                {st === "ready" && (
                  <>
                    <Btn full onClick={() => sendOne(sel)} disabled={loading || !!sendingId}>{sendingId === sel.id ? "جارٍ الإرسال..." : "إرسال للمراجعة"}</Btn>
                    <Btn variant="ghost" small full onClick={() => setActive(sel.id)}>مراجعة الإجابات قبل الإرسال</Btn>
                  </>
                )}
                {st === "new" && <Btn full variant="secondary" onClick={() => setActive(sel.id)}>ابدأ التعبئة</Btn>}
                {st === "progress" && <Btn full variant="secondary" onClick={() => setActive(sel.id)}>متابعة التعبئة</Btn>}
                {st === "revision" && <Btn full onClick={() => setActive(sel.id)}>تعديل وإعادة الإرسال</Btn>}
                {st === "sent" && (
                  <>
                    <Btn full variant="secondary" onClick={() => onView && onView(sel.id)}>عرض الإجابات</Btn>
                    <Btn variant="ghost" small full onClick={() => setActive(sel.id)}>تعديل وإعادة الإرسال</Btn>
                  </>
                )}
                {st === "approved" && <Btn full variant="secondary" onClick={() => onView && onView(sel.id)}>استعراض</Btn>}
              </div>
            </Card>
          );
        })}
      </div>
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
    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 6 }}>مراجعة المستشار — السياسات واللوائح</h2>
    <Card style={{ marginBottom: 16, padding: "16px 20px", background: C.blueLight, borderRight: `4px solid ${C.blue}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: C.blue }}><IcSearch width={24} height={24}/></span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>جاري مراجعة السياسات</div>
            <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.7 }}>أرسلت استماراتك ✓ — لا يلزمك إدخال أي بيانات الآن. ستصلك إشعارات عند اعتماد أي سياسة أو طلب تعديل عليها (تُحدَّث الحالة تلقائيًا).</div>
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
          <div key={sel.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "14px 16px", borderBottom: i < selections.length - 1 ? `1px solid ${C.grayLight}` : "none", background: sel.status === "revision" ? C.amberSoft : "transparent" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, flex: "1 1 240px" }}>
              <span style={{ color: C.primary }}><IcDocument width={20} height={20}/></span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p?.name || "سياسة"}</div>
                {sel.status === "revision" && sel.consultant_notes && (
                  <div style={{ fontSize: 12, color: C.amberText, marginTop: 4, lineHeight: 1.7, display: "flex", gap: 4 }}><IcChat width={12} height={12}/>ملاحظة المستشار: {sel.consultant_notes}</div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {statusBadge(sel.status)}
              <button onClick={() => onView && onView(sel.id)}
                style={{ fontSize: 11, color: C.blue, background: C.blueLight, border: `1px solid ${C.blue}30`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, whiteSpace: "nowrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><IcEye width={11} height={11}/>عرض</span>
              </button>
              {canEdit && (
                <button onClick={() => onEdit(sel.id)} style={{ fontSize: 11, color: C.primary, background: `${C.primary}10`, border: `1px solid ${C.primary}30`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><IcPencil width={11} height={11}/>تعديل</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </Card>

    {allApproved && (
      <div style={{ background: '#C9EFE1', border: '1.5px solid #7FD3B5', borderRadius: 12, padding: '18px 22px', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}><DfIcon name="party" size={28} /></span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#086449' }}>تهانينا! تم اعتماد جميع السياسات</div>
            <div style={{ fontSize: 12, color: '#086449', marginTop: 2 }}>انتقل للخطوة التالية لمراجعة الاعتماد النهائي</div>
          </div>
        </div>
        <button
          onClick={handleProceed}
          disabled={proceeding}
          style={{ padding: '11px 26px', background: proceeding ? '#8C97A3' : C.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: proceeding ? 'not-allowed' : 'pointer', fontFamily: "inherit", whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(35,93,127,0.3)' }}
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
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#0B7F5D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 8 }}>تم اعتماد السياسات!</h2>
    <p style={{ fontSize: 14, color: C.gray, marginBottom: 8 }}>تهانينا! تم اعتماد جميع السياسات المحددة من المستشار.</p>

    {selections?.length > 0 && onView && (
      <div style={{ marginBottom: 20, textAlign: 'right', maxWidth: 400, margin: '0 auto 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8, textAlign: 'center' }}>استعراض السياسات المعتمدة</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {selections.map(sel => {
            const p = policyTypes?.find(x => x.id === sel.policy_type_id) || sel.policy_type;
            return (
              <button key={sel.id} onClick={() => onView(sel.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.green}30`, background: C.greenLight, cursor: 'pointer', fontFamily: "inherit" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{p?.name || 'سياسة'}</span>
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
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <div style={{ fontSize: 11, color: C.gray }}>المستشار المشرف</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{workflow.consultant.name}</div>
        </Card>
      </div>
    )}
    <Btn onClick={onNext}>التالي: تحميل السياسات ←</Btn>
  </div>
);

// ── Step 6: Download ──────────────────────────────────────────────────────────
const StepDownload = ({ policyTypes, selections, workflow, onNext, onDownload, onTemplateDownload, loadingId, onView }) => (
  <div className="animate-in">
    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8, textAlign: "center" }}>تحميل السياسات</h2>
    <p style={{ fontSize: 12, color: C.gray, textAlign: "center", marginBottom: 20, lineHeight: 1.7 }}>
      لكل سياسة ملف بحقول التخصيص الخاصة بجهتك، والنموذج المرجعي الكامل (الإصدار 3.0) بصيغتي Word وPDF.
      <br/>الوثائق نماذج استرشادية تصبح نافذة بعد صدور قرار الاعتماد من صاحب الصلاحية في جهتك.
    </p>
    {selections.map(sel => {
      const p = policyTypes.find(x => x.id === sel.policy_type_id) || sel.policy_type;
      const canTemplate = p?.has_template && sel.status === "approved" && onTemplateDownload;
      const tplBtn = { fontSize: 11, color: C.amberText, background: `${C.amber}10`, border: `1px solid ${C.amberLine}30`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 };
      return (
        <Card key={sel.id} style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.primaryDeep, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><IcDocument width={20} height={20}/></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p?.name || "سياسة"}</div>
              <div style={{ fontSize: 11, color: C.gray }}>{p?.code ? `${p.code} — ` : ""}حقول التخصيص — PDF</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {canTemplate && ["docx", "pdf"].map(fmt => (
              <button key={fmt} onClick={() => onTemplateDownload(sel, fmt)} disabled={loadingId === `${sel.id}-${fmt}`} style={tplBtn}>
                {loadingId === `${sel.id}-${fmt}` ? "جارٍ التحميل..." : `النموذج المرجعي ${fmt === "pdf" ? "PDF" : "Word"}`}
              </button>
            ))}
            {onView && (
              <button onClick={() => onView(sel.id)}
                style={{ fontSize: 11, color: C.primary, background: `${C.primary}10`, border: `1px solid ${C.primary}30`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
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
  // حالة شاشة الاختيار → المتطلبات → الدفع (تُعرَّف هنا قبل أي return مبكر حفاظًا على ترتيب الـhooks)
  const [subStep,    setSubStep]    = useState('choice');
  const [briefPage,  setBriefPage]  = useState(1); // 1 or 2 within brief
  const [brief,      setBrief]      = useState({
    // هوية المنظمة
    org_name:    '', org_name_en: '', org_type:   '',
    org_slogan:  '', org_phone:   '', org_email:  '',
    org_website: '', org_city:    '',
    // التصميم
    design_scope: 'unified',           // 'unified' | 'color_coded' | 'per_policy'
    primary_color: '#235D7F', secondary_color: '#A33F12',
    design_style:  'corporate',        // 'modern' | 'corporate' | 'classic'
    language:      'arabic',           // 'arabic' | 'english' | 'bilingual'
    include_cover: true, include_toc: true,
    notes: '',
  });
  const [logoFile,   setLogoFile]   = useState(null);
  const [logoPreview,setLogoPreview]= useState(null);

  const designStatus   = workflow?.design_status;
  const isCompleted    = workflow?.status === 'completed';
  const wantedDesign   = workflow?.want_design;
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
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", color: C.primary }}><IcClock width={52} height={52}/></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginBottom: 8 }}>
          {designStatus === 'revision_requested' ? 'تم طلب التعديل — بانتظار التصميم المعدّل' : 'تم الدفع — بانتظار رفع التصميم'}
        </h2>
        <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.8, marginBottom: 20 }}>
          {designStatus === 'revision_requested'
            ? 'تم إرسال ملاحظاتك لفريق التصميم. سيتم رفع التصميم المعدّل في أقرب وقت.'
            : 'تم استلام دفعتك بنجاح. سيقوم فريق التصميم بمنصة دفة برفع التصميم الاحترافي خلال 3-5 أيام عمل.'}
        </p>

        {workflow?.design_revision_notes && (
          <Card style={{ marginBottom: 16, textAlign: "right", border: `1px solid ${C.amberLine}50`, background: C.yellowLight }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.amberText, marginBottom: 4 }}>ملاحظات التعديل المُرسلة:</div>
            <div style={{ fontSize: 12, color: C.ink }}>{workflow.design_revision_notes}</div>
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 12, marginBottom: 20 }}>
          {[
            ["الجهة المنفذة",   'فريق التصميم — دفة', <IcUser key="User" width={20} height={20}/>],
            ["تاريخ الدفع",     paidAt,               <IcCalendar key="Calendar" width={20} height={20}/>],
            ["المبلغ المدفوع",  `${(workflow?.design_fee ?? price).toLocaleString('en-US')} ريال`, <IcCreditCard key="CreditCard" width={20} height={20}/>],
            ["عدد السياسات",    `${selCount} سياسة`,  <IcScroll key="Scroll" width={20} height={20}/>],
          ].map(([lbl, val, icon]) => (
            <Card key={lbl} style={{ padding: "12px 14px", textAlign: "center" }}>
              <div style={{ marginBottom: 3, display: "flex", justifyContent: "center", color: C.primary }}>{icon}</div>
              <div style={{ fontSize: 10, color: C.gray, marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{val}</div>
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
          <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", color: C.amberText }}><IcPalette width={48} height={48}/></div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginBottom: 6 }}>التصميم الاحترافي جاهز للمراجعة</h2>
          <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.8 }}>
            قام <strong>فريق التصميم</strong> برفع التصميم الاحترافي لمنظمتك. يرجى المراجعة ثم الاعتماد أو طلب التعديل.
          </p>
        </div>

        {/* معاينة الملف */}
        {designFileUrl && (
          <Card style={{ marginBottom: 16, textAlign: "center", border: `2px dashed ${C.primary}40` }}>
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", color: C.primary }}><IcDocument width={40} height={40}/></div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 12 }}>ملف التصميم</div>
            <a href={designFileUrl} target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 8, background: C.primary, color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              <IcEye width={14} height={14}/> معاينة / تحميل التصميم
            </a>
          </Card>
        )}

        {!showRevision ? (
          <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 12 }}>
            <Btn variant="success" full onClick={onApprove} disabled={loading}>
              {loading ? "جارٍ المعالجة..." : "اعتماد التصميم النهائي"}
            </Btn>
            <Btn variant="secondary" full onClick={() => setShowRevision(true)} disabled={loading}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><IcPencil width={12} height={12}/>طلب تعديل</span>
            </Btn>
          </div>
        ) : (
          <Card style={{ border: `1px solid ${C.amberLine}60` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>اذكر ملاحظات التعديل المطلوبة:</div>
            <textarea value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)}
              placeholder="مثال: يرجى تغيير لون الشعار وتعديل الخط..."
              style={{ width: "100%", minHeight: 90, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.grayBorder}`, fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
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
    <div style={{ background: '#E8F8F2', borderRadius: 14, border: '1px solid #A9E4CF', padding: 20, marginBottom: 20, textAlign: 'right' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#086449', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <IcSparkles width={15} height={15} /> اكتملت رحلتك الإدارية الكاملة!
      </div>
      {[
        { icon: <DfIcon name="chart" size={20} />, label: 'التخطيط الاستراتيجي', note: 'وضع رؤية وأهداف المنظمة' },
        { icon: <DfIcon name="clipboard" size={20} />, label: 'التخطيط التشغيلي',   note: 'تحويل الأهداف إلى خطط عمل' },
        { icon: <DfIcon name="scroll" size={20} />, label: 'السياسات واللوائح',  note: 'بناء الإطار التنظيمي والحوكمة' },
      ].map((s, i, arr) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #A9E4CF50' : 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#C9EFE1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#086449' }}>{s.label}</div>
            <div style={{ fontSize: 11, color: C.gray }}>{s.note}</div>
          </div>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0B7F5D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          <span style={{ fontSize: 38 }}><DfIcon name="party" size={38} /></span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 8 }}>تم اعتماد التصميم النهائي</h2>
        <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.8, marginBottom: 20 }}>
          اكتمل نظام السياسات واللوائح مع التصميم الاحترافي المعتمد بهوية منظمتك.
        </p>
        {designFileUrl && (
          <a href={designFileUrl} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 24px", borderRadius: 10, background: C.primary, color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none", marginBottom: 20 }}>
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
          <span style={{ fontSize: 38 }}><DfIcon name="party" size={38} /></span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 8 }}>اكتملت السياسات واللوائح</h2>
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

  const orgTypes  = ['شركة','مؤسسة','جمعية','هيئة حكومية','مؤسسة تعليمية','أخرى'];
  const styleOpts = [
    { key: 'modern',    label: 'عصري وبسيط',     icon: <DfIcon name="sparkle" size={20} />, desc: 'مساحات واسعة، ألوان فاتحة' },
    { key: 'corporate', label: 'مؤسسي واحترافي',  icon: <DfIcon name="building" size={20} />, desc: 'رسمي ومهني، مناسب للجهات الحكومية' },
    { key: 'classic',   label: 'كلاسيكي وأنيق',   icon: <DfIcon name="scroll" size={20} />, desc: 'تقليدي بتفاصيل دقيقة' },
  ];
  const langOpts  = [
    { key: 'arabic',    label: 'عربي فقط',    flag: '🇸🇦' },
    { key: 'english',   label: 'إنجليزي فقط', flag: '🇺🇸' },
    { key: 'bilingual', label: 'ثنائي اللغة', flag: <DfIcon name="globe" size={20} /> },
  ];
  const scopeOpts = [
    { key: 'unified',    icon: <DfIcon name="clipboard" size={20} />, label: 'تصميم موحد للجميع',
      desc: `نفس القالب الاحترافي لجميع السياسات بهوية بصرية واحدة — موصى به (${selCount} سياسة بسعر واحد)` },
    { key: 'color_coded', icon: <DfIcon name="palette" size={20} />, label: 'قالب موحد بلون مختلف لكل سياسة',
      desc: 'نفس التصميم لكن كل سياسة بلون تمييزي خاص بها — سهل التمييز بين الوثائق' },
    { key: 'per_policy',  icon: <DfIcon name="brush" size={20} />, label: 'تصميم مستقل لكل سياسة',
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
        <div style={{ width: 52, height: 52, background: C.amber, transform: 'rotate(45deg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <IcPalette width={26} height={26} style={{ transform: 'rotate(-45deg)', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 6 }}>هل تود تصميم احترافي لسياساتك؟</h2>
        <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.8 }}>
          تم اعتماد <strong>{selCount}</strong> {selCount === 1 ? 'سياسة' : 'سياسات'} بنجاح. يمكنك الحصول على وثائق رسمية مصممة بهوية منظمتك.
        </p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
          {selections?.map(s => <span key={s.id} style={{ padding: '3px 12px', borderRadius: 20, background: `${C.primary}15`, color: C.primary, fontSize: 11, fontWeight: 600 }}>{s.policy_type?.name}</span>)}
        </div>
      </div>

      {/* ما الذي يشمله التصميم */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 6px rgba(14,42,61,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 12 }}><DfIcon name="box" size={14} style={{ marginInlineEnd: 6 }} />ماذا يشمل التصميم الاحترافي؟</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 8 }}>
          {[
            ['صفحة غلاف', 'غلاف احترافي لكل سياسة بشعار منظمتك'],
            ['فهرس المحتوى', 'جدول محتويات مرتب وقابل للتنقل'],
            ['هوية بصرية', 'ألوانك وخطوطك المفضلة في كل الصفحات'],
            ['تنسيق احترافي', 'ترقيم صفحات، رأس وتذييل مع معلومات منظمتك'],
            ['تصميم الأقسام', 'فواصل وعناوين أقسام بتصميم متناسق'],
            ['ملف PDF جاهز', 'وثيقة نهائية جاهزة للطباعة والنشر الرسمي'],
          ].map(([icon_label, desc]) => (
            <div key={icon_label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', background: '#FBF9F5', borderRadius: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, minWidth: 100 }}>{icon_label}</span>
              <span style={{ fontSize: 11, color: C.gray, lineHeight: 1.5 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* الخيارات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 14, marginBottom: 14 }}>
        {/* لا شكراً */}
        <Card style={{ border: `2px solid ${C.grayBorder}`, textAlign: 'center' }}>
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center', color: '#8C97A3', fontSize: 36 }}><DfIcon name="file" size={36} /></div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>التصميم التلقائي</h3>
          <p style={{ fontSize: 11, color: C.gray, lineHeight: 1.7, marginBottom: 12 }}>
            وثيقة نصية بسيطة جاهزة للتحميل<br />
            <span style={{ color: C.green, fontWeight: 600 }}>بدون رسوم إضافية</span>
          </p>
          <div style={{ padding: '8px 10px', background: '#FBF9F5', borderRadius: 8, fontSize: 10, color: C.gray, marginBottom: 14, textAlign: 'right', lineHeight: 1.6 }}>
            ✓ تنزيل PDF فوري<br/>
            ✗ بدون شعار أو هوية بصرية<br/>
            ✗ تصميم موحد لجميع المنظمات
          </div>
          <Btn variant="secondary" full onClick={() => onComplete(false, null)} disabled={loading}>متابعة بدون تصميم</Btn>
        </Card>

        {/* التصميم الاحترافي */}
        <Card style={{ border: `2px solid ${C.amberLine}`, background: `${C.amber}05` }}>
          <div style={{ background: C.amber, color: '#0E2A3D', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>موصى به</div>
          <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center', color: C.amberText, fontSize: 32 }}><DfIcon name="palette" size={32} /></div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6, textAlign: 'center' }}>تصميم بهوية منظمتك</h3>
          <p style={{ fontSize: 11, color: C.gray, lineHeight: 1.7, marginBottom: 10, textAlign: 'center' }}>
            وثيقة احترافية كاملة بشعارك وألوانك<br />
            لجميع السياسات الـ{selCount} المعتمدة
          </p>
          <div style={{ padding: '8px 10px', background: `${C.amber}10`, borderRadius: 8, fontSize: 10, color: '#7F310E', marginBottom: 10, textAlign: 'right', lineHeight: 1.6 }}>
            ✓ شعار منظمتك في كل صفحة<br/>
            ✓ ألوانك وهويتك البصرية الكاملة<br/>
            ✓ خيار تصميم مستقل لكل سياسة
          </div>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.gray }}>لجميع السياسات الـ{selCount}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.amberText }}>{total.toLocaleString('en-US')} ريال</div>
            <div style={{ fontSize: 10, color: C.gray }}>شامل ضريبة القيمة المضافة 15%</div>
          </div>
          <Btn full onClick={() => { setSubStep('brief'); setBriefPage(1); }}>
            ابدأ وأدخل متطلباتك ←
          </Btn>
        </Card>
      </div>

      <div style={{ padding: '10px 14px', background: '#E8F8F2', borderRadius: 10, fontSize: 11, color: '#086449', textAlign: 'center' }}>
        <DfIcon name="lock" size={18} style={{ marginInlineEnd: 6 }} />الدفع آمن ومشفر — سيتم بدء التصميم خلال 3-5 أيام عمل بعد إتمام الدفع
      </div>
    </div>
  );

  // ── شاشة المتطلبات (صفحتان) ──
  if (subStep === 'brief') {
    const prog = briefPage === 1 ? 50 : 100;
    return (
    <div className="animate-in" style={{ maxWidth: 580, margin: '0 auto' }}>
      {/* Progress bar */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '14px 20px', marginBottom: 14, boxShadow: '0 1px 6px rgba(14,42,61,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
            {briefPage === 1 ? 'هوية المنظمة' : 'تفضيلات التصميم'}
          </span>
          <span style={{ fontSize: 11, color: C.gray }}>{briefPage}/2</span>
        </div>
        <div style={{ height: 6, background: C.grayBorder, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${prog}%`, height: '100%', background: C.primary, borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 6px rgba(14,42,61,0.06)', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {briefPage === 1 && (<>
          {/* الشعار */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>شعار المنظمة</div>
            <div style={{ fontSize: 11, color: C.gray, marginBottom: 8 }}>سيظهر في رأس وغلاف جميع الوثائق — PNG أو SVG بخلفية شفافة مثالي</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', border: `2px dashed ${logoPreview ? C.primary : C.grayBorder}`, borderRadius: 12, cursor: 'pointer', background: logoPreview ? `${C.primary}05` : '#FBF9F5', transition: 'all 0.2s' }}>
              {logoPreview
                ? <img src={logoPreview} alt="شعار" style={{ height: 60, maxWidth: 120, objectFit: 'contain', borderRadius: 6 }} />
                : <div style={{ width: 60, height: 60, borderRadius: 10, background: C.grayLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}><DfIcon name="image" size={26} /></div>
              }
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: logoPreview ? C.primary : C.ink }}>
                  {logoPreview ? logoFile?.name : 'اضغط لرفع الشعار'}
                </div>
                <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>PNG • JPG • SVG • حد أقصى 5MB</div>
                {logoFile && <button onClick={e => { e.preventDefault(); setLogoFile(null); setLogoPreview(null); }} style={{ fontSize: 10, color: C.red, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>✕ إزالة</button>}
              </div>
              <input type="file" accept=".png,.jpg,.jpeg,.svg,.webp" style={{ display: 'none' }} onChange={handleLogoChange} />
            </label>
          </div>

          {/* الاسم الرسمي */}
          <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>الاسم الرسمي بالعربية <span style={{ color: C.red }}>*</span></div>
              <input value={brief.org_name} onChange={e => upd('org_name', e.target.value)}
                placeholder="جمعية البر الخيرية بالرياض"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${brief.org_name.trim().length >= 2 ? C.primary : C.grayBorder}`, fontSize: 12, fontFamily: "inherit", outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>الاسم بالإنجليزية <span style={{ fontSize: 10, fontWeight: 400, color: C.gray }}>(اختياري)</span></div>
              <input value={brief.org_name_en} onChange={e => upd('org_name_en', e.target.value)}
                placeholder="Al-Birr Charity Society"
                dir="ltr"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 12, fontFamily: "inherit", outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* نوع المنظمة */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>نوع المنظمة <span style={{ color: C.red }}>*</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {orgTypes.map(t => (
                <button key={t} onClick={() => upd('org_type', t)}
                  style={{ padding: '5px 14px', borderRadius: 20, fontSize: 11, fontFamily: "inherit", cursor: 'pointer', fontWeight: brief.org_type === t ? 700 : 400, background: brief.org_type === t ? C.primary : '#FBF9F5', color: brief.org_type === t ? '#fff' : C.gray, border: `1.5px solid ${brief.org_type === t ? C.primary : C.grayBorder}` }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* الشعار النصي والتواصل */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>شعار/وصف المنظمة <span style={{ fontSize: 10, fontWeight: 400, color: C.gray }}>(سيظهر في التذييل)</span></div>
            <input value={brief.org_slogan} onChange={e => upd('org_slogan', e.target.value)}
              placeholder="معاً نبني مجتمعاً أفضل"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 12, fontFamily: "inherit", outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 8 }}>
              {[
                ['org_phone','رقم الهاتف','0112345678'],
                ['org_email','البريد الإلكتروني','info@example.sa'],
                ['org_website','الموقع الإلكتروني','www.example.sa'],
                ['org_city','المدينة','الرياض'],
              ].map(([key, label, ph]) => (
                <div key={key}>
                  <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>{label}</div>
                  <input value={brief[key]} onChange={e => upd(key, e.target.value)}
                    placeholder={ph} dir={key === 'org_website' || key === 'org_email' ? 'ltr' : 'rtl'}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.grayBorder}`, fontSize: 11, fontFamily: "inherit", outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
          </div>
        </>)}

        {briefPage === 2 && (<>
          {/* كيفية التعامل مع السياسات المتعددة */}
          {selCount > 1 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                كيف تريد تصميم سياساتك الـ{selCount}؟ <span style={{ color: C.red }}>*</span>
              </div>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 10 }}>
                لديك {selCount} سياسات معتمدة — اختر طريقة التصميم الأنسب
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scopeOpts.map(o => (
                  <button key={o.key} onClick={() => upd('design_scope', o.key)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'right', fontFamily: "inherit", background: brief.design_scope === o.key ? `${C.primary}10` : '#FBF9F5', border: `2px solid ${brief.design_scope === o.key ? C.primary : C.grayBorder}`, transition: 'all 0.2s' }}>
                    <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{o.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: brief.design_scope === o.key ? 700 : 600, color: brief.design_scope === o.key ? C.primary : C.ink }}>{o.label}</div>
                      <div style={{ fontSize: 11, color: C.gray, marginTop: 3, lineHeight: 1.5 }}>{o.desc}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${brief.design_scope === o.key ? C.primary : C.grayBorder}`, background: brief.design_scope === o.key ? C.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      {brief.design_scope === o.key && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* الألوان */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>ألوان الهوية البصرية</div>
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
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.ink, fontWeight: 600 }}>{brief[k]}</div>
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
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>نمط التصميم</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {styleOpts.map(s => (
                <button key={s.key} onClick={() => upd('design_style', s.key)}
                  style={{ flex: 1, padding: '10px 6px', borderRadius: 10, fontSize: 11, fontFamily: "inherit", cursor: 'pointer', textAlign: 'center', background: brief.design_style === s.key ? `${C.primary}12` : '#FBF9F5', color: brief.design_style === s.key ? C.primary : C.gray, border: `1.5px solid ${brief.design_style === s.key ? C.primary : C.grayBorder}`, fontWeight: brief.design_style === s.key ? 700 : 400 }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                  <div>{s.label}</div>
                  <div style={{ fontSize: 10, color: C.gray, marginTop: 3 }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* اللغة */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>لغة الوثائق</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {langOpts.map(l => (
                <button key={l.key} onClick={() => upd('language', l.key)}
                  style={{ flex: 1, padding: '9px 6px', borderRadius: 10, fontSize: 12, fontFamily: "inherit", cursor: 'pointer', textAlign: 'center', background: brief.language === l.key ? C.primary : '#FBF9F5', color: brief.language === l.key ? '#fff' : C.gray, border: `1.5px solid ${brief.language === l.key ? C.primary : C.grayBorder}`, fontWeight: brief.language === l.key ? 700 : 400 }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{l.flag}</div>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* خيارات إضافية */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8 }}>عناصر الوثيقة</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                ['include_cover', 'صفحة غلاف لكل سياسة'],
                ['include_toc',   'جدول المحتويات'],
              ].map(([k, label]) => (
                <button key={k} onClick={() => upd(k, !brief[k])}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, fontSize: 12, fontFamily: "inherit", cursor: 'pointer', background: brief[k] ? `${C.primary}12` : '#FBF9F5', color: brief[k] ? C.primary : C.gray, border: `1.5px solid ${brief[k] ? C.primary : C.grayBorder}`, fontWeight: brief[k] ? 700 : 400 }}>
                  <span style={{ fontSize: 16 }}>{brief[k] ? <DfIcon name="check" size={20} /> : '⬜'}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
              ملاحظات وتعليمات إضافية للمصمم <span style={{ fontWeight: 400, color: C.gray }}>(اختياري)</span>
            </div>
            <textarea value={brief.notes} onChange={e => upd('notes', e.target.value)} rows={3}
              placeholder="مثال: أريد خطاً عربياً رسمياً، لا أريد خلفيات داكنة، أرجو أن يكون التصميم محافظاً..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 12, fontFamily: "inherit", resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.7 }} />
          </div>
        </>)}
      </div>

      {/* التنقل بين الصفحتين */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button
          onClick={() => briefPage === 1 ? setSubStep('choice') : setBriefPage(1)}
          style={{ padding: '10px 20px', background: 'none', border: `1.5px solid ${C.grayBorder}`, borderRadius: 10, fontSize: 13, color: C.gray, cursor: 'pointer', fontFamily: "inherit" }}>
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
      <div style={{ background: `${C.primary}08`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, border: `1px solid ${C.primary}20`, direction: 'rtl' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 8 }}>ملخص المتطلبات المُدخلة:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {logoPreview && <img src={logoPreview} alt="شعار" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, border: `1px solid ${C.grayBorder}` }} />}
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: `${C.primary}15`, color: C.primary }}>{brief.org_name}</span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: `${C.primary}15`, color: C.primary }}>{brief.org_type}</span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: `${C.primary}15`, color: C.primary }}>{styleOpts.find(s => s.key === brief.design_style)?.label}</span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: `${C.primary}15`, color: C.primary }}>{langOpts.find(l => l.key === brief.language)?.label}</span>
          <span title={brief.primary_color} style={{ width: 22, height: 22, borderRadius: '50%', background: brief.primary_color, border: `1px solid ${C.grayBorder}` }} />
          <span title={brief.secondary_color} style={{ width: 22, height: 22, borderRadius: '50%', background: brief.secondary_color, border: `1px solid ${C.grayBorder}` }} />
        </div>
        <button onClick={() => setSubStep('brief')} style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 11, fontFamily: "inherit", marginTop: 6, padding: 0, fontWeight: 600 }}>✎ تعديل المتطلبات</button>
      </div>

      {/* بطاقة الدفع */}
      <Card style={{ border: `2px solid ${C.amberLine}`, background: `${C.amber}05` }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "center", color: C.amberText, marginBottom: 6 }}><IcPalette width={32} height={32}/></div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>إتمام الدفع</div>
        </div>
        <div style={{ background: C.white, borderRadius: 8, padding: "8px 12px", marginBottom: 12, border: `1px solid ${C.grayBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.gray, marginBottom: 3 }}>
            <span>قبل الضريبة</span><span>{price.toLocaleString('en-US')} ريال</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.gray, marginBottom: 6 }}>
            <span>ضريبة 15%</span><span>{tax.toLocaleString('en-US')} ريال</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: C.amberText, borderTop: `1px solid ${C.grayBorder}`, paddingTop: 6 }}>
            <span>الإجمالي</span><span>{total.toLocaleString('en-US')} ريال</span>
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 6 }}>طريقة الدفع:</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {["card","mada","apple_pay"].map(m => (
            <button key={m} onClick={() => { setMethod(m); setCardErr(""); }} style={{ flex: 1, padding: "6px 4px", borderRadius: 8, fontSize: 10, fontFamily: "inherit", border: `1.5px solid ${method === m ? C.primary : C.grayBorder}`, background: method === m ? `${C.primary}12` : C.white, color: method === m ? C.primary : C.gray, fontWeight: method === m ? 700 : 400, cursor: "pointer" }}>
              {paymentLabels[m]}
            </button>
          ))}
        </div>
        {(method === "card" || method === "mada") && (
          <div style={{ marginBottom: 12 }}>
            <CardInputForm card={card} onChange={setCard} isMada={method === "mada"} />
            <div style={{ marginTop: 6, padding: '6px 10px', background: '#E8F8F2', borderRadius: 7, fontSize: 10, color: '#086449' }}>
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
          <div style={{ padding: "6px 10px", background: "#F8D3D3", borderRadius: 6, fontSize: 11, color: C.red, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><IcWarning width={11} height={11}/> {cardErr}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: C.greenLight, borderRadius: 7, fontSize: 11, color: C.green, marginBottom: 10 }}>
          <IcLock width={11} height={11}/> دفع آمن ومشفر
        </div>
        <Btn full onClick={handlePay} disabled={loading || paying}>
          {(loading || paying) ? "جارٍ معالجة الدفع…" : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IcLock width={14} height={14}/>ادفع الآن — {total.toLocaleString('en-US')} ريال</span>}
        </Btn>
        <button onClick={() => setSubStep('brief')} style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: C.gray, cursor: 'pointer', fontSize: 11, fontFamily: "inherit", padding: '6px 0' }}>← العودة لتعديل المتطلبات</button>
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ── WorkflowsList ─────────────────────────────────────────────────────────────
// شرح البداية في صفحة الخطط (نصوصه وفيديوه من «محتوى الموقع» ← السياسات واللوائح)
const PlansIntro = () => {
  const sc = useSiteContent();
  const [showVideo, setShowVideo] = useState(false);
  const steps = String(sc.policies_plans_intro_steps || '').split('\n').map(x => x.trim()).filter(Boolean);
  const hasVideo = !!(sc.policies_video_url || sc.policies_video_url_alt);
  if (!sc.policies_plans_intro_title && !steps.length) return null;
  return (
    <Card style={{ padding: '20px 24px', marginBottom: 16, borderRight: `4px solid ${C.amber}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          {sc.policies_plans_intro_title && <h3 style={{ fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 6 }}>{sc.policies_plans_intro_title}</h3>}
          {sc.policies_plans_intro_text && <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.8, margin: 0 }}>{sc.policies_plans_intro_text}</p>}
        </div>
        {hasVideo && (
          <button onClick={() => setShowVideo(v => !v)} style={{ padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${C.primary}`, background: showVideo ? C.primary : '#fff', color: showVideo ? '#fff' : C.primary, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {showVideo ? 'إخفاء الفيديو التعريفي' : '▶ شاهد الفيديو التعريفي'}
          </button>
        )}
      </div>
      {showVideo && hasVideo && <div style={{ marginTop: 14, maxWidth: 760 }}><UnitVideo url={sc.policies_video_url} altUrl={sc.policies_video_url_alt} title="الفيديو التعريفي للسياسات واللوائح" radius={10} /></div>}
      {steps.length > 0 && (
        <ol style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
          {steps.map((st, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: C.ink, lineHeight: 1.7 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: C.primary, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
              <span>{st}</span>
            </li>
          ))}
        </ol>
      )}
      <div style={{ marginTop: 12, fontSize: 12, color: C.gray, display: 'flex', alignItems: 'center', gap: 6 }}><IcLightbulb width={14} height={14}/> داخل كل استبيان تجد زر «معلومات هذه السياسة» وفيه النبذة والإرشادات والفيديو الخاص بها.</div>
    </Card>
  );
};

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
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: `4px solid ${C.primary}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="animate-in">
      {/* Header */}
      <PlansIntro />
      <div style={{ background: C.white, borderRadius: 16, padding: '28px 32px', marginBottom: 16, boxShadow: '0 1px 6px rgba(14,42,61,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 4 }}>خططك للسياسات واللوائح</h2>
          <p style={{ fontSize: 13, color: C.gray }}>استعرض خطة موجودة أو أنشئ خطة جديدة بعد اكتمال الحالية</p>
        </div>
        {/* New plan button — only enabled if all existing plans are completed */}
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={handleNew}
            disabled={!canCreate || creating}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: (!canCreate || creating) ? C.grayLight : C.amber,
              color: (!canCreate || creating) ? C.gray : '#0E2A3D',
              fontSize: 14, fontWeight: 700, fontFamily: "inherit",
              cursor: (!canCreate || creating) ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              boxShadow: (!canCreate || creating) ? 'none' : `0 4px 14px ${C.amberLine}40`,
            }}
          >
            <IcDocument width={16} height={16}/>
            {creating ? 'جارٍ الإنشاء…' : '+ إنشاء خطة سياسات جديدة'}
          </button>
          {!canCreate && (
            <div style={{ fontSize: 11, color: C.amberText, marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <IcLock width={11} height={11}/>
              أكمل الخطة الحالية أولاً لتفعيل هذا الخيار
            </div>
          )}
        </div>
      </div>

      {/* Block message when incomplete plan exists */}
      {!canCreate && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 18px', background: C.yellowLight, border: `1.5px solid ${C.amberLine}`, borderRadius: 12, marginBottom: 16 }}>
          <span style={{ flexShrink: 0, color: '#7F310E', marginTop: 2 }}><IcWarning width={20} height={20}/></span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7F310E', marginBottom: 2 }}>خطة نشطة موجودة</div>
            <div style={{ fontSize: 12, color: '#5E240A', lineHeight: 1.7 }}>
              يجب إكمال الخطة الحالية وجميع مراحلها (الاعتماد من المستشار + التحميل + قرار التصميم) قبل إنشاء خطة سياسات جديدة.
            </div>
          </div>
        </div>
      )}

      {workflows.length === 0 ? (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}><DfIcon name="clipboard" size={48} /></div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8 }}>لا توجد خطط بعد</h3>
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
              <Card key={wf.id} style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', border: isActive ? `2px solid ${C.amberLine}20` : '2px solid transparent' }}>
                {/* Number badge */}
                <div style={{ width: 52, height: 52, borderRadius: 14, background: isActive ? C.amberSoft : C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, flexDirection: 'column' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: isActive ? C.amberText : C.green, lineHeight: 1 }}>#{planNum}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>
                      خطة السياسات #{planNum}
                    </span>
                    <Badge text={si.text} color={si.color} />
                    {isActive && <Badge text="نشطة" color="orange" />}
                    {selCount > 0 && (
                      <span style={{ fontSize: 11, color: C.gray }}>{aprvd}/{selCount} سياسة معتمدة</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: C.gray, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span>المرحلة: <strong style={{ color: C.ink }}>{stepLabel(stepN)}</strong></span>
                    {wf.consultant?.name && <span>المستشار: <strong style={{ color: C.ink }}>{wf.consultant.name}</strong></span>}
                    {wf.created_at && <span>{new Date(wf.created_at).toLocaleDateString('ar-SA')}</span>}
                    {wf.total > 0 && <span>المبلغ: <strong style={{ color: C.primary }}>{Number(wf.total).toLocaleString('en-US')} ريال</strong></span>}
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
  // رسالة تأكيد بعد الإرسال (تختفي تلقائيًا)
  const [notice,     setNotice]     = useState(null);
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 9000);
    return () => clearTimeout(t);
  }, [notice]);

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

  // تحديث حقول الخطة محليًا دون إعادة التحميل (تبقى الخطوة الحالية كما هي) — مثل اختيار المستشار قبل الدفع
  const patchWorkflow = (patch) => setPageData(prev => ({ ...prev, workflow: { ...prev.workflow, ...patch } }));

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
      return true;
    } catch (e) {
      alert(e?.response?.data?.message || "تعذّر حفظ اختيار السياسات. حاول مرة أخرى.");
      if (e?.response?.data?.workflow) setPageData(prev => ({ ...prev, workflow: e.response.data.workflow }));
      return false;
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

  // تحديث نسخة السياسة في الصفحة فور الحفظ حتى تظهر آخر إجابة عند إعادة فتح الاستبيان دون تحديث الصفحة
  const mergeSelection = (sel) => { if (sel?.id) setPageData(prev => prev ? ({ ...prev, selections: (prev.selections || []).map(s => s.id === sel.id ? { ...s, ...sel } : s) }) : prev); };
  const handleSave = async (id, formData) => {
    try {
      const res = await policiesApi.saveSelection(workflowId, id, { form_data: formData });
      mergeSelection(res.data?.selection);
    } catch {
      // نحتفظ بما كتبه العميل محليًا حتى لو تعذّر الحفظ، ونعلمه بوضوح
      setPageData(prev => prev ? ({ ...prev, selections: (prev.selections || []).map(s => s.id === id ? { ...s, form_data: formData } : s) }) : prev);
      setNotice("تعذّر حفظ الإجابات على الخادم — تحقق من الاتصال ثم اضغط «حفظ ومتابعة لاحقاً» مرة أخرى.");
    }
  };

  const handleSubmit = async (id, formData) => {
    setActLoading(true);
    try {
      const res = await policiesApi.submitSelection(workflowId, id, { form_data: formData });
      mergeSelection(res.data?.selection);
      const sel  = selections.find(x => x.id === id);
      const name = policyTypes.find(p => p.id === sel?.policy_type_id)?.name || "السياسة";
      setNotice(`تم إرسال «${name}» لمراجعة المستشار ✓ — ستصلك إشعارات عند ردّه.`);
      await load();
      return true;
    } catch (e) {
      alert(e?.response?.data?.message || "فشل الإرسال.");
      return false;
    } finally { setActLoading(false); }
  };

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

  // النموذج المرجعي v3.0 (Word / PDF) — متاح بعد اعتماد المستشار للسياسة
  const handleTemplateDownload = async (sel, format) => {
    const key = `${sel.id}-${format}`;
    setDlLoading(key);
    try {
      const res  = await policiesApi.downloadTemplate(workflowId, sel.id, format);
      const type = format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const url  = window.URL.createObjectURL(new Blob([res.data], { type }));
      const p    = policyTypes.find(x => x.id === sel.policy_type_id) || sel.policy_type;
      const a    = document.createElement("a");
      a.href = url;
      a.download = `${p?.code || "policy"} - ${p?.name || ""}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("تعذّر تحميل النموذج المرجعي.");
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
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: `4px solid ${C.primary}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
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
            style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "inherit", display: 'flex', alignItems: 'center', gap: 4 }}>
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
            style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "inherit", display: 'flex', alignItems: 'center', gap: 4 }}>
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
          style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "inherit", display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          ← خططي للسياسات
        </button>
      </div>

      <Stepper step={displayStep} realStep={currentStep} allDone={isFullyDone} onStepClick={workflow ? handleStepClick : undefined} />

      {notice && displayStep !== 3 && (
        <div role="status" style={{ marginBottom: 14, padding: "12px 16px", background: /تعذّر/.test(notice) ? C.amberSoft : C.greenLight, border: `1.5px solid ${/تعذّر/.test(notice) ? C.amber : C.green}50`, borderRadius: 12, fontSize: 13, color: /تعذّر/.test(notice) ? C.amberText : "#086449", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><IcCheckCircle width={18} height={18}/>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="إغلاق" style={{ background: "none", border: "none", cursor: "pointer", color: "#086449", fontSize: 16 }}>×</button>
        </div>
      )}

      {displayStep === 0 && (
        <StepIntro
          policyTypes={policyTypes}
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
          onBack={() => setStep(1)} loading={actLoading} onWorkflowUpdate={patchWorkflow} />
      )}

      {displayStep === 3 && (
        <StepWork policyTypes={policyTypes} selections={selections}
          onSave={handleSave} onSubmit={handleSubmit}
          notice={notice} onDismissNotice={() => setNotice(null)}
          onGoReview={workflow?.current_step >= 4 ? () => setViewStep(null) : undefined}
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
          onNext={() => setStep(7)} onDownload={handleDownload} onTemplateDownload={handleTemplateDownload} loadingId={dlLoading} onView={setViewingId} />
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
