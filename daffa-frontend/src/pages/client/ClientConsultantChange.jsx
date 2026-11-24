// مستشارو خططي — يرى العميل مستشار كل خطة، ويقدّم طلبًا مسبَّبًا لتغيير مستشار خطة جارية، ويتابع قرار الإدارة.
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { consultantChangesApi } from '../../api/consultantChanges';
import { colors, systems } from '../../theme/tokens';
import { Badge, Btn, Card, Loading, EmptyState, GenericPage } from '../../components/ui/kit';
import { IcXMark, IcClock, IcChat, IcArrowPath } from '../../utils/icons';

const STATUS = {
  pending:   { t: 'قيد الدراسة', c: 'amber' },
  approved:  { t: 'تم التغيير', c: 'green' },
  rejected:  { t: 'لم يُعتمد', c: 'red' },
  cancelled: { t: 'ألغيته', c: 'gray' },
};
const fmt = (s) => (s ? s.slice(0, 10).replace(/-/g, '/') : '');
const inputSt = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };

function RequestForm({ plan, reasons, consultants, onClose, onDone }) {
  const [cat, setCat] = useState('');
  const [reason, setReason] = useState('');
  const [pref, setPref] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  const submit = async () => {
    setErr('');
    if (!cat) { setErr('اختر سبب الطلب.'); return; }
    if (reason.trim().length < 15) { setErr('وضّح السبب في جملة أو جملتين (15 حرفًا على الأقل) حتى تتمكن الإدارة من دراسته.'); return; }
    setBusy(true);
    try {
      await consultantChangesApi.create({ system: plan.system, workflow_id: plan.workflow_id, reason_category: cat, reason: reason.trim(), preferred_consultant_id: pref ? Number(pref) : null });
      onDone();
    } catch (e) {
      const d = e.response?.data;
      setErr(d?.errors ? Object.values(d.errors).flat()[0] : d?.message || 'تعذّر إرسال الطلب.');
    } finally { setBusy(false); }
  };
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,31,46,0.5)' }} />
      <div role="dialog" aria-modal="true" aria-label="طلب تغيير المستشار" style={{ position: 'relative', background: '#fff', borderRadius: 18, width: 'min(600px, 100%)', maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>طلب تغيير المستشار</h3>
          <button onClick={onClose} aria-label="إغلاق" style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: colors.sunken, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcXMark width={18} height={18} /></button>
        </div>
        <div style={{ fontSize: 13, color: colors.gray, marginBottom: 14 }}>{plan.label} ({plan.ref}) · المستشار الحالي: <strong style={{ color: colors.ink }}>{plan.consultant?.name}</strong></div>

        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>ما سبب الطلب؟</div>
        <div role="radiogroup" aria-label="سبب الطلب" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {Object.entries(reasons).map(([k, v]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${cat === k ? colors.primary : colors.grayBorder}`, background: cat === k ? colors.primaryTint : '#fff', cursor: 'pointer', fontSize: 13.5 }}>
              <input type="radio" name="cc-reason" checked={cat === k} onChange={() => setCat(k)} /> {v}
            </label>
          ))}
        </div>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>اشرح ما حدث</div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={2000} style={{ ...inputSt, resize: 'vertical' }} aria-label="تفاصيل السبب"
            placeholder="مثال: أرسلنا الوحدتين الرابعة والخامسة قبل أسبوع ولم تصلنا مراجعة أو رد على الرسائل." />
          <div style={{ fontSize: 11.5, color: colors.gray, marginTop: 4 }}>تساعد التفاصيل (التواريخ والوحدات المعنية) الإدارةَ على دراسة الحالة بسرعة. {reason.trim().length}/2000</div>
        </label>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>مستشار تفضّله (اختياري)</div>
          <select value={pref} onChange={(e) => setPref(e.target.value)} style={inputSt} aria-label="المستشار المفضل">
            <option value="">أترك الاختيار للإدارة</option>
            {consultants.filter((c) => c.id !== plan.consultant?.id).map((c) => <option key={c.id} value={c.id}>{c.name}{c.specialty ? ` — ${c.specialty}` : ''}</option>)}
          </select>
          <div style={{ fontSize: 11.5, color: colors.gray, marginTop: 4 }}>الإدارة تأخذ تفضيلك في الحسبان، وقد تختار مستشارًا آخر بحسب التخصص والأحمال.</div>
        </label>

        <div style={{ background: colors.sunken, borderRadius: 12, padding: '10px 14px', fontSize: 12.5, lineHeight: 1.9, marginBottom: 12 }}>
          <strong>ماذا يحدث بعد الإرسال؟</strong> تدرس إدارة المنصة طلبك وتردّ عليك بإشعار. يستمر عملك أثناء الدراسة كالمعتاد.
          إن اعتُمد التغيير: تنتقل وحداتك المرسلة إلى المستشار الجديد كما هي، وتبقى ملاحظات المستشار الحالي محفوظة، ولا تدفع أي مبلغ إضافي.
        </div>
        {err && <div role="alert" style={{ color: colors.red, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={onClose}>إلغاء</Btn>
          <Btn onClick={submit} disabled={busy}>{busy ? 'جارٍ الإرسال…' : 'إرسال الطلب للإدارة'}</Btn>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PlanCard({ p, pendingReq, onRequest }) {
  const sys = systems[p.system];
  return (
    <Card data-plan={`${p.system}-${p.workflow_id}`} style={{ borderRight: `4px solid ${sys?.color || colors.primary}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{p.label} <span style={{ fontSize: 12, color: colors.gray, fontWeight: 500 }}>· {p.ref}</span></div>
          <div style={{ fontSize: 13.5, marginTop: 4 }}>
            {p.consultant ? <>المستشار: <strong>{p.consultant.name}</strong>{p.consultant.specialty ? <span style={{ color: colors.gray }}> — {p.consultant.specialty}</span> : null}</> : <span style={{ color: colors.gray }}>لم يُحدَّد مستشار بعد</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {p.closed && <Badge small color="green" text="مكتملة" />}
          {pendingReq && <Badge small color="amber" text="طلب تغيير قيد الدراسة" />}
          {p.can_request && <Btn small variant="secondary" onClick={() => onRequest(p)}>طلب تغيير المستشار</Btn>}
        </div>
      </div>
      {!p.can_request && p.blocked_reason && !pendingReq && <div style={{ fontSize: 12.5, color: colors.gray, marginTop: 8 }}>{p.blocked_reason}</div>}
    </Card>
  );
}

export default function ClientConsultantChange({ onOpenChat }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState('');
  const load = useCallback(() => { setErr(false); consultantChangesApi.list().then((r) => setData(r.data)).catch(() => setErr(true)); }, []);
  useEffect(() => { load(); }, [load]);

  const cancel = async (id) => {
    if (!window.confirm('إلغاء طلب تغيير المستشار؟')) return;
    try { await consultantChangesApi.cancel(id); setNotice('أُلغي الطلب، ويبقى مستشارك الحالي.'); load(); } catch (e) { alert(e.response?.data?.message || 'تعذّر الإلغاء.'); }
  };

  const plans = data?.plans || [];
  const requests = data?.requests || [];
  const pendingFor = (p) => requests.find((r) => r.status === 'pending' && r.system === p.system && r.workflow_id === p.workflow_id);
  const withConsultant = plans.filter((p) => p.consultant || !p.closed);

  return (
    <GenericPage title="مستشارو خططي" subtitle="مستشار كل خطة من خططك، ويمكنك طلب تغيير مستشار خطة جارية إن لم تسر كما تريد.">
      <div style={{ background: colors.primaryTint, borderRadius: 14, padding: '12px 16px', fontSize: 13, lineHeight: 1.9, marginBottom: 16 }}>
        قبل أن تطلب التغيير، جرّب مراسلة مستشارك من «المحادثات» فكثير من الأمور تُحل بالتواصل.
        {onOpenChat && <> <button onClick={onOpenChat} style={{ background: 'none', border: 'none', color: colors.primary, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}><IcChat width={13} height={13} /> افتح المحادثات</button></>}
        <br />يُتاح طلب التغيير للخطط المدفوعة الجارية؛ وتدرسه إدارة المنصة وتردّ عليك.
      </div>
      {notice && <div role="status" style={{ background: colors.greenLight, color: '#086449', borderRadius: 12, padding: '10px 14px', fontWeight: 700, marginBottom: 12 }}>{notice}</div>}
      {err && <EmptyState title="تعذّر التحميل" action={<Btn onClick={load} icon={<IcArrowPath width={16} height={16} />}>إعادة المحاولة</Btn>} />}
      {!data && !err && <Loading />}
      {data && withConsultant.length === 0 && <EmptyState title="لا توجد خطط بعد" text="عند الاشتراك في أي خدمة تختار مستشارك، ويظهر هنا." />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {withConsultant.map((p) => <PlanCard key={`${p.system}-${p.workflow_id}`} p={p} pendingReq={pendingFor(p)} onRequest={setForm} />)}
      </div>

      {requests.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '22px 0 10px' }}>طلباتي</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.filter((r) => r.source === 'client' || r.status === 'approved').map((r) => (
              <Card key={r.id} data-my-request={r.status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{r.plan_label} <span style={{ fontSize: 12, color: colors.gray, fontWeight: 500 }}>· {r.plan_ref}</span></div>
                  <Badge color={STATUS[r.status]?.c} text={r.source === 'admin' ? 'غيّرته الإدارة' : STATUS[r.status]?.t} />
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.9, marginTop: 6 }}>
                  {r.source === 'client' && <div>السبب: {r.reason_label}</div>}
                  <div>{r.from?.name || '—'}{r.to ? ` ← ${r.to.name}` : ''}{r.requested && r.status === 'pending' ? ` · تفضيلك: ${r.requested.name}` : ''}</div>
                  {r.admin_note && <div style={{ background: colors.sunken, borderRadius: 10, padding: '8px 12px', marginTop: 4 }}><strong>رد الإدارة:</strong> {r.admin_note}</div>}
                  <div style={{ fontSize: 12, color: colors.gray, display: 'flex', alignItems: 'center', gap: 4 }}><IcClock width={12} height={12} /> {fmt(r.created_at)}{r.decided_at ? ` · القرار ${fmt(r.decided_at)}` : ''}</div>
                </div>
                {r.status === 'pending' && <div style={{ marginTop: 8 }}><Btn small variant="dangerGhost" onClick={() => cancel(r.id)}>إلغاء الطلب</Btn></div>}
              </Card>
            ))}
          </div>
        </>
      )}

      {form && (
        <RequestForm plan={form} reasons={data.reasons} consultants={data.consultants} onClose={() => setForm(null)}
          onDone={() => { setForm(null); setNotice('أُرسل طلبك إلى إدارة المنصة. سيصلك إشعار بالقرار، ويستمر عملك مع مستشارك الحالي حتى ذلك الحين.'); load(); }} />
      )}
    </GenericPage>
  );
}
