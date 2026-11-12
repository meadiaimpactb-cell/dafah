import React, { useEffect, useRef, useState } from 'react';

/*
 * هوية الدفع الموحّدة في منصة دفة: شعارات طرق الدفع الرسمية (public/payments)،
 * أزرار اختيار طريقة الدفع، شعار شبكة البطاقة، زر Apple Pay، وشارة «مدفوعات آمنة عبر EdfaPay».
 * تُستخدم في صفحات دفع التخطيط الاستراتيجي والتشغيلي والسياسات.
 */

const TEAL = '#1A6B7C';
const TEAL_DARK = '#14505E';

const LOGOS = {
  visa:          { src: '/payments/visa.png',          alt: 'Visa',            ratio: 247 / 80 },
  mastercard:    { src: '/payments/mastercard.png',    alt: 'Mastercard',      ratio: 155 / 96 },
  mada:          { src: '/payments/mada.png',          alt: 'مدى — mada',      ratio: 270 / 92 },
  apple_pay:     { src: '/payments/apple-pay.png',     alt: 'Apple Pay',       ratio: 234 / 96 },
  apple_pay_w:   { src: '/payments/apple-pay-white.png', alt: 'Apple Pay',     ratio: 234 / 96 },
  bank_transfer: { src: '/payments/bank-transfer.png', alt: 'تحويل بنكي',      ratio: 184 / 42 },
  edfapay:       { src: '/payments/edfapay.png',       alt: 'EdfaPay',         ratio: 191 / 120 },
};

/** شعار رسمي بارتفاع محدد (العرض محسوب من النسبة لمنع اهتزاز التخطيط عند التحميل) */
export const PayLogo = ({ name, height = 22, style }) => {
  const l = LOGOS[name];
  if (!l) return null;
  return (
    <img src={l.src} alt={l.alt} height={height} width={Math.round(height * l.ratio)} loading="lazy" decoding="async" draggable="false"
      style={{ display: 'block', height, width: 'auto', maxWidth: '100%', objectFit: 'contain', ...style }} />
  );
};

/** طرق الدفع المتاحة فعليًا في المنصة وشعاراتها */
export const PAYMENT_METHODS = [
  { key: 'card',          label: 'بطاقة ائتمانية', hint: 'Visa و Mastercard', logos: [['visa', 17], ['mastercard', 24]] },
  { key: 'mada',          label: 'مدى',            hint: 'بطاقات مدى البنكية', logos: [['mada', 24]] },
  { key: 'apple_pay',     label: 'Apple Pay',      hint: 'من جهاز Apple',     logos: [['apple_pay', 24]] },
  { key: 'bank_transfer', label: 'تحويل بنكي',     hint: 'تفعيل بعد التحقق',   logos: [['bank_transfer', 20]] },
];

const Check = () => (
  <span aria-hidden="true" style={{ position: 'absolute', top: 8, insetInlineStart: 8, width: 20, height: 20, borderRadius: '50%', background: TEAL, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(26,107,124,0.35)' }}>
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  </span>
);

/**
 * اختيار طريقة الدفع بشعارات رسمية.
 * value: مفتاح الطريقة ('card' | 'mada' | 'apple_pay' | 'bank_transfer')، onChange(key)
 */
export function PaymentMethodPicker({ value, onChange, columns = 2 }) {
  // 4 طرق: صف واحد عند اتساع المساحة، وإلا 2×2 (لا يبقى عنصر منفرد في صف)
  const ref = useRef(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (!ref.current || columns < 4 || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setWide(e.contentRect.width >= 600));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [columns]);
  return (
    <div ref={ref} role="radiogroup" aria-label="طريقة الدفع"
      style={{ display: 'grid', gridTemplateColumns: `repeat(${wide ? 4 : 2}, minmax(0, 1fr))`, gap: 10 }}>
      {PAYMENT_METHODS.map(m => {
        const on = value === m.key;
        return (
          <button key={m.key} type="button" role="radio" aria-checked={on} onClick={() => onChange(m.key)}
            style={{
              position: 'relative', minHeight: 92, padding: '16px 10px 12px', borderRadius: 14, cursor: 'pointer',
              border: on ? `2px solid ${TEAL}` : '1.5px solid #E5E7EB',
              background: on ? '#F3FAFB' : '#fff',
              boxShadow: on ? `0 0 0 4px ${TEAL}1F, 0 6px 16px rgba(20,80,94,0.10)` : '0 1px 2px rgba(17,24,39,0.04)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 9,
              fontFamily: "'Cairo', sans-serif", transition: 'border-color .15s, box-shadow .15s, background .15s', touchAction: 'manipulation',
            }}>
            {on && <Check />}
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 26, direction: 'ltr' }}>
              {m.logos.map(([name, h]) => <PayLogo key={name} name={name} height={h} />)}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: on ? 800 : 600, color: on ? TEAL_DARK : '#374151', lineHeight: 1.3 }}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** شعار شبكة البطاقة المكتشفة من رقمها ('visa' | 'mc' | 'mada')، أو أيقونة بطاقة عامة */
export const CardNetworkLogo = ({ brand, height = 18 }) => {
  if (brand === 'visa') return <PayLogo name="visa" height={height - 4} />;
  if (brand === 'mc') return <PayLogo name="mastercard" height={height + 2} />;
  if (brand === 'mada') return <PayLogo name="mada" height={height + 2} />;
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#9CA3AF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2.5" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
};

/**
 * كشف شبكة البطاقة من بداية الرقم لعرض شعارها فقط (لا يؤثر في الدفع).
 * مدى: البادئات الخاصة بها خارج نطاقي Visa وMastercard؛ بطاقات مدى المشتركة مع Visa/Mastercard تظهر بشعار الشبكة.
 */
export const detectCardNetwork = (num) => {
  const n = String(num || '').replace(/\D/g, '');
  if (/^(50|58|6049|6361|9682)/.test(n)) return 'mada';
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'mc';
  return null;
};

/** زر Apple Pay الرسمي (أسود مع شعار Apple Pay الأبيض) */
export const ApplePayButton = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled} aria-label="الدفع عبر Apple Pay"
    style={{ width: '100%', minHeight: 50, background: '#000', border: 'none', borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.6 : 1 }}>
    <PayLogo name="apple_pay_w" height={26} />
  </button>
);

/** شارة الثقة أسفل نموذج الدفع: مدفوعات آمنة عبر EdfaPay + الشبكات المقبولة */
export function SecurePaymentBadge() {
  return (
    <div style={{ marginTop: 16, border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', background: '#FAFBFC' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: '#15803D' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
          </svg>
          مدفوعات آمنة ومشفّرة عبر
          <PayLogo name="edfapay" height={30} style={{ marginInlineStart: 2 }} />
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, direction: 'ltr' }} aria-label="الشبكات المقبولة: مدى، Visa، Mastercard، Apple Pay">
          <PayLogo name="mada" height={16} />
          <PayLogo name="visa" height={11} />
          <PayLogo name="mastercard" height={17} />
          <PayLogo name="apple_pay" height={16} />
        </span>
      </div>
    </div>
  );
}
