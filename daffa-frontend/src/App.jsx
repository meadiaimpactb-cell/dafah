import React, { useState, useEffect, useRef } from "react";
import { cleanupLegacyPermissions, usePermissions } from "./utils/permissions";
import { IcClock, IcUpload, IcSearch, IcCheckCircle, IcArrowPath, IcXMark, IcCheck, IcStar, IcSparkles, IcPalette, IcTarget, IcBuilding, IcBuildingLib, IcUser, IcBriefcase, IcMail, IcPhone, IcDownload, IcDocument, IcClipboard, IcShield, IcLock, IcKey, IcWarning, IcChat, IcLightbulb, IcCog, IcBeaker, IcChartBar, IcTrash, IcPencil, IcPlus, IcSave, IcMapPin, IcCalendar, IcCreditCard, IcFolder, IcBell, IcMoney, IcBars } from "./utils/icons";
import api from "./api/axios";
import { strategicApi } from "./api/strategic";
import { operationalApi } from "./api/operational";
import { policiesApi } from "./api/policies";
import { notificationsApi } from "./api/notifications";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import StrategicRoadmapDynamic from "./pages/strategic/StrategicRoadmap";
import UnitPageDynamic from "./pages/strategic/UnitPage";
import OperationalRoadmapDynamic from "./pages/operational/OperationalRoadmap";
import PoliciesRoadmapDynamic from "./pages/policies/PoliciesRoadmap";
import AdminConsultants from "./pages/admin/AdminConsultants";
import AdminOrgs from "./pages/admin/AdminOrgs";
import AdminServices from "./pages/admin/AdminServices";
import AdminContent from "./pages/admin/AdminContent";
import ConsultantDashboard from "./pages/consultant/ConsultantDashboard";
import ConsultantClients from "./pages/consultant/ConsultantClients";
import ConsultantReviewsPage from "./pages/consultant/ConsultantReviewsPage";
import ChatPage from "./pages/chat/ChatPage";
import ProfilePage from "./pages/profile/ProfilePage";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSiteContent from "./pages/admin/AdminSiteContent";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPolicyDesigns from "./pages/admin/AdminPolicyDesigns";

// ============== ICONS ==============
const Icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  services: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  ),
  strategic: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
  ),
  operational: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  ),
  policies: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  payments: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  ),
  download: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
  help: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  lock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  send: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
  ),
  arrow: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  ),
  star: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#F1C40F" stroke="#F1C40F" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  ),
  menu: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  play: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
  ),
  clip: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
  ),
  content: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  ),
  log: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 8 12 12 14 14"/><circle cx="12" cy="12" r="10"/></svg>
  ),
};

const Rosette = ({ size = 40, white }) => (
  <img src="/logo.png" alt="دفة" style={{ width: size, height: size, objectFit: "contain", filter: white ? "brightness(0) invert(1)" : "none" }} />
);

const Logo = ({ size = "md", white }) => {
  const s = size === "lg" ? 90 : size === "md" ? 64 : 44;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <img src="/logo.png" alt="دفة" style={{ width: s, height: s, objectFit: "contain", filter: white ? "brightness(0) invert(1)" : "none" }} />
    </div>
  );
};

// ============== STYLES ==============
const colors = {
  teal: "#1A6B7C",
  tealDark: "#145A68",
  tealCard: "#1E5E6E",
  orange: "#E8713A",
  orangeLight: "#FDF0E8",
  bg: "#F8FAFB",
  white: "#FFFFFF",
  gray: "#6B7280",
  grayLight: "#F3F4F6",
  grayBorder: "#E5E7EB",
  green: "#10B981",
  greenLight: "#D1FAE5",
  blue: "#3B82F6",
  blueLight: "#DBEAFE",
  yellow: "#F59E0B",
  yellowLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #root { width: 100%; height: 100%; font-family: 'Cairo', sans-serif; direction: rtl; background: ${colors.bg}; }

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: ${colors.teal}33; border-radius: 10px; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes navBar { from { transform: scaleX(0); opacity: 1; } 80% { transform: scaleX(1); opacity: 1; } to { transform: scaleX(1); opacity: 0; } }
@keyframes pageIn { from { opacity: 0; } to { opacity: 1; } }

.animate-in { animation: fadeIn 0.4s ease-out forwards; }
.slide-in { animation: slideIn 0.3s ease-out forwards; }
.page-in { animation: pageIn 0.18s ease-out forwards; }

.geo-bg {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231A6B7C' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
`;

// ============== SHARED COMPONENTS ==============
const Badge = ({ text, color = "gray", small }) => {
  const map = {
    green: { bg: colors.greenLight, text: colors.green },
    orange: { bg: colors.orangeLight, text: colors.orange },
    blue: { bg: colors.blueLight, text: colors.blue },
    yellow: { bg: colors.yellowLight, text: colors.yellow },
    red: { bg: colors.redLight, text: colors.red },
    gray: { bg: colors.grayLight, text: colors.gray },
    teal: { bg: "#E0F2F5", text: colors.teal },
  };
  const c = map[color] || map.gray;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: small ? "1px 8px" : "3px 12px", borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 600, background: c.bg, color: c.text, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
};

const ProgressBar = ({ percent, height = 8 }) => (
  <div style={{ width: "100%", height, background: colors.grayLight, borderRadius: height, overflow: "hidden" }}>
    <div style={{ width: `${percent}%`, height: "100%", background: `linear-gradient(90deg, ${colors.teal}, ${colors.orange})`, borderRadius: height, transition: "width 0.8s ease" }} />
  </div>
);

const Btn = ({ children, variant = "primary", onClick, disabled, small, full, icon }) => {
  const styles = {
    primary: { bg: colors.orange, color: "white", border: "none", hover: "#D4612E" },
    secondary: { bg: "transparent", color: colors.teal, border: `2px solid ${colors.teal}`, hover: "#E0F2F5" },
    ghost: { bg: "transparent", color: colors.teal, border: "none", hover: "#E0F2F5" },
    success: { bg: colors.green, color: "white", border: "none" },
    danger: { bg: colors.red, color: "white", border: "none" },
  };
  const s = styles[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: small ? "6px 14px" : "10px 24px", borderRadius: 10, fontSize: small ? 12 : 14, fontWeight: 600, fontFamily: "'Cairo', sans-serif", background: disabled ? colors.grayLight : s.bg, color: disabled ? colors.gray : s.color, border: s.border || "none", cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto", transition: "all 0.2s", opacity: disabled ? 0.6 : 1 }}>
      {icon && <span style={{ display: "flex" }}>{icon}</span>}
      {children}
    </button>
  );
};

const Card = ({ children, accent, onClick, style, hover }) => (
  <div onClick={onClick} style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderBottom: accent ? `3px solid ${colors.orange}` : "none", cursor: onClick ? "pointer" : "default", transition: "all 0.2s", ...style }}>
    {children}
  </div>
);

const Input = ({ label, placeholder, type = "text", value, onChange, textarea, icon }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark }}>{label}</label>}
    {textarea ? (
      <textarea placeholder={placeholder} value={value} onChange={onChange} rows={4} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif", resize: "vertical", outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = colors.teal} onBlur={e => e.target.style.borderColor = colors.grayBorder} />
    ) : (
      <div style={{ position: "relative" }}>
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{ width: "100%", padding: "10px 14px", paddingLeft: icon ? 36 : 14, borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif", outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = colors.teal} onBlur={e => e.target.style.borderColor = colors.grayBorder} />
        {icon && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>{icon}</span>}
      </div>
    )}
  </div>
);

const MetricCard = ({ title, value, icon, color = colors.teal, sub }) => (
  <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color: colors.tealDark }}>{value}</div>
      <div style={{ fontSize: 12, color: colors.gray }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: colors.green, marginTop: 2 }}>{sub}</div>}
    </div>
  </Card>
);

const Tab = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, background: colors.grayLight, borderRadius: 12, padding: 3, overflowX: "auto" }}>
    {tabs.map((t, i) => (
      <button key={i} onClick={() => onChange(i)} style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: active === i ? 700 : 500, fontFamily: "'Cairo', sans-serif", background: active === i ? "white" : "transparent", color: active === i ? colors.teal : colors.gray, border: "none", cursor: "pointer", transition: "all 0.2s", boxShadow: active === i ? "0 1px 3px rgba(0,0,0,0.08)" : "none", whiteSpace: "nowrap" }}>
        {t}
      </button>
    ))}
  </div>
);

const STATUS_ICONS = {
  not_submitted: <IcClock width={18} height={18} />,
  submitted:     <IcUpload width={18} height={18} />,
  reviewing:     <IcSearch width={18} height={18} />,
  approved:      <IcCheckCircle width={18} height={18} />,
  revision:      <IcArrowPath width={18} height={18} />,
};
const StatusBar = ({ status }) => {
  const map = {
    "not_submitted": { bg: colors.grayLight, color: colors.gray, text: "لم يُرسل بعد" },
    "submitted":     { bg: colors.blueLight, color: colors.blue, text: "تم الإرسال للمراجعة — بانتظار المستشار" },
    "reviewing":     { bg: colors.blueLight, color: colors.blue, text: "قيد المراجعة" },
    "approved":      { bg: colors.greenLight, color: colors.green, text: "معتمد — يمكنك الانتقال للوحدة التالية" },
    "revision":      { bg: colors.orangeLight, color: colors.orange, text: "يحتاج تعديل — راجع ملاحظات المستشار" },
  };
  const s = map[status] || map.not_submitted;
  return (
    <div style={{ padding: "12px 20px", borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: s.color }}>
      {STATUS_ICONS[status] || STATUS_ICONS.not_submitted}
      {s.text}
    </div>
  );
};

// ============== MODAL COMPONENT ==============
const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 16, width: wide ? 700 : 500, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: `1px solid ${colors.grayBorder}` }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: colors.gray, display: "flex" }}><IcXMark width={20} height={20} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

// ============== CHART COMPONENTS ==============
const BarChart = ({ data, height = 200, colorFn }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, padding: "10px 0" }}>
    {data.map((d, i) => (
      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 9, color: colors.gray, fontWeight: 600 }}>{d.value}</span>
        <div style={{ width: "100%", height: `${(d.value / Math.max(...data.map(x => x.value))) * 100}%`, background: colorFn ? colorFn(i) : `linear-gradient(180deg, ${colors.teal}, ${colors.teal}90)`, borderRadius: "6px 6px 0 0", minHeight: 4, transition: "height 0.6s ease" }} />
        <span style={{ fontSize: 8, color: colors.gray, whiteSpace: "nowrap" }}>{d.label}</span>
      </div>
    ))}
  </div>
);

const DonutChart = ({ segments, size = 120, label }) => {
  let cum = 0;
  const gradient = segments.map(s => { const start = cum; cum += s.percent; return `${s.color} ${start}% ${cum}%`; }).join(", ");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${gradient})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ width: size * 0.55, height: size * 0.55, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          {label && <span style={{ fontSize: 14, fontWeight: 800, color: colors.tealDark }}>{label}</span>}
        </div>
      </div>
      <div>{segments.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: colors.gray }}>{s.label} ({s.percent}%)</span>
        </div>
      ))}</div>
    </div>
  );
};

const LineChart = ({ data, height = 180 }) => {
  const max = data && data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;
  if (!data || data.length < 2 || max === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: colors.gray }}>لا توجد بيانات بعد</span>
      </div>
    );
  }
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.value / max) * 85}`).join(" ");
  return (
    <div style={{ height, position: "relative" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <defs><linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors.teal} stopOpacity="0.3"/><stop offset="100%" stopColor={colors.teal} stopOpacity="0.02"/></linearGradient></defs>
        <polygon points={`0,100 ${points} 100,100`} fill="url(#lineGrad)" />
        <polyline points={points} fill="none" stroke={colors.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => <circle key={i} cx={(i / (data.length - 1)) * 100} cy={100 - (d.value / max) * 85} r="1.5" fill={colors.orange} />)}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {data.map((d, i) => <span key={i} style={{ fontSize: 8, color: colors.gray }}>{d.label}</span>)}
      </div>
    </div>
  );
};

// ============== GENERIC PAGE (module-level so sub-components can use it) ==============
const GenericPage = ({ title, children }) => (
  <div className="animate-in">
    <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 20 }}>{title}</h2>
    {children}
  </div>
);

// ============== ADMIN NOTIFICATIONS PAGE (isolated component — no App re-render on typing) ==============
const AdminNotificationsPage = () => {
  const [activeTab,     setActiveTab]     = useState(0);
  const [notifTarget,   setNotifTarget]   = useState('all');
  const [notifUserId,   setNotifUserId]   = useState('');
  const [notifTitle,    setNotifTitle]    = useState('');
  const [notifBody,     setNotifBody]     = useState('');
  const [sending,       setSending]       = useState(false);
  const [result,        setResult]        = useState(null);
  const [log,           setLog]           = useState(null);
  const [logLoading,    setLogLoading]    = useState(false);
  const [users,         setUsers]         = useState([]);
  const [usersLoading,  setUsersLoading]  = useState(false);
  const [usersLoaded,   setUsersLoaded]   = useState(false);

  // Load log when tab 1 is active
  useEffect(() => {
    if (activeTab !== 1) return;
    setLogLoading(true);
    notificationsApi.adminLog()
      .then(r => setLog(r.data))
      .catch(() => setLog([]))
      .finally(() => setLogLoading(false));
  }, [activeTab]);

  // Load users list when "user" target selected
  useEffect(() => {
    if (notifTarget !== 'user' || usersLoaded) return;
    setUsersLoading(true);
    notificationsApi.adminUsers()
      .then(r => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setUsers([]))
      .finally(() => { setUsersLoading(false); setUsersLoaded(true); });
  }, [notifTarget, usersLoaded]);

  const handleSend = async () => {
    if (!notifTitle.trim()) { setResult({ type: 'error', msg: 'يرجى إدخال عنوان الإشعار' }); return; }
    if (notifTarget === 'user' && !notifUserId) { setResult({ type: 'error', msg: 'يرجى اختيار المستخدم' }); return; }
    setSending(true); setResult(null);
    try {
      const res = await notificationsApi.adminSend({
        target:  notifTarget,
        user_id: notifTarget === 'user' ? notifUserId : undefined,
        title:   notifTitle,
        body:    notifBody || undefined,
      });
      setResult({ type: 'success', msg: `تم الإرسال بنجاح إلى ${res.data.sent} مستخدم` });
      setNotifTitle('');
      setNotifBody('');
    } catch (e) {
      setResult({ type: 'error', msg: e.response?.data?.message || 'حدث خطأ في الإرسال' });
    } finally { setSending(false); }
  };

  const TARGET_OPTIONS = [
    { value: 'all',         label: 'جميع المستخدمين' },
    { value: 'clients',     label: 'العملاء فقط' },
    { value: 'consultants', label: 'المستشارين فقط' },
    { value: 'user',        label: 'مستخدم محدد' },
  ];
  const TARGET_COLORS = { all: 'blue', clients: 'teal', consultants: 'orange', user: 'gray' };

  return (
    <GenericPage title="إدارة الإشعارات">
      <Tab tabs={["إرسال إشعار", "سجل الإشعارات"]} active={activeTab} onChange={v => { setActiveTab(v); setResult(null); }} />
      <Card style={{ marginTop: 16 }}>

        {/* ── Tab 0: إرسال إشعار ── */}
        {activeTab === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* الجمهور */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 10 }}>إرسال إلى:</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TARGET_OPTIONS.map(opt => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${notifTarget === opt.value ? colors.teal : colors.grayBorder}`, background: notifTarget === opt.value ? colors.teal + "10" : colors.white, cursor: "pointer", fontSize: 13, fontWeight: notifTarget === opt.value ? 700 : 400, color: notifTarget === opt.value ? colors.teal : colors.gray, transition: "all .15s" }}>
                    <input type="radio" name="notifTo" value={opt.value} checked={notifTarget === opt.value} onChange={() => { setNotifTarget(opt.value); setResult(null); setNotifUserId(''); }} style={{ accentColor: colors.teal }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* اختيار مستخدم محدد */}
            {notifTarget === 'user' && (() => {
              const selectedUser = users.find(u => String(u.id) === String(notifUserId));
              return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark }}>اختر المستخدم</label>
                {usersLoading ? (
                  <div style={{ fontSize: 12, color: colors.gray, padding: "8px 0" }}>جارٍ تحميل المستخدمين...</div>
                ) : usersLoaded && users.length === 0 ? (
                  <div style={{ fontSize: 12, color: colors.red, padding: "8px 0" }}>لا يوجد مستخدمون متاحون في قاعدة البيانات</div>
                ) : (
                  <>
                    <select
                      value={notifUserId}
                      onChange={e => setNotifUserId(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${notifUserId ? colors.teal : colors.grayBorder}`, fontSize: 13, fontFamily: "'Cairo',sans-serif", color: notifUserId ? colors.tealDark : colors.gray, outline: "none", background: colors.white }}
                    >
                      <option value="">— اختر مستخدماً —</option>
                      <optgroup label="المستشارون">
                        {users.filter(u => u.role === 'consultant').map(u => (
                          <option key={u.id} value={u.id}>
                            {u.display_name} — {u.email}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="العملاء">
                        {users.filter(u => u.role === 'client').map(u => (
                          <option key={u.id} value={u.id}>
                            {u.display_name} — {u.email}
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    {/* بطاقة معلومات المستخدم المختار */}
                    {selectedUser && (
                      <div style={{ padding: "14px 16px", borderRadius: 10, border: `1.5px solid ${selectedUser.role === 'consultant' ? colors.orange : colors.teal}`, background: selectedUser.role === 'consultant' ? `${colors.orange}08` : `${colors.teal}08`, display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: selectedUser.role === 'consultant' ? colors.orange : colors.teal, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                          {selectedUser.display_name?.[0] || "?"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark }}>{selectedUser.display_name}</span>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700, background: selectedUser.role === 'consultant' ? `${colors.orange}20` : `${colors.teal}20`, color: selectedUser.role === 'consultant' ? colors.orange : colors.teal }}>
                              {selectedUser.role === 'consultant' ? 'مستشار' : 'عميل'}
                            </span>
                            {!selectedUser.is_active && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700, background: `${colors.red}20`, color: colors.red }}>غير نشط</span>}
                          </div>
                          <div style={{ fontSize: 12, color: colors.gray, display: "flex", flexDirection: "column", gap: 2 }}>
                            <span>{selectedUser.email}</span>
                            {selectedUser.phone   && <span>{selectedUser.phone}</span>}
                            {selectedUser.role === 'client' && selectedUser.rep_name  && <span>ممثل المنظمة: {selectedUser.rep_name}</span>}
                            {selectedUser.role === 'client' && selectedUser.org_type  && <span>نوع المنظمة: {selectedUser.org_type}</span>}
                            {selectedUser.role === 'client' && selectedUser.sector    && <span>القطاع: {selectedUser.sector}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              );
            })()}

            {/* العنوان */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, display: "block", marginBottom: 6 }}>عنوان الإشعار <span style={{ color: colors.red }}>*</span></label>
              <input
                value={notifTitle}
                onChange={e => { setNotifTitle(e.target.value); setResult(null); }}
                placeholder="عنوان واضح ومختصر..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 13, fontFamily: "'Cairo',sans-serif", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* النص */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, display: "block", marginBottom: 6 }}>نص الإشعار <span style={{ fontSize: 11, color: colors.gray, fontWeight: 400 }}>(اختياري)</span></label>
              <textarea
                value={notifBody}
                onChange={e => setNotifBody(e.target.value)}
                placeholder="محتوى الإشعار..."
                rows={4}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 13, fontFamily: "'Cairo',sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* نتيجة الإرسال */}
            {result && (
              <div style={{ padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: result.type === 'success' ? colors.greenLight : colors.redLight, color: result.type === 'success' ? colors.green : colors.red }}>
                {result.msg}
              </div>
            )}

            {/* زر الإرسال */}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={handleSend} disabled={sending}>
                {sending ? "جارٍ الإرسال..." : "إرسال الآن"}
              </Btn>
            </div>

            {/* ملاحظة */}
            <div style={{ padding: "10px 14px", borderRadius: 8, background: colors.grayLight, fontSize: 12, color: colors.gray, lineHeight: 1.8 }}>
              <strong style={{ color: colors.tealDark }}>ملاحظة:</strong> سيصل الإشعار فوراً إلى المستخدمين المحددين ويظهر في قائمة إشعاراتهم.
            </div>
          </div>
        )}

        {/* ── Tab 1: سجل الإشعارات ── */}
        {activeTab === 1 && (
          logLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: colors.gray, fontSize: 13 }}>جارٍ تحميل السجل...</div>
          ) : !log || log.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: colors.gray }}>
              <div style={{ marginBottom: 10, color: colors.gray }}><IcMail width={36} height={36}/></div>
              <div style={{ fontSize: 13 }}>لم يتم إرسال أي إشعارات بعد</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["العنوان", "الجمهور", "المرسِل", "المستلمون", "التاريخ"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", background: colors.grayLight, fontSize: 11, fontWeight: 700, color: colors.gray, textAlign: "right", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {log.map((row, i) => (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${colors.grayLight}`, background: i % 2 === 0 ? colors.white : "#fafbfc" }}>
                      <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 600, color: colors.tealDark, maxWidth: 260 }}>
                        <div>{row.title}</div>
                        {row.body && <div style={{ fontSize: 11, color: colors.gray, fontWeight: 400, marginTop: 2 }}>{row.body.length > 60 ? row.body.slice(0, 60) + '…' : row.body}</div>}
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <Badge text={row.target_user ?? row.target_label} color={TARGET_COLORS[row.target_type] || 'gray'} small />
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 12, color: colors.tealDark }}>{row.sent_by}</td>
                      <td style={{ padding: "11px 12px", textAlign: "center" }}>
                        <span style={{ padding: "2px 10px", borderRadius: 12, background: colors.blueLight, color: colors.blue, fontWeight: 700, fontSize: 12 }}>{row.recipient_count}</span>
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 11, color: colors.gray, whiteSpace: "nowrap" }}>
                        <div>{row.created_at}</div>
                        <div style={{ fontSize: 10, marginTop: 2 }}>{row.time}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>
    </GenericPage>
  );
};

// ============== ADMIN ACTIVITY LOG PAGE (isolated — no App re-render) ==============
const ACTION_LABELS = {
  'تسجيل دخول':                 { color: 'teal',   label: 'تسجيل دخول' },
  'تسجيل خروج':                 { color: 'gray',   label: 'تسجيل خروج' },
  'تسجيل حساب جديد':            { color: 'blue',   label: 'تسجيل جديد' },
  'بدء التخطيط الاستراتيجي':   { color: 'teal',   label: 'بدء استراتيجي' },
  'بدء التخطيط التشغيلي':       { color: 'teal',   label: 'بدء تشغيلي' },
  'اختيار مستشار — استراتيجي': { color: 'blue',   label: 'اختيار مستشار' },
  'دفع — استراتيجي':            { color: 'green',  label: 'دفع ناجح' },
  'دفع — تشغيلي':               { color: 'green',  label: 'دفع ناجح' },
  'دفع — سياسات':               { color: 'green',  label: 'دفع ناجح' },
  'إرسال وحدة للمراجعة — استراتيجي': { color: 'orange', label: 'إرسال للمراجعة' },
  'إرسال وحدة للمراجعة — تشغيلي':    { color: 'orange', label: 'إرسال للمراجعة' },
  'إرسال سياسة للمراجعة':       { color: 'orange', label: 'إرسال للمراجعة' },
  'اعتماد وحدة — استراتيجي':   { color: 'green',  label: 'اعتماد' },
  'اعتماد وحدة — تشغيلي':      { color: 'green',  label: 'اعتماد' },
  'اعتماد سياسة':               { color: 'green',  label: 'اعتماد' },
  'طلب تعديل — استراتيجي':     { color: 'orange', label: 'طلب تعديل' },
  'طلب تعديل — تشغيلي':        { color: 'orange', label: 'طلب تعديل' },
  'طلب تعديل — سياسة':         { color: 'orange', label: 'طلب تعديل' },
  'إرسال إشعار جماعي':          { color: 'blue',   label: 'إشعار جماعي' },
};
const ROLE_COLORS = { admin: 'red', consultant: 'teal', client: 'gray', system: 'blue' };
const CATEGORY_OPTIONS = [
  { value: '', label: 'جميع الفئات' },
  { value: 'auth',     label: 'المصادقة' },
  { value: 'workflow', label: 'سير العمل' },
  { value: 'payment',  label: 'المدفوعات' },
  { value: 'review',   label: 'المراجعات' },
  { value: 'admin',    label: 'الإدارة' },
  { value: 'policy',   label: 'السياسات' },
  { value: 'consultant', label: 'المستشار' },
];
const ROLE_OPTIONS = [
  { value: '', label: 'جميع الأدوار' },
  { value: 'admin',      label: 'مدير' },
  { value: 'consultant', label: 'مستشار' },
  { value: 'client',     label: 'عميل' },
  { value: 'system',     label: 'النظام' },
];

const AdminActivityLogPage = () => {
  const [logs,     setLogs]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('');
  const [roleFilter,setRoleFilter]= useState('');

  const load = (cat, role, q) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cat)  params.set('category', cat);
    if (role) params.set('role', role);
    if (q)    params.set('search', q);
    api.get('/admin/activity-log?' + params.toString())
      .then(r => setLogs(r.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(catFilter, roleFilter, ''); }, []);

  const handleFilter = (cat, role) => {
    setCatFilter(cat); setRoleFilter(role);
    load(cat, role, search);
  };

  const handleSearch = (q) => {
    setSearch(q);
    if (q.length === 0 || q.length >= 2) load(catFilter, roleFilter, q);
  };

  const exportCSV = () => {
    if (!logs || logs.length === 0) return;
    const rows = [['التاريخ', 'المستخدم', 'الدور', 'الإجراء', 'التفاصيل', 'IP']];
    logs.forEach(l => rows.push([l.created_at, l.user_name, l.role, l.action, l.details || '', l.ip || '']));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'activity-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const actionMeta = (action) => ACTION_LABELS[action] || { color: 'gray', label: action };

  return (
    <GenericPage title="سجل العمليات">
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="بحث بالاسم أو التفاصيل..."
          style={{ flex: 1, minWidth: 180, padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 13, fontFamily: "'Cairo',sans-serif", outline: "none" }}
        />
        <select value={catFilter} onChange={e => handleFilter(e.target.value, roleFilter)}
          style={{ padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 12, fontFamily: "'Cairo',sans-serif" }}>
          {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={roleFilter} onChange={e => handleFilter(catFilter, e.target.value)}
          style={{ padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 12, fontFamily: "'Cairo',sans-serif" }}>
          {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={exportCSV} style={{ padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, background: colors.white, fontSize: 12, fontFamily: "'Cairo',sans-serif", cursor: "pointer", fontWeight: 600, color: colors.tealDark }}>
          تصدير CSV
        </button>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: colors.gray, fontSize: 13 }}>جارٍ تحميل السجل...</div>
        ) : !logs || logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, color: colors.gray }}><IcClipboard width={40} height={40} /></div>
            <div style={{ fontSize: 13, color: colors.gray }}>لا توجد عمليات مسجلة بعد</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: colors.gray, marginBottom: 10, textAlign: "left" }}>
              {logs.length} سجل
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["التاريخ والوقت", "المستخدم", "الدور", "الإجراء", "التفاصيل"].map(h => (
                      <th key={h} style={{ padding: "10px 10px", background: colors.grayLight, fontSize: 11, fontWeight: 700, color: colors.gray, textAlign: "right", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row, i) => {
                    const meta = actionMeta(row.action);
                    const badgeColors = {
                      green: { bg: '#dcfce7', color: '#15803d' },
                      teal:  { bg: '#ccfbf1', color: '#0f766e' },
                      blue:  { bg: '#dbeafe', color: '#1d4ed8' },
                      orange:{ bg: '#ffedd5', color: '#c2410c' },
                      red:   { bg: '#fee2e2', color: '#dc2626' },
                      gray:  { bg: '#f3f4f6', color: '#6b7280' },
                    };
                    const actionStyle = badgeColors[meta.color] || badgeColors.gray;
                    const roleStyle   = badgeColors[ROLE_COLORS[row.role] || 'gray'] || badgeColors.gray;
                    return (
                      <tr key={row.id} style={{ borderBottom: `1px solid ${colors.grayLight}`, background: i % 2 === 0 ? colors.white : "#fafbfc" }}>
                        <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 12, color: colors.tealDark, fontWeight: 500 }}>{row.created_at}</div>
                          <div style={{ fontSize: 10, color: colors.gray, marginTop: 2 }}>{row.time}</div>
                        </td>
                        <td style={{ padding: "10px 10px", fontSize: 13, fontWeight: 600, color: colors.tealDark, whiteSpace: "nowrap" }}>{row.user_name}</td>
                        <td style={{ padding: "10px 10px" }}>
                          <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: roleStyle.bg, color: roleStyle.color }}>
                            {row.role === 'admin' ? 'مدير' : row.role === 'consultant' ? 'مستشار' : row.role === 'client' ? 'عميل' : 'نظام'}
                          </span>
                        </td>
                        <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                          <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: actionStyle.bg, color: actionStyle.color }}>
                            {row.action}
                          </span>
                        </td>
                        <td style={{ padding: "10px 10px", fontSize: 12, color: colors.gray, maxWidth: 280 }}>
                          {row.details || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </GenericPage>
  );
};

