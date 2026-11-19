// مكوّنات الواجهة المشتركة بهوية دفة.
import { colors, tones, font, shadow } from '../../theme/tokens';
import { IcClock, IcUpload, IcSearch, IcCheckCircle, IcArrowPath, IcXMark } from '../../utils/icons';
import { Help } from './Help';
import { RosetteShape } from '../brand/Logo';

// ── شارة الحالة ──────────────────────────────────────────────────────────────
export const Badge = ({ text, color = 'gray', small, dot, children, style }) => {
  const c = tones[color] || tones.gray;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: small ? '2px 9px' : '4px 12px', borderRadius: 999, fontSize: small ? 11 : 12, fontWeight: 600, lineHeight: 1.6, background: c.bg, color: c.text, whiteSpace: 'nowrap', ...style }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />}
      {text}{children}
    </span>
  );
};

// ── شريط التقدّم ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ percent = 0, height = 8, color, track }) => {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const fill = color || (pct >= 100 ? colors.greenBright : colors.primary);
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ width: '100%', height, background: track || colors.sunken, borderRadius: height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: fill, borderRadius: height, transition: 'width 0.8s cubic-bezier(0.2,0.8,0.2,1)' }} />
    </div>
  );
};

// ── الأزرار ──────────────────────────────────────────────────────────────────
// primary = البرتقالي «خطوتك التالية» (بنص كحلي)، brand = أزرق الدفّة، secondary = إطار.
const BTN = {
  primary:   { bg: colors.amber,   color: colors.ink,     border: '1.5px solid transparent', shadow: '0 2px 0 rgba(163,63,18,0.35)' },
  brand:     { bg: colors.primary, color: '#fff',         border: '1.5px solid transparent', shadow: '0 2px 0 rgba(18,50,71,0.35)' },
  secondary: { bg: '#fff',         color: colors.primary, border: `1.5px solid ${colors.primary}` },
  outline:   { bg: '#fff',         color: colors.text,    border: `1.5px solid ${colors.borderStrong}` },
  ghost:     { bg: 'transparent',  color: colors.primary, border: '1.5px solid transparent' },
  success:   { bg: colors.green,   color: '#fff',         border: '1.5px solid transparent' },
  danger:    { bg: colors.red,     color: '#fff',         border: '1.5px solid transparent' },
  dangerGhost: { bg: 'transparent', color: colors.red,    border: '1.5px solid transparent' },
};

export const Btn = ({ children, variant = 'primary', onClick, disabled, small, large, full, icon, iconEnd, type = 'button', title, style, ...rest }) => {
  const s = BTN[variant] || BTN.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        minHeight: small ? 34 : large ? 52 : 44,
        padding: small ? '6px 14px' : large ? '12px 30px' : '10px 22px',
        borderRadius: small ? 10 : 12,
        fontSize: small ? 13 : large ? 16 : 14.5, fontWeight: 700, fontFamily: 'inherit', lineHeight: 1.4,
        background: disabled ? colors.sunken : s.bg,
        color: disabled ? colors.subtle : s.color,
        border: disabled ? '1.5px solid transparent' : s.border,
        boxShadow: disabled ? 'none' : (s.shadow || 'none'),
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: full ? '100%' : 'auto',
        transition: 'transform 0.12s, box-shadow 0.15s, background 0.15s, filter 0.15s',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>}
      {children}
      {iconEnd && <span style={{ display: 'flex', flexShrink: 0 }}>{iconEnd}</span>}
    </button>
  );
};

