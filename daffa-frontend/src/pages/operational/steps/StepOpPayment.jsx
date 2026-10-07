import React, { useState } from 'react';
import { operationalApi } from '../../../api/operational';
import { CardPreview, CopyBtn, fmtCard, fmtExpiry, detectBrand, IcLock, IcEye, IcCard, IcMada, IcApplePay, IcBank, IcVisa, IcMastercard } from '../../../pages/strategic/steps/StepPayment';

const C = {
  teal: '#1A6B7C', tealDark: '#14505E', tealLight: '#E8F4F6',
  orange: '#E8620A',
  gray: '#6B7280', grayLight: '#F3F4F6', grayBorder: '#E5E7EB',
  green: '#16A34A', greenLight: '#DCFCE7',
  red: '#DC2626', redLight: '#FEE2E2',
};

export default function StepOpPayment({ workflow, setWorkflow, setStep }) {
  const [method,   setMethod]   = useState('card');
  const [cardNum,  setCardNum]  = useState('');
  const [expiry,   setExpiry]   = useState('');
  const [cvv,      setCvv]      = useState('');
  const [holder,   setHolder]   = useState('');
  const [showCvv,  setShowCvv]  = useState(false);
  const [discount, setDiscount] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const subtotal = parseFloat(workflow?.subtotal)   || 0;
  const tax      = parseFloat(workflow?.tax_amount) || 0;
  const total    = subtotal + tax;
  const brand    = detectBrand(cardNum);

  const handlePay = async () => {
    setLoading(true); setError('');
    try {
      const res = await operationalApi.pay({ payment_method: method, discount_code: discount || undefined });
      setWorkflow(res.data.workflow);
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.message || 'حدث خطأ في عملية الدفع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: 820, margin: '0 auto', direction: 'rtl' }}>

      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 28px', marginBottom: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.tealDark, marginBottom: 3 }}>إتمام الدفع</h2>
          <p style={{ fontSize: 13, color: C.gray }}>أتمّ الدفع لبدء رحلة التخطيط التشغيلي</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.green, fontWeight: 600, background: C.greenLight, padding: '6px 14px', borderRadius: 20 }}>
          <IcLock /> دفع آمن ومشفر
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

        {/* طريقة الدفع */}
        <div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.tealDark, marginBottom: 14 }}>اختر طريقة الدفع</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { key: 'card',          label: 'بطاقة ائتمان', icon: <IcCard /> },
                { key: 'mada',          label: 'مدى',           icon: <IcMada /> },
                { key: 'apple_pay',     label: 'Apple Pay',      icon: <IcApplePay /> },
                { key: 'bank_transfer', label: 'تحويل بنكي',    icon: <IcBank /> },
              ].map(m => (
                <button key={m.key} onClick={() => setMethod(m.key)} style={{ padding: '14px 8px', border: `2px solid ${method === m.key ? C.teal : C.grayBorder}`, borderRadius: 12, background: method === m.key ? C.tealLight : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', fontFamily: "'Cairo',sans-serif", boxShadow: method === m.key ? `0 0 0 3px ${C.teal}22` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{m.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: method === m.key ? C.teal : '#374151' }}>{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {(method === 'card' || method === 'mada') && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <CardPreview cardNum={cardNum} name={holder} expiry={expiry} brand={method === 'mada' ? 'mada' : brand} />
              <div style={{ marginBottom: 14 }}>
                <label style={labelS}>رقم البطاقة</label>
                <div style={{ position: 'relative' }}>
                  <input value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))} placeholder="0000  0000  0000  0000" maxLength={19} style={{ ...inputS, paddingLeft: 42, fontFamily: "'Courier New',monospace", letterSpacing: 2, fontSize: 15 }} inputMode="numeric" />
                  <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    {brand === 'visa' && <IcVisa />}{brand === 'mc' && <IcMastercard />}{brand === 'mada' && <IcMada />}{!brand && <IcCard />}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelS}>تاريخ الانتهاء</label>
                  <input value={expiry} onChange={e => setExpiry(fmtExpiry(e.target.value))} placeholder="MM / YY" maxLength={5} style={{ ...inputS, textAlign: 'center', fontFamily: "'Courier New',monospace", letterSpacing: 2 }} inputMode="numeric" />
                </div>
                <div>
                  <label style={labelS}>رمز الأمان (CVV)</label>
                  <div style={{ position: 'relative' }}>
                    <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="• • •" maxLength={4} type={showCvv ? 'text' : 'password'} style={{ ...inputS, textAlign: 'center', fontFamily: "'Courier New',monospace", letterSpacing: 4, paddingLeft: 36 }} inputMode="numeric" />
                    <button onClick={() => setShowCvv(v => !v)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><IcEye show={showCvv} /></button>
                  </div>
                </div>
              </div>
              <div>
                <label style={labelS}>اسم حامل البطاقة</label>
                <input value={holder} onChange={e => setHolder(e.target.value)} placeholder="الاسم كما يظهر على البطاقة" style={{ ...inputS, textTransform: 'uppercase' }} />
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 11, color: C.gray, display: 'flex', alignItems: 'center', gap: 4 }}><IcLock /> مشفّر بـ SSL 256-bit</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ background: '#1a1f71', borderRadius: 4, padding: '2px 7px' }}><IcVisa /></div>
                  <IcMastercard /><IcMada />
                </div>
              </div>
            </div>
          )}

          {method === 'apple_pay' && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg viewBox="0 0 30 36" width="30" height="36" fill="#fff"><path d="M14.9 7.3c.9-1.1 1.5-2.6 1.3-4.1-1.3.1-2.9.9-3.8 2C11.5 6.3 10.8 7.8 11 9.2c1.4.1 2.9-.7 3.9-1.9zM16.2 9.4c-2.2-.1-4 1.2-5.1 1.2-1.1 0-2.7-1.2-4.5-1.1-2.3.1-4.4 1.3-5.6 3.4-2.4 4.1-.6 10.2 1.7 13.5 1.1 1.6 2.4 3.4 4.2 3.4 1.6-.1 2.3-1.1 4.2-1.1 2 0 2.6 1.1 4.4 1.1 1.8-.1 3-1.7 4.1-3.4.8-1.3 1.1-1.9 1.7-3.3-4.4-1.7-5.1-8.1-.8-10.4-.9-1.8-2.6-3.1-4.3-3.3z"/></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>Apple Pay</div>
              <p style={{ fontSize: 13, color: C.gray, marginBottom: 24 }}>ادفع بأمان باستخدام Apple Pay من جهازك</p>
              <div style={{ background: '#000', borderRadius: 10, padding: '14px 0', cursor: 'pointer', maxWidth: 280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg viewBox="0 0 30 36" width="20" height="24" fill="#fff"><path d="M14.9 7.3c.9-1.1 1.5-2.6 1.3-4.1-1.3.1-2.9.9-3.8 2C11.5 6.3 10.8 7.8 11 9.2c1.4.1 2.9-.7 3.9-1.9zM16.2 9.4c-2.2-.1-4 1.2-5.1 1.2-1.1 0-2.7-1.2-4.5-1.1-2.3.1-4.4 1.3-5.6 3.4-2.4 4.1-.6 10.2 1.7 13.5 1.1 1.6 2.4 3.4 4.2 3.4 1.6-.1 2.3-1.1 4.2-1.1 2 0 2.6 1.1 4.4 1.1 1.8-.1 3-1.7 4.1-3.4.8-1.3 1.1-1.9 1.7-3.3-4.4-1.7-5.1-8.1-.8-10.4-.9-1.8-2.6-3.1-4.3-3.3z"/></svg>
                <span style={{ color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: '-apple-system,sans-serif' }}>Pay</span>
              </div>
            </div>
          )}

          {method === 'bank_transfer' && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.tealDark, marginBottom: 16 }}>بيانات التحويل البنكي</div>
              {[
                { label: 'اسم المستفيد', value: 'منصة دفة للاستشارات' },
                { label: 'رقم الحساب IBAN', value: 'SA12 1234 5678 9012 3456 78' },
                { label: 'البنك', value: 'بنك الرياض' },
                { label: 'رمز البنك SWIFT', value: 'RIBLSARIXXX' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.grayLight, borderRadius: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111', fontFamily: r.label.includes('IBAN') || r.label.includes('SWIFT') ? "'Courier New',monospace" : "'Cairo',sans-serif" }}>{r.value}</div>
                  </div>
                  <CopyBtn text={r.value.replace(/\s/g,'')} />
                </div>
              ))}
              <div style={{ marginTop: 14, padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', fontSize: 12, color: '#92400e', lineHeight: 1.7 }}>
                <strong>تعليمات التحويل:</strong> أرسل إيصال الدفع عبر المحادثة. سيتم التفعيل خلال يوم عمل واحد.
              </div>
            </div>
          )}
        </div>

        {/* ملخص الطلب */}
        <div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.tealDark, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.grayBorder}` }}>ملخص الطلب</div>
            <Row label="الخدمة"   value="التخطيط التشغيلي (5 وحدات)" />
            <Row label="المستشار" value={workflow?.consultant?.name || '—'} />
            <div style={{ borderTop: `1px dashed ${C.grayBorder}`, marginTop: 12, paddingTop: 12 }}>
              <Row label="المجموع الجزئي" value={`${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س`} />
              <Row label="ضريبة القيمة المضافة (15%)" value={`${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س`} />
            </div>
            <div style={{ borderTop: `2px solid ${C.teal}22`, marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.tealDark }}>الإجمالي</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.orange }}>{total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</span>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.tealDark, marginBottom: 10 }}>كود الخصم</div>
            <input value={discount} onChange={e => setDiscount(e.target.value.toUpperCase())} placeholder="DAFFA10" style={{ ...inputS, textAlign: 'center', letterSpacing: 2, fontFamily: "'Courier New',monospace", fontSize: 13 }} />
            <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}>جرب <strong>DAFFA10</strong> للحصول على خصم 10%</div>
          </div>

          {error && <div style={{ background: C.redLight, color: C.red, borderRadius: 10, padding: '10px 14px', marginBottom: 12, textAlign: 'center', fontSize: 13 }}>{error}</div>}

          <button onClick={handlePay} disabled={loading} style={{ width: '100%', padding: '16px 0', background: loading ? '#9ca3af' : `linear-gradient(135deg,${C.orange},#d4550a)`, color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Cairo',sans-serif", boxShadow: loading ? 'none' : `0 6px 20px ${C.orange}50`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? 'جارٍ المعالجة...' : (<><IcLock /><span>ادفع الآن — {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</span></>)}
          </button>

          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: C.gray }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IcLock /> تشفير SSL</span>
              <span>🛡️ دفع آمن</span>
              <span>↩️ استرداد مضمون</span>
            </div>
            بياناتك محمية بتشفير 256-bit
          </div>
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', marginBottom: 8, alignItems: 'center' }}>
    <span>{label}</span><span style={{ color: '#374151', fontWeight: 600 }}>{value}</span>
  </div>
);
const labelS = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 };
const inputS = { width: '100%', padding: '11px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: "'Cairo',sans-serif", direction: 'rtl', boxSizing: 'border-box', outline: 'none', background: '#fff' };
