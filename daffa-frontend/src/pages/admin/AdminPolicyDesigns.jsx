import React, { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../../api/admin';

const C = {
  teal: '#1A6B7C', tealDark: '#145A68',
  orange: '#E8713A', orangeLight: '#FDF0E8',
  green: '#10B981', greenLight: '#D1FAE5',
  blue: '#3B82F6', blueLight: '#DBEAFE',
  yellow: '#F59E0B', yellowLight: '#FEF3C7',
  red: '#EF4444', redLight: '#FEE2E2',
  gray: '#6B7280', grayLight: '#F3F4F6', grayBorder: '#E5E7EB',
};

const STATUS_CFG = {
  pending:            { label: 'بانتظار التصميم', bg: C.yellowLight, color: '#92400e', dot: C.yellow   },
  revision_requested: { label: 'طُلب تعديل',      bg: C.redLight,    color: '#7f1d1d', dot: C.red       },
  uploaded:           { label: 'تم رفع التصميم', bg: C.blueLight,   color: '#1e40af', dot: C.blue      },
  approved:           { label: 'معتمد',           bg: C.greenLight,  color: '#065f46', dot: C.green     },
};

const SCOPE_LABELS = {
  unified:    '📋 تصميم موحد للجميع',
  color_coded:'🎨 لون مختلف لكل سياسة',
  per_policy: '🖌️ مستقل لكل سياسة',
};
const STYLE_LABELS = { modern: '✨ عصري', corporate: '🏢 مؤسسي', classic: '📜 كلاسيكي' };
const LANG_LABELS  = { arabic: '🇸🇦 عربي', english: '🇺🇸 إنجليزي', bilingual: '🌐 ثنائي' };

// ── تصدير موجز المصمم كصفحة HTML قابلة للطباعة ─────────────────────────────
const exportDesignerBrief = (item) => {
  const b = item.design_brief || {};
  const scopeMap = { unified: 'تصميم موحد لجميع السياسات', color_coded: 'لون مختلف لكل سياسة (نفس القالب)', per_policy: 'تصميم مستقل لكل سياسة' };
  const styleMap = { modern: 'عصري وبسيط', corporate: 'مؤسسي واحترافي', classic: 'كلاسيكي وأنيق' };
  const langMap  = { arabic: 'عربي فقط', english: 'إنجليزي فقط', bilingual: 'ثنائي اللغة (عربي + إنجليزي)' };

  const colorSwatch = (hex) => hex
    ? `<span style="display:inline-block;width:18px;height:18px;border-radius:4px;background:${hex};border:1px solid #ddd;vertical-align:middle;margin-left:6px"></span><code style="font-size:12px">${hex}</code>`
    : '—';

  const row = (label, val) => val
    ? `<tr><td style="color:#6b7280;padding:6px 12px 6px 0;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a">${val}</td></tr>`
    : '';

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>موجز التصميم — ${b.org_name || item.org_name || 'عميل'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Cairo',Tahoma,sans-serif;direction:rtl;background:#f8fafb;color:#1a1a1a;padding:0}
    .page{max-width:800px;margin:0 auto;background:#fff;min-height:100vh;padding:40px}
    @media print{body{background:#fff}.page{padding:20px;max-width:100%}.no-print{display:none!important}@page{margin:15mm}}
    .header{background:linear-gradient(135deg,#1A6B7C,#145A68);color:#fff;padding:28px 32px;border-radius:12px;margin-bottom:28px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
    .header-title{font-size:22px;font-weight:800;margin-bottom:4px}
    .header-sub{font-size:13px;opacity:0.8}
    .logo-box{background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;text-align:center}
    .logo-box img{max-height:70px;max-width:160px;object-fit:contain;display:block}
    .logo-box .no-logo{font-size:11px;opacity:0.7;padding:8px 12px}
    .section{margin-bottom:24px;border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden}
    .section-title{background:#f3f4f6;padding:10px 16px;font-size:13px;font-weight:700;color:#145A68;border-bottom:1px solid #e5e7eb}
    .section-body{padding:16px}
    table{width:100%;border-collapse:collapse}
    .colors{display:flex;gap:12px;flex-wrap:wrap;padding:4px 0}
    .color-item{display:flex;align-items:center;gap:8px;padding:6px 12px;background:#f8fafb;border-radius:8px;border:1px solid #e5e7eb}
    .color-swatch{width:32px;height:32px;border-radius:6px;border:1px solid #e5e7eb;flex-shrink:0}
    .color-info{font-size:12px}
    .color-label{color:#6b7280;margin-bottom:2px}
    .color-hex{font-family:monospace;font-weight:700;color:#1a1a1a}
    .policies{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0}
    .policy-tag{padding:4px 12px;border-radius:20px;background:#E8F4F6;color:#1A6B7C;font-size:12px;font-weight:600}
    .checkbox{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:600;background:#D1FAE5;color:#065f46;margin-left:8px}
    .download-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:#1A6B7C;color:#fff;border-radius:10px;text-decoration:none;font-family:'Cairo',sans-serif;font-weight:700;font-size:13px;margin-top:8px}
    .print-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 24px;background:#E8713A;color:#fff;border:none;border-radius:10px;font-family:'Cairo',sans-serif;font-weight:700;font-size:14px;cursor:pointer;margin-left:10px}
    .footer{margin-top:32px;padding:14px 20px;background:#f3f4f6;border-radius:10px;font-size:11px;color:#6b7280;text-align:center}
    .scope-box{padding:12px 16px;border-radius:8px;background:#EFF6FF;border:1.5px solid #BFDBFE;font-size:13px;font-weight:700;color:#1D4ED8;margin-bottom:0}
    .notes-box{padding:12px 14px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;font-size:13px;color:#78350F;line-height:1.7}
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="header-title">📋 موجز متطلبات التصميم</div>
        <div class="header-sub">تم إعداده من منصة دفة — ${new Date().toLocaleDateString('ar-SA', { year:'numeric', month:'long', day:'numeric' })}</div>
        <div style="margin-top:10px;font-size:13px;opacity:0.9">العميل: <strong>${b.org_name || item.org_name || '—'}</strong></div>
        <div style="font-size:12px;opacity:0.75;margin-top:3px">تاريخ الدفع: ${item.design_paid_at || '—'} | المبلغ: ${item.design_fee ? Number(item.design_fee).toLocaleString('en-US') + ' ريال' : '—'}</div>
      </div>
      ${item.design_logo_url
        ? `<div class="logo-box"><img src="${item.design_logo_url}" alt="شعار"/><div style="font-size:10px;opacity:0.7;margin-top:5px;direction:rtl">شعار المنظمة</div></div>`
        : `<div class="logo-box"><div class="no-logo">لم يتم رفع شعار</div></div>`
      }
    </div>

    <!-- أزرار الطباعة -->
    <div class="no-print" style="margin-bottom:20px;display:flex;flex-wrap:wrap;gap:8px;align-items:center">
      <button class="print-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
      ${item.design_logo_url ? `<a class="download-btn" href="${item.design_logo_url}" download target="_blank">⬇ تحميل الشعار</a>` : ''}
      <span style="font-size:11px;color:#6b7280">لحفظ كـ PDF: اضغط طباعة ← اختر "حفظ كـ PDF"</span>
    </div>

    <!-- السياسات المطلوب تصميمها -->
    <div class="section">
      <div class="section-title">📄 السياسات المطلوب تصميمها (${item.selected_policies?.length || 0} سياسات)</div>
      <div class="section-body">
        <div class="policies">
          ${(item.selected_policies || []).map(p => `<span class="policy-tag">${p}</span>`).join('')}
        </div>
        ${item.selected_policies?.length > 1 && b.design_scope ? `
        <div style="margin-top:12px">
          <div class="scope-box">🎯 طريقة التصميم المطلوبة: ${scopeMap[b.design_scope] || b.design_scope}</div>
        </div>` : ''}
      </div>
    </div>

    <!-- هوية المنظمة -->
    <div class="section">
      <div class="section-title">🏢 هوية المنظمة</div>
      <div class="section-body">
        ${item.design_logo_url ? `
        <div style="margin-bottom:16px;padding:12px;background:#f8fafb;border-radius:8px;border:1px solid #e5e7eb;display:inline-block">
          <img src="${item.design_logo_url}" style="max-height:80px;max-width:200px;object-fit:contain;display:block"/>
          <div style="font-size:10px;color:#6b7280;margin-top:6px;text-align:center">شعار المنظمة</div>
        </div>` : ''}
        <table>
          ${row('الاسم بالعربية',  b.org_name    || '—')}
          ${row('الاسم بالإنجليزية', b.org_name_en || '—')}
          ${row('نوع المنظمة',    b.org_type    || '—')}
          ${row('الشعار النصي',  b.org_slogan  || '—')}
          ${row('المدينة',        b.org_city    || '—')}
          ${row('الهاتف',         b.org_phone   || '—')}
          ${row('البريد الإلكتروني', b.org_email || '—')}
          ${row('الموقع الإلكتروني', b.org_website || '—')}
        </table>
      </div>
    </div>

    <!-- تفضيلات التصميم -->
    <div class="section">
      <div class="section-title">🎨 تفضيلات التصميم</div>
      <div class="section-body">
        <table style="margin-bottom:16px">
          ${row('نمط التصميم',  styleMap[b.design_style] || b.design_style || '—')}
          ${row('لغة الوثيقة', langMap[b.language]       || b.language    || '—')}
        </table>
        <!-- الألوان -->
        <div style="margin-bottom:14px">
          <div style="font-size:12px;color:#6b7280;margin-bottom:8px">الهوية اللونية:</div>
          <div class="colors">
            ${b.primary_color ? `
            <div class="color-item">
              <div class="color-swatch" style="background:${b.primary_color}"></div>
              <div class="color-info"><div class="color-label">اللون الرئيسي</div><div class="color-hex">${b.primary_color}</div></div>
            </div>` : ''}
            ${b.secondary_color ? `
            <div class="color-item">
              <div class="color-swatch" style="background:${b.secondary_color}"></div>
              <div class="color-info"><div class="color-label">اللون الثانوي</div><div class="color-hex">${b.secondary_color}</div></div>
            </div>` : ''}
          </div>
        </div>
        <!-- عناصر الوثيقة -->
        <div style="margin-bottom:${b.notes?'14px':'0'}">
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px">عناصر الوثيقة المطلوبة:</div>
          ${b.include_cover ? '<span class="checkbox">✓ صفحة غلاف لكل سياسة</span>' : '<span style="padding:5px 12px;border-radius:8px;font-size:12px;background:#f3f4f6;color:#9ca3af;margin-left:8px">✗ بدون صفحة غلاف</span>'}
          ${b.include_toc   ? '<span class="checkbox">✓ فهرس المحتويات</span>'       : '<span style="padding:5px 12px;border-radius:8px;font-size:12px;background:#f3f4f6;color:#9ca3af">✗ بدون فهرس</span>'}
        </div>
        ${b.notes ? `<div style="margin-top:14px"><div style="font-size:12px;color:#6b7280;margin-bottom:6px">ملاحظات وتعليمات المصمم:</div><div class="notes-box">💬 ${b.notes}</div></div>` : ''}
      </div>
    </div>

    <!-- ملاحظات تعديل إن وجدت -->
    ${item.design_revision_notes ? `
    <div class="section">
      <div class="section-title" style="background:#FEE2E2;color:#991b1b">⚠️ ملاحظات التعديل من العميل</div>
      <div class="section-body">
        <div style="font-size:13px;color:#7f1d1d;line-height:1.7">${item.design_revision_notes}</div>
      </div>
    </div>` : ''}

    <div class="footer">
      صدر من منصة دفة للتخطيط المؤسسي — هذا الموجز سري ومخصص للمصمم المكلف فقط
    </div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};

const Badge = ({ status }) => {
  const cfg = STATUS_CFG[status] || { label: status, bg: C.grayLight, color: C.gray, dot: C.gray };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
};

const InfoRow = ({ label, value, mono }) =>
  value ? (
    <div style={{ display: 'flex', gap: 6, fontSize: 12, marginBottom: 4 }}>
      <span style={{ color: C.gray, minWidth: 90, flexShrink: 0 }}>{label}</span>
      <span style={{ color: C.tealDark, fontWeight: 600, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  ) : null;

export default function AdminPolicyDesigns() {
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync,   setLastSync]   = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [selected,   setSelected]   = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const fileRef = useRef();
  const pollingRef = useRef();

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else        setLoading(true);
    try {
      const r = await adminApi.getPolicyDesigns();
      setItems(r.data);
      setLastSync(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + auto-refresh every 30s
  useEffect(() => {
    load();
    pollingRef.current = setInterval(() => load(true), 30_000);
    return () => clearInterval(pollingRef.current);
  }, [load]);

  const filtered = filter === 'all' ? items : items.filter(i => i.design_status === filter);
  const counts = {
    all:                items.length,
    pending:            items.filter(i => i.design_status === 'pending').length,
    revision_requested: items.filter(i => i.design_status === 'revision_requested').length,
    uploaded:           items.filter(i => i.design_status === 'uploaded').length,
    approved:           items.filter(i => i.design_status === 'approved').length,
  };

  const handleUpload = async (id, file) => {
    if (!file) return;
    setUploading(true);
    setUploadErr('');
    try {
      await adminApi.uploadPolicyDesign(id, file);
      setSelected(null);
      await load(true);
    } catch (e) {
      setUploadErr(e.response?.data?.message || 'حدث خطأ أثناء رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const fmtTime = (d) => d ? d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="animate-in" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '18px 24px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.tealDark, marginBottom: 2 }}>إدارة طلبات التصميم</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 12, color: C.gray }}>رفع التصاميم الاحترافية للعملاء</p>
            {lastSync && (
              <span style={{ fontSize: 10, color: refreshing ? C.teal : '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                {refreshing
                  ? <><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.teal, animation: 'pulse 1s infinite' }} /> يتحدث…</>
                  : <>🕐 آخر تحديث: {fmtTime(lastSync)}</>
                }
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => load(false)}
          disabled={loading || refreshing}
          style={{ padding: '8px 18px', background: loading ? C.grayLight : C.teal, color: loading ? C.gray : '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {loading ? '⏳' : '↻'} تحديث
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { key: 'pending',            label: 'بانتظار التصميم', color: C.yellow  },
          { key: 'revision_requested', label: 'طُلب تعديل',      color: C.red     },
          { key: 'uploaded',           label: 'بانتظار الاعتماد', color: C.blue    },
          { key: 'approved',           label: 'معتمدة',           color: C.green   },
        ].map(s => (
          <div key={s.key} onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
            style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer', border: `2px solid ${filter === s.key ? s.color : 'transparent'}`, transition: 'all 0.2s' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{counts[s.key]}</div>
            <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'الكل' },
          { key: 'pending', label: 'بانتظار التصميم' },
          { key: 'revision_requested', label: 'طُلب تعديل' },
          { key: 'uploaded', label: 'تم الرفع' },
          { key: 'approved', label: 'معتمدة' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', background: filter === f.key ? C.teal : '#fff', color: filter === f.key ? '#fff' : C.gray, border: `1.5px solid ${filter === f.key ? C.teal : C.grayBorder}` }}>
            {f.label} <span style={{ marginRight: 4, opacity: 0.75 }}>({counts[f.key]})</span>
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }}>
              <div style={{ height: 16, width: '40%', background: C.grayLight, borderRadius: 6, marginBottom: 10 }} />
              <div style={{ height: 10, width: '70%', background: C.grayLight, borderRadius: 4 }} />
            </div>
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '50px 24px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎨</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.tealDark, marginBottom: 6 }}>لا توجد طلبات</div>
          <p style={{ fontSize: 12, color: C.gray }}>{filter === 'all' ? 'لم يطلب أي عميل خدمة التصميم بعد' : 'لا توجد طلبات بهذه الحالة حالياً'}</p>
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(item => {
            const isExpanded = expandedId === item.id;
            const b = item.design_brief;
            const needsAction = item.design_status === 'pending' || item.design_status === 'revision_requested';

            return (
              <div key={item.id}
                style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: `2px solid ${needsAction ? C.orange + '40' : 'transparent'}`, overflow: 'hidden', transition: 'border 0.2s' }}>

                {/* Card header */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    {/* Left: org info */}
                    <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                      {/* Avatar */}
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#E8F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: C.teal, flexShrink: 0 }}>
                        {b?.org_name?.charAt(0) || item.org_name?.charAt(0) || '؟'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.tealDark, marginBottom: 2 }}>
                          {b?.org_name || item.org_name}
                          {b?.org_name_en && <span style={{ fontSize: 11, color: C.gray, fontWeight: 400, marginRight: 6, direction: 'ltr', display: 'inline-block' }}>{b.org_name_en}</span>}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                          {b?.org_type && <span style={{ padding: '1px 8px', borderRadius: 10, fontSize: 10, background: '#ede9fe', color: '#6d28d9', fontWeight: 600 }}>{b.org_type}</span>}
                          {item.selected_policies?.map((p, i) => (
                            <span key={i} style={{ padding: '1px 8px', borderRadius: 10, fontSize: 10, background: '#E8F4F6', color: C.teal, fontWeight: 600 }}>{p}</span>
                          ))}
                        </div>
                        {/* Meta row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: C.gray }}>
                          {item.design_paid_at && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              📅 <strong style={{ color: C.tealDark }}>{item.design_paid_at}</strong>
                            </span>
                          )}
                          {item.design_fee && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              💰 <strong style={{ color: C.teal }}>{Number(item.design_fee).toLocaleString('en-US')} ريال</strong>
                            </span>
                          )}
                          {item.consultant_name && (
                            <span>👤 {item.consultant_name}</span>
                          )}
                          {item.design_uploaded_at && (
                            <span>⬆ رُفع {item.design_uploaded_at}</span>
                          )}
                          {item.design_approved_at && (
                            <span style={{ color: C.green }}>✅ اعتُمد {item.design_approved_at}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: status + actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <Badge status={item.design_status} />
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        style={{ fontSize: 11, color: C.teal, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, padding: '2px 0' }}>
                        {isExpanded ? '▲ إخفاء التفاصيل' : '▼ عرض المتطلبات'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded: design brief */}
                {isExpanded && b && (
                  <div style={{ borderTop: `1px solid ${C.grayBorder}`, padding: '16px 20px', background: '#f8fafc' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, marginBottom: 12 }}>📋 متطلبات التصميم المُدخلة من العميل</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                      {/* Col 1: Identity */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>هوية المنظمة</div>
                        {item.design_logo_url && (
                          <div style={{ marginBottom: 10 }}>
                            <a href={item.design_logo_url} target="_blank" rel="noreferrer">
                              <img src={item.design_logo_url} alt="شعار"
                                style={{ height: 60, maxWidth: 140, objectFit: 'contain', borderRadius: 8, border: `1px solid ${C.grayBorder}`, background: '#fff', padding: 6 }} />
                            </a>
                          </div>
                        )}
                        <InfoRow label="الاسم العربي"    value={b.org_name}    />
                        <InfoRow label="الاسم الإنجليزي" value={b.org_name_en} />
                        <InfoRow label="النوع"           value={b.org_type}    />
                        <InfoRow label="الشعار النصي"   value={b.org_slogan}  />
                        <InfoRow label="المدينة"         value={b.org_city}    />
                        <InfoRow label="الهاتف"          value={b.org_phone}   />
                        <InfoRow label="البريد"          value={b.org_email}   />
                        <InfoRow label="الموقع"          value={b.org_website} />
                      </div>

                      {/* Col 2: Design prefs */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>تفضيلات التصميم</div>
                        <InfoRow label="نطاق التصميم" value={SCOPE_LABELS[b.design_scope] || b.design_scope} />
                        <InfoRow label="النمط"        value={STYLE_LABELS[b.design_style] || b.design_style} />
                        <InfoRow label="اللغة"        value={LANG_LABELS[b.language] || b.language}         />
                        <div style={{ display: 'flex', gap: 6, fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: C.gray, minWidth: 90 }}>الألوان</span>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {b.primary_color && (
                              <div title={b.primary_color} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 20, height: 20, borderRadius: 4, background: b.primary_color, border: `1px solid ${C.grayBorder}`, display: 'inline-block' }} />
                                <span style={{ fontSize: 10, fontFamily: 'monospace', color: C.tealDark }}>{b.primary_color}</span>
                              </div>
                            )}
                            {b.secondary_color && (
                              <div title={b.secondary_color} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 20, height: 20, borderRadius: 4, background: b.secondary_color, border: `1px solid ${C.grayBorder}`, display: 'inline-block' }} />
                                <span style={{ fontSize: 10, fontFamily: 'monospace', color: C.tealDark }}>{b.secondary_color}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* معاينة اللونين */}
                        {(b.primary_color || b.secondary_color) && (
                          <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 8, width: 120 }}>
                            <div style={{ flex: 1, background: b.primary_color || '#ccc' }} />
                            <div style={{ flex: 1, background: b.secondary_color || '#ccc' }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                          {b.include_cover && <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, background: C.greenLight, color: '#065f46' }}>✓ غلاف لكل سياسة</span>}
                          {b.include_toc   && <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, background: C.greenLight, color: '#065f46' }}>✓ فهرس محتويات</span>}
                        </div>
                        {b.notes && (
                          <div style={{ marginTop: 8, padding: '8px 10px', background: C.yellowLight, borderRadius: 8, fontSize: 11, color: '#78350f', lineHeight: 1.6, border: `1px solid ${C.yellow}30` }}>
                            <strong>ملاحظات: </strong>{b.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded: no brief */}
                {isExpanded && !b && (
                  <div style={{ borderTop: `1px solid ${C.grayBorder}`, padding: '14px 20px', background: '#f8fafc', fontSize: 12, color: C.gray, textAlign: 'center' }}>
                    لم يتم تعبئة متطلبات التصميم (طلب قديم)
                  </div>
                )}

                {/* Revision notes */}
                {item.design_revision_notes && (
                  <div style={{ margin: '0 20px 12px', padding: '10px 14px', background: C.redLight, borderRadius: 10, border: `1px solid ${C.red}30`, fontSize: 12, color: '#7f1d1d' }}>
                    <strong>⚠️ ملاحظات التعديل من العميل: </strong>{item.design_revision_notes}
                  </div>
                )}

                {/* Actions */}
                <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.grayBorder}`, background: needsAction ? `${C.orange}05` : '#fafafa', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Export brief */}
                  <button
                    onClick={() => exportDesignerBrief(item)}
                    title="تصدير موجز المصمم — يفتح صفحة قابلة للطباعة أو الحفظ كـ PDF"
                    style={{ padding: '7px 14px', background: '#f0fdf4', color: '#065f46', border: `1.5px solid #86efac`, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                    📤 تصدير للمصمم
                  </button>
                  {/* Download logo directly if available */}
                  {item.design_logo_url && (
                    <a href={item.design_logo_url} download target="_blank" rel="noreferrer"
                      style={{ padding: '7px 14px', background: C.blueLight, color: '#1e40af', borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, border: `1.5px solid #93c5fd` }}>
                      ⬇ تحميل الشعار
                    </a>
                  )}
                  {/* View existing file */}
                  {item.design_file && (
                    <a href={item.design_file} target="_blank" rel="noreferrer"
                      style={{ padding: '7px 16px', background: C.blueLight, color: '#1e40af', borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                      👁 عرض التصميم الحالي
                    </a>
                  )}

                  {/* Upload */}
                  {needsAction && (
                    <div>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        ref={selected?.id === item.id ? fileRef : null}
                        onChange={e => { const f = e.target.files[0]; if (f) handleUpload(item.id, f); }}
                      />
                      <button
                        onClick={() => { setSelected(item); setUploadErr(''); setTimeout(() => fileRef.current?.click(), 50); }}
                        disabled={uploading && selected?.id === item.id}
                        style={{ padding: '7px 18px', background: C.orange, color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: uploading && selected?.id === item.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, opacity: uploading && selected?.id === item.id ? 0.6 : 1 }}>
                        {uploading && selected?.id === item.id ? '⏳ جارٍ الرفع…' : '⬆ رفع التصميم'}
                      </button>
                    </div>
                  )}

                  {item.design_status === 'uploaded' && (
                    <span style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>⏳ بانتظار اعتماد العميل</span>
                  )}
                  {item.design_status === 'approved' && (
                    <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>✅ تم الاعتماد من العميل</span>
                  )}

                  {/* Upload error */}
                  {uploadErr && selected?.id === item.id && (
                    <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>⚠️ {uploadErr}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden fallback input */}
      <input type="file" accept=".pdf,.jpg,.jpeg,.png"
        ref={selected ? fileRef : null}
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f && selected) handleUpload(selected.id, f); }}
      />
    </div>
  );
}
