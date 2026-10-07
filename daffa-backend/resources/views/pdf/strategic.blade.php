<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'dejavusans', 'DejaVu Sans', sans-serif;
    direction: rtl;
    color: #1f2937;
    font-size: 12px;
    line-height: 1.7;
}

@page {
    size: A4 portrait;
    margin: 10mm 12mm;
}

/* ══ غلاف ══ */
.cover {
    background-color: #14505E;
    color: #ffffff;
    padding: 26px 28px 28px;
    border-radius: 0 0 10px 10px;
}

.cover-title-text {
    font-size: 22px;
    font-weight: bold;
    color: #ffffff;
    text-align: center;
    margin-bottom: 4px;
}

.cover-sub-text {
    font-size: 12px;
    color: #b2d8df;
    text-align: center;
    margin-bottom: 14px;
}

.cover-org-type-text {
    font-size: 11px;
    color: #b2d8df;
    text-align: center;
    margin-bottom: 6px;
}

.cover-line-div {
    width: 50px;
    height: 3px;
    background-color: #E8620A;
    margin: 0 auto 18px;
}

.cover-badge-span {
    background-color: #E8620A;
    color: #ffffff;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: bold;
}

.cover-card-div {
    border: 1px solid #3a7a8a;
    border-radius: 6px;
    padding: 9px 14px;
    text-align: center;
    background-color: #1a6070;
}

