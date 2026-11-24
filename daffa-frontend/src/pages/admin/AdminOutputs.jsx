// مركز المخرجات — كل ما كتبه العملاء في الأنظمة الثلاثة، وكل قرارات المستشارين، في مكان واحد.
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { adminApi } from '../../api/admin';
import { colors, systems, font, tones } from '../../theme/tokens';
import { Badge, Btn, Card, ProgressBar, Loading, EmptyState, MetricCard, Tab } from '../../components/ui/kit';
import { Help } from '../../components/ui/Help';
import FormDataViewer from '../consultant/FormDataViewer';
import { ReassignConsultantModal } from './AdminConsultantChanges';
import { usePermissions } from '../../utils/permissions';
import { IcSearch, IcDownload, IcXMark, IcCheckCircle, IcArrowPath, IcClock, IcUsers, IcDocument, IcStar, IcChat } from '../../utils/icons';
import { asArray, asObject } from '../../utils/apiData';

const ITEM_STATUS = {
  not_started: { t: 'لم تبدأ', c: 'gray' },
  in_progress: { t: 'قيد العمل', c: 'gray' },
  draft:       { t: 'مسودة', c: 'gray' },
  submitted:   { t: 'بانتظار المراجعة', c: 'blue' },
  reviewing:   { t: 'قيد المراجعة', c: 'blue' },
  revision:    { t: 'طُلب تعديل', c: 'amber' },
  approved:    { t: 'معتمدة', c: 'green' },
};
const WF_STATUS = { pending: 'بانتظار البدء', active: 'قيد العمل', review: 'في المراجعة النهائية', completed: 'مكتمل', in_progress: 'قيد العمل' };

const SysDot = ({ k, label = true }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: systems[k].text, background: systems[k].soft, borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: systems[k].color }} />{label && systems[k].short}
  </span>
);

const Chip = ({ active, onClick, children, color }) => (
  <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 999, border: `1.5px solid ${active ? (color || colors.primary) : colors.grayBorder}`, background: active ? (color ? `${color}14` : colors.primaryTint) : '#fff', color: active ? colors.ink : colors.gray, fontSize: 13.5, fontWeight: active ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
    {children}
  </button>
);

