import { useEffect, useState } from 'react';
import Logo from '../../components/brand/Logo';
import DfIcon from '../../components/ui/DfIcon';
import api from '../../api/axios';

/*
 * إطار صفحات الدخول والتسجيل:
 * - زر «رجوع» أعلى الصفحة يعيد الزائر إلى الصفحة التي جاء منها، والشعار يعيده إلى الصفحة الرئيسية.
 * - لوحة تعريفية (في التسجيل) نصوصها من «محتوى الموقع ← صفحات الدخول والتسجيل» في لوحة التحكم.
 */

let siteCache = null;
let sitePromise = null;
export function useSiteContent() {
  const [sc, setSc] = useState(siteCache);
  useEffect(() => {
    if (siteCache) return undefined;
    let alive = true;
    sitePromise = sitePromise || api.get('/site-content').then(r => (siteCache = r.data || {})).catch(() => { sitePromise = null; return {}; });
    sitePromise.then(d => { if (alive) setSc(d); });
    return () => { alive = false; };
  }, []);
  return sc || {};
}

const CSS = `
.df-auth{min-height:100vh;direction:rtl;background:radial-gradient(rgba(35,93,127,.08) 1.2px,transparent 1.3px) 0 0/22px 22px,#FBF9F5;padding:18px 16px 32px;box-sizing:border-box}
.df-auth *{box-sizing:border-box}
.df-auth-top{max-width:1080px;margin:0 auto 14px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.df-auth-back{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #E8E3DA;color:#0E2A3D;border-radius:999px;padding:8px 16px 8px 14px;font:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:border-color .15s,box-shadow .15s}
.df-auth-back:hover,.df-auth-back:focus-visible{border-color:#235D7F;box-shadow:0 0 0 3px rgba(35,93,127,.12);outline:none}
.df-auth-home{background:none;border:none;color:#235D7F;font:inherit;font-size:13px;font-weight:700;cursor:pointer;padding:6px 4px}
.df-auth-home:hover{text-decoration:underline}
.df-auth-grid{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:22px;align-items:stretch;justify-items:center}
.df-auth-grid.wide{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr)}
.df-auth-card{background:#fff;border:1px solid #E8E3DA;border-radius:24px;padding:32px min(44px,7vw);width:100%;box-shadow:0 4px 32px rgba(14,42,61,.08)}
.df-auth-logo{display:flex;justify-content:center;margin-bottom:18px}
.df-auth-logo button{background:none;border:none;padding:6px;border-radius:14px;cursor:pointer;transition:transform .15s}
.df-auth-logo button:hover{transform:scale(1.03)}
.df-auth-logo button:focus-visible{outline:3px solid rgba(35,93,127,.35)}
.df-auth-panel{width:100%;border-radius:24px;padding:34px 30px;color:#fff;background:linear-gradient(160deg,#235D7F 0%,#123247 62%,#0E2A3D 100%);position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;gap:8px}
.df-auth-panel:after{content:"";position:absolute;inset:auto -80px -80px auto;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(239,106,44,.35),transparent 70%)}
.df-auth-panel h3{font-size:26px;font-weight:800;margin:22px 0 10px;line-height:1.5;color:#fff}
.df-auth-panel p{font-size:14.5px;line-height:2;margin:0 0 20px;color:rgba(255,255,255,.86)}
.df-auth-panel ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px;position:relative;z-index:1}
.df-auth-panel li{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.8}
.df-auth-panel li span.ic{flex-shrink:0;width:24px;height:24px;border-radius:50%;background:rgba(239,106,44,.95);color:#fff;display:inline-flex;align-items:center;justify-content:center;margin-top:2px}
@media (max-width:900px){.df-auth-grid.wide{grid-template-columns:minmax(0,1fr)}.df-auth-panel{order:2;padding:26px 22px}}
@media (max-width:520px){.df-auth-card{border-radius:18px;padding:24px 18px}.df-auth-home{display:none}}
`;

export default function AuthShell({ onBack, onHome, maxWidth = 460, panel = false, children }) {
  const sc = useSiteContent();
  const points = String(sc.auth_panel_points || '').split('\n').map(s => s.trim()).filter(Boolean);
  const showPanel = panel && (sc.auth_panel_title || sc.auth_panel_text || points.length);

  return (
    <div className="df-auth">
      <style>{CSS}</style>
      <div className="df-auth-top" style={showPanel ? undefined : { maxWidth }}>
        {onBack ? (
          <button type="button" className="df-auth-back" onClick={onBack} aria-label="رجوع إلى الصفحة السابقة">
            <span aria-hidden style={{ fontSize: 17, lineHeight: 1 }}>→</span> رجوع
          </button>
        ) : <span />}
        {onHome && <button type="button" className="df-auth-home" onClick={onHome}>الصفحة الرئيسية</button>}
      </div>

      <div className={`df-auth-grid${showPanel ? ' wide' : ''}`}>
        <main className="df-auth-card" style={{ maxWidth: showPanel ? 'none' : maxWidth }}>
          <div className="df-auth-logo">
            {onHome ? (
              <button type="button" onClick={onHome} aria-label="دفة — العودة إلى الصفحة الرئيسية" title="الصفحة الرئيسية">
                <Logo variant="stacked" size={88} descriptor />
              </button>
            ) : <Logo variant="stacked" size={88} descriptor />}
          </div>
          {children}
        </main>

        {showPanel && (
          <aside className="df-auth-panel" aria-label="لماذا دفة">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Logo variant="horizontal" tone="dark" size={40} />
              {sc.auth_panel_title && <h3>{sc.auth_panel_title}</h3>}
              {sc.auth_panel_text && <p>{sc.auth_panel_text}</p>}
            </div>
            {points.length > 0 && (
              <ul>
                {points.map((p, i) => (
                  <li key={i}><span className="ic"><DfIcon name="check" size={13} /></span><span>{p}</span></li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

/** حقل كلمة مرور مع زر إظهار/إخفاء */
export function PasswordInput({ style, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input {...props} type={show ? 'text' : 'password'} style={{ ...style, paddingLeft: 44 }} />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        title={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, border: 'none', background: 'none', color: '#5E6B78', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
      >
        <DfIcon name={show ? 'eyeoff' : 'eye'} size={17} />
      </button>
    </div>
  );
}

/** نافذة الشروط والأحكام (النص من محتوى الموقع: terms_text) */
export function TermsModal({ text, onClose, onAccept }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label="الشروط والأحكام" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(14,42,61,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, direction: 'rtl' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(14,42,61,.3)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #E8E3DA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0E2A3D' }}>الشروط والأحكام</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={{ border: 'none', background: '#F3EFE8', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', color: '#0E2A3D' }}><DfIcon name="x" size={15} /></button>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto', fontSize: 14, lineHeight: 2.1, color: '#334452', whiteSpace: 'pre-line' }}>{text}</div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid #E8E3DA', display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
          <button type="button" onClick={onAccept} style={{ padding: '10px 22px', border: 'none', borderRadius: 10, background: '#EF6A2C', color: '#0E2A3D', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>قرأتها وأوافق</button>
          <button type="button" onClick={onClose} style={{ padding: '10px 18px', border: '1.5px solid #E8E3DA', borderRadius: 10, background: '#fff', color: '#0E2A3D', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}