// ============== CLIENT HELP PAGE (FAQ) ==============
const ClientHelpPage = () => {
  const [faqs, setFaqs] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [expanded, setExpanded] = React.useState({});

  React.useEffect(() => {
    api.get('/faqs').then(r => setFaqs(r.data)).catch(() => setFaqs({}));
  }, []);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const filtered = React.useMemo(() => {
    if (!faqs) return null;
    if (!search.trim()) return faqs;
    const q = search.trim();
    const result = {};
    for (const [cat, items] of Object.entries(faqs)) {
      const matches = items.filter(f =>
        f.question.includes(q) || f.answer.includes(q) || cat.includes(q)
      );
      if (matches.length) result[cat] = matches;
    }
    return result;
  }, [faqs, search]);

  return (
    <GenericPage title="المساعدة والدعم">
      <div style={{ marginBottom: 20 }}>
        <Input placeholder="ابحث عن سؤالك..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {!filtered ? (
        <Card><div style={{ textAlign: 'center', padding: 40, color: colors.gray }}>جاري التحميل...</div></Card>
      ) : Object.keys(filtered).length === 0 ? (
        <Card><div style={{ textAlign: 'center', padding: 40, color: colors.gray }}>لا توجد نتائج للبحث عن "{search}"</div></Card>
      ) : (
        Object.entries(filtered).map(([cat, items]) => (
          <Card key={cat} style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>{cat}</h3>
            {items.map((faq, qi) => (
              <div key={faq.id} style={{ borderTop: qi > 0 ? `1px solid ${colors.grayLight}` : 'none' }}>
                <div
                  onClick={() => toggle(faq.id)}
                  style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 8 }}
                >
                  <span style={{ fontSize: 13, color: colors.tealDark, fontWeight: 600 }}>{faq.question}</span>
                  <span style={{ color: colors.gray, flexShrink: 0, transition: 'transform 0.2s', display: 'inline-block', transform: expanded[faq.id] ? 'rotate(-90deg)' : 'rotate(90deg)' }}>›</span>
                </div>
                {expanded[faq.id] && (
                  <div style={{ paddingBottom: 12, fontSize: 13, color: colors.gray, lineHeight: 1.8 }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </Card>
        ))
      )}
      <Card style={{ marginTop: 16, textAlign: 'center', padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>لم تجد إجابتك؟</h3>
        <p style={{ fontSize: 13, color: colors.gray, marginBottom: 12 }}>تواصل مع فريق الدعم عبر المحادثة المباشرة</p>
        <Btn small>تواصل معنا</Btn>
      </Card>
    </GenericPage>
  );
};

// ============== ADMIN FAQ MANAGEMENT PAGE ==============
const AdminFaqsPage = () => {
  const [faqs, setFaqs] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [modal, setModal] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ category: '', question: '', answer: '', sort_order: 0 });

  const load = () => {
    setLoading(true);
    api.get('/admin/faqs').then(r => setFaqs(r.data)).catch(() => setFaqs([])).finally(() => setLoading(false));
  };

  React.useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ category: '', question: '', answer: '', sort_order: 0 });
    setModal({ type: 'add' });
  };

  const openEdit = (faq) => {
    setForm({ category: faq.category, question: faq.question, answer: faq.answer, sort_order: faq.sort_order });
    setModal({ type: 'edit', id: faq.id });
  };

  const save = async () => {
    if (!form.category || !form.question || !form.answer) return;
    setSaving(true);
    try {
      if (modal.type === 'add') {
        await api.post('/admin/faqs', form);
      } else {
        await api.put(`/admin/faqs/${modal.id}`, form);
      }
      setModal(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleFaq = async (faq) => {
    await api.post(`/admin/faqs/${faq.id}/toggle`);
    load();
  };

  const deleteFaq = async (faq) => {
    if (!window.confirm(`هل تريد حذف هذا السؤال نهائياً؟`)) return;
    await api.delete(`/admin/faqs/${faq.id}`);
    load();
  };

  const cats = [...new Set((faqs || []).map(f => f.category))];
  const filtered = (faqs || []).filter(f =>
    !search.trim() || f.question.includes(search) || f.category.includes(search) || f.answer.includes(search)
  );

  return (
    <GenericPage title="إدارة الأسئلة الشائعة">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Input placeholder="بحث في الأسئلة..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Btn small onClick={openAdd}>+ إضافة سؤال</Btn>
      </div>
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: colors.gray }}>جاري التحميل...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.grayLight}` }}>
                  {['الفئة', 'السؤال', 'ترتيب', 'الحالة', 'إجراءات'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', textAlign: i < 2 ? 'right' : 'center', color: colors.gray, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: colors.gray }}>لا توجد أسئلة</td></tr>
                ) : filtered.map(faq => (
                  <tr key={faq.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                    <td style={{ padding: '12px', color: colors.tealDark, fontWeight: 600, whiteSpace: 'nowrap' }}>{faq.category}</td>
                    <td style={{ padding: '12px', color: colors.dark, maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{faq.question}</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: colors.gray }}>{faq.sort_order}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                        background: faq.is_active ? '#e8f5e9' : '#fef3f2',
                        color: faq.is_active ? '#2e7d32' : colors.red }}>
                        {faq.is_active ? 'مفعّل' : 'معطّل'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(faq)}
                          style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${colors.teal}`, background: 'transparent', color: colors.teal, cursor: 'pointer', fontSize: 12 }}>تعديل</button>
                        <button onClick={() => toggleFaq(faq)}
                          style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${colors.gray}`, background: 'transparent', color: colors.gray, cursor: 'pointer', fontSize: 12 }}>
                          {faq.is_active ? 'إيقاف' : 'تفعيل'}</button>
                        <button onClick={() => deleteFaq(faq)}
                          style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${colors.red}`, background: 'transparent', color: colors.red, cursor: 'pointer', fontSize: 12 }}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal && (
        <Modal open title={modal.type === 'add' ? 'إضافة سؤال جديد' : 'تعديل السؤال'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, display: 'block', marginBottom: 6 }}>الفئة</label>
              <input list="admin-faq-cats" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                placeholder="مثال: أسئلة عامة"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif", boxSizing: 'border-box' }} />
              <datalist id="admin-faq-cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, display: 'block', marginBottom: 6 }}>السؤال</label>
              <input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                placeholder="اكتب السؤال هنا..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif", boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, display: 'block', marginBottom: 6 }}>الإجابة</label>
              <textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
                placeholder="اكتب الإجابة هنا..." rows={4}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif", resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, display: 'block', marginBottom: 6 }}>رقم الترتيب</label>
              <input type="number" min="0" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif", boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn outline small onClick={() => setModal(null)}>إلغاء</Btn>
              <Btn small onClick={save} disabled={saving || !form.category || !form.question || !form.answer}>
                {saving ? 'جارٍ الحفظ...' : 'حفظ'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </GenericPage>
  );
};

