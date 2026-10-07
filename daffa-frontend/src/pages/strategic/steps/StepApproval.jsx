import React, { useState, useEffect } from 'react';
import { strategicApi } from '../../../api/strategic';
import api from '../../../api/axios';

const colors = { teal: '#1A6B7C', tealDark: '#14505E', orange: '#E8620A' };

export default function StepApproval({ workflow, navigate, workflowId }) {
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState('');

  const handleDownload = async () => {
    setGenerating(true);
    setError('');
    const win = window.open('', '_blank');
    try {
      const res = await strategicApi.getPdfLink(workflowId);
      win.location.href = res.data.url;
    } catch (err) {
      win.close();
      setError('حدث خطأ أثناء توليد الوثيقة. حاول مرة أخرى.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* نجاح */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>تهانينا! خطتك الاستراتيجية معتمدة</h2>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 460, margin: '0 auto' }}>
          لقد أتممت بنجاح جميع مراحل بناء الخطة الاستراتيجية لمنظمتك. الوثيقة النهائية جاهزة للتحميل.
        </p>
      </div>

      {/* تفاصيل */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <InfoCard title="المستشار المشرف" value={workflow?.consultant?.name || '—'} icon="👤" />
        <InfoCard title="تاريخ الاعتماد"  value={workflow?.completed_at ? new Date(workflow.completed_at).toLocaleDateString('en-US') : '—'} icon="📅" />
      </div>

      {/* تحميل الوثيقة */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>الوثيقة الاستراتيجية النهائية</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          الوثيقة الكاملة تتضمن جميع مراحل التخطيط الاستراتيجي المعتمدة من المستشار
        </div>
        <button
          style={{ padding: '13px 44px', background: generating ? '#9ca3af' : colors.teal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: "'Cairo', sans-serif", transition: 'background 0.2s', boxShadow: generating ? 'none' : `0 4px 16px ${colors.teal}40` }}
          onClick={handleDownload}
          disabled={generating}
        >
          {generating ? '⏳ جارٍ التحضير…' : '⬇ تحميل الوثيقة PDF'}
        </button>
        {error && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '8px 14px', borderRadius: 8 }}>
            {error}
          </div>
        )}
      </div>

      {/* تقييم المستشار */}
      {workflow?.consultant_id && workflow?.id && (
        <ConsultantRating
          consultantId={workflow.consultant_id}
          consultantName={workflow.consultant?.name}
          workflowType="strategic"
          workflowId={workflow.id}
        />
      )}

      {/* خدمات إضافية */}
      {(workflow?.addon_certification || workflow?.addon_design) && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginTop: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>الخدمات الإضافية المشتراة</h3>
          {workflow.addon_certification && (
            <AddonRow icon="🏅" label="اعتماد الخطة من جهة استشارية" status="قيد التنفيذ" />
          )}
          {workflow.addon_design && (
            <AddonRow icon="🎨" label="تصميم احترافي للوثيقة" status="قيد التنفيذ" />
          )}
        </div>
      )}

      {/* ── الخطوة التالية: التخطيط التشغيلي ── */}
      {navigate && (
        <div style={{
          background: 'linear-gradient(135deg, #fff8f5, #fff)',
          border: `2px solid ${colors.orange}30`,
          borderRadius: 16, padding: 24, marginTop: 20,
          boxShadow: `0 4px 20px ${colors.orange}12`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.orange, marginBottom: 10, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: colors.orange, color: '#fff', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>2</span>
            الخطوة التالية في رحلتك
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${colors.orange}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
              📋
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: colors.tealDark, marginBottom: 6 }}>التخطيط التشغيلي</h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 18 }}>
                ترجمة أهدافك الاستراتيجية إلى خطط عمل قابلة للتنفيذ عبر 5 وحدات تشغيلية تفصيلية، بإشراف مستشار متخصص.
              </p>
              <button
                onClick={() => navigate('operational-roadmap')}
                style={{ padding: '12px 28px', background: colors.orange, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif", boxShadow: `0 4px 14px ${colors.orange}40`, transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                ابدأ التخطيط التشغيلي الآن ←
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Rating Widget ─────────────────────────────────────────────────────────────
export const ConsultantRating = ({ consultantId, consultantName, workflowType, workflowId }) => {
  const [hover,     setHover]     = useState(0);
  const [selected,  setSelected]  = useState(0);
  const [comment,   setComment]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [done,      setDone]      = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [loadingEx, setLoadingEx] = useState(true);

  useEffect(() => {
    if (!workflowId) { setLoadingEx(false); return; }
    api.get('/reviews/mine', { params: { workflow_type: workflowType, workflow_id: workflowId } })
      .then(r => {
        if (r.data && r.data.id) {
          setSelected(Number(r.data.rating) || 0);
          setComment(r.data.comment || '');
          setDone(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEx(false));
  }, [workflowType, workflowId]);

  const handleSubmit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post('/reviews', {
        consultant_id: consultantId,
        workflow_type: workflowType,
        workflow_id:   workflowId,
        rating:        selected,
        comment:       comment.trim() || null,
      });
      setDone(true);
      setEditing(false);
    } catch {
      alert('حدث خطأ، حاول مرة أخرى');
    } finally {
      setSaving(false);
    }
  };

  if (loadingEx) return null;

  const LABELS   = ['', 'ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'];
  const isLocked = done && !editing;
  const active   = hover || selected;
  const starFill = (i) => i <= active ? '#f59e0b' : '#e5e7eb';

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20, direction: 'rtl' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark }}>تقييم المستشار</h3>
        {done && !editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: colors.teal, fontFamily: "'Cairo', sans-serif", fontWeight: 600, padding: '4px 8px', borderRadius: 6 }}
          >
            ✎ تعديل
          </button>
        )}
      </div>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
        {isLocked ? `تقييمك لـ ${consultantName || 'المستشار'}` : `كيف كانت تجربتك مع ${consultantName || 'المستشار'}؟`}
      </p>

      {/* النجوم */}
      <div style={{ display: 'flex', gap: 6, marginBottom: active ? 10 : 16, justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            disabled={isLocked}
            onMouseEnter={() => !isLocked && setHover(i)}
            onMouseLeave={() => !isLocked && setHover(0)}
            onClick={() => !isLocked && setSelected(i)}
            style={{ background: 'none', border: 'none', cursor: isLocked ? 'default' : 'pointer', padding: 2, transition: 'transform 0.15s' }}
            onMouseDown={e => { if (!isLocked) e.currentTarget.style.transform = 'scale(0.9)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = ''; }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill={starFill(i)} stroke={starFill(i)} strokeWidth="0.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        ))}
      </div>

      {active > 0 && (
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 14 }}>
          {LABELS[active]}
        </div>
      )}

      {/* تعليق */}
      {!isLocked && (
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="أضف تعليقاً (اختياري)..."
          rows={3}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: "'Cairo', sans-serif", resize: 'vertical', boxSizing: 'border-box', marginBottom: 14, direction: 'rtl', outline: 'none' }}
        />
      )}

      {isLocked && comment && (
        <div style={{ background: '#f8fafb', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#374151', marginBottom: 14, fontStyle: 'italic', textAlign: 'right' }}>
          "{comment}"
        </div>
      )}

      {!isLocked && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          <button
            disabled={!selected || saving}
            onClick={handleSubmit}
            style={{ padding: '10px 36px', background: !selected || saving ? '#e5e7eb' : colors.teal, color: !selected || saving ? '#9ca3af' : '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: !selected || saving ? 'not-allowed' : 'pointer', fontFamily: "'Cairo', sans-serif", transition: 'all 0.2s' }}
          >
            {saving ? 'جارٍ الإرسال...' : done ? 'تحديث التقييم' : 'إرسال التقييم'}
          </button>
          {editing && (
            <button
              onClick={() => setEditing(false)}
              style={{ padding: '10px 20px', background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#6b7280', cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}
            >
              إلغاء
            </button>
          )}
        </div>
      )}

      {isLocked && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          شكراً! تم إرسال تقييمك
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ title, value, icon }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 15, fontWeight: 700, color: '#14505E' }}>{value}</div>
  </div>
);

const AddonRow = ({ icon, label, status }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: 20 }}>{icon}</span>
    <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{label}</span>
    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#fef3c7', color: '#d97706', fontWeight: 600 }}>{status}</span>
  </div>
);