// ── البطاقة ──────────────────────────────────────────────────────────────────
export const Card = ({ children, accent, onClick, style, hover, className, ...rest }) => (
  <div
    onClick={onClick}
    className={className}
    style={{
      background: colors.surface, borderRadius: 16, padding: 20,
      border: `1px solid ${colors.grayBorder}`,
      boxShadow: shadow.xs,
      borderBottom: accent ? `3px solid ${typeof accent === 'string' ? accent : colors.amber}` : `1px solid ${colors.grayBorder}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
      ...style,
    }}
    onMouseEnter={(onClick || hover) ? (e) => { e.currentTarget.style.boxShadow = shadow.md; e.currentTarget.style.transform = 'translateY(-2px)'; } : undefined}
    onMouseLeave={(onClick || hover) ? (e) => { e.currentTarget.style.boxShadow = shadow.xs; e.currentTarget.style.transform = 'none'; } : undefined}
    {...rest}
  >
    {children}
  </div>
);

// ── حقل الإدخال ──────────────────────────────────────────────────────────────
const fieldStyle = { width: '100%', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${colors.grayBorder}`, fontSize: 14.5, fontFamily: 'inherit', outline: 'none', background: '#fff', color: colors.ink, transition: 'border 0.2s, box-shadow 0.2s' };

export const Input = ({ label, placeholder, type = 'text', value, onChange, textarea, icon, hint, help, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && (
      <label style={{ fontSize: 13.5, fontWeight: 600, color: colors.ink, display: 'flex', alignItems: 'center' }}>
        {label}{help}
      </label>
    )}
    {textarea ? (
      <textarea placeholder={placeholder} value={value} onChange={onChange} rows={4} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.8 }} {...rest} />
    ) : (
      <div style={{ position: 'relative' }}>
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{ ...fieldStyle, paddingLeft: icon ? 38 : 14 }} {...rest} />
        {icon && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.subtle, display: 'flex' }}>{icon}</span>}
      </div>
    )}
    {hint && <span style={{ fontSize: 12, color: colors.gray }}>{hint}</span>}
  </div>
);

// ── بطاقة رقم ────────────────────────────────────────────────────────────────
export const MetricCard = ({ title, value, icon, color = colors.primary, sub, help, onClick, tone }) => {
  const t = tone ? tones[tone] : null;
  return (
    <Card onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18, minWidth: 0 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: t ? t.bg : `${color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t ? t.text : color, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: font.display, fontSize: 24, fontWeight: 700, color: colors.ink, lineHeight: 1.25 }}>{value}</div>
        <div style={{ fontSize: 13, color: colors.gray, display: 'flex', alignItems: 'center' }}>{title}{help}</div>
        {sub && <div style={{ fontSize: 12, color: colors.greenText, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
      </div>
    </Card>
  );
};

// ── تبويبات ──────────────────────────────────────────────────────────────────
export const Tab = ({ tabs, active, onChange }) => (
  <div role="tablist" style={{ display: 'flex', gap: 2, background: colors.sunken, borderRadius: 14, padding: 4, overflowX: 'auto', maxWidth: '100%' }}>
    {tabs.map((t, i) => (
      <button key={i} role="tab" aria-selected={active === i} onClick={() => onChange(i)} style={{ padding: '8px 18px', minHeight: 38, borderRadius: 10, fontSize: 13.5, fontWeight: active === i ? 700 : 500, fontFamily: 'inherit', background: active === i ? '#fff' : 'transparent', color: active === i ? colors.primary : colors.gray, border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: active === i ? shadow.xs : 'none', whiteSpace: 'nowrap' }}>
        {t}
      </button>
    ))}
  </div>
);

// ── شريط حالة الوحدة ─────────────────────────────────────────────────────────
const STATUS_ICONS = {
  not_submitted: <IcClock width={18} height={18} />,
  submitted:     <IcUpload width={18} height={18} />,
  reviewing:     <IcSearch width={18} height={18} />,
  approved:      <IcCheckCircle width={18} height={18} />,
  revision:      <IcArrowPath width={18} height={18} />,
};
export const StatusBar = ({ status }) => {
  const map = {
    not_submitted: { tone: 'gray',   text: 'لم يُرسل بعد',                                  term: 'status_in_progress' },
    submitted:     { tone: 'blue',   text: 'تم الإرسال للمراجعة — بانتظار المستشار',        term: 'status_submitted' },
    reviewing:     { tone: 'blue',   text: 'قيد المراجعة',                                  term: 'status_reviewing' },
    approved:      { tone: 'green',  text: 'معتمد — يمكنك الانتقال للوحدة التالية',         term: 'status_approved' },
    revision:      { tone: 'amber',  text: 'يحتاج تعديل — راجع ملاحظات المستشار',           term: 'status_revision' },
  };
  const s = map[status] || map.not_submitted;
  const c = tones[s.tone];
  return (
    <div style={{ padding: '12px 18px', borderRadius: 14, background: c.bg, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: c.text }}>
      {STATUS_ICONS[status] || STATUS_ICONS.not_submitted}
      <span style={{ flex: 1 }}>{s.text}</span>
      <Help term={s.term} />
    </div>
  );
};

// ── نافذة منبثقة ─────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div className="df-modal-scrim" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,31,46,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'pageIn 0.2s ease' }}>
      <div className="df-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: wide ? 720 : 520, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: shadow.lg, animation: 'modalIn 0.22s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '16px 22px', borderBottom: `1px solid ${colors.grayBorder}`, position: 'sticky', top: 0, background: '#fff', zIndex: 1, borderRadius: '20px 20px 0 0' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.ink }}>{title}</h3>
          <button onClick={onClose} title="إغلاق" aria-label="إغلاق" style={{ width: 36, height: 36, borderRadius: 10, background: colors.sunken, border: 'none', cursor: 'pointer', color: colors.gray, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IcXMark width={18} height={18} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
};

// ── الرسوم ───────────────────────────────────────────────────────────────────
export const BarChart = ({ data, height = 200, colorFn }) => {
  const max = Math.max(1, ...data.map((x) => x.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, padding: '10px 0' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 11, color: colors.gray, fontWeight: 600 }}>{d.value}</span>
          <div style={{ width: '100%', maxWidth: 46, height: `${(d.value / max) * 100}%`, background: colorFn ? colorFn(i) : colors.primary, borderRadius: '8px 8px 2px 2px', minHeight: 4, transition: 'height 0.6s ease' }} />
          <span style={{ fontSize: 10.5, color: colors.gray, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

export const DonutChart = ({ segments, size = 120, label }) => {
  let cum = 0;
  const gradient = segments.map((s) => { const start = cum; cum += s.percent; return `${s.color} ${start}% ${cum}%`; }).join(', ');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: `conic-gradient(${gradient})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: size * 0.6, height: size * 0.6, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          {label && <span style={{ fontFamily: font.display, fontSize: 15, fontWeight: 700, color: colors.ink }}>{label}</span>}
        </div>
      </div>
      <div>{segments.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: colors.text }}>{s.label} <span style={{ color: colors.gray }}>({s.percent}%)</span></span>
        </div>
      ))}</div>
    </div>
  );
};

