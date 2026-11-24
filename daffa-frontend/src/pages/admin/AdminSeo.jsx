// «الظهور والقياس» — خمس صفحات في لوحة الأدمن. كل ما يُحفظ هنا يصل الزائر ومحركات البحث من الخادم مباشرة
// (app/Http/Controllers/PublicPageController.php)، والفارغ يعني النص الافتراضي المبني من محتوى الصفحة.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { seoApi } from '../../api/seo';
import { colors } from '../../theme/tokens';
import { Badge, Btn, Card, Loading, EmptyState, Tab, GenericPage } from '../../components/ui/kit';
import { usePermissions } from '../../utils/permissions';
import { SEO_LIMITS, meterLevel, analyzeKeyword, parseKeywords, isValidTracking, normalizeTracking } from '../../utils/seoRules';

const inputSt = { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14.5, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', direction: 'ltr', textAlign: 'left' };
const errOf = (e, fb) => { const d = e?.response?.data; return d?.errors ? Object.values(d.errors).flat()[0] : d?.message || fb; };
const fmtDate = (s) => (s ? String(s).slice(0, 16).replace('T', ' ') : '—');

/* ── عناصر مشتركة (على مستوى الوحدة) ─────────────────────────────────── */
function Note({ tone = 'gray', children, ...rest }) {
  const t = { gray: [colors.sunken, colors.ink], amber: ['#FFF4EC', '#7F310E'], red: [colors.redLight, colors.red], green: [colors.greenLight, '#086449'], blue: [colors.primaryTint, colors.primary] }[tone];
  return <div {...rest} style={{ background: t[0], color: t[1], borderRadius: 12, padding: '10px 14px', fontSize: 13.5, lineHeight: 1.9 }}>{children}</div>;
}
function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.ink, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 12.5, marginTop: 5, lineHeight: 1.7, color: colors.gray }}>{hint}</div>}
    </label>
  );
}
function Switch({ on, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
      style={{ position: 'relative', width: 48, height: 27, flexShrink: 0, borderRadius: 999, border: 'none', cursor: disabled ? 'wait' : 'pointer', background: on ? colors.amber : colors.grayBorder, transition: 'background .2s' }}>
      <span aria-hidden="true" style={{ position: 'absolute', top: 3, right: on ? 3 : 24, width: 21, height: 21, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)', transition: 'right .2s' }} />
    </button>
  );
}
function Toast({ msg }) {
  if (!msg) return null;
  return <div role="status" style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 900, background: msg.ok ? colors.ink : colors.red, color: '#fff', padding: '10px 18px', borderRadius: 12, fontWeight: 700, fontSize: 14, boxShadow: '0 8px 24px rgba(0,0,0,.2)' }}>{msg.text}</div>;
}
function useToast() {
  const [msg, setMsg] = useState(null);
  const t = useRef(null);
  const show = useCallback((text, ok = true) => { clearTimeout(t.current); setMsg({ text, ok }); t.current = setTimeout(() => setMsg(null), 3200); }, []);
  return [msg, show];
}
const METER = {
  empty: { color: colors.gray, note: () => 'فارغ: يُستخدم النص الافتراضي المبني من محتوى الصفحة' },
  short: { color: '#A33F12', note: (n) => `${n} حرفًا · قصير، استغل المساحة` },
  good: { color: '#0B7F5D', note: (n) => `${n} حرفًا · مناسب` },
  long: { color: colors.red, note: (n) => `${n} حرفًا · طويل، سيقصّه جوجل` },
};
function Meter({ value, limit }) {
  const lv = meterLevel(value, limit);
  return <span style={{ color: METER[lv].color }}>{METER[lv].note(String(value || '').trim().length)}</span>;
}
function GooglePreview({ url, title, description }) {
  return (
    <div data-google-preview style={{ border: `1px solid ${colors.grayBorder}`, borderRadius: 12, padding: '14px 16px', background: '#fff' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.gray, marginBottom: 8 }}>هكذا تقريبًا تظهر في جوجل</div>
      <div dir="ltr" style={{ fontSize: 13, color: '#202124', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
      <div style={{ fontSize: 19, lineHeight: 1.45, color: '#1a0dab', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.65, color: '#4d5156', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</div>
    </div>
  );
}
function PageTabs({ pages, value, onChange, done }) {
  const idx = Math.max(0, pages.findIndex((p) => p.page === value));
  return <Tab tabs={pages.map((p) => `${p.label}${done?.(p) ? ' ✓' : ''}`)} active={idx} onChange={(i) => onChange(pages[i].page)} />;
}
function NoAccess({ title }) {
  return <GenericPage title={title}><EmptyState title="لا تملك صلاحية هذه الصفحة" text="اطلب من مدير النظام منحك صلاحية «الظهور والقياس»." /></GenericPage>;
}

/* ── حالة الأرشفة في محركات البحث ───────────────────────────────────── */
function IndexingStatus({ canEdit, toast }) {
  const [d, setD] = useState(null);
  const [log, setLog] = useState(null);
  const [busy, setBusy] = useState('');
  const load = useCallback(() => seoApi.status().then((r) => setD(r.data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  if (!d) return null;
  const cur = log ?? { verified_at: d.log.verified_at, sitemap_at: d.log.sitemap_at };
  const okPages = d.pages.filter((p) => p.title === 'good' && p.description === 'good').length;
  const last = d.indexnow.last;
  const item = (ok, title, detail) => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: `1px solid ${colors.grayLight}` }}>
      <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 999, flex: 'none', display: 'grid', placeItems: 'center', background: ok ? colors.greenLight : '#FFF4EC', color: ok ? '#086449' : '#A33F12', fontWeight: 900, fontSize: 13 }}>{ok ? '✓' : '!'}</span>
      <div style={{ minWidth: 0 }}><div style={{ fontWeight: 800 }}>{title}</div><div style={{ fontSize: 13, color: colors.gray, lineHeight: 1.7 }}>{detail}</div></div>
    </div>
  );
  const link = (href, label) => <a key={href} href={href} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 700, fontSize: 13 }}>{label}</a>;
  const ping = async () => {
    setBusy('ping');
    try {
      const r = await seoApi.indexNow();
      const ok = r.data.status === 200 || r.data.status === 202;
      toast(ok ? `أُرسلت ${r.data.count} روابط إلى IndexNow` : `لم يقبلها IndexNow الآن (${r.data.status ?? r.data.error})`, ok);
      load();
    } catch (e) { toast(errOf(e, 'تعذّر الإرسال'), false); } finally { setBusy(''); }
  };
  const saveLog = async () => {
    setBusy('log');
    try { const r = await seoApi.saveLog(cur); setD(r.data); setLog(null); toast('حُفظت التواريخ'); } catch (e) { toast(errOf(e, 'تعذّر الحفظ'), false); } finally { setBusy(''); }
  };
  return (
    <Card data-indexing-status style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>حالة الأرشفة في محركات البحث</div>
      {item(d.verify.google, 'توثيق الموقع في Google Search Console', d.verify.google ? `وسم التوثيق في كل الصفحات العامة، وملف التوثيق منشور.${cur.verified_at ? ` وُثّق في ${cur.verified_at}.` : ''}` : 'أضف رمز Google من «أدوات القياس والتتبّع».')}
      {item(d.verify.bing, 'توثيق Bing Webmaster Tools', d.verify.bing ? 'رمز Bing مضبوط.' : 'أضف رمز Bing من «أدوات القياس والتتبّع»، أو استورد الموقع في Bing من Search Console بضغطة.')}
      {item(d.sitemap.pages > 0, 'خريطة الموقع', `${d.sitemap.pages} صفحات في /sitemap.xml وتتحدّث وحدها${d.sitemap.hidden ? `، و${d.sitemap.hidden} مخفية عن البحث` : ''}.${cur.sitemap_at ? ` أُرسلت إلى Google في ${cur.sitemap_at}.` : ''}`)}
      {item(d.robots.sitemap && d.robots.engines, 'ملف robots.txt', `${d.robots.engines ? 'يسمح لـ Googlebot وBingbot، ولا يحجب CSS وJS، ويشير إلى خريطة الموقع.' : 'انتبه: القواعد الحالية تحجب محركات البحث عن الموقع كله.'} زواحف الذكاء الاصطناعي: ${d.robots.ai_block ? 'محجوبة' : 'مسموحة'}.`)}
      {item(!!last && (last.status === 200 || last.status === 202), 'IndexNow', last ? `آخر إرسال ${fmtDate(last.at)}: ${last.count} روابط (الرد ${last.status ?? last.error}).` : 'لم يُرسل شيء بعد.')}
      {item(okPages === d.pages.length, 'عناوين الصفحات وأوصافها', `${okPages} من ${d.pages.length} صفحات بعنوان ووصف بطول مناسب.`)}
      {canEdit && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 }}>
          <Field label="تاريخ التوثيق في Search Console"><input type="date" value={cur.verified_at} onChange={(e) => setLog({ ...cur, verified_at: e.target.value })} style={{ ...inputSt, direction: 'ltr' }} aria-label="تاريخ التوثيق" /></Field>
          <Field label="تاريخ إرسال خريطة الموقع"><input type="date" value={cur.sitemap_at} onChange={(e) => setLog({ ...cur, sitemap_at: e.target.value })} style={{ ...inputSt, direction: 'ltr' }} aria-label="تاريخ إرسال الخريطة" /></Field>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
        {canEdit && log && <Btn small onClick={saveLog} disabled={busy === 'log'}>حفظ التواريخ</Btn>}
        {canEdit && <Btn small variant="secondary" onClick={ping} disabled={busy === 'ping'}>{busy === 'ping' ? 'جارٍ الإرسال…' : 'إرسال كل الروابط إلى IndexNow'}</Btn>}
        {link(`https://search.google.com/search-console?resource_id=${encodeURIComponent(d.base + '/')}`, 'Google Search Console')}
        {link('https://www.bing.com/webmasters', 'Bing Webmaster Tools')}
        {link(`https://search.google.com/test/rich-results?url=${encodeURIComponent(d.base + '/')}`, 'اختبار النتائج الغنية')}
        {link(`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(d.base + '/')}`, 'PageSpeed Insights')}
        {link(`${d.base}/sitemap.xml`, 'sitemap.xml')}
        {link(`${d.base}/robots.txt`, 'robots.txt')}
      </div>
    </Card>
  );
}

