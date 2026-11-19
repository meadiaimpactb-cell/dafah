import DfIcon from './components/ui/DfIcon';
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { cleanupLegacyPermissions, usePermissions } from "./utils/permissions";
import { IcClock, IcCheck, IcPalette, IcTarget, IcMail, IcPhone, IcDocument, IcClipboard, IcLock, IcWarning, IcCog, IcMapPin, IcFolder, IcBell } from "./utils/icons";
import api from "./api/axios";
import { strategicApi } from "./api/strategic";
import { operationalApi } from "./api/operational";
import { policiesApi } from "./api/policies";
import { notificationsApi } from "./api/notifications";
import { RosetteShape } from "./components/brand/Logo";
import { colors as themeColors, systems } from "./theme/tokens";
import { Badge, ProgressBar, Btn, Card, Input, Modal, GenericPage, Loading, SectionTitle } from "./components/ui/kit";
import { Help, TipLayer } from "./components/ui/Help";
import AppShell from "./components/shell/AppShell";
import { PublicNav as PublicNavBar, PublicFooter as PublicFooterBar } from "./pages/public/PublicLayout";
import Landing from "./pages/public/Landing";
import { Icons } from "./utils/navIcons";
import { PUBLIC_PATHS, viewFromPath, applySeo } from "./utils/publicRoutes";
import { withChunkReload } from "./utils/updateWatcher";

// صفحات تُحمَّل عند أول زيارة فقط (تقسيم الحزمة): الدخول والتسجيل، الأنظمة الثلاثة، ولوحات المستشار والأدمن
const Login = lazy(withChunkReload(() => import("./pages/auth/Login")));
const Register = lazy(withChunkReload(() => import("./pages/auth/Register")));
const ResetPasswordPage = lazy(withChunkReload(() => import("./pages/auth/ResetPasswordPage")));
const StrategicRoadmapDynamic = lazy(withChunkReload(() => import("./pages/strategic/StrategicRoadmap")));
const UnitPageDynamic = lazy(withChunkReload(() => import("./pages/strategic/UnitPage")));
const OperationalRoadmapDynamic = lazy(withChunkReload(() => import("./pages/operational/OperationalRoadmap")));
const PoliciesRoadmapDynamic = lazy(withChunkReload(() => import("./pages/policies/PoliciesRoadmap")));
const AdminConsultants = lazy(withChunkReload(() => import("./pages/admin/AdminConsultants")));
const AdminOrgs = lazy(withChunkReload(() => import("./pages/admin/AdminOrgs")));
const AdminServices = lazy(withChunkReload(() => import("./pages/admin/AdminServices")));
const AdminContent = lazy(withChunkReload(() => import("./pages/admin/AdminContent")));
const ConsultantDashboard = lazy(withChunkReload(() => import("./pages/consultant/ConsultantDashboard")));
const ConsultantClients = lazy(withChunkReload(() => import("./pages/consultant/ConsultantClients")));
const ConsultantReviewsPage = lazy(withChunkReload(() => import("./pages/consultant/ConsultantReviewsPage")));
const ChatPage = lazy(withChunkReload(() => import("./pages/chat/ChatPage")));
const ProfilePage = lazy(withChunkReload(() => import("./pages/profile/ProfilePage")));
const AdminUsers = lazy(withChunkReload(() => import("./pages/admin/AdminUsers")));
const AdminSiteContent = lazy(withChunkReload(() => import("./pages/admin/AdminSiteContent")));
const AdminSettings = lazy(withChunkReload(() => import("./pages/admin/AdminSettings")));
const AdminPolicyDesigns = lazy(withChunkReload(() => import("./pages/admin/AdminPolicyDesigns")));
const AdminOutputs = lazy(withChunkReload(() => import("./pages/admin/AdminOutputs")));
const RoleGuide = lazy(withChunkReload(() => import("./pages/shared/RoleGuide")));
const AdminQuestionnaire = lazy(withChunkReload(() => import("./pages/admin/AdminQuestionnaire")));
const GlossaryDrawer = lazy(withChunkReload(() => import("./components/onboarding/GlossaryDrawer")));
const OnboardingTour = lazy(withChunkReload(() => import("./components/onboarding/OnboardingTour")));
const AdminNotificationsPage = lazy(withChunkReload(() => import("./pages/admin/AdminNotificationsPage")));
const AdminActivityLogPage = lazy(withChunkReload(() => import("./pages/admin/AdminActivityLogPage")));
const AdminFaqsPage = lazy(withChunkReload(() => import("./pages/admin/AdminFaqsPage")));
const AdminFinancePage = lazy(withChunkReload(() => import("./pages/admin/AdminFinancePage")));
const AdminReportsPage = lazy(withChunkReload(() => import("./pages/admin/AdminReportsPage")));
const AdminDashboardPage = lazy(withChunkReload(() => import("./pages/admin/AdminDashboardPage")));
const ClientHelpPage = lazy(withChunkReload(() => import("./pages/client/ClientHelpPage")));
const ClientPaymentsPage = lazy(withChunkReload(() => import("./pages/client/ClientPaymentsPage")));
const ConsultantEarningsPage = lazy(withChunkReload(() => import("./pages/consultant/ConsultantEarningsPage")));
const ConsultantStatsPage = lazy(withChunkReload(() => import("./pages/consultant/ConsultantStatsPage")));



// ============== STYLES ==============
const colors = themeColors;

// ============== SHARED COMPONENTS (src/components/ui/kit.jsx) ==============

const KA_VIEWS = new Set([
  'strategic-roadmap', 'operational-roadmap', 'policies-select',
  'client-dash', 'con-dash', 'admin-dash',
  'client-payments', 'client-chat', 'con-chat',
  'con-clients', 'con-pending', 'con-completed', 'con-earnings', 'con-stats',
  'admin-outputs', 'admin-orgs', 'admin-consultants', 'admin-users', 'admin-questionnaires',
  'admin-designs', 'admin-finance', 'admin-reports',
  'admin-services', 'admin-content', 'admin-site-content',
  'admin-notifications', 'admin-log', 'admin-settings', 'admin-faqs',
  'client-settings', 'con-settings', 'admin-profile',
]);

// ============== KEEP-ALIVE WRAPPER ==============
function KeepAlive({ active, children }) {
  const [mounted, setMounted] = React.useState(active);
  const innerRef = React.useRef(null);
  const wasActiveRef = React.useRef(active);

  React.useEffect(() => {
    if (active) {
      setMounted(true);
      // إعادة تشغيل الـ fade-in عند العودة للصفحة بدون إعادة mount
      if (!wasActiveRef.current && innerRef.current) {
        innerRef.current.style.animation = 'none';
        void innerRef.current.offsetHeight; // force reflow
        innerRef.current.style.animation = '';
      }
    }
    wasActiveRef.current = active;
  }, [active]);

  if (!mounted) return null;
  return (
    <div style={{ display: active ? undefined : 'none' }}>
      <div ref={innerRef} className="animate-in">{children}</div>
    </div>
  );
}

// العودة من Google/Facebook/LinkedIn: ?social_code=… (رمز لمرة واحدة) أو ?social_error=…
// تُقرأ مرة واحدة عند تحميل الصفحة ثم يُنظَّف الرابط.
const SOCIAL_RETURN = (() => {
  try {
    const p = new URLSearchParams(window.location.search);
    const code = p.get('social_code');
    const error = p.get('social_error');
    if (!code && !error) return null;
    window.history.replaceState({}, '', window.location.pathname);
    return { code, error, intent: p.get('social_intent') === 'register' ? 'register' : 'login', started: false };
  } catch { return null; }
})();

// وضع المعاينة من لوحة الأدمن (?preview=1): يعرض الصفحات العامة بآخر محتوى محفوظ
const IS_PREVIEW = (() => { try { return new URLSearchParams(window.location.search).get('preview') === '1'; } catch { return false; } })();

