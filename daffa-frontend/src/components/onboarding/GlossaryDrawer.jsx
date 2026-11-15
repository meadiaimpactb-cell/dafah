// قاموس دفة — لوحة جانبية بكل المصطلحات وشرحها المبسّط مع البحث.
import React, { useEffect, useMemo, useState } from 'react';
import { GLOSSARY, GLOSSARY_GROUPS } from '../../theme/glossary';
import { colors, font } from '../../theme/tokens';

export default function GlossaryDrawer({ open, onClose, initial }) {
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(initial || null);

  useEffect(() => {
    const on = (e) => { setFocus(e.detail?.term || null); setQ(''); window.dispatchEvent(new CustomEvent('df:glossary-open')); };
    window.addEventListener('df:glossary', on);
    return () => window.removeEventListener('df:glossary', on);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    if (focus) setTimeout(() => document.getElementById(`gl-${focus}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);
    return () => document.removeEventListener('keydown', k);
  }, [open, focus, onClose]);

  const items = useMemo(() => {
    const term = q.trim();
    return Object.entries(GLOSSARY).filter(([, v]) => !term || v.term.includes(term) || v.simple.includes(term) || (v.example || '').includes(term));
  }, [q]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(18,15,51,0.45)', animation: 'pageIn 0.2s' }} />
      <aside role="dialog" aria-label="قاموس المصطلحات" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 'min(460px, 100vw)', background: colors.bg, boxShadow: '0 0 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', animation: 'pageIn 0.2s' }}>
        <div style={{ padding: '20px 22px 14px', background: colors.ink, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontFamily: font.display, fontSize: 19, fontWeight: 700 }}>قاموس دفة</div>
              <div style={{ fontSize: 13, color: '#DDDAF7', marginTop: 2 }}>كل مصطلح بلغة بسيطة ومثال من الواقع</div>
            </div>
            <button onClick={onClose} aria-label="إغلاق" style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن مصطلح… مثل: الرؤية، مؤشرات" style={{ marginTop: 14, width: '100%', padding: '11px 14px', borderRadius: 12, border: 'none', fontSize: 15, fontFamily: 'inherit', background: '#fff', color: colors.ink }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 30px' }}>
          {GLOSSARY_GROUPS.map((g) => {
            const list = items.filter(([, v]) => v.group === g);
            if (!list.length) return null;
            return (
              <section key={g}>
                <h3 style={{ fontSize: 13, color: colors.gray, fontWeight: 600, margin: '18px 4px 8px' }}>{g}</h3>
                {list.map(([k, v]) => (
                  <div key={k} id={`gl-${k}`} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 8, border: `1.5px solid ${focus === k ? colors.amber : colors.grayBorder}` }}>
                    <div style={{ fontFamily: font.display, fontWeight: 700, color: colors.ink, fontSize: 15, marginBottom: 4 }}>{v.term}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.9, color: colors.text }}>{v.simple}</div>
                    {v.example && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 10, background: colors.amberSoft, fontSize: 13, lineHeight: 1.8, color: '#7A4706' }}><b>مثال: </b>{v.example}</div>}
                  </div>
                ))}
              </section>
            );
          })}
          {!items.length && <div style={{ padding: 40, textAlign: 'center', color: colors.gray }}>لا يوجد مصطلح مطابق</div>}
        </div>
      </aside>
    </div>
  );
}
