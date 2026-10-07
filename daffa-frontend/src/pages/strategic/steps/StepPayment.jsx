import React, { useState } from 'react';
import { strategicApi } from '../../../api/strategic';

const C = {
  teal: '#1A6B7C', tealDark: '#14505E', tealLight: '#E8F4F6',
  orange: '#E8620A', orangeLight: '#FEF0E8',
  gray: '#6B7280', grayLight: '#F3F4F6', grayBorder: '#E5E7EB',
  green: '#16A34A', greenLight: '#DCFCE7',
  red: '#DC2626', redLight: '#FEE2E2',
};

// ── SVG Brand Icons ──────────────────────────────────────────────────────────
export const IcVisa = () => (
  <svg viewBox="0 0 48 16" width="42" height="14">
    <text x="0" y="13" fontFamily="Arial" fontWeight="900" fontSize="16" fill="#1a1f71">VISA</text>
  </svg>
);
export const IcMastercard = () => (
  <svg viewBox="0 0 38 24" width="38" height="24">
    <circle cx="13" cy="12" r="12" fill="#EB001B"/>
    <circle cx="25" cy="12" r="12" fill="#F79E1B"/>
    <path d="M19 5.26a12 12 0 0 1 0 13.48A12 12 0 0 1 19 5.26z" fill="#FF5F00"/>
  </svg>
);
export const IcMada = ({ height = 22 }) => (
  <svg viewBox="0 0 68 22" width={Math.round(68 * (height / 22))} height={height} xmlns="http://www.w3.org/2000/svg">
    <rect width="68" height="22" rx="4" fill="#00623b"/>
    <text x="34" y="16" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="13" fill="#fff" letterSpacing="1">mada</text>
  </svg>
);
export const IcApplePay = () => (
  <svg viewBox="0 0 60 24" width="54" height="24">
    <rect width="60" height="24" rx="4" fill="#000"/>
    <text x="6" y="17" fontFamily="-apple-system,sans-serif" fontWeight="600" fontSize="11" fill="#fff"> Pay</text>
    <path d="M10 7.5C9.2 7.5 8.5 7.9 8.1 8.5c-.4.7-.3 1.5.1 2.1.4.5 1 .9 1.7.9.7 0 1.3-.4 1.7-.9.3-.6.4-1.3 0-1.9-.3-.7-1-.9-1.6-.7" fill="#fff"/>
  </svg>
);
export const IcBank = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
export const IcCard = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IcCopy = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IcCheck = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
export const IcLock = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
export const IcEye = ({ show }) => show
  ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={C.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={C.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

// ── Payment Gateway Mock ──────────────────────────────────────────────────────
// Replace ONLY the body of this function with the real provider SDK when ready.
async function gatewayCharge({ method, card }) {
  // Test card: 4111 1111 1111 1111 | Expiry: 12/26 | CVV: 123 | Name: أي اسم
  await new Promise(r => setTimeout(r, 1600));
  if (method === 'card' || method === 'mada') {
    const num = (card.number || '').replace(/\s/g, '');
    if (num.length !== 16)                     throw new Error('رقم البطاقة يجب أن يكون 16 رقماً');
    const [mm, yy] = (card.expiry || '').split('/');
    if (!mm || !yy || Number(mm) < 1 || Number(mm) > 12) throw new Error('تاريخ الانتهاء غير صحيح (MM/YY)');
    const now = new Date();
    if (Number('20' + yy) < now.getFullYear() ||
        (Number('20' + yy) === now.getFullYear() && Number(mm) < now.getMonth() + 1))
      throw new Error('البطاقة منتهية الصلاحية');
    if ((card.cvv || '').length < 3)           throw new Error('رمز CVV يجب أن يكون 3 أرقام');
    if (!(card.name || '').trim())             throw new Error('اسم حامل البطاقة مطلوب');
    if (num === '4000000000000002')            throw new Error('البطاقة مرفوضة — استخدم 4111 1111 1111 1111 للاختبار');
  }
}

// ── Card number formatting ───────────────────────────────────────────────────
export const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
export const fmtExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
};
export const detectBrand = (num) => {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n)) return 'mc';
  if (/^(508|6220|9682|4001|4002|4003)/.test(n)) return 'mada';
  return null;
};

