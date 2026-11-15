// شروحات الواجهة:
//  • <Help>      زر «؟» صغير يفتح شرحًا مبسّطًا لمصطلح أو قسم (نافذة صغيرة، وعلى الجوال لوحة سفلية).
//  • <TipLayer>  يُركَّب مرة واحدة: يحوّل كل title / data-tip إلى تلميح موحّد الشكل،
//                ويدير «وضع الشرح» الذي يضع علامة ؟ على كل أيقونة ويشرحها عند الضغط.
import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GLOSSARY } from '../../theme/glossary';

const isPhone = () => window.matchMedia('(max-width: 640px)').matches;

export function openGlossary(term) {
  window.dispatchEvent(new CustomEvent('df:glossary', { detail: { term } }));
}

export function setHelpMode(on) {
  window.dispatchEvent(new CustomEvent('df:helpmode', { detail: { on } }));
}

/**
 * زر الشرح «؟».
 *   <Help term="swot" />                       ← من قاموس المصطلحات
 *   <Help title="العنوان" text="الشرح" example="مثال" />
 */
export function Help({ term, title, text, example, onDark, large, label, style }) {
  const entry = term ? GLOSSARY[term] : null;
  const t = title || entry?.term;
  const body = text || entry?.simple;
  const ex = example || entry?.example;
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const place = useCallback(() => {
    const b = btnRef.current;
    const p = popRef.current;
    if (!b || !p || isPhone()) { setPos(null); return; }
    const r = b.getBoundingClientRect();
    const w = p.offsetWidth;
    const h = p.offsetHeight;
    const pad = 12;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
    let top = r.bottom + 10;
    if (top + h > window.innerHeight - pad) top = Math.max(pad, r.top - h - 10);
    setPos({ left, top });
  }, []);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = (e) => { if (!popRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, place]);

  if (!body) return null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`df-help${onDark ? ' df-help--on-dark' : ''}${large ? ' df-help--lg' : ''}`}
        aria-label={`شرح: ${t || 'مساعدة'}`}
        aria-expanded={open}
        style={style}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
      >
        {label || '؟'}
      </button>
      {open && createPortal(
        <>
          <div className="df-pop-scrim" onClick={() => setOpen(false)} />
          <div
            ref={popRef}
            className="df-pop"
            role="dialog"
            aria-label={t}
            style={pos ? { left: pos.left, top: pos.top } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="df-pop__close" aria-label="إغلاق" onClick={() => setOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            {t && <div className="df-pop__title" style={{ paddingInlineEnd: 34 }}>{t}</div>}
            <div className="df-pop__text">{body}</div>
            {ex && <div className="df-pop__ex"><b>مثال: </b>{ex}</div>}
            {entry && (
              <button type="button" className="df-pop__more" onClick={() => { setOpen(false); openGlossary(term); }}>
                كل المصطلحات في قاموس دفة ←
              </button>
            )}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

/** عنوان مع زر شرح بجانبه */
export function Term({ term, children }) {
  const entry = GLOSSARY[term];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {children || entry?.term}
      <Help term={term} />
    </span>
  );
}

/**
 * طبقة التلميحات — تُركَّب مرة واحدة في جذر التطبيق.
 */
export function TipLayer() {
  const [tip, setTip] = useState(null); // { text, title, x, y, side, arrow }
  const [helpMode, setMode] = useState(false);
  const timer = useRef(null);
  const current = useRef(null);
  const modeRef = useRef(false);

  const upgrade = (el) => {
    if (!el || el.nodeType !== 1) return null;
    const host = el.closest('[data-tip], [title]');
    if (!host) return null;
    if (!host.hasAttribute('data-tip')) {
      const t = host.getAttribute('title');
      if (!t || !t.trim()) return null;
      host.setAttribute('data-tip', t);
      if (!host.getAttribute('aria-label') && !host.textContent.trim()) host.setAttribute('aria-label', t);
      host.removeAttribute('title');
    }
    return host;
  };

  const show = useCallback((host) => {
    const raw = host.getAttribute('data-tip');
    if (!raw) return;
    const title = host.getAttribute('data-tip-title');
    const r = host.getBoundingClientRect();
    const maxW = 280;
    const pad = 10;
    const cx = r.left + r.width / 2;
    let left = Math.max(pad, Math.min(cx - maxW / 2, window.innerWidth - maxW - pad));
    const above = r.top > 90;
    const style = above
      ? { left, bottom: window.innerHeight - r.top + 10 }
      : { left, top: r.bottom + 10 };
    setTip({ text: raw, title, style, side: above ? 'top' : 'bottom', arrow: Math.max(14, Math.min(cx - left, maxW - 14)) });
    current.current = host;
  }, []);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    current.current = null;
    setTip(null);
  }, []);

  useEffect(() => {
    const over = (e) => {
      if (modeRef.current) return;
      if (window.matchMedia('(hover: none)').matches) return;
      const host = upgrade(e.target);
      if (!host || host === current.current) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => show(host), 320);
    };
    const out = (e) => {
      if (modeRef.current) return;
      const host = e.target.closest?.('[data-tip]');
      if (host && (!e.relatedTarget || !host.contains(e.relatedTarget))) hide();
    };
    const focusIn = (e) => {
      if (modeRef.current) return;
      if (!e.target.matches?.(':focus-visible')) return;
      const host = upgrade(e.target);
      if (host) show(host);
    };
    const down = () => { if (!modeRef.current) hide(); };
    const click = (e) => {
      if (!modeRef.current) return;
      if (e.target.closest('.df-helpbar') || e.target.closest('[data-help-toggle]')) return;
      const host = upgrade(e.target);
      if (!host) { hide(); return; }
      e.preventDefault();
      e.stopPropagation();
      show(host);
    };
    const key = (e) => { if (e.key === 'Escape') { hide(); if (modeRef.current) setHelpMode(false); } };
    const mode = (e) => {
      const on = e.detail?.on ?? !modeRef.current;
      modeRef.current = on;
      setMode(on);
      hide();
      document.body.classList.toggle('df-helpmode', on);
      if (on) document.querySelectorAll('[title]').forEach((el) => upgrade(el));
    };
    document.addEventListener('mouseover', over);
    document.addEventListener('mouseout', out);
    document.addEventListener('focusin', focusIn);
    document.addEventListener('focusout', hide);
    document.addEventListener('mousedown', down);
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('df:helpmode', mode);
    return () => {
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mouseout', out);
      document.removeEventListener('focusin', focusIn);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('click', click, true);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('df:helpmode', mode);
      document.body.classList.remove('df-helpmode');
    };
  }, [show, hide]);

  return createPortal(
    <>
      {tip && (
        <div className="df-tip" role="tooltip" data-side={tip.side} style={{ ...tip.style, '--arrow-x': `${tip.arrow}px` }}>
          {tip.title && <b>{tip.title}</b>}
          {tip.text}
        </div>
      )}
      {helpMode && (
        <div className="df-helpbar" role="status">
          <span className="df-help" style={{ margin: 0, background: '#EF6A2C', borderColor: '#EF6A2C', color: '#0E2A3D' }} aria-hidden="true">؟</span>
          <span>وضع الشرح مفعّل — اضغط أي عنصر عليه علامة <b>؟</b> لتعرف وظيفته</span>
          <button type="button" onClick={() => setHelpMode(false)}>إنهاء</button>
        </div>
      )}
    </>,
    document.body,
  );
}

export default Help;
