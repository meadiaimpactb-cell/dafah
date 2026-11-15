// هيكل لوحة التحكم المتجاوب:
//   مكتبي  → قائمة جانبية كاملة (قابلة للطي إلى شريط أيقونات)
//   لوحي   → شريط أيقونات مع تلميحات، وزر يفتح القائمة كاملة فوق المحتوى
//   جوال   → شريط علوي مختصر + شريط تبويبات سفلي + قائمة منزلقة
import React, { useEffect, useState } from 'react';
import Logo, { LogoMark, RosetteShape } from '../brand/Logo';
import { colors, font } from '../../theme/tokens';
import { NAV_HELP } from '../../theme/glossary';
import { setHelpMode } from '../ui/Help';
import useViewport from '../../hooks/useViewport';

const ROLE_LABEL = { admin: 'مدير النظام', consultant: 'مستشار', client: 'عميل' };

const I = {
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>,
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  bell: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  globe: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  logout: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  collapse: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M15 3v18" /></svg>,
  more: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>,
  book: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
  tour: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>,
};

const Count = ({ n, small }) => (n > 0 ? (
  <span style={{ minWidth: small ? 16 : 20, height: small ? 16 : 20, borderRadius: 10, background: colors.amber, color: colors.ink, fontSize: small ? 9.5 : 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', lineHeight: 1 }}>{n > 99 ? '99+' : n}</span>
) : null);

function NavList({ menu, currentView, onNavigate, compact, badges }) {
  let lastGroup = null;
  return (
    <nav aria-label="القائمة الرئيسية" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {menu.map((item) => {
        const active = currentView === item.id;
        const showGroup = !compact && item.group && item.group !== lastGroup;
        lastGroup = item.group || lastGroup;
        const badge = badges[item.id] || 0;
        return (
          <React.Fragment key={item.id}>
            {showGroup && (
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(214,228,238,0.55)', padding: '14px 12px 6px', letterSpacing: 0 }}>{item.group}</div>
            )}
            <button
              onClick={() => onNavigate(item.id)}
              data-tip={compact ? `${item.label} — ${NAV_HELP[item.id] || ''}` : (NAV_HELP[item.id] || item.label)}
              data-tip-title={compact ? undefined : item.label}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: compact ? '11px 0' : '10px 12px', minHeight: 44,
                justifyContent: compact ? 'center' : 'flex-start',
                borderRadius: 12, border: 'none', position: 'relative',
                background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: active ? '#fff' : 'rgba(217,232,241,0.78)',
                cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 500, fontFamily: 'inherit', textAlign: 'right',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(217,232,241,0.78)'; } }}
            >
              {active && <span style={{ position: 'absolute', right: -8, top: 10, bottom: 10, width: 4, borderRadius: 4, background: colors.amber }} />}
              <span style={{ display: 'flex', flexShrink: 0, color: active ? colors.amber : 'inherit', position: 'relative' }}>
                {item.icon}
                {compact && badge > 0 && <span style={{ position: 'absolute', top: -7, left: -9 }}><Count n={badge} small /></span>}
              </span>
              {!compact && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
              {!compact && <Count n={badge} />}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function UserCard({ authUser, role, compact, onLogout, onProfile }) {
  const name = role === 'client'
    ? (authUser?.org_name || authUser?.rep_name || 'المنظمة')
    : (authUser?.rep_name || authUser?.email?.split('@')[0] || ROLE_LABEL[role]);
  const initial = (name || 'د').trim()[0];
  return (
    <div style={{ padding: compact ? '12px 8px' : '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, flexDirection: compact ? 'column' : 'row' }}>
      <button onClick={onProfile} data-tip="حسابي وإعداداتي" style={{ width: 40, height: 40, borderRadius: 12, background: colors.amber, color: colors.ink, fontWeight: 700, fontSize: 16, flexShrink: 0, overflow: 'hidden', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display }}>
        {authUser?.logo_url ? <img src={authUser.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
      </button>
      {!compact && (
        <div style={{ color: '#fff', overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(214,228,238,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{role === 'client' ? (authUser?.org_type || 'عميل') : ROLE_LABEL[role]}</div>
        </div>
      )}
      <button onClick={onLogout} data-tip="تسجيل الخروج" aria-label="تسجيل الخروج" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {I.logout}
      </button>
    </div>
  );
}

function SidebarPanel({ compact, onToggle, showToggle, children, footer, onLogoClick, width }) {
  return (
    <aside className="df-sidebar" style={{ width, height: '100%', background: `linear-gradient(180deg, ${colors.ink} 0%, #0B2233 100%)`, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <RosetteShape size={260} color="#FFFFFF" opacity={0.045} style={{ position: 'absolute', left: -90, bottom: 40, pointerEvents: 'none' }} />
      <div style={{ height: 72, padding: compact ? '0' : '0 18px', display: 'flex', alignItems: 'center', justifyContent: compact ? 'center' : 'space-between', gap: 8, flexShrink: 0 }}>
        <span onClick={onLogoClick} style={{ cursor: 'pointer', display: 'flex' }} data-tip="الصفحة الرئيسية للوحة التحكم">
          {compact ? <LogoMark size={40} tone="dark" /> : <Logo variant="horizontal" tone="dark" size={38} />}
        </span>
        {showToggle && !compact && (
          <button onClick={onToggle} data-tip="طيّ القائمة لمساحة أوسع" aria-label="طيّ القائمة" style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(217,232,241,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.collapse}</button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: compact ? '4px 10px 12px' : '4px 14px 12px' }}>{children}</div>
      {footer}
    </aside>
  );
}

export default function AppShell({
  role, authUser, menu, currentView, onNavigate, onLogout, onProfile, onHome,
  title, breadcrumb, unreadCount = 0, onNotifications, onPreview, onGlossary, onTour,
  bottomTabs = [], children,
}) {
  const vp = useViewport();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('df_sidebar') === 'rail');
  const [drawer, setDrawer] = useState(false);

  useEffect(() => { setDrawer(false); }, [currentView, vp.isPhone, vp.isTablet]);
  useEffect(() => { localStorage.setItem('df_sidebar', collapsed ? 'rail' : 'full'); }, [collapsed]);
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawer]);

  const badges = {};
  ['client-notifications', 'con-notifications', 'admin-notifications'].forEach((k) => { badges[k] = unreadCount; });

  const rail = vp.isTablet || (vp.isDesktop && collapsed);
  const sideW = vp.isPhone ? 0 : rail ? 76 : 264;
  const go = (id) => { setDrawer(false); onNavigate(id); };

  const fullPanel = (onClose) => (
    <SidebarPanel
      compact={false}
      width={vp.isPhone ? 'min(86vw, 320px)' : 264}
      showToggle={vp.isDesktop}
      onToggle={() => setCollapsed(true)}
      onLogoClick={() => go(onHome)}
      footer={<UserCard authUser={authUser} role={role} onLogout={onLogout} onProfile={() => go(onProfile)} />}
    >
      {onClose && (
        <button onClick={onClose} aria-label="إغلاق القائمة" style={{ position: 'absolute', top: 18, left: 14, width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.close}</button>
      )}
      <NavList menu={menu} currentView={currentView} onNavigate={go} badges={badges} />
      <div style={{ marginTop: 14, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => { setDrawer(false); setHelpMode(true); }} data-help-toggle style={sideLink}><span style={{ ...qDot }}>؟</span> وضع الشرح</button>
        {onGlossary && <button onClick={() => { setDrawer(false); onGlossary(); }} style={sideLink}>{I.book} قاموس المصطلحات</button>}
        {onTour && <button onClick={() => { setDrawer(false); onTour(); }} style={sideLink}>{I.tour} جولة تعريفية</button>}
      </div>
    </SidebarPanel>
  );

  return (
    <div style={{ minHeight: '100vh', direction: 'rtl', background: colors.bg }}>
      {/* القائمة الجانبية الثابتة (مكتبي/لوحي) */}
      {!vp.isPhone && (
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: sideW, zIndex: 100, transition: 'width 0.25s ease' }}>
          {rail ? (
            <SidebarPanel
              compact
              width={76}
              onLogoClick={() => go(onHome)}
              footer={<UserCard compact authUser={authUser} role={role} onLogout={onLogout} onProfile={() => go(onProfile)} />}
            >
              <button onClick={() => (vp.isDesktop ? setCollapsed(false) : setDrawer(true))} data-tip="إظهار القائمة كاملة" aria-label="إظهار القائمة كاملة" style={{ width: '100%', minHeight: 40, marginBottom: 6, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{I.menu}</button>
              <NavList compact menu={menu} currentView={currentView} onNavigate={go} badges={badges} />
            </SidebarPanel>
          ) : fullPanel(null)}
        </div>
      )}

      {/* قائمة منزلقة (جوال/لوحي) */}
      {drawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400 }}>
          <div onClick={() => setDrawer(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(10,31,46,0.5)', animation: 'pageIn 0.2s ease' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, animation: 'dfDrawerIn 0.24s cubic-bezier(0.2,0.8,0.2,1)', boxShadow: '0 0 60px rgba(0,0,0,0.3)' }}>
            {fullPanel(() => setDrawer(false))}
          </div>
        </div>
      )}

      <div className="df-main" style={{ marginRight: sideW, transition: 'margin 0.25s ease', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 'var(--tabbar-h)' }}>
        {/* الشريط العلوي */}
        <header className="df-topbar" style={{ height: 'var(--topbar-h)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 var(--page-pad)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${colors.grayBorder}`, position: 'sticky', top: 0, zIndex: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {vp.isPhone && (
              <button onClick={() => setDrawer(true)} aria-label="القائمة" data-tip="القائمة الكاملة" style={iconBtn}>{I.menu}</button>
            )}
            {vp.isPhone && <span onClick={() => go(onHome)} style={{ display: 'flex', cursor: 'pointer' }}><LogoMark size={32} /></span>}
            <div style={{ minWidth: 0 }}>
              {breadcrumb && <div style={{ fontSize: 11.5, color: colors.gray, lineHeight: 1.3 }}>{breadcrumb}</div>}
              <h1 style={{ fontSize: vp.isPhone ? 16 : 18, fontWeight: 700, color: colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>{title}</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: vp.isPhone ? 4 : 8, flexShrink: 0 }}>
            <button onClick={() => setHelpMode(true)} data-help-toggle data-tip="وضع الشرح: يضع علامة ؟ على كل زر وأيقونة لتعرف وظيفتها" aria-label="وضع الشرح" style={{ ...iconBtn, color: colors.primary, background: colors.primaryTint, fontWeight: 700, fontSize: 17, fontFamily: font.display }}>؟</button>
            <button onClick={onNotifications} data-tip={unreadCount > 0 ? `لديك ${unreadCount} إشعارات غير مقروءة` : 'الإشعارات'} aria-label="الإشعارات" style={{ ...iconBtn, position: 'relative', color: unreadCount > 0 ? colors.primary : colors.gray }}>
              {I.bell}
              {unreadCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4 }}><Count n={unreadCount} small /></span>}
            </button>
            {!vp.isPhone && onPreview && (
              <button onClick={onPreview} data-tip="فتح الموقع العام في تبويب جديد" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 12, border: `1.5px solid ${colors.grayBorder}`, background: '#fff', color: colors.text, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                {I.globe}{vp.isDesktop && 'معاينة الموقع'}
              </button>
            )}
            {vp.isDesktop && (
              <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', background: role === 'admin' ? colors.amberSoft : role === 'consultant' ? colors.greenLight : colors.primaryTint, color: role === 'admin' ? colors.amberText : role === 'consultant' ? colors.greenText : colors.primaryHover }}>
                {ROLE_LABEL[role]}
              </span>
            )}
          </div>
        </header>

        <main className="geo-bg" style={{ flex: 1, padding: 'var(--page-pad)', position: 'relative', minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* شريط التبويبات السفلي (جوال) */}
      {vp.isPhone && (
        <nav className="df-tabbar" aria-label="تنقّل سريع" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, height: 'calc(var(--tabbar-h) + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)', background: '#fff', borderTop: `1px solid ${colors.grayBorder}`, display: 'flex', boxShadow: '0 -6px 20px rgba(14,42,61,0.06)' }}>
          {bottomTabs.map((t) => {
            const active = currentView === t.id;
            return (
              <button key={t.id} onClick={() => go(t.id)} aria-current={active ? 'page' : undefined} style={tabBtn(active)}>
                <span style={{ display: 'flex', position: 'relative' }}>{t.icon}{badges[t.id] > 0 && <span style={{ position: 'absolute', top: -6, left: -10 }}><Count n={badges[t.id]} small /></span>}</span>
                <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}>{t.short || t.label}</span>
                {active && <span style={{ position: 'absolute', top: 0, width: 28, height: 3, borderRadius: 3, background: colors.amber }} />}
              </button>
            );
          })}
          <button onClick={() => setDrawer(true)} style={tabBtn(false)}>
            <span style={{ display: 'flex' }}>{I.more}</span>
            <span style={{ fontSize: 10.5, fontWeight: 500 }}>المزيد</span>
          </button>
        </nav>
      )}
    </div>
  );
}

const iconBtn = { width: 40, height: 40, borderRadius: 12, border: 'none', background: 'transparent', color: colors.gray, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const sideLink = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 6px', border: 'none', background: 'transparent', color: 'rgba(217,232,241,0.85)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textAlign: 'right', borderRadius: 8 };
const qDot = { width: 18, height: 18, borderRadius: '50%', background: colors.amber, color: colors.ink, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const tabBtn = (active) => ({ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, border: 'none', background: 'none', color: active ? colors.primary : colors.gray, cursor: 'pointer', fontFamily: 'inherit', minWidth: 0 });
