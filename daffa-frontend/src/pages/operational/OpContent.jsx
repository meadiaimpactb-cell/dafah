import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { InfoTip } from '../strategic/UnitContent';

/*
 * محتوى وحدات التخطيط التشغيلي المنظَّم (unit.content) — يُدار من لوحة التحكم.
 * المصدر المعتمد: «دفة — الحزم الموحّدة للمطور» عبر resources/operational/units.json.
 * كل قسم بطاقة واحدة بخلفية زرقاء فاتحة: {title, heading, blocks[]}.
 * الكتل: paragraph · heading · list · step (ترقيم تلقائي) · tip · fields · table · gantt
 * والنص يقبل **عريض** وأسطرًا متعددة.
 */

// ألوان هوية دفة (theme/tokens.js): أزرق الدفّة، الكحلي، والبرتقالي
const C = {
  primary: '#235D7F', ink: '#0E2A3D', primarySoft: '#D9E8F1', orange: '#EF6A2C',
  gray: '#5E6B78', text: '#334452', border: '#E8E3DA', blueBg: '#EAF4FD', blueBorder: '#A9D2F5',
  amberSoft: '#FEF3EC', amberBorder: '#FBC3A3', amberText: '#7F310E',
};
const FONT = 'inherit';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const arNum = n => String(n).replace(/\d/g, d => AR_DIGITS[d]);

/** نص مع **عريض** */
export function Rich({ text }) {
  if (text === null || text === undefined || text === '') return null;
  const parts = String(text).split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((p, i) => (p.length > 4 && p.startsWith('**') && p.endsWith('**')
    ? <strong key={i} style={{ color: C.ink, fontWeight: 800 }}>{p.slice(2, -2)}</strong>
    : <React.Fragment key={i}>{p}</React.Fragment>));
}

/** فقرات من نص متعدد الأسطر */
function Paras({ text, style }) {
  if (!text) return null;
  return String(text).split('\n').filter(l => l.trim() !== '').map((line, i) => (
    <p key={i} style={{ margin: '0 0 8px', lineHeight: 2, ...style }}><Rich text={line} /></p>
  ));
}

const LightbulbIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z" />
  </svg>
);

