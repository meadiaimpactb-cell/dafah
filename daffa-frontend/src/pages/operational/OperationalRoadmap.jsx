import { Help } from '../../components/ui/Help';
import DfIcon from '../../components/ui/DfIcon';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { operationalApi } from '../../api/operational';
import { chatApi } from '../../api/chat';
import { ConsultantRating } from '../strategic/steps/StepApproval';
import { PaymentReceipt } from '../strategic/steps/StepPayment';
import ConsultantPicker from '../shared/ConsultantPicker';
import { PayLogo, PaymentMethodPicker, ApplePayButton, SecurePaymentBadge, CardNetworkLogo, detectCardNetwork } from '../shared/PaymentBrand';
import { IcClock, IcUpload, IcCheckCircle, IcArrowPath, IcSearch, IcWarning, IcLock, IcCog, IcLightbulb, IcSave, IcDocument, IcUser, IcCalendar, IcSparkles, IcCheck, IcChat, IcMoney, IcXMark, IcBeaker } from '../../utils/icons';
import { OpSection, OpFormIntro, OpLabel, hasOpSection } from './OpContent';

// ─── Colors ─────────────────────────────────────────────────────
const colors = {
  primary: "#235D7F", ink: "#0E2A3D", primaryDeep: "#123247",
  orange: "#EF6A2C", amberLine: '#E05A1F', amberSoft: "#FEF3EC",
  gray: "#5E6B78", grayLight: "#F3EFE8", grayBorder: "#E8E3DA",
  green: "#0E9F74", greenLight: "#C9EFE1",
  blue: "#2E8FE6", blueLight: "#CFE5FA",
  yellow: "#EF6A2C", yellowLight: "#FDE2D2",
};

// ─── Plans list constants ────────────────────────────────────────
const OP_STATUS_CFG = {
  pending:   { label: 'جارٍ الإعداد',   color: '#5E6B78', bg: '#F3EFE8' },
  active:    { label: 'جارٍ التنفيذ',   color: '#235D7F', bg: '#D9E8F1' },
  review:    { label: 'قيد المراجعة',   color: '#235D7F', bg: '#D9E8F1' },
  completed: { label: 'مكتملة',          color: '#0B7F5D', bg: '#C9EFE1' },
};

// ─── OpPlansList ─────────────────────────────────────────────────
function OpPlansList({ plans, onSelect, onCreateNew, loading }) {
  if (loading) return (
    <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(14,42,61,0.06)' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ height: 96, borderRadius: 10, background: '#F3EFE8', marginBottom: 12 }} />
        ))}
      </div>
    </div>
  );

  const hasActive = plans.some(p => p.status !== 'completed');

  return (
    <div className="animate-in">
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 28px', marginBottom: 20, boxShadow: '0 1px 8px rgba(14,42,61,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.ink, marginBottom: 4 }}>خططك التشغيلية</h2>
          <p style={{ fontSize: 13, color: '#5E6B78' }}>
            {plans.length === 0 ? 'لم تبدأ أي خطة بعد' : `لديك ${plans.length} ${plans.length === 1 ? 'خطة' : 'خطط'} تشغيلية`}
          </p>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <button
            onClick={onCreateNew}
            disabled={hasActive}
            style={{ padding: '11px 24px', background: hasActive ? '#E8E3DA' : colors.amber, color: hasActive ? '#8C97A3' : '#0E2A3D', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: hasActive ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> إنشاء خطة جديدة
          </button>
          {hasActive && (
            <div style={{ marginTop: 6, fontSize: 11, color: '#5E6B78', maxWidth: 220 }}>
              أكمل الخطة الحالية أولاً لفتح هذا الخيار
            </div>
          )}
        </div>
      </div>

      {plans.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '60px 24px', boxShadow: '0 1px 8px rgba(14,42,61,0.06)', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D9E8F1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}><DfIcon name="gear" size={32} /></div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.ink, marginBottom: 10 }}>ابدأ خطتك التشغيلية الأولى</div>
          <p style={{ fontSize: 13, color: '#5E6B78', maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.7 }}>
            بناء خطة تشغيلية متكاملة من خلال 5 وحدات تخطيطية بمرافقة المستشار الاستراتيجي
          </p>
          <button
            onClick={onCreateNew}
            style={{ padding: '13px 36px', background: colors.amber, color: '#0E2A3D', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ابدأ الآن ←
          </button>
        </div>
      )}

      {plans.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...plans].reverse().map((plan, idx) => {
            const cfg      = OP_STATUS_CFG[plan.status] || OP_STATUS_CFG.pending;
            const approved = plan.approved_count ?? 0;
            const total    = plan.total_count    ?? 5;
            const pct      = total > 0 ? Math.round((approved / total) * 100) : 0;
            const planNum  = plans.length - idx;
            const isDone   = plan.status === 'completed';

            return (
              <div
                key={plan.id}
                style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 8px rgba(14,42,61,0.06)', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'box-shadow 0.2s', border: '1.5px solid transparent' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(35,93,127,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 8px rgba(14,42,61,0.06)'}
                onClick={() => onSelect(plan.id)}
              >
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: isDone ? '#C9EFE1' : '#D9E8F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: isDone ? '#0B7F5D' : colors.primary }}>#{planNum}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>الخطة التشغيلية #{planNum}</span>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#5E6B78', marginBottom: 8 }}>
                    {plan.consultant ? `المستشار: ${plan.consultant.name}` : 'لم يُختر مستشار بعد'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 6, background: '#E8E3DA', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: isDone ? '#0B7F5D' : colors.primary, borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#5E6B78', whiteSpace: 'nowrap' }}>{approved}/{total} وحدة معتمدة</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#8C97A3', marginBottom: 10 }}>
                    {new Date(plan.created_at).toLocaleDateString('ar-SA')}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onSelect(plan.id); }}
                    style={{ padding: '8px 20px', background: isDone ? '#C9EFE1' : colors.primary, color: isDone ? '#0B7F5D' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
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

// ─── UI Components ───────────────────────────────────────────────
const Badge = ({ text, color = "gray", small }) => {
  const map = {
    green:  { bg: colors.greenLight,  text: colors.green  },
    orange: { bg: colors.amberSoft, text: colors.amberText },
    blue:   { bg: colors.blueLight,   text: colors.blue   },
    yellow: { bg: colors.yellowLight, text: colors.amberText },
    gray:   { bg: colors.grayLight,   text: colors.gray   },
    primary:   { bg: "#D9E8F1",          text: colors.primary   },
  };
  const c = map[color] || map.gray;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: small ? "1px 8px" : "3px 12px", borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 600, background: c.bg, color: c.text, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
};

const Btn = ({ children, variant = "primary", onClick, disabled, small }) => {
  const styles = {
    primary:   { bg: colors.amber, color: "#0E2A3D",       border: "none" },
    secondary: { bg: "transparent", color: colors.primary,   border: `2px solid ${colors.primary}` },
    ghost:     { bg: "transparent", color: colors.primary,   border: "none" },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: small ? "6px 14px" : "10px 24px", borderRadius: 10, fontSize: small ? 12 : 14, fontWeight: 600, fontFamily: "inherit", background: disabled ? colors.grayLight : s.bg, color: disabled ? colors.gray : s.color, border: s.border, cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  );
};

const Card = ({ children, accent, onClick, style }) => (
  <div onClick={onClick} style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(14,42,61,0.06)", borderBottom: accent ? `3px solid ${colors.amberLine}` : "none", cursor: onClick ? "pointer" : "default", transition: "all 0.2s", ...style }}>
    {children}
  </div>
);

const Input = ({ label, placeholder, type = "text", value, onChange }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{label}</label>}
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
  </div>
);

// ─── Payment method icons ───────────────────────────────────────────
const PAY_METHODS = [
  {
    key: 'card', label: 'بطاقة ائتمان',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    key: 'mada', label: 'مدى',
    icon: (
      <svg viewBox="0 0 68 22" width={74} height={24}>
        <rect width="68" height="22" rx="4" fill="#00623b"/>
        <text x="34" y="16" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="13" fill="#fff" letterSpacing="1">mada</text>
      </svg>
    ),
  },
  {
    key: 'apple_pay', label: 'Apple Pay',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    key: 'bank_transfer', label: 'تحويل بنكي',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="22" x2="21" y2="22"/><rect x="3" y="10" width="18" height="12"/><polygon points="12 2 20 10 4 10"/>
      </svg>
    ),
  },
];

// ── Payment Gateway Adapter ──────────────────────────────────────────────────
// To integrate a real provider (Moyasar, HyperPay, Tap, Stripe…),
// replace ONLY the body of this function. The rest of the code stays unchanged.
async function gatewayCharge({ method, card }) {
  // ── MOCK GATEWAY ─────────────────────────────────────────────────────────────
  // Test card: 4111 1111 1111 1111 | Expiry: 12/26 | CVV: 123 | Name: أي اسم
  await new Promise(r => setTimeout(r, 1600)); // simulate network latency

  if (method === 'card' || method === 'mada') {
    const num = card.number.replace(/\D/g, '');
    if (num.length !== 16)
      throw new Error('رقم البطاقة يجب أن يكون 16 رقماً');
    if (!/^\d{2}\/\d{2}$/.test(card.expiry))
      throw new Error('تاريخ الانتهاء غير صحيح — أدخل بصيغة MM/YY');
    const mm = parseInt(card.expiry.split('/')[0], 10);
    if (mm < 1 || mm > 12)
      throw new Error('شهر الانتهاء غير صحيح');
    if (card.cvv.replace(/\D/g, '').length !== 3)
      throw new Error('رمز CVV يجب أن يكون 3 أرقام');
    if (!card.name.trim())
      throw new Error('يرجى إدخال اسم حامل البطاقة');
  }

  return {
    success:        true,
    transaction_id: 'TXN-' + Date.now(),
    reference:      'REF-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
  };
  // ── END MOCK ──────────────────────────────────────────────────────────────────

  /* ── Real provider example (Moyasar) — uncomment and fill credentials: ──────
  const { data } = await axios.post('https://api.moyasar.com/v1/payments', {
    amount:      Math.round(amount * 100), // in halalas
    currency,
    source:      { type: method === 'card' ? 'creditcard' : method,
                   name: card.name, number: card.number.replace(/\s/g,''),
                   month: card.expiry.split('/')[0], year: '20' + card.expiry.split('/')[1],
                   cvc:   card.cvv },
    description: 'Dafah Operational Plan',
    callback_url: window.location.href,
  }, { auth: { username: import.meta.env.VITE_MOYASAR_KEY, password: '' } });
  if (data.status !== 'paid') throw new Error(data.message || 'فشل الدفع');
  return { success: true, transaction_id: data.id, reference: data.id };
  ─────────────────────────────────────────────────────────────────────────── */
}

// ── Card input helpers ────────────────────────────────────────────
const fmtCard   = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
const fmtExpiry = v => { const d = v.replace(/\D/g,'').slice(0,4); return d.length > 2 ? d.slice(0,2)+'/'+d.slice(2) : d; };
const fmtCvv    = v => v.replace(/\D/g,'').slice(0,3);

const CardForm = ({ card, onChange, isMada }) => {
  const inp = { padding: "10px 14px", border: `1.5px solid ${colors.grayBorder}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box", outline: "none", direction: "ltr" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Test card hint */}
      <div style={{ padding: "8px 12px", background: "#E8F8F2", borderRadius: 8, fontSize: 11, color: "#086449", direction: "rtl" }}>
        بطاقة الاختبار: <strong>4111 1111 1111 1111</strong> | تاريخ: <strong>12/26</strong> | CVV: <strong>123</strong>
      </div>
      <div style={{ position: "relative" }}>
        <input
          placeholder="رقم البطاقة — XXXX XXXX XXXX XXXX"
          aria-label="رقم البطاقة"
          inputMode="numeric" autoComplete="cc-number"
          style={{ ...inp, paddingRight: 70 }} maxLength={19}
          value={card.number}
          onChange={e => onChange({ ...card, number: fmtCard(e.target.value) })}
        />
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", pointerEvents: "none" }}>
          <CardNetworkLogo brand={isMada ? "mada" : detectCardNetwork(card.number)} />
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 10 }}>
        <input
          placeholder="تاريخ الانتهاء — MM/YY"
          style={inp} maxLength={5}
          value={card.expiry}
          onChange={e => onChange({ ...card, expiry: fmtExpiry(e.target.value) })}
        />
        <input
          placeholder="CVV" type="password"
          style={{ ...inp, letterSpacing: 4 }} maxLength={3}
          value={card.cvv}
          onChange={e => onChange({ ...card, cvv: fmtCvv(e.target.value) })}
        />
      </div>
      <input
        placeholder="اسم حامل البطاقة"
        style={{ ...inp, direction: "rtl" }}
        value={card.name}
        onChange={e => onChange({ ...card, name: e.target.value })}
      />
    </div>
  );
};

const ApplePayForm = () => (
  <div style={{ textAlign: "center", padding: "16px 0" }}>
    <ApplePayButton />
    <p style={{ fontSize: 12, color: colors.gray, marginTop: 10, fontFamily: "inherit" }}>سيتم فتح نافذة Apple Pay لإتمام عملية الدفع</p>
  </div>
);

const BankTransferInfo = () => (
  <div style={{ background: "#FBF9F5", borderRadius: 10, padding: 16, direction: "rtl" }}>
    <div style={{ fontWeight: 700, color: colors.ink, fontSize: 13, marginBottom: 10 }}>بيانات التحويل البنكي</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 13 }}>
      {[["اسم المستفيد","منصة دفة للاستشارات"],["البنك","بنك الرياض"],["رقم الآيبان","SA12 1000 1234 5678 9012 3456"],["رقم الحساب","1234567890"]].map(([l,v]) => (
        <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${colors.grayBorder}` }}>
          <span style={{ color: colors.gray }}>{l}</span>
          <span style={{ fontWeight: 600, color: colors.ink }}>{v}</span>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 12, padding: "8px 10px", background: "#FDE2D2", borderRadius: 8, fontSize: 11, color: "#7F310E", display: "flex", alignItems: "center", gap: 6 }}>
      <IcWarning width={14} height={14}/> بعد التحويل، أرسل إيصال الدفع عبر البريد الإلكتروني لتفعيل الخدمة
    </div>
  </div>
);

const toEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v'))
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    if (u.hostname === 'youtu.be')
      return `https://www.youtube.com/embed${u.pathname}`;
  } catch (_) {}
  return url;
};

// ─── Embedded Chat ──────────────────────────────────────────────────────────
const EmbeddedChat = ({ consultantName }) => {
  const [conv,     setConv]    = useState(null);
  const [messages, setMsgs]   = useState([]);
  const [body,     setBody]   = useState('');
  const [loading,  setLoading]= useState(true);
  const [sending,  setSending]= useState(false);
  const [error,    setError]  = useState(null);
  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);
  const inputRef   = useRef(null);

  const loadMessages = useCallback((convId, silent = false) => {
    chatApi.messages(convId)
      .then(r => { setMsgs(r.data); if (!silent) setLoading(false); })
      .catch(() => { if (!silent) setLoading(false); });
  }, []);

  useEffect(() => {
    chatApi.conversations()
      .then(r => {
        if (r.data.length > 0) {
          setConv(r.data[0]);
          loadMessages(r.data[0].id);
        } else {
          return chatApi.startWith().then(r2 => {
            const id = r2.data?.conversation_id || r2.data?.id;
            setConv({ id });
            loadMessages(id);
          });
        }
      })
      .catch(e => { setError(e.response?.data?.message || 'تعذّر تحميل المحادثة'); setLoading(false); });
  }, [loadMessages]);

  useEffect(() => {
    if (!conv?.id) return;
    pollRef.current = setInterval(() => loadMessages(conv.id, true), 3000);
    return () => clearInterval(pollRef.current);
  }, [conv?.id, loadMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text || sending || !conv?.id) return;
    const opt = { id: Date.now(), is_mine: true, body: text, time: new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit', hour12: false }) };
    setMsgs(p => [...p, opt]);
    setBody('');
    setSending(true);
    try {
      const r = await chatApi.send(conv.id, text);
      setMsgs(p => p.map(m => m.id === opt.id ? r.data : m));
    } catch {
      setMsgs(p => p.filter(m => m.id !== opt.id));
      setBody(text);
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  if (loading) return (
    <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.gray, fontSize: 13 }}>
      <div style={{ textAlign: 'center' }}><div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><IcClock width={28} height={28}/></div>جارٍ تحميل المحادثة...</div>
    </div>
  );
  if (error) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C53A3A', fontSize: 13 }}>{error}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 380, border: `1px solid ${colors.grayBorder}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: '#FBF9F5' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: colors.gray, fontSize: 13, marginTop: 60, lineHeight: 1.8 }}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><IcChat width={32} height={32}/></div>
            ابدأ المحادثة مع المستشار
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.is_mine ? 'flex-start' : 'flex-end' }}>
            <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: m.is_mine ? '12px 12px 12px 4px' : '12px 12px 4px 12px', background: m.is_mine ? colors.primary : 'white', color: m.is_mine ? 'white' : colors.ink, fontSize: 13, lineHeight: 1.6, boxShadow: '0 1px 3px rgba(14,42,61,0.08)' }}>
              <div style={{ direction: 'rtl' }}>{m.body}</div>
              <div style={{ fontSize: 10, opacity: 0.65, marginTop: 3, textAlign: m.is_mine ? 'left' : 'right' }}>{m.time}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${colors.grayBorder}`, background: 'white', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          ref={inputRef}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="اكتب رسالتك..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 13, fontFamily: "inherit", outline: 'none', direction: 'rtl' }}
        />
        <button onClick={handleSend} disabled={!body.trim() || sending}
          style={{ padding: '10px 16px', borderRadius: 10, background: body.trim() && !sending ? colors.amber : colors.grayLight, border: 'none', cursor: body.trim() && !sending ? 'pointer' : 'not-allowed', color: '#0E2A3D', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}>
          {Icons.send}
        </button>
      </div>
    </div>
  );
};

const Tab = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, background: colors.grayLight, borderRadius: 12, padding: 3, overflowX: "auto" }}>
    {tabs.map((t, i) => (
      <button key={i} onClick={() => onChange(i)} style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: active === i ? 700 : 500, fontFamily: "inherit", background: active === i ? "white" : "transparent", color: active === i ? colors.primary : colors.gray, border: "none", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
        {t}
      </button>
    ))}
  </div>
);

const STATUS_ICONS = {
  not_submitted: <IcClock width={18} height={18}/>,
  submitted:     <IcUpload width={18} height={18}/>,
  approved:      <IcCheckCircle width={18} height={18}/>,
  revision:      <IcArrowPath width={18} height={18}/>,
};

const StatusBar = ({ status }) => {
  const map = {
    not_submitted: { bg: colors.grayLight,   color: colors.gray,   text: "لم يُرسل بعد" },
    submitted:     { bg: colors.blueLight,   color: colors.blue,   text: "تم الإرسال للمراجعة — بانتظار المستشار" },
    approved:      { bg: colors.greenLight,  color: colors.green,  text: "معتمد — يمكنك الانتقال للوحدة التالية" },
    revision:      { bg: colors.amberSoft, color: colors.amberText, text: "يحتاج تعديل — راجع ملاحظات المستشار" },
  };
  const s = map[status] || map.not_submitted;
  return (
    <div style={{ padding: "12px 20px", borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: s.color }}>
      {STATUS_ICONS[status] || STATUS_ICONS.not_submitted}{s.text}
    </div>
  );
};

const statusMap = {
  approved:    { badge: "معتمد",         color: "green"  },
  revision:    { badge: "يحتاج تعديل",  color: "orange" },
  submitted:   { badge: "تم الإرسال",   color: "blue"   },
  in_progress: { badge: "قيد العمل",    color: "yellow" },
  not_started: { badge: "لم يبدأ",      color: "gray"   },
};

const Icons = {
  play:  <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  clip:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  send:  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>,
};

// ─── Trial Fill Data ──────────────────────────────────────────────
const TRIAL_FILL = {
  op_import: {
    items: [
      { name: 'برنامج التعليم المجتمعي', checked: true },
      { name: 'مشروع التأهيل المهني',    checked: true },
      { name: 'حملة التوعية الصحية',     checked: true },
    ]
  },
  op_activities: {
    groups: [
      { initiative: 'برنامج التعليم المجتمعي', activities: [
        { name: 'ورشة تدريب المعلمين',      desc: 'تدريب 30 معلم على أساليب التدريس الحديثة', output: 'معلمون مؤهلون' },
        { name: 'إعداد المناهج التعليمية',   desc: 'تطوير مناهج مجتمعية فعّالة',               output: 'مناهج معتمدة'   },
      ]},
      { initiative: 'مشروع التأهيل المهني', activities: [
        { name: 'تأهيل مهني — المرحلة 1', desc: 'تدريب على المهارات الأساسية',         output: 'متدربون مؤهلون' },
        { name: 'تأهيل مهني — المرحلة 2', desc: 'تدريب متقدم وتأهيل لسوق العمل',      output: 'خريجون جاهزون'   },
      ]},
    ]
  },
  op_gantt: {
    activities: [
      { name: 'ورشة تدريب المعلمين',     months: [1,1,1,0,0,0,0,0,0,0,0,0] },
      { name: 'إعداد المناهج',            months: [0,1,1,1,0,0,0,0,0,0,0,0] },
      { name: 'تنفيذ البرنامج التعليمي', months: [0,0,0,1,1,1,1,1,1,0,0,0] },
      { name: 'تأهيل مهني — المرحلة 1',  months: [0,0,1,1,1,1,0,0,0,0,0,0] },
      { name: 'تأهيل مهني — المرحلة 2',  months: [0,0,0,0,0,0,1,1,1,1,0,0] },
      { name: 'حملة التوعية الصحية',      months: [0,0,0,0,1,1,1,1,0,0,0,0] },
    ]
  },
  op_responsible: {
    rows: [
      { activity: 'ورشة تدريب المعلمين',    initiative: 'التعليم المجتمعي', responsible: 'محمد عبدالله',   department: 'قسم التدريب'  },
      { activity: 'إعداد المناهج',           initiative: 'التعليم المجتمعي', responsible: 'فاطمة الزهراني', department: 'قسم التطوير'  },
      { activity: 'تأهيل مهني — المرحلة 1', initiative: 'التأهيل المهني',   responsible: 'أحمد السعيد',    department: 'قسم التأهيل'  },
      { activity: 'حملة التوعية الصحية',     initiative: 'التوعية الصحية',   responsible: 'سارة العتيبي',   department: 'قسم الصحة'    },
    ]
  },
  op_budget: {
    rows: [
      { activity: 'ورشة تدريب المعلمين', item: 'أتعاب المدربين',  unitCost: '5000',  count: '3', total: '15000' },
      { activity: '',                      item: 'مواد تدريبية',    unitCost: '500',   count: '30', total: '15000' },
      { activity: 'إعداد المناهج',        item: 'تصميم وطباعة',   unitCost: '2000',  count: '5', total: '10000'  },
      { activity: 'تأهيل مهني',           item: 'معدات تدريبية',  unitCost: '10000', count: '2', total: '20000'  },
      { activity: 'حملة التوعية',         item: 'تصميم ونشر',     unitCost: '3000',  count: '4', total: '12000'  },
    ]
  },
};

// معرّف ثابت لكل نشاط في «المبادرات التشغيلية» — تُربط به صفوف «الجدول الزمني للتنفيذ» فتبقى أشهرها عند تغيير الاسم
const newActId = () => `act_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** يضمن معرّفًا لكل نشاط قبل الحفظ (للبيانات القديمة أو التجريبية) */
const withActivityIds = (data) => {
  if (!Array.isArray(data?.groups)) return data;
  let changed = false;
  const groups = data.groups.map(g => {
    if (!Array.isArray(g?.activities) || g.activities.every(a => !a || a.id)) return g;
    changed = true;
    return { ...g, activities: g.activities.map(a => (a && !a.id ? { ...a, id: newActId() } : a)) };
  });
  return changed ? { ...data, groups } : data;
};

/** تعبئة تجريبية بنسخة جديدة في كل مرة؛ في الجدول الزمني تُملأ أشهر الأنشطة المنقولة بدل استبدالها */
const trialFillFor = (ttype, current) => {
  const demo = JSON.parse(JSON.stringify(TRIAL_FILL[ttype]));
  if (ttype === 'op_activities') return withActivityIds(demo);
  if (ttype === 'op_gantt') {
    const rows = current?.activities || [];
    if (rows.some(a => a.source_id)) {
      const patterns = demo.activities.map(a => a.months);
      return { ...current, activities: rows.map((a, i) => ({ ...a, months: [...patterns[i % patterns.length]] })) };
    }
  }
  return demo;
};

// أرقام التكلفة: تقبل فواصل الآلاف والأرقام العربية (٢٠٠ أو ۲۰۰)
const toNumber = v => parseFloat(String(v ?? '')
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
  .replace(/٫/g, '.')
  .replace(/[,٬\s]/g, '')) || 0;