export const LineChart = ({ data, height = 180 }) => {
  const max = data && data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0;
  if (!data || data.length < 2 || max === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: colors.gray }}>لا توجد بيانات بعد</span>
      </div>
    );
  }
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.value / max) * 85}`).join(' ');
  return (
    <div style={{ height, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', flex: 1, minHeight: 0 }}>
        <defs><linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors.primary} stopOpacity="0.28" /><stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" /></linearGradient></defs>
        <polygon points={`0,100 ${points} 100,100`} fill="url(#lineGrad)" />
        <polyline points={points} fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => <circle key={i} cx={(i / (data.length - 1)) * 100} cy={100 - (d.value / max) * 85} r="1.6" fill={colors.amber} />)}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {data.map((d, i) => <span key={i} style={{ fontSize: 10.5, color: colors.gray }}>{d.label}</span>)}
      </div>
    </div>
  );
};

// ── هيكل الصفحة ──────────────────────────────────────────────────────────────
export const GenericPage = ({ title, children, help, actions, subtitle }) => (
  <div className="animate-in">
    {(title || actions) && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          {title && <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.ink, display: 'flex', alignItems: 'center' }}>{title}{help}</h2>}
          {subtitle && <p style={{ fontSize: 14, color: colors.gray, marginTop: 4 }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

// ── حالة فارغة ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, text, action }) => (
  <Card style={{ padding: '48px 24px', textAlign: 'center' }}>
    {icon && <div style={{ width: 64, height: 64, borderRadius: 20, background: colors.primaryTint, color: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>{icon}</div>}
    <div style={{ fontFamily: font.display, fontSize: 16, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>{title}</div>
    {text && <div style={{ fontSize: 14, color: colors.gray, maxWidth: 420, margin: '0 auto', lineHeight: 1.9 }}>{text}</div>}
    {action && <div style={{ marginTop: 18 }}>{action}</div>}
  </Card>
);

// ── مؤشّر التحميل (النقاط الثلاث الصاعدة) ─────────────────────────────────────
export const Loading = ({ text = 'جارٍ التحميل…', pad = 60 }) => (
  <div style={{ padding: pad, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: colors.gray, fontSize: 13.5 }}>
    <RosetteShape size={34} color={colors.primary} hub={colors.amber} className="df-turn" />
    {text}
  </div>
);

// ── عنوان قسم ────────────────────────────────────────────────────────────────
export const SectionTitle = ({ children, help, action, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14, ...style }}>
    <h3 style={{ fontSize: 16.5, fontWeight: 700, color: colors.ink, display: 'flex', alignItems: 'center' }}>{children}{help}</h3>
    {action}
  </div>
);
