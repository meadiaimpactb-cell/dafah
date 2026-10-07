<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>الخطة الاستراتيجية — {{ $workflow->user->org_name ?? 'المنظمة' }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
/* ═══ BASE ═══ */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    color: #1f2937;
    background: #d1d5db;
    font-size: 13px;
    line-height: 1.75;
}

/* ═══ PRINT BAR ═══ */
.print-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    background: #0f3d48;
    color: #e0f2f7;
    padding: 0 28px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 9999;
    box-shadow: 0 2px 12px rgba(0,0,0,0.4);
    gap: 16px;
}
.print-bar-brand { font-size: 15px; font-weight: 800; color: #fff; letter-spacing: 0.3px; }
.print-bar-title { font-size: 13px; color: #9ecfda; flex: 1; text-align: center; }
.print-btn {
    background: #E8620A;
    color: #fff;
    border: none;
    padding: 10px 30px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    font-family: 'Cairo', sans-serif;
    transition: background 0.2s, transform 0.1s;
    white-space: nowrap;
}
.print-btn:hover { background: #c75409; transform: translateY(-1px); }
.print-btn:active { transform: translateY(0); }

/* ═══ DOCUMENT WRAPPER ═══ */
.doc-wrap {
    max-width: 820px;
    margin: 72px auto 48px;
}

/* ═══ COVER ═══ */
.cover {
    background: linear-gradient(145deg, #0f3d48 0%, #14505E 40%, #1A6B7C 100%);
    color: #fff;
    padding: 44px 44px 40px;
    border-radius: 0 0 16px 16px;
    position: relative;
    overflow: hidden;
}
.cover::before {
    content: '';
    position: absolute;
    top: -60px; left: -60px;
    width: 220px; height: 220px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    pointer-events: none;
}
.cover::after {
    content: '';
    position: absolute;
    bottom: -80px; right: -40px;
    width: 280px; height: 280px;
    border-radius: 50%;
    background: rgba(232,98,10,0.08);
    pointer-events: none;
}
.cover-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    padding-bottom: 18px;
    border-bottom: 1px solid rgba(255,255,255,0.15);
}
.cover-brand { font-size: 22px; font-weight: 900; color: #fff; }
.cover-badge {
    background: #E8620A;
    color: #fff;
    padding: 5px 18px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
}
.cover-center { text-align: center; margin-bottom: 32px; }
.cover-org-type { font-size: 12px; color: #9ecfda; margin-bottom: 8px; }
.cover-org-name { font-size: 30px; font-weight: 900; color: #fff; margin-bottom: 8px; line-height: 1.3; }
.cover-subtitle { font-size: 14px; color: #b2d8df; margin-bottom: 20px; }
.cover-divider { width: 60px; height: 4px; background: #E8620A; margin: 0 auto; border-radius: 2px; }

.cover-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-top: 28px;
}
.cover-card {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    padding: 14px 12px;
    text-align: center;
    backdrop-filter: blur(4px);
}
.cover-card-lbl { font-size: 10px; color: #9ecfda; margin-bottom: 6px; letter-spacing: 0.3px; }
.cover-card-val { font-size: 13px; font-weight: 700; color: #fff; }

.cover-footer {
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.12);
    text-align: center;
    font-size: 11px;
    color: #7fbdca;
}

/* ═══ SECTIONS ═══ */
.section {
    background: #fff;
    margin-top: 16px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}
.section-header {
    background: #1A6B7C;
    color: #fff;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
}
.section-num {
    width: 34px; height: 34px;
    background: rgba(255,255,255,0.18);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 800;
    flex-shrink: 0;
}
.section-title { font-size: 16px; font-weight: 800; }
.section-body { padding: 24px 28px; }

/* ═══ TOC ═══ */
.toc-wrap {
    background: #fff;
    margin-top: 16px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}
.toc-head {
    background: #14505E;
    color: #fff;
    padding: 14px 24px;
    font-size: 16px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 10px;
}
.toc-head::before { content: '📋'; font-size: 18px; }
.toc-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 20px 24px;
}
.toc-item {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background 0.15s;
}
.toc-item:hover { background: #f0fdf4; }
.toc-num-badge {
    background: #1A6B7C;
    color: #fff;
    border-radius: 50%;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800;
    flex-shrink: 0;
}
.toc-unit-name { font-size: 12px; font-weight: 700; color: #374151; }

/* ═══ FIELD BLOCKS ═══ */
.field-block {
    margin-bottom: 12px;
    background: #f8fafc;
    padding: 12px 14px 12px 12px;
    border-right: 4px solid #1A6B7C;
    border-radius: 0 6px 6px 0;
    page-break-inside: avoid;
}
.field-label {
    font-size: 10px;
    font-weight: 800;
    color: #1A6B7C;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}
.field-value {
    font-size: 13px;
    color: #374151;
    line-height: 1.75;
}
.field-value ul { padding-right: 18px; margin: 0; }
.field-value li { margin-bottom: 4px; }

/* ═══ TABLES ═══ */
.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-top: 6px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #d1d5db;
}
.data-table th {
    background: #1A6B7C;
    color: #fff;
    padding: 9px 12px;
    font-weight: 700;
    text-align: right;
    border-left: 1px solid rgba(255,255,255,0.2);
    font-size: 11px;
}
.data-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #e5e7eb;
    border-left: 1px solid #f3f4f6;
    color: #374151;
    text-align: right;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background: #f9fafb; }
.data-table tr:hover td { background: #f0f9ff; }

.nested-table { width: 100%; border-collapse: collapse; }
.nested-key {
    font-weight: 700;
    color: #6b7280;
    font-size: 11px;
    padding-left: 14px;
    width: 150px;
    vertical-align: top;
    padding-top: 3px;
    white-space: nowrap;
}
.nested-val { font-size: 12px; color: #374151; }

.empty-val { color: #9ca3af; font-style: italic; }

/* ═══ CLOSING ═══ */
.closing {
    background: linear-gradient(145deg, #0f3d48 0%, #14505E 60%, #1A6B7C 100%);
    color: #fff;
    padding: 56px 44px;
    text-align: center;
    border-radius: 12px;
    margin-top: 16px;
    box-shadow: 0 4px 20px rgba(20,80,94,0.3);
}
.closing-icon { font-size: 52px; margin-bottom: 16px; }
.closing-title { font-size: 22px; font-weight: 900; margin-bottom: 12px; }
.closing-text { font-size: 13px; color: #b2d8df; margin-bottom: 32px; line-height: 1.9; max-width: 480px; margin-left: auto; margin-right: auto; }
.stamp {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    padding: 18px 40px;
    display: inline-block;
    backdrop-filter: blur(4px);
}
.stamp-lbl { font-size: 10px; color: #9ecfda; margin-bottom: 4px; }
.stamp-val { font-size: 17px; font-weight: 800; margin-bottom: 12px; }
.stamp-date { font-size: 12px; color: #b2d8df; }

/* ═══ PRINT ═══ */
@media print {
    .print-bar { display: none !important; }

    body {
        background: white !important;
        font-size: 11px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
    }

    .doc-wrap {
        max-width: none;
        margin: 0;
    }

    .cover {
        background: #14505E !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        border-radius: 0 !important;
        page-break-after: always;
    }

    .toc-wrap {
        page-break-after: always;
        box-shadow: none;
        margin-top: 0;
        border-radius: 0;
    }

    .section {
        page-break-before: always;
        box-shadow: none;
        margin-top: 0;
        border-radius: 0;
    }

    .section-header {
        background: #1A6B7C !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .toc-head {
        background: #14505E !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .data-table th {
        background: #1A6B7C !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .field-block {
        page-break-inside: avoid;
        background: #f8fafc !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .closing {
        background: #14505E !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        page-break-before: always;
        border-radius: 0;
        margin-top: 0;
        box-shadow: none;
    }

    .closing img, .cover img {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    @page {
        size: A4 portrait;
        margin: 14mm 16mm;
    }
}
</style>
</head>
<body>

{{-- ══════ PRINT BAR ══════ --}}
<div class="print-bar">
    <img src="/logo-white.png" alt="منصة دفة" style="height:34px; max-width:110px; object-fit:contain;" />
    <span class="print-bar-title">الخطة الاستراتيجية — {{ $workflow->user->org_name ?? 'المنظمة' }}</span>
    <button class="print-btn" onclick="window.print()">🖨&nbsp; طباعة / تحميل PDF</button>
</div>

<div class="doc-wrap">

{{-- ══════ COVER ══════ --}}
<div class="cover">
    <div class="cover-topbar">
        <img src="/logo-white.png" alt="منصة دفة" style="height:46px; max-width:150px; object-fit:contain;" />
        <span class="cover-badge">وثيقة رسمية معتمدة</span>
    </div>

    <div class="cover-center">
        @if($workflow->user->org_type)
            <div class="cover-org-type">{{ $workflow->user->org_type }}</div>
        @endif
        <div class="cover-org-name">{{ $workflow->user->org_name ?? 'المنظمة' }}</div>
        <div class="cover-subtitle">الخطة الاستراتيجية المعتمدة</div>
        <div class="cover-divider"></div>
    </div>

    <div class="cover-cards">
        @if($workflow->user->rep_name)
        <div class="cover-card">
            <div class="cover-card-lbl">ممثل المنظمة</div>
            <div class="cover-card-val">{{ $workflow->user->rep_name }}</div>
        </div>
        @endif
        <div class="cover-card">
            <div class="cover-card-lbl">المستشار المشرف</div>
            <div class="cover-card-val">{{ $workflow->consultant->name ?? '—' }}</div>
        </div>
        <div class="cover-card">
            <div class="cover-card-lbl">تاريخ الاعتماد</div>
            <div class="cover-card-val">{{ ($workflow->completed_at ?? now())->format('Y/m/d') }}</div>
        </div>
        <div class="cover-card">
            <div class="cover-card-lbl">الوحدات المعتمدة</div>
            <div class="cover-card-val">{{ $submissions->count() }} وحدة</div>
        </div>
    </div>

    <div class="cover-footer">
        منصة دفة للتخطيط الاستراتيجي &nbsp;•&nbsp; {{ now()->year }}
    </div>
</div>

{{-- ══════ TOC ══════ --}}
<div class="toc-wrap">
    <div class="toc-head">فهرس المحتوى</div>
    <div class="toc-grid">
        @foreach($submissions as $sub)
        <div class="toc-item">
            <div class="toc-num-badge">{{ $sub->unit_number }}</div>
            <div class="toc-unit-name">{{ $sub->unit->name ?? ('الوحدة ' . $sub->unit_number) }}</div>
        </div>
        @endforeach
    </div>
</div>

{{-- ══════ UNITS ══════ --}}
@foreach($submissions as $submission)
<div class="section">
    <div class="section-header">
        <div class="section-num">{{ $submission->unit_number }}</div>
        <div class="section-title">{{ $submission->unit->name ?? ('الوحدة ' . $submission->unit_number) }}</div>
    </div>
    <div class="section-body">
        {!! \App\Helpers\PdfRenderer::renderFormData($submission->form_data) !!}
    </div>
</div>
@endforeach

{{-- ══════ CLOSING ══════ --}}
<div class="closing">
    <div style="margin-bottom:20px;">
        <img src="/logo-white.png" alt="منصة دفة" style="height:60px; max-width:180px; object-fit:contain;" />
    </div>
    <div class="closing-title">تم اعتماد الخطة الاستراتيجية</div>
    <p class="closing-text">
        تم إعداد هذه الوثيقة بمنهجية علمية متكاملة بإشراف مستشار متخصص<br>عبر منصة دفة للتخطيط الاستراتيجي
    </p>
    <div class="stamp">
        <div class="stamp-lbl">معتمد من قبل المستشار</div>
        <div class="stamp-val">{{ $workflow->consultant->name ?? '—' }}</div>
        <div class="stamp-lbl">تاريخ الاعتماد</div>
        <div class="stamp-date">{{ ($workflow->completed_at ?? now())->format('Y/m/d') }}</div>
    </div>
</div>

</div>{{-- /doc-wrap --}}
</body>
</html>
