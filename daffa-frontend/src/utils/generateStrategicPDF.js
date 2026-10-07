const LABELS = {
  vision:'الرؤية', mission:'الرسالة', values:'القيم',
  target_community:'المجتمع المستهدف', geographic_scope:'النطاق الجغرافي',
  programs:'البرامج والخدمات', partners:'الشركاء', resources:'الموارد',
  challenges:'التحديات', description:'الوصف', notes:'ملاحظات',
  strengths:'نقاط القوة', weaknesses:'نقاط الضعف',
  opportunities:'الفرص', threats:'التهديدات',
  needs:'الاحتياجات', community_definition:'تعريف المجتمع المستهدف',
  need_description:'وصف الاحتياج', priority:'الأولوية', source:'المصدر',
  positions:'المناصب', dept:'القسم', title:'المسمى الوظيفي',
  role:'الدور', responsibilities:'المسؤوليات', reports_to:'يرفع لـ',
  kpis:'مؤشرات الأداء', indicator:'المؤشر', target:'الهدف',
  unit:'الوحدة', frequency:'التكرار', baseline:'القيمة الأساسية',
  initiatives:'المبادرات', name:'الاسم', objective:'الهدف',
  timeline:'الجدول الزمني', budget:'الميزانية', responsible:'المسؤول',
  value_proposition:'عرض القيمة', customer_segments:'شرائح العملاء',
  channels:'قنوات التواصل', customer_relationships:'علاقات العملاء',
  revenue_streams:'مصادر الدخل', key_resources:'الموارد الرئيسية',
  key_activities:'الأنشطة الرئيسية', key_partners:'الشركاء الرئيسيون',
  cost_structure:'هيكل التكاليف', relationships:'علاقات العملاء',
  problem:'المشكلة', inputs:'المدخلات', activities:'الأنشطة',
  outputs:'المخرجات', outcomes:'النتائج', impact:'الأثر',
  assumptions:'الافتراضات',
  so:'ق+ف', st:'ق+ت', wo:'ض+ف', wt:'ض+ت',
  tows:'مصفوفة TOWS', toc:'نظرية التغيير', bmc:'نموذج العمل',
  directions:'التوجهات الاستراتيجية', matrix:'مصفوفة SWOT',
  table:'الجدول', needs_table:'جدول الاحتياجات',
  factors:'عوامل PESTEL', stakeholders:'أصحاب المصلحة',
  gap_analysis:'تحليل الفجوة', goals_list:'الأهداف الاستراتيجية',
  values_list:'القيم المؤسسية',
  desc:'الوصف', level:'المستوى', interest:'الاهتمام', strategy:'الاستراتيجية',
  document:'الوثيقة', monitoring:'المتابعة والتقييم',
  key_findings:'النتائج الرئيسية', closing_notes:'ملاحظات ختامية',
  implementation:'خطة التنفيذ', executive_summary:'الملخص التنفيذي',
};

function lbl(k) {
  if (!k) return '';
  return LABELS[k] || k.replace(/_/g, ' ');
}

function isCompoundTable(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = Object.keys(obj);
  return keys.length > 1 && keys.filter(k => k.includes('__')).length >= keys.length * 0.6;
}

function renderCompoundTable(obj) {
  const rows = {};
  const attrsSet = new Set();
  Object.entries(obj).forEach(([key, val]) => {
    if (key.includes('__')) {
      const idx = key.lastIndexOf('__');
      const cat  = key.slice(0, idx);
      const attr = key.slice(idx + 2);
      if (!rows[cat]) rows[cat] = {};
      rows[cat][attr] = val;
      attrsSet.add(attr);
    } else {
      if (!rows['__extra__']) rows['__extra__'] = {};
      rows['__extra__'][key] = val;
    }
  });
  const attrs = [...attrsSet];
  const cats  = Object.keys(rows).filter(c => c !== '__extra__');
  if (!cats.length) return '<span class="empty">—</span>';
  return `<table class="data-table">
    <thead><tr><th>البند</th>${attrs.map(a=>`<th>${lbl(a)}</th>`).join('')}</tr></thead>
    <tbody>${cats.map(cat=>`<tr>
      <td><strong>${cat}</strong></td>
      ${attrs.map(a=>`<td>${rows[cat][a]??'—'}</td>`).join('')}
    </tr>`).join('')}</tbody>
  </table>`;
}

function renderArray(arr) {
  if (!arr || arr.length === 0) return '<span class="empty">—</span>';
  if (typeof arr[0] === 'object') return renderTable(arr);
  return `<ul>${arr.map(v=>`<li>${v}</li>`).join('')}</ul>`;
}