// ── Card Visual Preview ──────────────────────────────────────────────────────
export const CardPreview = ({ cardNum, name, expiry, brand }) => {
  const display = cardNum.replace(/\D/g, '').padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
  const grad = brand === 'visa'
    ? 'linear-gradient(135deg,#1a1f71,#3b5bdb)'
    : brand === 'mc'
    ? 'linear-gradient(135deg,#eb001b,#f79e1b)'
    : brand === 'mada'
    ? 'linear-gradient(135deg,#00623b,#009e60)'
    : `linear-gradient(135deg,${C.teal},${C.tealDark})`;
  return (
    <div style={{ background: grad, borderRadius: 14, padding: '22px 24px', marginBottom: 20, color: '#fff', position: 'relative', overflow: 'hidden', minHeight: 140 }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ fontSize: 11, opacity: 0.8, letterSpacing: 1 }}>بطاقة الدفع</div>
        <div>
          {brand === 'visa' && <div style={{ background: '#fff', borderRadius: 4, padding: '3px 8px' }}><IcVisa /></div>}
          {brand === 'mc' && <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: '2px 6px' }}><IcMastercard /></div>}
          {brand === 'mada' && <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: '2px 6px' }}><IcMada /></div>}
        </div>
      </div>
      <div style={{ fontFamily: "'Courier New', monospace", fontSize: 18, fontWeight: 700, letterSpacing: 3, marginBottom: 20 }}>
        {display}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 9, opacity: 0.7, marginBottom: 2, letterSpacing: 1 }}>اسم حامل البطاقة</div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{name || 'الاسم الكامل'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, opacity: 0.7, marginBottom: 2, letterSpacing: 1 }}>تاريخ الانتهاء</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{expiry || 'MM/YY'}</div>
        </div>
      </div>
    </div>
  );
};

