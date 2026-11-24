// تغيير المستشار — يدرس المشرف طلب العميل مع حال الخطة ويقرر (اعتماد مع اختيار المستشار الجديد، أو رفض مع ملاحظة)،
// ويستطيع تغيير مستشار أي خطة جارية مباشرة. كل تغيير يُسجَّل ويُبلَّغ به العميل والمستشاران.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { adminConsultantChangesApi as ccApi } from '../../api/consultantChanges';
import { colors, systems } from '../../theme/tokens';
import { Badge, Btn, Card, Loading, EmptyState, Tab, GenericPage } from '../../components/ui/kit';
import { IcXMark, IcWarning, IcCheckCircle, IcClock, IcChat, IcArrowPath } from '../../utils/icons';
import { usePermissions } from '../../utils/permissions';

const STATUS = {
  pending:   { t: 'قيد الدراسة', c: 'amber' },
  approved:  { t: 'معتمد — تم التغيير', c: 'green' },
  rejected:  { t: 'مرفوض', c: 'red' },
  cancelled: { t: 'ألغاه العميل', c: 'gray' },
};
const TABS = [['pending', 'قيد الدراسة'], ['approved', 'المعتمدة'], ['rejected', 'المرفوضة'], ['cancelled', 'الملغاة'], ['all', 'الكل']];
const fmt = (s) => (s ? s.replace('T', ' ').slice(0, 16) : '—');
const inputSt = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };

/** مؤشرات تساعد المشرف على قراءة الحالة (مشتقة من بيانات الخطة الفعلية) */
export function caseSignals(live, fromConsultant) {
  const out = [];
  if (!live) return out;
  if (live.oldest_pending_days !== null && live.oldest_pending_days >= 3) out.push({ tone: 'amber', text: `أقدم عمل ينتظر مراجعة المستشار منذ ${live.oldest_pending_days} يوم.` });
  if (live.avg_review_hours !== null) {
    if (live.avg_review_hours > 72) out.push({ tone: 'amber', text: `متوسط مدة المراجعة في هذه الخطة ${live.avg_review_hours} ساعة (أبطأ من 3 أيام).` });
    else out.push({ tone: 'green', text: `متوسط مدة المراجعة في هذه الخطة ${live.avg_review_hours} ساعة (${live.reviews_done} مراجعة).` });
  }
  if (live.pending_review === 0 && live.in_revision > 0) out.push({ tone: 'blue', text: `لا شيء ينتظر المستشار الآن؛ ${live.in_revision} بانتظار تعديل العميل نفسه.` });
  if (live.messages === 0) out.push({ tone: 'gray', text: 'لا توجد رسائل بين العميل والمستشار في المنصة.' });
  else if (live.last_consultant_message) out.push({ tone: 'gray', text: `${live.messages} رسالة بينهما؛ آخر رد من المستشار ${fmt(live.last_consultant_message)}.` });
  else out.push({ tone: 'amber', text: `${live.messages} رسالة من العميل ولم يرد المستشار في المحادثة.` });
  if (live.previous_changes > 0) out.push({ tone: 'amber', text: `سبق تغيير مستشار هذه الخطة ${live.previous_changes} مرة.` });
  if (fromConsultant && fromConsultant.available === false) out.push({ tone: 'red', text: 'المستشار الحالي موسوم «غير متاح» في المنصة.' });
  return out;
}