// ── تفاصيل مخرج واحد (لوحة جانبية) ────────────────────────────────────────
function OutputDrawer({ row, onClose }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState(null);
  const [reassign, setReassign] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { can } = usePermissions();

  useEffect(() => {
    setD(null); setErr(false);
    adminApi.getOutput(row.system, row.id).then((r) => {
      const d = asObject(r.data, { items: [] });
      d.items = asArray(d.items);
      setD(d);
      const first = d.items.find((i) => ['submitted', 'reviewing', 'revision'].includes(i.status)) || d.items.find((i) => i.form_data);
      setOpen(first?.number ?? null);
    }).catch(() => setErr(true));
  }, [row, reloadKey]);

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);

  const sys = systems[row.system];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,31,46,0.5)', animation: 'pageIn .2s' }} />
      <aside role="dialog" aria-label="تفاصيل المخرج" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 'min(860px, 100vw)', background: colors.bg, display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(0,0,0,0.3)', animation: 'pageIn .2s' }}>
        <header style={{ background: '#fff', borderBottom: `1px solid ${colors.grayBorder}`, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12, borderTop: `4px solid ${sys.color}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <SysDot k={row.system} />
              <span style={{ fontSize: 12.5, color: colors.gray }}>{row.system === 'policies' ? 'خطة سياسات' : 'خطة'} #{row.id}</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{row.org_name}</h2>
            <div style={{ fontSize: 13, color: colors.gray, marginTop: 2 }}>
              {d?.org?.rep_name && <span>{d.org.rep_name} · </span>}<span dir="ltr">{row.email}</span>
            </div>
          </div>
          {d && d.status !== 'completed' && can('admin.consultant_changes.reassign') && <Btn small variant="secondary" onClick={() => setReassign(true)}>تغيير المستشار</Btn>}
          {d?.pdf_url && <Btn small variant="brand" icon={<IcDownload width={16} height={16} />} onClick={() => window.open(d.pdf_url, '_blank')}>الوثيقة PDF</Btn>}
          <button onClick={onClose} aria-label="إغلاق" title="إغلاق" style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: colors.sunken, color: colors.gray, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IcXMark width={18} height={18} /></button>
        </header>

        {reassign && <ReassignConsultantModal system={row.system} workflowId={row.id} onClose={() => setReassign(false)} onDone={() => { setReassign(false); setReloadKey((k) => k + 1); }} />}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {err && <EmptyState title="تعذّر تحميل التفاصيل" text="حاول مرة أخرى بعد قليل." />}
          {!d && !err && <Loading />}
          {d && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 }}>
                {[
                  ['الحالة', WF_STATUS[d.status] || d.status],
                  ['المستشار', d.consultant?.name || 'لم يُحدَّد'],
                  ['الدفع', d.paid ? `مدفوع${d.total ? ` · ${d.total.toLocaleString('en-US')} ر.س` : ''}` : 'غير مدفوع'],
                  ['التقدّم', `${row.approved} من ${row.total_items} معتمدة`],
                  ['تاريخ البدء', d.created_at || '—'],
                ].map(([l, v]) => (
                  <div key={l} style={{ background: '#fff', border: `1px solid ${colors.grayBorder}`, borderRadius: 14, padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, color: colors.gray }}>{l}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: colors.ink, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: 16, marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                {row.system === 'policies' ? 'السياسات المختارة' : 'الوحدات'}
                <Help title="ما الذي أراه هنا؟" text="كل وحدة/سياسة مع حالتها، وما كتبه العميل فيها كاملًا، وآخر ملاحظة كتبها المستشار. اضغط أي صف لفتحه." />
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.items.map((it) => {
                  const st = ITEM_STATUS[it.status] || ITEM_STATUS.not_started;
                  const isOpen = open === it.number;
                  const has = !!it.form_data;
                  return (
                    <div key={it.number} style={{ background: '#fff', border: `1.5px solid ${isOpen ? sys.color : colors.grayBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                      <button onClick={() => setOpen(isOpen ? null : it.number)} disabled={!has && !it.consultant_notes} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: 'none', background: 'none', cursor: has || it.consultant_notes ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'right' }}>
                        <span style={{ width: 32, height: 32, borderRadius: 10, background: it.status === 'approved' ? colors.greenLight : sys.soft, color: it.status === 'approved' ? colors.greenText : sys.text, fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: font.display }}>{it.number}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 600, color: colors.ink }}>{it.name}</span>
                        {it.revision_count > 0 && <span style={{ fontSize: 12, color: colors.gray }} title="عدد مرات طلب التعديل">تعديلات: {it.revision_count}</span>}
                        <Badge text={st.t} color={st.c} small dot />
                        {it.pdf_url && <span onClick={(e) => { e.stopPropagation(); window.open(it.pdf_url, '_blank'); }} title="تنزيل السياسة PDF" style={{ display: 'flex', color: colors.primary }}><IcDownload width={18} height={18} /></span>}
                        {(has || it.consultant_notes) && <span style={{ color: colors.subtle, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>‹</span>}
                      </button>
                      {isOpen && (
                        <div style={{ padding: '4px 16px 16px', borderTop: `1px solid ${colors.grayBorder}` }}>
                          {it.consultant_notes && (
                            <div style={{ margin: '12px 0', padding: '12px 14px', borderRadius: 12, background: it.status === 'revision' ? colors.amberSoft : colors.greenLight, border: `1px solid ${it.status === 'revision' ? '#FDE2D2' : '#C9EFE1'}` }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: it.status === 'revision' ? colors.amberText : colors.greenText, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><IcChat width={15} height={15} /> ملاحظة المستشار{it.reviewed_at ? ` · ${it.reviewed_at.slice(0, 10)}` : ''}</div>
                              <div style={{ fontSize: 14, lineHeight: 1.9, color: colors.text, whiteSpace: 'pre-wrap' }}>{it.consultant_notes}</div>
                            </div>
                          )}
                          {has ? <FormDataViewer data={it.form_data} /> : <div style={{ padding: 14, color: colors.gray, fontSize: 13.5 }}>لا يوجد محتوى مكتوب بعد.</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

// ── قرارات مستشار ─────────────────────────────────────────────────────────
function ConsultantDrawer({ c, onClose }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  useEffect(() => { adminApi.getConsultantReviews(c.id).then((r) => setD(asObject(r.data, { data: [], ratings: [] }))).catch(() => setD({ data: [], ratings: [] })); }, [c]);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,31,46,0.5)' }} />
      <aside role="dialog" aria-label="قرارات المستشار" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 'min(640px, 100vw)', background: colors.bg, display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(0,0,0,0.3)' }}>
        <header style={{ background: colors.ink, color: '#fff', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: colors.amber, color: colors.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 700, fontSize: 20 }}>{(c.name || 'م')[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.display, fontSize: 18, fontWeight: 700 }}>{c.name}</div>
            <div style={{ fontSize: 13, color: '#D6E4EE' }}>{c.specialty || 'مستشار'} · قرارات المراجعة وملاحظاته</div>
          </div>
          <button onClick={onClose} aria-label="إغلاق" style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}><IcXMark width={18} height={18} /></button>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {!d ? <Loading /> : d.data.length === 0 ? <EmptyState title="لا توجد قرارات بعد" text="ستظهر هنا كل وحدة اعتمدها هذا المستشار أو طلب تعديلها مع ملاحظاته." /> : (
            <ol style={{ listStyle: 'none', position: 'relative' }}>
              {d.data.map((x, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: x.decision === 'approved' ? colors.greenLight : colors.amberSoft, color: x.decision === 'approved' ? colors.greenText : colors.amberText }}>
                    {x.decision === 'approved' ? <IcCheckCircle width={18} height={18} /> : <IcArrowPath width={18} height={18} />}
                  </span>
                  <div style={{ flex: 1, background: '#fff', border: `1px solid ${colors.grayBorder}`, borderRadius: 14, padding: '10px 14px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <b style={{ fontSize: 14, color: colors.ink }}>{x.decision === 'approved' ? 'اعتمد' : 'طلب تعديل'}: {x.item}</b>
                      <SysDot k={x.system} />
                    </div>
                    <div style={{ fontSize: 12.5, color: colors.gray, margin: '2px 0 6px' }}>{x.org_name} · {x.reviewed_human}{x.response_hours != null ? ` · زمن الرد ${x.response_hours} ساعة` : ''}</div>
                    {x.notes && <div style={{ fontSize: 13.5, lineHeight: 1.85, color: colors.text, background: colors.bg, borderRadius: 10, padding: '8px 10px', whiteSpace: 'pre-wrap' }}>{x.notes}</div>}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {d?.ratings?.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, margin: '18px 0 10px' }}>تقييمات العملاء</h3>
              {d.ratings.map((r, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${colors.grayBorder}`, borderRadius: 14, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}><b>{r.org}</b><span style={{ color: colors.amberText, fontWeight: 700 }}>{'★'.repeat(r.rating)}<span style={{ color: colors.grayBorder }}>{'★'.repeat(5 - r.rating)}</span></span></div>
                  {r.comment && <div style={{ fontSize: 13.5, color: colors.text, marginTop: 4 }}>{r.comment}</div>}
                </div>
              ))}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function AdminOutputs() {
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState(null);
  const [summary, setSummary] = useState(null);
  const [cons, setCons] = useState(null);
  const [sys, setSys] = useState('');
  const [status, setStatus] = useState('');
  const [consultant, setConsultant] = useState('');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const [selCon, setSelCon] = useState(null);

  useEffect(() => {
    adminApi.getOutputs().then((r) => { setRows(r.data.data); setSummary(r.data.summary); }).catch(() => setRows([]));
    adminApi.getOutputConsultants().then((r) => setCons(r.data.data)).catch(() => setCons([]));
  }, []);

  const filtered = useMemo(() => (rows || []).filter((r) => {
    if (sys && r.system !== sys) return false;
    if (consultant && String(r.consultant_id) !== consultant) return false;
    if (status === 'needs_review' && !(r.pending_review > 0)) return false;
    if (status === 'revision' && !(r.in_revision > 0)) return false;
    if (status === 'completed' && r.status !== 'completed') return false;
    if (status === 'active' && (r.status === 'completed' || !r.paid)) return false;
    if (status === 'unpaid' && r.paid) return false;
    if (q.trim() && !`${r.org_name} ${r.email} ${r.consultant_name}`.includes(q.trim())) return false;
    return true;
  }), [rows, sys, status, consultant, q]);

  const counts = useMemo(() => {
    const c = { '': (rows || []).length };
    Object.keys(systems).forEach((k) => { c[k] = (rows || []).filter((r) => r.system === k).length; });
    return c;
  }, [rows]);

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center' }}>مركز المخرجات<Help title="مركز المخرجات" text="هنا ترى كل ما أنجزه العملاء في الأنظمة الثلاثة، وكل قرار وملاحظة كتبها المستشارون — للاطلاع والمتابعة فقط دون تغيير أي بيانات." /></h2>
          <p style={{ fontSize: 14, color: colors.gray, marginTop: 4 }}>مخرجات العملاء وقرارات المستشارين في مكان واحد</p>
        </div>
        <Tab tabs={['مخرجات العملاء', 'أداء المستشارين']} active={tab} onChange={setTab} />
      </div>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'var(--g-4)', gap: 12, marginBottom: 18 }}>
          <MetricCard title="بانتظار مراجعة المستشار" value={summary.pending_review} icon={<IcClock width={22} height={22} />} tone="blue" onClick={() => { setTab(0); setStatus('needs_review'); }} />
          <MetricCard title="عناصر طُلب تعديلها" value={summary.in_revision} icon={<IcArrowPath width={22} height={22} />} tone="amber" onClick={() => { setTab(0); setStatus('revision'); }} />
          <MetricCard title="عناصر معتمدة" value={summary.approved_items} icon={<IcCheckCircle width={22} height={22} />} tone="green" />
          <MetricCard title="خطط مكتملة" value={summary.strategic.completed + summary.operational.completed + summary.policies.completed} icon={<IcDocument width={22} height={22} />} tone="primary" onClick={() => { setTab(0); setStatus('completed'); }} />
        </div>
      )}

      {tab === 0 && (
        <>
          <Card style={{ padding: 14, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip active={!sys} onClick={() => setSys('')}>الكل <span style={{ color: colors.gray }}>{counts['']}</span></Chip>
              {Object.values(systems).map((s) => (
                <Chip key={s.key} active={sys === s.key} color={s.color} onClick={() => setSys(s.key)}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />{s.short} <span style={{ color: colors.gray }}>{counts[s.key]}</span>
                </Chip>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم المنظمة أو البريد أو المستشار" style={{ width: '100%', height: 42, padding: '0 38px 0 12px', borderRadius: 12, border: `1.5px solid ${colors.grayBorder}`, fontFamily: 'inherit', fontSize: 14 }} />
                <span style={{ position: 'absolute', right: 12, top: 11, color: colors.subtle }}><IcSearch width={18} height={18} /></span>
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="الحالة" style={{ height: 42, borderRadius: 12, border: `1.5px solid ${colors.grayBorder}`, padding: '0 10px', fontFamily: 'inherit', fontSize: 14, background: '#fff' }}>
                <option value="">كل الحالات</option>
                <option value="needs_review">بانتظار مراجعة المستشار</option>
                <option value="revision">بها طلب تعديل</option>
                <option value="active">قيد العمل</option>
                <option value="completed">مكتملة</option>
                <option value="unpaid">لم تُدفع بعد</option>
              </select>
              <select value={consultant} onChange={(e) => setConsultant(e.target.value)} aria-label="المستشار" style={{ height: 42, borderRadius: 12, border: `1.5px solid ${colors.grayBorder}`, padding: '0 10px', fontFamily: 'inherit', fontSize: 14, background: '#fff' }}>
                <option value="">كل المستشارين</option>
                {(cons || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </Card>

          {!rows ? <Loading /> : filtered.length === 0 ? (
            <EmptyState icon={<IcDocument width={28} height={28} />} title="لا توجد مخرجات مطابقة" text="غيّر عوامل التصفية أو امسح البحث." action={<Btn small variant="secondary" onClick={() => { setSys(''); setStatus(''); setConsultant(''); setQ(''); }}>مسح التصفية</Btn>} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 12 }}>
              {filtered.map((r) => {
                const s = systems[r.system];
                return (
                  <Card key={r.key} onClick={() => setSel(r)} style={{ padding: 16, borderRight: `4px solid ${s.color}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15.5, fontWeight: 700, color: colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.org_name}</div>
                        <div style={{ fontSize: 12.5, color: colors.gray }}>{r.consultant_name ? `المستشار: ${r.consultant_name}` : 'لم يُحدَّد مستشار'} · {r.updated_at}</div>
                      </div>
                      <SysDot k={r.system} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}><ProgressBar percent={r.progress} color={s.color} height={7} /></div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>{r.approved}/{r.total_items}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {r.status === 'completed' && <Badge text="مكتمل" color="green" small dot />}
                      {!r.paid && <Badge text="لم يُدفع" color="gray" small dot />}
                      {r.pending_review > 0 && <Badge text={`${r.pending_review} بانتظار المراجعة`} color="blue" small dot />}
                      {r.in_revision > 0 && <Badge text={`${r.in_revision} طُلب تعديلها`} color="amber" small dot />}
                      {r.paid && r.status !== 'completed' && !r.pending_review && !r.in_revision && <Badge text={WF_STATUS[r.status] || 'قيد العمل'} color="primary" small dot />}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 1 && (
        !cons ? <Loading /> : cons.length === 0 ? <EmptyState title="لا يوجد مستشارون" /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
            {cons.map((c) => (
              <Card key={c.id} onClick={() => setSelCon(c)} style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: colors.primaryTint, color: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 700, fontSize: 19 }}>{(c.name || 'م')[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700, color: colors.ink }}>{c.name}</div>
                    <div style={{ fontSize: 12.5, color: colors.gray }}>{c.specialty || 'مستشار'}</div>
                  </div>
                  <Badge text={c.available ? 'متاح' : 'غير متاح'} color={c.available ? 'green' : 'gray'} small dot />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    ['العملاء', c.clients, IcUsers],
                    ['بانتظاره', c.pending_review, IcClock],
                    ['اعتمادات', c.approved, IcCheckCircle],
                    ['طلبات تعديل', c.revisions, IcArrowPath],
                    ['متوسط الرد', c.avg_response_hours != null ? `${c.avg_response_hours} س` : '—', IcClock],
                    ['التقييم', c.rating ? `${c.rating}` : '—', IcStar],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: colors.bg, borderRadius: 12, padding: '8px 10px' }}>
                      <div style={{ fontFamily: font.display, fontSize: 17, fontWeight: 700, color: l === 'بانتظاره' && c.pending_review > 0 ? tones.blue.text : colors.ink }}>{v}</div>
                      <div style={{ fontSize: 11.5, color: colors.gray }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 13, color: colors.primary, fontWeight: 700 }}>عرض القرارات والملاحظات ←</div>
              </Card>
            ))}
          </div>
        )
      )}

      {sel && createPortal(<OutputDrawer row={sel} onClose={() => setSel(null)} />, document.body)}
      {selCon && createPortal(<ConsultantDrawer c={selCon} onClose={() => setSelCon(null)} />, document.body)}
    </div>
  );
}