// ── Copy Button ──────────────────────────────────────────────────────────────
export const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, border: `1px solid ${C.grayBorder}`, background: copied ? C.greenLight : '#fff', color: copied ? C.green : C.gray, fontSize: 11, cursor: 'pointer', fontFamily: "'Cairo',sans-serif", transition: 'all 0.2s' }}>
      {copied ? <IcCheck /> : <IcCopy />}
      {copied ? 'تم النسخ' : 'نسخ'}
    </button>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function StepPayment({ workflow, setWorkflow, setStep, pricing, workflowId, refreshWorkflow }) {
  const [method,   setMethod]   = useState('card');
  const [cardNum,  setCardNum]  = useState('');
  const [expiry,   setExpiry]   = useState('');
  const [cvv,      setCvv]      = useState('');
  const [holder,   setHolder]   = useState('');
  const [showCvv,  setShowCvv]  = useState(false);
  const [discount, setDiscount] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const subtotal    = parseFloat(workflow?.subtotal)   || 0;
  const tax         = parseFloat(workflow?.tax_amount) || 0;
  const total       = subtotal + tax;
  const taxRate     = pricing?.tax_rate             ?? 15;
  const certPrice   = pricing?.addon_certification  ?? 2000;
  const designPrice = pricing?.addon_design          ?? 1500;
  const brand       = detectBrand(cardNum);

  const handlePay = async () => {
    setLoading(true); setError('');
    try {
      await gatewayCharge({ method, card: { number: cardNum, expiry, cvv, name: holder } });
      await strategicApi.pay(workflowId, { payment_method: method, discount_code: discount || undefined });
      await refreshWorkflow();
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'حدث خطأ في عملية الدفع');
    } finally {
      setLoading(false);
    }
  };

  if (workflow?.payment_status === 'paid') {
    return (
      <PaymentReceipt
        workflow={workflow}
        serviceLabel="التخطيط الاستراتيجي"
        extraRows={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
            <RRow label="الخدمة"    value="التخطيط الاستراتيجي" />
            <RRow label="المستشار" value={workflow?.consultant?.name || '—'} />
            {workflow?.addon_certification && <RRow label="اعتماد الخطة"   value="مضاف ✓" vc={C.green} />}
            {workflow?.addon_design        && <RRow label="تصميم الوثيقة" value="مضاف ✓" vc={C.green} />}
          </div>
        }
      />
    );
  }

  return (
    <div className="animate-in" style={{ maxWidth: 820, margin: '0 auto', direction: 'rtl' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 28px', marginBottom: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.tealDark, marginBottom: 3 }}>إتمام الدفع</h2>
          <p style={{ fontSize: 13, color: C.gray }}>أتمّ الدفع لبدء رحلة التخطيط الاستراتيجي</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.green, fontWeight: 600, background: C.greenLight, padding: '6px 14px', borderRadius: 20 }}>
          <IcLock /> دفع آمن ومشفر
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

        {/* ── طريقة الدفع ─────────────────────────────── */}
        <div>
          {/* أزرار طرق الدفع */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.tealDark, marginBottom: 14 }}>اختر طريقة الدفع</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { key: 'card',          label: 'بطاقة ائتمان', icon: <IcCard /> },
                { key: 'mada',          label: 'مدى',           icon: <IcMada /> },
                { key: 'apple_pay',     label: 'Apple Pay',      icon: <IcApplePay /> },
                { key: 'bank_transfer', label: 'تحويل بنكي',    icon: <IcBank /> },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => { setMethod(m.key); setCardNum(''); setExpiry(''); setCvv(''); setHolder(''); setError(''); }}
                  style={{
                    padding: '14px 8px', border: `2px solid ${method === m.key ? C.teal : C.grayBorder}`,
                    borderRadius: 12, background: method === m.key ? C.tealLight : '#fff',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    fontFamily: "'Cairo',sans-serif",
                    boxShadow: method === m.key ? `0 0 0 3px ${C.teal}22` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{m.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: method === m.key ? C.teal : '#374151' }}>{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── بطاقة ائتمان / مدى ── */}
          {(method === 'card' || method === 'mada') && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <CardPreview cardNum={cardNum} name={holder} expiry={expiry} brand={method === 'mada' ? 'mada' : brand} />

              {/* Test card hint */}
              <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 11, color: '#15803d', direction: 'rtl', lineHeight: 1.8, marginBottom: 14 }}>
                بطاقة الاختبار: <strong>4111 1111 1111 1111</strong> | تاريخ: <strong>12/26</strong> | CVV: <strong>123</strong>
              </div>

              {/* رقم البطاقة */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelS}>رقم البطاقة</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={cardNum}
                    onChange={e => setCardNum(fmtCard(e.target.value))}
                    placeholder="0000  0000  0000  0000"
                    maxLength={19}
                    style={{ ...inputS, paddingLeft: 42, fontFamily: "'Courier New', monospace", letterSpacing: 2, fontSize: 15 }}
                    inputMode="numeric"
                  />
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    {brand === 'visa'  && <IcVisa />}
                    {brand === 'mc'    && <IcMastercard />}
                    {brand === 'mada'  && <IcMada />}
                    {!brand            && <IcCard />}
                  </div>
                </div>
              </div>

              {/* تاريخ الانتهاء + CVV */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelS}>تاريخ الانتهاء</label>
                  <input
                    value={expiry}
                    onChange={e => setExpiry(fmtExpiry(e.target.value))}
                    placeholder="MM / YY"
                    maxLength={5}
                    style={{ ...inputS, textAlign: 'center', fontFamily: "'Courier New',monospace", letterSpacing: 2 }}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label style={labelS}>رمز الأمان (CVV)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                      placeholder="• • •"
                      maxLength={4}
                      type={showCvv ? 'text' : 'password'}
                      style={{ ...inputS, textAlign: 'center', fontFamily: "'Courier New',monospace", letterSpacing: 4, paddingLeft: 36 }}
                      inputMode="numeric"
                    />
                    <button onClick={() => setShowCvv(v => !v)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <IcEye show={showCvv} />
                    </button>
                  </div>
                </div>
              </div>

              {/* اسم حامل البطاقة */}
              <div>
                <label style={labelS}>اسم حامل البطاقة</label>
                <input
                  value={holder}
                  onChange={e => setHolder(e.target.value)}
                  placeholder="الاسم كما يظهر على البطاقة"
                  style={{ ...inputS, textTransform: 'uppercase' }}
                />
              </div>

              {/* بيانات الدعم */}
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 11, color: C.gray, display: 'flex', alignItems: 'center', gap: 4 }}><IcLock /> مشفّر بـ SSL 256-bit</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ background: '#1a1f71', borderRadius: 4, padding: '2px 7px' }}><IcVisa /></div>
                  <IcMastercard />
                  <IcMada />
                </div>
              </div>
            </div>
          )}

          {/* ── Apple Pay ── */}
          {method === 'apple_pay' && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg viewBox="0 0 30 36" width="30" height="36" fill="#fff">
                  <path d="M14.9 7.3c.9-1.1 1.5-2.6 1.3-4.1-1.3.1-2.9.9-3.8 2C11.5 6.3 10.8 7.8 11 9.2c1.4.1 2.9-.7 3.9-1.9zM16.2 9.4c-2.2-.1-4 1.2-5.1 1.2-1.1 0-2.7-1.2-4.5-1.1-2.3.1-4.4 1.3-5.6 3.4-2.4 4.1-.6 10.2 1.7 13.5 1.1 1.6 2.4 3.4 4.2 3.4 1.6-.1 2.3-1.1 4.2-1.1 2 0 2.6 1.1 4.4 1.1 1.8-.1 3-1.7 4.1-3.4.8-1.3 1.1-1.9 1.7-3.3-4.4-1.7-5.1-8.1-.8-10.4-.9-1.8-2.6-3.1-4.3-3.3z"/>
                </svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>Apple Pay</div>
              <p style={{ fontSize: 13, color: C.gray, marginBottom: 24, maxWidth: 300, margin: '0 auto 24px' }}>
                ادفع بأمان باستخدام Apple Pay من جهازك — لا تحتاج إلى إدخال بيانات البطاقة
              </p>
              <div style={{ background: '#000', borderRadius: 10, padding: '14px 0', cursor: 'pointer', maxWidth: 280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg viewBox="0 0 30 36" width="20" height="24" fill="#fff">
                  <path d="M14.9 7.3c.9-1.1 1.5-2.6 1.3-4.1-1.3.1-2.9.9-3.8 2C11.5 6.3 10.8 7.8 11 9.2c1.4.1 2.9-.7 3.9-1.9zM16.2 9.4c-2.2-.1-4 1.2-5.1 1.2-1.1 0-2.7-1.2-4.5-1.1-2.3.1-4.4 1.3-5.6 3.4-2.4 4.1-.6 10.2 1.7 13.5 1.1 1.6 2.4 3.4 4.2 3.4 1.6-.1 2.3-1.1 4.2-1.1 2 0 2.6 1.1 4.4 1.1 1.8-.1 3-1.7 4.1-3.4.8-1.3 1.1-1.9 1.7-3.3-4.4-1.7-5.1-8.1-.8-10.4-.9-1.8-2.6-3.1-4.3-3.3z"/>
                </svg>
                <span style={{ color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: '-apple-system,sans-serif' }}>Pay</span>
              </div>
            </div>
          )}

          {/* ── تحويل بنكي ── */}
          {method === 'bank_transfer' && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.tealDark, marginBottom: 16 }}>بيانات التحويل البنكي</div>

              {[
                { label: 'اسم المستفيد',    value: 'منصة دفة للاستشارات' },
                { label: 'رقم الحساب IBAN', value: 'SA12 1234 5678 9012 3456 78' },
                { label: 'البنك',            value: 'بنك الرياض' },
                { label: 'رمز البنك SWIFT',  value: 'RIBLSARIXXX' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.grayLight, borderRadius: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111', fontFamily: r.label.includes('IBAN') || r.label.includes('SWIFT') ? "'Courier New',monospace" : "'Cairo',sans-serif", letterSpacing: r.label.includes('IBAN') || r.label.includes('SWIFT') ? 1 : 0 }}>{r.value}</div>
                  </div>
                  <CopyBtn text={r.value.replace(/\s/g,'')} />
                </div>
              ))}

              <div style={{ marginTop: 14, padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', fontSize: 12, color: '#92400e', lineHeight: 1.7 }}>
                <strong>تعليمات التحويل:</strong> بعد إتمام التحويل، أرسل إيصال الدفع عبر المحادثة مع المستشار. سيتم تفعيل الخدمة خلال يوم عمل واحد من تأكيد الاستلام.
              </div>
            </div>
          )}
        </div>

        {/* ── ملخص الطلب ────────────────────────────── */}
        <div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.tealDark, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.grayBorder}` }}>ملخص الطلب</div>

            <Row label="الخدمة"     value="التخطيط الاستراتيجي" />
            <Row label="المستشار"   value={workflow?.consultant?.name || '—'} />
            {workflow?.addon_certification && <Row label="اعتماد الخطة"   value={`${certPrice.toLocaleString('en-US')} ر.س`} />}
            {workflow?.addon_design        && <Row label="تصميم الوثيقة" value={`${designPrice.toLocaleString('en-US')} ر.س`} />}

            <div style={{ borderTop: `1px dashed ${C.grayBorder}`, marginTop: 12, paddingTop: 12 }}>
              <Row label="المجموع الجزئي" value={`${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س`} />
              <Row label={`ضريبة القيمة المضافة (${taxRate}%)`} value={`${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س`} />
            </div>

            <div style={{ borderTop: `2px solid ${C.teal}22`, marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.tealDark }}>الإجمالي</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.orange }}>{total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</span>
            </div>
          </div>

          {/* كود الخصم */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 10 }}>كود الخصم</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={discount}
                onChange={e => setDiscount(e.target.value.toUpperCase())}
                placeholder="DAFFA10"
                style={{ ...inputS, flex: 1, textAlign: 'center', letterSpacing: 2, fontFamily: "'Courier New',monospace", fontSize: 13 }}
              />
            </div>
            <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}>جرب <strong>DAFFA10</strong> للحصول على خصم 10%</div>
          </div>

          {/* زر الدفع */}
          {error && (
            <div style={{ background: C.redLight, color: C.red, border: `1px solid #fecaca`, borderRadius: 10, padding: '10px 14px', marginBottom: 12, textAlign: 'center', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading}
            style={{
              width: '100%', padding: '16px 0',
              background: loading ? '#9ca3af' : `linear-gradient(135deg,${C.orange},#d4550a)`,
              color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Cairo',sans-serif",
              boxShadow: loading ? 'none' : `0 6px 20px ${C.orange}50`,
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading
              ? 'جارٍ المعالجة...'
              : (<><IcLock /><span>ادفع الآن — {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</span></>)
            }
          </button>

          {/* ضمان الأمان */}
          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: C.gray, lineHeight: 1.8 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 6 }}>
              {[
                { icon: <IcLock />, text: 'تشفير SSL' },
                { icon: <span style={{ fontSize: 12 }}>🛡️</span>, text: 'دفع آمن' },
                { icon: <span style={{ fontSize: 12 }}>↩️</span>, text: 'استرداد مضمون' },
              ].map(b => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {b.icon}<span>{b.text}</span>
                </div>
              ))}
            </div>
            بياناتك محمية بتشفير 256-bit
          </div>
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.gray, marginBottom: 8, alignItems: 'center' }}>
    <span>{label}</span>
    <span style={{ color: '#374151', fontWeight: 600 }}>{value}</span>
  </div>
);