// ============== CLIENT PAYMENTS PAGE ==============
const ClientPaymentsPage = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [downloading, setDownloading] = React.useState(null);

  React.useEffect(() => {
    api.get('/orders')
      .then(r => setData(r.data))
      .catch(() => setData({ total_paid: 0, last_payment: 0, orders: [] }))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const serviceMap = { strategic: 'التخطيط الاستراتيجي', operational: 'التخطيط التشغيلي', policies: 'السياسات واللوائح' };

  const downloadInvoice = async (order) => {
    setDownloading(order.id);
    const win = window.open('', '_blank');
    try {
      const res = await api.get(`/orders/${order.id}/invoice-link`);
      win.location.href = res.data.url;
    } catch {
      win.close();
      alert('حدث خطأ أثناء تحميل الفاتورة، حاول مرة أخرى.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray }}>جارٍ التحميل…</div>;

  return (
    <GenericPage title="المدفوعات والفواتير">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <MetricCard title="إجمالي المدفوعات (ريال)" value={fmt(data.total_paid)} icon={Icons.payments} />
        <MetricCard title="مدفوعات معلقة" value={data.orders?.filter(o => o.payment_status === 'pending').length || 0} icon={Icons.payments} color={colors.green} />
        <MetricCard title="آخر دفعة (ريال)" value={fmt(data.last_payment)} icon={Icons.payments} color={colors.orange} />
      </div>
      <Card>
        {!data.orders || data.orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا توجد فواتير بعد</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['رقم الفاتورة', 'التاريخ', 'الخدمة', 'المبلغ (ريال)', 'الحالة', ''].map(h => (
                <th key={h} style={{ padding: '10px 8px', background: colors.grayLight, fontSize: 11, fontWeight: 600, color: colors.gray, textAlign: 'right' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.orders.map(o => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                  <td style={{ padding: '10px 8px', fontSize: 12, fontWeight: 600, color: colors.tealDark }}>{o.order_number}</td>
                  <td style={{ padding: '10px 8px', fontSize: 12 }}>{o.date}</td>
                  <td style={{ padding: '10px 8px', fontSize: 12 }}>{serviceMap[o.service_type] || o.service_type}</td>
                  <td style={{ padding: '10px 8px', fontSize: 12, fontWeight: 700 }}>{fmt(o.total)}</td>
                  <td style={{ padding: '10px 8px' }}><Badge text={o.payment_status === 'paid' ? 'مدفوعة' : o.payment_status === 'failed' ? 'فاشلة' : 'معلقة'} color={o.payment_status === 'paid' ? 'green' : o.payment_status === 'failed' ? 'red' : 'yellow'} small /></td>
                  <td style={{ padding: '10px 8px' }}>
                    {o.payment_status === 'paid' && (
                      <button
                        onClick={() => downloadInvoice(o)}
                        disabled={downloading === o.id}
                        style={{
                          padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                          fontFamily: "'Cairo', sans-serif", cursor: downloading === o.id ? 'default' : 'pointer',
                          border: `1.5px solid ${colors.teal}`, background: 'white', color: colors.teal,
                          display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                          opacity: downloading === o.id ? 0.6 : 1,
                        }}
                      >
                        {downloading === o.id ? '…' : '⬇ فاتورة PDF'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </GenericPage>
  );
};

// ============== CONSULTANT EARNINGS PAGE ==============
const ConsultantEarningsPage = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/consultant/earnings')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const serviceColors = { strategic: colors.teal, operational: colors.orange, policies: colors.blue };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray }}>جارٍ التحميل…</div>;
  if (!data) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray, fontSize: 13 }}>تعذّر تحميل الأرباح</div>;

  const months = Object.entries(data.monthly || {});
  const maxVal = Math.max(...months.map(([, v]) => v), 1);
  const MONTH_LABELS = { '01':'يناير','02':'فبراير','03':'مارس','04':'أبريل','05':'مايو','06':'يونيو','07':'يوليو','08':'أغسطس','09':'سبتمبر','10':'أكتوبر','11':'نوفمبر','12':'ديسمبر' };

  return (
    <GenericPage title="الأرباح">
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <MetricCard title="إجمالي أرباحي (ريال)" value={fmt(data.total_earnings)} icon={Icons.payments} color={colors.green} />
        <MetricCard title="عدد الطلبات" value={data.orders_count} icon={Icons.content} />
        <MetricCard title="نسبتي من كل طلب" value={`${data.commission_rate}%`} icon={Icons.chart} color={colors.teal} />
        <MetricCard title="حصة المنصة" value={`${data.platform_rate}%`} icon={Icons.settings} color={colors.orange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Monthly chart */}
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: colors.tealDark, marginBottom: 14 }}>الأرباح الشهرية (ريال)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {months.map(([key, val]) => (
              <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: colors.teal, borderRadius: '4px 4px 0 0', height: `${Math.max((val / maxVal) * 100, val > 0 ? 4 : 2)}px`, minHeight: 2, transition: 'height 0.3s' }} />
                <div style={{ fontSize: 9, color: colors.gray, transform: 'rotate(-40deg)', whiteSpace: 'nowrap' }}>{MONTH_LABELS[key.split('-')[1]]}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Commission breakdown */}
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: colors.tealDark, marginBottom: 14 }}>توزيع الأرباح</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: colors.gray }}>حصتك كمستشار</span>
                <span style={{ fontWeight: 700, color: colors.green }}>{data.commission_rate}%</span>
              </div>
              <div style={{ height: 10, background: colors.grayLight, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${data.commission_rate}%`, height: '100%', background: colors.green, borderRadius: 6 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: colors.gray }}>حصة المنصة</span>
                <span style={{ fontWeight: 700, color: colors.orange }}>{data.platform_rate}%</span>
              </div>
              <div style={{ height: 10, background: colors.grayLight, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${data.platform_rate}%`, height: '100%', background: colors.orange, borderRadius: 6 }} />
              </div>
            </div>
            <div style={{ marginTop: 8, padding: '10px 14px', background: colors.grayLight, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: colors.gray, marginBottom: 2 }}>إجمالي أرباحك المستحقة</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.tealDark }}>{fmt(data.total_earnings)} <span style={{ fontSize: 12, fontWeight: 400 }}>ريال</span></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Orders table */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, color: colors.tealDark, marginBottom: 14 }}>تفاصيل الأرباح لكل طلب</div>
        {!data.orders || data.orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا توجد طلبات بعد</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['رقم الطلب', 'العميل', 'الخدمة', 'قيمة الطلب', 'حصتك (ريال)', 'التاريخ'].map(h => (
                <th key={h} style={{ padding: '9px 10px', background: colors.grayLight, fontWeight: 600, color: colors.gray, textAlign: 'right', fontSize: 11 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.orders.map(o => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: colors.tealDark }}>{o.order_number}</td>
                  <td style={{ padding: '10px' }}>{o.org_name || '—'}</td>
                  <td style={{ padding: '10px' }}><Badge text={o.service_label} color={o.service_type === 'strategic' ? 'teal' : o.service_type === 'operational' ? 'orange' : 'blue'} small /></td>
                  <td style={{ padding: '10px' }}>{fmt(o.total)} ريال</td>
                  <td style={{ padding: '10px', fontWeight: 700, color: colors.green }}>{fmt(o.consultant_share)} ريال</td>
                  <td style={{ padding: '10px', color: colors.gray }}>{o.date}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0fdf4' }}>
                <td colSpan={4} style={{ padding: '10px', fontWeight: 700, color: colors.tealDark }}>الإجمالي</td>
                <td style={{ padding: '10px', fontWeight: 800, color: colors.green, fontSize: 14 }}>{fmt(data.total_earnings)} ريال</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </Card>
    </GenericPage>
  );
};

// ============== CONSULTANT STATS PAGE ==============
const ConsultantStatsPage = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/consultant/stats')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const MONTH_LABELS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray }}>جارٍ التحميل…</div>;
  if (!data) return <div style={{ padding: 60, textAlign: 'center', color: colors.red, fontSize: 13 }}>تعذّر تحميل الإحصائيات</div>;

  const monthEntries = Object.entries(data.monthly_reviews || {});
  const maxVal = Math.max(...monthEntries.map(([, v]) => v), 1);
  const avgDays = data.avg_review_hours ? (data.avg_review_hours / 24).toFixed(1) : '—';

  return (
    <GenericPage title="إحصائياتي">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <MetricCard title="إجمالي العملاء" value={data.total_clients} icon={Icons.users} />
        <MetricCard title="المراجعات المكتملة" value={data.total_completed} icon={Icons.content} color={colors.green} />
        <MetricCard title="متوسط وقت المراجعة" value={avgDays === '—' ? '—' : `${avgDays} يوم`} icon={Icons.log} color={colors.blue} />
        <MetricCard title="التقييم العام" value={data.rating != null ? `${data.rating}/5` : '—'} icon={Icons.star} color={colors.yellow} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>المراجعات الشهرية</h3>
          {maxVal <= 1 ? (
            <div style={{ padding: 30, textAlign: 'center', color: colors.gray, fontSize: 12 }}>لا توجد بيانات بعد</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
              {monthEntries.map(([key, val]) => {
                const mIdx = parseInt(key.split('-')[1], 10) - 1;
                const h = maxVal > 0 ? Math.max(4, Math.round((val / maxVal) * 110)) : 4;
                return (
                  <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div title={`${MONTH_LABELS[mIdx]}: ${val}`} style={{ width: '100%', height: h, background: `linear-gradient(180deg, ${colors.green}, ${colors.green}80)`, borderRadius: '4px 4px 0 0' }} />
                    <span style={{ fontSize: 7, color: colors.gray }}>{MONTH_LABELS[mIdx].slice(0,3)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>توزيع المراجعات حسب الخدمة</h3>
          {[
            { label: 'استراتيجي', val: data.by_service?.strategic || 0, color: colors.teal },
            { label: 'تشغيلي',   val: data.by_service?.operational || 0, color: colors.orange },
            { label: 'سياسات',   val: data.by_service?.policy || 0, color: colors.green },
          ].map((s, i) => {
            const pct = data.total_completed > 0 ? Math.round(s.val / data.total_completed * 100) : 0;
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: colors.tealDark }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.val} ({pct}%)</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: colors.grayLight }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: s.color, transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </GenericPage>
  );
};

// ============== ADMIN FINANCE PAGE ==============
const AdminFinancePage = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState(0);

  React.useEffect(() => {
    api.get('/admin/finance')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const MONTH_LABELS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray }}>جارٍ التحميل…</div>;
  if (!data) return <div style={{ padding: 60, textAlign: 'center', color: colors.red, fontSize: 13 }}>تعذّر تحميل البيانات المالية</div>;

  const monthEntries = Object.entries(data.monthly_chart || {});
  const maxRev = Math.max(...monthEntries.map(([,v]) => v), 1);

  return (
    <GenericPage title="الإدارة المالية">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <MetricCard title="إجمالي الإيرادات (ريال)" value={fmt(data.total_revenue)} icon={Icons.payments} />
        <MetricCard title="إيرادات هذا الشهر (ريال)" value={fmt(data.month_revenue)} icon={Icons.payments} color={colors.green} />
        <MetricCard title="مدفوعات معلقة (ريال)" value={fmt(data.pending_revenue)} icon={Icons.payments} color={colors.yellow} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['المدفوعات الواردة', 'أداء المستشارين', 'الرسم البياني'].map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '8px 18px', borderRadius: 20, border: 'none', background: tab === i ? colors.teal : colors.grayLight, color: tab === i ? 'white' : colors.gray, fontSize: 13, fontWeight: tab === i ? 700 : 400, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>{t}</button>
        ))}
      </div>

      <Card>
        {tab === 0 && (
          data.transactions?.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا توجد معاملات بعد</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['رقم الطلب', 'المنظمة', 'الخدمة', 'المبلغ (ريال)', 'التاريخ'].map(h => (
                  <th key={h} style={{ padding: '10px 8px', background: colors.grayLight, fontSize: 11, fontWeight: 600, color: colors.gray, textAlign: 'right' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.transactions?.map(t => (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                    <td style={{ padding: '8px 8px', fontSize: 11, fontWeight: 600, color: colors.tealDark }}>{t.order_number}</td>
                    <td style={{ padding: '8px 8px', fontSize: 12 }}>{t.org_name}</td>
                    <td style={{ padding: '8px 8px' }}><Badge text={t.service} color="teal" small /></td>
                    <td style={{ padding: '8px 8px', fontSize: 12, fontWeight: 700 }}>{fmt(t.total)}</td>
                    <td style={{ padding: '8px 8px', fontSize: 11, color: colors.gray }}>{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
        {tab === 1 && (
          data.consultants?.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا يوجد مستشارون</div>
          ) : (
            <div>
              {data.consultants?.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < data.consultants.length - 1 ? `1px solid ${colors.grayLight}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: colors.gray }}>{c.reviews} مراجعة مكتملة</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: colors.yellow, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><IcStar width={13} height={13} /> {c.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {tab === 2 && (
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>الإيرادات الشهرية (آخر 12 شهر)</h4>
            {maxRev <= 1 ? (
              <div style={{ padding: 30, textAlign: 'center', color: colors.gray, fontSize: 12 }}>لا توجد بيانات بعد</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150 }}>
                {monthEntries.map(([key, val]) => {
                  const mIdx = parseInt(key.split('-')[1], 10) - 1;
                  const h = Math.max(4, Math.round((val / maxRev) * 140));
                  return (
                    <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div title={`${MONTH_LABELS[mIdx]}: ${fmt(val)} ريال`} style={{ width: '100%', height: h, background: `linear-gradient(180deg, ${colors.teal}, ${colors.teal}80)`, borderRadius: '4px 4px 0 0' }} />
                      <span style={{ fontSize: 7, color: colors.gray }}>{MONTH_LABELS[mIdx].slice(0,3)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </GenericPage>
  );
};

// ============== ADMIN REPORTS PAGE (isolated module-level component) ==============
const AdminReportsPage = () => {
  const [data, setData]       = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab]         = React.useState(0);

  React.useEffect(() => {
    api.get('/admin/reports')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('en-US');

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: colors.gray }}>جارٍ التحميل…</div>;
  if (!data)   return <div style={{ padding: 60, textAlign: 'center', color: colors.red, fontSize: 13 }}>تعذّر تحميل بيانات التقارير</div>;

  const m = data.metrics || {};
  const donutSegs = (data.service_dist || []).map(s => ({
    label:   s.label,
    color:   s.color,
    percent: data.service_dist_total > 0 ? Math.round(s.value / data.service_dist_total * 100) : 0,
  }));

  return (
    <GenericPage title="التقارير والتحليلات">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <MetricCard title="معدل الإكمال"         value={`${m.completion_rate ?? 0}%`}           icon={Icons.chart} />
        <MetricCard title="متوسط مدة الإنجاز"    value={m.avg_days ? `${m.avg_days} يوم` : '—'} icon={Icons.log}      color={colors.blue} />
        <MetricCard title="متوسط تقييم المستشارين" value={`${m.avg_rating ?? 0}/5`}             icon={Icons.star}     color={colors.yellow} />
        <MetricCard title="إجمالي الإيرادات (ريال)" value={fmt(m.total_revenue)}                icon={Icons.payments} color={colors.green} />
      </div>

      <Tab tabs={['نظرة عامة', 'تقدم المنظمات', 'أداء المستشارين', 'تحليل الخدمات']} active={tab} onChange={setTab} />

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>التسجيلات الشهرية (منظمات)</h4>
            <LineChart data={data.monthly_orgs || []} />
          </Card>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>الإيرادات الشهرية (ألف ريال)</h4>
            <BarChart data={data.monthly_revenue || []} />
          </Card>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>توزيع الخدمات</h4>
            {data.service_dist_total > 0 ? (
              <DonutChart size={130} label={String(data.service_dist_total)} segments={donutSegs} />
            ) : (
              <div style={{ padding: 30, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا توجد بيانات بعد</div>
            )}
          </Card>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>معدل الإكمال حسب الخدمة</h4>
            <BarChart height={160} data={data.completion_by_service || []} colorFn={i => [colors.teal, colors.orange, '#F1C40F'][i] || colors.teal} />
          </Card>
        </div>
      )}

      {tab === 1 && (
        <Card style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>تقدم المنظمات</h4>
          {!data.org_progress?.length ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا توجد مسارات نشطة</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['المنظمة', 'الخدمة', 'الوحدة الحالية', 'التقدم', 'أيام منذ البدء'].map(h => (
                  <th key={h} style={{ padding: '10px 8px', background: colors.grayLight, fontSize: 11, fontWeight: 600, color: colors.gray, textAlign: 'right' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data.org_progress.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                    <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600 }}>{r.org}</td>
                    <td style={{ padding: '10px 8px' }}><Badge text={r.service} color={r.service === 'استراتيجي' ? 'teal' : r.service === 'تشغيلي' ? 'orange' : 'blue'} small /></td>
                    <td style={{ padding: '10px 8px', fontSize: 12 }}>{r.step}</td>
                    <td style={{ padding: '10px 8px', width: 130 }}>
                      <ProgressBar percent={r.progress} />
                      <span style={{ fontSize: 10, color: colors.gray }}>{r.progress}%</span>
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: 12, color: r.days > 30 ? colors.orange : colors.gray }}>{r.days} يوم</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 2 && (
        <div style={{ marginTop: 16 }}>
          <Card style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>نسبة الاعتماد</h4>
            {data.approval_stats && (
              <DonutChart size={120}
                label={`${data.approval_stats.first_time}%`}
                segments={[
                  { label: 'معتمد من المرة الأولى', color: colors.green,  percent: data.approval_stats.first_time },
                  { label: 'معتمد بعد تعديل',       color: colors.yellow, percent: data.approval_stats.after_revision },
                  { label: 'قيد التعديل',            color: colors.orange, percent: data.approval_stats.revision },
                ]}
              />
            )}
          </Card>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>ترتيب المستشارين</h4>
            {!data.consultants?.length ? (
              <div style={{ padding: 30, textAlign: 'center', color: colors.gray, fontSize: 13 }}>لا يوجد مستشارون</div>
            ) : (
              data.consultants.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < data.consultants.length - 1 ? `1px solid ${colors.grayLight}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : colors.grayLight, color: i < 3 ? 'white' : colors.gray, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{i + 1}</div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: colors.gray }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><IcStar width={12} height={12}/> {c.rating}</span>
                    <span>{c.reviews} مراجعة</span>
                    {c.avg_hours != null && <span>{c.avg_hours} ساعة</span>}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>الطلب على الخدمات</h4>
            <BarChart height={160} data={(data.service_dist || []).map(s => ({ label: s.label, value: s.value }))} colorFn={i => [colors.teal, colors.orange, '#F1C40F'][i] || colors.teal} />
          </Card>
          <Card>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>معدل الإكمال حسب الخدمة</h4>
            <BarChart height={160} data={data.completion_by_service || []} colorFn={i => [colors.teal, colors.orange, '#F1C40F'][i] || colors.teal} />
          </Card>
        </div>
      )}
    </GenericPage>
  );
};

// ============== ADMIN DASHBOARD PAGE (isolated module-level component) ==============
const AdminDashboardPage = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const MONTH_LABELS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  const catColor = (cat) => {
    const m = { auth:'#17A589', workflow:'#2980B9', payment:'#E67E22', review:'#8E44AD', admin:'#E74C3C', policy:'#27AE60', consultant:'#F39C12', general:'#7F8C8D' };
    return m[cat] || '#7F8C8D';
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-US');

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#7F8C8D', fontSize: 13 }}>جارٍ تحميل لوحة التحكم…</div>
  );

  if (!data) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#E74C3C', fontSize: 13 }}>تعذّر تحميل البيانات. حاول مجدداً.</div>
  );

  const monthEntries = Object.entries(data.monthly_revenue);
  const maxRev = Math.max(...monthEntries.map(([, v]) => v), 1);

  const { strategic = 0, operational = 0, policy = 0, total: distTotal = 1 } = data.service_dist;
  const stPct  = Math.round(strategic   / distTotal * 100);
  const opPct  = Math.round(operational / distTotal * 100);
  const polPct = Math.round(policy      / distTotal * 100);
  const conicBg = `conic-gradient(${colors.teal} 0% ${stPct}%, ${colors.orange} ${stPct}% ${stPct + polPct}%, #F1C40F ${stPct + polPct}% 100%)`;

  const roleLabel = { admin: 'أدمين', consultant: 'مستشار', client: 'عميل', system: 'نظام' };

  return (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 24 }}>لوحة تحكم الإدارة</h2>

      {/* Row 1 metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
        <MetricCard title="إجمالي المنظمات" value={fmt(data.total_orgs)} icon={Icons.users} />
        <MetricCard title="اشتراكات نشطة" value={fmt(data.active_workflows)} icon={Icons.services} color={colors.green} />
        <MetricCard title="الإيرادات (ريال)" value={fmt(data.total_revenue)} icon={Icons.payments} color={colors.orange} />
      </div>
      {/* Row 2 metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <MetricCard title="معدل الإكمال" value={data.completion_rate + '%'} icon={Icons.chart} />
        <MetricCard title="المستشارين النشطين" value={fmt(data.active_consultants)} icon={Icons.users} color={colors.teal} />
        <MetricCard title="عمليات مكتملة" value={fmt(data.total_completed ?? 0)} icon={Icons.star} color={colors.yellow} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Monthly Revenue Chart */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>الإيرادات الشهرية (ريال)</h3>
          {maxRev === 1 ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 12 }}>لا توجد بيانات إيرادات بعد</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150 }}>
              {monthEntries.map(([key, val]) => {
                const monthIdx = parseInt(key.split('-')[1], 10) - 1;
                const barH = maxRev > 0 ? Math.max(4, Math.round((val / maxRev) * 140)) : 4;
                return (
                  <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div
                      title={`${MONTH_LABELS[monthIdx]}: ${fmt(val)} ريال`}
                      style={{ width: '100%', height: barH, background: `linear-gradient(180deg, ${colors.teal}, ${colors.teal}80)`, borderRadius: '4px 4px 0 0', transition: 'height 0.5s', cursor: 'default' }}
                    />
                    <span style={{ fontSize: 7, color: colors.gray }}>{MONTH_LABELS[monthIdx].slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Service Distribution */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>توزيع الخدمات</h3>
          {distTotal <= 0 || (strategic + operational + policy === 0) ? (
            <div style={{ padding: 40, textAlign: 'center', color: colors.gray, fontSize: 12 }}>لا توجد طلبات مدفوعة بعد</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: conicBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'white' }} />
              </div>
              <div>
                {[
                  { label: 'تخطيط استراتيجي', color: colors.teal,   pct: stPct,  cnt: strategic   },
                  { label: 'سياسات ولوائح',    color: colors.orange, pct: polPct, cnt: policy      },
                  { label: 'تخطيط تشغيلي',     color: '#F1C40F',    pct: opPct,  cnt: operational },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: colors.gray }}>{l.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors.tealDark, marginRight: 'auto' }}>{l.pct}%</span>
                    <span style={{ fontSize: 11, color: colors.gray }}>({l.cnt})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>آخر العمليات</h3>
        {!data.recent_activity || data.recent_activity.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: colors.gray, fontSize: 12 }}>لا توجد عمليات مسجّلة بعد</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['العملية', 'المستخدم', 'الدور', 'الفئة', 'التاريخ'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', background: colors.grayLight, fontSize: 12, fontWeight: 600, color: colors.gray, textAlign: 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent_activity.map((row) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{row.action}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: colors.tealDark }}>{row.user_name}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${catColor(row.category)}18`, color: catColor(row.category), fontWeight: 600 }}>
                      {roleLabel[row.role] || row.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${catColor(row.category)}18`, color: catColor(row.category) }}>
                      {row.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: colors.gray }}>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

// ============== KEEP-ALIVE VIEWS (module-level — never recreated) ==============
const KA_VIEWS = new Set([
  'strategic-roadmap', 'operational-roadmap', 'policies-select',
  'client-dash', 'con-dash', 'admin-dash',
  'client-payments', 'client-chat', 'con-chat',
  'con-clients', 'con-pending', 'con-completed', 'con-earnings', 'con-stats',
  'admin-orgs', 'admin-consultants', 'admin-users', 'admin-questionnaires',
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

// ============== MAIN APP ==============
export default function DaffaPlatform() {
  // Clear any stale old-format permissions from localStorage on first render
  cleanupLegacyPermissions();

  // ALL hooks at the very top — no exceptions
  const [authPage, setAuthPage] = useState(null);
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
      if (!user) return "landing";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeUnit, setActiveUnit] = useState(null);
  const [strategicWorkflowId, setStrategicWorkflowId] = useState(null);
  const [operationalWorkflowId, setOperationalWorkflowId] = useState(null);
  const [policyWorkflowId, setPolicyWorkflowId] = useState(null);
  const [chatAutoStart, setChatAutoStart] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activePolicyQ, setActivePolicyQ] = useState(null);
  const [strategicStep, setStrategicStep] = useState(0);
  const [modal, setModal] = useState(null);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [opStep, setOpStep] = useState(0);
  const [activeOpUnit, setActiveOpUnit] = useState(null);
  const [polStep, setPolStep] = useState(0);
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [activePolicy, setActivePolicy] = useState(null);
  const [polSection, setPolSection] = useState(0);
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

  // ── استمع لحدث انتهاء الجلسة المُرسَل من axios interceptor ──────────────
  useEffect(() => {
    const handler = () => {
      setAuthUser(null);
      setCurrentRole('client');
      setCurrentView('landing');
      setActiveUnit(null);
      setActiveTab(0);
      setActivePolicyQ(null);
      setSessionExpired(true);
      setTimeout(() => setSessionExpired(false), 5000);
    };
    window.addEventListener('session:expired', handler);
    return () => window.removeEventListener('session:expired', handler);
  }, []);

  // ── fetch site content + public policy types (no auth needed) ────────────
  useEffect(() => {
    api.get('/site-content').then(r => setSiteContent(r.data)).catch(() => {});
    api.get('/public/policy-types').then(r => setPublicPolicies(r.data)).catch(() => {});
  }, []);

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
      .then(r => setNotifications(r.data))
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

      setDashPhases([stPhase, opPhase, polPhase]);
    };
    load();
  }, [currentView]);

  // Early returns after ALL hooks
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
  };

  const handleLogin = (user, options = {}) => {
    localStorage.setItem('user', JSON.stringify(user));
    setAuthUser(user);
    setAuthPage(null);
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

  // صفحة إعادة تعيين كلمة المرور — تُشغَّل إذا جاء المستخدم من رابط البريد
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
  if (authPage === 'login') return <Login onLogin={handleLogin} onGoRegister={() => setAuthPage('register')} />;
  if (authPage === 'register') return <Register onLogin={handleLogin} onGoLogin={() => setAuthPage('login')} />;

  const navigate = (view, role) => {
    setCurrentView(view);
    sessionStorage.setItem('currentView', view);
    if (role) setCurrentRole(role);
    setActiveUnit(null);
    setActiveTab(0);
    setActivePolicyQ(null);
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
    { id: "client-dash",         label: "لوحة التحكم",          icon: Icons.home },
    { id: "strategic-roadmap",   label: "التخطيط الاستراتيجي",  icon: Icons.strategic,   permKey: "client.strategic.view"   },
    { id: "operational-roadmap", label: "التخطيط التشغيلي",     icon: Icons.operational,  permKey: "client.operational.view" },
    { id: "policies-select",     label: "السياسات واللوائح",    icon: Icons.policies,     permKey: "client.policies.view"    },
    { id: "client-chat",         label: "المحادثات",             icon: Icons.chat,         permKey: "client.chat.view"        },
    { id: "client-payments",     label: "المدفوعات",             icon: Icons.payments },
    { id: "client-downloads",    label: "التحميلات",             icon: Icons.download },
    { id: "client-notifications",label: "الإشعارات",             icon: Icons.bell },
    { id: "client-help",         label: "المساعدة",              icon: Icons.help },
    { id: "client-settings",     label: "الإعدادات",             icon: Icons.settings },
  ].filter(item => !item.permKey || can(item.permKey));

  const consultantMenu = [
    { id: "con-dash", label: "لوحة التحكم", icon: Icons.home },
    { id: "con-clients", label: "العملاء والمهام", icon: Icons.users },
    { id: "con-pending", label: "المراجعات المعلقة", icon: Icons.content },
    { id: "con-completed", label: "المراجعات المكتملة", icon: Icons.check },
    { id: "con-chat", label: "المحادثات", icon: Icons.chat },
    { id: "con-notifications", label: "الإشعارات", icon: Icons.bell },
    { id: "con-earnings", label: "الأرباح", icon: Icons.payments },
    { id: "con-stats", label: "إحصائياتي", icon: Icons.chart },
    { id: "con-settings", label: "إعدادات الحساب", icon: Icons.settings },
  ];

  const adminMenu = [
    { id: "admin-dash", label: "لوحة التحكم", icon: Icons.home },
    { id: "admin-orgs", label: "إدارة المنظمات", icon: Icons.users },
    { id: "admin-consultants", label: "إدارة المستشارين", icon: Icons.users },
    { id: "admin-users", label: "إدارة المستخدمين", icon: Icons.users },
    { id: "admin-services", label: "إدارة الخدمات", icon: Icons.services },
    { id: "admin-content", label: "إدارة المحتوى", icon: Icons.content },
    { id: "admin-site-content", label: "محتوى الموقع", icon: Icons.content },
    { id: "admin-faqs",         label: "الأسئلة الشائعة",  icon: Icons.help },
    { id: "admin-questionnaires", label: "إدارة الاستبيانات", icon: Icons.policies },
    { id: "admin-designs", label: "طلبات التصميم",   icon: Icons.policies },
    { id: "admin-finance", label: "الإدارة المالية", icon: Icons.payments },
    { id: "admin-reports", label: "التقارير", icon: Icons.chart },
    { id: "admin-notifications", label: "الإشعارات", icon: Icons.bell },
    { id: "admin-log",      label: "سجل العمليات",   icon: Icons.log },
    { id: "admin-settings", label: "إعدادات النظام", icon: Icons.settings },
    { id: "admin-profile",  label: "ملفي الشخصي",    icon: Icons.settings },
  ];

  const menu = currentRole === "admin" ? adminMenu : currentRole === "consultant" ? consultantMenu : clientMenu;
  const isDashboard = !["landing", "about", "services", "pricing", "contact", "login", "register"].includes(currentView);

  const Sidebar = () => (
    <div style={{ width: sidebarOpen ? 240 : 64, height: "100vh", background: `linear-gradient(180deg, ${colors.teal} 0%, ${colors.tealDark} 100%)`, position: "fixed", right: 0, top: 0, zIndex: 100, transition: "width 0.3s", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: sidebarOpen ? "20px 16px" : "20px 8px", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        {sidebarOpen ? <img src="/logo.png" alt="دفة" style={{ width: 50, height: 50, objectFit: "contain", filter: "brightness(0) invert(1)" }} /> : <img src="/logo.png" alt="دفة" style={{ width: 34, height: 34, objectFit: "contain", filter: "brightness(0) invert(1)" }} />}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {menu.map((item) => {
          const isNotif = item.id === 'client-notifications' || item.id === 'con-notifications';
          const badge   = isNotif && unreadCount > 0 ? unreadCount : 0;
          return (
            <button key={item.id} onClick={() => navigate(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: sidebarOpen ? "10px 12px" : "10px 0", justifyContent: sidebarOpen ? "flex-end" : "center", direction: "ltr", borderRadius: 10, border: "none", background: currentView === item.id ? "rgba(255,255,255,0.15)" : "transparent", color: "white", cursor: "pointer", fontSize: 13, fontWeight: currentView === item.id ? 700 : 400, fontFamily: "'Cairo', sans-serif", marginBottom: 2, transition: "all 0.2s", position: "relative" }}>
              {sidebarOpen && badge > 0 && <span style={{ marginRight: "auto", minWidth: 20, height: 20, borderRadius: 10, background: colors.orange, color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", flexShrink: 0 }}>{badge > 99 ? "99+" : badge}</span>}
              {sidebarOpen && <span style={{ direction: "rtl" }}>{item.label}</span>}
              <span style={{ display: "flex", opacity: 0.85, flexShrink: 0, position: "relative" }}>
                {item.icon}
                {badge > 0 && <span style={{ position: "absolute", top: -6, left: -6, minWidth: 16, height: 16, borderRadius: 8, background: colors.orange, color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{badge > 99 ? "99+" : badge}</span>}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, flexShrink: 0, overflow: "hidden" }}>
          {authUser?.logo_url ? (
            <img src={authUser.logo_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          ) : (
            currentRole === "admin"
              ? (authUser?.rep_name?.[0] || authUser?.email?.[0]?.toUpperCase() || "م")
              : currentRole === "consultant"
              ? (authUser?.rep_name?.[0] || "خ")
              : (authUser?.org_name?.[0] || "ج")
          )}
        </div>
        {sidebarOpen && (
          <div style={{ color: "white", overflow: "hidden", flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {currentRole === "admin"
                ? (authUser?.rep_name || authUser?.email?.split('@')[0] || "مدير النظام")
                : currentRole === "consultant"
                ? (authUser?.rep_name || "المستشار")
                : (authUser?.org_name || authUser?.rep_name || "المنظمة")}
            </div>
            {authUser?.email && (
              <div style={{ fontSize: 10, opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {authUser.email}
              </div>
            )}
            <div style={{ fontSize: 10, opacity: 0.45, marginTop: 1 }}>
              {currentRole === "admin" ? "مدير النظام" : currentRole === "consultant" ? "مستشار" : (authUser?.org_type || "عميل")}
            </div>
          </div>
        )}
        {sidebarOpen && (
          <button
            onClick={handleLogout}
            title="تسجيل الخروج"
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.5)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  const TopBar = ({ title, breadcrumb }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "white", borderBottom: `1px solid ${colors.grayBorder}`, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: colors.gray }}>{Icons.menu}</button>
        <div>
          {breadcrumb && <div style={{ fontSize: 11, color: colors.gray }}>{breadcrumb}</div>}
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark }}>{title}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", cursor: "pointer" }}>
          <span style={{ color: colors.gray }}>{Icons.search}</span>
        </div>
        <div
          onClick={() => currentRole === 'client' ? navigate('client-notifications') : currentRole === 'consultant' ? navigate('con-notifications') : navigate('admin-notifications')}
          style={{ position: "relative", cursor: "pointer" }}
        >
          <span style={{ color: unreadCount > 0 ? colors.orange : colors.gray, transition: "color 0.2s" }}>{Icons.bell}</span>
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, background: colors.orange, color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {/* Preview Site button — admin + consultant + client */}
        {(currentRole === "admin" || currentRole === "consultant" || currentRole === "client") && (
          <button
            onClick={() => window.open(window.location.origin + '?preview=1', '_blank')}
            title="معاينة الموقع في تاب جديد"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${colors.teal}30`,
              background: `${colors.teal}08`, color: colors.teal, cursor: "pointer",
              fontSize: 12, fontWeight: 600, fontFamily: "'Cairo', sans-serif",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${colors.teal}18`; e.currentTarget.style.borderColor = colors.teal; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${colors.teal}08`; e.currentTarget.style.borderColor = `${colors.teal}30`; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            معاينة الموقع
          </button>
        )}
        {/* Role Badge */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", background: currentRole === "admin" ? "#FEF3C7" : currentRole === "consultant" ? "#E0F2F5" : colors.grayLight, color: currentRole === "admin" ? "#D97706" : currentRole === "consultant" ? colors.teal : colors.gray }}>
            {currentRole === "admin" ? "مدير النظام" : currentRole === "consultant" ? "مستشار" : "عميل"}
          </div>
          {currentRole === "client" && authUser?.org_type && (
            <div style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", background: colors.grayLight, color: colors.gray }}>
              {authUser.org_type}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ============== PUBLIC PAGES NAV ==============
  const PublicNav = () => (
    <div style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${colors.grayBorder}`, position: "sticky", top: 0, zIndex: 100 }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 30px", maxWidth: 1300, margin: "0 auto" }}>
        {/* Right: Logo only */}
        <div onClick={() => navigate("landing")} style={{ cursor: "pointer", display: "flex", alignItems: "center", minWidth: 160 }}>
          <img src="/logo.png" alt="دفة" style={{ width: 52, height: 52, objectFit: "contain" }} />
        </div>

        {/* Center: Menu Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {[{l:"الرئيسية",v:"landing"},{l:"عن دفة",v:"about"},{l:"الخدمات",v:"services"},{l:"الأسعار",v:"pricing"},{l:"تواصل معنا",v:"contact"}].map(n => (
            <a key={n.v} onClick={() => navigate(n.v)} style={{ fontSize: 14, fontWeight: currentView === n.v ? 700 : 500, color: currentView === n.v ? colors.orange : colors.tealDark, cursor: "pointer", borderBottom: currentView === n.v ? `2px solid ${colors.orange}` : "2px solid transparent", paddingBottom: 6, transition: "all 0.2s" }}
              onMouseEnter={e => { if (currentView !== n.v) e.target.style.color = colors.teal; }}
              onMouseLeave={e => { if (currentView !== n.v) e.target.style.color = colors.tealDark; }}>
              {n.l}
            </a>
          ))}
        </div>

        {/* Left: Auth Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 160, justifyContent: "flex-end" }}>
          <Btn variant="secondary" small onClick={() => setAuthPage("login")}>تسجيل الدخول</Btn>
          <Btn small onClick={() => setAuthPage("register")}>إنشاء حساب</Btn>
        </div>
      </nav>
    </div>
  );

  const PublicFooter = () => (
    <div>
      <div style={{ padding: "50px 40px", background: colors.tealDark, color: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40 }}>
          <div><Logo size="md" white /><p style={{ fontSize: 12, opacity: 0.7, marginTop: 12, lineHeight: 1.8 }}>{sc('footer_desc', 'منصة دفة للتخطيط الاستراتيجي وصناعة السياسات')}</p></div>
          <div><h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>روابط سريعة</h4>{["الرئيسية", "عن دفة", "الخدمات", "الأسعار"].map((l, i) => <div key={i} style={{ fontSize: 12, opacity: 0.7, padding: "4px 0", cursor: "pointer" }}>{l}</div>)}</div>
          <div><h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>الخدمات</h4>{["التخطيط الاستراتيجي", "التخطيط التشغيلي", "السياسات واللوائح"].map((l, i) => <div key={i} style={{ fontSize: 12, opacity: 0.7, padding: "4px 0" }}>{l}</div>)}</div>
          <div><h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>تواصل معنا</h4>
            <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 2 }}>
              {sc('contact_email', 'info@daffa.sa')}<br/>
              {sc('contact_phone', '+966 55 XXX XXXX')}<br/>
              {sc('contact_address', 'الرياض، المملكة العربية السعودية')}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: "14px 40px", background: "#0A3842", textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{sc('footer_copyright', 'جميع الحقوق محفوظة © 2026 منصة دفة')}</div>
    </div>
  );

  // ============== LANDING PAGE ==============
  const LandingPage = () => (
    <div style={{ width: "100%", minHeight: "100vh" }} className="geo-bg">
      <PublicNav />
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${colors.teal} 0%, #0D4F5E 100%)`, padding: "80px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0L100 50L50 100L0 50Z' fill='rgba(255,255,255,0.02)'/%3E%3C/svg%3E\")" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Logo size="lg" white />
          <h1 style={{ color: "white", fontSize: 28, fontWeight: 300, marginTop: 24, lineHeight: 1.6 }}>{sc('hero_title', 'نظام البناء الاستراتيجي والتشغيلي للمنظمات غير الربحية')}</h1>
          <h2 style={{ color: "white", fontSize: 40, fontWeight: 800, marginTop: 8 }}>{sc('hero_subtitle', 'فكرة النظام وآلية العمل')}</h2>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 32 }}>
            <Btn onClick={() => navigate("register")}>ابدأ الآن</Btn>
            <button onClick={() => navigate("about")} style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: "'Cairo', sans-serif", background: "transparent", color: "white", border: "2px solid white", cursor: "pointer" }}>تعرّف أكثر</button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: "50px 40px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ padding: "20px 24px", border: `2px dashed ${colors.teal}40`, borderRadius: 14, textAlign: "center" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.tealDark, marginBottom: 10 }}>آلية العمل</h3>
          <p style={{ fontSize: 14, color: colors.gray, lineHeight: 2 }}>{sc('how_it_works_desc', 'يعمل النظام بشكل شبه آلي، بحيث يوجد مستشار متخصص يراجع عن بعد مخرجات كل مرحلة.')}</p>
        </div>
      </div>

      {/* 4 Steps */}
      <div style={{ padding: "0 40px 50px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            {icon:"1️⃣", t: sc('step1_title','اختر الخدمة'),          d: sc('step1_desc','التخطيط الاستراتيجي أو التشغيلي أو السياسات')},
            {icon:"2️⃣", t: sc('step2_title','ادفع واختر المستشار'),  d: sc('step2_desc','أسعار مناسبة مع اختيار المستشار المناسب')},
            {icon:"3️⃣", t: sc('step3_title',"تعلّم ونفّذ"),          d: sc('step3_desc','فيديوهات + شرح + إرشادات + نماذج عمل')},
            {icon:"4️⃣", t: sc('step4_title','المستشار يراجع ويعتمد'),d: sc('step4_desc','مراجعة واعتماد من مستشار متخصص عن بعد')},
          ].map((s,i) => (
            <Card key={i} style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>{s.t}</h4>
              <p style={{ fontSize: 12, color: colors.gray, lineHeight: 1.7 }}>{s.d}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Components */}
      <div style={{ padding: "60px 40px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 40 }}>
            <Rosette size={36} />
            <h2 style={{ fontSize: 28, fontWeight: 800, color: colors.tealDark }}>مكونات النظام</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { title: "نظام التخطيط الاستراتيجي", desc: sc('comp_strategic_desc','11 وحدة تخطيطية لبناء خطة استراتيجية متكاملة'), icon: <IcTarget width={28} height={28}/>, units: sc('comp_strategic_badge','11 وحدة') },
              { title: "نظام التخطيط التشغيلي",    desc: sc('comp_operational_desc','5 وحدات لتحويل الاستراتيجية إلى خطة تنفيذية'), icon: <IcCog width={28} height={28}/>,    units: sc('comp_operational_badge','5 وحدات') },
              { title: "نظام بناء السياسات واللوائح",desc: sc('comp_policies_desc','7 سياسات ولوائح تُبنى عبر استبيانات ذكية موجهة'), icon: <IcClipboard width={28} height={28}/>, units: sc('comp_policies_badge','7 سياسات') },
            ].map((s, i) => (
              <Card key={i} accent style={{ textAlign: "center", padding: 32 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: colors.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: colors.orange }}>{s.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>{s.title}</h3>
                <Badge text={s.units} color="teal" small />
                <p style={{ fontSize: 13, color: colors.gray, lineHeight: 1.7, marginTop: 10 }}>{s.desc}</p>
                <Btn small variant="secondary" style={{ marginTop: 14 }} onClick={() => navigate("services")}>تفاصيل أكثر</Btn>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ padding: "60px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 40 }}>
            <Rosette size={36} />
            <h2 style={{ fontSize: 28, fontWeight: 800, color: colors.tealDark }}>آلية التسعير</h2>
          </div>
          {[
            sc('pricing_point1','يتم وضع أسعار قليلة التكلفة وللجهة اختيار المستشار عن بعد من القائمة'),
            sc('pricing_point2','يتاح اعتماد الخطة من احدى الجهات في النظام بتكلفة إضافية'),
            sc('pricing_point3','يتم عرض أنظمة بناء السياسات واللوائح بأسعار مستقلة'),
            sc('pricing_point4','يتاح خيار تحكيم السياسات واللوائح من احد المستشارين بتكلفة إضافية'),
            sc('pricing_point5','يتم إتاحة تنزيل الملفات بشكل مصمم تلقائياً ويتاح خدمة التصميم بمقابل'),
          ].map((t, i) => (
            <div key={i} className="animate-in" style={{ animationDelay: `${i * 0.1}s`, display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", marginBottom: 10, background: colors.tealCard, borderRadius: 12, color: "white", fontSize: 14, lineHeight: 1.7 }}>
              <Rosette size={32} white /><span>{t}</span>
            </div>
          ))}
          <div style={{ textAlign: "center", marginTop: 20 }}><Btn onClick={() => navigate("pricing")}>عرض الأسعار بالتفصيل</Btn></div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "50px 40px", background: `linear-gradient(135deg, ${colors.orange}, #D4612E)`, textAlign: "center" }}>
        <h2 style={{ color: "white", fontSize: 26, fontWeight: 700, marginBottom: 20 }}>{sc('cta_title','ابدأ رحلة التخطيط الاستراتيجي لمنظمتك الآن')}</h2>
        <button onClick={() => navigate("register")} style={{ padding: "12px 40px", borderRadius: 12, fontSize: 16, fontWeight: 700, fontFamily: "'Cairo', sans-serif", background: "white", color: colors.orange, border: "none", cursor: "pointer" }}>سجّل مجاناً</button>
      </div>
      <PublicFooter />
    </div>
  );

  // ============== ABOUT PAGE ==============
  const AboutPage = () => (
    <div style={{ width: "100%", minHeight: "100vh" }} className="geo-bg">
      <PublicNav />
      <div style={{ background: `linear-gradient(135deg, ${colors.teal}, #0D4F5E)`, padding: "50px 40px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: 32, fontWeight: 800 }}>عن منصة دفة</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginTop: 10 }}>{sc('about_hero_subtitle','للتخطيط الاستراتيجي وصناعة السياسات')}</p>
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "50px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 50 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>رؤيتنا</h2>
            <p style={{ fontSize: 14, color: colors.gray, lineHeight: 2 }}>{sc('vision_text','أن نكون المنصة الرائدة في تمكين المنظمات غير الربحية.')}</p>
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>رسالتنا</h2>
            <p style={{ fontSize: 14, color: colors.gray, lineHeight: 2 }}>{sc('mission_text','نقدم نظاماً شبه آلي يوفر أدوات تخطيط متكاملة مع إشراف مستشارين متخصصين.')}</p>
          </div>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.tealDark, marginBottom: 20, textAlign: "center" }}>كيف يعمل النظام</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 50 }}>
          {[
            {n:"1", t: sc('howworks1_title','نظام شبه آلي'),      d: sc('howworks1_desc','محتوى تعليمي مسجل مع نماذج عمل جاهزة')},
            {n:"2", t: sc('howworks2_title','إشراف المستشار'),    d: sc('howworks2_desc','مستشار متخصص يراجع عن بعد مخرجات كل مرحلة')},
            {n:"3", t: sc('howworks3_title','مخرجات احترافية'),   d: sc('howworks3_desc','وثائق نهائية مصممة تلقائياً')},
          ].map((s,i) => (
            <Card key={i} accent style={{ textAlign: "center", padding: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: colors.orange, color: "white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontWeight: 800, fontSize: 18 }}>{s.n}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>{s.t}</h3>
              <p style={{ fontSize: 13, color: colors.gray, lineHeight: 1.7 }}>{s.d}</p>
            </Card>
          ))}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.tealDark, marginBottom: 20, textAlign: "center" }}>فريق عمل النظام</h2>
        <Card style={{ padding: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ padding: "10px 28px", background: colors.tealCard, color: "white", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>مشرف النظام</div>
            <div style={{ width: 2, height: 20, background: colors.grayBorder }} />
            <div style={{ padding: "10px 28px", background: colors.orange, color: "white", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>المشرف الفني</div>
            <div style={{ width: 2, height: 20, background: colors.grayBorder }} />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {["إدارة التصميم", "المنسق الفني", "الدعم التقني", "الإدارة المالية"].map((d, i) => (
                <div key={i} style={{ padding: "8px 20px", background: colors.tealCard, color: "white", borderRadius: 8, fontSize: 12, fontWeight: 500 }}>{d}</div>
              ))}
            </div>
            <div style={{ width: 2, height: 20, background: colors.grayBorder }} />
            <div style={{ padding: "8px 20px", background: colors.tealCard, color: "white", borderRadius: 8, fontSize: 12 }}>المستشارين</div>
            <div style={{ width: 2, height: 20, background: colors.grayBorder }} />
            <div style={{ padding: "8px 20px", background: colors.tealCard, color: "white", borderRadius: 8, fontSize: 12 }}>الجهات الاستشارية</div>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 50 }}>
          {[
            {n: sc('stat1_n','120+'), l: sc('stat1_l','منظمة مستفيدة')},
            {n: sc('stat2_n','50+'),  l: sc('stat2_l','خطة مكتملة')},
            {n: sc('stat3_n','15+'),  l: sc('stat3_l','مستشار معتمد')},
            {n: sc('stat4_n','200+'), l: sc('stat4_l','سياسة مبنية')},
          ].map((s,i) => (
            <Card key={i} style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: colors.teal }}>{s.n}</div>
              <div style={{ fontSize: 13, color: colors.gray, marginTop: 4 }}>{s.l}</div>
            </Card>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );

  // ── بيانات السياسات — الثابتة كـ fallback، يُستبدل بالبيانات من API ──────
  const POLICY_DEFAULTS = [
    { id:1, icon:'👥', name:'لائحة الموارد البشرية',                             price:1500, sections:['معلومات المنظمة','رؤية الموارد البشرية','الهيكل التنظيمي','التوظيف والتعيين','التدريب والتطوير','الرواتب والمزايا','سياسة الإجازات','إنهاء الخدمة'] },
    { id:2, icon:'📢', name:'السياسات الإعلامية',                                 price:1200, sections:['معلومات المنظمة','الهوية البصرية','التواصل الإعلامي','وسائل التواصل الاجتماعي','الأزمات الإعلامية','المتحدث الرسمي'] },
    { id:3, icon:'⚖️', name:'سياسات الحوكمة',                                    price:1800, sections:['معلومات المنظمة','مجلس الإدارة','اللجان','التصويت واتخاذ القرار','تضارب المصالح','الشفافية والإفصاح','المحاسبية'] },
    { id:4, icon:'🏦', name:'لائحة تنظيم التبرعات',                              price:1000, sections:['معلومات المنظمة','أهداف التبرع','آليات التبرع','الشفافية والمساءلة','الضوابط القانونية','التقارير والإفصاح'] },
    { id:5, icon:'💰', name:'سياسة الموارد المالية',                              price:1500, sections:['معلومات المنظمة','الميزانية التقديرية','الرقابة المالية','الشفافية المالية','الصلاحيات المالية','التدقيق والمراجعة'] },
    { id:6, icon:'🔒', name:'سياسة خصوصية المستفيد والسرية والافصاح',            price:1200, sections:['معلومات المنظمة','تعريف البيانات','جمع البيانات','حماية البيانات','حقوق المستفيدين','الإفصاح والشفافية'] },
    { id:7, icon:'📊', name:'سياسات المتابعة والتقييم',                          price:1000, sections:['معلومات المنظمة','إطار المتابعة','أدوات التقييم','مؤشرات الأداء','التقارير الدورية','التحسين المستمر'] },
  ];
  // دمج البيانات الديناميكية من API مع الـ fallback الثابت
  const allPolicies = publicPolicies.length > 0
    ? publicPolicies.map(p => {
        const def = POLICY_DEFAULTS.find(d => d.id === p.id) || {};
        return { ...def, ...p, icon: def.icon || '📋' };
      })
    : POLICY_DEFAULTS;

  // ============== SERVICES PAGE ==============
  const ServicesPage = () => (
    <div style={{ width: "100%", minHeight: "100vh" }} className="geo-bg">
      <PublicNav />
      <div style={{ background: `linear-gradient(135deg, ${colors.teal}, #0D4F5E)`, padding: "50px 40px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: 32, fontWeight: 800 }}>خدمات منصة دفة</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginTop: 10 }}>{sc('services_hero_subtitle','ثلاثة أنظمة متكاملة لبناء منظمتك')}</p>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "50px 40px" }}>
        {/* Service 1 */}
        <Card accent style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: colors.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: colors.orange }}><IcTarget width={36} height={36}/></div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.tealDark, marginBottom: 6 }}>نظام التخطيط الاستراتيجي</h2>
              <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, marginBottom: 16 }}>{sc('strategic_service_desc','بناء الخطة الاستراتيجية الكاملة للمنظمة من خلال 11 وحدة تخطيطية متسلسلة.')}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {strategicUnits.map(u => <Badge key={u.id} text={u.name} color="teal" small />)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: colors.teal }}>{sc('strategic_service_price','5,000')} ريال</span>
                <Btn small onClick={() => navigate("register")}>ابدأ الآن</Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* Service 2 */}
        <Card accent style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: colors.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: colors.orange }}><IcCog width={36} height={36}/></div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.tealDark, marginBottom: 6 }}>نظام التخطيط التشغيلي</h2>
              <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, marginBottom: 16 }}>{sc('operational_service_desc','تحويل المبادرات الاستراتيجية إلى خطة تشغيلية مفصلة.')}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {operationalUnits.map(u => <Badge key={u.id} text={u.name} color="teal" small />)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: colors.teal }}>{sc('operational_service_price','3,500')} ريال</span>
                <Btn small onClick={() => navigate("register")}>ابدأ الآن</Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* Service 3 */}
        <Card accent style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: colors.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: colors.orange }}><IcClipboard width={36} height={36}/></div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.tealDark, marginBottom: 6 }}>نظام بناء السياسات واللوائح</h2>
              <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, marginBottom: 16 }}>{sc('policies_service_desc','بناء السياسات واللوائح الداخلية عبر استبيانات ذكية موجهة.')}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {allPolicies.map(p => <Badge key={p.id} text={`${p.icon} ${p.name}`} color="teal" small />)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 14, color: colors.gray }}>تسعير مستقل لكل سياسة — يبدأ من</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: colors.teal }}>{sc('policies_min_price','1,000')} ريال</span>
                <Btn small onClick={() => navigate("register")}>ابدأ الآن</Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* Unit Structure */}
        <Card style={{ padding: 32, textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 20 }}>هيكل الوحدة التخطيطية</h2>
          <p style={{ fontSize: 13, color: colors.gray, marginBottom: 20 }}>كل وحدة تخطيطية (في الأنظمة الثلاثة) تتكون من 6 مكونات + اعتماد المستشار</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {["نبذة", "شرح مكتوب", "إرشادات", "فيديو", "خدمة الدردشة", "نماذج عمل", "اعتماد المستشار"].map((c, i) => (
              <div key={i} style={{ padding: "10px 18px", borderRadius: 10, background: i === 6 ? colors.orange : colors.tealCard, color: "white", fontSize: 13, fontWeight: 600 }}>{c}</div>
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
      <div style={{ background: `linear-gradient(135deg, ${colors.teal}, #0D4F5E)`, padding: "50px 40px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: 32, fontWeight: 800 }}>الأسعار</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginTop: 10 }}>{sc('pricing_hero_subtitle','أسعار مناسبة لجميع المنظمات غير الربحية')}</p>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "50px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
          {[
            { title: "التخطيط الاستراتيجي", price: sc('strategic_price','5,000'),   icon: <IcTarget width={36} height={36}/>, features: ["11 وحدة تخطيطية", "فيديوهات تعليمية", "شرح مكتوب وإرشادات", "نماذج عمل تفاعلية", "دردشة مع المستشار", "مراجعة واعتماد المستشار", "وثيقة استراتيجية نهائية"], popular: true },
            { title: "التخطيط التشغيلي",    price: sc('operational_price','3,500'), icon: <IcCog width={36} height={36}/>,    features: ["5 وحدات تخطيطية", "استيراد من الخطة الاستراتيجية", "مخطط جانت 12 شهر", "تعيين المسؤولين", "ميزانية تفصيلية", "مراجعة واعتماد المستشار", "وثيقة تشغيلية نهائية"], popular: false },
            { title: "السياسات واللوائح",    price: `من ${sc('policies_min_price','1,000')}`, icon: <IcClipboard width={36} height={36}/>, features: ["7 سياسات متاحة", "استبيانات ذكية موجهة", "توليد تلقائي للسياسة", "فيديوهات تعليمية", "مراجعة مستشار", "تسعير مستقل لكل سياسة", "تحميل PDF / Word"], popular: false },
          ].map((p, i) => (
            <Card key={i} style={{ padding: 28, border: p.popular ? `2px solid ${colors.orange}` : `1px solid ${colors.grayBorder}`, position: "relative", overflow: "visible" }}>
              {p.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: colors.orange, color: "white", padding: "4px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>الأكثر طلباً</div>}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <span style={{ color: colors.teal }}>{p.icon}</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: colors.tealDark, marginTop: 8 }}>{p.title}</h3>
                <div style={{ marginTop: 12 }}><span style={{ fontSize: 32, fontWeight: 800, color: colors.teal }}>{p.price}</span><span style={{ fontSize: 14, color: colors.gray }}> ريال</span></div>
              </div>
              {p.features.map((f, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: fi < p.features.length - 1 ? `1px solid ${colors.grayLight}` : "none" }}>
                  <span style={{ color: colors.green, display: "flex" }}><IcCheck width={14} height={14} /></span>
                  <span style={{ fontSize: 13, color: colors.tealDark }}>{f}</span>
                </div>
              ))}
              <Btn full style={{ marginTop: 20 }} onClick={() => navigate("register")}>{p.popular ? "ابدأ الآن" : "اشترك"}</Btn>
            </Card>
          ))}
        </div>

        <Card style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.tealDark, marginBottom: 14, textAlign: "center" }}>الخدمات الإضافية</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              {t: sc('addon1_title','اعتماد الخطة من جهة استشارية'), p: sc('addon1_price','2,000'), d: sc('addon1_desc','اعتماد رسمي من جهة معتمدة')},
              {t: sc('addon2_title','تحكيم السياسات من مستشار'),      p: sc('addon2_price','2,000'), d: sc('addon2_desc','تحكيم ومراجعة متعمقة')},
              {t: sc('addon3_title','تصميم احترافي للوثائق'),          p: sc('addon3_price','1,500'), d: sc('addon3_desc','تصميم بهوية المنظمة')},
            ].map((a,i) => (
              <div key={i} style={{ padding: 16, background: colors.grayLight, borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark }}>{a.t}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: colors.orange, margin: "8px 0" }}>{a.p} ريال</div>
                <div style={{ fontSize: 11, color: colors.gray }}>{a.d}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>تسعير السياسات واللوائح (مستقل)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["السياسة", "الأقسام", "السعر"].map(h => <th key={h} style={{ padding: "10px 12px", background: colors.tealCard, color: "white", fontSize: 12, textAlign: "right" }}>{h}</th>)}</tr></thead>
            <tbody>{allPolicies.map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{p.icon} {p.name}</td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: colors.gray }}>{p.sections.length} أقسام</td>
                <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, color: colors.teal }}>{p.price.toLocaleString('en-US')} ريال</td>
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
      <div style={{ background: `linear-gradient(135deg, ${colors.teal}, #0D4F5E)`, padding: "50px 40px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: 32, fontWeight: 800 }}>تواصل معنا</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginTop: 10 }}>{sc('contact_hero_subtitle','نسعد بتواصلكم والإجابة على استفساراتكم')}</p>
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "50px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
          <Card style={{ padding: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 20 }}>أرسل رسالة</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Input label="الاسم" placeholder="اسمك الكامل" />
                <Input label="المنظمة" placeholder="اسم المنظمة" />
              </div>
              <Input label="البريد الإلكتروني" placeholder="email@example.com" type="email" />
              <Input label="رقم الجوال" placeholder="+966 5X XXX XXXX" />
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, display: "block", marginBottom: 6 }}>الموضوع</label>
                <select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif" }}>
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
              <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>معلومات التواصل</h3>
              {[
                { icon: <IcMail width={20} height={20}/>,  title: "البريد الإلكتروني", value: sc('contact_email','info@daffa.sa') },
                { icon: <IcPhone width={20} height={20}/>, title: "الهاتف",             value: sc('contact_phone','+966 55 XXX XXXX') },
                { icon: <IcMapPin width={20} height={20}/>,title: "العنوان",            value: sc('contact_address','الرياض، المملكة العربية السعودية') },
                { icon: <IcClock width={20} height={20}/>, title: "ساعات العمل",        value: sc('contact_hours','الأحد - الخميس: 8 ص - 5 م') },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < 3 ? `1px solid ${colors.grayLight}` : "none" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: colors.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", color: colors.orange }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, color: colors.gray }}>{c.title}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark }}>{c.value}</div>
                  </div>
                </div>
              ))}
            </Card>

            <Card style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>تابعنا</h3>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "𝕏 تويتر",  href: sc('social_twitter','') },
                  { label: "لينكدإن",  href: sc('social_linkedin','') },
                  { label: "انستغرام", href: sc('social_instagram','') },
                ].map((s, i) => (
                  s.href
                    ? <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px 8px", background: colors.grayLight, borderRadius: 10, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 600, color: colors.tealDark, textDecoration: "none", display: "block" }}>{s.label}</a>
                    : <div key={i} style={{ flex: 1, padding: "12px 8px", background: colors.grayLight, borderRadius: 10, textAlign: "center", fontSize: 12, fontWeight: 600, color: colors.tealDark }}>{s.label}</div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: 24, marginTop: 16, background: `${colors.teal}08`, border: `1.5px solid ${colors.teal}20` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.teal, marginBottom: 8 }}>هل تريد عرض تقديمي؟</h3>
              <p style={{ fontSize: 12, color: colors.gray, lineHeight: 1.7 }}>يمكننا تقديم عرض تفصيلي عن المنصة لفريقكم. تواصلوا معنا لتحديد موعد مناسب.</p>
              <Btn small variant="secondary" style={{ marginTop: 10 }}>طلب عرض تقديمي</Btn>
            </Card>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );

  // ============== LOGIN PAGE ==============
  const LoginPage = () => (
    <div className="geo-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ width: 420, padding: 40, textAlign: "center" }}>
        <Logo size="md" />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.tealDark, margin: "24px 0" }}>تسجيل الدخول</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "right" }}>
          <Input label="البريد الإلكتروني" placeholder="example@org.sa" type="email" />
          <Input label="كلمة المرور" placeholder="••••••••" type="password" />
          <div style={{ textAlign: "left" }}><a style={{ fontSize: 12, color: colors.orange, cursor: "pointer" }}>نسيت كلمة المرور؟</a></div>
          <Btn full onClick={() => navigate("client-dash", "client")}>دخول</Btn>
          <p style={{ fontSize: 13, color: colors.gray, textAlign: "center" }}>ليس لديك حساب؟ <a onClick={() => navigate("register")} style={{ color: colors.teal, fontWeight: 600, cursor: "pointer" }}>سجل الآن</a></p>
        </div>
      </Card>
    </div>
  );

  // ============== REGISTER PAGE ==============
  const RegisterPage = () => {
    const [regLogo, setRegLogo] = React.useState(null);
    const [regLogoPreview, setRegLogoPreview] = React.useState(null);
    const handleRegLogo = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setRegLogo(file);
      const r = new FileReader();
      r.onload = ev => setRegLogoPreview(ev.target.result);
      r.readAsDataURL(file);
    };
    return (
      <div className="geo-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Card style={{ width: 520, padding: 40 }}>
          <div style={{ textAlign: "center" }}><Logo size="md" /></div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.tealDark, margin: "20px 0", textAlign: "center" }}>إنشاء حساب جديد</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="اسم المنظمة" placeholder="جمعية أثر" />
            <Input label="نوع المنظمة" placeholder="غير ربحية" />
            <Input label="اسم الممثل" placeholder="الاسم الكامل" />
            <Input label="البريد الإلكتروني" placeholder="email@org.sa" type="email" />
            <Input label="رقم الجوال" placeholder="05XXXXXXXX" />
            <Input label="القطاع" placeholder="تعليم، صحة..." />
            <Input label="كلمة المرور" placeholder="••••••••" type="password" />
            <Input label="تأكيد كلمة المرور" placeholder="••••••••" type="password" />
          </div>
          {/* شعار المنظمة */}
          <div style={{ margin: "14px 0", padding: "16px", background: colors.grayLight, borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 10 }}>
              شعار المنظمة <span style={{ fontSize: 11, fontWeight: 400, color: colors.gray }}>(اختياري)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: `2px solid ${colors.grayBorder}`, background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {regLogoPreview ? (
                  <img src={regLogoPreview} alt="شعار" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <span style={{ color: "#fff" }}><IcBuilding width={20} height={20} /></span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {regLogo ? (
                  <div style={{ fontSize: 11, color: colors.green || "#16a34a", fontWeight: 600, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {regLogo.name}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: colors.gray, marginBottom: 8 }}>PNG / JPG / WebP — بحد أقصى 2 ميغابايت</div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", background: "#fff", border: `1.5px solid ${colors.grayBorder}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: colors.tealDark, fontFamily: "'Cairo', sans-serif", flexShrink: 0 }}>
                    {regLogo ? "تغيير الشعار" : "اختر شعاراً"}
                    <input type="file" accept="image/*" onChange={handleRegLogo} style={{ display: "none" }} />
                  </label>
                  {regLogo && (
                    <button onClick={() => { setRegLogo(null); setRegLogoPreview(null); }} style={{ padding: "7px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "'Cairo', sans-serif", flexShrink: 0 }}>
                      حذف
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 16px", fontSize: 12, color: colors.gray }}>
            <input type="checkbox" style={{ accentColor: colors.teal }} />
            <span>أوافق على الشروط والأحكام</span>
          </div>
          <Btn full onClick={() => navigate("client-dash", "client")}>تسجيل</Btn>
          <p style={{ fontSize: 13, color: colors.gray, textAlign: "center", marginTop: 14 }}>لديك حساب؟ <a onClick={() => navigate("login")} style={{ color: colors.teal, fontWeight: 600, cursor: "pointer" }}>تسجيل الدخول</a></p>
        </Card>
      </div>
    );
  };

  // ============== CLIENT DASHBOARD ==============
  const ClientDashboard = () => (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 24 }}>
        مرحباً{authUser?.org_name ? `، ${authUser.org_name}` : authUser?.rep_name ? `، ${authUser.rep_name}` : ''}
      </h2>

      {!dashPhases ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[0, 1, 2].map(i => (
            <Card key={i} style={{ opacity: 0.5 }}>
              <div style={{ height: 20, background: colors.grayLight, borderRadius: 6, marginBottom: 12 }} />
              <div style={{ height: 8, background: colors.grayLight, borderRadius: 4, marginBottom: 10 }} />
              <div style={{ height: 12, background: colors.grayLight, borderRadius: 4, width: "60%" }} />
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {dashPhases.map((s, i) => (
            <Card key={i} accent style={{ cursor: "pointer" }} onClick={s.onClick}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark }}>{s.title}</h3>
                <Badge text={s.status} color={s.statusColor} small />
              </div>
              <ProgressBar percent={s.progress} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span style={{ fontSize: 12, color: colors.gray }}>{s.sub}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.teal }}>{s.progress}%</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>آخر النشاطات</h3>
          {!notifications ? (
            <div style={{ padding: 20, textAlign: "center", color: colors.gray, fontSize: 12 }}>جارٍ التحميل…</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: colors.gray, fontSize: 12 }}>لا توجد نشاطات بعد</div>
          ) : (() => {
            const notifBadge = { unit_approved: { text: "معتمد", color: "green" }, unit_revision: { text: "تعديل", color: "orange" }, op_approved: { text: "معتمد", color: "green" }, op_revision: { text: "تعديل", color: "orange" }, policy_approved: { text: "معتمد", color: "green" }, policy_revision: { text: "تعديل", color: "orange" }, workflow_completed: { text: "مكتمل", color: "green" }, op_workflow_completed: { text: "مكتمل", color: "green" }, admin_message: { text: "رسالة", color: "orange" }, message: { text: "رسالة", color: "blue" }, payment: { text: "دفع", color: "teal" } };
            const recent = notifications.slice(0, 4);
            return recent.map((n, i) => {
              const b = notifBadge[n.type] || { text: "إشعار", color: "gray" };
              return (
                <div key={n.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < recent.length - 1 ? `1px solid ${colors.grayLight}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Badge text={b.text} color={b.color} small />
                    <span style={{ fontSize: 13, color: colors.tealDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: colors.gray, flexShrink: 0, marginRight: 8 }}>{n.time}</span>
                </div>
              );
            });
          })()}
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>المستشار المعيّن</h3>
          {!dashConsultant ? (
            <div style={{ padding: 20, textAlign: "center", color: colors.gray, fontSize: 12 }}>لم يتم تعيين مستشار بعد</div>
          ) : (
            <div style={{ textAlign: "center" }}>
              {dashConsultant.avatar ? (
                <img src={`${import.meta.env.VITE_STORAGE_URL || 'http://daffaback.test'}/storage/${dashConsultant.avatar}`} alt={dashConsultant.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px", display: "block" }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${colors.teal}, ${colors.orange})`, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 24, fontWeight: 700 }}>
                  {dashConsultant.avatar_initial || (dashConsultant.name || '').charAt(0)}
                </div>
              )}
              <h4 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark }}>{dashConsultant.name}</h4>
              <p style={{ fontSize: 12, color: colors.gray, margin: "4px 0 12px" }}>{dashConsultant.specialty || 'مستشار معتمد'}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 12 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= Math.round(dashConsultant.rating || 0) ? colors.yellow : colors.grayLight }}>{Icons.star}</span>)}
              </div>
              <Btn small variant="secondary" full onClick={() => navigate("client-chat")}>محادثة</Btn>
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  // ============== STRATEGIC ROADMAP ==============
  // ============== STRATEGIC PLANNING DATA ==============
  const strategicUnits = [
    { id: 1, name: "تحليل البيئة الداخلية", status: "approved",
      overview: "تحليل البيئة الداخلية هو عملية تقييم شاملة للموارد والقدرات الداخلية للمنظمة، بما في ذلك الموارد البشرية والمالية والبنية التحتية والعمليات. يساعد هذا التحليل في تحديد نقاط القوة والضعف.",
      overview2: "يُعد هذا التحليل الأساس الذي تُبنى عليه بقية مراحل التخطيط الاستراتيجي، حيث يوفر فهماً عميقاً للوضع الراهن للمنظمة.",
      topics: [{ t: "مفهوم تحليل البيئة الداخلية", d: "أداة إدارية تُستخدم لتقييم العوامل الداخلية التي تؤثر على أداء المنظمة وقدرتها على تحقيق أهدافها." }, { t: "محاور التحليل", d: "يشمل: الموارد البشرية، الموارد المالية، البنية التحتية والتقنية، العمليات والإجراءات، والثقافة التنظيمية." }, { t: "أدوات التحليل", d: "مصفوفة SWOT، تحليل سلسلة القيمة، تحليل الموارد والقدرات (VRIO)." }],
      steps: [{ title: "اجمع البيانات", desc: "ابدأ بجمع البيانات من التقارير السنوية والوثائق الداخلية" }, { title: "حلل الموارد البشرية", desc: "قيّم كفاءة الفريق، الهيكل التنظيمي، مستوى المهارات" }, { title: "قيّم الموارد المالية", desc: "راجع الميزانية، مصادر التمويل، التدفقات النقدية" }],
      tip: "لا تعتمد على رأي شخص واحد، اجمع آراء متعددة من مختلف الأقسام.",
      videoDuration: "12:30", tableHeaders: ["العنصر", "نقاط القوة", "نقاط الضعف", "ملاحظات"], tableRows: ["الموارد البشرية", "الموارد المالية", "البنية التحتية", "العمليات والإجراءات", "الثقافة التنظيمية"],
      templateType: "swot" },
    { id: 2, name: "تحليل البيئة الخارجية", status: "approved",
      overview: "تحليل البيئة الخارجية هو دراسة منهجية للعوامل الخارجية المؤثرة على المنظمة باستخدام أدوات مثل PESTEL وتحليل أصحاب المصلحة لتحديد الفرص والتهديدات.",
      overview2: "يساعد هذا التحليل المنظمة على الاستعداد للتغييرات في البيئة المحيطة واستثمار الفرص وتجنب التهديدات.",
      topics: [{ t: "تحليل PESTEL", d: "دراسة العوامل السياسية والاقتصادية والاجتماعية والتقنية والبيئية والقانونية المؤثرة." }, { t: "تحليل أصحاب المصلحة", d: "تحديد الأطراف ذات العلاقة وتقييم مستوى تأثيرها واهتمامها بالمنظمة." }, { t: "تحليل المنافسين", d: "دراسة المنظمات المماثلة وتحديد الميزة التنافسية." }],
      steps: [{ title: "حدد العوامل الخارجية", desc: "استخدم إطار PESTEL لتصنيف العوامل الخارجية" }, { title: "قيّم التأثير", desc: "حدد مستوى تأثير كل عامل على المنظمة (إيجابي/سلبي)" }, { title: "حلل أصحاب المصلحة", desc: "ارسم خريطة أصحاب المصلحة حسب التأثير والاهتمام" }],
      tip: "راقب التغييرات التنظيمية والقانونية باستمرار فهي الأكثر تأثيراً على القطاع غير الربحي.",
      videoDuration: "15:45", tableHeaders: ["العامل", "الوصف", "التأثير", "المستوى"], tableRows: ["سياسي", "اقتصادي", "اجتماعي", "تقني", "بيئي", "قانوني"],
      templateType: "pestel" },
    { id: 3, name: "دراسة الاحتياجات المجتمعية", status: "revision",
      overview: "دراسة الاحتياجات المجتمعية هي عملية بحثية منهجية لتحديد وتصنيف وترتيب أولويات احتياجات المجتمع المستهدف الذي تخدمه المنظمة.",
      overview2: "تُعد هذه الدراسة حجر الأساس لتحديد البرامج والمبادرات التي ستتبناها المنظمة لتحقيق أثر حقيقي.",
      topics: [{ t: "منهجيات البحث", d: "الاستبيانات، المقابلات، مجموعات التركيز، تحليل البيانات الثانوية." }, { t: "تصنيف الاحتياجات", d: "احتياجات أساسية، تنموية، طارئة، ومستقبلية." }, { t: "ترتيب الأولويات", d: "استخدام مصفوفة الأولويات لتحديد أهم الاحتياجات." }],
      steps: [{ title: "حدد المجتمع المستهدف", desc: "عرّف بدقة الفئة المستهدفة وخصائصها الديموغرافية" }, { title: "اجمع البيانات", desc: "استخدم استبيانات ومقابلات لجمع المعلومات من المستفيدين" }, { title: "حلل ورتّب الأولويات", desc: "صنّف الاحتياجات حسب الأهمية والإلحاح" }],
      tip: "اسمع صوت المستفيد الفعلي، لا تفترض احتياجاته من مكتبك.",
      videoDuration: "18:20", tableHeaders: ["الاحتياج", "الوصف", "الأولوية", "المصدر"], tableRows: ["الدعم التعليمي", "التأهيل المهني", "الدعم النفسي", "الرعاية الصحية", "الإسكان"],
      templateType: "needs" },
    { id: 4, name: "التحليل الاستراتيجي", status: "submitted",
      overview: "التحليل الاستراتيجي هو عملية دمج نتائج تحليل البيئة الداخلية والخارجية لاستخلاص الخيارات الاستراتيجية المتاحة باستخدام مصفوفة TOWS.",
      overview2: "يربط هذا التحليل بين نقاط القوة والضعف من جهة، والفرص والتهديدات من جهة أخرى لتوليد استراتيجيات فعالة.",
      topics: [{ t: "مصفوفة TOWS", d: "أداة تحليلية تجمع بين نتائج SWOT لتوليد 4 أنواع من الاستراتيجيات." }, { t: "الخيارات الاستراتيجية", d: "SO (هجومية)، WO (علاجية)، ST (دفاعية)، WT (انسحابية)." }, { t: "تقييم الخيارات", d: "تقييم كل خيار استراتيجي حسب الجدوى والأثر والموارد المطلوبة." }],
      steps: [{ title: "راجع نتائج التحليلات السابقة", desc: "استرجع نقاط القوة والضعف والفرص والتهديدات" }, { title: "أنشئ مصفوفة TOWS", desc: "ضع الاستراتيجيات في كل مربع من المصفوفة" }, { title: "قيّم الخيارات", desc: "رتّب الاستراتيجيات حسب الأولوية والجدوى" }],
      tip: "ركّز على الاستراتيجيات التي تستثمر نقاط القوة في الفرص المتاحة (SO) فهي الأقوى أثراً.",
      videoDuration: "14:00", tableHeaders: [], tableRows: [],
      templateType: "tows" },
    { id: 5, name: "المبادرات الاستراتيجية", status: "in_progress",
      overview: "المبادرات الاستراتيجية هي المشاريع والبرامج الرئيسية التي ستنفذها المنظمة لتحقيق أهدافها الاستراتيجية خلال فترة الخطة.",
      overview2: "كل مبادرة يجب أن تكون مرتبطة بهدف استراتيجي واضح ولها مخرجات قابلة للقياس وإطار زمني محدد.",
      topics: [{ t: "تعريف المبادرات", d: "مشاريع وبرامج محددة بأهداف ومخرجات وميزانية وجدول زمني." }, { t: "معايير اختيار المبادرات", d: "الأثر، الجدوى، التوافق مع الرسالة، توفر الموارد." }, { t: "ربط المبادرات بالأهداف", d: "كل مبادرة يجب أن تخدم هدفاً استراتيجياً واحداً على الأقل." }],
      steps: [{ title: "حدد المبادرات", desc: "اقترح مبادرات تخدم كل هدف استراتيجي" }, { title: "صمم كل مبادرة", desc: "حدد المخرجات والإطار الزمني والميزانية والمسؤول" }, { title: "رتّب الأولويات", desc: "قيّم المبادرات حسب الأثر والجدوى" }],
      tip: "لا تكثر من المبادرات، ركّز على 5-8 مبادرات رئيسية يمكن تنفيذها فعلاً.",
      videoDuration: "16:30", tableHeaders: [], tableRows: [],
      templateType: "initiatives" },
    { id: 6, name: "التوجهات الاستراتيجية", status: "not_started",
      overview: "التوجهات الاستراتيجية تشمل صياغة الرؤية والرسالة والقيم والأهداف الاستراتيجية العامة التي توجه عمل المنظمة.",
      overview2: "هذه التوجهات هي البوصلة التي تحدد اتجاه المنظمة وتوحّد جهود فريق العمل نحو غاية مشتركة.",
      topics: [{ t: "الرؤية", d: "صورة مستقبلية طموحة لما تريد المنظمة تحقيقه على المدى البعيد." }, { t: "الرسالة", d: "بيان واضح لسبب وجود المنظمة وما تقدمه ولمن." }, { t: "القيم", d: "المبادئ والمعتقدات التي توجه سلوك المنظمة وقراراتها." }],
      steps: [{ title: "صِغ الرؤية", desc: "اكتب جملة ملهمة تصف مستقبل المنظمة المنشود" }, { title: "صِغ الرسالة", desc: "حدد ماذا تفعل المنظمة ولمن وكيف" }, { title: "حدد القيم والأهداف", desc: "اختر 4-6 قيم جوهرية وحدد الأهداف الاستراتيجية" }],
      tip: "الرؤية الجيدة ملهمة وطموحة لكنها واقعية وقابلة للتحقيق.",
      videoDuration: "13:15", tableHeaders: [], tableRows: [],
      templateType: "directions" },
    { id: 7, name: "بناء نظرية التغيير", status: "not_started",
      overview: "نظرية التغيير هي إطار منطقي يوضح كيف ستؤدي أنشطة المنظمة إلى تحقيق الأثر المطلوب من خلال سلسلة من النتائج المترابطة.",
      overview2: "تساعد نظرية التغيير في فهم العلاقة السببية بين ما تفعله المنظمة والأثر الذي تحدثه في المجتمع.",
      topics: [{ t: "مكونات نظرية التغيير", d: "المدخلات → الأنشطة → المخرجات → النتائج → الأثر." }, { t: "الافتراضات", d: "الشروط التي يجب أن تتحقق لنجاح سلسلة النتائج." }, { t: "المؤشرات", d: "كيف نقيس التقدم في كل مرحلة من مراحل التغيير." }],
      steps: [{ title: "حدد الأثر المطلوب", desc: "ابدأ من النهاية: ما التغيير الذي تريد إحداثه؟" }, { title: "ارسم سلسلة النتائج", desc: "حدد المخرجات والنتائج المؤدية للأثر" }, { title: "حدد الافتراضات", desc: "وضّح الشروط اللازمة لنجاح كل مرحلة" }],
      tip: "ابدأ من الأثر المطلوب وارجع للخلف، لا تبدأ من الأنشطة.",
      videoDuration: "20:00", tableHeaders: [], tableRows: [],
      templateType: "toc" },
    { id: 8, name: "نموذج عمل المنظمة", status: "not_started",
      overview: "نموذج عمل المنظمة (Business Model Canvas) هو أداة لتوضيح كيف تخلق المنظمة قيمة وتقدمها للمستفيدين وتضمن استدامتها المالية.",
      overview2: "يوفر نظرة شاملة على 9 مكونات أساسية تغطي جميع جوانب عمل المنظمة.",
      topics: [{ t: "المكونات التسعة", d: "شرائح المستفيدين، القيم المقترحة، القنوات، العلاقات، مصادر الدخل، الموارد، الأنشطة، الشراكات، التكاليف." }, { t: "القيم المقترحة", d: "ما القيمة الفريدة التي تقدمها المنظمة للمستفيدين؟" }, { t: "الاستدامة المالية", d: "كيف تضمن المنظمة تمويلاً مستداماً لعملياتها؟" }],
      steps: [{ title: "حدد شرائح المستفيدين", desc: "من هم المستفيدون الرئيسيون من خدمات المنظمة؟" }, { title: "صِغ القيم المقترحة", desc: "ما المشكلات التي تحلها والقيمة التي تقدمها؟" }, { title: "أكمل باقي المكونات", desc: "القنوات، العلاقات، الموارد، الأنشطة، الشراكات، التكاليف، الدخل" }],
      tip: "استعن بأمثلة من منظمات غير ربحية ناجحة مشابهة لإلهامك.",
      videoDuration: "17:45", tableHeaders: [], tableRows: [],
      templateType: "bmc" },
    { id: 9, name: "مؤشرات الأداء", status: "not_started",
      overview: "مؤشرات الأداء الرئيسية (KPIs) هي مقاييس كمية ونوعية تُستخدم لقياس مدى تقدم المنظمة نحو تحقيق أهدافها الاستراتيجية.",
      overview2: "وضع مؤشرات واضحة وقابلة للقياس يضمن متابعة فعالة للأداء واتخاذ قرارات مبنية على بيانات.",
      topics: [{ t: "معايير SMART", d: "محدد، قابل للقياس، قابل للتحقيق، مرتبط بالهدف، محدد بزمن." }, { t: "أنواع المؤشرات", d: "مؤشرات مخرجات، مؤشرات نتائج، مؤشرات أثر." }, { t: "لوحة المؤشرات", d: "أداة مرئية لعرض حالة المؤشرات بشكل سريع." }],
      steps: [{ title: "حدد مؤشرات لكل هدف", desc: "اربط كل هدف استراتيجي بمؤشر واحد على الأقل" }, { title: "حدد المستهدفات", desc: "ضع قيمة مستهدفة واقعية لكل مؤشر" }, { title: "حدد آلية القياس", desc: "كيف ومتى ومن يقيس كل مؤشر" }],
      tip: "لا تضع أكثر من 3 مؤشرات لكل هدف، التركيز أهم من الشمولية.",
      videoDuration: "11:30", tableHeaders: ["المؤشر", "الهدف المرتبط", "المستهدف", "طريقة القياس", "التكرار", "المسؤول"], tableRows: [],
      templateType: "kpis" },
    { id: 10, name: "الهيكل التنظيمي", status: "not_started",
      overview: "الهيكل التنظيمي هو الإطار الرسمي الذي يحدد تقسيم العمل وتوزيع المسؤوليات وخطوط السلطة والاتصال داخل المنظمة.",
      overview2: "يجب أن يدعم الهيكل التنظيمي تنفيذ الخطة الاستراتيجية ويتناسب مع حجم المنظمة وطبيعة عملها.",
      topics: [{ t: "أنواع الهياكل", d: "هرمي، مسطح، مصفوفي، شبكي — لكل نوع مزايا وعيوب." }, { t: "عناصر الهيكل", d: "الأقسام، المسميات الوظيفية، خطوط الإشراف، نطاق السيطرة." }, { t: "التطوير التنظيمي", d: "كيف يتطور الهيكل مع نمو المنظمة وتوسع أنشطتها." }],
      steps: [{ title: "حدد الأقسام", desc: "قسّم العمل إلى وحدات تنظيمية منطقية" }, { title: "حدد المسميات", desc: "عرّف المسمى الوظيفي والمهام لكل وظيفة" }, { title: "ارسم خطوط الإشراف", desc: "حدد من يتبع من في التسلسل الإداري" }],
      tip: "الهيكل البسيط أفضل، لا تعقّد الأمور بأقسام كثيرة إذا كانت المنظمة صغيرة.",
      videoDuration: "10:00", tableHeaders: [], tableRows: [],
      templateType: "orgchart" },
    { id: 11, name: "الوثيقة الاستراتيجية", status: "not_started",
      overview: "الوثيقة الاستراتيجية هي المخرج النهائي لعملية التخطيط، وتجمع جميع نتائج الوحدات السابقة في وثيقة واحدة متكاملة ومنسقة.",
      overview2: "تُعد هذه الوثيقة المرجع الأساسي للمنظمة خلال فترة الخطة الاستراتيجية وتوزع على جميع أصحاب المصلحة.",
      topics: [{ t: "مكونات الوثيقة", d: "ملخص تنفيذي، التحليلات، التوجهات، المبادرات، المؤشرات، الهيكل." }, { t: "التنسيق والإخراج", d: "تصميم احترافي يعكس هوية المنظمة ويسهّل القراءة." }, { t: "آلية الاعتماد", d: "مراجعة من مجلس الإدارة واعتماد رسمي." }],
      steps: [{ title: "راجع جميع المخرجات", desc: "تأكد من اكتمال ودقة مخرجات الوحدات العشر" }, { title: "نسّق الوثيقة", desc: "رتّب المحتوى وأضف المقدمة والملخص التنفيذي" }, { title: "اعتمد الوثيقة", desc: "قدّم الوثيقة لمجلس الإدارة للاعتماد الرسمي" }],
      tip: "الوثيقة الجيدة موجزة ومركزة، تجنب الإطالة والتكرار.",
      videoDuration: "8:00", tableHeaders: [], tableRows: [],
      templateType: "document" },
  ];

  const statusMap = {
    approved:     { badge: "معتمد",        color: "green" },
    revision:     { badge: "يحتاج تعديل", color: "orange" },
    submitted:    { badge: "تم الإرسال",  color: "blue" },
    in_progress:  { badge: "قيد العمل",   color: "yellow" },
    not_started:  { badge: "لم يبدأ",     color: "gray" },
    locked:       { badge: "مقفل",         color: "gray" },
  };

  const completedCount = strategicUnits.filter(u => u.status === "approved").length;
  const progressPercent = Math.round((completedCount / 11) * 100);

  // ============== STRATEGIC WORKFLOW — سير العمليات الكامل ==============
  const workflowSteps = [
    { id: 0, label: "اختيار الخدمة",              icon: <IcClipboard width={16} height={16}/> },
    { id: 1, label: "اختيار المستشار",             icon: <IcBriefcase width={16} height={16}/> },
    { id: 2, label: "الدفع",                        icon: <IcCreditCard width={16} height={16}/> },
    { id: 3, label: "تعبئة النماذج ومشاهدة المواد", icon: <IcPencil width={16} height={16}/> },
    { id: 4, label: "مراجعة المستشار",             icon: <IcSearch width={16} height={16}/> },
    { id: 5, label: "الاعتماد",                    icon: <IcCheckCircle width={16} height={16}/> },
  ];

  const WorkflowStepper = () => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "16px 0" }}>
        {workflowSteps.map((ws, i) => (
          <React.Fragment key={i}>
            <div onClick={() => i <= strategicStep && setStrategicStep(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: i <= strategicStep ? "pointer" : "default", minWidth: 80, position: "relative" }}>
              <div style={{ width: 40, height: 40, borderRadius: i === strategicStep ? 12 : "50%", background: i < strategicStep ? colors.green : i === strategicStep ? colors.orange : colors.grayLight, color: i <= strategicStep ? "white" : colors.gray, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, transition: "all 0.3s", boxShadow: i === strategicStep ? `0 4px 12px ${colors.orange}40` : "none" }}>
                {i < strategicStep ? <IcCheck width={16} height={16}/> : ws.icon}
              </div>
              <span style={{ fontSize: 10, fontWeight: i === strategicStep ? 700 : 500, color: i < strategicStep ? colors.green : i === strategicStep ? colors.orange : colors.gray, textAlign: "center", maxWidth: 90, lineHeight: 1.3 }}>{ws.label}</span>
            </div>
            {i < workflowSteps.length - 1 && (
              <div style={{ flex: 1, height: 3, background: i < strategicStep ? colors.green : colors.grayBorder, borderRadius: 2, margin: "0 4px", marginBottom: 20, transition: "background 0.3s" }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // ---- Step 0: Service Selection ----
  const StepServiceSelect = () => (
    <div className="animate-in">
      <Card accent style={{ padding: 32, textAlign: "center", marginBottom: 20 }}>
        <Rosette size={56} />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.tealDark, marginTop: 16 }}>نظام التخطيط الاستراتيجي</h2>
        <p style={{ fontSize: 15, color: colors.gray, lineHeight: 1.8, maxWidth: 600, margin: "12px auto 0" }}>بناء الخطة الاستراتيجية الكاملة للمنظمة من خلال 11 وحدة تخطيطية متسلسلة مع مراجعة واعتماد من مستشار متخصص</p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>ما يشمله النظام</h3>
          {["11 وحدة تخطيطية متسلسلة", "فيديوهات تعليمية لكل وحدة", "شرح مكتوب وإرشادات مفصلة", "نماذج عمل جاهزة للتعبئة", "خدمة دردشة مع المستشار", "مراجعة واعتماد من مستشار متخصص", "وثيقة استراتيجية نهائية"].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 6 ? `1px solid ${colors.grayLight}` : "none" }}>
              <span style={{ color: colors.green, display: "flex" }}><IcCheck width={14} height={14}/></span>
              <span style={{ fontSize: 13, color: colors.tealDark }}>{item}</span>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>الوحدات التخطيطية الـ 11</h3>
          {strategicUnits.map((u, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 10 ? `1px solid ${colors.grayLight}` : "none" }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: colors.teal, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{u.id}</span>
              <span style={{ fontSize: 12, color: colors.tealDark }}>{u.name}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark }}>التكلفة</h3>
            <p style={{ fontSize: 13, color: colors.gray, marginTop: 4 }}>تشمل جميع الوحدات + مراجعة المستشار + الوثيقة النهائية</p>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: colors.teal }}>5,000 <span style={{ fontSize: 14 }}>ريال</span></div>
            <div style={{ fontSize: 11, color: colors.gray }}>شامل الضريبة</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <Btn onClick={() => setStrategicStep(1)}>التالي: اختيار المستشار ←</Btn>
      </div>
    </div>
  );

  // ---- Step 1: Consultant Selection ----
  const consultants = [
    { id: 1, name: "أحمد الشمري", spec: "تخطيط استراتيجي", rating: 4.8, exp: 12, projects: 34, available: true, bio: "خبير في التخطيط الاستراتيجي للمنظمات غير الربحية مع خبرة تزيد عن 12 عاماً" },
    { id: 2, name: "سارة العتيبي", spec: "تخطيط وسياسات", rating: 4.6, exp: 8, projects: 22, available: true, bio: "متخصصة في بناء السياسات واللوائح وتطوير الأطر التنظيمية" },
    { id: 3, name: "خالد المالكي", spec: "تخطيط تشغيلي", rating: 4.9, exp: 15, projects: 45, available: false, bio: "استشاري متمرس في التخطيط التشغيلي وإدارة المشاريع" },
    { id: 4, name: "نورة القحطاني", spec: "حوكمة وتطوير", rating: 4.5, exp: 10, projects: 28, available: true, bio: "خبيرة في الحوكمة والتطوير المؤسسي للقطاع غير الربحي" },
  ];

  const StepConsultantSelect = () => (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>اختر المستشار</h2>
      <p style={{ fontSize: 13, color: colors.gray, marginBottom: 20 }}>سيقوم المستشار بمراجعة مخرجاتك في كل وحدة واعتمادها أو طلب تعديل</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {consultants.map(c => (
          <Card key={c.id} accent style={{ cursor: c.available ? "pointer" : "default", border: selectedConsultant === c.id ? `2px solid ${colors.orange}` : "2px solid transparent", opacity: c.available ? 1 : 0.5 }}
            onClick={() => c.available && setSelectedConsultant(c.id)}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${colors.teal}, ${colors.orange})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 24, fontWeight: 700, flexShrink: 0 }}>{c.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark }}>{c.name}</h3>
                  {selectedConsultant === c.id && <div style={{ width: 24, height: 24, borderRadius: "50%", background: colors.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>{Icons.check}</div>}
                </div>
                <Badge text={c.spec} color="teal" small />
                <p style={{ fontSize: 12, color: colors.gray, marginTop: 6, lineHeight: 1.6 }}>{c.bio}</p>
                <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: colors.gray }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><IcStar width={12} height={12}/> {c.rating}</span>
                  <span>{c.exp} سنة خبرة</span>
                  <span>{c.projects} مشروع</span>
                  <Badge text={c.available ? "متاح" : "مشغول"} color={c.available ? "green" : "red"} small />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Btn variant="secondary" onClick={() => setStrategicStep(0)}>→ السابق</Btn>
        <Btn disabled={!selectedConsultant} onClick={() => setStrategicStep(2)}>التالي: الدفع ←</Btn>
      </div>
    </div>
  );

  // ---- Step 2: Payment ----
  const StepPayment = () => {
    const consultant = consultants.find(c => c.id === selectedConsultant);
    return (
      <div className="animate-in">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 20 }}>إتمام الدفع</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Order Summary */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>ملخص الطلب</h3>
            <div style={{ borderBottom: `1px solid ${colors.grayLight}`, paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                <span>نظام التخطيط الاستراتيجي</span><span style={{ fontWeight: 600 }}>5,000 ريال</span>
              </div>
              <div style={{ fontSize: 12, color: colors.gray }}>11 وحدة تخطيطية + مراجعة مستشار</div>
            </div>
            <div style={{ borderBottom: `1px solid ${colors.grayLight}`, paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>المستشار: {consultant?.name}</span><span style={{ color: colors.green, fontSize: 12 }}>مشمول</span>
              </div>
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, marginBottom: 8 }}>خدمات إضافية (اختيارية):</h4>
            {[
              { name: "اعتماد الخطة من جهة استشارية", price: "2,000", checked: false },
              { name: "تصميم احترافي للوثيقة", price: "1,500", checked: false },
            ].map((addon, i) => (
              <label key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${colors.grayLight}`, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" style={{ accentColor: colors.teal }} />
                  <span style={{ fontSize: 13 }}>{addon.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.orange }}>{addon.price} ريال</span>
              </label>
            ))}
            <div style={{ marginTop: 12, padding: "8px 0", display: "flex", justifyContent: "space-between" }}>
              <Input placeholder="كود خصم" />
              <Btn small variant="secondary" style={{ marginRight: 8 }}>تطبيق</Btn>
            </div>
            <div style={{ marginTop: 14, padding: "12px 0", borderTop: `2px solid ${colors.tealDark}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>المجموع الفرعي</span><span>5,000 ريال</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>ضريبة القيمة المضافة (15%)</span><span>750 ريال</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: colors.tealDark, marginTop: 8 }}><span>الإجمالي</span><span>5,750 ريال</span></div>
            </div>
          </Card>

          {/* Payment Form */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>طريقة الدفع</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["بطاقة ائتمان", "مدى", "Apple Pay", "تحويل بنكي"].map((m, i) => (
                <button key={i} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: i === 0 ? `2px solid ${colors.teal}` : `1.5px solid ${colors.grayBorder}`, background: i === 0 ? `${colors.teal}08` : "white", fontSize: 12, fontWeight: i === 0 ? 600 : 400, fontFamily: "'Cairo', sans-serif", cursor: "pointer", color: i === 0 ? colors.teal : colors.gray }}>{m}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input label="رقم البطاقة" placeholder="XXXX XXXX XXXX XXXX" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="تاريخ الانتهاء" placeholder="MM/YY" />
                <Input label="CVV" placeholder="XXX" />
              </div>
              <Input label="اسم حامل البطاقة" placeholder="الاسم كما يظهر على البطاقة" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: "10px 14px", background: colors.greenLight, borderRadius: 8, fontSize: 12, color: colors.green }}>
              <IcLock width={14} height={14}/> عملية دفع آمنة ومشفرة
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <Btn variant="secondary" onClick={() => setStrategicStep(1)}>→ السابق</Btn>
          <Btn onClick={() => setStrategicStep(3)}>ادفع الآن — 5,750 ريال</Btn>
        </div>
      </div>
    );
  };

  // ---- Step 3: Work — Units Roadmap ----
  const StepWork = () => (
    <div className="animate-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Rosette size={36} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.tealDark }}>تعبئة النماذج ومشاهدة المواد</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.grayLight, padding: "6px 12px", borderRadius: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: colors.teal, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>أ</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: colors.tealDark }}>المستشار: {consultants.find(c => c.id === selectedConsultant)?.name || "أحمد الشمري"}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}><ProgressBar percent={progressPercent} height={10} /></div>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.teal }}>{completedCount}/11 — {progressPercent}%</span>
      </div>

      {/* Units Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 12 }}>
        {strategicUnits.slice(0, 5).map(u => {
          const s = statusMap[u.status];
          return (
            <div key={u.id} onClick={() => setActiveUnit(u)} style={{ background: colors.tealCard, borderRadius: 12, padding: "20px 12px", textAlign: "center", borderBottom: `3px solid ${colors.orange}`, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ color: "white", fontSize: 13, fontWeight: 600, marginBottom: 10, minHeight: 40 }}>{u.name}</div>
              <Badge text={s.badge} color={s.color} small />
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 12 }}>
        {strategicUnits.slice(5, 10).map(u => {
          const s = statusMap[u.status];
          return (
            <div key={u.id} onClick={() => setActiveUnit(u)} style={{ background: colors.tealCard, borderRadius: 12, padding: "20px 12px", textAlign: "center", borderBottom: `3px solid ${colors.orange}`, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ color: "white", fontSize: 13, fontWeight: 600, marginBottom: 10, minHeight: 40 }}>{u.name}</div>
              <Badge text={s.badge} color={s.color} small />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <div onClick={() => setActiveUnit(strategicUnits[10])} style={{ background: colors.tealCard, borderRadius: 12, padding: "20px 40px", textAlign: "center", borderBottom: `3px solid ${colors.orange}`, cursor: "pointer", transition: "transform 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; }}>
          <div style={{ color: "white", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>الوثيقة الاستراتيجية</div>
          <Badge text={statusMap[strategicUnits[10].status].badge} color={statusMap[strategicUnits[10].status].color} small />
        </div>
      </div>

      {completedCount >= 2 && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Btn onClick={() => setStrategicStep(4)}>إرسال الكل لمراجعة المستشار ←</Btn>
        </div>
      )}
    </div>
  );

  // ---- Step 4: Consultant Review ----
  const StepReview = () => (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>مراجعة المستشار</h2>
      <p style={{ fontSize: 13, color: colors.gray, marginBottom: 20 }}>يقوم المستشار بمراجعة مخرجاتك واعتمادها أو طلب تعديل</p>

      <Card style={{ marginBottom: 16, padding: "16px 20px", background: colors.blueLight, borderRight: `4px solid ${colors.blue}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: colors.blue, display: "flex" }}><IcSearch width={24} height={24}/></span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.blue }}>جاري المراجعة</div>
            <div style={{ fontSize: 12, color: colors.gray }}>المستشار {consultants.find(c => c.id === selectedConsultant)?.name || "أحمد الشمري"} يراجع مخرجاتك حالياً</div>
          </div>
        </div>
      </Card>

      {strategicUnits.map((u, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${colors.grayLight}`, background: "white", marginBottom: 2, borderRadius: i === 0 ? "10px 10px 0 0" : i === 10 ? "0 0 10px 10px" : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: colors.tealCard, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{u.id}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark }}>{u.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge text={statusMap[u.status].badge} color={statusMap[u.status].color} small />
            {u.status === "revision" && <Btn small variant="ghost" onClick={() => { setStrategicStep(3); setActiveUnit(u); }}>تعديل</Btn>}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Btn variant="secondary" onClick={() => setStrategicStep(3)}>→ العودة لتعبئة النماذج</Btn>
        <Btn onClick={() => setStrategicStep(5)}>طلب الاعتماد النهائي ←</Btn>
      </div>
    </div>
  );

  // ---- Step 5: Approval / Done ----
  const StepApproval = () => (
    <div className="animate-in" style={{ textAlign: "center" }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: colors.greenLight, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", color: colors.green }}><IcSparkles width={48} height={48}/></div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.tealDark, marginBottom: 8 }}>تم اعتماد الخطة الاستراتيجية!</h2>
        <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, marginBottom: 24 }}>تهانينا! تم اعتماد خطتك الاستراتيجية من المستشار. يمكنك الآن تحميل الوثيقة الاستراتيجية النهائية.</p>
        
        <Card accent style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.tealCard, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><IcDocument width={24} height={24}/></div>
            <div style={{ textAlign: "right", flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark }}>الوثيقة الاستراتيجية — {authUser?.org_name || 'المنظمة'}</div>
              <div style={{ fontSize: 12, color: colors.gray }}>الخطة الاستراتيجية</div>
            </div>
            <Btn small>تحميل PDF</Btn>
          </div>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark, marginBottom: 10, textAlign: "right" }}>هل تود خدمات إضافية؟</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: 14, background: colors.grayLight, borderRadius: 10, textAlign: "center", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, color: colors.orange }}><IcPalette width={24} height={24}/></div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>تصميم احترافي للوثيقة</div>
              <div style={{ fontSize: 11, color: colors.orange, marginTop: 4 }}>1,500 ريال</div>
            </div>
            <div style={{ padding: 14, background: colors.grayLight, borderRadius: 10, textAlign: "center", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, color: colors.green }}><IcCheckCircle width={24} height={24}/></div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>اعتماد من جهة استشارية</div>
              <div style={{ fontSize: 11, color: colors.orange, marginTop: 4 }}>2,000 ريال</div>
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn variant="secondary" onClick={() => navigate("operational-roadmap")}>الانتقال للتخطيط التشغيلي ←</Btn>
          <Btn variant="ghost" onClick={() => navigate("client-dash")}>العودة للوحة التحكم</Btn>
        </div>
      </div>
    </div>
  );

  // ---- Main Strategic Planning Component ----
  const StrategicRoadmap = () => (
    <div>
      <WorkflowStepper />
      {strategicStep === 0 && <StepServiceSelect />}
      {strategicStep === 1 && <StepConsultantSelect />}
      {strategicStep === 2 && <StepPayment />}
      {strategicStep === 3 && <StepWork />}
      {strategicStep === 4 && <StepReview />}
      {strategicStep === 5 && <StepApproval />}
    </div>
  );

  // ============== UNIT-SPECIFIC TEMPLATE RENDERERS ==============
  const TemplateRenderer = ({ unit }) => {
    const tt = unit.templateType;
    const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${colors.grayBorder}`, borderRadius: 6, fontSize: 12, fontFamily: "'Cairo', sans-serif" };
    const taStyle = { width: "100%", minHeight: 70, padding: 10, border: `1px solid ${colors.grayBorder}`, borderRadius: 8, fontSize: 12, fontFamily: "'Cairo', sans-serif", resize: "vertical" };

    if (tt === "swot") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 10 }}>تحليل الموارد الداخلية</h4>
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{unit.tableHeaders.map(h => <th key={h} style={{ padding: "10px 12px", background: colors.tealCard, color: "white", fontSize: 12, fontWeight: 600, textAlign: "right" }}>{h}</th>)}</tr></thead>
            <tbody>{unit.tableRows.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${colors.grayBorder}` }}>
                <td style={{ padding: 10, fontSize: 13, fontWeight: 600, background: colors.grayLight }}>{r}</td>
                {[1,2,3].map(c => <td key={c} style={{ padding: 6 }}><input style={inputStyle} placeholder="اكتب هنا..." /></td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 10 }}>مصفوفة SWOT</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[{ title: "نقاط القوة (S)", color: colors.green }, { title: "نقاط الضعف (W)", color: colors.orange }, { title: "الفرص (O)", color: colors.blue }, { title: "التهديدات (T)", color: colors.red }].map((q, i) => (
            <div key={i} style={{ border: `2px solid ${q.color}20`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", background: `${q.color}10`, fontSize: 13, fontWeight: 600, color: q.color }}>{q.title}</div>
              <textarea style={{ ...taStyle, border: "none", minHeight: 80 }} placeholder="اكتب هنا..." />
            </div>
          ))}
        </div>
      </div>
    );

    if (tt === "pestel") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 10 }}>تحليل PESTEL</h4>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <thead><tr>{unit.tableHeaders.map(h => <th key={h} style={{ padding: "10px 12px", background: colors.tealCard, color: "white", fontSize: 12, fontWeight: 600, textAlign: "right" }}>{h}</th>)}</tr></thead>
          <tbody>{unit.tableRows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${colors.grayBorder}` }}>
              <td style={{ padding: 10, fontSize: 13, fontWeight: 600, background: colors.grayLight }}>{r}</td>
              <td style={{ padding: 6 }}><input style={inputStyle} placeholder="وصف العامل..." /></td>
              <td style={{ padding: 6 }}><select style={{ ...inputStyle, padding: "8px 6px" }}><option>إيجابي</option><option>سلبي</option></select></td>
              <td style={{ padding: 6 }}><select style={{ ...inputStyle, padding: "8px 6px" }}><option>عالي</option><option>متوسط</option><option>منخفض</option></select></td>
            </tr>
          ))}</tbody>
        </table>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 10 }}>خريطة أصحاب المصلحة</h4>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["صاحب المصلحة", "مستوى التأثير", "مستوى الاهتمام", "استراتيجية التعامل"].map(h => <th key={h} style={{ padding: "10px 12px", background: colors.tealCard, color: "white", fontSize: 12, fontWeight: 600, textAlign: "right" }}>{h}</th>)}</tr></thead>
          <tbody>{["الجهات الحكومية", "المانحون", "المستفيدون", "الموظفون", "الشركاء"].map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${colors.grayBorder}` }}>
              <td style={{ padding: 10, fontSize: 13, fontWeight: 600, background: colors.grayLight }}>{r}</td>
              {[1,2,3].map(c => <td key={c} style={{ padding: 6 }}><input style={inputStyle} placeholder="..." /></td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    );

    if (tt === "needs") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 10 }}>تعريف المجتمع المستهدف</h4>
        <textarea style={{ ...taStyle, marginBottom: 16 }} placeholder="صف الفئة المستهدفة بدقة: من هم؟ أين يقعون؟ ما خصائصهم؟" />
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 10 }}>جدول الاحتياجات</h4>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead><tr>{unit.tableHeaders.map(h => <th key={h} style={{ padding: "10px 12px", background: colors.tealCard, color: "white", fontSize: 12, fontWeight: 600, textAlign: "right" }}>{h}</th>)}</tr></thead>
          <tbody>{unit.tableRows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${colors.grayBorder}` }}>
              <td style={{ padding: 10, fontSize: 13, fontWeight: 600, background: colors.grayLight }}>{r}</td>
              <td style={{ padding: 6 }}><input style={inputStyle} placeholder="وصف الاحتياج..." /></td>
              <td style={{ padding: 6 }}><select style={{ ...inputStyle, padding: "8px 6px" }}><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select></td>
              <td style={{ padding: 6 }}><input style={inputStyle} placeholder="المصدر..." /></td>
            </tr>
          ))}</tbody>
        </table>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 10 }}>تحليل الفجوات</h4>
        <textarea style={taStyle} placeholder="ما الفجوة بين الاحتياجات الفعلية والخدمات المتاحة حالياً؟" />
      </div>
    );

    if (tt === "tows") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 10 }}>مصفوفة TOWS (التحليل المتقاطع)</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[{ title: "SO — استراتيجيات القوة والفرص", sub: "كيف نستخدم نقاط القوة لاستثمار الفرص؟", color: colors.green },
            { title: "WO — استراتيجيات الضعف والفرص", sub: "كيف نعالج نقاط الضعف لاستثمار الفرص؟", color: colors.blue },
            { title: "ST — استراتيجيات القوة والتهديدات", sub: "كيف نستخدم نقاط القوة لمواجهة التهديدات؟", color: colors.yellow },
            { title: "WT — استراتيجيات الضعف والتهديدات", sub: "كيف نتجنب التهديدات في ظل نقاط الضعف؟", color: colors.red }
          ].map((q, i) => (
            <div key={i} style={{ border: `2px solid ${q.color}20`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 12px", background: `${q.color}10` }}><div style={{ fontSize: 13, fontWeight: 600, color: q.color }}>{q.title}</div><div style={{ fontSize: 11, color: colors.gray }}>{q.sub}</div></div>
              <textarea style={{ ...taStyle, border: "none", minHeight: 100 }} placeholder="اكتب الاستراتيجيات هنا..." />
            </div>
          ))}
        </div>
      </div>
    );

    if (tt === "initiatives") return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal }}>المبادرات الاستراتيجية</h4>
          <Btn small>+ إضافة مبادرة</Btn>
        </div>
        {[{ name: "برنامج التعليم المجتمعي", goal: "تحسين التعليم" }, { name: "مشروع التأهيل المهني", goal: "تمكين الشباب" }, { name: "حملة التوعية الصحية", goal: "تعزيز الصحة" }].map((m, i) => (
          <Card key={i} accent style={{ marginBottom: 12, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="اسم المبادرة" value={m.name} />
              <Input label="الهدف الاستراتيجي المرتبط" value={m.goal} />
              <div style={{ gridColumn: "1/-1" }}><Input label="وصف المبادرة" textarea placeholder="صف المبادرة بالتفصيل..." /></div>
              <Input label="المخرجات المتوقعة" placeholder="ما الذي ستنتجه هذه المبادرة؟" />
              <Input label="الميزانية التقديرية (ريال)" placeholder="50,000" />
              <Input label="تاريخ البداية" type="date" />
              <Input label="تاريخ النهاية" type="date" />
              <Input label="المسؤول" placeholder="اسم المسؤول..." />
            </div>
          </Card>
        ))}
      </div>
    );

    if (tt === "directions") return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 8 }}>الرؤية</h4>
          <textarea style={{ ...taStyle, minHeight: 50, fontSize: 16, fontWeight: 600, textAlign: "center" }} placeholder="أن نكون المنظمة الرائدة في..." />
        </div>
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 8 }}>الرسالة</h4>
          <textarea style={{ ...taStyle, minHeight: 50, textAlign: "center" }} placeholder="نعمل على تقديم... لفئة... من خلال..." />
        </div>
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 8 }}>القيم</h4>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["الشفافية", "الإتقان", "العمل الجماعي", "الابتكار"].map((v, i) => (
              <span key={i} style={{ padding: "6px 16px", borderRadius: 20, background: colors.orangeLight, color: colors.orange, fontSize: 13, fontWeight: 600 }}>{v}</span>
            ))}
            <button style={{ padding: "6px 16px", borderRadius: 20, background: colors.grayLight, color: colors.gray, fontSize: 13, border: "none", cursor: "pointer" }}>+ إضافة قيمة</button>
          </div>
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 10 }}>الأهداف الاستراتيجية</h4>
        {["تحسين جودة التعليم المجتمعي", "تمكين الشباب مهنياً واقتصادياً", "تعزيز الصحة المجتمعية"].map((g, i) => (
          <Card key={i} style={{ marginBottom: 8, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.teal, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{i + 1}</div>
            <input defaultValue={g} style={{ flex: 1, ...inputStyle }} />
          </Card>
        ))}
        <Btn small variant="ghost" style={{ marginTop: 8 }}>+ إضافة هدف</Btn>
      </div>
    );

    if (tt === "toc") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 16 }}>سلسلة نظرية التغيير</h4>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch", overflowX: "auto", paddingBottom: 8 }}>
          {[{ title: "المدخلات", color: "#6366F1", placeholder: "الموارد البشرية\nالموارد المالية\nالبنية التحتية" },
            { title: "الأنشطة", color: colors.teal, placeholder: "برامج تدريب\nحملات توعية\nخدمات مباشرة" },
            { title: "المخرجات", color: colors.blue, placeholder: "عدد المستفيدين\nبرامج منفذة\nمواد منشورة" },
            { title: "النتائج", color: colors.orange, placeholder: "تحسن المعرفة\nتغير السلوك\nزيادة الوعي" },
            { title: "الأثر", color: colors.green, placeholder: "تحسن نوعية الحياة\nتمكين المجتمع\nتنمية مستدامة" }
          ].map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ flex: 1, minWidth: 150, border: `2px solid ${s.color}30`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", background: `${s.color}15`, fontWeight: 700, fontSize: 13, color: s.color, textAlign: "center" }}>{s.title}</div>
                <textarea style={{ ...taStyle, border: "none", minHeight: 120, fontSize: 11 }} placeholder={s.placeholder} />
              </div>
              {i < 4 && <div style={{ display: "flex", alignItems: "center", fontSize: 24, color: colors.orange, fontWeight: 700 }}>←</div>}
            </React.Fragment>
          ))}
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginTop: 20, marginBottom: 8 }}>الافتراضات الأساسية</h4>
        <textarea style={taStyle} placeholder="ما الشروط التي يجب توفرها لنجاح نظرية التغيير؟" />
      </div>
    );

    if (tt === "bmc") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 12 }}>نموذج عمل المنظمة (Business Model Canvas)</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 6 }}>
          {[{ t: "شرائح المستفيدين", p: "من هم المستفيدون؟" }, { t: "العلاقة مع المستفيدين", p: "كيف نتواصل معهم؟" }, { t: "القيم المقترحة", p: "ما القيمة المقدمة؟" }, { t: "الأنشطة الرئيسة", p: "ما الأنشطة الأساسية؟" }, { t: "الشراكات الرئيسة", p: "من الشركاء؟" }].map((s, i) => (
            <div key={i} style={{ border: `1.5px solid ${colors.grayBorder}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "6px 8px", background: colors.tealCard, color: "white", fontSize: 10, fontWeight: 600, textAlign: "center" }}>{s.t}</div>
              <textarea style={{ ...taStyle, border: "none", minHeight: 80, fontSize: 11 }} placeholder={s.p} />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
          {[{ t: "القنوات", p: "كيف نوصل الخدمات؟" }, { t: "الموارد الأساسية", p: "ما الموارد المطلوبة؟" }].map((s, i) => (
            <div key={i} style={{ border: `1.5px solid ${colors.grayBorder}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "6px 8px", background: colors.tealCard, color: "white", fontSize: 10, fontWeight: 600, textAlign: "center" }}>{s.t}</div>
              <textarea style={{ ...taStyle, border: "none", minHeight: 60, fontSize: 11 }} placeholder={s.p} />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[{ t: "مصادر الدخل", p: "تبرعات، منح، رسوم..." }, { t: "هيكل التكاليف", p: "رواتب، إيجار، برامج..." }].map((s, i) => (
            <div key={i} style={{ border: `1.5px solid ${colors.grayBorder}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "6px 8px", background: colors.orange, color: "white", fontSize: 10, fontWeight: 600, textAlign: "center" }}>{s.t}</div>
              <textarea style={{ ...taStyle, border: "none", minHeight: 60, fontSize: 11 }} placeholder={s.p} />
            </div>
          ))}
        </div>
      </div>
    );

    if (tt === "kpis") return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal }}>جدول مؤشرات الأداء</h4>
          <Btn small>+ إضافة مؤشر</Btn>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{unit.tableHeaders.map(h => <th key={h} style={{ padding: "8px 6px", background: colors.tealCard, color: "white", fontSize: 11, fontWeight: 600, textAlign: "right" }}>{h}</th>)}</tr></thead>
          <tbody>{[
            ["نسبة رضا المستفيدين", "تحسين الجودة", "85%", "استبيان", "ربعي", "مدير الجودة"],
            ["عدد المستفيدين", "التوسع", "500", "سجلات", "شهري", "مدير البرامج"],
            ["نسبة تنفيذ الميزانية", "الكفاءة المالية", "95%", "تقارير مالية", "ربعي", "المدير المالي"],
          ].map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${colors.grayBorder}` }}>
              {r.map((c, j) => <td key={j} style={{ padding: 6 }}><input style={{ width: "100%", padding: "6px 8px", border: `1px solid ${colors.grayBorder}`, borderRadius: 4, fontSize: 11, fontFamily: "'Cairo', sans-serif" }} defaultValue={c} /></td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    );

    if (tt === "orgchart") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 16 }}>الهيكل التنظيمي</h4>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "10px 24px", background: colors.tealCard, color: "white", borderRadius: 8, fontWeight: 600, fontSize: 13 }}>المدير التنفيذي</div>
          <div style={{ width: 2, height: 20, background: colors.grayBorder }} />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {["مدير البرامج", "المدير المالي", "مدير الموارد البشرية", "مدير التواصل"].map((d, i) => (
              <div key={i} style={{ padding: "8px 16px", background: colors.teal, color: "white", borderRadius: 8, fontSize: 12, fontWeight: 500 }}>{d}</div>
            ))}
          </div>
          <div style={{ width: 2, height: 20, background: colors.grayBorder }} />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {["منسق تعليم", "منسق صحة", "محاسب", "أخصائي HR", "مصمم"].map((d, i) => (
              <div key={i} style={{ padding: "6px 12px", background: colors.grayLight, color: colors.tealDark, borderRadius: 6, fontSize: 11 }}>{d}</div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 20, padding: 16, background: colors.grayLight, borderRadius: 10 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, marginBottom: 10 }}>+ إضافة وظيفة جديدة</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Input label="المسمى الوظيفي" placeholder="مدير قسم..." />
            <Input label="القسم" placeholder="البرامج..." />
            <Input label="يتبع لـ" placeholder="المدير التنفيذي..." />
          </div>
        </div>
      </div>
    );

    if (tt === "document") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 16 }}>معاينة الوثيقة الاستراتيجية</h4>
        <div style={{ border: `2px solid ${colors.grayBorder}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "24px 30px", background: `linear-gradient(135deg, ${colors.teal}, ${colors.tealDark})`, color: "white", textAlign: "center" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{authUser?.org_name || 'المنظمة'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>الخطة الاستراتيجية</div>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", gap: 20 }}>
              <div style={{ width: 180, flexShrink: 0 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: colors.tealDark, marginBottom: 10 }}>المحتويات</h4>
                {["الملخص التنفيذي", "تحليل البيئة الداخلية", "تحليل البيئة الخارجية", "دراسة الاحتياجات", "التحليل الاستراتيجي", "المبادرات", "التوجهات", "نظرية التغيير", "نموذج العمل", "مؤشرات الأداء", "الهيكل التنظيمي"].map((t, i) => (
                  <div key={i} style={{ fontSize: 11, color: colors.teal, padding: "4px 0", cursor: "pointer", borderBottom: `1px solid ${colors.grayLight}` }}>← {t}</div>
                ))}
              </div>
              <div style={{ flex: 1, fontSize: 13, color: colors.gray, lineHeight: 2 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>الملخص التنفيذي</h3>
                <p>تسعى {authUser?.org_name || 'منظمتكم'} من خلال هذه الخطة الاستراتيجية إلى تحقيق نقلة نوعية في خدمة المجتمع المستهدف...</p>
                <p style={{ marginTop: 8 }}>تتضمن الخطة 3 أهداف استراتيجية رئيسية و8 مبادرات تنفيذية...</p>
                <div style={{ padding: 12, background: colors.grayLight, borderRadius: 8, marginTop: 12, textAlign: "center", fontSize: 12, color: colors.gray }}>... بقية الوثيقة تُولّد تلقائياً من البيانات المدخلة ...</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <Btn>تحميل PDF (تصميم تلقائي)</Btn>
          <Btn variant="secondary">تحميل Word</Btn>
          <Btn variant="ghost">طلب تصميم احترافي</Btn>
        </div>
      </div>
    );

    return <div style={{ color: colors.gray, textAlign: "center", padding: 40 }}>نموذج العمل لهذه الوحدة قيد التطوير</div>;
  };

  // ============== UNIT PAGE ==============
  const UnitPage = () => {
    const unit = activeUnit || strategicUnits[0];
    const [tab, setTab] = useState(0);
    const tabs = ["نبذة", "شرح مكتوب", "إرشادات", "فيديو", "خدمة الدردشة", "نماذج العمل"];
    const nextUnit = strategicUnits.find(u => u.id === unit.id + 1);
    const prevUnit = strategicUnits.find(u => u.id === unit.id - 1);

    return (
      <div className="animate-in">
        <div style={{ fontSize: 12, color: colors.gray, marginBottom: 4 }}>التخطيط الاستراتيجي {">"} {unit.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button onClick={() => setActiveUnit(null)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.teal, display: "flex" }}>{Icons.arrow}</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark }}>{unit.name}</h2>
          <Badge text={`الوحدة ${unit.id} من 11`} color="teal" small />
        </div>

        <StatusBar status={unit.status === "revision" ? "revision" : unit.status === "approved" ? "approved" : unit.status === "submitted" ? "submitted" : unit.status === "in_progress" ? "not_submitted" : "not_submitted"} />

        {/* Unit Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0" }}>
          {prevUnit ? <Btn small variant="ghost" onClick={() => { setActiveUnit(prevUnit); setTab(0); }}>→ الوحدة السابقة: {prevUnit.name}</Btn> : <div />}
          {nextUnit ? <Btn small variant="ghost" onClick={() => { setActiveUnit(nextUnit); setTab(0); }}>الوحدة التالية: {nextUnit.name} ←</Btn> : <div />}
        </div>

        <div style={{ margin: "8px 0 16px" }}>
          <Tab tabs={tabs} active={tab} onChange={setTab} />
        </div>

        <Card>
          {tab === 0 && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>نبذة عن {unit.name}</h3>
              <p style={{ fontSize: 14, color: colors.gray, lineHeight: 2 }}>{unit.overview}</p>
              <p style={{ fontSize: 14, color: colors.gray, lineHeight: 2, marginTop: 12 }}>{unit.overview2}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, padding: "8px 14px", background: colors.grayLight, borderRadius: 8, width: "fit-content", fontSize: 12, color: colors.gray }}>⏱ وقت القراءة: 5 دقائق</div>
            </div>
          )}
          {tab === 1 && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>شرح مكتوب: {unit.name}</h3>
              <div style={{ display: "flex", gap: 24 }}>
                <div style={{ flex: 1 }}>
                  {unit.topics.map((tp, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 600, color: colors.teal, marginBottom: 8 }}>{i + 1}. {tp.t}</h4>
                      <p style={{ fontSize: 13, color: colors.gray, lineHeight: 2 }}>{tp.d}</p>
                    </div>
                  ))}
                </div>
                <div style={{ width: 200, flexShrink: 0 }}>
                  <div style={{ background: colors.grayLight, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>المحتويات</div>
                    {unit.topics.map((tp, i) => (
                      <div key={i} style={{ fontSize: 11, color: colors.teal, padding: "4px 0", cursor: "pointer" }}>← {tp.t}</div>
                    ))}
                  </div>
                  <Btn small variant="secondary" full style={{ marginTop: 12 }}>تحميل PDF</Btn>
                </div>
              </div>
            </div>
          )}
          {tab === 2 && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>إرشادات: {unit.name}</h3>
              {unit.steps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.teal, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
                  <div><h4 style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark }}>{s.title}</h4><p style={{ fontSize: 13, color: colors.gray, lineHeight: 1.7 }}>{s.desc}</p></div>
                </div>
              ))}
              <div style={{ padding: 14, background: colors.orangeLight, borderRadius: 10, borderRight: `3px solid ${colors.orange}`, marginTop: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.orange, display: "inline-flex", alignItems: "center", gap: 4 }}><IcLightbulb width={13} height={13}/> نصيحة: </span>
                <span style={{ fontSize: 13, color: colors.gray }}>{unit.tip}</span>
              </div>
            </div>
          )}
          {tab === 3 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", aspectRatio: "16/9", background: `linear-gradient(135deg, ${colors.tealCard}, #0D4F5E)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icons.play}</div>
                <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: 6, color: "white", fontSize: 12 }}>{unit.videoDuration}</div>
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 600, color: colors.tealDark, marginTop: 16 }}>شرح {unit.name}</h4>
              <p style={{ fontSize: 12, color: colors.gray }}>المدة: {unit.videoDuration} دقيقة</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 12, fontSize: 13, color: colors.gray }}>
                <input type="checkbox" style={{ accentColor: colors.green }} />
                <span>تم مشاهدة الفيديو</span>
              </div>
            </div>
          )}
          {tab === 4 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 14px", background: colors.grayLight, borderRadius: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.teal, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>أ</div>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>أحمد الشمري</div><div style={{ fontSize: 11, color: colors.green }}>● متصل</div></div>
              </div>
              <div style={{ height: 280, background: colors.grayLight, borderRadius: 12, padding: 16, overflowY: "auto", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                  <div style={{ background: "#E5E7EB", padding: "10px 16px", borderRadius: "14px 14px 4px 14px", maxWidth: "70%", fontSize: 13 }}>مرحباً، كيف يمكنني مساعدتك في {unit.name}؟</div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <div style={{ background: colors.teal, color: "white", padding: "10px 16px", borderRadius: "14px 14px 14px 4px", maxWidth: "70%", fontSize: 13 }}>أستاذ أحمد، عندي سؤال عن هذه الوحدة</div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: "#E5E7EB", padding: "10px 16px", borderRadius: "14px 14px 4px 14px", maxWidth: "70%", fontSize: 13 }}>تفضل، أنا جاهز لمساعدتك. اطرح سؤالك.</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: 10, borderRadius: 10, border: `1px solid ${colors.grayBorder}`, background: "white", cursor: "pointer", display: "flex" }}>{Icons.clip}</button>
                <input placeholder="اكتب رسالتك..." style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif", outline: "none" }} />
                <button style={{ padding: "10px 16px", borderRadius: 10, background: colors.orange, border: "none", cursor: "pointer", display: "flex", color: "white" }}>{Icons.send}</button>
              </div>
            </div>
          )}
          {tab === 5 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark }}>نماذج العمل: {unit.name}</h3>
                <div style={{ fontSize: 11, color: colors.green, display: "flex", alignItems: "center", gap: 4 }}><IcSave width={12} height={12}/> تم الحفظ تلقائياً — 14:32</div>
              </div>
              <TemplateRenderer unit={unit} />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-start", marginTop: 20 }}>
                <Btn variant="secondary">حفظ كمسودة</Btn>
                <Btn>إرسال للمراجعة</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // ============== OPERATIONAL PLANNING SYSTEM ==============
  // سير العمليات: التخطيط التشغيلي → الدفع → تعبئة النماذج → مراجعة المستشار → اعتماد → [تحكيم اعتماد؟] → نعم: التحكيم والدفع → النهاية
  // ══════════════════════════════════════════════════════════════

  const operationalUnits = [
    { id: 1, name: "المبادرات الاستراتيجية", status: "not_started",
      overview: "في هذه الوحدة يتم استيراد المبادرات الاستراتيجية المعتمدة من الخطة الاستراتيجية كأساس لبناء الخطة التشغيلية.",
      overview2: "يجب التأكد من اعتماد جميع المبادرات قبل البدء في تحويلها إلى أنشطة تشغيلية مفصلة.",
      topics: [{ t: "ربط المبادرات بالأهداف", d: "كل مبادرة مرتبطة بهدف استراتيجي واضح ومعتمد." }, { t: "مراجعة المخرجات", d: "التأكد من وضوح المخرجات المتوقعة لكل مبادرة." }, { t: "تحديد الأولويات", d: "ترتيب المبادرات حسب أولوية التنفيذ." }],
      steps: [{ title: "راجع المبادرات المعتمدة", desc: "افتح المبادرات المستوردة وتأكد من دقتها" }, { title: "حدد أولوية التنفيذ", desc: "رتّب المبادرات من الأهم للأقل أهمية" }, { title: "وافق على الاستيراد", desc: "اعتمد المبادرات للمتابعة في التخطيط التشغيلي" }],
      tip: "لا تعدّل المبادرات هنا، إذا احتاجت تعديل ارجع للخطة الاستراتيجية.",
      videoDuration: "8:00", templateType: "op_import" },
    { id: 2, name: "المبادرات التشغيلية", status: "not_started",
      overview: "تحويل كل مبادرة استراتيجية إلى مجموعة من الأنشطة التشغيلية المحددة القابلة للتنفيذ والقياس.",
      overview2: "كل نشاط تشغيلي يجب أن يكون واضح المخرجات ومحدد بمسؤول وزمن.",
      topics: [{ t: "تفكيك المبادرات", d: "تحويل المبادرة الواحدة إلى 3-7 أنشطة تشغيلية." }, { t: "تعريف الأنشطة", d: "كل نشاط له: اسم، وصف، مخرج متوقع." }, { t: "الربط التسلسلي", d: "بعض الأنشطة تعتمد على اكتمال أنشطة أخرى." }],
      steps: [{ title: "اختر المبادرة", desc: "ابدأ بالمبادرة الأولى وأضف أنشطتها التشغيلية" }, { title: "حدد الأنشطة", desc: "لكل مبادرة أضف الأنشطة المطلوبة لتنفيذها" }, { title: "صف المخرجات", desc: "حدد المخرج المتوقع من كل نشاط" }],
      tip: "كل نشاط يجب أن يكون قابلاً للتنفيذ خلال شهر إلى 3 أشهر كحد أقصى.",
      videoDuration: "14:30", templateType: "op_activities" },
    { id: 3, name: "شهور التنفيذ", status: "not_started",
      overview: "تحديد الجدول الزمني لتنفيذ كل نشاط تشغيلي على مدار 12 شهراً باستخدام مخطط جانت.",
      overview2: "يساعد هذا في تنظيم العمل وتوزيعه بشكل متوازن على مدار العام.",
      topics: [{ t: "مخطط جانت", d: "أداة بصرية لعرض الجدول الزمني للأنشطة." }, { t: "التوازن الزمني", d: "توزيع الأنشطة بشكل متوازن وتجنب التكدس." }, { t: "المعالم الرئيسية", d: "تحديد نقاط المراجعة والتقييم خلال العام." }],
      steps: [{ title: "افتح مخطط جانت", desc: "ستظهر جميع الأنشطة التشغيلية في صفوف" }, { title: "حدد شهور التنفيذ", desc: "انقر على الخلايا لتحديد شهور كل نشاط" }, { title: "راجع التوازن", desc: "تأكد من عدم تكدس الأنشطة في فترة واحدة" }],
      tip: "لا تبدأ كل شيء في شهر واحد، وزّع الأنشطة بواقعية.",
      videoDuration: "12:00", templateType: "op_gantt" },
    { id: 4, name: "مسؤول التنفيذ", status: "not_started",
      overview: "تعيين المسؤول عن تنفيذ كل نشاط تشغيلي مع تحديد القسم أو الإدارة المسؤولة.",
      overview2: "وضوح المسؤولية يضمن المحاسبة والمتابعة الفعالة.",
      topics: [{ t: "تحديد المسؤولية", d: "كل نشاط يجب أن يكون له مسؤول واحد واضح." }, { t: "التنسيق بين الأقسام", d: "بعض الأنشطة تتطلب تعاوناً بين أكثر من قسم." }, { t: "التفويض", d: "المسؤول قد يفوّض لكنه يبقى المسؤول الأول." }],
      steps: [{ title: "راجع الأنشطة", desc: "اطلع على قائمة الأنشطة التشغيلية" }, { title: "عيّن المسؤولين", desc: "حدد المسؤول والقسم لكل نشاط" }, { title: "تأكد من التوزيع", desc: "لا تحمّل شخصاً واحداً أنشطة كثيرة" }],
      tip: "المسؤول هو من يُسأل عن النتيجة، وليس بالضرورة من ينفذ بيده.",
      videoDuration: "9:00", templateType: "op_responsible" },
    { id: 5, name: "التكلفة المالية", status: "not_started",
      overview: "تقدير التكلفة المالية لكل نشاط تشغيلي وحساب الميزانية الإجمالية للخطة التشغيلية.",
      overview2: "الميزانية الدقيقة تساعد في تأمين التمويل والتحكم بالإنفاق.",
      topics: [{ t: "بنود التكلفة", d: "رواتب، مواد، نقل، تقنية، تسويق، إدارة." }, { t: "تقدير التكاليف", d: "تكلفة الوحدة × العدد = التكلفة الإجمالية." }, { t: "التحليل المالي", d: "رسوم بيانية للميزانية حسب المبادرة والشهر." }],
      steps: [{ title: "حدد بنود التكلفة", desc: "لكل نشاط أضف بنود التكلفة المتوقعة" }, { title: "قدّر الأرقام", desc: "ضع تكلفة الوحدة والعدد المطلوب" }, { title: "راجع الإجماليات", desc: "تأكد من واقعية الميزانية الإجمالية" }],
      tip: "أضف 10-15% كاحتياطي للطوارئ في الميزانية.",
      videoDuration: "15:00", templateType: "op_budget" },
  ];

  const opCompletedCount = operationalUnits.filter(u => u.status === "approved").length;

  const opWorkflowSteps = [
    { id: 0, label: "التخطيط التشغيلي",              icon: <IcCog width={14} height={14}/> },
    { id: 1, label: "الدفع",                          icon: <IcCreditCard width={14} height={14}/> },
    { id: 2, label: "تعبئة النماذج ومشاهدة المواد",  icon: <IcPencil width={14} height={14}/> },
    { id: 3, label: "مراجعة المستشار",                icon: <IcSearch width={14} height={14}/> },
    { id: 4, label: "اعتماد",                         icon: <IcCheckCircle width={14} height={14}/> },
    { id: 5, label: "تحكيم اعتماد؟",                  icon: "◇" },
    { id: 6, label: "التحكيم والدفع",                 icon: <IcBuildingLib width={14} height={14}/> },
  ];

  const OpWorkflowStepper = () => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "16px 0" }}>
        {opWorkflowSteps.map((ws, i) => (
          <React.Fragment key={i}>
            <div onClick={() => i <= opStep && setOpStep(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: i <= opStep ? "pointer" : "default", minWidth: 70 }}>
              <div style={{ width: 36, height: 36, borderRadius: ws.id === 5 ? 0 : i === opStep ? 10 : "50%", transform: ws.id === 5 ? "rotate(45deg)" : "none", background: i < opStep ? colors.green : i === opStep ? colors.orange : colors.grayLight, color: i <= opStep ? "white" : colors.gray, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, transition: "all 0.3s", boxShadow: i === opStep ? `0 4px 12px ${colors.orange}40` : "none" }}>
                <span style={{ transform: ws.id === 5 ? "rotate(-45deg)" : "none" }}>{i < opStep ? <IcCheck width={14} height={14}/> : ws.icon}</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: i === opStep ? 700 : 500, color: i < opStep ? colors.green : i === opStep ? colors.orange : colors.gray, textAlign: "center", maxWidth: 80, lineHeight: 1.3 }}>{ws.label}</span>
            </div>
            {i < opWorkflowSteps.length - 1 && (
              <div style={{ flex: 1, height: 3, background: i < opStep ? colors.green : colors.grayBorder, borderRadius: 2, margin: "0 2px", marginBottom: 20 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // ---- Op Step 0: Service Info ----
  const OpStepInfo = () => (
    <div className="animate-in">
      {strategicStep < 5 && (
        <div style={{ padding: 16, background: colors.orangeLight, borderRadius: 12, borderRight: `4px solid ${colors.orange}`, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: colors.orange, display: "flex" }}><IcWarning width={24} height={24}/></span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.orange }}>يتطلب إكمال التخطيط الاستراتيجي أولاً</div>
            <div style={{ fontSize: 12, color: colors.gray }}>التخطيط الاستراتيجي مكتمل بنسبة {progressPercent}% — يجب اعتماده بالكامل قبل البدء بالتخطيط التشغيلي</div>
            <Btn small variant="secondary" style={{ marginTop: 8 }} onClick={() => navigate("strategic-roadmap")}>العودة للتخطيط الاستراتيجي</Btn>
          </div>
        </div>
      )}

      <Card accent style={{ padding: 32, textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: colors.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: colors.orange }}><IcCog width={28} height={28}/></div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.tealDark }}>نظام التخطيط التشغيلي</h2>
        <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, maxWidth: 600, margin: "12px auto 0" }}>تحويل المبادرات الاستراتيجية إلى خطة تشغيلية مفصلة بالأنشطة والجدول الزمني والمسؤوليات والتكاليف</p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>ما يشمله النظام</h3>
          {["استيراد المبادرات من الخطة الاستراتيجية", "تفكيك المبادرات إلى أنشطة تشغيلية", "مخطط جانت للجدول الزمني (12 شهر)", "تعيين المسؤولين عن كل نشاط", "تقدير التكلفة المالية والميزانية", "مراجعة واعتماد المستشار", "وثيقة تشغيلية نهائية"].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 6 ? `1px solid ${colors.grayLight}` : "none" }}>
              <span style={{ color: colors.green, display: "flex" }}><IcCheck width={14} height={14}/></span>
              <span style={{ fontSize: 13, color: colors.tealDark }}>{item}</span>
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>الوحدات التخطيطية الـ 5</h3>
          {operationalUnits.map((u, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 4 ? `1px solid ${colors.grayLight}` : "none" }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: colors.teal, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{u.id}</span>
              <span style={{ fontSize: 13, color: colors.tealDark }}>{u.name}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: 12, background: colors.grayLight, borderRadius: 8, textAlign: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark }}>التكلفة: </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: colors.teal }}>3,500 ريال</span>
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <Btn disabled={strategicStep < 5} onClick={() => setOpStep(1)}>
          {strategicStep < 5 ? "يجب إكمال التخطيط الاستراتيجي أولاً" : "التالي: الدفع ←"}
        </Btn>
      </div>
    </div>
  );

  // ---- Op Step 1: Payment ----
  const OpStepPayment = () => (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 20 }}>إتمام الدفع — التخطيط التشغيلي</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>ملخص الطلب</h3>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "10px 0", borderBottom: `1px solid ${colors.grayLight}` }}>
            <span>نظام التخطيط التشغيلي (5 وحدات)</span><span style={{ fontWeight: 600 }}>3,500 ريال</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${colors.grayLight}` }}>
            <span>المستشار: {consultants.find(c => c.id === selectedConsultant)?.name || "أحمد الشمري"}</span><span style={{ color: colors.green, fontSize: 12 }}>مشمول</span>
          </div>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, marginTop: 12, marginBottom: 8 }}>خدمات إضافية:</h4>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" style={{ accentColor: colors.teal }} /><span style={{ fontSize: 13 }}>تحكيم واعتماد الخطة من جهة استشارية</span></div>
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.orange }}>2,500 ريال</span>
          </label>
          <div style={{ marginTop: 14, padding: "12px 0", borderTop: `2px solid ${colors.tealDark}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>المجموع الفرعي</span><span>3,500 ريال</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>ضريبة القيمة المضافة (15%)</span><span>525 ريال</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: colors.tealDark, marginTop: 8 }}><span>الإجمالي</span><span>4,025 ريال</span></div>
          </div>
        </Card>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>طريقة الدفع</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["بطاقة ائتمان", "مدى", "Apple Pay", "تحويل بنكي"].map((m, i) => (
              <button key={i} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: i === 0 ? `2px solid ${colors.teal}` : `1.5px solid ${colors.grayBorder}`, background: i === 0 ? `${colors.teal}08` : "white", fontSize: 12, fontWeight: i === 0 ? 600 : 400, fontFamily: "'Cairo', sans-serif", cursor: "pointer", color: i === 0 ? colors.teal : colors.gray }}>{m}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="رقم البطاقة" placeholder="XXXX XXXX XXXX XXXX" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="تاريخ الانتهاء" placeholder="MM/YY" />
              <Input label="CVV" placeholder="XXX" />
            </div>
            <Input label="اسم حامل البطاقة" placeholder="الاسم كما يظهر على البطاقة" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: "10px 14px", background: colors.greenLight, borderRadius: 8, fontSize: 12, color: colors.green }}><IcLock width={14} height={14}/> عملية دفع آمنة ومشفرة</div>
        </Card>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Btn variant="secondary" onClick={() => setOpStep(0)}>→ السابق</Btn>
        <Btn onClick={() => setOpStep(2)}>ادفع الآن — 4,025 ريال</Btn>
      </div>
    </div>
  );

  // ---- Op Step 2: Work — 5 Units ----
  const OpTemplateRenderer = ({ unit }) => {
    const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${colors.grayBorder}`, borderRadius: 6, fontSize: 12, fontFamily: "'Cairo', sans-serif" };

    if (unit.templateType === "op_import") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 12 }}>المبادرات المستوردة من الخطة الاستراتيجية</h4>
        {["برنامج التعليم المجتمعي", "مشروع التأهيل المهني", "حملة التوعية الصحية"].map((m, i) => (
          <Card key={i} style={{ marginBottom: 10, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", borderRight: `3px solid ${colors.teal}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" defaultChecked style={{ accentColor: colors.teal }} />
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>{m}</div><div style={{ fontSize: 11, color: colors.gray }}>مستورد من الخطة الاستراتيجية — المبادرة {i + 1}</div></div>
            </div>
            <Badge text="معتمد" color="green" small />
          </Card>
        ))}
      </div>
    );

    if (unit.templateType === "op_activities") return (
      <div>
        {["برنامج التعليم المجتمعي", "مشروع التأهيل المهني"].map((m, mi) => (
          <div key={mi} style={{ marginBottom: 20, border: `1.5px solid ${colors.grayBorder}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: colors.tealCard, color: "white", fontWeight: 600, fontSize: 14 }}>المبادرة: {m}</div>
            <div style={{ padding: 16 }}>
              {[1, 2, 3].map(a => (
                <div key={a} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10, padding: 10, background: colors.grayLight, borderRadius: 8 }}>
                  <Input label={`اسم النشاط ${a}`} placeholder="مثال: ورشة تدريبية..." />
                  <Input label="وصف النشاط" placeholder="ماذا يتضمن هذا النشاط؟" />
                  <Input label="المخرج المتوقع" placeholder="ما الناتج؟" />
                </div>
              ))}
              <Btn small variant="ghost">+ إضافة نشاط</Btn>
            </div>
          </div>
        ))}
      </div>
    );

    if (unit.templateType === "op_gantt") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 12 }}>مخطط جانت — الجدول الزمني</h4>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ padding: 8, background: colors.tealCard, color: "white", fontSize: 11, position: "sticky", right: 0, zIndex: 1, minWidth: 150 }}>النشاط</th>
                {["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"].map(m => (
                  <th key={m} style={{ padding: "8px 4px", background: colors.tealCard, color: "white", fontSize: 9, fontWeight: 500, textAlign: "center" }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["ورشة تدريب المعلمين", "إعداد المناهج", "تنفيذ البرنامج التعليمي", "تأهيل مهني — المرحلة 1", "تأهيل مهني — المرحلة 2", "حملة التوعية الصحية"].map((a, ai) => (
                <tr key={ai} style={{ borderBottom: `1px solid ${colors.grayBorder}` }}>
                  <td style={{ padding: 8, fontSize: 11, fontWeight: 600, background: "white", position: "sticky", right: 0 }}>{a}</td>
                  {Array.from({ length: 12 }, (_, mi) => {
                    const active = (ai === 0 && mi >= 0 && mi <= 2) || (ai === 1 && mi >= 1 && mi <= 3) || (ai === 2 && mi >= 3 && mi <= 8) || (ai === 3 && mi >= 2 && mi <= 5) || (ai === 4 && mi >= 6 && mi <= 9) || (ai === 5 && mi >= 4 && mi <= 7);
                    const barColors = [colors.teal, colors.blue, colors.teal, colors.orange, colors.orange, colors.green];
                    return <td key={mi} style={{ padding: 2, textAlign: "center" }}>
                      <div style={{ height: 20, borderRadius: 4, background: active ? barColors[ai] : "transparent", cursor: "pointer", opacity: active ? 0.8 : 1 }}
                        title={active ? "محدد" : "انقر للتحديد"} />
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    if (unit.templateType === "op_responsible") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 12 }}>تعيين المسؤولين</h4>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["النشاط", "المبادرة", "مسؤول التنفيذ", "القسم / الإدارة"].map(h => <th key={h} style={{ padding: "10px 8px", background: colors.tealCard, color: "white", fontSize: 11, fontWeight: 600, textAlign: "right" }}>{h}</th>)}</tr></thead>
          <tbody>
            {[["ورشة تدريب المعلمين", "التعليم المجتمعي"], ["إعداد المناهج", "التعليم المجتمعي"], ["تأهيل مهني — المرحلة 1", "التأهيل المهني"], ["حملة التوعية", "التوعية الصحية"]].map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${colors.grayBorder}` }}>
                <td style={{ padding: 8, fontSize: 12, fontWeight: 600 }}>{r[0]}</td>
                <td style={{ padding: 8 }}><Badge text={r[1]} color="teal" small /></td>
                <td style={{ padding: 6 }}><input style={inputStyle} placeholder="اسم المسؤول..." /></td>
                <td style={{ padding: 6 }}><input style={inputStyle} placeholder="القسم..." /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    if (unit.templateType === "op_budget") return (
      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.teal, marginBottom: 12 }}>الميزانية التشغيلية</h4>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead><tr>{["النشاط", "بند التكلفة", "تكلفة الوحدة", "العدد", "الإجمالي"].map(h => <th key={h} style={{ padding: "10px 8px", background: colors.tealCard, color: "white", fontSize: 11, fontWeight: 600, textAlign: "right" }}>{h}</th>)}</tr></thead>
          <tbody>
            {[["ورشة تدريب المعلمين", "أتعاب المدربين", "5,000", "3", "15,000"], ["", "مواد تدريبية", "500", "30", "15,000"], ["إعداد المناهج", "تصميم وطباعة", "2,000", "5", "10,000"], ["تأهيل مهني", "معدات تدريبية", "10,000", "2", "20,000"], ["حملة التوعية", "تصميم ونشر", "3,000", "4", "12,000"]].map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${colors.grayBorder}` }}>
                {r.map((c, j) => <td key={j} style={{ padding: 6 }}><input style={{ ...inputStyle, fontWeight: j === 0 ? 600 : 400, textAlign: j >= 2 ? "center" : "right" }} defaultValue={c} /></td>)}
              </tr>
            ))}
            <tr style={{ background: colors.tealCard }}>
              <td colSpan={4} style={{ padding: 10, color: "white", fontWeight: 700, fontSize: 14, textAlign: "center" }}>الإجمالي الكلي</td>
              <td style={{ padding: 10, color: "white", fontWeight: 800, fontSize: 16, textAlign: "center" }}>72,000 ريال</td>
            </tr>
          </tbody>
        </table>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card style={{ padding: 14 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: colors.tealDark, marginBottom: 10 }}>التوزيع حسب المبادرة</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: `conic-gradient(${colors.teal} 0% 42%, ${colors.orange} 42% 70%, ${colors.green} 70% 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: "white" }} /></div>
              <div style={{ fontSize: 11 }}>
                {[{ l: "التعليم المجتمعي", c: colors.teal, p: "42%" }, { l: "التأهيل المهني", c: colors.orange, p: "28%" }, { l: "التوعية الصحية", c: colors.green, p: "30%" }].map((x, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: x.c }} /><span>{x.l} ({x.p})</span></div>
                ))}
              </div>
            </div>
          </Card>
          <Card style={{ padding: 14 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: colors.tealDark, marginBottom: 10 }}>ملخص مالي</h4>
            <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>إجمالي الميزانية</span><span style={{ fontWeight: 700 }}>72,000 ريال</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>احتياطي 10%</span><span style={{ fontWeight: 700 }}>7,200 ريال</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: `2px solid ${colors.tealDark}`, fontWeight: 800, fontSize: 15 }}><span>الإجمالي</span><span style={{ color: colors.teal }}>79,200 ريال</span></div>
            </div>
          </Card>
        </div>
      </div>
    );

    return <div style={{ color: colors.gray, textAlign: "center", padding: 40 }}>نموذج العمل قيد التطوير</div>;
  };

  const OpStepWork = () => (
    <div className="animate-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: colors.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", color: colors.orange }}><IcCog width={22} height={22}/></div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.tealDark }}>تعبئة النماذج — التخطيط التشغيلي</h2>
          <div style={{ fontSize: 12, color: colors.gray }}>5 وحدات تخطيطية — كل وحدة تتبع نفس هيكل الوحدة التخطيطية (6 مكونات + اعتماد المستشار)</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {operationalUnits.map(u => {
          const s = statusMap[u.status];
          return (
            <div key={u.id} onClick={() => setActiveOpUnit(u)} style={{ background: colors.tealCard, borderRadius: 12, padding: "20px 12px", textAlign: "center", borderBottom: `3px solid ${colors.orange}`, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ color: "white", fontSize: 13, fontWeight: 600, marginBottom: 10, minHeight: 40 }}>{u.name}</div>
              <Badge text={s.badge} color={s.color} small />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Btn onClick={() => setOpStep(3)}>إرسال الكل لمراجعة المستشار ←</Btn>
      </div>
    </div>
  );

  // ---- Op Unit Page (same 6-tab structure) ----
  const OpUnitPage = () => {
    const unit = activeOpUnit;
    const [tab, setTab] = useState(0);
    const tabs = ["نبذة", "شرح مكتوب", "إرشادات", "فيديو", "خدمة الدردشة", "نماذج العمل"];

    return (
      <div className="animate-in">
        <div style={{ fontSize: 12, color: colors.gray, marginBottom: 4 }}>التخطيط التشغيلي {">"} {unit.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button onClick={() => setActiveOpUnit(null)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.teal, display: "flex" }}>{Icons.arrow}</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark }}>{unit.name}</h2>
          <Badge text={`الوحدة ${unit.id} من 5`} color="teal" small />
        </div>
        <StatusBar status="not_submitted" />
        <div style={{ margin: "12px 0 16px" }}><Tab tabs={tabs} active={tab} onChange={setTab} /></div>
        <Card>
          {tab === 0 && <div><h3 style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>نبذة عن {unit.name}</h3><p style={{ fontSize: 14, color: colors.gray, lineHeight: 2 }}>{unit.overview}</p><p style={{ fontSize: 14, color: colors.gray, lineHeight: 2, marginTop: 12 }}>{unit.overview2}</p></div>}
          {tab === 1 && <div><h3 style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>شرح مكتوب: {unit.name}</h3>{unit.topics.map((tp, i) => <div key={i} style={{ marginBottom: 16 }}><h4 style={{ fontSize: 15, fontWeight: 600, color: colors.teal, marginBottom: 8 }}>{i + 1}. {tp.t}</h4><p style={{ fontSize: 13, color: colors.gray, lineHeight: 2 }}>{tp.d}</p></div>)}</div>}
          {tab === 2 && <div><h3 style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>إرشادات: {unit.name}</h3>{unit.steps.map((s, i) => <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16 }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.teal, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}</div><div><h4 style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark }}>{s.title}</h4><p style={{ fontSize: 13, color: colors.gray }}>{s.desc}</p></div></div>)}<div style={{ padding: 14, background: colors.orangeLight, borderRadius: 10, borderRight: `3px solid ${colors.orange}` }}><span style={{ color: colors.orange, display: "inline-flex", alignItems: "center", marginLeft: 4 }}><IcLightbulb width={14} height={14}/></span><span style={{ fontSize: 13, color: colors.gray }}>{unit.tip}</span></div></div>}
          {tab === 3 && <div style={{ textAlign: "center" }}><div style={{ width: "100%", maxWidth: 600, margin: "0 auto", aspectRatio: "16/9", background: `linear-gradient(135deg, ${colors.tealCard}, #0D4F5E)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}><div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icons.play}</div><div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: 6, color: "white", fontSize: 12 }}>{unit.videoDuration}</div></div><h4 style={{ fontSize: 15, fontWeight: 600, color: colors.tealDark, marginTop: 16 }}>شرح {unit.name}</h4></div>}
          {tab === 4 && <div><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 14px", background: colors.grayLight, borderRadius: 10 }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.teal, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>أ</div><div><div style={{ fontSize: 13, fontWeight: 600 }}>أحمد الشمري</div><div style={{ fontSize: 11, color: colors.green }}>● متصل</div></div></div><div style={{ height: 200, background: colors.grayLight, borderRadius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "center", color: colors.gray }}>ابدأ المحادثة مع المستشار حول {unit.name}</div><div style={{ display: "flex", gap: 8, marginTop: 12 }}><button style={{ padding: 10, borderRadius: 10, border: `1px solid ${colors.grayBorder}`, background: "white", cursor: "pointer", display: "flex" }}>{Icons.clip}</button><input placeholder="اكتب رسالتك..." style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif", outline: "none" }} /><button style={{ padding: "10px 16px", borderRadius: 10, background: colors.orange, border: "none", cursor: "pointer", display: "flex", color: "white" }}>{Icons.send}</button></div></div>}
          {tab === 5 && <div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}><h3 style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark }}>نماذج العمل: {unit.name}</h3><span style={{ fontSize: 11, color: colors.green, display: "inline-flex", alignItems: "center", gap: 4 }}><IcSave width={12} height={12}/> تم الحفظ تلقائياً</span></div><OpTemplateRenderer unit={unit} /><div style={{ display: "flex", gap: 12, marginTop: 20 }}><Btn variant="secondary">حفظ كمسودة</Btn><Btn>إرسال للمراجعة</Btn></div></div>}
        </Card>
      </div>
    );
  };

  // ---- Op Step 3: Review ----
  const OpStepReview = () => (
    <div className="animate-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 6 }}>مراجعة المستشار — التخطيط التشغيلي</h2>
      <p style={{ fontSize: 13, color: colors.gray, marginBottom: 20 }}>يقوم المستشار بمراجعة مخرجاتك واعتمادها أو طلب تعديل</p>
      <Card style={{ marginBottom: 16, padding: "16px 20px", background: colors.blueLight, borderRight: `4px solid ${colors.blue}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ color: colors.blue }}><IcSearch width={24} height={24}/></span><div><div style={{ fontSize: 14, fontWeight: 700, color: colors.blue }}>جاري مراجعة الخطة التشغيلية</div><div style={{ fontSize: 12, color: colors.gray }}>المستشار يراجع الوحدات الخمس</div></div></div>
      </Card>
      {operationalUnits.map((u, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${colors.grayLight}`, background: "white" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: colors.tealCard, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{u.id}</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</span>
          </div>
          <Badge text={statusMap[u.status].badge} color={statusMap[u.status].color} small />
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Btn variant="secondary" onClick={() => setOpStep(2)}>→ تعديل النماذج</Btn>
        <Btn onClick={() => setOpStep(4)}>طلب الاعتماد ←</Btn>
      </div>
    </div>
  );

  // ---- Op Step 4: Approval ----
  const OpStepApproval = () => (
    <div className="animate-in" style={{ textAlign: "center", maxWidth: 550, margin: "0 auto" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: colors.greenLight, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", color: colors.green }}><IcCheckCircle width={36} height={36}/></div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.tealDark, marginBottom: 8 }}>تم اعتماد الخطة التشغيلية!</h2>
      <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, marginBottom: 24 }}>تهانينا! تم اعتماد خطتك التشغيلية. يمكنك تحميل الوثيقة التشغيلية.</p>

      <Card accent style={{ marginBottom: 16, textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.tealCard, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><IcDocument width={24} height={24}/></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>الوثيقة التشغيلية — {authUser?.org_name || 'المنظمة'}</div><div style={{ fontSize: 12, color: colors.gray }}>الخطة التشغيلية</div></div>
          <Btn small>تحميل PDF</Btn>
        </div>
      </Card>

      {/* Decision: تحكيم اعتماد؟ — matching the diamond in the flowchart */}
      <Card style={{ marginBottom: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, background: colors.orange, transform: "rotate(45deg)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ transform: "rotate(-45deg)", color: "white", fontWeight: 700, fontSize: 12 }}>؟</span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark }}>هل تود تحكيم واعتماد الخطة من جهة استشارية؟</h3>
        </div>
        <p style={{ fontSize: 13, color: colors.gray, lineHeight: 1.7, marginBottom: 16 }}>يمكنك طلب تحكيم الخطة التشغيلية من جهة استشارية معتمدة لمزيد من المصداقية والجودة</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn onClick={() => setOpStep(5)}>نعم — طلب التحكيم (2,500 ريال)</Btn>
          <Btn variant="secondary" onClick={() => setOpStep(6)}>لا — متابعة بدون تحكيم</Btn>
        </div>
      </Card>
    </div>
  );

  // ---- Op Step 5: Arbitration Payment ----
  const OpStepArbitration = () => (
    <div className="animate-in" style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 20, textAlign: "center" }}>التحكيم والدفع</h2>
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>ملخص التحكيم</h3>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${colors.grayLight}`, fontSize: 14 }}><span>تحكيم الخطة التشغيلية من جهة استشارية</span><span style={{ fontWeight: 600 }}>2,500 ريال</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${colors.grayLight}`, fontSize: 13 }}><span>ضريبة 15%</span><span>375 ريال</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 18, fontWeight: 800, color: colors.tealDark }}><span>الإجمالي</span><span>2,875 ريال</span></div>
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark, marginBottom: 14 }}>اختر جهة التحكيم</h3>
        {["شركة الاستشارات الاستراتيجية", "مركز التميز المؤسسي", "معهد التخطيط للقطاع الثالث"].map((j, i) => (
          <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, marginBottom: 6, cursor: "pointer", border: `1.5px solid ${i === 0 ? colors.teal : colors.grayBorder}`, background: i === 0 ? `${colors.teal}08` : "white" }}>
            <input type="radio" name="arbitrator" defaultChecked={i === 0} style={{ accentColor: colors.teal }} />
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>{j}</div><div style={{ fontSize: 11, color: colors.gray }}>جهة استشارية معتمدة في التخطيط الاستراتيجي</div></div>
          </label>
        ))}
      </Card>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Btn variant="secondary" onClick={() => setOpStep(4)}>→ رجوع</Btn>
        <Btn onClick={() => setOpStep(6)}>ادفع وابدأ التحكيم — 2,875 ريال</Btn>
      </div>
    </div>
  );

  // ---- Op Step 6: Done ----
  const OpStepDone = () => (
    <div className="animate-in" style={{ textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
      <div style={{ width: 100, height: 100, borderRadius: "50%", background: colors.greenLight, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", color: colors.green }}><IcSparkles width={48} height={48}/></div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.tealDark, marginBottom: 8 }}>اكتمل التخطيط التشغيلي!</h2>
      <p style={{ fontSize: 14, color: colors.gray, lineHeight: 1.8, marginBottom: 24 }}>تم إنجاز خطتك التشغيلية بنجاح. يمكنك الآن الانتقال لبناء السياسات واللوائح.</p>
      <Card accent style={{ marginBottom: 20, textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.tealCard, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><IcDocument width={24} height={24}/></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>الوثيقة التشغيلية النهائية</div><div style={{ fontSize: 12, color: colors.gray }}>معتمدة ومحكّمة</div></div>
          <Btn small>تحميل</Btn>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Btn onClick={() => navigate("policies-select")}>الانتقال لبناء السياسات واللوائح ←</Btn>
        <Btn variant="ghost" onClick={() => navigate("client-dash")}>لوحة التحكم</Btn>
      </div>
    </div>
  );

  // ============== ADMIN PAGES ==============
  // AdminOrgs is imported from ./pages/admin/AdminOrgs

  const POLICY_TYPES = [
    { id: 1, name: "لائحة الموارد البشرية" },
    { id: 2, name: "السياسات الإعلامية" },
    { id: 3, name: "سياسات الحوكمة" },
    { id: 4, name: "لائحة تنظيم التبرعات" },
    { id: 5, name: "سياسة الموارد المالية" },
    { id: 6, name: "سياسة الخصوصية والسرية" },
    { id: 7, name: "سياسات المتابعة والتقييم" },
  ];

  const AdminQuestionnaire = () => {
    const [activePolicyId, setActivePolicyId] = React.useState(1);
    const [sections,      setSections]      = React.useState([]);
    const [activeId,      setActiveId]      = React.useState(null);
    const [questions,     setQuestions]     = React.useState([]);
    const [loadingQ,      setLoadingQ]      = React.useState(false);
    const [toast,         setToast]         = React.useState(null);

    // section modal
    const [secModal,      setSecModal]      = React.useState(false);
    const [secEdit,       setSecEdit]       = React.useState(null); // null=new, obj=edit
    const [secName,       setSecName]       = React.useState("");
    const [secSaving,     setSecSaving]     = React.useState(false);

    // question modal
    const [qModal,        setQModal]        = React.useState(false);
    const [qEdit,         setQEdit]         = React.useState(null);
    const [qForm,         setQForm]         = React.useState({ question: "", type: "single", required: false, hint: "", display_condition: "", optionsText: "" });
    const [qSaving,       setQSaving]       = React.useState(false);

    const TYPE_LABELS = { single: "اختيار واحد", multiple: "اختيار متعدد", yesno: "نعم/لا", text: "نص حر", scale: "مقياس" };
    const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

    // load sections for the active policy
    const loadSections = (policyId) => {
      api.get(`/admin/questionnaire?policy_type_id=${policyId}`).then(r => {
        setSections(r.data);
        setActiveId(r.data.length > 0 ? r.data[0].id : null);
        setQuestions([]);
      });
    };
    React.useEffect(() => { loadSections(activePolicyId); }, [activePolicyId]);

    // load questions when section changes
    React.useEffect(() => {
      if (!activeId) return;
      setLoadingQ(true);
      api.get(`/admin/questionnaire/sections/${activeId}/questions`)
        .then(r => setQuestions(r.data.questions))
        .finally(() => setLoadingQ(false));
    }, [activeId]);

    // ── Section CRUD ──────────────────────────────────────────────────────────
    const openAddSection  = () => { setSecEdit(null); setSecName(""); setSecModal(true); };
    const openEditSection = (s) => { setSecEdit(s); setSecName(s.name); setSecModal(true); };
    const saveSection = () => {
      if (!secName.trim()) return;
      setSecSaving(true);
      const req = secEdit
        ? api.put(`/admin/questionnaire/sections/${secEdit.id}`, { name: secName })
        : api.post("/admin/questionnaire/sections", { name: secName, policy_type_id: activePolicyId });
      req.then(r => {
        if (secEdit) {
          setSections(prev => prev.map(s => s.id === secEdit.id ? { ...r.data, questions_count: s.questions_count } : s));
        } else {
          setSections(prev => [...prev, r.data]);
          setActiveId(r.data.id);
        }
        setSecModal(false);
        showToast(secEdit ? "تم تعديل القسم" : "تم إضافة القسم");
      }).catch(() => showToast("حدث خطأ", false)).finally(() => setSecSaving(false));
    };
    const deleteSection = (s) => {
      if (!window.confirm(`حذف قسم "${s.name}"؟`)) return;
      api.delete(`/admin/questionnaire/sections/${s.id}`).then(() => {
        const remaining = sections.filter(x => x.id !== s.id);
        setSections(remaining);
        if (activeId === s.id) setActiveId(remaining[0]?.id ?? null);
        showToast("تم حذف القسم");
      }).catch(() => showToast("حدث خطأ", false));
    };

    // ── Question CRUD ─────────────────────────────────────────────────────────
    const openAddQ  = () => { setQEdit(null); setQForm({ question: "", type: "single", required: false, hint: "", display_condition: "", optionsText: "" }); setQModal(true); };
    const openEditQ = (q) => { setQEdit(q); setQForm({ question: q.question, type: q.type, required: q.required, hint: q.hint || "", display_condition: q.display_condition || "", optionsText: q.options ? q.options.join("\n") : "" }); setQModal(true); };
    const saveQuestion = () => {
      if (!qForm.question.trim()) return;
      setQSaving(true);
      const options = ["single","multiple"].includes(qForm.type)
        ? qForm.optionsText.split("\n").map(s => s.trim()).filter(Boolean)
        : null;
      const payload = { question: qForm.question, type: qForm.type, required: qForm.required, hint: qForm.hint || null, display_condition: qForm.display_condition || null, options };
      const req = qEdit
        ? api.put(`/admin/questionnaire/questions/${qEdit.id}`, payload)
        : api.post(`/admin/questionnaire/sections/${activeId}/questions`, payload);
      req.then(r => {
        if (qEdit) {
          setQuestions(prev => prev.map(q => q.id === qEdit.id ? r.data : q));
        } else {
          setQuestions(prev => [...prev, r.data]);
          setSections(prev => prev.map(s => s.id === activeId ? { ...s, questions_count: (s.questions_count || 0) + 1 } : s));
        }
        setQModal(false);
        showToast(qEdit ? "تم تعديل السؤال" : "تم إضافة السؤال");
      }).catch(() => showToast("حدث خطأ", false)).finally(() => setQSaving(false));
    };
    const deleteQuestion = (q) => {
      if (!window.confirm(`حذف السؤال؟`)) return;
      api.delete(`/admin/questionnaire/questions/${q.id}`).then(() => {
        setQuestions(prev => prev.filter(x => x.id !== q.id));
        setSections(prev => prev.map(s => s.id === activeId ? { ...s, questions_count: Math.max(0, (s.questions_count || 1) - 1) } : s));
        showToast("تم حذف السؤال");
      }).catch(() => showToast("حدث خطأ", false));
    };

    const activeSection = sections.find(s => s.id === activeId);
    const inputS = { width: "100%", padding: "9px 12px", border: `1.5px solid ${colors.grayBorder}`, borderRadius: 8, fontSize: 13, fontFamily: "'Cairo',sans-serif", direction: "rtl", boxSizing: "border-box" };

    return (
      <div className="animate-in">
        {/* Toast */}
        {toast && (
          <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.ok ? colors.teal : colors.red, color: "#fff", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>{toast.msg}</div>
        )}

        <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>بناء الاستبيانات</h2>

        {/* Policy Type Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {POLICY_TYPES.map(p => (
            <button key={p.id} onClick={() => setActivePolicyId(p.id)} style={{ padding: "7px 14px", borderRadius: 20, border: `2px solid ${activePolicyId === p.id ? colors.teal : colors.grayBorder}`, background: activePolicyId === p.id ? colors.teal : "#fff", color: activePolicyId === p.id ? "#fff" : colors.gray, fontSize: 12, fontWeight: activePolicyId === p.id ? 700 : 400, cursor: "pointer", fontFamily: "'Cairo',sans-serif", transition: "all 0.15s" }}>{p.name}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
          {/* Sections sidebar */}
          <Card style={{ padding: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: colors.tealDark, marginBottom: 12 }}>أقسام {POLICY_TYPES.find(p => p.id === activePolicyId)?.name}</h4>
            {sections.map(s => (
              <div key={s.id} onClick={() => setActiveId(s.id)} style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 4, background: activeId === s.id ? `${colors.teal}10` : "transparent", borderRight: activeId === s.id ? `3px solid ${colors.teal}` : "3px solid transparent", fontSize: 12, fontWeight: activeId === s.id ? 600 : 400, cursor: "pointer", color: activeId === s.id ? colors.teal : colors.gray, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IcBars width={12} height={12}/> {s.name}</span>
                <span style={{ display: "flex", gap: 4 }}>
                  <button onClick={e => { e.stopPropagation(); openEditSection(s); }} style={{ background: "none", border: "none", cursor: "pointer", color: colors.gray, padding: 2, display: "flex" }}><IcPencil width={11} height={11}/></button>
                  <button onClick={e => { e.stopPropagation(); deleteSection(s); }} style={{ background: "none", border: "none", cursor: "pointer", color: colors.red, padding: 2, display: "flex" }}><IcTrash width={11} height={11}/></button>
                </span>
              </div>
            ))}
            <button onClick={openAddSection} style={{ marginTop: 8, width: "100%", padding: "7px 0", background: "none", border: `1.5px dashed ${colors.teal}`, borderRadius: 8, color: colors.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>+ إضافة قسم</button>
          </Card>

          {/* Questions */}
          <Card>
            {!activeSection ? (
              <div style={{ padding: 40, textAlign: "center", color: colors.gray, fontSize: 13 }}>اختر قسماً أو أضف قسماً جديداً</div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.tealDark }}>{activeSection.name} ({questions.length} أسئلة)</h3>
                  <button onClick={openAddQ} style={{ padding: "7px 16px", background: colors.orange, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", gap: 6 }}><IcPlus width={13} height={13}/> إضافة سؤال</button>
                </div>

                {loadingQ ? (
                  <div style={{ padding: 30, textAlign: "center", color: colors.gray, fontSize: 12 }}>جارٍ التحميل…</div>
                ) : questions.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: colors.gray, fontSize: 13 }}>لا توجد أسئلة في هذا القسم بعد</div>
                ) : (
                  questions.map(q => (
                    <div key={q.id} style={{ padding: 16, border: `1.5px solid ${colors.grayBorder}`, borderRadius: 10, marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: colors.gray }}><IcBars width={14} height={14}/></span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{q.question}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Badge text={TYPE_LABELS[q.type] || q.type} color="teal" small />
                          {q.required && <Badge text="مطلوب" color="red" small />}
                          <button onClick={() => openEditQ(q)} title="تعديل" style={{ background: "none", border: "none", cursor: "pointer", color: colors.gray, padding: 4, display: "flex", alignItems: "center", borderRadius: 6, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = colors.grayLight} onMouseLeave={e => e.currentTarget.style.background = "none"}><IcPencil width={15} height={15}/></button>
                          <button onClick={() => deleteQuestion(q)} title="حذف" style={{ background: "none", border: "none", cursor: "pointer", color: colors.red, padding: 4, display: "flex", alignItems: "center", borderRadius: 6, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = colors.redLight} onMouseLeave={e => e.currentTarget.style.background = "none"}><IcTrash width={15} height={15}/></button>
                        </div>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {q.options.map((o, i) => <span key={i} style={{ fontSize: 11, background: colors.grayLight, borderRadius: 4, padding: "2px 7px", color: colors.gray }}>{o}</span>)}
                        </div>
                      )}
                      <div style={{ marginTop: 6, fontSize: 11, color: colors.gray }}>
                        {q.display_condition ? `شرط: ${q.display_condition}` : "يظهر دائماً"}{q.hint ? ` | تلميح: ${q.hint}` : ""}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </Card>
        </div>

        {/* Section Modal */}
        {secModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 380, direction: "rtl", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 16 }}>{secEdit ? "تعديل القسم" : "إضافة قسم جديد"}</h3>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>اسم القسم</label>
              <input value={secName} onChange={e => setSecName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveSection()} placeholder="مثال: التوظيف" style={{ ...inputS, marginBottom: 20 }} autoFocus />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setSecModal(false)} style={{ padding: "9px 20px", background: "#f3f4f6", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>إلغاء</button>
                <button onClick={saveSection} disabled={secSaving || !secName.trim()} style={{ padding: "9px 20px", background: colors.teal, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>{secSaving ? "جارٍ الحفظ…" : "حفظ"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Question Modal */}
        {qModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 480, direction: "rtl", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 20 }}>{qEdit ? "تعديل السؤال" : "إضافة سؤال جديد"}</h3>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>نص السؤال *</label>
                <textarea value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))} rows={2} placeholder="اكتب السؤال هنا…" style={{ ...inputS, resize: "vertical" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>نوع السؤال *</label>
                  <select value={qForm.type} onChange={e => setQForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputS }}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 6 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox" checked={qForm.required} onChange={e => setQForm(f => ({ ...f, required: e.target.checked }))} style={{ width: 16, height: 16 }} />
                    <span>سؤال مطلوب</span>
                  </label>
                </div>
              </div>

              {["single","multiple"].includes(qForm.type) && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>الخيارات (سطر لكل خيار) *</label>
                  <textarea value={qForm.optionsText} onChange={e => setQForm(f => ({ ...f, optionsText: e.target.value }))} rows={4} placeholder={"خيار 1\nخيار 2\nخيار 3"} style={{ ...inputS, resize: "vertical" }} />
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>تلميح (اختياري)</label>
                <input value={qForm.hint} onChange={e => setQForm(f => ({ ...f, hint: e.target.value }))} placeholder="نص مساعد يظهر للمستخدم" style={{ ...inputS }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>شرط العرض (اختياري)</label>
                <input value={qForm.display_condition} onChange={e => setQForm(f => ({ ...f, display_condition: e.target.value }))} placeholder="مثال: إذا كانت إجابة السؤال السابق نعم" style={{ ...inputS }} />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setQModal(false)} style={{ padding: "9px 20px", background: "#f3f4f6", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>إلغاء</button>
                <button onClick={saveQuestion} disabled={qSaving || !qForm.question.trim()} style={{ padding: "9px 20px", background: colors.orange, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>{qSaving ? "جارٍ الحفظ…" : "حفظ"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============== CHAT PAGE ==============
  // ============== GENERIC PAGES ==============
  const AccessDenied = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 14, color: colors.gray }}>
      <div style={{ color: colors.gray }}><IcLock width={48} height={48}/></div>
      <div style={{ fontSize: 17, fontWeight: 700, color: colors.tealDark }}>غير مصرح بالوصول</div>
      <div style={{ fontSize: 13 }}>ليس لديك صلاحية لعرض هذه الصفحة</div>
    </div>
  );

  // ============== RENDER ==============
  const renderContent = () => {
    if (activeUnit) return <UnitPageDynamic unit={activeUnit} onBack={() => setActiveUnit(null)} onNavigate={handleUnitNavigate} workflowId={strategicWorkflowId} />;

    switch (currentView) {
      case "landing": return <LandingPage />;
      case "about": return <AboutPage />;
      case "services": return <ServicesPage />;
      case "pricing": return <PricingPage />;
      case "contact": return <ContactPage />;
      case "login": return <LoginPage />;
      case "register": return <RegisterPage />;
      // ── جميع هذه الصفحات يديرها KeepAlive في الـ render ──
      case "client-dash":
      case "strategic-roadmap": case "operational-roadmap": case "policies-select":
      case "client-chat": case "con-chat":
      case "client-payments":
      case "client-settings": case "con-settings": case "admin-profile":
      case "con-dash": case "con-clients":
      case "con-pending": case "con-completed": case "con-earnings": case "con-stats":
      case "admin-dash": case "admin-orgs": case "admin-consultants":
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
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${colors.teal}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.teal} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
          );
          const adminMsg = () => (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${colors.orange}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.orange} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
            </div>
          );
          const map = {
            unit_approved: () => approved(colors.green),
            unit_revision: () => revision(colors.orange),
            op_approved:   () => approved(colors.green),
            op_revision:   () => revision(colors.orange),
            policy_approved: () => approved(colors.green),
            policy_revision: () => revision(colors.orange),
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
          unit_revision:         { border: colors.orange },
          op_approved:           { border: colors.green  },
          op_revision:           { border: colors.orange },
          policy_approved:       { border: colors.green  },
          policy_revision:       { border: colors.orange },
          workflow_completed:    { border: colors.green  },
          op_workflow_completed: { border: colors.green  },
          admin_message:         { border: colors.orange },
          message:               { border: colors.blue   },
          payment:               { border: colors.teal   },
        };
        return (
          <GenericPage title="الإشعارات">
            {!notifications ? (
              <div style={{ padding: 60, textAlign: "center", color: colors.gray, fontSize: 13 }}>جارٍ التحميل…</div>
            ) : notifications.length === 0 ? (
              <Card style={{ padding: 60, textAlign: "center" }}>
                <div style={{ marginBottom: 12, color: colors.gray }}><IcBell width={40} height={40}/></div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark, marginBottom: 6 }}>لا توجد إشعارات بعد</div>
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
                        <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: colors.tealDark }}>{n.title}</div>
                        {n.body && <div style={{ fontSize: 12, color: colors.gray, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: colors.gray }}>{n.time}</span>
                        {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.orange, display: "inline-block" }} />}
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
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark, marginBottom: 6 }}>لا توجد وثائق متاحة بعد</div>
              <div style={{ fontSize: 12, color: colors.gray }}>ستظهر وثائقك هنا بعد اعتماد كل مرحلة من مستشارك</div>
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {downloadsData.map((d) => {
                const dlIconMap = { target: <IcTarget width={24} height={24}/>, cog: <IcCog width={24} height={24}/>, clipboard: <IcClipboard width={24} height={24}/>, palette: <IcPalette width={24} height={24}/> };
                return (
                <Card key={d.id} accent style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.tealCard, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>{dlIconMap[d.icon] || <IcDocument width={24} height={24}/>}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark }}>{d.name}</div>
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


      default: return (
        <GenericPage title={menu.find(m => m.id === currentView)?.label || "الصفحة"}>
          <Card>
            <div style={{ textAlign: "center", padding: 40, color: colors.gray }}>
              <div style={{ marginBottom: 16, color: colors.gray }}><IcDocument width={48} height={48}/></div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.tealDark, marginBottom: 8 }}>محتوى الصفحة</h3>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="اسم المنظمة" placeholder="اسم المنظمة" value={modal.data?.name} />
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, display: "block", marginBottom: 6 }}>نوع المنظمة</label><select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif" }}><option>جهة غير ربحية</option><option>مؤسسة وقفية</option><option>شركة اجتماعية</option></select></div>
          <Input label="اسم الممثل" placeholder="الاسم الكامل" />
          <Input label="البريد الإلكتروني" placeholder="email@org.sa" type="email" />
          <Input label="رقم الجوال" placeholder="+966 5X XXX XXXX" />
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, display: "block", marginBottom: 6 }}>القطاع</label><select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif" }}><option>تعليم</option><option>صحة</option><option>تنمية اجتماعية</option><option>بيئة</option><option>ثقافة</option></select></div>
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, display: "block", marginBottom: 6 }}>حجم المنظمة</label><select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif" }}><option>أقل من 10</option><option>10-50</option><option>51-200</option><option>أكثر من 200</option></select></div>
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, display: "block", marginBottom: 6 }}>الحالة</label><select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif" }}><option>نشط</option><option>معلق</option><option>موقوف</option></select></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={close}>إلغاء</Btn>
          <Btn onClick={close}>{modal.type === "add-org" ? "إضافة المنظمة" : "حفظ التعديلات"}</Btn>
        </div>
      </Modal>
    );

    if (modal.type === "view-org") return (
      <Modal open title={`تفاصيل: ${modal.data?.name}`} onClose={close} wide>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          {[{l:"النوع",v:modal.data?.type},{l:"القطاع",v:modal.data?.sector},{l:"التسجيل",v:modal.data?.date},{l:"الخدمات",v:modal.data?.services},{l:"المستشار",v:modal.data?.consultant},{l:"الحالة",v:modal.data?.status}].map((f,i) => (
            <div key={i} style={{ padding: 12, background: colors.grayLight, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: colors.gray }}>{f.l}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.tealDark, marginTop: 4 }}>{f.v}</div>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="اسم المستشار" placeholder="الاسم الكامل" />
          <Input label="البريد الإلكتروني" placeholder="email@example.com" type="email" />
          <Input label="رقم الجوال" placeholder="+966 5X XXX XXXX" />
          <Input label="سنوات الخبرة" placeholder="10" type="number" />
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, display: "block", marginBottom: 6 }}>التخصصات</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["تخطيط استراتيجي", "تخطيط تشغيلي", "سياسات HR", "حوكمة", "سياسات مالية", "سياسات إعلامية"].map((s, i) => (
                <label key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: `1px solid ${colors.grayBorder}`, cursor: "pointer", fontSize: 11 }}>
                  <input type="checkbox" defaultChecked={i < 2} style={{ accentColor: colors.teal }} />{s}
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
          <div><label style={{ fontSize: 13, fontWeight: 600, color: colors.tealDark, display: "block", marginBottom: 6 }}>الدور</label><select style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14, fontFamily: "'Cairo', sans-serif" }}><option>عميل</option><option>مستشار</option><option>مشرف فني</option><option>مدير نظام</option></select></div>
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
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.tealDark, marginBottom: 8 }}>هل أنت متأكد من الحذف؟</h3>
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
      background: '#1e293b', color: '#fff', borderRadius: 14,
      padding: '14px 28px', fontSize: 14, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 99999, direction: 'rtl', fontFamily: "'Cairo', sans-serif",
      animation: 'fadeInUp 0.35s ease',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 20 }}>🔒</span>
      <div>
        <div>انتهت جلستك — يرجى تسجيل الدخول مجدداً</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>تم تسجيل خروجك تلقائياً لحماية حسابك</div>
      </div>
      <button
        onClick={() => { setSessionExpired(false); setAuthPage('login'); }}
        style={{ marginRight: 8, padding: '6px 16px', background: colors.orange, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>
        دخول
      </button>
      <button onClick={() => setSessionExpired(false)}
        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
    </div>
  );

  if (!isDashboard) return <>{renderContent()}<ModalContent />{sessionToastEl}</>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", direction: "rtl" }}>
      <Sidebar />
      <div style={{ flex: 1, marginRight: sidebarOpen ? 240 : 64, transition: "margin 0.3s", display: "flex", flexDirection: "column" }}>
        <TopBar title={menu.find(m => m.id === currentView)?.label || activeUnit?.name || "لوحة التحكم"} breadcrumb={activeUnit ? "التخطيط الاستراتيجي" : undefined} />
        <div className="geo-bg" style={{ flex: 1, padding: 24, overflowY: "auto", position: 'relative' }}>
          {/* شريط التحميل العلوي — يظهر عند كل تنقل بدون أي اهتزاز في المحتوى */}
          <div
            key={`nav-${currentView}-${activeUnit?.id ?? 0}`}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 20,
              background: `linear-gradient(90deg, ${colors.teal}, ${colors.orange})`,
              transformOrigin: 'right',
              animation: 'navBar 0.55s cubic-bezier(0.4,0,0.2,1) forwards',
              borderRadius: '0 0 2px 2px',
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
        </div>
      </div>
      <ModalContent />
      {sessionToastEl}
    </div>
  );
}
