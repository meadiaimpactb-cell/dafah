import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { OrgChartView } from './OrgChart';

/*
 * محتوى الوحدات الاستراتيجية المنظَّم (unit.content) — النبذة، الشرح، الإرشادات، تعليمات النماذج.
 * المصدر: وثائق «تحسينات موقع دفة — 11 وحدة» عبر resources/strategic/units.json.
 */

const C = {
  teal: '#1A6B7C', tealDark: '#14505E', tealLight: '#E8F4F6', orange: '#E8620A',
  gray: '#6b7280', grayText: '#374151', border: '#e5e7eb', blueBg: '#f0f9ff', blueBorder: '#bae6fd',
};
const FONT = "'Cairo', sans-serif";

// ملفات PDF الخاصة بكل وحدة في public/guides/strategic — بالأسماء المحددة في المواصفات
// («الشرح التفصيلي — اسم الوحدة.pdf» و«الإرشادات التفصيلية — اسم الوحدة.pdf») ليظهر الاسم نفسه عند التنزيل
const PDF_UNIT_NAMES = {
  swot: 'تحليل البيئة الداخلية',
  pestel: 'تحليل البيئة الخارجية',
  needs: 'دراسة الاحتياجات المجتمعية',
  toc: 'بناء نظرية التغيير',
  tows: 'التحليل الاستراتيجي',
  directions: 'التوجهات الاستراتيجية',
  initiatives: 'المبادرات الاستراتيجية',
  bmc: 'نموذج عمل المنظمة',
  kpis: 'مؤشرات الأداء',
  orgchart: 'الهيكل التنظيمي',
  document: 'الوثيقة الاستراتيجية',
};
export const pdfUrl = (templateType, kind) => {
  const name = PDF_UNIT_NAMES[templateType];
  if (!name) return `/guides/strategic/${templateType}-${kind}.pdf`;
  const prefix = kind === 'guidelines' ? 'الإرشادات التفصيلية' : 'الشرح التفصيلي';
  return `/guides/strategic/${encodeURIComponent(`${prefix} — ${name}.pdf`)}`;
};

// اسم «نوع النموذج» بالعربية عند غياب قيمة محددة في المواصفات
const TEMPLATE_LABELS = {
  swot: 'ملخص التحليل الداخلي',
  pestel: 'تحليل PESTEL وخريطة أصحاب المصلحة',
  needs: 'جدول الاحتياجات وتحليل الفجوات',
  toc: 'سلسلة نظرية التغيير',
  tows: 'مصفوفة TOWS',
  directions: 'الرؤية والرسالة والقيم والأهداف',
  initiatives: 'بطاقة المبادرة',
  bmc: 'نموذج عمل المنظمة',
  kpis: 'جدول مؤشرات الأداء',
  orgchart: 'جدول الوظائف والخريطة التنظيمية',
  document: 'الوثيقة الاستراتيجية',
};
export const templateLabel = (unit) =>
  unit?.content?.template_label || TEMPLATE_LABELS[unit?.template_type] || unit?.template_type || '—';

/* ─────────── أيقونة المعلومات ⓘ ─────────── */
const InfoIcon = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" />
    <line x1="12" y1="11" x2="12" y2="16.5" />
    <circle cx="12" cy="7.6" r="0.6" fill="currentColor" />
  </svg>
);

/**
 * ⓘ يفتح نافذة صغيرة قرب الحقل عند النقر أو اللمس أو لوحة المفاتيح، وتُغلق بزر واضح أو Esc.
 * تُرسم عبر Portal حتى لا تقصّها حاويات الجداول القابلة للتمرير.
 */
