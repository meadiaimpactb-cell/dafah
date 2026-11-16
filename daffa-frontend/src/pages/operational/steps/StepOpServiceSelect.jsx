import DfIcon from '../../../components/ui/DfIcon';
import React, { useState } from 'react';
import { operationalApi } from '../../../api/operational';

const colors = { primary: '#235D7F', ink: '#0E2A3D', orange: '#EF6A2C', amber: '#EF6A2C', amberText: '#A33F12', amberLine: '#E05A1F' };

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
        <div style={{ padding: '14px 18px', background: '#FEF3EC', borderRadius: 10, borderRight: `4px solid ${colors.amberLine}`, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}><DfIcon name="warning" size={22} /></span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.amberText }}>يتطلب إكمال التخطيط الاستراتيجي أولاً</div>
            <div style={{ fontSize: 12, color: '#5E6B78', marginTop: 2 }}>يجب اعتماد الخطة الاستراتيجية كاملاً قبل البدء بالتخطيط التشغيلي</div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 28, marginBottom: 20, boxShadow: '0 1px 8px rgba(14,42,61,0.06)', textAlign: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 10 }}><DfIcon name="gear" size={42} /></div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.ink, marginBottom: 8 }}>نظام التخطيط التشغيلي</h2>
        <p style={{ fontSize: 14, color: '#5E6B78', maxWidth: 540, margin: '0 auto', lineHeight: 1.8 }}>
          تحويل المبادرات الاستراتيجية إلى خطة تشغيلية مفصلة بالأنشطة والجدول الزمني والمسؤوليات والتكاليف
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-2)', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(14,42,61,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 16 }}><DfIcon name="chart" size={15} style={{ marginInlineEnd: 6 }} />الوحدات التخطيطية الـ 5</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {UNITS.map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#FBF9F5', borderRadius: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: '#334452' }}>{u}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', background: `${colors.primary}0d`, borderRadius: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}><DfIcon name="money" size={14} style={{ marginInlineEnd: 6 }} />التكلفة: </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: colors.primary }}>{subtotal.toLocaleString('en-US')} ريال</span>
            <span style={{ fontSize: 11, color: '#8C97A3', display: 'block', marginTop: 2 }}>+ ضريبة {tax.toLocaleString('en-US')} ريال = الإجمالي {total.toLocaleString('en-US')} ريال</span>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(14,42,61,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.ink, marginBottom: 14 }}><DfIcon name="sparkle" size={15} style={{ marginInlineEnd: 6 }} />ما يشمله النظام</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: colors.primary, fontWeight: 700, fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 13, color: '#334452' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FCEBEB', color: '#C53A3A', border: '1px solid #F1B2B2', borderRadius: 8, padding: '10px 14px', marginTop: 16, textAlign: 'center', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button
          onClick={handleStart}
          disabled={loading || !strategicCompleted}
          style={{ padding: '14px 52px', background: !strategicCompleted ? '#D9D3C7' : colors.amber, color: '#0E2A3D', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: !strategicCompleted ? 'not-allowed' : 'pointer', fontFamily: ""inherit", transition: 'background 0.2s" }}
        >
          {loading ? 'جاري البدء...' : !strategicCompleted ? 'يجب إكمال التخطيط الاستراتيجي أولاً' : 'التالي: اختيار المستشار ←'}
        </button>
      </div>
    </div>
  );
}