// ─── Workflow Steps (7 steps — original design) ──────────────────
const opWorkflowSteps = [
  { id: 0, label: "التخطيط التشغيلي",              icon: <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg> },
  { id: 1, label: "الدفع",                         icon: <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/></svg> },
  { id: 2, label: "تعبئة النماذج ومشاهدة المواد", icon: <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-2.207 2.207L3 13.172V16h2.828l8.38-8.379-2.83-2.828z"/></svg> },
  { id: 3, label: "مراجعة المستشار",               icon: <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg> },
  { id: 4, label: "اعتماد",                        icon: <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> },
  { id: 5, label: "تحكيم اعتماد؟",                icon: <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 14a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 5.562V16h2a1 1 0 110 2H7a1 1 0 110-2h2V5.562L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 5.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd"/></svg> },
  { id: 6, label: "التحكيم والدفع",                icon: <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/></svg> },
];

// Map backend workflow object to UI step (0-6).
// arbitration_step: 0=none(UI 4), 1=provider selection(UI 5),
//                  2=at payment(UI 6), 3=paid/done(UI 6)
function mapStep(workflow) {
  if (!workflow) return 0;
  const backendStep = workflow.current_step ?? 0;
  const arbStep     = workflow.arbitration_step ?? 0;

  if (backendStep === 5) {
    if (arbStep >= 3) return 7; // fully paid → all steps green
    if (arbStep >= 2) return 6; // at payment screen
    if (arbStep === 1) return 5; // provider selection
    return 4;                    // just approved, no arbitration
  }

  const m = { 1: 1, 2: 1, 3: 2, 4: 3 };
  return m[backendStep] ?? 0;
}

// ─── Stepper ─────────────────────────────────────────────────────
const OpWorkflowStepper = ({ opStep, setOpStep, workflow }) => {
  const realOpStep = workflow ? mapStep(workflow) : opStep;
  const reviewing  = opStep < realOpStep;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "16px 0" }}>
        {opWorkflowSteps.map((ws, i) => {
          const done      = i < realOpStep;
          const current   = i === opStep;
          const clickable = done; // الخطوات المنجزة فعلاً فقط قابلة للمراجعة
          return (
            <React.Fragment key={i}>
              <div
                onClick={() => clickable && setOpStep(i)}
                title={clickable && !current ? `مراجعة: ${ws.label}` : undefined}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: clickable ? "pointer" : "default", minWidth: 70 }}
              >
                <div style={{
                  width: 36, height: 36,
                  borderRadius: ws.id === 5 ? 0 : current ? 10 : "50%",
                  transform: ws.id === 5 ? "rotate(45deg)" : "none",
                  background: done ? (current ? colors.amber : colors.green) : colors.grayLight,
                  color: (done || current) ? "#0E2A3D" : colors.gray,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, transition: "all 0.3s",
                  boxShadow: current ? `0 4px 12px ${colors.amberLine}40` : done ? `0 2px 8px ${colors.green}30` : "none",
                  outline: clickable && !current ? `2px solid ${colors.primary}30` : "none",
                  outlineOffset: 2,
                }}>
                  <span style={{ transform: ws.id === 5 ? "rotate(-45deg)" : "none", display: "flex" }}>
                    {done && !current
                      ? <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      : ws.icon}
                  </span>
                </div>
                <span style={{ fontSize: 9, fontWeight: current ? 700 : 500, color: done ? (current ? colors.amberText : colors.green) : colors.gray, textAlign: "center", maxWidth: 80, lineHeight: 1.3 }}>{ws.label}</span>
              </div>
              {i < opWorkflowSteps.length - 1 && (
                <div style={{ flex: 1, height: 3, background: i < realOpStep ? colors.green : colors.grayBorder, borderRadius: 2, margin: "0 2px", marginBottom: 20, transition: "background 0.3s" }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* مؤشر وضع المراجعة */}
      {reviewing && (
        <div style={{ marginTop: 4, padding: '6px 14px', background: '#FEF3EC', borderRadius: 8, border: `1px solid ${colors.amberLine}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: colors.amberText, fontWeight: 600 }}>
            <DfIcon name="search" size={18} style={{ marginInlineEnd: 6 }} />وضع المراجعة — تستعرض: {opWorkflowSteps[opStep]?.label}
          </span>
          <button
            onClick={() => setOpStep(realOpStep)}
            style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}
          >
            العودة للخطوة الحالية ←
          </button>
        </div>
      )}
    </div>
  );
};

// ─── OpTemplateRenderer (controlled) ─────────────────────────────
export const OpTemplateRenderer = ({ unit, formData, setFormData, readOnly, sync }) => {
  const templateType = unit.template_type || unit.templateType;
  const [newItem, setNewItem] = useState('');
  const iStyle = { width: "100%", padding: "6px 8px", border: `1px solid ${readOnly ? 'transparent' : colors.grayBorder}`, borderRadius: 6, fontSize: 12, fontFamily: "inherit", background: readOnly ? 'transparent' : 'white', outline: 'none' };
  const emptyState = (emoji, msg) => (
    <div style={{ textAlign: 'center', padding: '28px 16px', background: colors.grayLight, borderRadius: 10, marginBottom: 14 }}>
      <div style={{ fontSize: 30, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontSize: 13, color: colors.gray }}>{msg}</div>
    </div>
  );
  const addRowInput = (placeholder, onAdd) => !readOnly && (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(newItem); } }} placeholder={placeholder} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${colors.grayBorder}`, fontSize: 13, fontFamily: "inherit", outline: 'none' }} />
      <button onClick={() => onAdd(newItem)} style={{ padding: "8px 16px", background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "inherit", whiteSpace: 'nowrap' }}>+ إضافة</button>
    </div>
  );

  // ── op_import ──
  if (templateType === "op_import") {
    const items = formData.items?.length ? formData.items : [];
    const toggle = (i) => {
      if (readOnly) return;
      setFormData({ ...formData, items: items.map((it, idx) => idx === i ? { ...it, checked: !it.checked } : it) });
    };
    const removeItem = (i) => {
      if (readOnly) return;
      setFormData({ ...formData, items: items.filter((_, idx) => idx !== i) });
    };
    const addManually = (name) => {
      const n = name.trim();
      if (!n || readOnly) return;
      setFormData({ ...formData, items: [...items, { name: n, checked: true }] });
      setNewItem('');
    };
    return (
      <div>
        {items.length === 0 && emptyState(<DfIcon name="clipboard" size={20} />, readOnly ? 'لم يتم إضافة أي مبادرات' : 'أضف أسماء المبادرات التي ستعمل عليها خلال العام في الحقل أدناه.')}
        {items.map((it, i) => (
          <Card key={i} style={{ marginBottom: 10, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderRight: `3px solid ${it.checked ? colors.primary : colors.grayBorder}` }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: readOnly ? 'default' : 'pointer' }}>
              <input type="checkbox" checked={!!it.checked} onChange={() => toggle(i)} disabled={readOnly} aria-label={`اختيار المبادرة لهذا العام: ${it.name}`} style={{ accentColor: colors.primary, width: 17, height: 17, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflowWrap: 'anywhere' }}>{it.name}</div>
                <div style={{ fontSize: 11, color: colors.gray }}>المبادرة {i + 1}{it.imported ? ' · من الخطة الاستراتيجية' : ''}</div>
              </div>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Badge text={it.checked ? "مختارة لهذا العام" : "غير مختارة"} color={it.checked ? "green" : "gray"} small />
              {!readOnly && <button onClick={() => removeItem(i)} aria-label={`حذف المبادرة: ${it.name}`} title="حذف" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C53A3A', fontSize: 13, padding: '2px 6px', borderRadius: 4 }}>✕</button>}
            </div>
          </Card>
        ))}
        {addRowInput('أضف اسم مبادرة...', addManually)}
      </div>
    );
  }

  // ── op_activities ──
  if (templateType === "op_activities") {
    const groups = formData.groups?.length ? formData.groups : [];
    const updAct = (gi, ai, field, val) => {
      if (readOnly) return;
      setFormData({ ...formData, groups: groups.map((g, gi2) => gi2 !== gi ? g : { ...g, activities: g.activities.map((a, ai2) => ai2 !== ai ? a : { ...a, [field]: val }) }) });
    };
    const addRow = (gi) => {
      if (readOnly) return;
      setFormData({ ...formData, groups: groups.map((g, gi2) => gi2 !== gi ? g : { ...g, activities: [...g.activities, { id: newActId(), name: '', desc: '', output: '' }] }) });
    };
    const removeAct = (gi, ai) => {
      if (readOnly) return;
      const a = groups[gi]?.activities?.[ai];
      if ((a?.name || a?.desc || a?.output) && !window.confirm('حذف هذا النشاط؟ إذا كان قد نُقل إلى «الجدول الزمني للتنفيذ» فسيظهر هناك تنبيه لحذف صفه.')) return;
      setFormData({ ...formData, groups: groups.map((g, gi2) => gi2 !== gi ? g : { ...g, activities: g.activities.filter((_, i) => i !== ai) }) });
    };
    const addGroup = (name) => {
      const n = name.trim();
      if (!n || readOnly) return;
      setFormData({ ...formData, groups: [...groups, { initiative: n, activities: [{ id: newActId(), name: '', desc: '', output: '' }] }] });
      setNewItem('');
    };
    const FIELDS = [['name', 'اسم النشاط', 'مثال: ورشة تدريبية...'], ['desc', 'وصف النشاط', 'ماذا يتضمن؟'], ['output', 'المخرج المتوقع', 'ما الناتج؟']];
    return (
      <div>
        {!readOnly && sync?.groups_added > 0 && (
          <div role="status" style={{ background: '#EAF4FD', border: '1px solid #A9D2F5', borderRadius: 8, padding: '9px 14px', marginBottom: 14, fontSize: 12.5, color: '#1A65AD' }}>
            أُضيفت المبادرات التي اخترتها في الجزء الأول ({sync.groups_added}). أضف تحت كل مبادرة أنشطتها ثم احفظ.
          </div>
        )}
        {groups.length === 0 && emptyState(<DfIcon name="pin" size={20} />, readOnly ? 'لم يتم إضافة أي مبادرات' : 'تظهر هنا المبادرات التي اخترتها في الجزء الأول، ويمكنك إضافة مبادرة في الحقل أدناه.')}
        {groups.map((g, gi) => (
          <div key={gi} style={{ marginBottom: 20, border: `1.5px solid ${colors.grayBorder}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: colors.primaryDeep, color: "white", fontWeight: 600, fontSize: 14 }}>المبادرة: {g.initiative}</div>
            <div style={{ padding: 16 }}>
              {g.activities.map((a, ai) => (
                <div key={a.id || ai} style={{ position: 'relative', display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 10, padding: readOnly ? 10 : '10px 10px 10px 34px', background: colors.grayLight, borderRadius: 8 }}>
                  {FIELDS.map(([field, label, ph]) => (
                    <div key={field} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: colors.ink }}>
                        <OpLabel unit={unit} label={field === 'name' ? `${label} ${ai + 1}` : label} tipKey={label} />
                      </div>
                      <input value={a[field] || ''} onChange={e => updAct(gi, ai, field, e.target.value)} readOnly={readOnly} placeholder={ph} aria-label={field === 'name' ? `${label} ${ai + 1}` : label} style={iStyle} />
                    </div>
                  ))}
                  {!readOnly && (
                    <button onClick={() => removeAct(gi, ai)} aria-label={`حذف النشاط ${ai + 1}`} title="حذف النشاط"
                      style={{ position: 'absolute', top: 8, left: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#C53A3A', fontSize: 13, padding: '2px 6px', borderRadius: 4 }}>✕</button>
                  )}
                </div>
              ))}
              {!readOnly && <button onClick={() => addRow(gi)} style={{ fontSize: 12, color: colors.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ إضافة نشاط</button>}
            </div>
          </div>
        ))}
        {addRowInput('اسم المبادرة الجديدة...', addGroup)}
      </div>
    );
  }

  // ── op_gantt ──
  if (templateType === "op_gantt") {
    const mths = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    const acts = formData.activities?.length ? formData.activities : [];
    const barCols = [colors.primary, colors.blue, colors.primary, colors.amberLine, colors.amberLine, colors.green];
    // صفوف الأنشطة المنقولة من «المبادرات التشغيلية» مرتبطة بها (source_id): الاسم يُعدَّل هناك وتبقى الأشهر هنا
    const months12 = a => Array.from({ length: 12 }, (_, j) => (a?.months?.[j] ? 1 : 0));
    const toggleM = (ai, mi) => {
      if (readOnly) return;
      setFormData({ ...formData, activities: acts.map((a, i) => i !== ai ? a : { ...a, months: months12(a).map((m, j) => j !== mi ? m : (m ? 0 : 1)) }) });
    };
    const addAct = () => {
      if (readOnly) return;
      setFormData({ ...formData, activities: [...acts, { name: '', months: Array(12).fill(0) }] });
    };
    const removeAct = (ai) => {
      if (readOnly) return;
      const a = acts[ai];
      if ((a?.name || months12(a).some(Boolean)) && !window.confirm('حذف هذا النشاط من الجدول الزمني؟')) return;
      setFormData({ ...formData, activities: acts.filter((_, i) => i !== ai) });
    };
    const linkedCount = acts.filter(a => a.source_id && !a.source_missing).length;
    const syncNotes = !readOnly && sync ? [
      sync.added > 0   && `أنشطة جديدة نُقلت من «المبادرات التشغيلية»: ${sync.added}. حدّد أشهرها ثم احفظ.`,
      sync.renamed > 0 && `حُدّثت أسماء أنشطة وفق «المبادرات التشغيلية» مع الإبقاء على أشهرها المحددة: ${sync.renamed}.`,
      sync.linked > 0  && `رُبطت صفوف محفوظة سابقًا بأنشطتها في «المبادرات التشغيلية» دون تكرار: ${sync.linked}.`,
    ].filter(Boolean) : [];
    return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.primary, marginBottom: 10 }}>مخطط جانت — الجدول الزمني</h4>
        {syncNotes.length > 0 && (
          <div role="status" style={{ background: '#EAF4FD', border: '1px solid #A9D2F5', borderRadius: 8, padding: '9px 14px', marginBottom: 12, fontSize: 12.5, color: '#1A65AD', lineHeight: 1.9 }}>
            {syncNotes.map((t, i) => <div key={i}>{t}</div>)}
          </div>
        )}
        {acts.length === 0 && emptyState(<DfIcon name="calendar" size={20} />, readOnly ? 'لم يتم إضافة أي أنشطة' : 'لا توجد أنشطة بعد. أضف الأنشطة في «المبادرات التشغيلية» لتظهر هنا تلقائيًا، أو أضف نشاطًا يدويًا.')}
        {acts.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ padding: 8, background: colors.primaryDeep, color: "white", fontSize: 11, position: "sticky", right: 0, zIndex: 1, minWidth: 160, textAlign: "right" }}>النشاط</th>
                  {mths.map(m => <th key={m} style={{ padding: "8px 4px", background: colors.primaryDeep, color: "white", fontSize: 9, fontWeight: 500, textAlign: "center" }}>{m}</th>)}
                  {!readOnly && <th aria-label="حذف" style={{ background: colors.primaryDeep, width: 34 }} />}
                </tr>
              </thead>
              <tbody>
                {acts.map((a, ai) => {
                  const removable = !a.source_id || a.source_missing;
                  const rowBg = a.source_missing ? '#FEF3EC' : 'white';
                  return (
                    <tr key={a.source_id || `manual-${ai}`} style={{ borderBottom: `1px solid ${colors.grayBorder}`, background: rowBg }}>
                      <td style={{ padding: 6, background: rowBg, position: "sticky", right: 0, minWidth: 170 }}>
                        {a.source_id || readOnly ? (
                          <div>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0E2A3D', overflowWrap: 'anywhere' }}>{a.name || '—'}</div>
                            {a.initiative && <div style={{ fontSize: 10, color: colors.gray }}>{a.initiative}</div>}
                            {a.source_missing && !readOnly && <div style={{ fontSize: 10, color: '#A33F12', fontWeight: 600 }}>لم يعد ضمن «المبادرات التشغيلية» — احذفه إن لم يعد مطلوبًا</div>}
                          </div>
                        ) : (
                          <div>
                            <input value={a.name || ''} onChange={e => setFormData({ ...formData, activities: acts.map((x, i) => i !== ai ? x : { ...x, name: e.target.value }) })} placeholder="اسم النشاط" aria-label={`اسم النشاط المضاف يدويًا ${ai + 1}`} style={{ ...iStyle, width: "92%" }} />
                            <div style={{ fontSize: 10, color: colors.gray, marginTop: 2 }}>مضاف يدويًا</div>
                          </div>
                        )}
                      </td>
                      {months12(a).map((active, mi) => (
                        <td key={mi} style={{ padding: 2, textAlign: "center" }}>
                          <button type="button" onClick={() => toggleM(ai, mi)} disabled={readOnly} aria-pressed={!!active} aria-label={`${a.name || 'النشاط'} — ${mths[mi]}`} title={mths[mi]}
                            style={{ display: 'block', width: '100%', minWidth: 26, height: 22, padding: 0, borderRadius: 4, background: active ? barCols[ai % barCols.length] : (readOnly ? 'transparent' : '#f3f4f6'), cursor: readOnly ? "default" : "pointer", border: !active && !readOnly ? `1px dashed ${colors.grayBorder}` : 'none' }} />
                        </td>
                      ))}
                      {!readOnly && (
                        <td style={{ padding: 2, textAlign: 'center' }}>
                          {removable && <button type="button" onClick={() => removeAct(ai)} aria-label={`حذف النشاط: ${a.name || ai + 1}`} title="حذف" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C53A3A', fontSize: 13, padding: '2px 6px' }}>✕</button>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!readOnly && linkedCount > 0 && (
          <p style={{ fontSize: 11, color: colors.gray, margin: '8px 0 0' }}>أسماء الأنشطة المنقولة تُعدَّل من «المبادرات التشغيلية»، وتبقى أشهرها المحددة هنا.</p>
        )}
        {!readOnly && (
          <button onClick={addAct} style={{ marginTop: 8, fontSize: 12, color: colors.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>+ إضافة نشاط يدويًا</button>
        )}
      </div>
    );
  }

  // ── op_responsible ──
  if (templateType === "op_responsible") {
    const rows = formData.rows?.length ? formData.rows : [];
    const updRow = (i, field, val) => {
      if (readOnly) return;
      setFormData({ ...formData, rows: rows.map((r, idx) => idx !== i ? r : { ...r, [field]: val }) });
    };
    return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.primary, marginBottom: 12 }}>تعيين المسؤولين</h4>
        {rows.length === 0 && emptyState(<DfIcon name="user" size={20} />, readOnly ? 'لم يتم إضافة أي صفوف' : 'اضغط + إضافة صف أو استخدم زر التعبئة التجريبية')}
        {rows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr>{["النشاط","المبادرة","مسؤول التنفيذ","القسم / الإدارة"].map(h => <th key={h} style={{ padding: "10px 8px", background: colors.primaryDeep, color: "white", fontSize: 11, fontWeight: 600, textAlign: "right" }}><OpLabel unit={unit} label={h} /></th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.grayBorder}` }}>
                  <td style={{ padding: 6 }}><input value={r.activity || ''} onChange={e => updRow(i, 'activity', e.target.value)} readOnly={readOnly} style={iStyle} placeholder="اسم النشاط..." /></td>
                  <td style={{ padding: 6 }}><input value={r.initiative || ''} onChange={e => updRow(i, 'initiative', e.target.value)} readOnly={readOnly} style={iStyle} placeholder="المبادرة..." /></td>
                  <td style={{ padding: 6 }}><input value={r.responsible || ''} onChange={e => updRow(i, 'responsible', e.target.value)} readOnly={readOnly} style={iStyle} placeholder="اسم المسؤول..." /></td>
                  <td style={{ padding: 6 }}><input value={r.department || ''} onChange={e => updRow(i, 'department', e.target.value)} readOnly={readOnly} style={iStyle} placeholder="القسم..." /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {!readOnly && (
          <button onClick={() => setFormData({ ...formData, rows: [...rows, { activity: '', initiative: '', responsible: '', department: '' }] })} style={{ marginTop: 8, fontSize: 12, color: colors.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ إضافة صف</button>
        )}
      </div>
    );
  }

  // ── op_budget ──
  if (templateType === "op_budget") {
    const rows = formData.rows?.length ? formData.rows : [];
    const updRow = (i, field, val) => {
      if (readOnly) return;
      const updated = rows.map((r, idx) => {
        if (idx !== i) return r;
        const nr = { ...r, [field]: val };
        if (field === 'unitCost' || field === 'count') {
          nr.total = (toNumber(nr.unitCost) * toNumber(nr.count)).toLocaleString('en-US');
        }
        return nr;
      });
      setFormData({ ...formData, rows: updated });
    };
    const grandTotal = rows.reduce((s, r) => s + toNumber(r.total), 0);
    return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.primary, marginBottom: 12 }}>الميزانية التشغيلية</h4>
        {rows.length === 0 && emptyState(<DfIcon name="money" size={20} />, readOnly ? 'لم يتم إضافة أي بنود' : 'اضغط + إضافة بند أو استخدم زر التعبئة التجريبية')}
        {rows.length > 0 && (
          <div style={{ overflowX: "auto", marginBottom: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
            <thead>
              <tr>{["النشاط","بند التكلفة","تكلفة الوحدة","العدد","الإجمالي"].map(h => <th key={h} style={{ padding: "10px 8px", background: colors.primaryDeep, color: "white", fontSize: 11, fontWeight: 600, textAlign: "right" }}><OpLabel unit={unit} label={h} /></th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.grayBorder}` }}>
                  <td style={{ padding: 6 }}><input value={r.activity || ''} onChange={e => updRow(i, 'activity', e.target.value)} readOnly={readOnly} style={iStyle} placeholder="النشاط..." /></td>
                  <td style={{ padding: 6 }}><input value={r.item || ''} onChange={e => updRow(i, 'item', e.target.value)} readOnly={readOnly} style={iStyle} placeholder="بند التكلفة..." /></td>
                  <td style={{ padding: 6 }}><input value={r.unitCost || ''} onChange={e => updRow(i, 'unitCost', e.target.value)} readOnly={readOnly} style={{ ...iStyle, textAlign: "center" }} placeholder="0" /></td>
                  <td style={{ padding: 6 }}><input value={r.count || ''} onChange={e => updRow(i, 'count', e.target.value)} readOnly={readOnly} style={{ ...iStyle, textAlign: "center" }} placeholder="0" /></td>
                  <td style={{ padding: 6 }}><input value={r.total || ''} readOnly style={{ ...iStyle, textAlign: "center", fontWeight: 700, background: "#FBF9F5" }} /></td>
                </tr>
              ))}
              <tr style={{ background: colors.primaryDeep }}>
                <td colSpan={4} style={{ padding: 10, color: "white", fontWeight: 700, fontSize: 14, textAlign: "center" }}>الإجمالي الكلي</td>
                <td style={{ padding: 10, color: "white", fontWeight: 800, fontSize: 16, textAlign: "center" }}>{grandTotal.toLocaleString('en-US')} ريال</td>
              </tr>
            </tbody>
          </table>
          </div>
        )}
        {!readOnly && (
          <button onClick={() => setFormData({ ...formData, rows: [...rows, { activity: '', item: '', unitCost: '', count: '', total: '' }] })} style={{ fontSize: 12, color: colors.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ إضافة بند</button>
        )}
      </div>
    );
  }

  return <div style={{ color: colors.gray, textAlign: "center", padding: 40 }}>نموذج العمل قيد التطوير</div>;
};

// ─── OpUnitPage (6 tabs — original design) ──────────────────────
const OpUnitPage = ({ unitSummary, onBack, consultantName, nextUnit, prevUnit, onNext, onPrev, workflowId, totalUnits }) => {
  const [tab,        setTab]        = useState(0);
  const [unitData,   setUnitData]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData,   setFormData]   = useState({});
  const [msg,        setMsg]        = useState(null);
  const [loadError,  setLoadError]  = useState(null);

  const tabs = ["نبذة", "شرح مكتوب", "إرشادات", "فيديو", "خدمة الدردشة", "نماذج العمل"];
  const unitNum = unitSummary.unit_number || unitSummary.id;

  useEffect(() => {
    let alive = true;
    // الصفحة نفسها تُستخدم للوحدة التالية/السابقة: تُفرَّغ بيانات الوحدة السابقة حتى لا تُعرض أو تُحفظ باسم الوحدة الجديدة
    setLoading(true);
    setLoadError(null);
    setUnitData(null);
    setFormData({});
    operationalApi.getUnit(workflowId, unitNum)
      .then(res => {
        if (!alive) return undefined;
        setUnitData(res.data);
        const saved = res.data.submission?.form_data;
        if (saved && Object.keys(saved).length > 0) {
          setFormData(saved);
          return undefined;
        }
        // Initialize with template-specific empty structure so save never sends {}
        const ttype = res.data.unit?.template_type || res.data.unit?.templateType;
        if (ttype === 'op_import') {
          // أول فتح: استيراد أسماء مبادرات الخطة الاستراتيجية المكتملة في دفة (إن وُجدت) مع مربعات التحديد؛
          // وإلا تبقى القائمة فارغة لإضافة الأسماء يدويًا
          return operationalApi.getStrategicInitiatives(workflowId)
            .then(r => { if (alive) setFormData({ items: (r.data.initiatives || []).map(name => ({ name, checked: true, imported: true })) }); })
            .catch(() => { if (alive) setFormData({ items: [] }); });
        }
        const empties = { op_activities: { groups: [] }, op_gantt: { activities: [] }, op_responsible: { rows: [] }, op_budget: { rows: [] } };
        setFormData(empties[ttype] || {});
        return undefined;
      })
      .catch(e => { if (alive) setLoadError(e.response?.data?.message || 'تعذّر تحميل الوحدة. تحقق من الاتصال ثم حاول مجددًا.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [unitNum]);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  const ttype = unitData?.unit?.template_type || unitSummary.template_type;
  // معرّف ثابت لكل نشاط قبل الإرسال حتى تبقى صفوف «الجدول الزمني للتنفيذ» مرتبطة بأنشطتها
  const preparedData = () => {
    const data = ttype === 'op_activities' ? withActivityIds(formData) : formData;
    if (data !== formData) setFormData(data);
    return data;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await operationalApi.saveUnit(workflowId, unitNum, { form_data: preparedData() });
      setUnitData(prev => (prev ? { ...prev, sync: null } : prev));
      showMsg('success', 'تم حفظ البيانات بنجاح');
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'حدث خطأ في الحفظ');
    } finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await operationalApi.submitUnit(workflowId, unitNum, { form_data: preparedData() });
      // تحديث الحالة محلياً فوراً → يُفعّل زر "الوحدة التالية"
      setUnitData(prev => ({ ...prev, submission: res.data.submission, sync: null }));
      showMsg('success', 'تم الإرسال — يمكنك الانتقال للوحدة التالية');
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'حدث خطأ في الإرسال');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80, color: colors.primary, fontSize: 16 }}>جاري تحميل الوحدة...</div>;
  if (loadError || !unitData) return (
    <div role="alert" style={{ textAlign: "center", padding: 60 }}>
      <div style={{ color: '#b91c1c', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{loadError || 'تعذّر تحميل الوحدة.'}</div>
      <Btn variant="secondary" onClick={onBack}>→ العودة إلى الوحدات</Btn>
    </div>
  );

  const unit       = unitData?.unit || unitSummary;
  const submission = unitData?.submission;
  const status     = submission?.status || 'not_started';
  const isReadOnly = status === 'approved';

  return (
    <div className="animate-in">
      <div style={{ fontSize: 12, color: colors.gray, marginBottom: 4 }}>التخطيط التشغيلي {">"} {unit.name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: colors.primary, display: "flex" }}>{Icons.arrow}</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.ink, display: 'flex', alignItems: 'center' }}>{unit.name}<Help term={unit.template_type} /></h2>
        <Badge text={`الوحدة ${unitNum} من ${totalUnits || '؟'}`} color="primary" small />
      </div>
      <StatusBar status={status === 'not_started' ? 'not_submitted' : status} />
      <div style={{ margin: "12px 0 16px" }}><Tab tabs={tabs} active={tab} onChange={setTab} /></div>

      {msg && (
        <div style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 20px", borderRadius: 10, background: msg.type==="success"?"#C9EFE1":"#F8D3D3", color: msg.type==="success"?"#0B7F5D":"#C53A3A", fontWeight: 600, fontSize: 13, boxShadow: "0 4px 16px rgba(14,42,61,0.12)", zIndex: 9999 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{msg.type==="success" ? <IcCheck width={14} height={14}/> : <IcXMark width={14} height={14}/>}{msg.text}</span>
        </div>
      )}

      <Card>
        {/* النبذة والشرح والإرشادات: بطاقة واحدة بخلفية زرقاء فاتحة من المحتوى المُدار في لوحة التحكم (دون مرفقات) */}
        {tab === 0 && (hasOpSection(unit, 'overview') ? <OpSection unit={unit} section="overview" /> : (
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>نبذة عن {unit.name}</h3>
            <p style={{ fontSize: 14, color: colors.gray, lineHeight: 2 }}>{unit.overview}</p>
            <p style={{ fontSize: 14, color: colors.gray, lineHeight: 2, marginTop: 12 }}>{unit.overview2}</p>
          </div>
        ))}
        {tab === 1 && (hasOpSection(unit, 'explanation') ? <OpSection unit={unit} section="explanation" /> : (
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>شرح مكتوب: {unit.name}</h3>
            {(unit.topics || []).map((tp, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: colors.primary, marginBottom: 8 }}>{i + 1}. {tp.t}</h4>
                <p style={{ fontSize: 13, color: colors.gray, lineHeight: 2 }}>{tp.d}</p>
              </div>
            ))}
          </div>
        ))}
        {tab === 2 && (hasOpSection(unit, 'guidelines') ? <OpSection unit={unit} section="guidelines" /> : (
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>إرشادات: {unit.name}</h3>
            {(unit.steps || []).map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>{s.title}</h4>
                  <p style={{ fontSize: 13, color: colors.gray }}>{s.desc}</p>
                </div>
              </div>
            ))}
            {unit.tip && (
              <div style={{ padding: 14, background: colors.amberSoft, borderRadius: 10, borderRight: `3px solid ${colors.amberLine}`, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: colors.amberText, flexShrink: 0 }}><IcLightbulb width={16} height={16}/></span>
                <span style={{ fontSize: 13, color: colors.gray }}>{unit.tip}</span>
              </div>
            )}
          </div>
        ))}
        {tab === 3 && (
          <div style={{ textAlign: "center" }}>
            {toEmbedUrl(unit.video_url || unit.videoUrl) ? (
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 14, overflow: "hidden" }}>
                <iframe
                  src={toEmbedUrl(unit.video_url || unit.videoUrl)}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  allowFullScreen
                  title={unit.name}
                />
              </div>
            ) : (
              <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", aspectRatio: "16/9", background: `linear-gradient(135deg, ${colors.primaryDeep}, #123247)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icons.play}</div>
                <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(14,42,61,0.6)", padding: "4px 10px", borderRadius: 6, color: "white", fontSize: 12 }}>{unit.video_duration || unit.videoDuration}</div>
              </div>
            )}
            <h4 style={{ fontSize: 15, fontWeight: 600, color: colors.ink, marginTop: 16 }}>شرح {unit.name}</h4>
          </div>
        )}
        {tab === 4 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 14px", background: colors.grayLight, borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                {(consultantName || "م")[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{consultantName || "المستشار"}</div>
                <div style={{ fontSize: 11, color: colors.green }}>● متصل</div>
              </div>
            </div>
            <EmbeddedChat consultantName={consultantName} />
          </div>
        )}
        {tab === 5 && (
          <div>
            {(() => {
              const trialBtn = !isReadOnly && TRIAL_FILL[ttype] ? (
                <button
                  onClick={() => setFormData(prev => trialFillFor(ttype, prev))}
                  style={{ fontSize: 12, color: colors.blue, background: colors.blueLight, border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontFamily: "'Cairo', sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <IcBeaker width={14} height={14}/> تعبئة تجريبية
                </button>
              ) : null;
              const f = unit.content?.form;
              // تعليمات نموذج العمل أعلى النموذج + «عرض مثال توضيحي» (نافذة منبثقة مع «إغلاق»)
              return f && (f.title || f.heading || f.blocks?.length || f.example) ? (
                <div style={{ marginBottom: 16 }}><OpFormIntro unit={unit} actions={trialBtn} /></div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.ink }}>نماذج العمل: {unit.name}</h3>
                  {trialBtn}
                </div>
              );
            })()}
            <OpTemplateRenderer unit={unit} formData={formData} setFormData={isReadOnly ? () => {} : setFormData} readOnly={isReadOnly} sync={unitData?.sync} />
            {!isReadOnly && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, gap: 10, flexWrap: "wrap" }}>
                {/* Previous unit — far left */}
                <div>
                  {prevUnit ? (
                    <Btn variant="secondary" onClick={() => onPrev && onPrev(prevUnit)}>
                      → الوحدة السابقة: {prevUnit.name}
                    </Btn>
                  ) : <span />}
                </div>
                {/* Main actions — far right */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Btn variant="secondary" onClick={handleSave} disabled={saving}>
                    {saving ? "جاري الحفظ..." : <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><IcSave width={14} height={14}/>حفظ</span>}
                  </Btn>
                  <Btn
                    onClick={handleSubmit}
                    disabled={submitting || ['submitted','reviewing','approved'].includes(status)}>
                    {submitting ? "جاري الإرسال..." : status === 'submitted' ? "تم الإرسال" : "إرسال للمراجعة ←"}
                  </Btn>
                  {nextUnit && (
                    <Btn
                      variant="secondary"
                      disabled={!['submitted','reviewing','revision','approved'].includes(status)}
                      onClick={() => onNext && onNext(nextUnit)}>
                      الوحدة التالية: {nextUnit.name} ←
                    </Btn>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── Step 0: OpStepInfo ──────────────────────────────────────────
const OP_UNIT_FALLBACK = [
  {unit_number:1,name:"المبادرات الاستراتيجية في التخطيط التشغيلي"},
  {unit_number:2,name:"المبادرات التشغيلية"},
  {unit_number:3,name:"الجدول الزمني للتنفيذ"},
  {unit_number:4,name:"مسؤول التنفيذ"},
  {unit_number:5,name:"التكلفة المالية"},
];

const OpStepInfo = ({ strategicCompleted, units, catalog, pricing, consultant, onStart, loading }) => {
  const displayUnits = catalog?.length ? catalog : (units || OP_UNIT_FALLBACK);
  const basePrice    = pricing?.base     ?? 3500;
  const taxRate      = (pricing?.tax_rate ?? 15) / 100;
  const tax          = Math.round(basePrice * taxRate);
  const total        = basePrice + tax;

  return (
  <div className="animate-in">
    {!strategicCompleted && (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", background: colors.blueLight, border: `1.5px solid ${colors.blue}`, borderRadius: 12, marginBottom: 20 }}>
        <span style={{ flexShrink: 0, color: colors.blue }}><IcLightbulb width={22} height={22}/></span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.blue, marginBottom: 4 }}>ملاحظة</div>
          <div style={{ fontSize: 13, color: "#164F8A", lineHeight: 1.7 }}>التخطيط التشغيلي نظام مستقل: يمكنك البدء فيه مباشرة دون خطة استراتيجية، وتختار مستشارك في خطوة الدفع.</div>
        </div>
      </div>
    )}

    <Card accent style={{ padding: 32, textAlign: "center", marginBottom: 20 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: colors.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={colors.amberText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.ink }}>نظام التخطيط التشغيلي</h2>
      <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, maxWidth: 600, margin: "12px auto 0" }}>تحويل المبادرات الاستراتيجية إلى خطة تشغيلية مفصلة بالأنشطة والجدول الزمني والمسؤوليات والتكاليف</p>
    </Card>

    <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 16, marginBottom: 20 }}>
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>ما يشمله النظام</h3>
        {["استيراد المبادرات من الخطة الاستراتيجية","تفكيك المبادرات إلى أنشطة تشغيلية","مخطط جانت للجدول الزمني (12 شهر)","تعيين المسؤولين عن كل نشاط","تقدير التكلفة المالية والميزانية","مراجعة واعتماد المستشار","وثيقة تشغيلية نهائية"].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 6 ? `1px solid ${colors.grayLight}` : "none" }}>
            <span style={{ color: colors.green }}><IcCheck width={14} height={14}/></span>
            <span style={{ fontSize: 13, color: colors.ink }}>{item}</span>
          </div>
        ))}
      </Card>
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>الوحدات التخطيطية الـ {displayUnits.length}</h3>
        {displayUnits.map((u, i) => (
          <div key={u.unit_number || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < displayUnits.length - 1 ? `1px solid ${colors.grayLight}` : "none" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: colors.primaryDeep, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{u.unit_number || u.id}</span>
            <span style={{ fontSize: 13, color: colors.ink }}>{u.name}</span>
          </div>
        ))}
        {consultant && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#D9E8F1", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: colors.primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>م</div>
            <div>
              <div style={{ fontSize: 11, color: colors.gray }}>المستشار المشرف</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{consultant.name}</div>
            </div>
          </div>
        )}
        <div style={{ marginTop: 12, padding: "12px 14px", background: colors.grayLight, borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: colors.gray, marginBottom: 4 }}>
            <span>السعر الأساسي</span><span>{basePrice.toLocaleString('en-US')} ريال</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: colors.gray, marginBottom: 6 }}>
            <span>ضريبة القيمة المضافة ({pricing?.tax_rate ?? 15}%)</span><span>{tax.toLocaleString('en-US')} ريال</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: colors.ink, borderTop: `1px solid ${colors.grayBorder}`, paddingTop: 6 }}>
            <span>الإجمالي</span><span style={{ color: colors.primary }}>{total.toLocaleString('en-US')} ريال</span>
          </div>
        </div>
      </Card>
    </div>

    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Btn disabled={loading} onClick={onStart}>
          {loading ? "جاري التحميل..." : "التالي: الدفع ←"}
        </Btn>
      </div>
    </div>
  </div>
  );
};

// ─── Step 1: OpStepPayment ───────────────────────────────────────
const OpStepPayment = ({ workflow, setOpStep, onPay, strategicConsultant, onWorkflowUpdate }) => {
  const EMPTY_CARD = { number: '', expiry: '', cvv: '', name: '' };
  const [payMethod,     setPayMethod]     = useState(0);
  const [card,          setCard]          = useState(EMPTY_CARD);
  const [discountCode,  setDiscountCode]  = useState('');
  const [paying,        setPaying]        = useState(false);
  const [payError,      setPayError]      = useState(null);

  const methodKeys  = PAY_METHODS.map(m => m.key);
  const consultant  = workflow?.consultant || null;
  // خطة مستقلة بلا مستشار موروث: يختار العميل مستشاره قبل الدفع
  const needsConsultant = !workflow?.consultant_id;
  const alreadyPaid = workflow?.payment_status === 'paid' || workflow?.status === 'active';

  // ── Read actual amounts from workflow (set by start() on the server) ───────
  const subtotal    = workflow?.subtotal   ?? 0;
  const taxAmount   = workflow?.tax_amount ?? 0;
  const total       = workflow?.total      ?? 0;
  const taxRatePct  = subtotal > 0 ? Math.round((taxAmount / subtotal) * 100) : 15;
  const fmt = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const handlePay = async () => {
    setPayError(null);
    if (needsConsultant) { setPayError('اختر المستشار أولًا لإتمام الدفع.'); return; }
    setPaying(true);
    const method = methodKeys[payMethod];
    try {
      // 1. Run gateway validation/charge (swap gatewayCharge body for real provider)
      await gatewayCharge({ method, card, amount: total });
      // 2. Record the payment on the server
      await onPay(method, discountCode.trim() || undefined);
    } catch (e) {
      setPayError(e.message || 'حدث خطأ في عملية الدفع');
    } finally {
      setPaying(false);
    }
  };

  if (alreadyPaid) return (
    <PaymentReceipt
      workflow={workflow}
      serviceLabel="التخطيط التشغيلي"
      extraRows={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.gray }}>
            <span>الخدمة</span>
            <span style={{ color: '#334452', fontWeight: 600 }}>التخطيط التشغيلي (5 وحدات)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.gray }}>
            <span>المستشار</span>
            <span style={{ color: '#334452', fontWeight: 600 }}>{consultant?.name || '—'}</span>
          </div>
        </div>
      }
    />
  );

  return (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.ink, marginBottom: 20 }}>إتمام الدفع — التخطيط التشغيلي</h2>

      {(needsConsultant || workflow?.consultant_selected_here) && (
        <ConsultantPicker
          selectedId={workflow?.consultant_id}
          subtitle="يراجع المستشار وحدات التخطيط التشغيلي ويعتمدها. اختر مستشارًا لمتابعة هذه الخطة."
          loadConsultants={() => operationalApi.getConsultants()}
          onSelect={async id => {
            const res = await operationalApi.selectConsultant(workflow.id, { consultant_id: id });
            onWorkflowUpdate?.({ ...res.data.workflow, consultant_selected_here: true });
            setPayError(null);
          }}
        />
      )}

      {payError && (
        <div style={{ padding: "12px 16px", background: "#F8D3D3", borderRadius: 10, color: "#C53A3A", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <IcXMark width={14} height={14}/> {payError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 20 }}>

        {/* ── Order summary ──────────────────────────────────────── */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>ملخص الطلب</h3>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "10px 0", borderBottom: `1px solid ${colors.grayLight}` }}>
            <span>نظام التخطيط التشغيلي (5 وحدات)</span>
            <span style={{ fontWeight: 600 }}>{fmt(subtotal)} ريال</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${colors.grayLight}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>المستشار:</span>
              {consultant
                ? <span style={{ fontWeight: 600, color: colors.ink }}>{consultant.name}</span>
                : <span style={{ color: colors.gray }}>سيتم تحديده لاحقاً</span>}
            </div>
            <span style={{ color: colors.green, fontSize: 12 }}>مشمول</span>
          </div>

          {/* Discount code */}
          <div style={{ marginTop: 12, marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.ink, marginBottom: 6 }}>كود الخصم (اختياري)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="أدخل كود الخصم"
                value={discountCode}
                onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                style={{ flex: 1, padding: "8px 12px", border: `1.5px solid ${colors.grayBorder}`, borderRadius: 8, fontSize: 12, fontFamily: "inherit", outline: "none", direction: "rtl" }}
              />
            </div>
          </div>

          {/* Totals */}
          <div style={{ marginTop: 14, padding: "12px 0", borderTop: `2px solid ${colors.ink}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: colors.gray }}>
              <span>المجموع الفرعي</span><span>{fmt(subtotal)} ريال</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: colors.gray }}>
              <span>ضريبة القيمة المضافة ({taxRatePct}%)</span><span>{fmt(taxAmount)} ريال</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: colors.ink, marginTop: 8 }}>
              <span>الإجمالي</span><span style={{ color: colors.primary }}>{fmt(total)} ريال</span>
            </div>
          </div>
        </Card>

        {/* ── Payment method ─────────────────────────────────────── */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>طريقة الدفع</h3>
          <div style={{ marginBottom: 16 }}>
            <PaymentMethodPicker
              value={PAY_METHODS[payMethod]?.key}
              onChange={k => { setPayMethod(Math.max(0, PAY_METHODS.findIndex(m => m.key === k))); setCard(EMPTY_CARD); setPayError(null); }}
            />
          </div>

          {/* Controlled payment forms */}
          {(payMethod === 0) && <CardForm card={card} onChange={setCard} isMada={false} />}
          {(payMethod === 1) && <CardForm card={card} onChange={setCard} isMada={true}  />}
          {(payMethod === 2) && <ApplePayForm />}
          {(payMethod === 3) && <BankTransferInfo />}

          <SecurePaymentBadge />
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Btn variant="secondary" onClick={() => setOpStep(0)}>→ السابق</Btn>
        <Btn disabled={paying || needsConsultant} onClick={handlePay}>
          {paying
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <svg style={{ animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                جاري المعالجة...
              </span>
            : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IcLock width={14} height={14}/>
                ادفع الآن — {fmt(total)} ريال
              </span>}
        </Btn>
      </div>
    </div>
  );
};

// ─── Step 2: OpStepWork ──────────────────────────────────────────
const OpStepWork = ({ units, setOpStep, setActiveUnit, readOnly }) => {
  const SUBMITTED = ['submitted', 'reviewing', 'revision', 'approved'];
  const isAccessible = (i) => {
    if (readOnly) return true; // في وضع المراجعة كل الوحدات قابلة للعرض
    if (i === 0) return true;
    return (units || []).slice(0, i).every(u => SUBMITTED.includes(u.submission_status));
  };

  const total          = (units || []).length;
  const submittedCount = (units || []).filter(u => SUBMITTED.includes(u.submission_status)).length;
  const approvedCount  = (units || []).filter(u => u.submission_status === 'approved').length;
  const allSubmitted   = total > 0 && submittedCount === total;

  const statusSummary = [
    { label: 'معتمدة',         count: approvedCount,                                                              color: colors.green  },
    { label: 'قيد المراجعة',   count: (units||[]).filter(u=>u.submission_status==='reviewing').length,            color: '#235D7F'     },
    { label: 'مُرسلة',         count: (units||[]).filter(u=>u.submission_status==='submitted').length,            color: colors.blue   },
    { label: 'تحتاج تعديل',    count: (units||[]).filter(u=>u.submission_status==='revision').length,            color: colors.amberText },
    { label: 'قيد العمل',      count: (units||[]).filter(u=>u.submission_status==='in_progress').length,         color: '#A33F12'     },
    { label: 'لم تبدأ',        count: (units||[]).filter(u=>!u.submission_status||u.submission_status==='not_started').length, color: colors.gray },
  ].filter(s => s.count > 0);

  return (
    <div className="animate-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: colors.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", color: colors.amberText }}><IcCog width={22} height={22}/></div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.ink }}>تعبئة النماذج — التخطيط التشغيلي</h2>
          <div style={{ fontSize: 12, color: colors.gray }}>
            {readOnly ? 'وضع المراجعة — اضغط على أي وحدة لعرض بياناتها' : '5 وحدات تخطيطية — أكمل كل وحدة وأرسلها للمراجعة لفتح التالية'}
          </div>
        </div>
      </div>

      {/* ملخص الحالات في وضع المراجعة */}
      {readOnly && statusSummary.length > 0 && (
        <div style={{ background: '#E8F8F2', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 8, border: '1px solid #A9E4CF' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#086449', width: '100%', marginBottom: 4 }}>ملخص الوحدات:</span>
          {statusSummary.map(s => (
            <span key={s.label} style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.color + '20', color: s.color }}>
              {s.label}: {s.count}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "var(--g-5)", gap: 12, marginBottom: 20 }}>
        {(units || []).map((u, i) => {
          const accessible = isAccessible(i);
          const status = u.submission_status || 'not_started';
          const s = statusMap[status] || statusMap.not_started;
          return (
            <div key={u.id || u.unit_number}
              onClick={() => accessible && setActiveUnit(u)}
              style={{ background: accessible ? colors.primaryDeep : '#8C97A3', borderRadius: 12, padding: "20px 12px", textAlign: "center", borderBottom: `3px solid ${accessible ? (status==='approved'?colors.green:colors.amberLine) : '#5E6B78'}`, cursor: accessible ? "pointer" : "not-allowed", position: "relative", transition: "transform 0.2s, box-shadow 0.2s", opacity: accessible ? 1 : 0.65 }}
              onMouseEnter={e => { if (accessible) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(14,42,61,0.15)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              {!accessible && !readOnly && <div style={{ position: "absolute", top: 8, left: 8, color: "white" }}><IcLock width={16} height={16}/></div>}
              <div style={{ color: "white", fontSize: 13, fontWeight: 600, marginBottom: 10, minHeight: 40, lineHeight: 1.4 }}>{u.name}</div>
              <Badge text={accessible ? s.badge : "مقفل"} color={accessible ? s.color : "gray"} small />
            </div>
          );
        })}
      </div>

      {/* شريط التقدم */}
      <div style={{ background: "white", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(14,42,61,0.06)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.gray, marginBottom: 6 }}>
            <span>تقدم الإرسال</span>
            <span style={{ fontWeight: 700, color: allSubmitted ? colors.green : colors.primary }}>{submittedCount} / {total} وحدة</span>
          </div>
          <div style={{ height: 6, background: colors.grayLight, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${total ? (submittedCount / total) * 100 : 0}%`, background: allSubmitted ? colors.green : colors.primary, borderRadius: 4, transition: "width 0.4s" }} />
          </div>
        </div>
        {allSubmitted && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: colors.green, whiteSpace: "nowrap" }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={colors.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            تم إرسال الكل
          </div>
        )}
      </div>

      {/* أزرار التنقل — تُخفى في وضع المراجعة */}
      {!readOnly && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, alignItems: "center" }}>
          <Btn variant="secondary" onClick={() => setOpStep(1)}>→ السابق</Btn>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {!allSubmitted && (
              <div style={{ fontSize: 11, color: colors.gray }}>
                يجب إرسال جميع الوحدات ({total - submittedCount} متبقية) قبل المتابعة
              </div>
            )}
            <Btn disabled={!allSubmitted} onClick={() => setOpStep(3)}>إرسال الكل لمراجعة المستشار ←</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Step 3: OpStepReview ────────────────────────────────────────