/** مخطط جانت للأمثلة: أشرطة مستطيلة في الأشهر المحددة */
export function ExampleGantt({ months = [], rows = [] }) {
  if (!months.length) return null;
  return (
    <div style={{ overflowX: 'auto', margin: '4px 0 12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: Math.max(360, 140 + months.length * 72), fontSize: 12.5 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'right', padding: '6px 8px', color: C.ink, fontWeight: 800, borderBottom: `1.5px solid ${C.border}` }}>النشاط</th>
            {months.map((m, i) => (
              <th key={i} style={{ textAlign: 'center', padding: '6px 4px', color: C.ink, fontWeight: 700, borderBottom: `1.5px solid ${C.border}`, whiteSpace: 'nowrap' }}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '9px 8px', color: C.text, minWidth: 130 }}>{r.label}</td>
              {months.map((_, j) => (
                <td key={j} style={{ padding: '9px 3px' }}>
                  {r.marks?.[j] ? <div aria-label={`${r.label}: ${months[j]}`} style={{ height: 22, background: C.primary, borderRadius: 3 }} /> : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** عرض الكتل؛ تُرقَّم الخطوات تلقائيًا داخل البطاقة */
export function OpBlocks({ blocks }) {
  let step = 0;
  return (
    <>
      {(blocks || []).map((b, i) => {
        switch (b.type) {
          case 'heading':
            return <div key={i} style={{ fontSize: 14, fontWeight: 800, color: C.ink, margin: i ? '14px 0 6px' : '0 0 6px' }}><Rich text={b.text} /></div>;
          case 'list': {
            const L = b.ordered === false ? 'ul' : 'ol';
            return (
              <L key={i} style={{ margin: '0 0 10px', paddingRight: 22, lineHeight: 2, listStyleType: b.ordered === false ? 'disc' : 'arabic-indic' }}>
                {(b.items || []).map((it, j) => <li key={j} style={{ marginBottom: 4, whiteSpace: 'pre-line' }}><Rich text={it} /></li>)}
              </L>
            );
          }
          case 'step': {
            step += 1;
            return (
              <div key={i} style={{ margin: '0 0 14px' }}>
                {b.title
                  ? <div style={{ fontWeight: 800, color: C.ink, marginBottom: 4 }}>{arNum(step)}. <Rich text={b.title} /></div>
                  : null}
                {b.title
                  ? <Paras text={b.text} />
                  : <p style={{ margin: '0 0 8px', lineHeight: 2, whiteSpace: 'pre-line' }}>{arNum(step)}. <Rich text={b.text} /></p>}
                {(b.items || []).length > 0 && (
                  <ul style={{ margin: '0 0 6px', paddingRight: 22, lineHeight: 2 }}>
                    {b.items.map((it, j) => <li key={j} style={{ whiteSpace: 'pre-line' }}><Rich text={it} /></li>)}
                  </ul>
                )}
              </div>
            );
          }
          case 'tip':
            return (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.amberSoft, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: '12px 14px', margin: '6px 0 4px' }}>
                <span style={{ color: C.orange, flexShrink: 0, marginTop: 4 }}><LightbulbIcon /></span>
                <div style={{ lineHeight: 1.95, whiteSpace: 'pre-line' }}>
                  {b.label && <div style={{ fontWeight: 800, color: C.amberText, marginBottom: 2 }}>{b.label}</div>}
                  <Rich text={b.text} />
                </div>
              </div>
            );
          case 'fields':
            return (
              <div key={i} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRight: `3px solid ${C.primary}`, borderRadius: 8, padding: '10px 14px', margin: '0 0 10px', lineHeight: 1.95 }}>
                {(b.items || []).map((f, j) => (
                  <div key={j} style={{ whiteSpace: 'pre-line' }}>
                    {f.label && <strong style={{ color: C.ink }}>{f.label}</strong>}
                    {f.label && f.value ? ' — ' : ''}
                    <Rich text={f.value} />
                  </div>
                ))}
              </div>
            );
          case 'table':
            return (
              <div key={i} style={{ overflowX: 'auto', margin: '2px 0 12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  {(b.headers || []).some(h => h) && (
                    <thead><tr>{b.headers.map((h, j) => (
                      <th key={j} style={{ padding: '8px 10px', background: C.primarySoft, color: C.ink, textAlign: 'right', fontWeight: 800, border: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}</tr></thead>
                  )}
                  <tbody>{(b.rows || []).map((r, j) => (
                    <tr key={j} style={{ background: j % 2 ? '#FBF9F5' : '#fff' }}>{r.map((c, k) => (
                      <td key={k} style={{ padding: '8px 10px', border: `1px solid ${C.border}`, verticalAlign: 'top', whiteSpace: 'pre-line' }}><Rich text={c} /></td>
                    ))}</tr>
                  ))}</tbody>
                </table>
              </div>
            );
          case 'gantt':
            return <ExampleGantt key={i} months={b.months} rows={b.rows} />;
          default:
            return <Paras key={i} text={b.text} />;
        }
      })}
    </>
  );
}

/** بطاقة واحدة بخلفية زرقاء فاتحة (النبذة، الشرح، الإرشادات، تعليمات النموذج) */
export function OpCard({ title, heading, actions, children }) {
  return (
    <div style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRight: `4px solid ${C.primary}`, borderRadius: 12, padding: '18px 22px', color: C.text, fontSize: 14, direction: 'rtl', textAlign: 'right' }}>
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {title ? <h3 style={{ fontSize: 17, fontWeight: 800, color: C.ink, margin: 0, lineHeight: 1.6 }}>{title}</h3> : <span />}
          {actions}
        </div>
      )}
      {heading && <div style={{ fontSize: 14.5, fontWeight: 700, color: C.primary, marginTop: 4 }}>{heading}</div>}
      <div style={{ marginTop: title || heading ? 10 : 0 }}>{children}</div>
    </div>
  );
}

/** قسم من محتوى الوحدة: overview | explanation | guidelines */
export function OpSection({ unit, section }) {
  const c = unit?.content?.[section];
  if (!c) return null;
  return <OpCard title={c.title} heading={c.heading}><OpBlocks blocks={c.blocks} /></OpCard>;
}

export const hasOpSection = (unit, section) => {
  const c = unit?.content?.[section];
  return !!c && !!(c.title || c.heading || c.blocks?.length);
};

/** نافذة المثال التوضيحي المنبثقة مع زر «إغلاق» */
export function ExampleModal({ example, onClose }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [titleId] = useState(() => `op-ex-${Math.random().toString(36).slice(2, 8)}`);

  // مرة واحدة عند الفتح: تثبيت الصفحة، التركيز على «إغلاق»، Esc للإغلاق، وإعادة التركيز للزر عند الإغلاق
  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = e => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    };
  }, []);

  if (!example) return null;
  return ReactDOM.createPortal(
    <div onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}
        style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 820, maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', direction: 'rtl', fontFamily: FONT, color: C.text }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}`, background: C.blueBg, borderRadius: '14px 14px 0 0' }}>
          <h3 id={titleId} style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: C.ink, lineHeight: 1.6 }}>{example.title || 'مثال توضيحي'}</h3>
        </div>
        <div style={{ padding: '16px 22px', overflowY: 'auto', fontSize: 14 }}>
          <OpBlocks blocks={example.blocks} />
        </div>
        <div style={{ padding: '12px 22px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-start' }}>
          <button ref={closeRef} type="button" onClick={onClose}
            style={{ padding: '9px 28px', background: C.primary, color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            إغلاق
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** تعليمات نموذج العمل أعلى النموذج + زر «عرض مثال توضيحي» أسفلها */
export function OpFormIntro({ unit, actions }) {
  const [open, setOpen] = useState(false);
  const f = unit?.content?.form;
  if (!f || !(f.title || f.heading || f.blocks?.length || f.example)) return null;
  return (
    <>
      <OpCard title={f.title} heading={f.heading} actions={actions}>
        <OpBlocks blocks={f.blocks} />
        {f.example && (
          <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
            style={{ marginTop: 4, padding: '8px 18px', background: '#fff', color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            {f.example_button || 'عرض مثال توضيحي'}
          </button>
        )}
      </OpCard>
      {open && <ExampleModal example={f.example} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ─────────── توضيحات الحقول ⓘ (تُفتح بالضغط فقط) ─────────── */

const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

export const opTip = (unit, label) => {
  const t = (unit?.content?.form?.tooltips || []).find(x => norm(x.label) === norm(label));
  return t && t.text ? t : null;
};

/** عنوان حقل/عمود مع ⓘ إن عُرّف له توضيح في لوحة التحكم (tipKey: عنوان المطابقة إن اختلف عن المعروض) */
export function OpLabel({ unit, label, tipKey, style }) {
  const tip = opTip(unit, tipKey || label);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, ...style }}>
      {label}
      {tip && <InfoTip text={tip.text} label={tipKey || label} hover={false} />}
    </span>
  );
}