const RRow = ({ label, value, vc }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.gray, alignItems: 'center' }}>
    <span>{label}</span>
    <span style={{ color: vc || '#374151', fontWeight: 600 }}>{value}</span>
  </div>
);

export const PaymentReceipt = ({ workflow, serviceLabel, extraRows }) => {
  const M = {
    card:          { label: 'بطاقة ائتمان', icon: <IcCard /> },
    mada:          { label: 'مدى',           icon: <IcMada /> },
    apple_pay:     { label: 'Apple Pay',     icon: <IcApplePay /> },
    bank_transfer: { label: 'تحويل بنكي',   icon: <IcBank /> },
  };
  const m        = M[workflow?.payment_method] || { label: workflow?.payment_method || '—', icon: <IcCard /> };
  const subtotal = parseFloat(workflow?.subtotal)        || 0;
  const tax      = parseFloat(workflow?.tax_amount)      || 0;
  const discount = parseFloat(workflow?.discount_amount) || 0;
  const total    = parseFloat(workflow?.total)           || (subtotal + tax - discount);
  const paidAt   = workflow?.paid_at ? new Date(workflow.paid_at).toLocaleDateString('ar-SA') : null;

  return (
    <div className="animate-in" style={{ maxWidth: 560, margin: '0 auto', direction: 'rtl' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: C.greenLight, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.tealDark, marginBottom: 6 }}>تم الدفع بنجاح</h2>
        <p style={{ fontSize: 13, color: C.gray, marginBottom: paidAt ? 12 : 0 }}>{serviceLabel}</p>
        {paidAt && (
          <span style={{ fontSize: 12, color: C.green, fontWeight: 600, background: C.greenLight, padding: '4px 14px', borderRadius: 20 }}>
            تاريخ الدفع: {paidAt}
          </span>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 12 }}>طريقة الدفع المستخدمة</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: `${C.teal}08`, borderRadius: 10, border: `1.5px solid ${C.teal}25` }}>
          <span style={{ color: C.teal, display: 'flex', alignItems: 'center' }}>{m.icon}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.tealDark }}>{m.label}</span>
          <span style={{ marginRight: 'auto', fontSize: 11, color: C.green, fontWeight: 700, background: C.greenLight, padding: '3px 10px', borderRadius: 20 }}>مدفوع ✓</span>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 12 }}>ملخص الطلب</div>
        {extraRows}
        <div style={{ borderTop: `1px dashed ${C.grayBorder}`, paddingTop: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RRow label="المجموع الجزئي"       value={`${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س`} />
          {discount > 0 && <RRow label={`خصم${workflow?.discount_code ? ` (${workflow.discount_code})` : ''}`} value={`- ${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س`} vc={C.green} />}
          <RRow label="ضريبة القيمة المضافة" value={`${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س`} />
        </div>
        <div style={{ borderTop: `2px solid ${C.teal}22`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: C.tealDark }}>الإجمالي المدفوع</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.orange }}>{total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</span>
        </div>
      </div>
    </div>
  );
};

const labelS = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 };

const inputS = {
  width: '100%', padding: '11px 14px',
  border: `1.5px solid ${C.grayBorder}`, borderRadius: 10,
  fontSize: 13, fontFamily: "'Cairo',sans-serif",
  direction: 'rtl', boxSizing: 'border-box',
  outline: 'none', transition: 'border-color 0.2s',
  background: '#fff',
};