const OpStepReview = ({ units, setOpStep, refreshData }) => {
  const [proceeding, setProceeding] = React.useState(false);

  const allApproved = (units || []).length > 0 && (units || []).every(u => u.submission_status === 'approved');
  const anyRevision = (units || []).some(u => u.submission_status === 'revision');

  // تحديث دوري كل 30 ثانية
  React.useEffect(() => {
    if (!refreshData) return;
    const interval = setInterval(() => refreshData(), 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleProceed = async () => {
    setProceeding(true);
    try { await refreshData?.(); } finally { setProceeding(false); }
  };

  return (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>مراجعة المستشار — التخطيط التشغيلي</h2>
      <p style={{ fontSize: 13, color: colors.gray, marginBottom: 20 }}>يقوم المستشار بمراجعة مخرجاتك واعتمادها أو طلب تعديل. سيتم إشعارك عند اكتمال الاعتماد.</p>

      {anyRevision && (
        <Card style={{ marginBottom: 16, padding: "14px 18px", background: "#FEF3EC", borderRight: `4px solid ${colors.amberLine}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: colors.amberText }}><IcArrowPath width={22} height={22}/></span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.amberText }}>بعض الوحدات تحتاج تعديل</div>
              <div style={{ fontSize: 12, color: colors.gray }}>راجع ملاحظات المستشار وأعد إرسال الوحدات المطلوبة</div>
            </div>
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 16, padding: "16px 20px", background: allApproved ? colors.greenLight : colors.blueLight, borderRight: `4px solid ${allApproved ? colors.green : colors.blue}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: allApproved ? colors.green : colors.blue }}>{allApproved ? <IcCheckCircle width={24} height={24}/> : <IcSearch width={24} height={24}/>}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: allApproved ? colors.green : colors.blue }}>
              {allApproved ? "تمت الموافقة على جميع الوحدات" : "جاري مراجعة الخطة التشغيلية"}
            </div>
            <div style={{ fontSize: 12, color: colors.gray }}>
              {allApproved ? "خطتك التشغيلية جاهزة للاعتماد النهائي" : "المستشار يراجع الوحدات — يتم تحديث الحالة تلقائياً كل 30 ثانية"}
            </div>
          </div>
        </div>
      </Card>

      {(units || []).map((u, i) => {
        const status = u.submission_status || 'not_started';
        const s = statusMap[status] || statusMap.not_started;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${colors.grayLight}`, background: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: colors.primaryDeep, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{u.unit_number || u.id}</div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</span>
            </div>
            <Badge text={s.badge} color={s.color} small />
          </div>
        );
      })}

      {allApproved && (
        <div style={{ background: '#C9EFE1', border: '1.5px solid #7FD3B5', borderRadius: 12, padding: '18px 22px', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}><DfIcon name="party" size={28} /></span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#086449' }}>تهانينا! تم اعتماد جميع الوحدات</div>
              <div style={{ fontSize: 12, color: '#086449', marginTop: 2 }}>خطتك التشغيلية جاهزة للاعتماد النهائي وتحميل الوثيقة</div>
            </div>
          </div>
          <button
            onClick={handleProceed}
            disabled={proceeding}
            style={{ padding: '11px 26px', background: proceeding ? '#8C97A3' : colors.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: proceeding ? 'not-allowed' : 'pointer', fontFamily: "inherit", whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(35,93,127,0.3)' }}
          >
            {proceeding ? '...' : 'الاعتماد النهائي ←'}
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 24 }}>
        <Btn variant="secondary" onClick={() => setOpStep(2)}>→ تعديل النماذج</Btn>
      </div>
    </div>
  );
};

// ─── Step 4: OpStepApproval ──────────────────────────────────────
const OpStepApproval = ({ workflow, setWorkflow, setOpStep, navigate, workflowId }) => {
  const [downloading,        setDownloading]        = React.useState(false);
  const [requestingArbitration, setRequestingArbitration] = React.useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await operationalApi.getPdfLink(workflowId);
      window.open(res.data.url, '_blank');
    } catch {
      alert('تعذّر تحميل الوثيقة، يرجى المحاولة مرة أخرى.');
    } finally {
      setDownloading(false);
    }
  };

  const handleRequestArbitration = async () => {
    setRequestingArbitration(true);
    try {
      const res = await operationalApi.requestArbitration(workflowId, { arbitration_step: 1 });
      if (setWorkflow) setWorkflow(res.data.workflow);
    } catch { /* fallback silently */ }
    finally { setRequestingArbitration(false); }
    setOpStep(5);
  };

  const consultant   = workflow?.consultant;
  const completedAt  = workflow?.completed_at
    ? new Date(workflow.completed_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="animate-in" style={{ textAlign: "center", maxWidth: 580, margin: "0 auto" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: colors.greenLight, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", color: colors.green }}><IcCheckCircle width={40} height={40}/></div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.ink, marginBottom: 8 }}>تم اعتماد الخطة التشغيلية!</h2>
      <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, marginBottom: 20 }}>تهانينا! اعتمد المستشار <strong style={{ color: colors.ink }}>{consultant?.name || '—'}</strong> خطتك التشغيلية بتاريخ {completedAt}.</p>

      {/* Info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: 16, textAlign: "center" }}>
          <div style={{ marginBottom: 6, display: "flex", justifyContent: "center", color: colors.primary }}><IcUser width={22} height={22}/></div>
          <div style={{ fontSize: 11, color: colors.gray, marginBottom: 4 }}>المستشار المشرف</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{consultant?.name || '—'}</div>
        </Card>
        <Card style={{ padding: 16, textAlign: "center" }}>
          <div style={{ marginBottom: 6, display: "flex", justifyContent: "center", color: colors.primary }}><IcCalendar width={22} height={22}/></div>
          <div style={{ fontSize: 11, color: colors.gray, marginBottom: 4 }}>تاريخ الاعتماد</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{completedAt}</div>
        </Card>
      </div>

      {/* PDF download */}
      <Card accent style={{ marginBottom: 16, textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primaryDeep, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}><IcDocument width={20} height={20}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>الوثيقة التشغيلية النهائية</div>
            <div style={{ fontSize: 12, color: colors.gray }}>وثيقة رسمية معتمدة — {workflow?.user?.org_name || 'خطة التشغيل'}</div>
          </div>
          <Btn small onClick={handleDownload} disabled={downloading}>
            {downloading ? "جارٍ التحميل..." : "تحميل PDF"}
          </Btn>
        </div>
      </Card>

      {/* تقييم المستشار */}
      {workflow?.consultant_id && workflow?.id && (
        <div style={{ marginBottom: 16 }}>
          <ConsultantRating
            consultantId={workflow.consultant_id}
            consultantName={consultant?.name}
            workflowType="operational"
            workflowId={workflow.id}
          />
        </div>
      )}

      {/* Arbitration */}
      <Card style={{ marginBottom: 16, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, background: colors.amber, transform: "rotate(45deg)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ transform: "rotate(-45deg)", color: "white", fontWeight: 700, fontSize: 14 }}>؟</span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink }}>هل تود تحكيم واعتماد الخطة من جهة استشارية؟</h3>
        </div>
        <p style={{ fontSize: 13, color: colors.gray, lineHeight: 1.7, marginBottom: 18 }}>
          يمكنك طلب تحكيم الخطة التشغيلية من جهة استشارية معتمدة لمزيد من المصداقية والجودة — الخدمة الإضافية اختيارية.
        </p>
        <div style={{ background: "#FBF9F5", borderRadius: 10, padding: "14px 16px", marginBottom: 16, textAlign: "right" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span>تحكيم الخطة التشغيلية</span><span style={{ fontWeight: 600 }}>2,500 ريال</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.gray, marginBottom: 6 }}>
            <span>ضريبة القيمة المضافة 15%</span><span>375 ريال</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: colors.ink, borderTop: `1px solid ${colors.grayBorder}`, paddingTop: 8 }}>
            <span>الإجمالي</span><span>2,875 ريال</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn onClick={handleRequestArbitration} disabled={requestingArbitration}>
            {requestingArbitration ? "جاري الطلب..." : "نعم — طلب التحكيم (2,875 ريال)"}
          </Btn>
          <Btn variant="secondary" onClick={() => navigate ? navigate('client-dash') : setOpStep(6)}>لا — متابعة بدون تحكيم</Btn>
        </div>
      </Card>
    </div>
  );
};

// ─── Step 5: OpStepArbitration — provider selection only ─────────
const OpStepArbitration = ({ setOpStep, setWorkflow, workflowId }) => {
  const [selected,   setSelected]   = React.useState(0);
  const [navigating, setNavigating] = React.useState(false);

  const arbitrators = [
    { name: "شركة الاستشارات الاستراتيجية",  desc: "جهة استشارية معتمدة في التخطيط الاستراتيجي" },
    { name: "مركز التميز المؤسسي",           desc: "جهة استشارية معتمدة في التخطيط الاستراتيجي" },
    { name: "معهد التخطيط للقطاع الثالث",   desc: "جهة استشارية معتمدة في التخطيط الاستراتيجي" },
  ];

  const handleNext = async () => {
    setNavigating(true);
    try {
      const res = await operationalApi.requestArbitration(workflowId, { arbitration_step: 2 });
      if (setWorkflow) setWorkflow(res.data.workflow);
    } catch { /* fallback silently */ }
    finally { setNavigating(false); }
    setOpStep(6);
  };

  return (
    <div className="animate-in" style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.ink, marginBottom: 6, textAlign: "center" }}>اختيار جهة التحكيم</h2>
      <p style={{ fontSize: 13, color: colors.gray, textAlign: "center", marginBottom: 20 }}>اختر الجهة الاستشارية التي ستتولى تحكيم وإجازة خطتك التشغيلية</p>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>الجهات المعتمدة</h3>
        {arbitrators.map((j, i) => (
          <div key={i} onClick={() => setSelected(i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, marginBottom: 8, cursor: "pointer", border: `2px solid ${i===selected ? colors.primary : colors.grayBorder}`, background: i===selected ? `${colors.primary}06` : "white", transition: "all 0.2s" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${i===selected ? colors.primary : colors.grayBorder}`, background: i===selected ? colors.primary : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {i===selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>{j.name}</div>
              <div style={{ fontSize: 11, color: colors.gray, marginTop: 2 }}>{j.desc}</div>
            </div>
            {i===selected && <span style={{ color: colors.primary }}><IcCheck width={18} height={18}/></span>}
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 20, padding: "14px 18px", background: "#EEF5F9", border: `1px solid #B5D2E3` }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: colors.gray, marginBottom: 4 }}>
          <span>تحكيم الخطة التشغيلية</span><span>2,500 ريال</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: colors.gray, marginBottom: 8 }}>
          <span>ضريبة القيمة المضافة 15%</span><span>375 ريال</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: colors.ink, borderTop: `1px solid ${colors.grayBorder}`, paddingTop: 8 }}>
          <span>الإجمالي المطلوب</span><span>2,875 ريال</span>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Btn variant="secondary" onClick={() => setOpStep(4)}>→ رجوع</Btn>
        <Btn onClick={handleNext} disabled={navigating}>
          {navigating ? "جاري الحفظ..." : "التالي: الدفع ←"}
        </Btn>
      </div>
    </div>
  );
};