/* ── 1) الظهور في محركات البحث ───────────────────────────────────────── */
export function SeoVisibilityPage() {
  const { can } = usePermissions();
  const canEdit = can('admin.seo.edit');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [page, setPage] = useState('home');
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState('');
  const [msg, toast] = useToast();
  const fileRef = useRef(null);
  const load = useCallback(() => seoApi.pages().then((r) => {
    const list = Array.isArray(r.data?.pages) ? r.data.pages : null;
    if (!list) { setErr(true); return; }
    setData(r.data);
    setDrafts((old) => { const n = { ...old }; for (const p of list) if (!n[p.page]) n[p.page] = { title: p.title || '', description: p.description || '', noindex: !!p.noindex, og_image: p.og_image || '', og_image_url: p.og_image_url }; return n; });
  }).catch(() => setErr(true)), []);
  useEffect(() => { load(); }, [load]);
  if (!can('admin.seo.view')) return <NoAccess title="الظهور في محركات البحث" />;

  const server = data?.pages.find((p) => p.page === page);
  const draft = drafts[page];
  const patch = (p) => setDrafts((d) => ({ ...d, [page]: { ...d[page], ...p } }));
  const complete = (p) => { const x = drafts[p.page]; return !!x?.title?.trim() && !!x?.description?.trim(); };
  const done = data ? data.pages.filter(complete).length : 0;

  const save = async () => {
    setBusy('save');
    try {
      const r = await seoApi.savePage(page, { title: draft.title, description: draft.description, noindex: draft.noindex, og_image: draft.og_image || '' });
      if (Array.isArray(r.data?.pages)) setData(r.data);
      toast(`حُفظت «${server.label}» وظهرت في الموقع`);
    } catch (e) { toast(errOf(e, 'تعذّر الحفظ'), false); } finally { setBusy(''); }
  };
  const upload = async (f) => {
    if (!f) return;
    setBusy('img');
    try { const r = await seoApi.uploadImage(page, f); patch({ og_image: r.data.path, og_image_url: r.data.url }); toast('رُفعت الصورة — اضغط «حفظ» لاعتمادها'); } catch (e) { toast(errOf(e, 'تعذّر رفع الصورة'), false); } finally { setBusy(''); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <GenericPage title="الظهور في محركات البحث" subtitle="العنوان والوصف اللذان يراهما الباحث في جوجل قبل أن يقرر هل يضغط، وهما ما يظهر عند مشاركة الرابط في واتساب وX ولينكدإن.">
      <Toast msg={msg} />
      <IndexingStatus canEdit={canEdit} toast={toast} />
      {err && <EmptyState title="تعذّر التحميل" />}
      {!data && !err && <Loading />}
      {data && server && draft && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <PageTabs pages={data.pages} value={page} onChange={setPage} done={complete} />
            <Badge color="primary" text={`${done} من ${data.pages.length} صفحات مكتوبة`} />
          </div>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-seo-page={page}>
            <Field label="عنوان الصفحة" hint={<Meter value={draft.title} limit={SEO_LIMITS.title} />}>
              <input value={draft.title} maxLength={200} disabled={!canEdit} placeholder={server.defaults.title} onChange={(e) => patch({ title: e.target.value })} style={{ ...inputSt, fontSize: 16 }} aria-label="عنوان الصفحة" />
            </Field>
            <Field label="وصف الصفحة" hint={<Meter value={draft.description} limit={SEO_LIMITS.description} />}>
              <textarea value={draft.description} maxLength={500} rows={3} disabled={!canEdit} placeholder={server.defaults.description} onChange={(e) => patch({ description: e.target.value })} style={{ ...inputSt, resize: 'vertical', lineHeight: 1.8 }} aria-label="وصف الصفحة" />
            </Field>
            <GooglePreview url={`daffah.org${server.path === '/' ? '' : ' › ' + server.path.slice(1)}`} title={draft.title.trim() || server.defaults.title} description={draft.description.trim() || server.defaults.description} />
            <Field label="صورة المشاركة" hint="تظهر عند مشاركة الرابط. الأنسب 1200 × 630 بكسل (JPG أو PNG أو WebP، حتى 3 ميجابايت). الفارغة تعني صورة دفة الافتراضية.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <img src={draft.og_image_url || '/og-image.png'} alt="معاينة صورة المشاركة" style={{ width: 120, height: 63, objectFit: 'cover', borderRadius: 8, border: `1px solid ${colors.grayBorder}` }} />
                {canEdit && <>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0])} style={{ display: 'none' }} aria-label="ملف صورة المشاركة" />
                  <Btn small variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy === 'img'}>{busy === 'img' ? 'جارٍ الرفع…' : draft.og_image ? 'تغيير الصورة' : 'رفع صورة'}</Btn>
                  {draft.og_image && <Btn small variant="ghost" onClick={() => patch({ og_image: '', og_image_url: null })}>إزالة</Btn>}
                </>}
              </div>
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', border: `1px solid ${colors.grayBorder}`, borderRadius: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>إخفاء هذه الصفحة عن محركات البحث</div>
                <div style={{ fontSize: 12.5, color: colors.gray }}>تبقى مفتوحة لمن معه الرابط، وتخرج من جوجل ومن خريطة الموقع.</div>
              </div>
              <Switch on={draft.noindex} onChange={(v) => patch({ noindex: v })} label="إخفاء هذه الصفحة عن محركات البحث" disabled={!canEdit} />
            </div>
            {draft.noindex && page === 'home' && <Note tone="red">انتبه: هذا يخفي الصفحة الرئيسية من جوجل.</Note>}
            {canEdit && <div><Btn onClick={save} disabled={busy === 'save'}>{busy === 'save' ? 'جارٍ الحفظ…' : `حفظ «${server.label}»`}</Btn></div>}
          </Card>
          <div style={{ fontSize: 12.5, color: colors.gray, marginTop: 10, lineHeight: 1.8 }}>صفحتا الدخول والتسجيل ولوحات التحكم مخفية عن محركات البحث دائمًا. وروابط حسابات المنصة الرسمية (تظهر لمحركات البحث مع اسم المنصة) من «محتوى الموقع ← تواصل معنا».</div>
        </>
      )}
    </GenericPage>
  );
}