export function InfoTip({ text, example, title, label }) {
  const [open, setOpen]     = useState(false);
  const [pinned, setPinned] = useState(false); // فُتح بالنقر/اللمس/لوحة المفاتيح: يبقى حتى الإغلاق
  const [pos, setPos]   = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const hideTimer = useRef(null);

  // المرور بالمؤشر يعرض التوضيح أيضًا (دون أن يكون الطريقة الوحيدة)
  const hoverIn  = () => { clearTimeout(hideTimer.current); if (!open) setOpen(true); };
  const hoverOut = () => { if (!pinned) hideTimer.current = setTimeout(() => setOpen(false), 180); };
  const close    = () => { setOpen(false); setPinned(false); };
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(example ? 340 : 280, window.innerWidth - 24);
    const right = Math.min(Math.max(window.innerWidth - r.right - 8, 12), window.innerWidth - width - 12);
    setPos({ top: r.bottom + 8, right, width });
  };

  useLayoutEffect(() => { if (open) place(); }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape') { close(); btnRef.current?.focus(); } };
    const onDown = e => {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      close();
    };
    const onScroll = () => place();
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  if (!text && !example) return null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={e => {
          e.preventDefault(); e.stopPropagation();
          clearTimeout(hideTimer.current);
          if (open && pinned) close(); else { setOpen(true); setPinned(true); }
        }}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
        aria-label={example ? 'عرض مثال إرشادي' : `توضيح: ${label || ''}`}
        aria-expanded={open}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle', background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer', color: 'inherit', opacity: 0.85, lineHeight: 1 }}
      >
        <InfoIcon />
      </button>
      {open && pos && ReactDOM.createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label={title || label || 'توضيح'}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
          style={{ position: 'fixed', top: pos.top, right: pos.right, width: pos.width, zIndex: 100000, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.18)', padding: '12px 14px', direction: 'rtl', fontFamily: FONT, color: C.grayText, textAlign: 'right' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.tealDark }}>{title || example?.title || label}</div>
            <button type="button" onClick={() => { close(); btnRef.current?.focus(); }} aria-label="إغلاق"
              style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', fontSize: 13, lineHeight: '22px', flexShrink: 0, color: C.gray }}>✕</button>
          </div>
          {text && <div style={{ fontSize: 12.5, lineHeight: 1.8, marginTop: 6 }}>{text}</div>}
          {example && <div style={{ marginTop: 8 }}><ExampleBody example={example} compact /></div>}
        </div>,
        document.body
      )}
    </>
  );
}

/** عنوان حقل مع ⓘ اختياري */
export const LabelWithTip = ({ label, tip, style }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, ...style }}>
    {label}
    {tip && <InfoTip text={tip.text} example={tip.example} label={label} />}
  </span>
);

/* ─────────── عرض المثال ─────────── */
const MiniCard = ({ label, value, accent }) => (
  <div style={{ background: '#fff', border: `1px solid ${accent ? '#f5c38b' : C.border}`, borderTop: `3px solid ${accent ? C.orange : C.teal}`, borderRadius: 8, padding: '8px 10px', minWidth: 0 }}>
    <div style={{ fontSize: 12, fontWeight: 800, color: accent ? C.orange : C.tealDark, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 12, lineHeight: 1.75, whiteSpace: 'pre-line' }}>{value}</div>
  </div>
);
const Arrow = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.orange, fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{children}</div>
);

