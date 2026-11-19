// الشريط العلوي والتذييل للصفحات العامة (متجاوبان).
import { useEffect, useState } from 'react';
import Logo, { RosetteShape } from '../../components/brand/Logo';
import { colors } from '../../theme/tokens';
import useViewport from '../../hooks/useViewport';
import { PUBLIC_PATHS } from '../../utils/publicRoutes';

const LINKS = [
  { l: 'الرئيسية', v: 'landing' },
  { l: 'عن دفة', v: 'about' },
  { l: 'الخدمات', v: 'services' },
  { l: 'الأسعار', v: 'pricing' },
  { l: 'تواصل معنا', v: 'contact' },
];

const btn = (primary) => ({
  height: 42, padding: '0 18px', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
  border: primary ? 'none' : `1.5px solid ${colors.grayBorder}`,
  background: primary ? colors.amber : '#fff', color: colors.ink, whiteSpace: 'nowrap',
});

export function PublicNav({ current, navigate, onLogin, onRegister }) {
  const vp = useViewport();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { if (!vp.isPhone && !vp.isTablet) setOpen(false); }, [vp.isPhone, vp.isTablet]);
  const compact = vp.isPhone || vp.isTablet;
  const go = (v) => { setOpen(false); navigate(v); window.scrollTo({ top: 0 }); };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: scrolled || open ? 'rgba(255,255,255,0.96)' : 'rgba(251,249,245,0.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${scrolled ? colors.grayBorder : 'transparent'}`, transition: 'border-color 0.2s, background 0.2s' }}>
      <nav aria-label="روابط الموقع" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, height: compact ? 64 : 76, padding: '0 clamp(16px, 4vw, 40px)', maxWidth: 1280, margin: '0 auto' }}>
        <a href="/" onClick={(e) => { e.preventDefault(); go('landing'); }} style={{ cursor: 'pointer', display: 'flex' }} aria-label="دفة — الرئيسية">
          <Logo variant="horizontal" size={vp.isPhone ? 36 : 42} />
        </a>

        {!compact && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {LINKS.map((n) => {
              const active = current === n.v;
              return (
                <a key={n.v} href={PUBLIC_PATHS[n.v]} onClick={(e) => { e.preventDefault(); go(n.v); }} aria-current={active ? 'page' : undefined} style={{ textDecoration: 'none', display: 'inline-block', position: 'relative', padding: '8px 14px', border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: active ? 700 : 500, color: active ? colors.ink : colors.gray, cursor: 'pointer' }}>
                  {n.l}
                  {active && <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: colors.amber }} />}
                </a>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!vp.isPhone && <button onClick={onLogin} style={btn(false)}>تسجيل الدخول</button>}
          <button onClick={onRegister} style={btn(true)}>{vp.isPhone ? 'ابدأ مجانًا' : 'أنشئ حسابًا مجانًا'}</button>
          {compact && (
            <button onClick={() => setOpen((v) => !v)} aria-label="القائمة" aria-expanded={open} style={{ width: 42, height: 42, borderRadius: 12, border: `1.5px solid ${colors.grayBorder}`, background: '#fff', color: colors.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}</svg>
            </button>
          )}
        </div>
      </nav>
      {compact && open && (
        <div style={{ padding: '8px 16px 18px', borderTop: `1px solid ${colors.grayBorder}`, background: '#fff', display: 'flex', flexDirection: 'column', gap: 2, animation: 'pageIn 0.15s' }}>
          {LINKS.map((n) => (
            <a key={n.v} href={PUBLIC_PATHS[n.v]} onClick={(e) => { e.preventDefault(); go(n.v); }} style={{ textDecoration: 'none', display: 'block', textAlign: 'right', padding: '13px 10px', border: 'none', borderRadius: 12, background: current === n.v ? colors.primaryTint : 'none', fontFamily: 'inherit', fontSize: 16, fontWeight: current === n.v ? 700 : 500, color: colors.ink, cursor: 'pointer' }}>{n.l}</a>
          ))}
          {vp.isPhone && <button onClick={onLogin} style={{ ...btn(false), marginTop: 8, height: 48 }}>تسجيل الدخول</button>}
        </div>
      )}
    </header>
  );
}

export function PublicFooter({ sc, navigate }) {
  const go = (v) => { navigate(v); window.scrollTo({ top: 0 }); };
  const col = { fontSize: 14, color: '#BFD6E5', padding: '5px 0', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', textAlign: 'right', display: 'block', textDecoration: 'none' };
  return (
    <footer style={{ background: colors.ink, color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <RosetteShape size={380} color="#FFFFFF" opacity={0.05} style={{ position: 'absolute', left: -110, top: -90 }} />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '56px clamp(16px, 4vw, 40px) 36px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, position: 'relative' }}>
        <div style={{ gridColumn: 'span 1' }}>
          <Logo variant="horizontal" tone="dark" size={44} />
          <p style={{ fontSize: 14, color: '#D6E4EE', marginTop: 16, lineHeight: 1.9, maxWidth: 300 }}>{sc('footer_desc', 'منصة دفة للتخطيط الاستراتيجي وصناعة السياسات')}</p>
        </div>
        <div>
          <h4 style={{ color: '#fff', fontSize: 15, marginBottom: 12 }}>روابط سريعة</h4>
          {LINKS.slice(0, 4).map((n) => <a key={n.v} href={PUBLIC_PATHS[n.v]} onClick={(e) => { e.preventDefault(); go(n.v); }} style={col}>{n.l}</a>)}
        </div>
        <div>
          <h4 style={{ color: '#fff', fontSize: 15, marginBottom: 12 }}>الخدمات</h4>
          {['التخطيط الاستراتيجي', 'التخطيط التشغيلي', 'السياسات واللوائح'].map((l) => <a key={l} href={PUBLIC_PATHS.services} onClick={(e) => { e.preventDefault(); go('services'); }} style={col}>{l}</a>)}
        </div>
        <div>
          <h4 style={{ color: '#fff', fontSize: 15, marginBottom: 12 }}>تواصل معنا</h4>
          <div style={{ fontSize: 14, color: '#BFD6E5', lineHeight: 2.1 }}>
            <div dir="ltr" style={{ textAlign: 'right' }}>{sc('contact_email', 'info@daffa.sa')}</div>
            <div dir="ltr" style={{ textAlign: 'right' }}>{sc('contact_phone', '+966 55 XXX XXXX')}</div>
            <div>{sc('contact_address', 'الرياض، المملكة العربية السعودية')}</div>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px', textAlign: 'center', fontSize: 13, color: 'rgba(214,228,238,0.6)', position: 'relative' }}>
        {sc('footer_copyright', 'جميع الحقوق محفوظة © 2026 منصة دفة')}
      </div>
    </footer>
  );
}
