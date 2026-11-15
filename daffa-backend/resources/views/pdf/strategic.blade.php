<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'plexarabic', 'dejavusans', sans-serif;
    direction: rtl;
    color: #0E2A3D;
    font-size: 12px;
    line-height: 1.7;
}

@page {
    size: A4 portrait;
    margin: 10mm 12mm;
}

/* ══ غلاف ══ */
.cover {
    background-color: #0E2A3D;
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
    color: #B5D2E3;
    text-align: center;
    margin-bottom: 14px;
}

.cover-org-type-text {
    font-size: 11px;
    color: #B5D2E3;
    text-align: center;
    margin-bottom: 6px;
}

.cover-line-div {
    width: 50px;
    height: 3px;
    background-color: #EF6A2C;
    margin: 0 auto 18px;
}

.cover-badge-span {
    background-color: #EF6A2C;
    color: #0E2A3D;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: bold;
}

.cover-card-div {
    border: 1px solid #1C4D6A;
    border-radius: 6px;
    padding: 9px 14px;
    text-align: center;
    background-color: #123247;
}

.cover-card-lbl { font-size: 9px; color: #86B5D0; margin-bottom: 3px; }
.cover-card-val { font-size: 11px; font-weight: bold; color: #ffffff; }

.cover-footer-div {
    text-align: center;
    margin-top: 26px;
    padding-top: 12px;
    border-top: 1px solid #1C4D6A;
    font-size: 10px;
    color: #5592B6;
}

/* ══ فهرس ══ */
.toc-header-div {
    background-color: #235D7F;
    color: #ffffff;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 12px;
}

.toc-item-td {
    background-color: #FBF9F5;
    border: 1px solid #E8E3DA;
    padding: 7px 10px;
    vertical-align: middle;
    width: 50%;
}

.toc-num-span {
    background-color: #235D7F;
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
    color: #334452;
    vertical-align: middle;
}

/* ══ وحدات ══ */
.unit-num-span {
    background-color: #235D7F;
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
    color: #0E2A3D;
    vertical-align: middle;
    padding-right: 10px;
}

/* ══ حقول ══ */
.field-block {
    margin-bottom: 8px;
    background-color: #FBF9F5;
    padding: 8px 10px 8px 8px;
    border-right: 3px solid #235D7F;
    page-break-inside: avoid;
}

.field-label {
    font-size: 9px;
    font-weight: bold;
    color: #235D7F;
    margin-bottom: 4px;
}

.field-value {
    font-size: 11px;
    color: #334452;
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
    border: 1px solid #D9D3C7;
}

.data-table th {
    background-color: #235D7F;
    color: #ffffff;
    padding: 5px 8px;
    font-weight: bold;
    text-align: right;
    border-left: 1px solid #173F57;
}

.data-table td {
    padding: 5px 8px;
    border-bottom: 1px solid #E8E3DA;
    border-left: 1px solid #E8E3DA;
    color: #334452;
    text-align: right;
}

.data-table tr:nth-child(even) td { background-color: #F3EFE8; }

/* ══ nested ══ */
.nested-table { width: 100%; }
.nested-key {
    font-weight: bold;
    color: #5E6B78;
    font-size: 10px;
    padding-left: 10px;
    width: 130px;
    vertical-align: top;
}
.nested-val { font-size: 10px; color: #334452; }

/* ══ ختام ══ */
.closing {
    background-color: #0E2A3D;
    color: #ffffff;
    padding: 44px 36px;
    text-align: center;
    border-radius: 10px;
    margin-top: 10px;
}

.closing-title { font-size: 17px; font-weight: bold; color: #ffffff; margin-bottom: 10px; }
.closing-text  { font-size: 12px; color: #B5D2E3; margin-bottom: 24px; line-height: 1.8; }

.stamp-box {
    border: 1px solid #1C4D6A;
    border-radius: 8px;
    padding: 12px 28px;
    display: inline-block;
    background-color: #123247;
}

.stamp-lbl  { font-size: 9px; color: #86B5D0; margin-bottom: 3px; }
.stamp-val  { font-size: 13px; font-weight: bold; color: #ffffff; margin-bottom: 8px; }
.stamp-date { font-size: 11px; color: #B5D2E3; }

.empty-val  { color: #8C97A3; font-style: italic; }
.page-break { page-break-before: always; }
.spacer     { height: 12px; }
</style>
</head>
<body>

{{-- ════ غلاف ════ --}}
<div class="cover">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px; padding-bottom:12px; border-bottom:1px solid #1C4D6A;">
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

<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #235D7F; margin-bottom:12px; padding-bottom:8px;">
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