/* ── 2) الكلمات المفتاحية ────────────────────────────────────────────── */
const CHECK_LABEL = { title: 'في عنوان الصفحة', description: 'في وصف الصفحة', heading: 'في عنوان فرعي', body: 'في نص الصفحة', density: 'تكرار متوازن' };
const LEVEL = { strong: ['قوية', 'green', '#0E9F74'], medium: ['متوسطة', 'amber', '#EF6A2C'], weak: ['ضعيفة', 'red', '#C53A3A'] };

function KeywordRow({ a, primary, canEdit, busy, onPrimary, onDelete }) {
  const [open, setOpen] = useState(false);
  const [label, tone, bar] = LEVEL[a.level];
  return (
    <div data-keyword={a.keyword} style={{ border: `1px solid ${colors.grayBorder}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={{ flex: '1 1 160px', minWidth: 0, border: 0, background: 'transparent', fontFamily: 'inherit', fontWeight: 800, fontSize: 14, textAlign: 'right', color: colors.ink, cursor: 'pointer' }}>{a.keyword}</button>
        {a.keyword === primary ? <Badge small color="primary" text="الأساسية" /> : canEdit && <Btn small variant="ghost" onClick={onPrimary} disabled={busy}>اجعلها الأساسية</Btn>}
        <span aria-hidden="true" style={{ width: 90, height: 6, borderRadius: 3, background: colors.grayLight, overflow: 'hidden', flex: 'none' }}><i style={{ display: 'block', height: '100%', width: `${a.score}%`, background: bar }} /></span>
        <span style={{ fontWeight: 800, fontSize: 13, width: 28, textAlign: 'center' }}>{a.score}</span>
        <Badge small color={tone} text={label} />
        {canEdit && <button type="button" aria-label={`حذف ${a.keyword}`} onClick={onDelete} disabled={busy} style={{ width: 30, height: 30, border: 0, borderRadius: 8, background: 'transparent', color: colors.gray, cursor: busy ? 'wait' : 'pointer', fontSize: 16, opacity: busy ? 0.4 : 1 }}>✕</button>}
      </div>
      {open && (
        <div style={{ padding: '4px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          {a.checks.map((c) => <div key={c.key} style={{ color: c.ok ? '#086449' : c.partial ? '#A33F12' : colors.red, display: 'flex', gap: 8 }}><span aria-hidden="true" style={{ fontWeight: 800 }}>{c.ok ? '✓' : c.partial ? '~' : '✕'}</span>{CHECK_LABEL[c.key]}</div>)}
          <div style={{ color: colors.gray }}>وردت {a.occurrences} مرة في النص، بكثافة {a.density}٪</div>
          {a.checks.some((c) => !c.ok) && <div style={{ fontWeight: 700 }}>لتقويتها: أضفها حيث تنقص — في «الظهور في محركات البحث» (العنوان والوصف) أو في نصوص الصفحة من «محتوى الموقع».</div>}
        </div>
      )}
    </div>
  );
}

export function SeoKeywordsPage() {
  const { can } = usePermissions();
  const canEdit = can('admin.seo.edit');
  const [data, setData] = useState(null);
  const [page, setPage] = useState('home');
  const [content, setContent] = useState({});
  const [lists, setLists] = useState({});
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, toast] = useToast();
  useEffect(() => {
    seoApi.pages().then((r) => {
      const list = Array.isArray(r.data?.pages) ? r.data.pages : [];
      setData({ ...r.data, pages: list });
      setLists(Object.fromEntries(list.map((p) => [p.page, { keywords: Array.isArray(p.keywords) ? p.keywords : [], primary: p.primary || '' }])));
    }).catch(() => setData({ pages: [] }));
  }, []);
  useEffect(() => { if (!content[page]) seoApi.content(page).then((r) => setContent((c) => ({ ...c, [page]: r.data }))).catch(() => {}); }, [page, content]);
  const cur = lists[page] || { keywords: [], primary: '' };
  const analyzed = useMemo(() => (content[page] ? cur.keywords.map((k) => ({ keyword: k, ...analyzeKeyword(k, content[page]) })) : []), [cur.keywords, content, page]);
  if (!can('admin.seo.view')) return <NoAccess title="الكلمات المفتاحية" />;

  // الحفظ واحدًا تلو الآخر: لا يُقبل إجراء جديد قبل وصول رد الحفظ السابق (حتى لا يطغى رد قديم على أحدث)
  const commit = async (keywords, primary) => {
    if (busy) return;
    const ordered = primary && keywords.includes(primary) ? [primary, ...keywords.filter((k) => k !== primary)] : keywords;
    const prev = cur;
    setLists((l) => ({ ...l, [page]: { keywords: ordered, primary: ordered.includes(primary) ? primary : ordered[0] || '' } }));
    setBusy(true);
    try { const r = await seoApi.saveKeywords(page, { keywords: ordered, primary: primary || null }); setLists((l) => ({ ...l, [page]: { keywords: r.data.keywords, primary: r.data.primary || '' } })); toast('حُفظت الكلمات'); }
    catch (e) { setLists((l) => ({ ...l, [page]: prev })); toast(errOf(e, 'تعذّر الحفظ'), false); }
    finally { setBusy(false); }
  };
  const add = () => {
    const parsed = parseKeywords(input);
    if (!parsed.length) return;
    const merged = parseKeywords([...cur.keywords, ...parsed].join('\n'));
    setInput('');
    commit(merged, cur.primary || merged[0]);
  };
  const count = (lv) => analyzed.filter((a) => a.level === lv).length;

  return (
    <GenericPage title="الكلمات المفتاحية" subtitle="ما تكتبه الجمعيات في جوجل لتصل إليك. القوة ليست رقمًا من جوجل، بل قياس لظهور الكلمة في صفحتك: العنوان والوصف والعناوين والنص.">
      <Toast msg={msg} />
      {!data ? <Loading /> : (
        <>
          <div style={{ marginBottom: 12 }}><PageTabs pages={data.pages} value={page} onChange={setPage} /></div>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {canEdit && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="اكتب كلمة واضغط Enter، أو الصق قائمة مفصولة بفواصل" style={{ ...inputSt, flex: '1 1 280px' }} aria-label="كلمة مفتاحية جديدة" />
                <Btn onClick={add} disabled={!input.trim() || busy}>إضافة</Btn>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge color="green" text={`قوية: ${count('strong')}`} /><Badge color="amber" text={`متوسطة: ${count('medium')}`} /><Badge color="red" text={`ضعيفة: ${count('weak')}`} />
            </div>
            {!content[page] && cur.keywords.length > 0 && <Loading pad={20} text="جارٍ قراءة نص الصفحة…" />}
            {cur.keywords.length === 0 ? (
              <EmptyState title="لا كلمات لهذه الصفحة بعد" text="ابدأ بما يبحث عنه الناس فعلًا، مثل: خطة استراتيجية لجمعية، لائحة مالية لجمعية خيرية، خطة تشغيلية سنوية." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analyzed.map((a) => (
                  <KeywordRow key={a.keyword} a={a} primary={cur.primary} canEdit={canEdit} busy={busy}
                    onPrimary={() => commit(cur.keywords, a.keyword)}
                    onDelete={() => commit(cur.keywords.filter((k) => k !== a.keyword), cur.primary === a.keyword ? '' : cur.primary)} />
                ))}
              </div>
            )}
          </Card>
          <div style={{ fontSize: 12.5, color: colors.gray, marginTop: 10, lineHeight: 1.8 }}>جوجل لا يعتمد على وسم keywords في ترتيب النتائج، لذلك لا نضيفه. قيمة هذه الصفحة أن تضع الكلمة حيث يقرؤها جوجل: في العنوان والوصف والعناوين والنص.</div>
        </>
      )}
    </GenericPage>
  );
}

/* ── 3) ملف robots.txt ───────────────────────────────────────────────── */
function robotsWarnings(text) {
  const out = [];
  if (/^\s*disallow\s*:\s*\/\s*$/im.test(text) && !/^\s*user-agent\s*:\s*(GPTBot|ClaudeBot|CCBot)/im.test(text)) out.push('BLOCK_ALL');
  if (/^\s*disallow\s*:\s*\/(assets|fonts)\b/im.test(text) || /disallow\s*:[^\n]*\.(css|js)\b/i.test(text)) out.push('BLOCK_ASSETS');
  if (text.trim() && !/^\s*user-agent\s*:/im.test(text)) out.push('NO_AGENT');
  return out;
}

export function SeoRobotsPage() {
  const { can } = usePermissions();
  const canEdit = can('admin.seo.robots');
  const [d, setD] = useState(null);
  const [text, setText] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, toast] = useToast();
  useEffect(() => { seoApi.robots().then((r) => setD(r.data)).catch(() => setD(false)); }, []);
  if (!can('admin.seo.view')) return <NoAccess title="ملف robots.txt" />;
  const value = text ?? d?.custom ?? '';
  const warns = robotsWarnings(value);
  const save = async (t) => {
    setBusy('save');
    try { const r = await seoApi.saveRobots(t); setD(r.data); setText(null); toast(t ? 'حُفظ الملف وصار يعمل' : 'استُعيدت القواعد الافتراضية'); } catch (e) { toast(errOf(e, 'تعذّر الحفظ'), false); } finally { setBusy(''); }
  };
  const ai = async (block) => {
    setBusy('ai');
    try { const r = await seoApi.aiBots(block); setD(r.data); toast('حُفظ وصار يعمل'); } catch (e) { toast(errOf(e, 'تعذّر الحفظ'), false); } finally { setBusy(''); }
  };
  return (
    <GenericPage title="ملف robots.txt" subtitle="ما يُسمح لمحركات البحث بزيارته. تركه فارغًا ليس نقصًا: القواعد الافتراضية آمنة ومناسبة للمنصة.">
      <Toast msg={msg} />
      {d === null ? <Loading /> : d === false ? <EmptyState title="تعذّر التحميل" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label={<><span>قواعد خاصة</span><a href="/robots.txt" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: colors.primary }}>فتح الملف الحي</a></>} hint="فارغ = القواعد الافتراضية. سطر خريطة الموقع وقرار زواحف الذكاء الاصطناعي يُضافان وحدهما ما لم تذكرهما.">
              <textarea value={value} onChange={(e) => setText(e.target.value)} rows={9} disabled={!canEdit} placeholder={d.default} maxLength={5000} style={{ ...inputSt, ...mono, fontSize: 13.5, lineHeight: 1.7 }} aria-label="قواعد robots.txt الخاصة" />
            </Field>
            {warns.includes('BLOCK_ALL') && <Note tone="red" data-robots-warning="BLOCK_ALL">انتبه: «Disallow: /» يمنع جوجل من الموقع كله، فيختفي من نتائج البحث.</Note>}
            {warns.includes('BLOCK_ASSETS') && <Note tone="amber">حجب ملفات CSS أو JS يمنع جوجل من فهم الصفحة كما يراها الزائر.</Note>}
            {warns.includes('NO_AGENT') && <Note tone="amber">لا يوجد سطر «User-agent»؛ القواعد بدونه لا تُطبَّق.</Note>}
            {canEdit && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Btn onClick={() => save(value)} disabled={busy === 'save'}>{busy === 'save' ? 'جارٍ الحفظ…' : 'حفظ'}</Btn>
                <Btn variant="outline" onClick={() => { setText(''); save(''); }} disabled={busy === 'save' || !d.custom}>استعادة الافتراضي</Btn>
              </div>
            )}
          </Card>
          <Card style={{ display: 'flex', gap: 14, alignItems: 'center' }} data-ai-bots>
            <Switch on={d.ai_block} onChange={ai} label="حجب زواحف الذكاء الاصطناعي" disabled={!canEdit || busy === 'ai'} />
            <div>
              <div style={{ fontWeight: 800 }}>حجب زواحف الذكاء الاصطناعي</div>
              <div style={{ fontSize: 13, color: colors.gray, lineHeight: 1.8 }}>مطفأ: يُسمح لها بقراءة الموقع، فقد يظهر في إجابات ChatGPT وClaude وPerplexity وGemini. مشغّل: تُمنع. لا يؤثر على ظهورك في Google وBing. <span dir="ltr" style={{ fontSize: 12 }}>{d.ai_bots.join(' · ')}</span></div>
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>الملف كما يقرؤه جوجل الآن</div>
            <pre data-robots-effective style={{ margin: 0, padding: 12, borderRadius: 10, background: colors.sunken, ...mono, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{d.effective}</pre>
          </Card>
        </div>
      )}
    </GenericPage>
  );
}

/* ── 4) خريطة الموقع ─────────────────────────────────────────────────── */
export function SeoSitemapPage() {
  const { can } = usePermissions();
  const [d, setD] = useState(null);
  const [msg, toast] = useToast();
  useEffect(() => { seoApi.sitemap().then((r) => setD(r.data)).catch(() => setD(false)); }, []);
  if (!can('admin.seo.view')) return <NoAccess title="خريطة الموقع" />;
  const url = d ? `${d.base}/sitemap.xml` : '';
  return (
    <GenericPage title="خريطة الموقع" subtitle="القائمة التي تسلّمها لجوجل ليعرف صفحاتك دفعة واحدة. تُبنى وحدها: ما يُخفى عن البحث يخرج منها، وتاريخ كل صفحة يتحدّث مع آخر تعديل.">
      <Toast msg={msg} />
      {d === null ? <Loading /> : d === false ? <EmptyState title="تعذّر التحميل" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge color="green" text={`روابط في الخريطة: ${d.entries.length}`} />
            <Badge color={d.hidden.length ? 'amber' : 'gray'} text={`صفحات مخفية عن البحث: ${d.hidden.length}`} />
            <Btn small variant="secondary" onClick={() => { navigator.clipboard?.writeText(url).then(() => toast('نُسخ الرابط')).catch(() => toast(url)); }}>نسخ الرابط</Btn>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>فتح الملف الحي</a>
          </div>
          <Note tone="blue">لتسليمها لجوجل: افتح Search Console ← Sitemaps، واكتب «sitemap.xml» ثم اضغط Submit. تكفي مرة واحدة، وجوجل يعيد قراءتها بنفسه. سجّل تاريخ الإرسال في «الظهور في محركات البحث».</Note>
          {d.hidden.length > 0 && <Note tone="amber">مخفية عن البحث: {d.hidden.map((h) => h.label).join(' · ')}</Note>}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 520 }}>
                <thead><tr>{['الصفحة', 'الرابط', 'آخر تعديل', 'الأولوية'].map((h) => <th key={h} style={{ textAlign: 'right', padding: '10px 14px', background: colors.sunken, fontWeight: 700 }}>{h}</th>)}</tr></thead>
                <tbody>{d.entries.map((e) => (
                  <tr key={e.loc} data-sitemap-row style={{ borderTop: `1px solid ${colors.grayLight}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{e.label}</td>
                    <td style={{ padding: '10px 14px' }}><a href={e.loc} target="_blank" rel="noopener noreferrer" dir="ltr" style={{ color: colors.primary }}>{e.loc.replace(d.base, '') || '/'}</a></td>
                    <td style={{ padding: '10px 14px', color: colors.gray }} dir="ltr">{e.lastmod}</td>
                    <td style={{ padding: '10px 14px', color: colors.gray }} dir="ltr">{e.priority}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
          <div style={{ fontSize: 12.5, color: colors.gray, lineHeight: 1.8 }}>لا تدخل الخريطة أبدًا: {d.excluded.map((x) => x.label).join('، ')} — فهي خاصة بأصحاب الحسابات.</div>
        </div>
      )}
    </GenericPage>
  );
}

