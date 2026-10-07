import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { consultantApi } from '../../api/consultant';
import { consultantPoliciesApi } from '../../api/policies';
import FormDataViewer from './FormDataViewer';
import { IcCheckCircle, IcArrowPath, IcClipboard, IcUsers, IcWarning, IcXMark, IcSparkles } from '../../utils/icons';

const colors = {
  teal: '#1A6B7C', tealDark: '#14505E', tealCard: '#1A6B7C',
  orange: '#E8620A', green: '#16a34a', red: '#dc2626',
  gray: '#6B7280', grayLight: '#F3F4F6', grayBorder: '#E5E7EB',
  yellow: '#D97706',
};

const CACHE_KEY = 'consultant_dashboard_cache';

const StatusBadge = ({ status }) => {
  const map = {
    submitted:  { label: 'مُرسَل',   bg: '#EFF6FF', color: '#1D4ED8' },
    reviewing:  { label: 'قيد المراجعة', bg: '#FFF7ED', color: colors.orange },
    approved:   { label: 'معتمد',    bg: '#F0FDF4', color: colors.green },
    revision:   { label: 'يحتاج تعديل', bg: '#FFF7ED', color: colors.orange },
    not_started:{ label: 'لم يبدأ',  bg: colors.grayLight, color: colors.gray },
  };
  const s = map[status] || { label: status, bg: colors.grayLight, color: colors.gray };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

const MetricCard = ({ title, value, icon, color }) => (
  <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: color ? `${color}18` : `${colors.teal}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color || colors.teal }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || colors.tealDark }}>{value}</div>
      <div style={{ fontSize: 12, color: colors.gray }}>{title}</div>
    </div>
  </div>
);

// ── Confirm Modal ──────────────────────────────────────────────────────────────
const ConfirmModal = ({ type, unitName, orgName, onConfirm, onCancel }) => {
  const isApprove = type === 'approve';
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', textAlign: 'center', animation: 'modalIn 0.22s ease-out both' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isApprove ? '#F0FDF4' : '#FFF7ED', border: `2px solid ${isApprove ? '#bbf7d0' : '#fed7aa'}` }}>
          {isApprove ? (
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#E8620A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          )}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: colors.tealDark, marginBottom: 8 }}>
          {isApprove ? 'تأكيد اعتماد الوحدة' : 'تأكيد طلب التعديل'}
        </div>
        <div style={{ fontSize: 13, color: colors.gray, lineHeight: 1.8, marginBottom: 24 }}>
          {isApprove
            ? <>سيتم اعتماد وحدة <strong style={{ color: colors.tealDark }}>"{unitName}"</strong> للمنظمة <strong style={{ color: colors.tealDark }}>{orgName}</strong>، وسيتم إشعار العميل بذلك.</>
            : <>سيتم إرسال طلب تعديل لوحدة <strong style={{ color: colors.tealDark }}>"{unitName}"</strong> إلى منظمة <strong style={{ color: colors.tealDark }}>{orgName}</strong> مع ملاحظاتك.</>
          }
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: colors.gray, fontSize: 14, fontWeight: 600, fontFamily: "'Cairo', sans-serif", cursor: 'pointer' }}>إلغاء</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: isApprove ? colors.green : colors.orange, color: 'white', fontSize: 14, fontWeight: 700, fontFamily: "'Cairo', sans-serif", cursor: 'pointer', boxShadow: `0 4px 14px ${isApprove ? '#16a34a40' : '#E8620A40'}` }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {isApprove ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              )}
              {isApprove ? 'نعم، اعتماد' : 'نعم، طلب تعديل'}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Review Detail Modal ────────────────────────────────────────────────────────
const ReviewDetailModal = ({ submissionId, initialData, serviceType = 'strategic', onClose, onReviewed }) => {
  const [sub,     setSub]     = useState(initialData || null);
  const [notes,   setNotes]   = useState(initialData?.consultant_notes || '');
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null); // 'approve' | 'revision' | null

  const isOp  = serviceType === 'operational';
  const isPol = serviceType === 'policy';

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!initialData) { setSub(null); setNotes(''); }
    let call;
    if (isPol)     call = consultantPoliciesApi.getSelection(submissionId);
    else if (isOp) call = consultantApi.opGetSubmission(submissionId);
    else           call = consultantApi.getSubmission(submissionId);
    call.then(r => { setSub(r.data); setNotes(r.data.consultant_notes || ''); }).catch(() => {});
  }, [submissionId]);

  const doApprove = () => {
    setConfirm(null);
    setSaving(true);
    let call;
    if (isPol)     call = consultantPoliciesApi.approve(submissionId, { notes });
    else if (isOp) call = consultantApi.opApprove(submissionId, { notes });
    else           call = consultantApi.approve(submissionId, { notes });
    call
      .then(r => {
        showToast('success', isPol ? 'تم اعتماد السياسة بنجاح' : 'تم اعتماد الوحدة بنجاح');
        setSub(isPol ? r.data.selection : r.data.submission);
        setTimeout(() => { onReviewed?.(); onClose(); }, 1500);
      })
      .catch(() => { showToast('error', 'حدث خطأ أثناء الاعتماد'); setSaving(false); });
  };

  const doRevision = () => {
    setConfirm(null);
    setSaving(true);
    let call;
    if (isPol)     call = consultantPoliciesApi.requestRevision(submissionId, { notes });
    else if (isOp) call = consultantApi.opRequestRevision(submissionId, { notes });
    else           call = consultantApi.requestRevision(submissionId, { notes });
    call
      .then(r => {
        showToast('success', 'تم إرسال طلب التعديل');
        setSub(isPol ? r.data.selection : r.data.submission);
        setTimeout(() => { onReviewed?.(); onClose(); }, 1500);
      })
      .catch(() => { showToast('error', 'حدث خطأ أثناء الإرسال'); setSaving(false); });
  };

  const handleApprove  = () => setConfirm('approve');
  const handleRevision = () => {
    if (!notes.trim()) { showToast('error', 'يجب كتابة ملاحظات عند طلب التعديل'); return; }
    setConfirm('revision');
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 860, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${colors.grayBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark }}>
              {sub ? (isPol ? sub.policy_name : `${sub.unit_number}. ${sub.unit_name}`) : '…'}
            </div>
            <div style={{ fontSize: 12, color: colors.gray, marginTop: 2 }}>
              {sub?.org_name}
              {isOp && <span style={{ marginRight: 8, padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#FFF7ED', color: colors.orange }}>تشغيلي</span>}
              {isPol && <span style={{ marginRight: 8, padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#F0FDF4', color: colors.green }}>سياسة</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {sub && <StatusBadge status={sub.status} />}
            {sub?.is_late && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#FEF2F2', color: colors.red, display: 'inline-flex', alignItems: 'center', gap: 4 }}><IcWarning width={12} height={12}/> متأخر {sub.days_pending} يوم</span>}
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: colors.grayLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.gray }}><IcXMark width={16} height={16}/></button>
          </div>
        </div>

        {!sub ? (
          <div style={{ padding: 60, textAlign: 'center', color: colors.gray }}>جارٍ التحميل…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 0 }}>
            {/* Form Data */}
            <div style={{ padding: 24, borderLeft: `1px solid ${colors.grayBorder}`, maxHeight: 500, overflowY: 'auto' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>عمل العميل</h3>
              <FormDataViewer data={sub.form_data} />
            </div>

            {/* Review Panel */}
            <div style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>المراجعة</h3>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.tealDark, display: 'block', marginBottom: 6 }}>ملاحظات للعميل</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={6}
                  placeholder="اكتب ملاحظاتك هنا…"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.grayBorder}`, fontFamily: "'Cairo', sans-serif", fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* Quick notes */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: colors.gray, marginBottom: 6 }}>ملاحظات سريعة</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {['عمل ممتاز', 'يحتاج مزيد من التفصيل', 'أضف مصادر ومراجع', 'راجع الأرقام', 'المحتوى غير مكتمل'].map(t => (
                    <button key={t} onClick={() => setNotes(n => n ? `${n}\n${t}` : t)}
                      style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontFamily: "'Cairo', sans-serif", background: colors.grayLight, color: colors.gray, border: 'none', cursor: 'pointer' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {sub.status !== 'approved' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={handleApprove} disabled={saving}
                    style={{ padding: '10px 0', borderRadius: 10, border: 'none', background: colors.green, color: 'white', fontWeight: 700, fontSize: 13, fontFamily: "'Cairo', sans-serif", cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <IcCheckCircle width={16} height={16}/> اعتماد الوحدة
                  </button>
                  <button onClick={handleRevision} disabled={saving}
                    style={{ padding: '10px 0', borderRadius: 10, border: `1px solid ${colors.orange}`, background: 'white', color: colors.orange, fontWeight: 700, fontSize: 13, fontFamily: "'Cairo', sans-serif", cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <IcArrowPath width={16} height={16}/> طلب تعديل
                  </button>
                </div>
              )}

              {sub.status === 'approved' && (
                <div style={{ padding: 12, borderRadius: 10, background: '#F0FDF4', color: colors.green, fontSize: 13, fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <IcCheckCircle width={16} height={16}/> تم اعتماد هذه الوحدة
                </div>
              )}

              {sub.revision_count > 0 && (
                <div style={{ marginTop: 12, fontSize: 11, color: colors.gray, textAlign: 'center' }}>
                  عدد التعديلات: {sub.revision_count}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {confirm && sub && (
        <ConfirmModal
          type={confirm}
          unitName={isPol ? sub.policy_name : sub.unit_name}
          orgName={sub.org_name}
          onConfirm={confirm === 'approve' ? doApprove : doRevision}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && ReactDOM.createPortal(
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9999999, background: toast.type === 'success' ? '#065f46' : '#7f1d1d', color: 'white', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: "'Cairo', sans-serif", boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          {toast.text}
        </div>, document.body
      )}
    </div>,
    document.body
  );
};

// ── Main Dashboard Component ───────────────────────────────────────────────────
export default function ConsultantDashboard() {
  const cached = (() => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; } })();

  const [data,            setData]            = useState(cached);
  const [loading,         setLoading]         = useState(!cached);
  const [error,           setError]           = useState(null);
  const [reviewId,        setReviewId]        = useState(null);
  const [reviewData,      setReviewData]      = useState(null);
  const [reviewSvcType,   setReviewSvcType]   = useState('strategic');

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    consultantApi.dashboard()
      .then(r => {
        setData(r.data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(r.data));
      })
      .catch(e => { if (!silent) setError(e.response?.data?.message || 'تعذّر الاتصال بالخادم'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (cached) load(true);
    else load(false);
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: colors.gray }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14 }}>جارٍ التحميل…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, textAlign: 'center', color: colors.red }}>
      <div style={{ fontSize: 14, marginBottom: 12 }}>{error}</div>
      <button onClick={() => load(false)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.teal, color: 'white', cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>إعادة المحاولة</button>
    </div>
  );

  const consultant = data?.consultant;
  const pending    = data?.pending_reviews || [];

  return (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 24 }}>
        مرحباً، {consultant?.name || 'المستشار'}
      </h2>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <MetricCard title="عملاء نشطين"       value={data?.active_clients  ?? 0} icon={<IcUsers width={22} height={22}/>} />
        <MetricCard title="مراجعات معلقة"     value={data?.pending_count   ?? 0} icon={<IcClipboard width={22} height={22}/>} color={colors.orange} />
        <MetricCard title="مراجعات مكتملة"    value={data?.completed_count ?? 0} icon={<IcCheckCircle width={22} height={22}/>} color={colors.green} />
      </div>

      {/* Pending Reviews List */}
      <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.grayBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, margin: 0 }}>المراجعات المعلقة</h3>
          {pending.length > 0 && <span style={{ fontSize: 12, color: colors.gray }}>آخر {pending.length} مراجعات</span>}
        </div>

        {pending.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.gray }}>
            <div style={{ marginBottom: 8, color: colors.green }}><IcSparkles width={28} height={28}/></div>
            <div style={{ fontSize: 14 }}>لا توجد مراجعات معلقة</div>
          </div>
        ) : (
          pending.map((s, i) => {
            const svcType   = s.service_type || 'strategic';
            const openModal = () => { setReviewId(s.id); setReviewData(s); setReviewSvcType(svcType); };
            const svcBadge  = svcType === 'operational'
              ? { label: 'تشغيلي', bg: '#FFF7ED', color: colors.orange }
              : svcType === 'policy'
              ? { label: 'سياسة',  bg: '#F0FDF4', color: colors.green }
              : null;
            const itemLabel = svcType === 'policy'
              ? (s.policy_name || 'سياسة')
              : `${s.unit_number}. ${s.unit_name}`;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < pending.length - 1 ? `1px solid ${colors.grayBorder}` : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = colors.grayLight}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={openModal}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: colors.teal, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                    {s.avatar}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark }}>{s.org_name}</span>
                      {svcBadge && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, fontWeight: 600, background: svcBadge.bg, color: svcBadge.color }}>{svcBadge.label}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: colors.gray }}>{itemLabel}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusBadge status={s.status} />
                  {s.is_late && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#FEF2F2', color: colors.red, display: 'inline-flex', alignItems: 'center', gap: 4 }}><IcWarning width={12} height={12}/> متأخر</span>}
                  <span style={{ fontSize: 11, color: colors.gray }}>{s.submitted_at}</span>
                  <button onClick={e => { e.stopPropagation(); openModal(); }}
                    style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: colors.teal, color: 'white', fontWeight: 600, fontSize: 12, fontFamily: "'Cairo', sans-serif", cursor: 'pointer' }}>
                    مراجعة ←
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {reviewId && (
        <ReviewDetailModal
          submissionId={reviewId}
          initialData={reviewData}
          serviceType={reviewSvcType}
          onClose={() => { setReviewId(null); setReviewData(null); setReviewSvcType('strategic'); }}
          onReviewed={() => { load(true); setReviewId(null); setReviewData(null); setReviewSvcType('strategic'); }}
        />
      )}
    </div>
  );
}