function renderTable(arr) {
  if (!arr || !arr.length) return '<span class="empty">—</span>';
  const keys = [...new Set(arr.flatMap(r => Object.keys(r)))];
  return `<table class="data-table">
    <thead><tr>${keys.map(k=>`<th>${lbl(k)}</th>`).join('')}</tr></thead>
    <tbody>${arr.map(row=>`<tr>${keys.map(k=>`<td>${row[k]??'—'}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
}

function renderValue(val) {
  if (val===null||val===undefined||val==='') return '<span class="empty">—</span>';
  if (Array.isArray(val)) return renderArray(val);
  if (typeof val==='object') {
    if (isCompoundTable(val)) return renderCompoundTable(val);
    const entries = Object.entries(val).filter(([,v])=>v!==null&&v!==undefined&&v!=='');
    if (!entries.length) return '<span class="empty">—</span>';
    return `<div class="nested">${entries.map(([k,v])=>`
      <div class="nested-row">
        <span class="nested-key">${lbl(k)}</span>
        <span class="nested-val">${renderValue(v)}</span>
      </div>`).join('')}</div>`;
  }
  return String(val);
}

function renderFormData(formData) {
  if (!formData || typeof formData !== 'object') return '<p class="empty">لا توجد بيانات</p>';
  if (isCompoundTable(formData)) return renderCompoundTable(formData);

  return Object.entries(formData).map(([key, val]) => {
    const isEmpty = val===null||val===undefined||val===''||(Array.isArray(val)&&val.length===0);
    if (isEmpty) return '';

    if (typeof val==='object' && !Array.isArray(val) && isCompoundTable(val)) {
      return `<div class="field-block">
        <div class="field-label">${lbl(key)}</div>
        <div class="field-value">${renderCompoundTable(val)}</div>
      </div>`;
    }
    if (Array.isArray(val) && val.length > 0 && typeof val[0]==='object') {
      return `<div class="field-block">
        <div class="field-label">${lbl(key)}</div>
        <div class="field-value">${renderTable(val)}</div>
      </div>`;
    }
    if (Array.isArray(val)) {
      return `<div class="field-block">
        <div class="field-label">${lbl(key)}</div>
        <div class="field-value"><ul>${val.map(v=>`<li>${v}</li>`).join('')}</ul></div>
      </div>`;
    }
    if (typeof val==='object') {
      return `<div class="field-block">
        <div class="field-label">${lbl(key)}</div>
        <div class="field-value">${renderValue(val)}</div>
      </div>`;
    }
    return `<div class="field-block">
      <div class="field-label">${lbl(key)}</div>
      <div class="field-value">${String(val)}</div>
    </div>`;
  }).join('');
}

const PDF_CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  .pdf-root {
    font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;
    direction:rtl; color:#1f2937; background:#fff;
    font-size:12px; line-height:1.6; width:794px;
  }

  /* ══ غلاف ══ */
  .cover {
    background: linear-gradient(155deg,#0f3d49 0%,#14505E 45%,#1A6B7C 100%);
    color:#fff; padding:28px 36px 24px;
    border-radius:0 0 12px 12px;
    position:relative; overflow:hidden;
  }
  .cover::before {
    content:''; position:absolute; top:-50px; left:-50px;
    width:220px; height:220px; border-radius:50%;
    background:rgba(255,255,255,0.04); pointer-events:none;
  }
  .cover-top {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:20px; padding-bottom:14px;
    border-bottom:1px solid rgba(255,255,255,0.15);
  }
  .cover-logo { height:32px; object-fit:contain; }
  .cover-badge {
    background:#E8620A; color:#fff;
    padding:4px 14px; border-radius:20px;
    font-size:10px; font-weight:700;
  }
  .cover-body { text-align:center; padding:14px 0 20px; }
  .cover-org-type { font-size:11px; opacity:0.6; margin-bottom:6px; }
  .cover-title { font-size:24px; font-weight:800; margin-bottom:6px; line-height:1.25; }
  .cover-sub { font-size:12px; opacity:0.7; margin-bottom:16px; }
  .cover-line { width:40px; height:2px; background:#E8620A; margin:0 auto 16px; border-radius:2px; }
  .cover-cards { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
  .cover-card {
    background:rgba(255,255,255,0.1);
    border:1px solid rgba(255,255,255,0.2);
    border-radius:8px; padding:8px 16px;
    min-width:120px; text-align:center;
  }
  .cover-card-lbl { font-size:9px; opacity:0.6; margin-bottom:2px; }
  .cover-card-val { font-size:12px; font-weight:700; }
  .cover-footer {
    margin-top:18px; padding-top:12px;
    border-top:1px solid rgba(255,255,255,0.12);
    display:flex; align-items:center; justify-content:center; gap:6px;
    font-size:10px; opacity:0.45;
  }
  .cover-footer img { height:14px; opacity:0.5; }

  /* ══ فهرس ══ */
  .toc-section { padding:20px 0 20px; }
  .toc-header {
    background:#1A6B7C; color:#fff;
    padding:10px 16px; border-radius:8px;
    font-size:14px; font-weight:800; margin-bottom:12px;
  }
  .toc-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px; }
  .toc-item {
    display:flex; align-items:center; gap:8px;
    padding:7px 10px; border-radius:6px;
    background:#f9fafb; border:1px solid #e5e7eb;
  }
  .toc-num {
    width:22px; height:22px; background:#1A6B7C; color:#fff;
    border-radius:50%; display:inline-flex; align-items:center;
    justify-content:center; font-size:10px; font-weight:700; flex-shrink:0;
  }
  .toc-name { font-size:11px; font-weight:600; color:#374151; }

  /* ══ وحدات ══ */
  .unit-section { padding:0 0 16px; }
  .unit-header {
    display:flex; align-items:center; gap:10px;
    margin-bottom:12px; padding-bottom:8px;
    border-bottom:2.5px solid #1A6B7C;
  }
  .unit-num {
    width:30px; height:30px; background:#1A6B7C; color:#fff;
    border-radius:50%; display:inline-flex; align-items:center;
    justify-content:center; font-size:13px; font-weight:800; flex-shrink:0;
  }
  .unit-header h2 { font-size:15px; font-weight:800; color:#14505E; }

  .field-block {
    margin-bottom:8px; border-radius:6px;
    border-right:3px solid #1A6B7C;
    background:#f9fafb; padding:8px 10px;
  }
  .field-label {
    font-size:9.5px; font-weight:700; color:#1A6B7C;
    text-transform:uppercase; letter-spacing:0.3px; margin-bottom:4px;
  }
  .field-value { font-size:11.5px; color:#374151; line-height:1.65; }
  .field-value ul { padding-right:16px; margin:0; }
  .field-value li { margin-bottom:2px; }
  .empty { color:#9ca3af; font-style:italic; }

  .data-table { width:100%; border-collapse:collapse; font-size:10.5px; margin-top:2px; }
  .data-table th {
    background:#1A6B7C; color:#fff;
    padding:5px 8px; font-weight:700; text-align:right; font-size:10px;
  }
  .data-table td { padding:5px 8px; border-bottom:1px solid #e5e7eb; color:#374151; }
  .data-table tr:nth-child(even) td { background:#f3f4f6; }
  .data-table tr:last-child td { border-bottom:none; }

  .nested-row {
    display:flex; gap:8px; padding:3px 0;
    border-bottom:1px dashed #f3f4f6;
  }
  .nested-row:last-child { border-bottom:none; }
  .nested-key { font-weight:700; color:#6b7280; min-width:100px; font-size:11px; flex-shrink:0; }
  .nested-val { font-size:11px; color:#374151; }

  /* ══ ختام ══ */
  .closing {
    background:linear-gradient(155deg,#0f3d49 0%,#14505E 45%,#1A6B7C 100%);
    color:#fff; padding:40px 36px;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    text-align:center; min-height:200px;
    border-radius:12px; margin-top:16px;
  }
  .closing-logo { height:36px; object-fit:contain; margin-bottom:18px; opacity:0.9; }
  .closing-title { font-size:17px; font-weight:800; margin-bottom:6px; }
  .closing-text { font-size:11px; opacity:0.7; max-width:360px; line-height:1.7; margin-bottom:22px; }
  .closing-stamp {
    border:1.5px solid rgba(255,255,255,0.3);
    border-radius:10px; padding:12px 28px;
    background:rgba(255,255,255,0.08);
  }
  .stamp-lbl { font-size:9px; opacity:0.6; margin-bottom:2px; }
  .stamp-val { font-size:14px; font-weight:800; }

  /* فاصل الصفحة */
  .page-sep {
    width:100%; height:2px; background:transparent;
    margin:0; padding:0; display:block;
    page-break-before: always;
  }
`;

export default async function generateStrategicPDF(workflow, orgInfo) {

  const logoUrl = window.location.origin + '/logo-white.png';

  const submissions = Array.isArray(workflow.submissions)
    ? workflow.submissions
    : Object.values(workflow.submissions || {});

  const approvedUnits = submissions
    .filter(s => s.status === 'approved')
    .sort((a,b) => (a.unit_number||0) - (b.unit_number||0));

  const orgName    = orgInfo?.org_name || workflow?.user?.org_name || 'المنظمة';
  const orgType    = orgInfo?.org_type || workflow?.user?.org_type || '';
  const repName    = orgInfo?.rep_name || workflow?.user?.rep_name || '';
  const consultant = workflow?.consultant?.name || '—';
  const completedAt = workflow?.completed_at
    ? new Date(workflow.completed_at).toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'})
    : new Date().toLocaleDateString('ar-SA',{year:'numeric',month:'long',day:'numeric'});

  const unitsHTML = approvedUnits.map((s, idx) => {
    const unitName = s.unit?.name || s.unit_name || `الوحدة ${s.unit_number}`;
    return `
      <div class="page-sep"></div>
      <div class="unit-section">
        <div class="unit-header">
          <span class="unit-num">${s.unit_number||idx+1}</span>
          <h2>${unitName}</h2>
        </div>
        ${renderFormData(s.form_data)}
      </div>`;
  }).join('');

  const bodyHtml = `
    <!-- غلاف -->
    <div class="cover">
      <div class="cover-top">
        <img src="${logoUrl}" class="cover-logo" alt="دفة">
        <span class="cover-badge">وثيقة رسمية معتمدة</span>
      </div>
      <div class="cover-body">
        ${orgType?`<div class="cover-org-type">${orgType}</div>`:''}
        <div class="cover-title">${orgName}</div>
        <div class="cover-sub">الخطة الاستراتيجية المعتمدة</div>
        <div class="cover-line"></div>
        <div class="cover-cards">
          ${repName?`<div class="cover-card"><div class="cover-card-lbl">ممثل المنظمة</div><div class="cover-card-val">${repName}</div></div>`:''}
          <div class="cover-card"><div class="cover-card-lbl">المستشار المشرف</div><div class="cover-card-val">${consultant}</div></div>
          <div class="cover-card"><div class="cover-card-lbl">تاريخ الاعتماد</div><div class="cover-card-val">${completedAt}</div></div>
          <div class="cover-card"><div class="cover-card-lbl">الوحدات المعتمدة</div><div class="cover-card-val">${approvedUnits.length} وحدة</div></div>
        </div>
      </div>
      <div class="cover-footer">
        <img src="${logoUrl}" alt="دفة">
        منصة دفة للتخطيط الاستراتيجي &nbsp;•&nbsp; daffa.sa
      </div>
    </div>

    <!-- فهرس -->
    <div class="page-sep"></div>
    <div class="toc-section">
      <div class="toc-header">فهرس المحتوى</div>
      <div class="toc-grid">
        ${approvedUnits.map(s=>`
        <div class="toc-item">
          <span class="toc-num">${s.unit_number||''}</span>
          <span class="toc-name">${s.unit?.name||s.unit_name||`الوحدة ${s.unit_number}`}</span>
        </div>`).join('')}
      </div>
    </div>

    <!-- وحدات -->
    ${unitsHTML}

    <!-- ختام -->
    <div class="page-sep"></div>
    <div class="closing">
      <img src="${logoUrl}" class="closing-logo" alt="دفة">
      <div class="closing-title">تم اعتماد الخطة الاستراتيجية</div>
      <p class="closing-text">تم إعداد هذه الوثيقة بمنهجية علمية متكاملة بإشراف مستشار متخصص عبر منصة دفة.</p>
      <div class="closing-stamp">
        <div class="stamp-lbl">معتمد من قبل المستشار</div>
        <div class="stamp-val">${consultant}</div>
        <div class="stamp-lbl" style="margin-top:8px">تاريخ الاعتماد</div>
        <div class="stamp-val" style="font-size:12px">${completedAt}</div>
      </div>
    </div>
  `;

  // بناء HTML كامل كوثيقة مستقلة
  const fullHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="color-scheme" content="light">
<title>الخطة الاستراتيجية — ${orgName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
${PDF_CSS}
@page { size: A4; margin: 10mm 12mm; }
@media print {
  * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; color-adjust:exact !important; }
  .page-sep { page-break-before: always; }
}
.pdf-root { margin: 0 auto; }
</style>
</head>
<body>
<div class="pdf-root">${bodyHtml}</div>
<script>
  document.fonts.ready.then(function() {
    setTimeout(function() { window.print(); }, 800);
  });
<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=950,height=750');
  if (!win) {
    alert('يرجى السماح بالنوافذ المنبثقة في المتصفح');
    return;
  }
  win.document.write(fullHtml);
  win.document.close();
}
