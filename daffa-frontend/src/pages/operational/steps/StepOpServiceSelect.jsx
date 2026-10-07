import React, { useState } from 'react';
import { operationalApi } from '../../../api/operational';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

const UNITS = [
  'المبادرات الاستراتيجية',
  'المبادرات التشغيلية',
  'شهور التنفيذ',
  'مسؤول التنفيذ',
  'التكلفة المالية',
];

const FEATURES = [
  'استيراد المبادرات من الخطة الاستراتيجية',
  'تفكيك المبادرات إلى أنشطة تشغيلية',
  'مخطط جانت للجدول الزمني (12 شهر)',
  'تعيين المسؤولين عن كل نشاط',
  'تقدير التكلفة المالية والميزانية',
  'مراجعة واعتماد المستشار',
  'وثيقة تشغيلية نهائية',
];

export default function StepOpServiceSelect({ setWorkflow, setStep, strategicCompleted }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const subtotal = 3500;
  const tax      = Math.round(subtotal * 0.15);
  const total    = subtotal + tax;

  const handleStart = async () => {
    if (!strategicCompleted) return;
    setLoading(true);
    setError('');
    try {
      const res = await operationalApi.start();
      setWorkflow(res.data.workflow);
      setStep(1);
    } catch (e) {
      setError(e.response?.data?.message || 'حدث خطأ، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in">
      {!strategicCompleted && (
        <div style={{ padding: '14px 18px', background: '#fff7ed', borderRadius: 10, borderRight: `4px solid ${colors.orange}`, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.orange }}>يتطلب إكمال التخطيط الاستراتيجي أولاً</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>يجب اعتماد الخطة الاستراتيجية كاملاً قبل البدء بالتخطيط التشغيلي</div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 28, marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 10 }}>⚙️</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>نظام التخطيط التشغيلي</h2>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 540, margin: '0 auto', lineHeight: 1.8 }}>
          تحويل المبادرات الاستراتيجية إلى خطة تشغيلية مفصلة بالأنشطة والجدول الزمني والمسؤوليات والتكاليف
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>📊 الوحدات التخطيطية الـ 5</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {UNITS.map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#f8fafb', borderRadius: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: colors.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: '#374151' }}>{u}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', background: `${colors.teal}0d`, borderRadius: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark }}>💰 التكلفة: </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: colors.teal }}>{subtotal.toLocaleString('en-US')} ريال</span>
            <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginTop: 2 }}>+ ضريبة {tax.toLocaleString('en-US')} ريال = الإجمالي {total.toLocaleString('en-US')} ريال</span>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>✨ ما يشمله النظام</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: colors.teal, fontWeight: 700, fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 13, color: '#374151' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginTop: 16, textAlign: 'center', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button
          onClick={handleStart}
          disabled={loading || !strategicCompleted}
          style={{ padding: '14px 52px', background: !strategicCompleted ? '#d1d5db' : colors.orange, color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: !strategicCompleted ? 'not-allowed' : 'pointer', fontFamily: "'Cairo', sans-serif', transition: 'background 0.2s" }}
        >
          {loading ? 'جاري البدء...' : !strategicCompleted ? 'يجب إكمال التخطيط الاستراتيجي أولاً' : 'التالي: اختيار المستشار ←'}
        </button>
      </div>
    </div>
  );
}