// ============== MAIN APP ==============
export default function DaffaPlatform() {
  // Clear any stale old-format permissions from localStorage on first render
  cleanupLegacyPermissions();

  // ALL hooks at the very top — no exceptions
  // /login و/register عنوانان مباشران لصفحتَي الدخول والتسجيل (للزائر غير المسجَّل)
  const [authPage, setAuthPage] = useState(() => {
    try { if (localStorage.getItem('user')) return null; } catch {}
    const v = viewFromPath(window.location.pathname);
    return v === 'login' || v === 'register' ? v : null;
  });
  const [socialReturn] = useState(SOCIAL_RETURN);
  const [socialBusy, setSocialBusy] = useState(() => !!socialReturn?.code);
  const [authError, setAuthError] = useState(() => (socialReturn?.error ? socialReturn.error : null));
  // detect ?token=xxx&email=yyy in URL (from password-reset email link)
  const [resetParams, setResetParams] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const token = p.get('token');
      const email = p.get('email');
      if (token && email) return { token, email };
    } catch {}
    return null;
  });
  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [currentView, setCurrentView] = useState(() => {
    try {
      if (new URLSearchParams(window.location.search).get('preview') === '1') return "landing";
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) { const v = viewFromPath(window.location.pathname); return v === 'login' || v === 'register' ? 'landing' : v; }
      const saved = sessionStorage.getItem('currentView');
      if (saved) return saved;
      if (user.role === 'admin') return 'admin-dash';
      if (user.role === 'consultant') return 'con-dash';
      return 'client-dash';
    } catch { return "landing"; }
  });
  const [currentRole, setCurrentRole] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return "client";
      if (user.role === 'admin') return 'admin';
      if (user.role === 'consultant') return 'consultant';
      return 'client';
    } catch { return "client"; }
  });
  const [activeUnit, setActiveUnit] = useState(null);
  const [strategicWorkflowId, setStrategicWorkflowId] = useState(null);
  const [operationalWorkflowId, setOperationalWorkflowId] = useState(null);
  const [policyWorkflowId, setPolicyWorkflowId] = useState(null);
  const [chatAutoStart, setChatAutoStart] = useState(false);
  const [modal, setModal] = useState(null);
  const [dashPhases,     setDashPhases]     = useState(null);
  const [dashConsultant, setDashConsultant] = useState(null);
  const [downloadsData,  setDownloadsData]  = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const notifPollRef                      = useRef(null);
  const { can }                           = usePermissions();
  const [siteContent,   setSiteContent]   = useState({});
  const sc = (key, fallback = '') => siteContent[key] ?? fallback;
  const [publicPolicies, setPublicPolicies] = useState([]);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  // ── قاموس المصطلحات يُفتح من أي زر «؟»
  useEffect(() => {
    const open = () => setGlossaryOpen(true);
    window.addEventListener('df:glossary', open);
    return () => window.removeEventListener('df:glossary', open);
  }, []);

  // ── استمع لحدث انتهاء الجلسة المُرسَل من axios interceptor ──────────────
  useEffect(() => {
    const handler = () => {
      setAuthUser(null);
      setCurrentRole('client');
      setCurrentView('landing');
      setActiveUnit(null);
      setSessionExpired(true);
      setTimeout(() => setSessionExpired(false), 5000);
    };
    window.addEventListener('session:expired', handler);
    return () => window.removeEventListener('session:expired', handler);
  }, []);

  // ── fetch site content + public policy types (no auth needed) ────────────
  useEffect(() => {
    // في وضع المعاينة نتجاوز ذاكرة المتصفح المؤقتة (60 ثانية) لنرى آخر تعديل فورًا
    api.get('/site-content', { params: IS_PREVIEW ? { t: Date.now() } : undefined })
      .then(r => setSiteContent(r.data && typeof r.data === 'object' ? r.data : {})).catch(() => {});
  }, []);
  // قائمة السياسات العامة (≈40KB) تلزم صفحتَي الخدمات والأسعار فقط — لا تُطلب مع الصفحة الرئيسية
  useEffect(() => {
    if (!['services', 'pricing'].includes(currentView) || publicPolicies.length) return;
    api.get('/public/policy-types').then(r => setPublicPolicies(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [currentView]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── sync permissions + avatar from server on mount
  useEffect(() => {
    if (!authUser) return;
    api.get('/auth/me').then(res => {
      const fresh = res.data;
      localStorage.setItem('user', JSON.stringify(fresh));
      setAuthUser(fresh);
      window.dispatchEvent(new Event('permissionsChanged'));
    }).catch(() => {});
  }, []);

  // ── fetch downloads data ───────────────────────────────────────────────────
  useEffect(() => {
    if (currentView !== 'client-downloads') return;
    const fmtDate = (d) => {
      if (!d) return '—';
      const dt = new Date(d);
      return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')}`;
    };
    const load = async () => {
      setDownloadsData(null);
      const [stPg, opPg, polPg] = await Promise.allSettled([
        strategicApi.getPageData(),
        operationalApi.getPageData(),
        policiesApi.getPageData(),
      ]);
      const items = [];

      if (stPg.status === 'fulfilled' && stPg.value.data.workflow?.status === 'completed') {
        const wf = stPg.value.data.workflow;
        items.push({ id: 'strategic', name: 'الوثيقة الاستراتيجية', icon: 'target', date: fmtDate(wf.completed_at), consultant: wf.consultant?.name || '—' });
      }

      if (opPg.status === 'fulfilled' && opPg.value.data.workflow?.status === 'completed') {
        const wf = opPg.value.data.workflow;
        items.push({ id: 'operational', name: 'الخطة التشغيلية', icon: 'cog', date: fmtDate(wf.completed_at), consultant: wf.consultant?.name || '—' });
      }

      if (polPg.status === 'fulfilled' && polPg.value.data.workflow) {
        const wf  = polPg.value.data.workflow;
        const sels = polPg.value.data.selections || [];
        sels.filter(s => s.status === 'approved').forEach(sel => {
          items.push({ id: `policy-${sel.id}`, selId: sel.id, name: sel.policy_type?.name || 'سياسة', icon: 'clipboard', date: fmtDate(sel.updated_at || sel.created_at), consultant: wf.consultant?.name || '—' });
        });
        if (polPg.value.data.design_file_url) {
          items.push({ id: 'policy-design', name: 'ملف التصميم الاحترافي', icon: 'palette', date: '—', consultant: wf.consultant?.name || '—', directUrl: polPg.value.data.design_file_url });
        }
      }

      setDownloadsData(items);
    };
    load();
  }, [currentView]);

  // ── notifications: fetch unread count globally + full list on page ───────────
  useEffect(() => {
    if (!authUser) return;
    const fetchUnread = () => notificationsApi.unreadCount().then(r => setUnreadCount(r.data.count)).catch(() => {});
    fetchUnread();
    notifPollRef.current = setInterval(fetchUnread, 30000);
    return () => clearInterval(notifPollRef.current);
  }, [authUser]);

  useEffect(() => {
    if (!['client-notifications', 'con-notifications', 'client-dash'].includes(currentView)) return;
    notificationsApi.getAll()
      .then(r => setNotifications(Array.isArray(r.data) ? r.data : Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => setNotifications([]));
  }, [currentView]);

  const handleMarkRead = (id) => {
    notificationsApi.markRead(id).catch(() => {});
    setNotifications(prev => prev?.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = () => {
    notificationsApi.markAllRead().catch(() => {});
    setNotifications(prev => prev?.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleDocDownload = async (item) => {
    if (item.directUrl) { window.open(item.directUrl, '_blank'); return; }
    const win = window.open('', '_blank');
    try {
      let res;
      if (item.id === 'strategic')          res = await strategicApi.getPdfLink();
      else if (item.id === 'operational')   res = await operationalApi.getPdfLink();
      else if (item.id.startsWith('policy-')) res = await policiesApi.getPdfLink(item.selId);
      win.location.href = res.data.url;
    } catch { win.close(); alert('حدث خطأ أثناء التحميل، حاول مرة أخرى.'); }
  };

  useEffect(() => {
    if (currentView !== 'client-dash') return;
    const load = async () => {
      const [stRes, opRes, polRes] = await Promise.allSettled([
        strategicApi.getProgress(),
        operationalApi.getProgress(),
        policiesApi.getPageData(),
      ]);

      const buildPhase = (title, pct, approved, total, unit, statusText, statusColor, onClick) => ({
        title, progress: pct, sub: `${approved}/${total} ${unit}`, status: statusText, statusColor, onClick,
      });

      let stPhase;
      if (stRes.status === 'rejected') {
        stPhase = buildPhase('التخطيط الاستراتيجي', 0, 0, 11, 'وحدات', 'لم يبدأ بعد', 'gray', () => navigate('strategic-roadmap'));
      } else {
        const d = stRes.value.data;
        const approved = d.approved_units || 0;
        const pct = d.status === 'completed' ? 100 : (d.progress_percent || 0);
        const st = d.status === 'completed' ? 'مكتمل' : (approved > 0 ? 'قيد العمل' : 'لم يبدأ بعد');
        const sc = d.status === 'completed' ? 'green' : (approved > 0 ? 'yellow' : 'gray');
        stPhase = buildPhase('التخطيط الاستراتيجي', pct, approved, 11, 'وحدات', st, sc, () => navigate('strategic-roadmap'));
        if (d.consultant) setDashConsultant(d.consultant);
      }

      let opPhase;
      if (opRes.status === 'rejected') {
        opPhase = buildPhase('التخطيط التشغيلي', 0, 0, 5, 'وحدات', 'لم يبدأ بعد', 'gray', () => navigate('operational-roadmap'));
      } else {
        const d = opRes.value.data;
        const approved = d.approved_units || 0;
        const pct = d.status === 'completed' ? 100 : (d.progress_percent || 0);
        const st = d.status === 'completed' ? 'مكتمل' : (approved > 0 ? 'قيد العمل' : 'لم يبدأ بعد');
        const sc = d.status === 'completed' ? 'green' : (approved > 0 ? 'yellow' : 'gray');
        opPhase = buildPhase('التخطيط التشغيلي', pct, approved, 5, 'وحدات', st, sc, () => navigate('operational-roadmap'));
      }

      let polPhase;
      if (polRes.status === 'rejected') {
        polPhase = buildPhase('السياسات واللوائح', 0, 0, 7, 'سياسات', 'لم يبدأ بعد', 'gray', () => navigate('policies-select'));
      } else {
        const d = polRes.value.data;
        const wf = d.workflow;
        const sels = d.selections || [];
        const total = wf?.selected_policies?.length || sels.length || 7;
        const approved = sels.filter(s => s.status === 'approved').length;
        const isCompleted = wf?.status === 'completed';
        const hasStarted = !!wf;
        const pct = isCompleted ? 100 : (total > 0 ? Math.round(approved / total * 100) : 0);
        const st = isCompleted ? 'مكتمل' : (hasStarted && approved > 0 ? 'قيد العمل' : (hasStarted ? 'جارٍ المعالجة' : 'لم يبدأ بعد'));
        const sc = isCompleted ? 'green' : (hasStarted && approved > 0 ? 'yellow' : (hasStarted ? 'blue' : 'gray'));
        polPhase = buildPhase('السياسات واللوائح', pct, approved, total || 7, 'سياسات', st, sc, () => navigate('policies-select'));
      }

      const raw = (r) => (r.status === 'fulfilled' ? r.value.data : null);
      setDashPhases([
        { ...stPhase,  key: 'strategic',   raw: raw(stRes) },
        { ...opPhase,  key: 'operational', raw: raw(opRes) },
        { ...polPhase, key: 'policies',    raw: raw(polRes) },
      ]);
    };
    load();
  }, [currentView]);

  // Early returns after ALL hooks
  // صفحتا الدخول والتسجيل: زر الرجوع في المتصفح/الجوال يغلقهما ويعيد الزائر إلى الصفحة التي جاء منها
  useEffect(() => {
    if (!authPage) {
      if (window.history.state?.dfAuth) window.history.replaceState(null, '', PUBLIC_PATHS[currentView] || '/');
      return undefined;
    }
    const path = PUBLIC_PATHS[authPage];
    if (window.history.state?.dfAuth) window.history.replaceState({ ...window.history.state, dfAuth: authPage }, '', path);
    else if (window.location.pathname === path) window.history.replaceState({ dfAuth: authPage, pushed: false }, '', path); // وصل مباشرة إلى /login
    else window.history.pushState({ dfAuth: authPage, pushed: true }, '', path);
    const onPop = (e) => { if (!e.state?.dfAuth) setAuthPage(null); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [authPage]);
  // عناوين URL للصفحات العامة: الرجوع/التقدم في المتصفح يبدّل الصفحة، والمستخدم المسجَّل يبقى على الجذر
  useEffect(() => {
    if (authUser) {
      if (window.location.pathname !== '/') window.history.replaceState({}, '', '/' + window.location.search);
      return undefined;
    }
    const onPop = (e) => {
      if (e.state?.dfAuth) { setAuthPage(e.state.dfAuth); return; }
      const v = viewFromPath(window.location.pathname);
      if (v === 'login' || v === 'register') { setAuthPage(v); return; }
      setCurrentView(v);
      sessionStorage.setItem('currentView', v);
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [authUser]);

  // عنوان الصفحة ووصفها ورابطها القانوني (SEO) حسب الصفحة المعروضة
  useEffect(() => { applySeo(authPage || (authUser ? 'app' : currentView)); }, [authPage, authUser, currentView]);

  const closeAuth = () => {
    if (window.history.state?.dfAuth && window.history.state.pushed) window.history.back();
    else setAuthPage(null);
  };
  const authGoHome = () => {
    setCurrentView('landing');
    sessionStorage.removeItem('currentView');
    closeAuth();
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.post('/auth/logout').catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('currentView');
    setAuthUser(null);
    setCurrentView('landing');
    setCurrentRole('client');
    setAuthPage(null);
    window.history.replaceState({}, '', '/');
  };

  const handleLogin = (user, options = {}) => {
    localStorage.setItem('user', JSON.stringify(user));
    setAuthUser(user);
    setAuthPage(null);
    window.history.replaceState({}, '', '/');
    if (user.role === 'admin') {
      setCurrentRole('admin');
      setCurrentView('admin-dash');
      sessionStorage.setItem('currentView', 'admin-dash');
    } else if (user.role === 'consultant') {
      setCurrentRole('consultant');
      setCurrentView('con-dash');
      sessionStorage.setItem('currentView', 'con-dash');
    } else {
      const targetView = options.needsProfile ? 'client-settings' : 'client-dash';
      setCurrentRole('client');
      setCurrentView(targetView);
      sessionStorage.setItem('currentView', targetView);
    }
  };

  useEffect(() => {
    if (!socialReturn || socialReturn.started) return;
    socialReturn.started = true; // مرة واحدة فقط (الرمز صالح لاستعمال واحد)
    if (socialReturn.error) { setAuthPage(socialReturn.intent); return; }
    api.post('/auth/social/exchange', { code: socialReturn.code })
      .then(r => {
        localStorage.setItem('token', r.data.token);
        localStorage.setItem('user', JSON.stringify(r.data.user));
        handleLogin(r.data.user, { needsProfile: r.data.needs_profile });
      })
      .catch(err => {
        setAuthError(err.response?.data?.message || 'تعذّر إكمال الدخول. حاول مرة أخرى.');
        setAuthPage('login');
      })
      .finally(() => setSocialBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // صفحة إعادة تعيين كلمة المرور — تُشغَّل إذا جاء المستخدم من رابط البريد
  if (socialBusy) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', background: '#FBF9F5', color: '#235D7F', fontWeight: 700, fontSize: 15 }} role="status">
      جارٍ تسجيل الدخول…
    </div>
  );
  if (resetParams) return (
    <ResetPasswordPage
      token={resetParams.token}
      email={resetParams.email}
      onDone={() => {
        window.history.replaceState({}, '', window.location.pathname);
        setResetParams(null);
        setAuthPage('login');
      }}
    />
  );
  if (authPage === 'login') return <Login key={authError || 'login'} initialError={authError} onLogin={handleLogin} onGoRegister={() => { setAuthError(null); setAuthPage('register'); }} onBack={() => { setAuthError(null); closeAuth(); }} onHome={() => { setAuthError(null); authGoHome(); }} />;
  if (authPage === 'register') return <Register key={authError || 'register'} initialError={authError} onLogin={handleLogin} onGoLogin={() => { setAuthError(null); setAuthPage('login'); }} onBack={() => { setAuthError(null); closeAuth(); }} onHome={() => { setAuthError(null); authGoHome(); }} />;

  const navigate = (view, role) => {
    // «ابدأ الآن» و«سجل الآن» في الصفحات العامة تفتح صفحتي التسجيل/الدخول الحقيقيتين
    if (view === 'login' || view === 'register') { setAuthPage(view); window.scrollTo(0, 0); return; }
    setCurrentView(view);
    sessionStorage.setItem('currentView', view);
    if (!authUser && PUBLIC_PATHS[view] && window.location.pathname !== PUBLIC_PATHS[view]) window.history.pushState({ dfView: view }, '', PUBLIC_PATHS[view]);
    if (role) setCurrentRole(role);
    setActiveUnit(null);
    if (view === 'strategic-roadmap') setStrategicWorkflowId(null);
    if (view === 'operational-roadmap') setOperationalWorkflowId(null);
    if (view === 'policies-select') setPolicyWorkflowId(null);
  };

  const handleUnitNavigate = (target) => {
    if (typeof target === 'string') {
      setChatAutoStart(target === 'client-chat');
      navigate(target);
    } else {
      setActiveUnit(target);
    }
  };

  // ============== SIDEBAR ==============
  const clientMenu = [
    { id: "client-dash",         label: "لوحة التحكم",          icon: Icons.home,        group: "رحلتي", short: "الرئيسية" },
    { id: "strategic-roadmap",   label: "التخطيط الاستراتيجي",  icon: Icons.strategic,   group: "رحلتي", short: "الاستراتيجي", permKey: "client.strategic.view"   },
    { id: "operational-roadmap", label: "التخطيط التشغيلي",     icon: Icons.operational, group: "رحلتي", short: "التشغيلي", permKey: "client.operational.view" },
    { id: "policies-select",     label: "السياسات واللوائح",    icon: Icons.policies,    group: "رحلتي", short: "السياسات", permKey: "client.policies.view"    },
    { id: "client-chat",         label: "المحادثات",             icon: Icons.chat,        group: "التواصل", permKey: "client.chat.view" },
    { id: "client-notifications",label: "الإشعارات",             icon: Icons.bell,        group: "التواصل" },
    { id: "client-downloads",    label: "التحميلات",             icon: Icons.download,    group: "حسابي" },
    { id: "client-payments",     label: "المدفوعات",             icon: Icons.payments,    group: "حسابي" },
    { id: "client-help",         label: "المساعدة",              icon: Icons.help,        group: "حسابي" },
    { id: "client-settings",     label: "الإعدادات",             icon: Icons.settings,    group: "حسابي" },
  ].filter(item => !item.permKey || can(item.permKey));

  const consultantMenu = [
    { id: "con-dash",          label: "لوحة التحكم",        icon: Icons.home,     group: "العمل", short: "الرئيسية" },
    { id: "con-pending",       label: "المراجعات المعلقة",  icon: Icons.content,  group: "العمل", short: "للمراجعة" },
    { id: "con-clients",       label: "العملاء والمهام",     icon: Icons.users,    group: "العمل", short: "العملاء" },
    { id: "con-completed",     label: "المراجعات المكتملة", icon: Icons.check,    group: "العمل" },
    { id: "con-chat",          label: "المحادثات",           icon: Icons.chat,     group: "التواصل", short: "المحادثات" },
    { id: "con-notifications", label: "الإشعارات",           icon: Icons.bell,     group: "التواصل" },
    { id: "con-earnings",      label: "الأرباح",             icon: Icons.payments, group: "حسابي" },
    { id: "con-stats",         label: "إحصائياتي",           icon: Icons.chart,    group: "حسابي" },
    { id: "con-settings",      label: "إعدادات الحساب",      icon: Icons.settings, group: "حسابي" },
    { id: "con-help",          label: "دليل الاستخدام",      icon: Icons.help,     group: "حسابي" },
  ];

  const adminMenu = [
    { id: "admin-dash",           label: "لوحة التحكم",       icon: Icons.home,     group: "نظرة عامة", short: "الرئيسية" },
    { id: "admin-outputs",        label: "مركز المخرجات",     icon: Icons.outputs,  group: "نظرة عامة", short: "المخرجات" },
    { id: "admin-reports",        label: "التقارير",          icon: Icons.chart,    group: "نظرة عامة" },
    { id: "admin-orgs",           label: "المنظمات (العملاء)", icon: Icons.building, group: "الأشخاص", short: "المنظمات" },
    { id: "admin-consultants",    label: "المستشارون",        icon: Icons.users,    group: "الأشخاص" },
    { id: "admin-users",          label: "المستخدمون والصلاحيات", icon: Icons.key,  group: "الأشخاص" },
    { id: "admin-finance",        label: "الإدارة المالية",   icon: Icons.payments, group: "المال", short: "المالية" },
    { id: "admin-services",       label: "الخدمات والأسعار",  icon: Icons.services, group: "المحتوى والخدمات" },
    { id: "admin-content",        label: "محتوى الوحدات",     icon: Icons.content,  group: "المحتوى والخدمات" },
    { id: "admin-questionnaires", label: "استبيانات السياسات", icon: Icons.policies, group: "المحتوى والخدمات" },
    { id: "admin-designs",        label: "طلبات التصميم",     icon: Icons.palette,  group: "المحتوى والخدمات" },
    { id: "admin-site-content",   label: "محتوى الموقع",      icon: Icons.globe,    group: "المحتوى والخدمات" },
    { id: "admin-faqs",           label: "الأسئلة الشائعة",   icon: Icons.help,     group: "المحتوى والخدمات" },
    { id: "admin-notifications",  label: "إرسال الإشعارات",   icon: Icons.bell,     group: "النظام" },
    { id: "admin-log",            label: "سجل العمليات",      icon: Icons.log,      group: "النظام" },
    { id: "admin-settings",       label: "إعدادات النظام",    icon: Icons.settings, group: "النظام" },
    { id: "admin-profile",        label: "ملفي الشخصي",       icon: Icons.user,     group: "النظام" },
    { id: "admin-help",           label: "دليل الاستخدام",    icon: Icons.help,     group: "النظام" },
  ];

  const menu = currentRole === "admin" ? adminMenu : currentRole === "consultant" ? consultantMenu : clientMenu;
  const isDashboard = !["landing", "about", "services", "pricing", "contact", "login", "register", "not-found"].includes(currentView);

  // ============== PUBLIC PAGES NAV / FOOTER / LANDING (src/pages/public) ==============
  const PublicNav = () => <PublicNavBar current={currentView} navigate={navigate} onLogin={() => setAuthPage("login")} onRegister={() => setAuthPage("register")} />;
  const PublicFooter = () => <PublicFooterBar sc={sc} navigate={navigate} />;
  const LandingPage = () => <Landing sc={sc} navigate={navigate} onRegister={() => setAuthPage("register")} PublicNav={PublicNav} PublicFooter={PublicFooter} />;

  // صفحة «غير موجودة» للمسارات غير المعروفة (الخادم يعيد index.html بحالة 404)
  const NotFoundPage = () => (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="geo-bg">
      <PublicNav />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 20px', gap: 14 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: colors.primary, lineHeight: 1 }} aria-hidden="true">404</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: colors.ink, margin: 0 }}>الصفحة غير موجودة</h1>
        <p style={{ color: colors.gray, fontSize: 15, maxWidth: 440, lineHeight: 1.9, margin: 0 }}>الرابط الذي فتحته غير صحيح أو لم يعد موجودًا. يمكنك العودة إلى الصفحة الرئيسية أو استعراض خدماتنا.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('landing'); window.scrollTo(0, 0); }} style={{ background: colors.amber, color: colors.ink, padding: '11px 22px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>الصفحة الرئيسية</a>
          <a href="/services" onClick={(e) => { e.preventDefault(); navigate('services'); window.scrollTo(0, 0); }} style={{ border: `1.5px solid ${colors.grayBorder}`, color: colors.ink, padding: '11px 22px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', background: '#fff' }}>الخدمات</a>
        </div>
      </main>
      <PublicFooter />
    </div>
  );

  // ============== ABOUT PAGE ==============
  const AboutPage = () => (
    <div style={{ width: "100%", minHeight: "100vh" }} className="geo-bg">
      <PublicNav />
      <div style={{ background: `linear-gradient(135deg, ${colors.primary}, #123247)`, padding: "50px 40px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: 32, fontWeight: 800 }}>عن منصة دفة</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginTop: 10 }}>{sc('about_hero_subtitle','للتخطيط الاستراتيجي وصناعة السياسات')}</p>
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "50px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 40, marginBottom: 50 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>رؤيتنا</h2>
            <p style={{ fontSize: 14, color: colors.gray, lineHeight: 2 }}>{sc('vision_text','أن نكون المنصة الرائدة في تمكين المنظمات غير الربحية.')}</p>
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>رسالتنا</h2>
            <p style={{ fontSize: 14, color: colors.gray, lineHeight: 2 }}>{sc('mission_text','نقدم نظاماً شبه آلي يوفر أدوات تخطيط متكاملة مع إشراف مستشارين متخصصين.')}</p>
          </div>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.ink, marginBottom: 20, textAlign: "center" }}>كيف يعمل النظام</h2>
        <div style={{ display: "grid", gridTemplateColumns: "var(--g-3)", gap: 16, marginBottom: 50 }}>
          {[
            {n:"1", t: sc('howworks1_title','نظام شبه آلي'),      d: sc('howworks1_desc','محتوى تعليمي مسجل مع نماذج عمل جاهزة')},
            {n:"2", t: sc('howworks2_title','إشراف المستشار'),    d: sc('howworks2_desc','مستشار متخصص يراجع عن بعد مخرجات كل مرحلة')},
            {n:"3", t: sc('howworks3_title','مخرجات احترافية'),   d: sc('howworks3_desc','وثائق نهائية مصممة تلقائياً')},
          ].map((s,i) => (
            <Card key={i} accent style={{ textAlign: "center", padding: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: colors.amber, color: "#0E2A3D", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontWeight: 800, fontSize: 18 }}>{s.n}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.ink, marginBottom: 8 }}>{s.t}</h3>
              <p style={{ fontSize: 13, color: colors.gray, lineHeight: 1.7 }}>{s.d}</p>
            </Card>
          ))}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.ink, marginBottom: 20, textAlign: "center" }}>فريق عمل النظام</h2>
        <Card style={{ padding: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ padding: "10px 28px", background: colors.primaryDeep, color: "white", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>مشرف النظام</div>
            <div style={{ width: 2, height: 20, background: colors.grayBorder }} />
            <div style={{ padding: "10px 28px", background: colors.amber, color: "#0E2A3D", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>المشرف الفني</div>
            <div style={{ width: 2, height: 20, background: colors.grayBorder }} />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {["إدارة التصميم", "المنسق الفني", "الدعم التقني", "الإدارة المالية"].map((d, i) => (
                <div key={i} style={{ padding: "8px 20px", background: colors.primaryDeep, color: "white", borderRadius: 8, fontSize: 12, fontWeight: 500 }}>{d}</div>
              ))}
            </div>
            <div style={{ width: 2, height: 20, background: colors.grayBorder }} />
            <div style={{ padding: "8px 20px", background: colors.primaryDeep, color: "white", borderRadius: 8, fontSize: 12 }}>المستشارين</div>
            <div style={{ width: 2, height: 20, background: colors.grayBorder }} />
            <div style={{ padding: "8px 20px", background: colors.primaryDeep, color: "white", borderRadius: 8, fontSize: 12 }}>الجهات الاستشارية</div>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "var(--g-4)", gap: 16, marginTop: 50 }}>
          {[
            {n: sc('stat1_n','120+'), l: sc('stat1_l','منظمة مستفيدة')},
            {n: sc('stat2_n','50+'),  l: sc('stat2_l','خطة مكتملة')},
            {n: sc('stat3_n','15+'),  l: sc('stat3_l','مستشار معتمد')},
            {n: sc('stat4_n','200+'), l: sc('stat4_l','سياسة مبنية')},
          ].map((s,i) => (
            <Card key={i} style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: colors.primary }}>{s.n}</div>
              <div style={{ fontSize: 13, color: colors.gray, marginTop: 4 }}>{s.l}</div>
            </Card>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );

  // ── السياسات المتاحة (حزمة سياسات دفة الإصدار 3.0) — من API ──────────────
  // الـ fallback عند تعذّر الاتصال: مجموعات الحزمة الأربع فقط
  const POLICY_GROUPS_FALLBACK = [
    { id: 'g1', name: 'الحوكمة واللوائح الأساسية' },
    { id: 'g2', name: 'المالية والامتثال' },
    { id: 'g3', name: 'الموارد البشرية والتطوع والسلامة' },
    { id: 'g4', name: 'التقنية والإعلام والأخلاقيات' },
  ];
  const allPolicies = publicPolicies.length > 0 ? publicPolicies : POLICY_GROUPS_FALLBACK;

  // ============== SERVICES PAGE ==============
  const ServicesPage = () => (
    <div style={{ width: "100%", minHeight: "100vh" }} className="geo-bg">
      <PublicNav />
      <div style={{ background: `linear-gradient(135deg, ${colors.primary}, #123247)`, padding: "50px 40px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: 32, fontWeight: 800 }}>خدمات منصة دفة</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginTop: 10 }}>{sc('services_hero_subtitle','ثلاثة أنظمة متكاملة لبناء منظمتك')}</p>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "50px 40px" }}>
        {/* Service 1 */}
        <Card accent style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: colors.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: colors.amberText }}><IcTarget width={36} height={36}/></div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.ink, marginBottom: 6 }}>نظام التخطيط الاستراتيجي</h2>
              <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, marginBottom: 16 }}>{sc('strategic_service_desc','بناء الخطة الاستراتيجية الكاملة للمنظمة من خلال 11 وحدة تخطيطية متسلسلة.')}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {strategicUnits.map(u => <Badge key={u.id} text={u.name} color="primary" small />)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: colors.primary }}>{sc('strategic_service_price','5,000')} ريال</span>
                <Btn small onClick={() => navigate("register")}>ابدأ الآن</Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* Service 2 */}
        <Card accent style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: colors.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: colors.amberText }}><IcCog width={36} height={36}/></div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.ink, marginBottom: 6 }}>نظام التخطيط التشغيلي</h2>
              <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, marginBottom: 16 }}>{sc('operational_service_desc','تحويل المبادرات الاستراتيجية إلى خطة تشغيلية مفصلة.')}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {operationalUnits.map(u => <Badge key={u.id} text={u.name} color="primary" small />)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: colors.primary }}>{sc('operational_service_price','3,500')} ريال</span>
                <Btn small onClick={() => navigate("register")}>ابدأ الآن</Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* Service 3 */}
        <Card accent style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: colors.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: colors.amberText }}><IcClipboard width={36} height={36}/></div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.ink, marginBottom: 6 }}>نظام بناء السياسات واللوائح</h2>
              <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, marginBottom: 16 }}>{sc('policies_service_desc','بناء السياسات واللوائح الداخلية عبر استبيانات ذكية موجهة.')}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {allPolicies.map(p => <Badge key={p.id} text={p.name} color="primary" small />)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 14, color: colors.gray }}>تسعير مستقل لكل سياسة — يبدأ من</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: colors.primary }}>{sc('policies_min_price','1,000')} ريال</span>
                <Btn small onClick={() => navigate("register")}>ابدأ الآن</Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* Unit Structure */}
        <Card style={{ padding: 32, textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.ink, marginBottom: 20 }}>هيكل الوحدة التخطيطية</h2>
          <p style={{ fontSize: 13, color: colors.gray, marginBottom: 20 }}>كل وحدة تخطيطية (في الأنظمة الثلاثة) تتكون من 6 مكونات + اعتماد المستشار</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {["نبذة", "شرح مكتوب", "إرشادات", "فيديو", "خدمة الدردشة", "نماذج عمل", "اعتماد المستشار"].map((c, i) => (
              <div key={i} style={{ padding: "10px 18px", borderRadius: 10, background: i === 6 ? colors.amber : colors.primaryDeep, color: "#0E2A3D", fontSize: 13, fontWeight: 600 }}>{c}</div>
            ))}
          </div>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );

  // ============== PRICING PAGE ==============
  const PricingPage = () => (
    <div style={{ width: "100%", minHeight: "100vh" }} className="geo-bg">
      <PublicNav />
      <div style={{ background: `linear-gradient(135deg, ${colors.primary}, #123247)`, padding: "50px 40px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: 32, fontWeight: 800 }}>الأسعار</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginTop: 10 }}>{sc('pricing_hero_subtitle','أسعار مناسبة لجميع المنظمات غير الربحية')}</p>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "50px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "var(--g-3)", gap: 20, marginBottom: 40 }}>
          {[
            { title: "التخطيط الاستراتيجي", price: sc('strategic_price','5,000'),   icon: <IcTarget width={36} height={36}/>, features: ["11 وحدة تخطيطية", "فيديوهات تعليمية", "شرح مكتوب وإرشادات", "نماذج عمل تفاعلية", "دردشة مع المستشار", "مراجعة واعتماد المستشار", "وثيقة استراتيجية نهائية"], popular: true },
            { title: "التخطيط التشغيلي",    price: sc('operational_price','3,500'), icon: <IcCog width={36} height={36}/>,    features: ["5 وحدات تخطيطية", "استيراد من الخطة الاستراتيجية", "مخطط جانت 12 شهر", "تعيين المسؤولين", "ميزانية تفصيلية", "مراجعة واعتماد المستشار", "وثيقة تشغيلية نهائية"], popular: false },
            { title: "السياسات واللوائح",    price: `من ${sc('policies_min_price','1,000')}`, icon: <IcClipboard width={36} height={36}/>, features: ["7 سياسات متاحة", "استبيانات ذكية موجهة", "توليد تلقائي للسياسة", "فيديوهات تعليمية", "مراجعة مستشار", "تسعير مستقل لكل سياسة", "تحميل PDF / Word"], popular: false },
          ].map((p, i) => (
            <Card key={i} style={{ padding: 28, border: p.popular ? `2px solid ${colors.amberLine}` : `1px solid ${colors.grayBorder}`, position: "relative", overflow: "visible" }}>
              {p.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: colors.amber, color: "#0E2A3D", padding: "4px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>الأكثر طلباً</div>}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <span style={{ color: colors.primary }}>{p.icon}</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: colors.ink, marginTop: 8 }}>{p.title}</h3>
                <div style={{ marginTop: 12 }}><span style={{ fontSize: 32, fontWeight: 800, color: colors.primary }}>{p.price}</span><span style={{ fontSize: 14, color: colors.gray }}> ريال</span></div>
              </div>
              {p.features.map((f, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: fi < p.features.length - 1 ? `1px solid ${colors.grayLight}` : "none" }}>
                  <span style={{ color: colors.green, display: "flex" }}><IcCheck width={14} height={14} /></span>
                  <span style={{ fontSize: 13, color: colors.ink }}>{f}</span>
                </div>
              ))}
              <Btn full style={{ marginTop: 20 }} onClick={() => navigate("register")}>{p.popular ? "ابدأ الآن" : "اشترك"}</Btn>
            </Card>
          ))}
        </div>

        <Card style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.ink, marginBottom: 14, textAlign: "center" }}>الخدمات الإضافية</h3>
          <div style={{ display: "grid", gridTemplateColumns: "var(--g-3)", gap: 16 }}>
            {[
              {t: sc('addon1_title','اعتماد الخطة من جهة استشارية'), p: sc('addon1_price','2,000'), d: sc('addon1_desc','اعتماد رسمي من جهة معتمدة')},
              {t: sc('addon2_title','تحكيم السياسات من مستشار'),      p: sc('addon2_price','2,000'), d: sc('addon2_desc','تحكيم ومراجعة متعمقة')},
              {t: sc('addon3_title','تصميم احترافي للوثائق'),          p: sc('addon3_price','1,500'), d: sc('addon3_desc','تصميم بهوية المنظمة')},
            ].map((a,i) => (
              <div key={i} style={{ padding: 16, background: colors.grayLight, borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>{a.t}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: colors.amberText, margin: "8px 0" }}>{a.p} ريال</div>
                <div style={{ fontSize: 11, color: colors.gray }}>{a.d}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.ink, marginBottom: 14 }}>تسعير السياسات واللوائح (مستقل)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["الرمز", "السياسة", "المجموعة", "السعر"].map(h => <th key={h} style={{ padding: "10px 12px", background: colors.primaryDeep, color: "white", fontSize: 12, textAlign: "right" }}>{h}</th>)}</tr></thead>
            <tbody>{publicPolicies.map((p, i) => (
              <tr key={p.id ?? i} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                <td style={{ padding: "10px 12px", fontSize: 11, color: colors.gray, direction: "ltr", textAlign: "right", whiteSpace: "nowrap" }}>{p.code}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: colors.gray }}>{p.group_name}</td>
                <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, color: colors.primary, whiteSpace: "nowrap" }}>{Number(p.price).toLocaleString('en-US')} ريال</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );

  // ============== CONTACT PAGE ==============
  const ContactPage = () => (
    <div style={{ width: "100%", minHeight: "100vh" }} className="geo-bg">
      <PublicNav />
      <div style={{ background: `linear-gradient(135deg, ${colors.primary}, #123247)`, padding: "50px 40px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: 32, fontWeight: 800 }}>تواصل معنا</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginTop: 10 }}>{sc('contact_hero_subtitle','نسعد بتواصلكم والإجابة على استفساراتكم')}</p>
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "50px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 30 }}>
          <Card style={{ padding: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.ink, marginBottom: 20 }}>أرسل رسالة</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 14 }}>
                <Input label="الاسم" placeholder="اسمك الكامل" />
                <Input label="المنظمة" placeholder="اسم المنظمة" />
              </div>
              <Input label="البريد الإلكتروني" placeholder="email@example.com" type="email" />
              <Input label="رقم الجوال" placeholder="+966 5X XXX XXXX" />
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: "block", marginBottom: 6 }}>الموضوع</label>
                <select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "inherit" }}>
                  <option>استفسار عام</option>
                  <option>استفسار عن الأسعار</option>
                  <option>طلب عرض تقديمي</option>
                  <option>مشكلة تقنية</option>
                  <option>اقتراح تطوير</option>
                  <option>أخرى</option>
                </select>
              </div>
              <Input label="الرسالة" textarea placeholder="اكتب رسالتك هنا بالتفصيل..." />
              <Btn full>إرسال الرسالة</Btn>
            </div>
          </Card>

          <div>
            <Card style={{ padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>معلومات التواصل</h3>
              {[
                { icon: <IcMail width={20} height={20}/>,  title: "البريد الإلكتروني", value: sc('contact_email','info@daffa.sa') },
                { icon: <IcPhone width={20} height={20}/>, title: "الهاتف",             value: sc('contact_phone','+966 55 XXX XXXX') },
                { icon: <IcMapPin width={20} height={20}/>,title: "العنوان",            value: sc('contact_address','الرياض، المملكة العربية السعودية') },
                { icon: <IcClock width={20} height={20}/>, title: "ساعات العمل",        value: sc('contact_hours','الأحد - الخميس: 8 ص - 5 م') },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < 3 ? `1px solid ${colors.grayLight}` : "none" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: colors.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", color: colors.amberText }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, color: colors.gray }}>{c.title}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>{c.value}</div>
                  </div>
                </div>
              ))}
            </Card>

            <Card style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.ink, marginBottom: 16 }}>تابعنا</h3>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "𝕏 تويتر",  href: sc('social_twitter','') },
                  { label: "لينكدإن",  href: sc('social_linkedin','') },
                  { label: "انستغرام", href: sc('social_instagram','') },
                ].map((s, i) => (
                  s.href
                    ? <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px 8px", background: colors.grayLight, borderRadius: 10, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 600, color: colors.ink, textDecoration: "none", display: "block" }}>{s.label}</a>
                    : <div key={i} style={{ flex: 1, padding: "12px 8px", background: colors.grayLight, borderRadius: 10, textAlign: "center", fontSize: 12, fontWeight: 600, color: colors.ink }}>{s.label}</div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: 24, marginTop: 16, background: `${colors.primary}08`, border: `1.5px solid ${colors.primary}20` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>هل تريد عرض تقديمي؟</h3>
              <p style={{ fontSize: 12, color: colors.gray, lineHeight: 1.7 }}>يمكننا تقديم عرض تفصيلي عن المنصة لفريقكم. تواصلوا معنا لتحديد موعد مناسب.</p>
              <Btn small variant="secondary" style={{ marginTop: 10 }}>طلب عرض تقديمي</Btn>
            </Card>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );


  // ============== CLIENT DASHBOARD ==============
  // ── «خطوتك التالية»: توصية واحدة واضحة لغير المتخصص ──
  const nextStepFor = (phases, notifs) => {
    if (!phases) return null;
    // الإشعارات قد تصل كمصفوفة أو كصفحة {data:[...]} أو لم تُحمَّل بعد — نطبّعها دائمًا إلى مصفوفة
    const list = Array.isArray(notifs) ? notifs : Array.isArray(notifs?.data) ? notifs.data : [];
    const revision = list.find(n => !n.read && /revision/.test(n.type || ''));
    const view = (k) => systems[k].view;
    if (revision) {
      const k = /^op_/.test(revision.type) ? 'operational' : /^policy/.test(revision.type) ? 'policies' : 'strategic';
      return { tone: 'amber', title: 'مستشارك طلب تعديلًا بسيطًا', text: `${revision.title}. اقرأ الملاحظات، عدّل المطلوب، ثم أعد الإرسال — التعديل جزء طبيعي من الرحلة.`, cta: 'افتح الملاحظات', go: view(k), sys: k };
    }
    for (const p of phases) {
      const r = p.raw;
      if (!r) continue;
      const started = p.key === 'policies' ? !!r.workflow : true;
      if (!started) continue;
      const step = p.key === 'policies' ? r.workflow?.current_step : r.current_step;
      const status = p.key === 'policies' ? r.workflow?.status : r.status;
      if (status === 'completed') continue;
      if (step && step < 3) return { tone: 'primary', title: `أكمل الاشتراك في ${systems[p.key].label}`, text: 'بقي اختيار مستشارك وإتمام الدفع، ثم تُفتح لك الوحدات مباشرة.', cta: 'أكمل الآن', go: view(p.key), sys: p.key };
      return { tone: 'primary', title: `تابع ${systems[p.key].label}`, text: `أنجزت ${p.sub}. افتح الوحدة التالية واتبع الشرح والفيديو ثم عبّئ النموذج — يُحفظ عملك تلقائيًا.`, cta: 'تابع من حيث توقفت', go: view(p.key), sys: p.key };
    }
    const done = phases.filter(p => p.progress >= 100);
    if (done.length) return { tone: 'green', title: 'وثائقك المعتمدة جاهزة', text: 'نزّل وثائقك بصيغة PDF من صفحة التحميلات، أو ابدأ خدمة أخرى متى شئت.', cta: 'اذهب إلى التحميلات', go: 'client-downloads' };
    return { tone: 'primary', title: 'ابدأ أول خطوة لمنظمتك', text: 'لا تعرف من أين تبدأ؟ ننصح بالتخطيط الاستراتيجي: يرسم وجهة منظمتك للسنوات القادمة. والخدمات الثلاث مستقلة، فابدأ بما تحتاجه الآن.', cta: 'ابدأ التخطيط الاستراتيجي', go: 'strategic-roadmap', sys: 'strategic' };
  };

  const ClientDashboard = () => {
    const next = nextStepFor(dashPhases, notifications);
    const firstName = authUser?.org_name || authUser?.rep_name || '';
    const sysIcons = { strategic: Icons.strategic, operational: Icons.operational, policies: Icons.policies };
    const sysDesc = {
      strategic: 'وجهة منظمتك لسنوات: الرؤية والأهداف والمبادرات',
      operational: 'خطة العمل السنوية: ماذا ومتى ومن وبكم',
      policies: 'لوائح وسياسات جاهزة تنظّم العمل الداخلي',
    };
    const notifBadge = { unit_approved: { text: "معتمد", color: "green" }, unit_revision: { text: "تعديل", color: "amber" }, op_approved: { text: "معتمد", color: "green" }, op_revision: { text: "تعديل", color: "amber" }, policy_approved: { text: "معتمد", color: "green" }, policy_revision: { text: "تعديل", color: "amber" }, workflow_completed: { text: "مكتمل", color: "green" }, op_workflow_completed: { text: "مكتمل", color: "green" }, admin_message: { text: "من الإدارة", color: "blue" }, message: { text: "رسالة", color: "blue" }, payment: { text: "دفع", color: "primary" } };
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ترحيب + خطوتك التالية */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, background: `linear-gradient(135deg, ${colors.ink} 0%, ${colors.primaryDeep} 100%)`, color: '#fff', padding: 'clamp(20px, 4vw, 32px)' }}>
          <RosetteShape size={300} color="#FFFFFF" opacity={0.07} style={{ position: 'absolute', left: -70, bottom: -110, animation: 'dfTurn 60s linear infinite' }} />
          <RosetteShape size={34} color="#FFFFFF" hub={colors.amber} opacity={0.9} style={{ position: 'absolute', left: 26, top: 22 }} />
          <div style={{ fontSize: 14, color: '#D6E4EE' }}>مرحبًا{firstName ? '،' : ''}</div>
          <h2 style={{ color: '#fff', fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700, margin: '2px 0 18px', maxWidth: '80%' }}>{firstName || 'بك في دفة'}</h2>
          {next ? (
            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 18, padding: 18, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: colors.ink, background: colors.amber, borderRadius: 999, padding: '3px 10px', marginBottom: 8 }}>خطوتك التالية</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{next.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.9, color: '#D9E8F1' }}>{next.text}</div>
              </div>
              <Btn large onClick={() => navigate(next.go)} iconEnd={<span style={{ fontSize: 18 }}>←</span>}>{next.cta}</Btn>
            </div>
          ) : <Loading text="نجهّز لك خطوتك التالية…" pad={20} />}
        </div>

        {/* الأنظمة الثلاثة */}
        <div>
          <SectionTitle help={<Help term="journey" />}>خدماتك</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "var(--g-3)", gap: 16 }}>
            {(dashPhases || [null, null, null]).map((s, i) => {
              const key = s?.key || ['strategic', 'operational', 'policies'][i];
              const sys = systems[key];
              return (
                <Card key={key} onClick={s ? s.onClick : undefined} style={{ padding: 20, borderTop: `4px solid ${sys.color}`, opacity: s ? 1 : 0.55, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: sys.soft, color: sys.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{sysIcons[key]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.ink, display: 'flex', alignItems: 'center' }}>{sys.label}<Help term={key === 'strategic' ? 'strategic_plan' : key === 'operational' ? 'operational_plan' : 'policies'} /></h3>
                      <div style={{ fontSize: 13, color: colors.gray, lineHeight: 1.7 }}>{sysDesc[key]}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}><ProgressBar percent={s?.progress || 0} color={sys.color} /></div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: colors.ink }}>{s?.progress || 0}٪</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: colors.gray }}>{s?.sub || '—'}</span>
                    {s && <Badge text={s.status} color={s.statusColor === 'yellow' ? 'amber' : s.statusColor} small dot />}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "var(--g-2-1)", gap: 16 }}>
          <Card>
            <SectionTitle action={<Btn small variant="ghost" onClick={() => navigate('client-notifications')}>عرض الكل</Btn>}>آخر النشاطات</SectionTitle>
            {!notifications ? <Loading pad={20} /> : notifications.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: colors.gray, fontSize: 14 }}>لا توجد نشاطات بعد — ستظهر هنا اعتمادات المستشار ورسائله.</div>
            ) : notifications.slice(0, 5).map((n, i, arr) => {
              const b = notifBadge[n.type] || { text: "إشعار", color: "gray" };
              return (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${colors.grayBorder}` : "none" }}>
                  <Badge text={b.text} color={b.color} small />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: colors.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: n.read ? 400 : 600 }}>{n.title}</span>
                  <span style={{ fontSize: 12, color: colors.gray, flexShrink: 0 }}>{n.time}</span>
                </div>
              );
            })}
          </Card>

          <Card>
            <SectionTitle help={<Help term="consultant" />}>مستشارك</SectionTitle>
            {!dashConsultant ? (
              <div style={{ padding: '12px 0', color: colors.gray, fontSize: 14, lineHeight: 1.9 }}>ستختار مستشارك عند الاشتراك في أي خدمة، وسيظهر هنا للتواصل معه مباشرة.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: "center" }}>
                {dashConsultant.avatar ? (
                  <img src={`${import.meta.env.VITE_STORAGE_URL || ''}/storage/${dashConsultant.avatar}`} alt={dashConsultant.name} style={{ width: 72, height: 72, borderRadius: 22, objectFit: "cover", marginBottom: 12 }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: 22, background: colors.primaryTint, color: colors.primary, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28 }}>
                    {dashConsultant.avatar_initial || (dashConsultant.name || '').charAt(0)}
                  </div>
                )}
                <h4 style={{ fontSize: 16, fontWeight: 700, color: colors.ink }}>{dashConsultant.name}</h4>
                <p style={{ fontSize: 13, color: colors.gray, margin: "2px 0 8px" }}>{dashConsultant.specialty || 'مستشار معتمد'}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 14, color: colors.amber }} data-tip={`التقييم ${dashConsultant.rating || 0} من 5`}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ opacity: s <= Math.round(dashConsultant.rating || 0) ? 1 : 0.25, display: 'flex' }}>{Icons.star}</span>)}
                </div>
                <Btn variant="secondary" full onClick={() => navigate("client-chat")} icon={Icons.chat}>راسل مستشارك</Btn>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  };

  // وحدات التخطيط الاستراتيجي الإحدى عشرة — تظهر كشارات في بطاقة الخدمة بصفحة الخدمات
  const strategicUnits = [{ id: 1, name: "تحليل البيئة الداخلية" }, { id: 2, name: "تحليل البيئة الخارجية" }, { id: 3, name: "دراسة الاحتياجات المجتمعية" }, { id: 4, name: "بناء نظرية التغيير" }, { id: 5, name: "التحليل الاستراتيجي" }, { id: 6, name: "التوجهات الاستراتيجية" }, { id: 7, name: "المبادرات الاستراتيجية" }, { id: 8, name: "نموذج عمل المنظمة" }, { id: 9, name: "مؤشرات الأداء" }, { id: 10, name: "الهيكل التنظيمي" }, { id: 11, name: "الوثيقة الاستراتيجية" }];
  // وحدات التخطيط التشغيلي الخمس — تظهر كشارات في بطاقة الخدمة بصفحة الخدمات
  const operationalUnits = [{ id: 1, name: "المبادرات الاستراتيجية في التخطيط التشغيلي" }, { id: 2, name: "المبادرات التشغيلية" }, { id: 3, name: "الجدول الزمني للتنفيذ" }, { id: 4, name: "مسؤول التنفيذ" }, { id: 5, name: "التكلفة المالية" }];

  // ============== GENERIC PAGES ==============
  const AccessDenied = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 14, color: colors.gray }}>
      <div style={{ color: colors.gray }}><IcLock width={48} height={48}/></div>
      <div style={{ fontSize: 17, fontWeight: 700, color: colors.ink }}>غير مصرح بالوصول</div>
      <div style={{ fontSize: 13 }}>ليس لديك صلاحية لعرض هذه الصفحة</div>
    </div>
  );

  // ============== RENDER ==============
  const renderContent = () => {
    if (activeUnit) return <UnitPageDynamic unit={activeUnit} onBack={() => setActiveUnit(null)} onNavigate={handleUnitNavigate} workflowId={strategicWorkflowId} />;

    switch (currentView) {
      case "landing": return <LandingPage />;
      case "about": return <AboutPage />;
      case "not-found": return <NotFoundPage />;
      case "services": return <ServicesPage />;
      case "pricing": return <PricingPage />;
      case "contact": return <ContactPage />;
      case "login": case "register": return <LandingPage />;
      // ── جميع هذه الصفحات يديرها KeepAlive في الـ render ──
      case "client-dash":
      case "strategic-roadmap": case "operational-roadmap": case "policies-select":
      case "client-chat": case "con-chat":
      case "client-payments":
      case "client-settings": case "con-settings": case "admin-profile":
      case "con-dash": case "con-clients":
      case "con-pending": case "con-completed": case "con-earnings": case "con-stats":
      case "admin-dash": case "admin-outputs": case "admin-orgs": case "admin-consultants":
      case "admin-questionnaires": case "admin-designs":
      case "admin-finance": case "admin-reports":
      case "admin-users": case "admin-services": case "admin-content": case "admin-site-content":
      case "admin-notifications": case "admin-log": case "admin-settings": case "admin-faqs":
        return null;
      case "con-notifications":
      case "client-notifications": {
        const NotifIcon = ({ type }) => {
          const approved = (c) => (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${c}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
          );
          const revision = (c) => (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${c}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          );
          const completed = (c) => (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${c}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
          );
          const message = () => (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${colors.blue}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.blue} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
          );
          const payment = () => (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${colors.primary}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
          );
          const adminMsg = () => (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${colors.amber}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.amberText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
            </div>
          );
          const map = {
            unit_approved: () => approved(colors.green),
            unit_revision: () => revision(colors.amberText),
            op_approved:   () => approved(colors.green),
            op_revision:   () => revision(colors.amberText),
            policy_approved: () => approved(colors.green),
            policy_revision: () => revision(colors.amberText),
            workflow_completed: () => completed(colors.green),
            op_workflow_completed: () => completed(colors.green),
            admin_message: adminMsg,
            message: message,
            payment: payment,
          };
          const render = map[type];
          return render ? render() : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${colors.gray}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.gray} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
          );
        };
        const notifMeta = {
          unit_approved:         { border: colors.green  },
          unit_revision:         { border: colors.amberLine },
          op_approved:           { border: colors.green  },
          op_revision:           { border: colors.amberLine },
          policy_approved:       { border: colors.green  },
          policy_revision:       { border: colors.amberLine },
          workflow_completed:    { border: colors.green  },
          op_workflow_completed: { border: colors.green  },
          admin_message:         { border: colors.amberLine },
          message:               { border: colors.blue   },
          payment:               { border: colors.primary   },
        };
        return (
          <GenericPage title="الإشعارات">
            {!notifications ? (
              <div style={{ padding: 60, textAlign: "center", color: colors.gray, fontSize: 13 }}>جارٍ التحميل…</div>
            ) : notifications.length === 0 ? (
              <Card style={{ padding: 60, textAlign: "center" }}>
                <div style={{ marginBottom: 12, color: colors.gray }}><IcBell width={40} height={40}/></div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink, marginBottom: 6 }}>لا توجد إشعارات بعد</div>
                <div style={{ fontSize: 12, color: colors.gray }}>ستظهر هنا إشعارات اعتماد الوحدات والرسائل والتحديثات</div>
              </Card>
            ) : (
              <>
                {notifications.some(n => !n.read) && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                    <Btn small variant="ghost" onClick={handleMarkAllRead}>تعليم الكل كمقروء</Btn>
                  </div>
                )}
                {notifications.map((n) => {
                  const meta = notifMeta[n.type] || { border: colors.gray };
                  return (
                    <Card
                      key={n.id}
                      onClick={() => !n.read && handleMarkRead(n.id)}
                      style={{ marginBottom: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: n.read ? "default" : "pointer", borderRight: `3px solid ${meta.border}`, background: n.read ? colors.white : `${meta.border}08`, transition: "background 0.2s" }}
                    >
                      <NotifIcon type={n.type} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: colors.ink }}>{n.title}</div>
                        {n.body && <div style={{ fontSize: 12, color: colors.gray, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: colors.gray }}>{n.time}</span>
                        {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.amber, display: "inline-block" }} />}
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </GenericPage>
        );
      }
      // ======= CLIENT: التحميلات =======
      case "client-downloads": return (
        <GenericPage title="التحميلات">
          {!downloadsData ? (
            <div style={{ padding: 60, textAlign: "center", color: colors.gray, fontSize: 13 }}>جارٍ التحميل…</div>
          ) : downloadsData.length === 0 ? (
            <Card style={{ padding: 60, textAlign: "center" }}>
              <div style={{ marginBottom: 12, color: colors.gray }}><IcFolder width={40} height={40}/></div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink, marginBottom: 6 }}>لا توجد وثائق متاحة بعد</div>
              <div style={{ fontSize: 12, color: colors.gray }}>ستظهر وثائقك هنا بعد اعتماد كل مرحلة من مستشارك</div>
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 14 }}>
              {downloadsData.map((d) => {
                const dlIconMap = { target: <IcTarget width={24} height={24}/>, cog: <IcCog width={24} height={24}/>, clipboard: <IcClipboard width={24} height={24}/>, palette: <IcPalette width={24} height={24}/> };
                return (
                <Card key={d.id} accent style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primaryDeep, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>{dlIconMap[d.icon] || <IcDocument width={24} height={24}/>}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: colors.gray }}>PDF • {d.date} • {d.consultant}</div>
                    </div>
                  </div>
                  <Btn small onClick={() => handleDocDownload(d)}>تحميل</Btn>
                </Card>
                );
              })}
            </div>
          )}
        </GenericPage>
      );

      // ======= CLIENT: المساعدة =======
      case "client-help": return <ClientHelpPage />;
      case "con-help":   return <GenericPage title="دليل الاستخدام"><RoleGuide role="consultant" /></GenericPage>;
      case "admin-help": return <GenericPage title="دليل الاستخدام"><RoleGuide role="admin" /></GenericPage>;


      default: return (
        <GenericPage title={menu.find(m => m.id === currentView)?.label || "الصفحة"}>
          <Card>
            <div style={{ textAlign: "center", padding: 40, color: colors.gray }}>
              <div style={{ marginBottom: 16, color: colors.gray }}><IcDocument width={48} height={48}/></div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>محتوى الصفحة</h3>
              <p style={{ fontSize: 13 }}>الصفحة غير موجودة</p>
            </div>
          </Card>
        </GenericPage>
      );
    }
  };

  // ============== MODALS RENDERING ==============
  const ModalContent = () => {
    if (!modal) return null;
    const close = () => setModal(null);

    if (modal.type === "add-org" || modal.type === "edit-org") return (
      <Modal open title={modal.type === "add-org" ? "إضافة منظمة جديدة" : `تعديل: ${modal.data?.name}`} onClose={close} wide>
        <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 14 }}>
          <Input label="اسم المنظمة" placeholder="اسم المنظمة" value={modal.data?.name} />
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: "block", marginBottom: 6 }}>نوع المنظمة</label><select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "inherit" }}><option>جهة غير ربحية</option><option>مؤسسة وقفية</option><option>شركة اجتماعية</option></select></div>
          <Input label="اسم الممثل" placeholder="الاسم الكامل" />
          <Input label="البريد الإلكتروني" placeholder="email@org.sa" type="email" />
          <Input label="رقم الجوال" placeholder="+966 5X XXX XXXX" />
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: "block", marginBottom: 6 }}>القطاع</label><select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "inherit" }}><option>تعليم</option><option>صحة</option><option>تنمية اجتماعية</option><option>بيئة</option><option>ثقافة</option></select></div>
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: "block", marginBottom: 6 }}>حجم المنظمة</label><select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "inherit" }}><option>أقل من 10</option><option>10-50</option><option>51-200</option><option>أكثر من 200</option></select></div>
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: "block", marginBottom: 6 }}>الحالة</label><select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "inherit" }}><option>نشط</option><option>معلق</option><option>موقوف</option></select></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={close}>إلغاء</Btn>
          <Btn onClick={close}>{modal.type === "add-org" ? "إضافة المنظمة" : "حفظ التعديلات"}</Btn>
        </div>
      </Modal>
    );

    if (modal.type === "view-org") return (
      <Modal open title={`تفاصيل: ${modal.data?.name}`} onClose={close} wide>
        <div style={{ display: "grid", gridTemplateColumns: "var(--g-3)", gap: 14, marginBottom: 20 }}>
          {[{l:"النوع",v:modal.data?.type},{l:"القطاع",v:modal.data?.sector},{l:"التسجيل",v:modal.data?.date},{l:"الخدمات",v:modal.data?.services},{l:"المستشار",v:modal.data?.consultant},{l:"الحالة",v:modal.data?.status}].map((f,i) => (
            <div key={i} style={{ padding: 12, background: colors.grayLight, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: colors.gray }}>{f.l}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink, marginTop: 4 }}>{f.v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small variant="secondary" onClick={() => setModal({ type: "edit-org", data: modal.data })}>تعديل</Btn>
          <Btn small variant="ghost">إرسال إشعار</Btn>
          <Btn small variant="ghost">إعادة تعيين كلمة المرور</Btn>
        </div>
      </Modal>
    );

    if (modal.type === "add-consultant") return (
      <Modal open title="إضافة مستشار جديد" onClose={close} wide>
        <div style={{ display: "grid", gridTemplateColumns: "var(--g-2)", gap: 14 }}>
          <Input label="اسم المستشار" placeholder="الاسم الكامل" />
          <Input label="البريد الإلكتروني" placeholder="email@example.com" type="email" />
          <Input label="رقم الجوال" placeholder="+966 5X XXX XXXX" />
          <Input label="سنوات الخبرة" placeholder="10" type="number" />
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: "block", marginBottom: 6 }}>التخصصات</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["تخطيط استراتيجي", "تخطيط تشغيلي", "سياسات HR", "حوكمة", "سياسات مالية", "سياسات إعلامية"].map((s, i) => (
                <label key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: `1px solid ${colors.grayBorder}`, cursor: "pointer", fontSize: 11 }}>
                  <input type="checkbox" defaultChecked={i < 2} style={{ accentColor: colors.primary }} />{s}
                </label>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: "1/-1" }}><Input label="نبذة عن المستشار" textarea placeholder="خبرة ومؤهلات المستشار..." /></div>
          <Input label="كلمة المرور" type="password" placeholder="••••••••" />
          <Input label="تأكيد كلمة المرور" type="password" placeholder="••••••••" />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={close}>إلغاء</Btn>
          <Btn onClick={close}>إضافة المستشار</Btn>
        </div>
      </Modal>
    );

    if (modal.type === "add-user") return (
      <Modal open title="إضافة مستخدم جديد" onClose={close}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="الاسم" placeholder="الاسم الكامل" />
          <Input label="البريد الإلكتروني" placeholder="email@example.com" type="email" />
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.ink, display: "block", marginBottom: 6 }}>الدور</label><select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "inherit" }}><option>عميل</option><option>مستشار</option><option>مشرف فني</option><option>مدير نظام</option></select></div>
          <Input label="كلمة المرور" type="password" placeholder="••••••••" />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={close}>إلغاء</Btn>
          <Btn onClick={close}>إضافة المستخدم</Btn>
        </div>
      </Modal>
    );

    if (modal.type === "confirm-delete") return (
      <Modal open title="تأكيد الحذف" onClose={close}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: colors.redLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: colors.red }}><IcWarning width={28} height={28}/></div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.ink, marginBottom: 8 }}>هل أنت متأكد من الحذف؟</h3>
          <p style={{ fontSize: 13, color: colors.gray }}>لا يمكن التراجع عن هذا الإجراء</p>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="secondary" onClick={close}>إلغاء</Btn>
          <Btn variant="danger" onClick={close}>نعم، احذف</Btn>
        </div>
      </Modal>
    );

    return null;
  };

  // ── توست "انتهت الجلسة" — يظهر في جميع الحالات حتى لو المستخدم على الـ landing ──
  const sessionToastEl = !sessionExpired ? null : (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: '#0E2A3D', color: '#fff', borderRadius: 14,
      padding: '14px 28px', fontSize: 14, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(14,42,61,0.3)',
      zIndex: 99999, direction: 'rtl', fontFamily: "inherit",
      animation: 'fadeInUp 0.35s ease',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 20 }}><DfIcon name="lock" size={20} /></span>
      <div>
        <div>انتهت جلستك — يرجى تسجيل الدخول مجدداً</div>
        <div style={{ fontSize: 11, color: '#8C97A3', marginTop: 2 }}>تم تسجيل خروجك تلقائياً لحماية حسابك</div>
      </div>
      <button
        onClick={() => { setSessionExpired(false); setAuthPage('login'); }}
        style={{ marginRight: 8, padding: '6px 16px', background: colors.amber, color: '#0E2A3D', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "inherit" }}>
        دخول
      </button>
      <button onClick={() => setSessionExpired(false)}
        style={{ background: 'none', border: 'none', color: '#8C97A3', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
    </div>
  );

  if (!isDashboard) return <>{renderContent()}<ModalContent /><TipLayer />{sessionToastEl}</>;

  const bottomTabs = currentRole === "admin"
    ? ["admin-dash", "admin-outputs", "admin-orgs", "admin-finance"]
    : currentRole === "consultant"
    ? ["con-dash", "con-pending", "con-clients", "con-chat"]
    : ["client-dash", "strategic-roadmap", "operational-roadmap", "policies-select"];
  const homeView = currentRole === "admin" ? "admin-dash" : currentRole === "consultant" ? "con-dash" : "client-dash";
  const profileView = currentRole === "admin" ? "admin-profile" : currentRole === "consultant" ? "con-settings" : "client-settings";

  return (
    <>
      <AppShell
        role={currentRole}
        authUser={authUser}
        menu={menu}
        currentView={currentView}
        onNavigate={navigate}
        onLogout={handleLogout}
        onHome={homeView}
        onProfile={profileView}
        title={menu.find(m => m.id === currentView)?.label || activeUnit?.name || "لوحة التحكم"}
        breadcrumb={activeUnit ? "التخطيط الاستراتيجي" : undefined}
        unreadCount={unreadCount}
        onNotifications={() => navigate(currentRole === 'client' ? 'client-notifications' : currentRole === 'consultant' ? 'con-notifications' : 'admin-notifications')}
        onPreview={() => window.open(window.location.origin + '?preview=1', '_blank')}
        onGlossary={() => setGlossaryOpen(true)}
        onTour={() => setTourKey(k => k + 1)}
        bottomTabs={bottomTabs.map(id => menu.find(m => m.id === id)).filter(Boolean)}
      >
          <Suspense fallback={<Loading />}>
          {/* شريط التحميل العلوي — يظهر عند كل تنقل */}
          <div
            key={`nav-${currentView}-${activeUnit?.id ?? 0}`}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 20,
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.amber})`,
              transformOrigin: 'right',
              animation: 'navBar 0.55s cubic-bezier(0.4,0,0.2,1) forwards',
              pointerEvents: 'none',
            }}
          />

          {/* ═══════════════════════════════════════════════════════════════
              Keep-alive: كل الصفحات المهمة تبقى مشغّلة بعد أول زيارة
              وتُخفى بـ CSS فقط — بدون أي إعادة تحميل عند التنقل
          ═══════════════════════════════════════════════════════════════ */}

          {/* ── خدمات العميل الثلاث ── */}
          <KeepAlive active={currentView === 'strategic-roadmap' && !activeUnit}>
            {currentRole !== 'client' || can('client.strategic.view')
              ? <StrategicRoadmapDynamic activeUnit={activeUnit} setActiveUnit={setActiveUnit} navigate={navigate} workflowId={strategicWorkflowId} onWorkflowSelect={setStrategicWorkflowId} />
              : <AccessDenied />}
          </KeepAlive>
          <KeepAlive active={currentView === 'operational-roadmap'}>
            {currentRole !== 'client' || can('client.operational.view')
              ? <OperationalRoadmapDynamic navigate={navigate} workflowId={operationalWorkflowId} onWorkflowSelect={setOperationalWorkflowId} />
              : <AccessDenied />}
          </KeepAlive>
          <KeepAlive active={currentView === 'policies-select'}>
            {currentRole !== 'client' || can('client.policies.view')
              ? <PoliciesRoadmapDynamic navigate={navigate} workflowId={policyWorkflowId} onWorkflowSelect={setPolicyWorkflowId} />
              : <AccessDenied />}
          </KeepAlive>

          {/* ── لوحات التحكم الرئيسية ── */}
          <KeepAlive active={currentView === 'client-dash'}>
            <ClientDashboard />
          </KeepAlive>
          <KeepAlive active={currentView === 'con-dash'}>
            <ConsultantDashboard />
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-dash'}>
            <AdminDashboardPage />
          </KeepAlive>

          {/* ── صفحات العميل ── */}
          <KeepAlive active={currentView === 'client-payments'}>
            <ClientPaymentsPage />
          </KeepAlive>
          <KeepAlive active={currentView === 'client-chat' || currentView === 'con-chat'}>
            {currentRole === 'client' && !can('client.chat.view')
              ? <AccessDenied />
              : <ChatPage role={currentRole} userId={authUser?.id} canSend={currentRole !== 'client' || can('client.chat.send')} autoStart={chatAutoStart} />}
          </KeepAlive>

          {/* ── صفحات المستشار ── */}
          <KeepAlive active={currentView === 'con-clients'}>
            <ConsultantClients navigate={v => { setCurrentView(v); sessionStorage.setItem('currentView', v); }} />
          </KeepAlive>
          <KeepAlive active={currentView === 'con-pending'}>
            <ConsultantReviewsPage mode="pending" />
          </KeepAlive>
          <KeepAlive active={currentView === 'con-completed'}>
            <ConsultantReviewsPage mode="completed" />
          </KeepAlive>
          <KeepAlive active={currentView === 'con-earnings'}>
            <ConsultantEarningsPage />
          </KeepAlive>
          <KeepAlive active={currentView === 'con-stats'}>
            <ConsultantStatsPage />
          </KeepAlive>

          {/* ── صفحات الأدمن ── */}
          <KeepAlive active={currentView === 'admin-outputs'}>
            <AdminOutputs />
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-orgs'}>
            <AdminOrgs />
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-consultants'}>
            <AdminConsultants />
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-users'}>
            <AdminUsers />
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-questionnaires'}>
            <AdminQuestionnaire />
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-designs'}>
            <GenericPage title="طلبات التصميم"><AdminPolicyDesigns /></GenericPage>
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-finance'}>
            <AdminFinancePage />
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-reports'}>
            <AdminReportsPage />
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-services'}>
            <GenericPage title=""><AdminServices /></GenericPage>
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-content'}>
            <GenericPage title=""><AdminContent /></GenericPage>
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-site-content'}>
            <GenericPage title=""><AdminSiteContent /></GenericPage>
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-notifications'}>
            <AdminNotificationsPage />
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-log'}>
            <AdminActivityLogPage />
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-settings'}>
            <GenericPage title=""><AdminSettings /></GenericPage>
          </KeepAlive>
          <KeepAlive active={currentView === 'admin-faqs'}>
            <AdminFaqsPage />
          </KeepAlive>

          {/* ── الإعدادات (مشترك بين جميع الأدوار) ── */}
          <KeepAlive active={['client-settings', 'con-settings', 'admin-profile'].includes(currentView)}>
            <ProfilePage authUser={authUser} onUpdate={(updated) => { localStorage.setItem('user', JSON.stringify(updated)); setAuthUser(updated); }} />
          </KeepAlive>

          {/* ── الصفحات التي لا تحتاج keep-alive ── */}
          {(activeUnit || !KA_VIEWS.has(currentView)) && (
            <div key={`${currentView}-${activeUnit?.id ?? 0}`} className="page-in">
              {renderContent()}
            </div>
          )}
          </Suspense>
      </AppShell>
      <ModalContent />
      <Suspense fallback={null}>
        {glossaryOpen && <GlossaryDrawer open onClose={() => setGlossaryOpen(false)} />}
        <OnboardingTour key={tourKey} role={currentRole} force={tourKey > 0} navigate={navigate} />
      </Suspense>
      <TipLayer />
      {sessionToastEl}
    </>
  );
}
