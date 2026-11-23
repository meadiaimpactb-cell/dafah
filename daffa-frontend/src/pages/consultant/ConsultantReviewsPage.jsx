import DfIcon from '../../components/ui/DfIcon';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api/axios';
import { consultantApi } from '../../api/consultant';
import { consultantPoliciesApi } from '../../api/policies';
import FormDataViewer from './FormDataViewer';
import { isVisible as policyQuestionVisible } from '../policies/questionRules';
import { usePermissions } from '../../utils/permissions';
import { IcCheckCircle, IcArrowPath, IcWarning, IcXMark, IcSparkles, IcClipboard, IcPalette, IcLock, IcEye, IcDocument } from '../../utils/icons';
import { asObject } from '../../utils/apiData';
import { useIsPhone } from '../../utils/useMediaQuery';

/** هوية الخطة التي يتبعها الطلب: اسمها برقمها الثابت ومرجعها وتاريخ إنشائها */
const PlanTag = ({ item, compact }) => {
  if (!item?.plan_label) return null;
  return (
    <span data-plan-tag style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, fontSize: compact ? 10.5 : 11.5, color: '#1A65AD', fontWeight: 600 }}>
      <span style={{ padding: '1px 8px', borderRadius: 10, background: '#EAF4FD', border: '1px solid #A9D2F5' }}>{item.plan_label}</span>
      {item.plan_ref && <span style={{ color: colors.gray, fontWeight: 500 }} title="مرجع الخطة الثابت">المرجع {item.plan_ref}</span>}
      {item.plan_created_at && <span style={{ color: colors.gray, fontWeight: 500 }}>· أُنشئت {item.plan_created_at}</span>}
    </span>
  );
};

const colors = {
  primary: '#235D7F', ink: '#0E2A3D',
  orange: '#EF6A2C', amber: '#EF6A2C', amberText: '#A33F12', amberLine: '#E05A1F', green: '#0B7F5D', red: '#C53A3A',
  gray: '#5E6B78', grayLight: '#F3EFE8', grayBorder: '#E8E3DA',
};