/* ── 5) أدوات القياس والتتبّع ───────────────────────────────────────── */
const TRACK_FIELDS = [
  { key: 'seo_verify_google', label: 'رمز توثيق Google Search Console', ph: 'AbC123dEf456GhI789jKl012Mn', hint: 'من Search Console ← إضافة موقع ← وسم HTML. الصق الوسم كاملًا أو قيمته.' },
  { key: 'seo_verify_bing', label: 'رمز توثيق Bing', ph: '0123456789ABCDEF0123', hint: 'من Bing Webmaster Tools ← وسم HTML.' },
  { key: 'track_gtm', label: 'معرّف Google Tag Manager', ph: 'GTM-XXXXXXX', hint: 'يبدأ بـ GTM-. حاوية واحدة تشغّل بقية الأدوات من داخلها.' },
  { key: 'track_ga4', label: 'معرّف Google Analytics 4', ph: 'G-XXXXXXXXXX', hint: 'يبدأ بـ G-. إن كنت تشغّله من Tag Manager فاتركه فارغًا هنا حتى لا تُعدّ الزيارة مرتين.' },
  { key: 'track_meta_pixel', label: 'معرّف Meta Pixel', ph: '123456789012345', hint: 'أرقام فقط، من مدير الأحداث في ميتا.' },
  { key: 'track_clarity', label: 'معرّف Microsoft Clarity', ph: 'abcdefghij', hint: 'لخرائط الحرارة وتسجيل الجلسات في الصفحات العامة فقط.' },
  { key: 'track_tiktok', label: 'معرّف TikTok Pixel', ph: 'C4ABCDEFGHIJKLMNOPQR', hint: 'من TikTok Ads ← Events.' },
  { key: 'track_snap', label: 'معرّف Snap Pixel', ph: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', hint: 'من Snapchat Ads ← Events Manager.' },
];

export function SeoTrackingPage() {
  const { can } = usePermissions();
  const canEdit = can('admin.seo.tracking');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, toast] = useToast();
  useEffect(() => { seoApi.tracking().then((r) => setForm(r.data.values)).catch(() => setForm(false)); }, []);
  if (!can('admin.seo.view')) return <NoAccess title="أدوات القياس والتتبّع" />;
  const state = (k) => {
    const v = (form?.[k] || '').trim();
    if (!v) return ['مطفأ', 'gray'];
    return isValidTracking(k, v) ? [k.startsWith('seo_verify') ? 'مضبوط' : 'يعمل', 'green'] : ['صيغة خاطئة', 'red'];
  };
  const bad = form ? TRACK_FIELDS.filter((f) => (form[f.key] || '').trim() && !isValidTracking(f.key, form[f.key])).length : 0;
  const on = form ? TRACK_FIELDS.filter((f) => f.key.startsWith('track_') && isValidTracking(f.key, form[f.key])).length : 0;
  const save = async () => {
    setBusy(true);
    try { const r = await seoApi.saveTracking(form); setForm(r.data.values); toast('حُفظت المعرّفات وصارت تعمل'); window.dispatchEvent(new Event('df-site-content-changed')); } catch (e) { toast(errOf(e, 'تعذّر الحفظ'), false); } finally { setBusy(false); }
  };
  return (
    <GenericPage title="أدوات القياس والتتبّع" subtitle="رموز التوثيق ومعرّفات جوجل وميتا وتيك توك وسناب وكلاريتي. تُلصق كما هي من حساباتكم، والحقل الفارغ يعني أن الأداة مطفأة ولا يُحمَّل كودها أصلًا.">
      <Toast msg={msg} />
      {form === null ? <Loading /> : form === false ? <EmptyState title="تعذّر التحميل" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><Badge color={on ? 'green' : 'gray'} text={`${on} أدوات قياس مفعّلة`} /></div>
          <Note tone="blue">أدوات القياس لا تعمل إلا بعد موافقة الزائر: عند ضبط أي معرّف يظهر له شريط فيه «موافق على الكل» و«الضروري فقط»، لذلك ستكون الأرقام أقل من الزيارات الفعلية. ولا تعمل أبدًا داخل لوحات التحكم ولا صفحتي الدخول والتسجيل، ولا تصلها بيانات المنظمات أو خططها.</Note>
          <Card style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 18 }}>
            {TRACK_FIELDS.map((f) => {
              const [lbl, tone] = state(f.key);
              return (
                <Field key={f.key} label={<><span>{f.label}</span><Badge small color={tone} text={lbl} /></>} hint={f.hint}>
                  <input data-key={f.key} value={form[f.key] || ''} placeholder={f.ph} disabled={!canEdit} onChange={(e) => setForm((v) => ({ ...v, [f.key]: normalizeTracking(f.key, e.target.value) }))} style={{ ...inputSt, ...mono }} aria-label={f.label} />
                </Field>
              );
            })}
          </Card>
          {bad > 0 && <Note tone="red">{bad} معرّفات بصيغة خاطئة، ولن يُحفظ شيء حتى تُصحَّح.</Note>}
          {canEdit && <div><Btn onClick={save} disabled={busy || bad > 0}>{busy ? 'جارٍ الحفظ…' : 'حفظ'}</Btn></div>}
        </div>
      )}
    </GenericPage>
  );
}