function Facts({ snap, title }) {
  if (!snap) return null;
  const cells = [
    ['التقدّم', `${snap.approved} من ${snap.total} معتمدة`],
    ['بانتظار المستشار', snap.pending_review],
    ['بانتظار تعديل العميل', snap.in_revision],
    ['أقدم انتظار', snap.oldest_pending_days === null ? '—' : `${snap.oldest_pending_days} يوم`],
    ['متوسط المراجعة', snap.avg_review_hours === null ? '—' : `${snap.avg_review_hours} ساعة`],
    ['الرسائل', snap.messages],
  ];
  return (
    <div>
      {title && <div style={{ fontSize: 12, color: colors.gray, marginBottom: 6 }}>{title}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        {cells.map(([l, v]) => (
          <div key={l} style={{ background: colors.sunken, borderRadius: 10, padding: '8px 10px' }}>
            <div style={{ fontSize: 11.5, color: colors.gray }}>{l}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Signals({ items }) {
  if (!items.length) return null;
  return (
    <div data-case-signals style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
      {items.map((s, i) => <Badge key={i} color={s.tone} style={{ whiteSpace: 'normal', alignSelf: 'flex-start', lineHeight: 1.7 }} text={s.text} />)}
    </div>
  );
}

/** قائمة المستشارين المرشحين مع أحمالهم */
function ConsultantSelect({ candidates, value, onChange, exclude, requestedId }) {
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} style={inputSt} aria-label="المستشار الجديد">
      <option value="">— اختر المستشار الجديد —</option>
      {candidates.filter((c) => c.id !== exclude).map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}{c.id === requestedId ? ' (تفضيل العميل)' : ''}{c.available ? '' : ' — غير متاح'} · {c.active_projects} خطة جارية · {c.pending_review} بانتظار المراجعة{c.rating ? ` · تقييم ${c.rating}` : ''}
        </option>
      ))}
    </select>
  );
}

function ModalShell({ title, onClose, children, label }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,31,46,0.5)' }} />
      <div role="dialog" aria-modal="true" aria-label={label || title} style={{ position: 'relative', background: '#fff', borderRadius: 18, width: 'min(640px, 100%)', maxHeight: '90vh', overflowY: 'auto', padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} aria-label="إغلاق" style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: colors.sunken, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcXMark width={18} height={18} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

const Field = ({ label, hint, children }) => (
  <label style={{ display: 'block', marginBottom: 14 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>{label}</div>
    {children}
    {hint && <div style={{ fontSize: 12, color: colors.gray, marginTop: 4, lineHeight: 1.7 }}>{hint}</div>}
  </label>
);

/** خيار نقل المستحقات مع اقتراح منطقي بحسب ما أنجزه المستشار السابق */
function EarningsChoice({ value, onChange, approved, earnings, fromName }) {
  const share = earnings?.consultant_share || 0;
  return (
    <div style={{ background: colors.sunken, borderRadius: 12, padding: 12, marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>مستحقات الخطة ({share.toLocaleString('en-US')} ر.س لدى {fromName || 'المستشار الحالي'})</div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, marginBottom: 6, cursor: 'pointer' }}>
        <input type="radio" checked={value === true} onChange={() => onChange(true)} /> <span>نقلها إلى المستشار الجديد{approved === 0 ? ' (مقترح: لم يعتمد المستشار السابق أي وحدة)' : ''}</span>
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, cursor: 'pointer' }}>
        <input type="radio" checked={value === false} onChange={() => onChange(false)} /> <span>إبقاؤها للمستشار السابق{approved > 0 ? ` (مقترح: اعتمد ${approved} وحدة)` : ''}</span>
      </label>
      <div style={{ fontSize: 11.5, color: colors.gray, marginTop: 6 }}>يمكن تسوية أي توزيع آخر يدويًا من الإدارة المالية.</div>
    </div>
  );
}

function DecisionModal({ req, mode, candidates, onClose, onDone }) {
  const live = req.plan?.live || req.snapshot;
  const [to, setTo] = useState(req.requested?.id || null);
  const [transfer, setTransfer] = useState((live?.approved || 0) === 0);
  const [note, setNote] = useState(mode === 'approve' ? 'درسنا طلبك واعتمدنا تغيير المستشار. أعمالك المرسلة انتقلت إلى المستشار الجديد كما هي.' : '');
  const [internal, setInternal] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    setErr('');
    if (mode === 'approve' && !to) { setErr('اختر المستشار الجديد.'); return; }
    if (mode === 'reject' && note.trim().length < 5) { setErr('اكتب للعميل سبب عدم الاعتماد.'); return; }
    setBusy(true);
    try {
      if (mode === 'approve') await ccApi.approve(req.id, { consultant_id: to, transfer_earnings: transfer, admin_note: note.trim() || null, internal_note: internal.trim() || null });
      else await ccApi.reject(req.id, { admin_note: note.trim(), internal_note: internal.trim() || null });
      onDone();
    } catch (e) { setErr(e.response?.data?.message || 'تعذّر حفظ القرار.'); } finally { setBusy(false); }
  };
  return (
    <ModalShell title={mode === 'approve' ? 'اعتماد تغيير المستشار' : 'رفض الطلب'} onClose={onClose}>
      <div style={{ fontSize: 13, color: colors.gray, marginBottom: 12 }}>{req.org?.name} · {req.plan_label} ({req.plan_ref}) · المستشار الحالي: <strong style={{ color: colors.ink }}>{req.plan?.current_consultant?.name || req.from?.name || '—'}</strong></div>
      {mode === 'approve' && (
        <>
          <Field label="المستشار الجديد" hint={req.requested ? `فضّل العميل: ${req.requested.name}. القرار لك.` : 'لم يحدد العميل تفضيلًا.'}>
            <ConsultantSelect candidates={candidates} value={to} onChange={setTo} exclude={req.plan?.current_consultant?.id} requestedId={req.requested?.id} />
          </Field>
          <EarningsChoice value={transfer} onChange={setTransfer} approved={live?.approved || 0} earnings={req.plan?.earnings} fromName={req.plan?.current_consultant?.name} />
        </>
      )}
      <Field label="رسالة للعميل" hint="تظهر للعميل في إشعاره وفي صفحة «مستشارو خططي».">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ ...inputSt, resize: 'vertical' }} aria-label="رسالة للعميل" />
      </Field>
      <Field label="ملاحظة داخلية (للمشرفين فقط)">
        <textarea value={internal} onChange={(e) => setInternal(e.target.value)} rows={2} style={{ ...inputSt, resize: 'vertical' }} aria-label="ملاحظة داخلية" />
      </Field>
      {err && <div role="alert" style={{ color: colors.red, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn variant="outline" onClick={onClose}>إلغاء</Btn>
        <Btn variant={mode === 'approve' ? 'success' : 'danger'} onClick={submit} disabled={busy}>{busy ? 'جارٍ الحفظ…' : mode === 'approve' ? 'اعتماد وتغيير المستشار' : 'رفض الطلب'}</Btn>
      </div>
    </ModalShell>
  );
}

/** تغيير مباشر من المشرف لأي خطة جارية (من مركز المخرجات) */
export function ReassignConsultantModal({ system, workflowId, onClose, onDone }) {
  const [info, setInfo] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [to, setTo] = useState(null);
  const [cat, setCat] = useState('');
  const [reason, setReason] = useState('');
  const [transfer, setTransfer] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    ccApi.plan(system, workflowId).then((r) => { setInfo(r.data); setTransfer((r.data.snapshot?.approved || 0) === 0); }).catch(() => setErr('تعذّر تحميل بيانات الخطة.'));
    ccApi.candidates().then((r) => setCandidates(r.data?.data || [])).catch(() => {});
  }, [system, workflowId]);
  const submit = async () => {
    setErr('');
    if (!to) { setErr('اختر المستشار الجديد.'); return; }
    if (!cat) { setErr('اختر سبب التغيير.'); return; }
    if (reason.trim().length < 5) { setErr('سجّل سبب التغيير.'); return; }
    setBusy(true);
    try {
      await ccApi.direct({ system, workflow_id: workflowId, consultant_id: to, reason_category: cat, reason: reason.trim(), transfer_earnings: !!transfer, admin_note: note.trim() || null });
      onDone?.();
    } catch (e) { setErr(e.response?.data?.message || 'تعذّر تنفيذ التغيير.'); } finally { setBusy(false); }
  };
  return (
    <ModalShell title="تغيير مستشار الخطة" onClose={onClose}>
      {!info && !err && <Loading pad={30} />}
      {info && (
        <>
          <div style={{ fontSize: 13, color: colors.gray, marginBottom: 10 }}>{info.org} · {info.plan_label} ({info.plan_ref}) · المستشار الحالي: <strong style={{ color: colors.ink }}>{info.consultant?.name || 'لم يُحدَّد'}</strong></div>
          {!info.can_change ? (
            <EmptyState title="لا يمكن تغيير المستشار" text={info.blocked_reason} />
          ) : (
            <>
              {info.pending_request && (
                <div style={{ background: '#FFF8F0', border: `1px solid ${colors.amber}`, borderRadius: 12, padding: 10, fontSize: 13, marginBottom: 12, lineHeight: 1.8 }}>
                  للعميل طلب تغيير قيد الدراسة ({info.pending_request.reason_label}): «{info.pending_request.reason}». تنفيذ التغيير هنا يعتمد هذا الطلب ويغلقه.
                </div>
              )}
              <Facts snap={info.snapshot} title="حال الخطة الآن" />
              <Signals items={caseSignals(info.snapshot, info.consultant)} />
              <div style={{ height: 14 }} />
              <Field label="المستشار الجديد">
                <ConsultantSelect candidates={candidates} value={to} onChange={setTo} exclude={info.consultant?.id} requestedId={info.pending_request?.requested?.id} />
              </Field>
              <Field label="سبب التغيير">
                <select value={cat} onChange={(e) => setCat(e.target.value)} style={inputSt} aria-label="سبب التغيير">
                  <option value="">— اختر —</option>
                  {Object.entries(info.admin_reasons || {}).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="تفاصيل السبب (للسجل الداخلي)">
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} style={{ ...inputSt, resize: 'vertical' }} aria-label="تفاصيل السبب" />
              </Field>
              <EarningsChoice value={transfer} onChange={setTransfer} approved={info.snapshot?.approved || 0} earnings={info.earnings} fromName={info.consultant?.name} />
              <Field label="رسالة للعميل (اختياري)" hint="يُبلَّغ العميل بالمستشار الجديد في كل الأحوال؛ أضف توضيحًا إن أردت.">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ ...inputSt, resize: 'vertical' }} aria-label="رسالة للعميل" />
              </Field>
            </>
          )}
          {info.history?.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>سجل تغييرات هذه الخطة</div>
              {info.history.map((h) => (
                <div key={h.id} style={{ fontSize: 12.5, color: colors.gray, borderTop: `1px solid ${colors.grayBorder}`, padding: '6px 0', lineHeight: 1.8 }}>
                  {fmt(h.decided_at || h.created_at)} · {h.source === 'admin' ? 'تغيير من الإدارة' : 'طلب العميل'} · {STATUS[h.status]?.t} · {h.from?.name || '—'}{h.to ? ` ← ${h.to.name}` : ''} · {h.reason_label}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {err && <div role="alert" style={{ color: colors.red, fontSize: 13, fontWeight: 700, margin: '10px 0' }}>{err}</div>}
      {info?.can_change && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
          <Btn variant="outline" onClick={onClose}>إلغاء</Btn>
          <Btn variant="success" onClick={submit} disabled={busy}>{busy ? 'جارٍ التنفيذ…' : 'تغيير المستشار الآن'}</Btn>
        </div>
      )}
    </ModalShell>
  );
}

function RequestCard({ r, candidates, canDecide, onDecide }) {
  const sys = systems[r.system];
  const live = r.plan?.live;
  const fromCand = candidates.find((c) => c.id === r.plan?.current_consultant?.id);
  const signals = r.status === 'pending' ? caseSignals(live, fromCand) : [];
  return (
    <Card data-request-id={r.id} style={{ borderRight: `4px solid ${sys?.color || colors.primary}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{r.org?.name}</div>
          <div style={{ fontSize: 12.5, color: colors.gray }}>{r.plan_label} · {r.plan_ref} · {r.org?.email}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {r.source === 'admin' && <Badge small color="blue" text="تغيير من الإدارة" />}
          <Badge color={STATUS[r.status]?.c} text={STATUS[r.status]?.t} />
        </div>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.9, marginBottom: 8 }}>
        <div><strong>السبب:</strong> {r.reason_label}</div>
        <div style={{ background: colors.sunken, borderRadius: 10, padding: '8px 12px', whiteSpace: 'pre-line' }}>{r.reason}</div>
        <div style={{ marginTop: 6 }}>
          المستشار وقت الطلب: <strong>{r.from?.name || '—'}</strong>
          {r.requested && <> · تفضيل العميل: <strong>{r.requested.name}</strong></>}
          {r.to && <> · المستشار الجديد: <strong style={{ color: colors.green }}>{r.to.name}</strong></>}
        </div>
        <div style={{ fontSize: 12, color: colors.gray, display: 'flex', alignItems: 'center', gap: 4 }}><IcClock width={12} height={12} /> قُدّم {fmt(r.created_at)}{r.decided_at ? ` · بُتّ فيه ${fmt(r.decided_at)}${r.decided_by ? ` (${r.decided_by})` : ''}` : ''}</div>
      </div>
      {r.status === 'pending' && live && (
        <>
          <Facts snap={live} title="حال الخطة الآن" />
          <Signals items={signals} />
          {r.snapshot && (
            <div style={{ fontSize: 12, color: colors.gray, marginTop: 8 }}>
              وقت الطلب: {r.snapshot.approved}/{r.snapshot.total} معتمدة · {r.snapshot.pending_review} بانتظار المستشار{r.snapshot.oldest_pending_days !== null ? ` (أقدمها ${r.snapshot.oldest_pending_days} يوم)` : ''}
            </div>
          )}
          {r.plan?.closed && <div style={{ color: colors.red, fontSize: 13, fontWeight: 700, marginTop: 8 }}>اكتملت الخطة بعد تقديم الطلب — لم يعد التغيير ممكنًا؛ ارفضه مع توضيح.</div>}
        </>
      )}
      {(r.admin_note || r.internal_note) && (
        <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.8 }}>
          {r.admin_note && <div><IcChat width={12} height={12} /> للعميل: {r.admin_note}</div>}
          {r.internal_note && <div style={{ color: colors.gray }}>داخلي: {r.internal_note}</div>}
          {r.earnings_transferred !== null && r.status === 'approved' && <div style={{ color: colors.gray }}>المستحقات: {r.earnings_transferred ? 'نُقلت إلى المستشار الجديد' : 'بقيت للمستشار السابق'}</div>}
        </div>
      )}
      {r.status === 'pending' && canDecide && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {!r.plan?.closed && <Btn variant="success" onClick={() => onDecide(r, 'approve')} icon={<IcCheckCircle width={16} height={16} />}>اعتماد واختيار المستشار الجديد</Btn>}
          <Btn variant="dangerGhost" onClick={() => onDecide(r, 'reject')}>رفض مع توضيح للعميل</Btn>
        </div>
      )}
    </Card>
  );
}

export default function AdminConsultantChanges() {
  const { can } = usePermissions();
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [decide, setDecide] = useState(null);
  const [notice, setNotice] = useState('');
  const status = TABS[tab][0];

  const load = useCallback(() => {
    setErr(false);
    ccApi.list(status).then((r) => setData(r.data)).catch(() => setErr(true));
  }, [status]);
  useEffect(() => { setData(null); load(); }, [load]);
  useEffect(() => { ccApi.candidates().then((r) => setCandidates(r.data?.data || [])).catch(() => {}); }, []);

  const counts = data?.counts || {};
  const tabs = useMemo(() => TABS.map(([k, l]) => (counts[k] ? `${l} (${counts[k]})` : l)), [counts]);

  if (!can('admin.consultant_changes.view')) return <GenericPage title="تغيير المستشار"><EmptyState title="لا تملك صلاحية عرض هذه الصفحة" /></GenericPage>;

  return (
    <GenericPage title="طلبات تغيير المستشار" subtitle="يدرس المشرف كل طلب مع حال الخطة الفعلية ثم يقرر. ولتغيير مستشار أي خطة مباشرة افتحها من «مركز المخرجات» واضغط «تغيير المستشار».">
      <div style={{ background: colors.primaryTint, borderRadius: 14, padding: '12px 16px', fontSize: 13, lineHeight: 1.9, marginBottom: 16 }}>
        <strong>متى يُسمح بالتغيير؟</strong> للخطط المدفوعة الجارية فقط. قبل الدفع يختار العميل مستشاره بنفسه، وبعد اكتمال الخطة لا يُغيَّر المستشار.
        عند الاعتماد: ينتقل كل ما ينتظر المراجعة إلى المستشار الجديد كما هو، وتبقى ملاحظات المستشار السابق ظاهرة، وتُفتح محادثة مع المستشار الجديد، ويُبلَّغ العميل والمستشاران.
      </div>
      {notice && <div role="status" style={{ background: colors.greenLight || '#C9EFE1', color: '#086449', borderRadius: 12, padding: '10px 14px', fontWeight: 700, marginBottom: 12 }}>{notice}</div>}
      <div style={{ marginBottom: 14 }}><Tab tabs={tabs} active={tab} onChange={setTab} /></div>
      {err && <EmptyState title="تعذّر تحميل الطلبات" action={<Btn onClick={load} icon={<IcArrowPath width={16} height={16} />}>إعادة المحاولة</Btn>} />}
      {!data && !err && <Loading />}
      {data && data.data.length === 0 && <EmptyState icon={<IcWarning width={36} height={36} />} title={status === 'pending' ? 'لا توجد طلبات قيد الدراسة' : 'لا توجد طلبات في هذا القسم'} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data?.data.map((r) => (
          <RequestCard key={r.id} r={r} candidates={candidates} canDecide={can('admin.consultant_changes.decide')} onDecide={(req, mode) => setDecide({ req, mode })} />
        ))}
      </div>
      {decide && (
        <DecisionModal req={decide.req} mode={decide.mode} candidates={candidates} onClose={() => setDecide(null)}
          onDone={() => { setNotice(decide.mode === 'approve' ? 'تم اعتماد الطلب وتغيير المستشار، وأُبلغ العميل والمستشاران.' : 'تم رفض الطلب وأُبلغ العميل بالسبب.'); setDecide(null); load(); window.dispatchEvent(new Event('consultantChangesUpdated')); }} />
      )}
    </GenericPage>
  );
}
