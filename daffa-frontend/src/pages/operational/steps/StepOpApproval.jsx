import React from 'react';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

export default function StepOpApproval({ workflow }) {
  return (
    <div className="animate-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>تهانينا! خطتك التشغيلية معتمدة</h2>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 460, margin: '0 auto' }}>
          لقد أتممت بنجاح جميع مراحل بناء الخطة التشغيلية لمنظمتك. الوثيقة النهائية جاهزة.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <InfoCard title="المستشار المشرف" value={workflow?.consultant?.name || '—'} icon="👤" />
        <InfoCard title="تاريخ الاعتماد"  value={workflow?.completed_at ? new Date(workflow.completed_at).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US')} icon="📅" />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>الوثيقة التشغيلية النهائية</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          الوثيقة الكاملة تتضمن الخطة التشغيلية بجميع الأنشطة والجداول والمسؤوليات والميزانية
        </div>
        <div style={{ display: 'inline-block', padding: '10px 20px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
          ✓ الوثيقة جاهزة — ستتوفر قريباً
        </div>
      </div>
    </div>
  );
}

const InfoCard = ({ title, value, icon }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 15, fontWeight: 700, color: '#14505E' }}>{value}</div>
  </div>
);