// ─── Step 6: OpStepDone — payment form → completion ──────────────
const OpStepDone = ({ workflow, setWorkflow, navigate, onComplete, units, workflowId }) => {
  const EMPTY_CARD  = { number: '', expiry: '', cvv: '', name: '' };
  const alreadyPaid = (workflow?.arbitration_step ?? 0) >= 3;
  const [paid,        setPaid]        = React.useState(alreadyPaid);
  const [paying,      setPaying]      = React.useState(false);
  const [payMethod,   setPayMethod]   = React.useState(0);
  const [card,        setCard]        = React.useState(EMPTY_CARD);
  const [downloading, setDownloading] = React.useState(false);
  const [payError,    setPayError]    = React.useState(null);

  const methodKey = PAY_METHODS[payMethod]?.key ?? 'card';

  const handlePay = async () => {
    setPayError(null);
    setPaying(true);
    try {
      await gatewayCharge({ method: methodKey, card });
      const res = await operationalApi.requestArbitration(workflowId, { arbitration_step: 3 });
      if (setWorkflow) setWorkflow(res.data.workflow);
      setPaid(true);
      if (onComplete) onComplete();
    } catch (e) {
      setPayError(e.response?.data?.message || e.message || 'حدث خطأ في عملية الدفع، يرجى المحاولة مرة أخرى.');
    } finally { setPaying(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await operationalApi.getPdfLink(workflowId);
      window.open(res.data.url, '_blank');
    } catch {
      alert('تعذّر تحميل الوثيقة، يرجى المحاولة مرة أخرى.');
    } finally { setDownloading(false); }
  };

  const completedAt = workflow?.completed_at
    ? new Date(workflow.completed_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  const workflowCompleted = workflow?.status === 'completed';
  // units is null for completed workflows (backend only loads it at steps 3-4)
  // when null, trust workflow.status === 'completed' as proof all units are approved
  const allUnitsApproved  = !Array.isArray(units)
    ? workflowCompleted
    : units.length > 0 && units.every(u => u.submission_status === 'approved');
  const canNavigate  = allUnitsApproved && workflowCompleted;
  const pendingUnits = Array.isArray(units) ? units.filter(u => u.submission_status !== 'approved') : [];

  // ── شاشة الدفع ──
  if (!paid) {
    return (
      <div className="animate-in" style={{ maxWidth: 620, margin: "0 auto" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.ink, marginBottom: 6, textAlign: "center" }}>التحكيم والدفع</h2>
        <p style={{ fontSize: 13, color: colors.gray, textAlign: "center", marginBottom: 20 }}>أكمل الدفع لبدء إجراءات التحكيم الرسمية</p>

        {payError && (
          <div style={{ padding: "12px 16px", background: "#F8D3D3", borderRadius: 10, color: "#C53A3A", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <IcXMark width={14} height={14}/> {payError}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 16, marginBottom: 16 }}>
          {/* ملخص الدفع */}
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>ملخص التحكيم</h3>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${colors.grayLight}` }}>
              <span>تحكيم الخطة التشغيلية</span><span style={{ fontWeight: 600 }}>2,500 ريال</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.gray, padding: "8px 0", borderBottom: `1px solid ${colors.grayLight}` }}>
              <span>ضريبة القيمة المضافة 15%</span><span>375 ريال</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: colors.ink, padding: "12px 0" }}>
              <span>الإجمالي</span><span>2,875 ريال</span>
            </div>
            <div style={{ padding: "10px 14px", background: "#EEF5F9", borderRadius: 8, fontSize: 12, color: colors.primary, marginTop: 4 }}>
              الجهة: شركة الاستشارات الاستراتيجية
            </div>
          </Card>

          {/* طريقة الدفع */}
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, marginBottom: 12 }}>طريقة الدفع</h3>
            <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 6, marginBottom: 14 }}>
              {PAY_METHODS.map((m, i) => (
                <button key={m.key} onClick={() => setPayMethod(i)} style={{ padding: "10px 6px", borderRadius: 8, border: i===payMethod ? `2px solid ${colors.primary}` : `1.5px solid ${colors.grayBorder}`, background: i===payMethod ? `${colors.primary}10` : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit", transition: "all 0.2s", color: i===payMethod ? colors.primary : colors.gray }}>
                  <span style={{ color: i===payMethod ? colors.primary : colors.gray }}>{m.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: i===payMethod ? 700 : 500 }}>{m.label}</span>
                </button>
              ))}
            </div>
            {(methodKey === 'card' || methodKey === 'mada') && <CardForm card={card} onChange={setCard} isMada={methodKey === 'mada'} />}
            {methodKey === 'apple_pay'      && <ApplePayForm />}
            {methodKey === 'bank_transfer'  && <BankTransferInfo />}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 12px", background: colors.greenLight, borderRadius: 8, fontSize: 11, color: colors.green }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={colors.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              عملية دفع آمنة ومشفرة
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Btn variant="secondary" onClick={() => {}}>→ رجوع لاختيار الجهة</Btn>
          <Btn onClick={handlePay} disabled={paying}>
            {paying ? "جاري معالجة الدفع..." : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IcLock width={14} height={14}/>ادفع وابدأ التحكيم — 2,875 ريال</span>}
          </Btn>

        </div>
      </div>
    );
  }

  // ── شاشة الاكتمال ──
  return (
    <div className="animate-in" style={{ textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ width: 100, height: 100, borderRadius: "50%", background: colors.greenLight, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", color: colors.green }}><IcSparkles width={48} height={48}/></div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.ink, marginBottom: 8 }}>اكتمل التخطيط التشغيلي!</h2>
      <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, marginBottom: 20 }}>
        تم إنجاز خطتك التشغيلية بنجاح تحت إشراف المستشار <strong style={{ color: colors.ink }}>{workflow?.consultant?.name || '—'}</strong>.<br/>
        يمكنك الآن الانتقال لبناء السياسات واللوائح.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: 14, textAlign: "center" }}>
          <div style={{ marginBottom: 4, display: "flex", justifyContent: "center", color: colors.primary }}><IcUser width={18} height={18}/></div>
          <div style={{ fontSize: 10, color: colors.gray }}>المستشار</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.ink }}>{workflow?.consultant?.name || '—'}</div>
        </Card>
        <Card style={{ padding: 14, textAlign: "center" }}>
          <div style={{ marginBottom: 4, display: "flex", justifyContent: "center", color: colors.primary }}><IcCalendar width={18} height={18}/></div>
          <div style={{ fontSize: 10, color: colors.gray }}>تاريخ الاعتماد</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.ink }}>{completedAt}</div>
        </Card>
      </div>
      <Card accent style={{ marginBottom: 16, textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primaryDeep, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><IcDocument width={20} height={20}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>الوثيقة التشغيلية النهائية</div>
            <div style={{ fontSize: 12, color: colors.gray }}>معتمدة ومحكّمة — {workflow?.user?.org_name || ''}</div>
          </div>
          <Btn small onClick={handleDownload} disabled={downloading}>
            {downloading ? "..." : "تحميل"}
          </Btn>
        </div>
      </Card>

      {/* تقييم المستشار في شاشة الاكتمال */}
      {workflow?.consultant_id && workflow?.id && (
        <div style={{ textAlign: "right" }}>
          <ConsultantRating
            consultantId={workflow.consultant_id}
            consultantName={workflow?.consultant?.name}
            workflowType="operational"
            workflowId={workflow.id}
          />
        </div>
      )}

      {!canNavigate && (
        <div style={{ padding: "10px 16px", background: colors.yellowLight, borderRadius: 10, fontSize: 12, color: "#7F310E", fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <IcWarning width={14} height={14}/> {!workflowCompleted
            ? "يجب إتمام الدفع وإجراءات التحكيم أولاً لتفعيل هذا الزر."
            : `لا تزال ${pendingUnits.length} وحدة بانتظار الاعتماد من المستشار.`}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Btn onClick={() => canNavigate && navigate && navigate("policies-select")} disabled={!canNavigate}>الانتقال لبناء السياسات واللوائح ←</Btn>
        <Btn variant="ghost" onClick={() => navigate && navigate("client-dash")}>لوحة التحكم</Btn>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────
export default function OperationalRoadmap({ navigate, workflowId, onWorkflowSelect }) {
  const [workflow,           setWorkflow]           = useState(null);
  const [units,              setUnits]              = useState(null);
  const [catalog,            setCatalog]            = useState(null);
  const [pricing,            setPricing]            = useState(null);
  const [opStep,             setOpStep]             = useState(0);
  const [loading,            setLoading]            = useState(!!workflowId);
  const [starting,           setStarting]           = useState(false);
  const [activeUnit,         setActiveUnit]         = useState(null);
  const [strategicCompleted, setStrategicCompleted] = useState(false);
  const [strategicConsultant,setStrategicConsultant]= useState(null);
  const [isCreatingNew,      setIsCreatingNew]      = useState(false);
  const [plans,              setPlans]              = useState([]);
  const [plansLoading,       setPlansLoading]       = useState(false);

  const showPlansList = !workflowId && !isCreatingNew;

  const applyPageData = (data) => {
    setStrategicCompleted(data.strategic_completed || false);
    if (data.strategic_consultant) setStrategicConsultant(data.strategic_consultant);
    if (data.catalog) setCatalog(data.catalog);
    if (data.pricing) setPricing(data.pricing);
    if (data.workflow) {
      const wf = data.workflow;
      setWorkflow(wf);
      setOpStep(mapStep(wf));
      if (data.units) setUnits(data.units);
    }
  };

  const refreshData = async () => {
    const res = await operationalApi.getPageData(workflowId);
    applyPageData(res.data);
  };

  // جلب قائمة الخطط عند دخول الصفحة بدون workflowId
  useEffect(() => {
    if (!showPlansList) return;
    setPlansLoading(true);
    operationalApi.listWorkflows()
      .then(res => setPlans(res.data))
      .finally(() => setPlansLoading(false));
  }, [showPlansList]);

  // جلب بيانات الخطة المحددة
  useEffect(() => {
    if (!workflowId && !isCreatingNew) return;
    if (isCreatingNew && !workflowId) {
      // جديدة: جلب بيانات الكتالوج والتسعير فقط
      operationalApi.getPageData(null)
        .then(res => {
          setStrategicCompleted(res.data.strategic_completed || false);
          if (res.data.strategic_consultant) setStrategicConsultant(res.data.strategic_consultant);
          if (res.data.catalog) setCatalog(res.data.catalog);
          if (res.data.pricing) setPricing(res.data.pricing);
          setWorkflow(null);
          setOpStep(0);
        });
      return;
    }
    setLoading(true);
    operationalApi.getPageData(workflowId)
      .then(res => applyPageData(res.data))
      .finally(() => setLoading(false));
  }, [workflowId, isCreatingNew]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await operationalApi.start();
      const newWorkflow = res.data.workflow;
      setWorkflow(newWorkflow);
      setOpStep(1);
      setIsCreatingNew(false);
      if (onWorkflowSelect) onWorkflowSelect(newWorkflow.id);
    } catch (e) {
      alert(e.response?.data?.message || 'حدث خطأ في بدء الطلب');
    } finally { setStarting(false); }
  };

  const handlePay = async (method, discountCode) => {
    try {
      const res = await operationalApi.pay(workflowId, {
        payment_method: method,
        ...(discountCode ? { discount_code: discountCode } : {}),
      });
      setWorkflow(res.data.workflow);
      await refreshData();
    } catch (e) {
      const msg = e.response?.data?.message || 'حدث خطأ في عملية الدفع';
      throw new Error(msg);
    }
  };

  // عرض قائمة الخطط
  if (showPlansList) {
    return (
      <OpPlansList
        plans={plans}
        loading={plansLoading}
        onSelect={(id) => onWorkflowSelect && onWorkflowSelect(id)}
        onCreateNew={() => setIsCreatingNew(true)}
      />
    );
  }

  if (loading) return (
    <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center' }}>
        {[...Array(7)].map((_, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 70 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E8E3DA' }} />
              <div style={{ width: 50, height: 8, borderRadius: 4, background: '#E8E3DA' }} />
            </div>
            {i < 6 && <div style={{ flex: 1, height: 3, background: '#E8E3DA', minWidth: 20, marginBottom: 20 }} />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
        {[...Array(3)].map((_, i) => <div key={i} style={{ height: 56, borderRadius: 8, background: '#F3EFE8', marginBottom: 10 }} />)}
      </div>
    </div>
  );

  if (activeUnit) {
    const currentIndex = (units || []).findIndex(u => (u.unit_number || u.id) === (activeUnit.unit_number || activeUnit.id));
    const nextUnit     = currentIndex >= 0 && currentIndex < (units || []).length - 1 ? units[currentIndex + 1] : null;
    const prevUnit     = currentIndex > 0 ? units[currentIndex - 1] : null;
    return (
      <OpUnitPage
        unitSummary={activeUnit}
        consultantName={workflow?.consultant?.name}
        onBack={async () => { setActiveUnit(null); await refreshData(); }}
        nextUnit={nextUnit}
        prevUnit={prevUnit}
        onNext={async (unit) => { setActiveUnit(unit); await refreshData(); }}
        onPrev={async (unit) => { setActiveUnit(unit); await refreshData(); }}
        workflowId={workflowId}
        totalUnits={units?.length ?? 5}
      />
    );
  }

  return (
    <div className="animate-in">
      {/* زر العودة لقائمة الخطط */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => {
            setIsCreatingNew(false);
            if (onWorkflowSelect) onWorkflowSelect(null);
          }}
          style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
        >
          ← العودة إلى قائمة الخطط
        </button>
      </div>
      <OpWorkflowStepper opStep={opStep} setOpStep={setOpStep} workflow={workflow} />
      {opStep === 0 && <OpStepInfo strategicCompleted={strategicCompleted} units={units} catalog={catalog} pricing={pricing} consultant={strategicConsultant} onStart={handleStart} loading={starting} />}
      {opStep === 1 && <OpStepPayment workflow={workflow} setOpStep={setOpStep} onPay={handlePay} strategicConsultant={strategicConsultant} onWorkflowUpdate={setWorkflow} />}
      {opStep === 2 && <OpStepWork units={units} setOpStep={setOpStep} setActiveUnit={setActiveUnit} readOnly={opStep < mapStep(workflow)} />}
      {opStep === 3 && <OpStepReview units={units} setOpStep={setOpStep} refreshData={refreshData} />}
      {opStep === 4 && <OpStepApproval workflow={workflow} setWorkflow={setWorkflow} setOpStep={setOpStep} navigate={navigate} workflowId={workflowId} />}
      {opStep === 5 && <OpStepArbitration setOpStep={setOpStep} setWorkflow={setWorkflow} workflowId={workflowId} />}
      {(opStep === 6 || opStep === 7) && <OpStepDone workflow={workflow} setWorkflow={setWorkflow} navigate={navigate} onComplete={() => setOpStep(7)} units={units} workflowId={workflowId} />}
    </div>
  );
}
