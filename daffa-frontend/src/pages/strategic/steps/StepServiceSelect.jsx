import React, { useState } from 'react';
import { strategicApi } from '../../../api/strategic';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

const UNIT_FALLBACK = [
  'تحليل البيئة الداخلية','تحليل البيئة الخارجية','دراسة الاحتياجات المجتمعية',
  'التحليل الاستراتيجي','المبادرات الاستراتيجية','التوجهات الاستراتيجية',
  'بناء نظرية التغيير','نموذج عمل المنظمة','مؤشرات الأداء',
  'الهيكل التنظيمي','الوثيقة الاستراتيجية',
].map((name, i) => ({ unit_number: i + 1, name }));

export default function StepServiceSelect({ setWorkflow, setStep, catalog, pricing, onWorkflowCreated }) {
  const [addons,  setAddons]  = useState({ certification: false, design: false });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const units       = catalog?.length ? catalog : UNIT_FALLBACK;
  const basePrice   = pricing?.base                ?? 5000;
  const certPrice   = pricing?.addon_certification ?? 2000;
  const designPrice = pricing?.addon_design        ?? 1500;
  const taxRate     = (pricing?.tax_rate           ?? 15) / 100;

  const subtotal = basePrice + (addons.certification ? certPrice : 0) + (addons.design ? designPrice : 0);
  const tax      = Math.round(subtotal * taxRate);
  const total    = subtotal + tax;

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await strategicApi.start({
        addon_certification: addons.certification,
        addon_design:        addons.design,
      });
      const wf = res.data.workflow;
      setWorkflow(wf);
      setStep(1);
      if (onWorkflowCreated) onWorkflowCreated(wf);
    } catch (e) {
      setError(e.response?.data?.message || 'حدث خطأ، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 28 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A6B7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>نظام التخطيط الاستراتيجي</h2>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          بناء الخطة الاستراتيجية الكاملة للمنظمة من خلال {units.length} وحدة تخطيطية متسلسلة
          مع مراجعة واعتماد من مستشار متخصص
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* الوحدات */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>
            الوحدات التخطيطية الـ {units.length}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {units.map((u, i) => (
              <div key={u.unit_number || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafb', borderRadius: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{u.unit_number || i + 1}</div>
                <span style={{ fontSize: 13, color: '#374151' }}>{u.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ما يشمله + الأسعار */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>ما يشمله النظام</h3>
            {[`${units.length} وحدة تخطيطية متسلسلة`,'فيديوهات تعليمية لكل وحدة','شرح مكتوب وإرشادات مفصلة','نماذج عمل جاهزة للتعبئة','خدمة دردشة مع المستشار','مراجعة واعتماد من مستشار متخصص','وثيقة استراتيجية نهائية'].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: colors.teal, fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 13, color: '#374151' }}>{f}</span>
              </div>
            ))}
          </div>

          {/* الإضافات */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>خدمات إضافية (اختياري)</h3>

            {/* السعر الأساسي */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafb', borderRadius: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>السعر الأساسي</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark }}>{basePrice.toLocaleString('en-US')} ريال</span>
            </div>

            {[
              { key: 'certification', label: 'اعتماد الخطة من جهة استشارية', price: certPrice   },
              { key: 'design',        label: 'تصميم احترافي للوثيقة',        price: designPrice },
            ].map(a => (
              <label key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer', padding: '10px 12px', border: `1.5px solid ${addons[a.key] ? colors.teal : '#e5e7eb'}`, borderRadius: 8, transition: 'border-color 0.2s' }}>
                <input type="checkbox" checked={addons[a.key]} onChange={e => setAddons({ ...addons, [a.key]: e.target.checked })} style={{ width: 16, height: 16, accentColor: colors.teal }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{a.label}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.orange }}>{a.price.toLocaleString('en-US')} ريال</span>
              </label>
            ))}

            {/* ملخص السعر */}
            <div style={{ background: '#f8fafb', borderRadius: 8, padding: 14, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                <span>المجموع الجزئي</span><span>{subtotal.toLocaleString('en-US')} ريال</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                <span>ضريبة القيمة المضافة ({pricing?.tax_rate ?? 15}%)</span><span>{tax.toLocaleString('en-US')} ريال</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: colors.tealDark, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                <span>الإجمالي</span><span>{total.toLocaleString('en-US')} ريال</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginTop: 16, textAlign: 'center', fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button onClick={handleStart} disabled={loading} style={{ padding: '14px 48px', background: colors.orange, color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'جاري البدء...' : 'التالي: اختيار المستشار ←'}
        </button>
      </div>
    </div>
  );
}