// تخطيطات خاصة: سلسلة (نظرية التغيير)، تركيب عاملين ← خيار (TOWS)، لوحة 5/2/2 (نموذج العمل)
function FieldsLayout({ b }) {
  const items = b.items || [];
  if (b.layout === 'chain') return (
    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 8, alignItems: 'stretch' }}>
      {items.map((f, j) => (
        <React.Fragment key={j}>
          <div style={{ flex: '1 0 120px' }}><MiniCard label={f.label} value={f.value} /></div>
          {j < items.length - 1 && <Arrow>←</Arrow>}
        </React.Fragment>
      ))}
    </div>
  );
  if (b.layout === 'combo') {
    const last = items[items.length - 1];
    const factors = items.slice(0, -1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
          {factors.map((f, j) => (
            <React.Fragment key={j}>
              <div style={{ flex: 1 }}><MiniCard label={f.label} value={f.value} /></div>
              {j < factors.length - 1 && <Arrow>＋</Arrow>}
            </React.Fragment>
          ))}
        </div>
        <Arrow>↓</Arrow>
        {last && <MiniCard label={last.label} value={last.value} accent />}
      </div>
    );
  }
  if (b.layout === 'canvas') {
    const rows = [items.slice(0, 5), items.slice(5, 7), items.slice(7, 9)];
    return (
      <div style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
        {rows.map((r, j) => r.length > 0 && (
          <div key={j} style={{ display: 'grid', gridTemplateColumns: `repeat(${r.length}, minmax(0, 1fr))`, gap: 6 }}>
            {r.map((f, k) => <MiniCard key={k} label={f.label} value={f.value} accent={j === 2} />)}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
      {items.map((f, j) => (
        <div key={j}>
          <span style={{ fontWeight: 700, color: C.tealDark }}>{f.label}</span>
          {f.label && f.value ? ': ' : ''}
          <span style={{ whiteSpace: 'pre-line' }}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

function ExampleBody({ example, compact }) {
  const fs = compact ? 12 : 13;
  return (
    <div style={{ fontSize: fs, lineHeight: 1.85, color: C.grayText }}>
      {(example.blocks || []).map((b, i) => {
        if (b.type === 'orgchart') return (
          <div key={i} style={{ marginBottom: 8 }}>
            <OrgChartView positions={(b.rows || []).map(r => ({ title: r[0], dept: r[1], reports_to: r[2] }))} />
          </div>
        );
        if (b.type === 'fields' && b.layout) return <FieldsLayout key={i} b={b} />;
        if (b.type === 'paragraph') return <p key={i} style={{ margin: '0 0 8px', whiteSpace: 'pre-line' }}>{b.text}</p>;
        if (b.type === 'list') return (
          <ul key={i} style={{ margin: '0 0 8px', paddingRight: 18 }}>
            {(b.items || []).map((it, j) => <li key={j} style={{ marginBottom: 3 }}>{it}</li>)}
          </ul>
        );
        if (b.type === 'fields') return (
          <div key={i} style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
            {(b.items || []).map((f, j) => (
              <div key={j}>
                <span style={{ fontWeight: 700, color: C.tealDark }}>{f.label}</span>
                {f.label && f.value ? ': ' : ''}
                <span style={{ whiteSpace: 'pre-line' }}>{f.value}</span>
              </div>
            ))}
          </div>
        );
        if (b.type === 'table') return (
          <div key={i} style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs - 0.5 }}>
              {b.headers?.length > 0 && (
                <thead><tr>{b.headers.map((h, j) => (
                  <th key={j} style={{ padding: '7px 9px', background: C.tealLight, color: C.tealDark, textAlign: 'right', fontWeight: 700, border: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}</tr></thead>
              )}
              <tbody>{(b.rows || []).map((r, j) => (
                <tr key={j}>{r.map((c, k) => (
                  <td key={k} style={{ padding: '7px 9px', border: `1px solid ${C.border}`, verticalAlign: 'top', fontWeight: k === 0 ? 600 : 400 }}>{c}</td>
                ))}</tr>
              ))}</tbody>
            </table>
          </div>
        );
        return null;
      })}
      {example.note && <div style={{ fontSize: fs - 1, color: C.gray, fontStyle: 'italic', marginTop: 4 }}>{example.note}</div>}
    </div>
  );
}

/** زر يفتح المثال ويغلقه داخل الصفحة؛ لا يظهر مبدئيًا ولا يملأ خانات المستخدم */
export function ExampleToggle({ label, example, small }) {
  const [open, setOpen] = useState(false);
  if (!example) return null;
  return (
    <div style={{ marginTop: small ? 8 : 0 }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        style={{ padding: small ? '6px 14px' : '9px 18px', background: '#fff', color: C.teal, border: `1.5px solid ${C.teal}`, borderRadius: 9, fontSize: small ? 12 : 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
        {open ? 'إخفاء المثال' : (label || 'عرض مثال')}
      </button>
      {open && (
        <div style={{ marginTop: 10, background: '#fffdf7', border: '1.5px dashed #f5c38b', borderRadius: 10, padding: '14px 16px', position: 'relative' }}>
          <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق المثال"
            style={{ position: 'absolute', top: 8, left: 8, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6, width: 24, height: 24, cursor: 'pointer', color: C.gray }}>✕</button>
          {example.title && <div style={{ fontSize: 13.5, fontWeight: 700, color: C.orange, marginBottom: 8 }}>{example.title}</div>}
          <ExampleBody example={example} />
        </div>
      )}
    </div>
  );
}

/** زر PDF: يفتح الملف في تبويب جديد مع إمكانية تنزيله */
export const PdfButton = ({ href, label, caption }) => (
  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: C.orange, color: '#fff', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: FONT }}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 14h6M9 17h4" />
      </svg>
      {label}
    </a>
    {caption && <span style={{ fontSize: 11, color: C.gray, paddingRight: 4 }}>{caption}</span>}
  </div>
);

/* ─────────── تعليمات النموذج ─────────── */

/** أدوات الوصول إلى تعليمات النموذج: الإطارات حسب الموضع، والتوضيحات حسب العنوان، وإعادة التسمية */
export function formGuide(unit) {
  const f = unit?.content?.form || {};
  const blocks   = f.blocks || [];
  const tooltips = f.tooltips || [];
  const renames  = f.renames || [];
  const norm = s => (s || '').replace(/\s+/g, ' ').trim();
  return {
    blocks: anchor => blocks.filter(b => b.anchor === anchor),
    tip: (anchor, label) => tooltips.find(t => norm(t.label) === norm(label) && (!anchor || t.anchor === anchor))
      || tooltips.find(t => norm(t.label) === norm(label)) || null,
    rename: label => renames.find(r => norm(r.from) === norm(label))?.to || label,
  };
}

const sameTitle = (a, b) => {
  const n = s => (s || '').replace(/\s+/g, ' ').replace(/\(.*?\)/g, '').trim();
  return !!a && !!b && (n(a) === n(b) || n(b).includes(n(a)));
};

/** محتوى قسم تعليمات واحد (يُجمع أكثر من قسم للموضع نفسه في إطار واحد) */
function GuidePart({ block, hideTitle, hideExamples }) {
  const items = block.items || [];
  const List = block.ordered === false ? 'ul' : 'ol';
  return (
    <div style={{ marginBottom: 6 }}>
      {block.title && !hideTitle && <div style={{ fontSize: 13.5, fontWeight: 800, color: C.tealDark, marginBottom: 4 }}>{block.title}</div>}
      {block.heading && <div style={{ fontSize: 12.5, fontWeight: 700, color: C.teal, marginBottom: 4 }}>{block.heading}</div>}
      {items.length > 0 && (
        <List style={{ margin: 0, paddingRight: 20, fontSize: 12.5, lineHeight: 1.9, color: C.grayText, whiteSpace: 'pre-line' }}>
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </List>
      )}
      {block.note && <div style={{ fontSize: 12, color: C.gray, marginTop: 6 }}>{block.note}</div>}
      {!hideExamples && <BlockExamples block={block} />}
    </div>
  );
}

/** أزرار أمثلة قسم التعليمات (تفتح المثال وتغلقه داخل الصفحة) */
function BlockExamples({ block }) {
  if (!block.example && !block.example_2) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {block.example && <ExampleToggle label={block.example_button} example={block.example} small />}
      {block.example_2 && <ExampleToggle label={block.example_button_2} example={block.example_2} small />}
    </div>
  );
}

/** إطار التعليمات أعلى الجدول/القسم؛ يُخفى العنوان إذا كرّر عنوان القسم الظاهر فوقه */
export function GuideFrame({ blocks, sectionTitle, hideExamples }) {
  if (!blocks?.length) return null;
  return (
    <div style={{ background: C.blueBg, border: `1.5px solid ${C.blueBorder}`, borderRadius: 10, padding: '12px 16px 8px', margin: '10px 0 12px', direction: 'rtl' }}>
      {blocks.map((b, i) => <GuidePart key={i} block={b} hideTitle={sameTitle(b.title, sectionTitle)} hideExamples={hideExamples} />)}
    </div>
  );
}

/**
 * تعليمات موضع معيّن في إطار واحد.
 * examplesBelow: تُعرض أزرار الأمثلة لاحقًا عبر <GuideExamples> (أسفل الجدول) بدل داخل الإطار.
 */
export const GuideBlocks = ({ guide, anchor, sectionTitle, examplesBelow }) => (
  <GuideFrame blocks={guide.blocks(anchor)} sectionTitle={sectionTitle} hideExamples={examplesBelow} />
);

/** أزرار أمثلة موضع معيّن أسفل الجدول (حين تضعها المواصفات بعد الجدول) */
export const GuideExamples = ({ guide, anchor }) => {
  const blocks = guide.blocks(anchor).filter(b => b.example || b.example_2);
  if (!blocks.length) return null;
  return <div style={{ margin: '4px 0 8px' }}>{blocks.map((b, i) => <BlockExamples key={i} block={b} />)}</div>;
};

/* ─────────── التبويبات ─────────── */

const InfoBox = ({ label, value }) => (
  <div style={{ background: '#f8fafb', borderRadius: 8, padding: '12px 16px' }}>
    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: C.grayText }}>{value}</div>
  </div>
);

/** النبذة: بطاقة واحدة على خلفية زرقاء، وبطاقة «نوع النموذج» فقط (حُذفت «مدة الفيديو») */
export function OverviewContent({ unit }) {
  const o = unit.content?.overview || {};
  return (
    <div>
      <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRight: `4px solid ${C.teal}`, borderRadius: 12, padding: '18px 22px', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.tealDark, marginBottom: 10 }}>{o.title || unit.name}</div>
        {(o.paragraphs || []).map((p, i) => (
          <p key={i} style={{ fontSize: 14, color: C.grayText, lineHeight: 2, margin: i ? '10px 0 0' : 0 }}>{p}</p>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', maxWidth: 360 }}>
        <InfoBox label="نوع النموذج" value={templateLabel(unit)} />
      </div>
    </div>
  );
}

const Card = ({ card }) => (
  <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderTop: `3px solid ${C.teal}`, borderRadius: 10, padding: '14px 16px' }}>
    <div style={{ fontSize: 14, fontWeight: 800, color: C.tealDark, marginBottom: 6 }}>{card.title}</div>
    {(card.paragraphs || []).map((p, i) => (
      <p key={i} style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.9, margin: '0 0 6px' }}>{p}</p>
    ))}
    {(card.bullets || []).length > 0 && (
      <ul style={{ margin: 0, paddingRight: 18, fontSize: 13, color: '#4b5563', lineHeight: 1.9 }}>
        {card.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    )}
  </div>
);

const PageTitle = ({ title, subtitle }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 17, fontWeight: 800, color: C.tealDark }}>{title}</div>
    {subtitle && <div style={{ fontSize: 13, color: C.gray, marginTop: 4, lineHeight: 1.8 }}>{subtitle}</div>}
  </div>
);

/** الشرح: بطاقات مختصرة + «للتعمّق» مع المثال وزر الشرح التفصيلي */
export function ExplanationContent({ unit }) {
  const e = unit.content?.explanation || {};
  return (
    <div>
      <PageTitle title={e.title || 'الشرح'} subtitle={e.subtitle} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(260px, calc(50% - 12px)), 1fr))', gap: 12 }}>
        {(e.cards || []).map((c, i) => <Card key={i} card={c} />)}
      </div>
      <div style={{ marginTop: 16, background: '#f8fafb', border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
        {e.deep_dive && (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.tealDark, marginBottom: 4 }}>{e.deep_dive.title}</div>
            <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.9, margin: '0 0 12px' }}>{e.deep_dive.text}</p>
          </>
        )}
        {/* الترتيب وفق المواصفات: زر المثال أولًا، ثم زر الشرح التفصيلي */}
        {(e.example || e.example_2) && (
          <div style={{ marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {e.example && <ExampleToggle label={e.example_button} example={e.example} />}
            {e.example_2 && <ExampleToggle label={e.example_button_2} example={e.example_2} />}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <PdfButton href={pdfUrl(unit.template_type, 'explanation')} label={e.pdf_button || 'قراءة الشرح التفصيلي'} caption={e.pdf_caption} />
        </div>
      </div>
    </div>
  );
}

/** الإرشادات: قبل أن تبدأ، خطوات مرقّمة، تحقق ختامي، وزر الإرشادات التفصيلية */
export function GuidelinesContent({ unit }) {
  const g = unit.content?.guidelines || {};
  return (
    <div>
      <PageTitle title={g.title || 'الإرشادات'} subtitle={g.subtitle} />
      {g.before && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>{g.before.title}</div>
          <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.85 }}>{g.before.text}</div>
        </div>
      )}
      {(g.steps || []).map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#f8fafb', borderRadius: 10, alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.tealDark, marginBottom: 3 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.85, whiteSpace: 'pre-line' }}>{s.text}</div>
          </div>
        </div>
      ))}
      {g.after && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#166534', marginBottom: 4 }}>✓ {g.after.title}</div>
          <div style={{ fontSize: 13, color: '#14532d', lineHeight: 1.85 }}>{g.after.text}</div>
        </div>
      )}
      {g.example && <div style={{ marginBottom: 12 }}><ExampleToggle label={g.example_button} example={g.example} /></div>}
      <PdfButton href={pdfUrl(unit.template_type, 'guidelines')} label={g.pdf_button || 'قراءة الإرشادات التفصيلية'} caption={g.pdf_caption} />
    </div>
  );
}