const StatusBadge = ({ status }) => {
  const map = {
    submitted:  { label: 'مُرسَل',                  bg: '#EAF4FD', color: '#1A65AD' },
    reviewing:  { label: 'قيد المراجعة',            bg: '#FEF3EC', color: colors.amberText },
    approved:   { label: 'معتمد',                   bg: '#E8F8F2', color: colors.green },
    revision:   { label: 'بانتظار تعديل العميل',    bg: '#FDE2D2', color: '#7F310E' },
    not_started:{ label: 'لم يبدأ',                 bg: colors.grayLight, color: colors.gray },
  };
  const s = map[status] || { label: status, bg: colors.grayLight, color: colors.gray };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

// ── Policy Form Viewer ─────────────────────────────────────────────────────────
const PolicyFormViewer = ({ formData, questionnaireSections }) => {
  if (!formData || Object.keys(formData).length === 0)
    return <p style={{ color: colors.gray, fontSize: 13, textAlign: 'center', padding: 20 }}>لا توجد بيانات</p>;

  if (questionnaireSections && questionnaireSections.length > 0) {
    const answeredCount = Object.keys(formData).filter(k => {
      const v = formData[k]; return v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0);
    }).length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Summary bar */}
        <div style={{ padding: '8px 14px', background: '#D9E8F1', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.ink }}>
            {questionnaireSections.length} أقسام — {answeredCount} إجابة
          </span>
        </div>

        {questionnaireSections.map((section) => {
          const questions = section.questions || [];
          const answered = questions.filter(q => {
            const v = formData[`q${q.id}`];
            return v !== undefined && v !== '' && v !== null && !(Array.isArray(v) && v.length === 0);
          });

          return (
            <div key={section.id} style={{ border: `1.5px solid ${colors.grayBorder}`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Section header */}
              <div style={{ padding: '10px 14px', background: '#D9E8F1', borderBottom: `1px solid ${colors.grayBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{section.name}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: answered.length === questions.length ? '#C9EFE1' : '#FDE2D2', color: answered.length === questions.length ? colors.green : '#7F310E', fontWeight: 600 }}>
                  {answered.length}/{questions.length} مكتمل
                </span>
              </div>

              {/* Questions */}
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {questions.filter(q => policyQuestionVisible(q, formData)).map((q, qi) => {
                  const rawAnswer = formData[`q${q.id}`];
                  const otherTxt  = formData[`q${q.id}__other`];
                  const otherLbl  = q.meta?.other?.label || 'التوضيح';
                  // «أخرى» مع توضيحها يظهران معًا للمستشار
                  const answer = otherTxt && String(otherTxt).trim()
                    ? (Array.isArray(rawAnswer) ? [...rawAnswer, `${otherLbl}: ${otherTxt}`] : `${rawAnswer ?? ''} — ${otherLbl}: ${otherTxt}`)
                    : rawAnswer;
                  const isEmpty = answer === undefined || answer === '' || answer === null || (Array.isArray(answer) && answer.length === 0);

                  return (
                    <div key={q.id} style={{ paddingBottom: qi < questions.length - 1 ? 10 : 0, borderBottom: qi < questions.length - 1 ? `1px dashed ${colors.grayBorder}` : 'none' }}>
                      {/* Question label */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: colors.primary, marginTop: 1 }}>س{qi + 1}</span>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#334452', flex: 1, lineHeight: 1.6 }}>
                          {q.question}
                          {q.required && <span style={{ color: colors.red, marginRight: 3 }}>*</span>}
                        </div>
                      </div>

                      {/* Answer */}
                      {isEmpty ? (
                        <div style={{ fontSize: 12, color: colors.gray, fontStyle: 'italic', padding: '6px 10px', background: '#FEF3EC', borderRadius: 6, borderRight: `3px solid #F79D6C` }}>
                          لم يتم الإجابة
                        </div>
                      ) : Array.isArray(answer) ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {answer.map((item, i) => (
                            <span key={i} style={{ fontSize: 12, background: '#D9E8F1', color: colors.primary, borderRadius: 20, padding: '3px 12px', fontWeight: 600 }}>{item}</span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: '#0E2A3D', padding: '8px 12px', background: colors.grayLight, borderRadius: 6, lineHeight: 1.8, whiteSpace: 'pre-wrap', borderRight: `3px solid ${colors.primary}` }}>
                          {String(answer)}
                        </div>
                      )}

                      {/* Hint */}
                      {q.hint && (
                        <div style={{ fontSize: 11, color: colors.gray, marginTop: 4 }}><DfIcon name="bulb" size={14} style={{ marginInlineEnd: 6 }} />{q.hint}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: raw data display
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Object.entries(formData).map(([key, value]) => (
        <div key={key} style={{ padding: '8px 12px', background: colors.grayLight, borderRadius: 6 }}>
          <div style={{ fontSize: 11, color: colors.primary, fontWeight: 600, marginBottom: 4 }}>{key}</div>
          <div style={{ fontSize: 13, color: '#334452' }}>
            {Array.isArray(value) ? value.join('، ') : String(value ?? '—')}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Confirm Modal ──────────────────────────────────────────────────────────────
const ConfirmModal = ({ type, unitName, orgName, onConfirm, onCancel }) => {
  const isApprove = type === 'approve';
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,42,61,0.5)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 420, boxShadow: '0 24px 64px rgba(14,42,61,0.25)', textAlign: 'center', animation: 'modalIn 0.22s ease-out both' }}>
        {/* Icon */}
        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isApprove ? '#E8F8F2' : '#FEF3EC', border: `2px solid ${isApprove ? '#A9E4CF' : '#FBC3A3'}` }}>
          {isApprove ? (
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#0B7F5D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#A33F12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          )}
        </div>

        {/* Title */}
        <div style={{ fontSize: 18, fontWeight: 800, color: colors.ink, marginBottom: 8 }}>
          {isApprove ? 'تأكيد اعتماد الوحدة' : 'تأكيد طلب التعديل'}
        </div>

        {/* Description */}
        <div style={{ fontSize: 13, color: colors.gray, lineHeight: 1.8, marginBottom: 24 }}>
          {isApprove
            ? <>سيتم اعتماد وحدة <strong style={{ color: colors.ink }}>"{unitName}"</strong> للمنظمة <strong style={{ color: colors.ink }}>{orgName}</strong>، وسيتم إشعار العميل بذلك.</>
            : <>سيتم إرسال طلب تعديل لوحدة <strong style={{ color: colors.ink }}>"{unitName}"</strong> إلى منظمة <strong style={{ color: colors.ink }}>{orgName}</strong> مع ملاحظاتك.</>
          }
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: `1.5px solid ${colors.grayBorder}`, background: 'white', color: colors.gray, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: 'pointer' }}>
            إلغاء
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: isApprove ? colors.green : colors.amber, color: '#0E2A3D', fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: 'pointer', boxShadow: `0 4px 14px ${isApprove ? '#0E9F7440' : '#EF6A2C66'}` }}>
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

// ── Detail Panel ───────────────────────────────────────────────────────────────
const DetailPanel = ({ submissionId, initialData, mode, serviceType, onClose, onReviewed, isPhone }) => {
  const [sub,                  setSub]                  = useState(initialData || null);
  const [subLoading,           setSubLoading]           = useState(!initialData?.form_data);
  // خانة الرد تبدأ فارغة دائمًا؛ ملاحظة الجولة السابقة تُعرض منفصلة (previous_notes)
  const [notes,                setNotes]                = useState('');
  const [saving,               setSaving]               = useState(false);
  const [toast,                setToast]                = useState(null);
  const [confirm,              setConfirm]              = useState(null);
  const [questionnaireSections, setQuestionnaireSections] = useState([]);

  const isOp  = serviceType === 'operational';
  const isPol = serviceType === 'policies';

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!initialData) { setSub(null); setNotes(''); setQuestionnaireSections([]); }
    setSubLoading(!initialData?.form_data);
    let call;
    if (isPol)      call = consultantPoliciesApi.getSelection(submissionId);
    else if (isOp)  call = consultantApi.opGetSubmission(submissionId);
    else            call = consultantApi.getSubmission(submissionId);
    call
      .then(r => {
        const d = asObject(r.data);
        setSub(d);
        setSubLoading(false);
        if (isPol && r.data.policy_type_id) {
          api.get(`/questionnaire/${r.data.policy_type_id}`)
            .then(qr => setQuestionnaireSections(qr.data || []))
            .catch(() => {});
        }
      })
      .catch(() => { setSubLoading(false); });
  }, [submissionId]);

  const doApprove = () => {
    setConfirm(null);
    setSaving(true);
    let call;
    if (isPol)      call = consultantPoliciesApi.approve(submissionId, { notes });
    else if (isOp)  call = consultantApi.opApprove(submissionId, { notes });
    else            call = consultantApi.approve(submissionId, { notes });
    call
      .then(r => {
        showToast('success', isPol ? 'تم اعتماد السياسة بنجاح' : 'تم اعتماد الوحدة بنجاح');
        setSub(isPol ? r.data.selection : r.data.submission);
        setTimeout(() => { onReviewed?.(); onClose?.(); }, 1500);
      })
      .catch(() => { showToast('error', 'حدث خطأ أثناء الاعتماد'); setSaving(false); });
  };

  const doRevision = () => {
    setConfirm(null);
    setSaving(true);
    let call;
    if (isPol)      call = consultantPoliciesApi.requestRevision(submissionId, { notes });
    else if (isOp)  call = consultantApi.opRequestRevision(submissionId, { notes });
    else            call = consultantApi.requestRevision(submissionId, { notes });
    call
      .then(r => {
        showToast('success', 'تم إرسال طلب التعديل');
        setSub(isPol ? r.data.selection : r.data.submission);
        setTimeout(() => { onReviewed?.(); onClose?.(); }, 1500);
      })
      .catch(() => { showToast('error', 'حدث خطأ أثناء الإرسال'); setSaving(false); });
  };

  const handleApprove  = () => setConfirm('approve');
  const handleRevision = () => {
    if (!notes.trim()) { showToast('error', 'يجب كتابة ملاحظات عند طلب التعديل'); return; }
    setConfirm('revision');
  };

  return (
    <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(14,42,61,0.07)', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* على الجوال: التفاصيل بعرض الشاشة مع زر واضح للعودة إلى القائمة */}
      {isPhone && (
        <button type="button" onClick={onClose} data-back-to-list
          style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '12px 14px 0', padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${colors.primary}`, background: 'white', color: colors.primary, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', alignSelf: 'flex-start' }}>
          → {mode === 'pending' ? 'العودة إلى المراجعات المعلقة' : 'العودة إلى المراجعات المكتملة'}
        </button>
      )}
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.grayBorder}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0, gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>
            {sub ? isPol ? sub.policy_name : `${sub.unit_number}. ${sub.unit_name}` : '…'}
          </div>
          <div style={{ fontSize: 12, color: colors.gray, marginTop: 2 }}>
            {sub?.org_name}
            {isOp && <span style={{ marginRight: 8, padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#FEF3EC', color: '#A33F12' }}>تشغيلي</span>}
            {isPol && <span style={{ marginRight: 8, padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: '#E8F8F2', color: '#0B7F5D' }}>سياسة</span>}
          </div>
          {sub?.plan_label && <div style={{ marginTop: 6 }}><PlanTag item={sub} /></div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {sub && <StatusBadge status={sub.status} />}
          {sub?.is_late && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#FCEBEB', color: colors.red, display: 'inline-flex', alignItems: 'center', gap: 4 }}><IcWarning width={12} height={12}/> متأخر</span>}
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: colors.grayLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.gray }}><IcXMark width={14} height={14}/></button>
        </div>
      </div>

      {!sub ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.gray, fontSize: 14 }}>جارٍ التحميل…</div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Form Data */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.ink, margin: '0 0 12px' }}>{isPol ? 'إجابات استبيان السياسة' : 'عمل العميل'}</h4>
            {subLoading
              ? <div style={{ padding: 20, textAlign: 'center', color: colors.gray, fontSize: 13 }}>جارٍ تحميل بيانات العمل…</div>
              : isPol ? <PolicyFormViewer formData={sub.form_data} questionnaireSections={questionnaireSections} /> : <FormDataViewer data={sub.form_data} template={sub.unit_template} unitRows={sub.unit_rows} />
            }
          </div>

          {/* Review tools */}
          {mode === 'pending' && (
            <div style={{ borderTop: `1px solid ${colors.grayBorder}`, paddingTop: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.ink, margin: '0 0 10px' }}>المراجعة</h4>

              {/* حالة: تم طلب التعديل — بانتظار العميل */}
              {sub.status === 'revision' ? (
                <div>
                  {sub.consultant_notes && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.ink, marginBottom: 6 }}>الملاحظات المرسلة للعميل</div>
                      <div style={{ padding: '10px 14px', background: '#FEF3EC', borderRadius: 8, border: `1px solid #FBC3A3`, fontSize: 13, color: '#5E240A', lineHeight: 1.8 }}>
                        {sub.consultant_notes}
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '14px 16px', borderRadius: 10, background: '#FDE2D2', border: '1px solid #FBC3A3', color: '#7F310E', fontSize: 13, fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <IcArrowPath width={16} height={16}/>
                    بانتظار تعديل العميل وإعادة الإرسال
                  </div>
                  <div style={{ fontSize: 11, color: colors.gray, textAlign: 'center', marginTop: 8 }}>
                    ستظهر هنا مجدداً بعد إعادة إرسال العميل
                  </div>
                </div>
              ) : sub.status === 'approved' ? (
                /* حالة: معتمدة */
                <div style={{ padding: 12, borderRadius: 10, background: '#E8F8F2', border: '1px solid #A9E4CF', color: colors.green, fontSize: 13, fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <IcCheckCircle width={16} height={16}/> {isPol ? 'تم اعتماد هذه السياسة' : 'تم اعتماد هذه الوحدة'}
                </div>
              ) : (
                /* حالة: submitted / reviewing — أدوات المراجعة */
                <div>
                  {sub.previous_notes && (
                    <div data-previous-note style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>ملاحظتك في المراجعة السابقة</div>
                      <div style={{ padding: '10px 14px', background: colors.grayLight, borderRadius: 8, border: `1px solid ${colors.grayBorder}`, fontSize: 13, color: '#334452', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {sub.previous_notes}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: colors.gray }}>أعاد العميل إرسال الوحدة بعد هذه الملاحظة. راجع النسخة المصححة أعلاه.</span>
                        <button type="button" onClick={() => setNotes(sub.previous_notes)}
                          style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'inherit', background: 'white', color: colors.primary, border: `1px solid ${colors.primary}`, cursor: 'pointer', fontWeight: 600 }}>
                          استخدام الملاحظة السابقة
                        </button>
                      </div>
                    </div>
                  )}
                  <label htmlFor={`review-notes-${submissionId}`} style={{ fontSize: 12, fontWeight: 600, color: colors.ink, display: 'block', marginBottom: 6 }}>
                    {sub.previous_notes ? 'ملاحظة جديدة للعميل' : 'الملاحظات'}
                  </label>
                  <textarea
                    id={`review-notes-${submissionId}`}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={4}
                    placeholder={sub.previous_notes ? 'اكتب ملاحظتك على النسخة المصححة…' : 'اكتب ملاحظاتك هنا…'}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.grayBorder}`, fontFamily: "inherit", fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }}
                  />

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                    {['عمل ممتاز', 'يحتاج تفصيلاً أكثر', 'أضف مصادر ومراجع', 'راجع الأرقام', 'المحتوى غير مكتمل'].map(t => (
                      <button key={t} onClick={() => setNotes(n => n ? `${n}\n${t}` : t)}
                        style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontFamily: "inherit", background: colors.grayLight, color: colors.gray, border: 'none', cursor: 'pointer' }}>
                        {t}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleApprove} disabled={saving}
                      style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: colors.green, color: 'white', fontWeight: 700, fontSize: 13, fontFamily: "inherit", cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 3px 10px #0E9F7430', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <IcCheckCircle width={16} height={16}/> اعتماد
                    </button>
                    <button onClick={handleRevision} disabled={saving}
                      style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: `1.5px solid ${colors.amberLine}`, background: 'white', color: colors.amberText, fontWeight: 700, fontSize: 13, fontFamily: "inherit", cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <IcArrowPath width={16} height={16}/> طلب تعديل
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'completed' && sub.consultant_notes && (
            <div style={{ borderTop: `1px solid ${colors.grayBorder}`, paddingTop: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.ink, margin: '0 0 10px' }}>ملاحظاتك</h4>
              <div style={{ padding: '10px 14px', background: '#E8F8F2', borderRadius: 8, fontSize: 13, color: '#086449', lineHeight: 1.8 }}>
                {sub.consultant_notes}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: colors.gray }}>تمت المراجعة: {sub.reviewed_at}</div>
            </div>
          )}

          {sub.revision_count > 0 && (
            <div style={{ fontSize: 11, color: colors.gray, textAlign: 'center' }}>عدد التعديلات: {sub.revision_count}</div>
          )}
        </div>
      )}

      {/* Confirm Modal */}
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
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9999999, background: toast.type === 'success' ? '#086449' : '#842525', color: 'white', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: "inherit", boxShadow: '0 4px 20px rgba(14,42,61,0.3)', whiteSpace: 'nowrap' }}>
          {toast.text}
        </div>, document.body
      )}
    </div>
  );
};

// ── Design Requests Panel ─────────────────────────────────────────────────────
function DesignRequestsPanel() {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [uploading,   setUploading]   = useState(null); // workflowId being uploaded
  const [selected,    setSelected]    = useState(null);
  const fileRef = useRef(null);

  const statusLabels = {
    pending:            { label: 'في انتظار التصميم', bg: '#EAF4FD', color: '#1A65AD' },
    revision_requested: { label: 'طُلب تعديل',         bg: '#FEF3EC', color: colors.amberText },
    uploaded:           { label: 'تم الرفع',            bg: '#E8F8F2', color: colors.green },
  };

  const load = () => {
    setLoading(true);
    consultantPoliciesApi.getDesignRequests()
      .then(r => setItems(r.data.workflows || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (workflowId, file) => {
    if (!file) return;
    setUploading(workflowId);
    try {
      await consultantPoliciesApi.uploadDesign(workflowId, file);
      await load();
      setSelected(null);
    } catch (e) {
      alert(e?.response?.data?.message || 'فشل رفع الملف.');
    } finally {
      setUploading(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: colors.gray }}>
      <div style={{ textAlign: 'center' }}><div>جارٍ التحميل…</div></div>
    </div>
  );

  if (items.length === 0) return (
    <div style={{ textAlign: 'center', padding: 60, color: colors.gray }}>
      <div style={{ marginBottom: 12, color: colors.gray }}><IcPalette width={40} height={40}/></div>
      <div style={{ fontSize: 14 }}>لا توجد طلبات تصميم حالياً</div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16, flex: 1, minHeight: 0 }}>
      {/* List */}
      <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(14,42,61,0.07)', overflow: 'hidden' }}>
        {items.map((w, i) => {
          const st = statusLabels[w.design_status] || statusLabels.pending;
          return (
            <div key={w.id} onClick={() => setSelected(selected?.id === w.id ? null : w)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: i < items.length - 1 ? `1px solid ${colors.grayBorder}` : 'none', borderRight: selected?.id === w.id ? `3px solid ${colors.primary}` : '3px solid transparent', cursor: 'pointer', background: selected?.id === w.id ? `${colors.primary}08` : 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: colors.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>{w.avatar}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>{w.org_name}</div>
                  <div style={{ fontSize: 11, color: colors.gray }}>{w.org_type}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                <span style={{ fontSize: 10, color: colors.gray }}>{w.design_paid_at}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Panel */}
      {selected && (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(14,42,61,0.07)', padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.ink }}>{selected.org_name}</div>
              <div style={{ fontSize: 12, color: colors.gray }}>{selected.org_type}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.gray, display: 'flex' }}><IcXMark width={20} height={20}/></button>
          </div>

          {selected.design_revision_notes && (
            <div style={{ padding: '10px 14px', background: '#FEF3EC', borderRadius: 8, border: `1px solid ${colors.amberLine}30`, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.amberText, marginBottom: 4 }}>ملاحظات التعديل من العميل:</div>
              <div style={{ fontSize: 12, color: '#334452' }}>{selected.design_revision_notes}</div>
            </div>
          )}

          {selected.design_file && (
            <div style={{ padding: '10px 14px', background: '#E8F8F2', borderRadius: 8, border: `1px solid ${colors.green}30`, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.green, marginBottom: 6 }}>آخر ملف تم رفعه:</div>
              <a href={selected.design_file} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: colors.primary, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <IcEye width={14} height={14}/> معاينة / تحميل
              </a>
            </div>
          )}

          <div style={{ border: `2px dashed ${colors.grayBorder}`, borderRadius: 12, padding: 32, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ marginBottom: 8, color: colors.gray }}><IcDocument width={36} height={36}/></div>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, marginBottom: 4 }}>
              {selected.design_status === 'uploaded' ? 'رفع تصميم معدّل' : 'رفع ملف التصميم'}
            </div>
            <div style={{ fontSize: 11, color: colors.gray, marginBottom: 16 }}>PDF, JPG, PNG, ZIP — حد أقصى 20MB</div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.zip" style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) handleUpload(selected.id, e.target.files[0]); e.target.value = ''; }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading === selected.id}
              style={{ padding: '10px 28px', borderRadius: 10, background: uploading === selected.id ? colors.grayLight : colors.primary, color: uploading === selected.id ? colors.gray : 'white', border: 'none', fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: uploading === selected.id ? 'not-allowed' : 'pointer' }}>
              {uploading === selected.id ? 'جارٍ الرفع...' : 'اختر الملف وارفعه'}
            </button>
          </div>

          <div style={{ fontSize: 11, color: colors.gray, textAlign: 'center' }}>
            بعد الرفع سيظهر التصميم للعميل للمراجعة والاعتماد
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Reviews Page ──────────────────────────────────────────────────────────
export default function ConsultantReviewsPage({ mode = 'pending' }) {
  const { can } = usePermissions();

  const ALL_TABS = [
    { key: 'strategic',   label: 'استراتيجي',      permKey: 'consultant.strategic.view'   },
    { key: 'operational', label: 'تشغيلي',          permKey: 'consultant.operational.view' },
    { key: 'policies',    label: 'سياسات',           permKey: 'consultant.policies.view'    },
    // طلبات التصميم انتقلت إلى لوحة تحكم الأدمن
  ];
  const visibleTabs = ALL_TABS.filter(t => can(t.permKey));

  const [serviceType,  setServiceType]  = useState(() => {
    // إذا قادم من "مراجعة الآن" في صفحة العملاء، افتح التاب المحدد
    const requested = sessionStorage.getItem('pending_reviews_tab');
    if (requested) {
      sessionStorage.removeItem('pending_reviews_tab');
      if (visibleTabs.find(t => t.key === requested)) return requested;
    }
    return visibleTabs[0]?.key || 'strategic';
  });

  // If active tab becomes hidden (permission revoked), switch to first visible tab
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find(t => t.key === serviceType)) {
      setServiceType(visibleTabs[0].key);
    }
  }, [visibleTabs.map(t => t.key).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // فلتر العميل المحدد (عند النقر من صفحة العملاء)
  const [clientFilter, setClientFilter] = useState(null); // { userId, orgName } | null

  // الاستجابة لـ navigation من صفحة العملاء (Keep-alive — لا يُعاد mount)
  useEffect(() => {
    const handler = (e) => {
      const { tab, userId, orgName } = e.detail || {};
      if (tab && visibleTabs.find(t => t.key === tab)) setServiceType(tab);
      // ضبط فلتر العميل — null يعني "الكل"
      setClientFilter(userId ? { userId, orgName: orgName || '' } : null);
    };
    window.addEventListener('dafah:reviews-tab', handler);
    return () => window.removeEventListener('dafah:reviews-tab', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // إعادة تعيين فلتر العميل عند تغيير التاب يدوياً من داخل الصفحة
  const handleTabChange = (tab) => {
    setServiceType(tab);
    setClientFilter(null);
  };
  const CACHE_KEY = `consultant_reviews_${mode}_${serviceType}_cache_v2`;

  const [submissions,  setSubmissions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selectedId,   setSelectedId]   = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [search,       setSearch]       = useState('');
  const prefetchCache  = React.useRef({});
  const rowRefs        = React.useRef({});
  const isPhone        = useIsPhone();

  // فتح/إغلاق التفاصيل؛ عند الإغلاق يعود التركيز إلى الصف نفسه (لوحة المفاتيح وقارئ الشاشة)
  const openRow = (s) => {
    if (selectedId === s.id) { closeDetail(); return; }
    setSelectedId(s.id); setSelectedData(prefetchCache.current[s.id] || s);
  };
  const closeDetail = () => {
    const id = selectedId;
    setSelectedId(null); setSelectedData(null);
    if (id) setTimeout(() => rowRefs.current[id]?.focus(), 30);
  };

  const prefetch = (id, data) => {
    prefetchCache.current[id] = data;
  };

  const isPending = mode === 'pending';
  const isOp      = serviceType === 'operational';
  const isPol     = serviceType === 'policies';

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    let call;
    if (isPol) {
      call = isPending ? consultantPoliciesApi.getPendingReviews() : consultantPoliciesApi.getCompletedReviews();
    } else if (isOp) {
      call = isPending ? consultantApi.opPendingReviews() : consultantApi.opCompletedReviews();
    } else {
      call = isPending ? consultantApi.pendingReviews() : consultantApi.completedReviews();
    }
    call
      .then(r => {
        // الاستجابة مصفوفة دائمًا؛ أي شكل آخر (خطأ وسيط/بروكسي) يُعامل كقائمة فارغة بدل انهيار الصفحة
        const list = Array.isArray(r.data) ? r.data : [];
        setSubmissions(list);
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      })
      .catch(e => { if (!silent) setError(e.response?.data?.message || 'تعذّر الاتصال بالخادم'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSelectedId(null);
    setSelectedData(null);
    prefetchCache.current = {};
    setSubmissions([]);
    load(false);
  }, [mode, serviceType]);

  const filtered = submissions.filter(s => {
    if (clientFilter && s.user_id !== clientFilter.userId) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.org_name?.toLowerCase().includes(q)
        || s.unit_name?.toLowerCase().includes(q)
        || s.policy_name?.toLowerCase().includes(q)
        || s.plan_label?.toLowerCase().includes(q)
        || s.plan_ref?.toLowerCase().includes(q);
  });

  const isDesign = serviceType === 'design';

  if (visibleTabs.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: colors.gray, gap: 12 }}>
      <div style={{ color: colors.gray }}><IcLock width={40} height={40}/></div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>غير مصرح بالوصول</div>
    </div>
  );

  if (!isDesign && loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: colors.gray }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14 }}>جارٍ التحميل…</div>
      </div>
    </div>
  );

  if (!isDesign && error) return (
    <div style={{ padding: 24, textAlign: 'center', color: colors.red }}>
      <div style={{ fontSize: 14, marginBottom: 12 }}>{error}</div>
      <button onClick={() => load(false)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.primary, color: 'white', cursor: 'pointer', fontFamily: "inherit" }}>إعادة المحاولة</button>
    </div>
  );

  const title = isPending ? 'المراجعات المعلقة' : 'المراجعات المكتملة';

  return (
    <div className="animate-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.ink, margin: 0 }}>{title}</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: colors.gray, background: colors.grayLight, padding: '3px 10px', borderRadius: 20 }}>
            {filtered.length} عنصر
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث…"
            style={{ padding: '7px 14px', borderRadius: 10, border: `1px solid ${colors.grayBorder}`, fontFamily: "inherit", fontSize: 13, width: 180, outline: 'none' }}
          />
        </div>
      </div>

      {/* Client filter banner */}
      {clientFilter && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 14px', background: '#D9E8F1', borderRadius: 10, border: '1.5px solid #235D7F30' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>
            <DfIcon name="clipboard" size={18} style={{ marginInlineEnd: 6 }} />عرض: {clientFilter.orgName}
          </span>
          <button
            onClick={() => setClientFilter(null)}
            style={{ marginRight: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: colors.gray, fontSize: 16, lineHeight: 1, padding: '0 4px' }}
            title="إلغاء الفلتر — عرض الكل"
          >
            ×
          </button>
        </div>
      )}

      {/* Service type tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {visibleTabs.map(t => (
          <button key={t.key} onClick={() => handleTabChange(t.key)}
            style={{ padding: '7px 18px', borderRadius: 10, fontSize: 13, fontWeight: serviceType === t.key ? 700 : 500, fontFamily: "inherit", background: serviceType === t.key ? colors.primary : colors.grayLight, color: serviceType === t.key ? 'white' : colors.gray, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Design requests — standalone panel */}
      {isDesign && <DesignRequestsPanel />}

      <style>{`.df-review-row:focus{outline:none}.df-review-row:focus-visible{outline:3px solid ${colors.primary} !important;outline-offset:-3px;background:${colors.primary}10 !important}`}</style>
      {/* على الجوال: القائمة أو التفاصيل بعرض الشاشة (لا جنبًا إلى جنب) */}
      {!isDesign && <div style={{ display: 'grid', gridTemplateColumns: selectedId && !isPhone ? '1fr 1fr' : '1fr', gap: 16, flex: 1, minHeight: 0 }}>
        {/* List */}
        {!(isPhone && selectedId) && <div role="list" aria-label={title} style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(14,42,61,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {filtered.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.gray, padding: 40 }}>
              <div style={{ marginBottom: 8, color: colors.gray }}>{isPending ? <IcSparkles width={32} height={32}/> : <IcClipboard width={32} height={32}/>}</div>
              <div style={{ fontSize: 14 }}>{search ? 'لا توجد نتائج' : isPending ? 'لا توجد مراجعات معلقة' : 'لا توجد مراجعات مكتملة'}</div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map((s, i) => (
                <div key={s.id}
                  ref={el => { rowRefs.current[s.id] = el; }}
                  role="button"
                  tabIndex={0}
                  className="df-review-row"
                  aria-expanded={selectedId === s.id}
                  aria-label={`${s.org_name || ''} — ${isPol ? s.policy_name : `${s.unit_number}. ${s.unit_name}`}${s.plan_label ? ` — ${s.plan_label}` : ''}`}
                  onClick={() => openRow(s)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRow(s); } }}
                  style={{
                    display: 'flex', alignItems: isPhone ? 'flex-start' : 'center', justifyContent: 'space-between',
                    flexDirection: isPhone ? 'column' : 'row', gap: isPhone ? 8 : 0,
                    padding: '14px 18px',
                    borderBottom: i < filtered.length - 1 ? `1px solid ${colors.grayBorder}` : 'none',
                    borderRight: selectedId === s.id ? `3px solid ${colors.primary}` : '3px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: selectedId === s.id ? `${colors.primary}08` : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (selectedId !== s.id) e.currentTarget.style.background = colors.grayLight;
                    prefetch(s.id, s);
                  }}
                  onMouseLeave={e => { if (selectedId !== s.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, width: isPhone ? '100%' : undefined }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: colors.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                      {s.avatar}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink, whiteSpace: isPhone ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.org_name}</div>
                      <div data-unit-name style={{ fontSize: 12, color: '#334452', fontWeight: 600, whiteSpace: isPhone ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isPol ? s.policy_name : `${s.unit_number}. ${s.unit_name}`}
                      </div>
                      <div style={{ marginTop: 3 }}><PlanTag item={s} compact /></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingRight: isPhone ? 50 : 0 }}>
                    <StatusBadge status={s.status} />
                    {s.is_late && <span style={{ color: colors.red, display: 'inline-flex' }}><IcWarning width={12} height={12}/></span>}
                    <span style={{ fontSize: 10, color: colors.gray }}>{isPending ? s.submitted_at : s.reviewed_at}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}

        {/* Detail Panel */}
        {selectedId && (
          <DetailPanel
            key={selectedId}
            submissionId={selectedId}
            initialData={selectedData}
            mode={mode}
            serviceType={serviceType}
            isPhone={isPhone}
            onClose={closeDetail}
            onReviewed={() => {
              load(true);
              setSelectedId(null);
              setSelectedData(null);
            }}
          />
        )}
      </div>}
    </div>
  );
}