.cover-card-lbl { font-size: 9px; color: #9ecfda; margin-bottom: 3px; }
.cover-card-val { font-size: 11px; font-weight: bold; color: #ffffff; }

.cover-footer-div {
    text-align: center;
    margin-top: 26px;
    padding-top: 12px;
    border-top: 1px solid #3a7a8a;
    font-size: 10px;
    color: #7fbdca;
}

/* ══ فهرس ══ */
.toc-header-div {
    background-color: #1A6B7C;
    color: #ffffff;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 12px;
}

.toc-item-td {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    padding: 7px 10px;
    vertical-align: middle;
    width: 50%;
}

.toc-num-span {
    background-color: #1A6B7C;
    color: #ffffff;
    border-radius: 50%;
    display: inline-block;
    width: 22px;
    height: 22px;
    text-align: center;
    line-height: 22px;
    font-size: 10px;
    font-weight: bold;
    margin-left: 8px;
    vertical-align: middle;
}

.toc-name-span {
    font-size: 11px;
    font-weight: bold;
    color: #374151;
    vertical-align: middle;
}

/* ══ وحدات ══ */
.unit-num-span {
    background-color: #1A6B7C;
    color: #ffffff;
    border-radius: 50%;
    display: inline-block;
    width: 30px;
    height: 30px;
    text-align: center;
    line-height: 30px;
    font-size: 12px;
    font-weight: bold;
    vertical-align: middle;
}

.unit-title-span {
    font-size: 14px;
    font-weight: bold;
    color: #14505E;
    vertical-align: middle;
    padding-right: 10px;
}

/* ══ حقول ══ */
.field-block {
    margin-bottom: 8px;
    background-color: #f9fafb;
    padding: 8px 10px 8px 8px;
    border-right: 3px solid #1A6B7C;
    page-break-inside: avoid;
}

.field-label {
    font-size: 9px;
    font-weight: bold;
    color: #1A6B7C;
    margin-bottom: 4px;
}

.field-value {
    font-size: 11px;
    color: #374151;
    line-height: 1.65;
}

.field-value ul { padding-right: 16px; margin: 0; }
.field-value li { margin-bottom: 3px; }

/* ══ جداول ══ */
.data-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 10px;
    margin-top: 4px;
    border: 1px solid #d1d5db;
}

.data-table th {
    background-color: #1A6B7C;
    color: #ffffff;
    padding: 5px 8px;
    font-weight: bold;
    text-align: right;
    border-left: 1px solid #15566a;
}

.data-table td {
    padding: 5px 8px;
    border-bottom: 1px solid #e5e7eb;
    border-left: 1px solid #e5e7eb;
    color: #374151;
    text-align: right;
}

.data-table tr:nth-child(even) td { background-color: #f3f4f6; }

/* ══ nested ══ */
.nested-table { width: 100%; }
.nested-key {
    font-weight: bold;
    color: #6b7280;
    font-size: 10px;
    padding-left: 10px;
    width: 130px;
    vertical-align: top;
}
.nested-val { font-size: 10px; color: #374151; }

/* ══ ختام ══ */
.closing {
    background-color: #14505E;
    color: #ffffff;
    padding: 44px 36px;
    text-align: center;
    border-radius: 10px;
    margin-top: 10px;
}

.closing-title { font-size: 17px; font-weight: bold; color: #ffffff; margin-bottom: 10px; }
.closing-text  { font-size: 12px; color: #b2d8df; margin-bottom: 24px; line-height: 1.8; }

.stamp-box {
    border: 1px solid #3a7a8a;
    border-radius: 8px;
    padding: 12px 28px;
    display: inline-block;
    background-color: #1a6070;
}

.stamp-lbl  { font-size: 9px; color: #9ecfda; margin-bottom: 3px; }
.stamp-val  { font-size: 13px; font-weight: bold; color: #ffffff; margin-bottom: 8px; }
.stamp-date { font-size: 11px; color: #b2d8df; }

.empty-val  { color: #9ca3af; font-style: italic; }
.page-break { page-break-before: always; }
.spacer     { height: 12px; }
</style>
</head>
<body>

{{-- ════ غلاف ════ --}}
<div class="cover">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px; padding-bottom:12px; border-bottom:1px solid #3a7a8a;">
        <tr>
            <td style="vertical-align:middle;">
                <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('logo.png'))) }}" alt="منصة دفة" style="height:44px; max-width:140px; background:#ffffff; border-radius:6px; padding:3px;" />
            </td>
            <td align="left" style="vertical-align:middle;">
                <span class="cover-badge-span">وثيقة رسمية معتمدة</span>
            </td>
        </tr>
    </table>

    @if($workflow->user->org_type)
        <div class="cover-org-type-text">{{ $workflow->user->org_type }}</div>
    @endif
    <div class="cover-title-text">{{ $workflow->user->org_name ?? 'المنظمة' }}</div>
    <div class="cover-sub-text">الخطة الاستراتيجية المعتمدة</div>
    <div class="cover-line-div"></div>

    <table width="100%" cellpadding="5" cellspacing="6">
        <tr>
            @if($workflow->user->rep_name)
            <td width="25%">
                <div class="cover-card-div">
                    <div class="cover-card-lbl">ممثل المنظمة</div>
                    <div class="cover-card-val">{{ $workflow->user->rep_name }}</div>
                </div>
            </td>
            @endif
            <td>
                <div class="cover-card-div">
                    <div class="cover-card-lbl">المستشار المشرف</div>
                    <div class="cover-card-val">{{ $workflow->consultant->name ?? '—' }}</div>
                </div>
            </td>
            <td>
                <div class="cover-card-div">
                    <div class="cover-card-lbl">تاريخ الاعتماد</div>
                    <div class="cover-card-val">{{ ($workflow->completed_at ?? now())->format('Y/m/d') }}</div>
                </div>
            </td>
            <td>
                <div class="cover-card-div">
                    <div class="cover-card-lbl">الوحدات المعتمدة</div>
                    <div class="cover-card-val">{{ $submissions->count() }} وحدة</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="cover-footer-div">
        منصة دفة للتخطيط الاستراتيجي &nbsp;&bull;&nbsp; {{ now()->year }}
    </div>
</div>

{{-- ════ فهرس ════ --}}
<div class="page-break"></div>
<div class="toc-header-div">فهرس المحتوى</div>
<table width="100%" cellpadding="4" cellspacing="3">
    @foreach($submissions->chunk(2) as $chunk)
    <tr>
        @foreach($chunk as $sub)
        <td class="toc-item-td">
            <span class="toc-num-span">{{ $sub->unit_number }}</span>
            <span class="toc-name-span">{{ $sub->unit->name ?? ('الوحدة ' . $sub->unit_number) }}</span>
        </td>
        @endforeach
        @if($chunk->count() === 1)
        <td width="50%">&nbsp;</td>
        @endif
    </tr>
    @endforeach
</table>

{{-- ════ وحدات ════ --}}
@foreach($submissions as $submission)
<div class="page-break"></div>

<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #1A6B7C; margin-bottom:12px; padding-bottom:8px;">
    <tr>
        <td width="36" style="vertical-align:middle;">
            <span class="unit-num-span">{{ $submission->unit_number }}</span>
        </td>
        <td style="vertical-align:middle;">
            <span class="unit-title-span">{{ $submission->unit->name ?? ('الوحدة ' . $submission->unit_number) }}</span>
        </td>
    </tr>
</table>
<div class="spacer"></div>

{!! \App\Helpers\PdfRenderer::renderFormData($submission->form_data) !!}

@endforeach

{{-- ════ ختام ════ --}}
<div class="page-break"></div>
<div class="closing">
    <div style="margin-bottom:18px;">
        <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('logo.png'))) }}" alt="منصة دفة" style="height:52px; max-width:160px; background:#ffffff; border-radius:8px; padding:4px;" />
    </div>
    <div class="closing-title">تم اعتماد الخطة الاستراتيجية</div>
    <p class="closing-text">
        تم إعداد هذه الوثيقة بمنهجية علمية متكاملة بإشراف مستشار متخصص عبر منصة دفة للتخطيط الاستراتيجي
    </p>
    <div class="stamp-box">
        <div class="stamp-lbl">معتمد من قبل المستشار</div>
        <div class="stamp-val">{{ $workflow->consultant->name ?? '—' }}</div>
        <div class="stamp-lbl">تاريخ الاعتماد</div>
        <div class="stamp-date">{{ ($workflow->completed_at ?? now())->format('Y/m/d') }}</div>
    </div>
</div>

</body>
</html>
