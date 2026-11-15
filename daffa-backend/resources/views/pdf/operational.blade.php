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
    color: #1B1746;
    font-size: 12px;
    line-height: 1.7;
    background: #E8E3DA;
}

@page {
    size: A4 portrait;
    margin: 10mm 12mm;
}

/* ══ تغليف للشاشة ══ */
.page-wrapper {
    max-width: 860px;
    margin: 0 auto;
    background: #ffffff;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    padding: 0 0 32px;
}

@media print {
    body { background: #ffffff; }
    .page-wrapper { max-width: 100%; box-shadow: none; padding: 0; }
    .print-btn-bar { display: none !important; }
}

/* ══ شريط طباعة ══ */
.print-btn-bar {
    background: #1B1746;
    padding: 10px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
}

.print-btn {
    background: #F5A524;
    color: #1B1746;
    border: none;
    padding: 8px 22px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    font-family: 'plexarabic', 'dejavusans', sans-serif;
    letter-spacing: 0.3px;
}

.print-btn:hover { background: #F9C152; }

.print-bar-title {
    font-size: 13px;
    font-weight: bold;
    color: #ffffff;
}

/* ══ غلاف ══ */
.cover {
    background-color: #1B1746;
    color: #ffffff;
    padding: 28px 36px 32px;
}

.cover-title-text {
    font-size: 24px;
    font-weight: bold;
    color: #ffffff;
    text-align: center;
    margin-bottom: 4px;
}

.cover-sub-text {
    font-size: 12px;
    color: #D0CCFA;
    text-align: center;
    margin-bottom: 14px;
}

.cover-org-type-text {
    font-size: 11px;
    color: #D0CCFA;
    text-align: center;
    margin-bottom: 6px;
}

.cover-line-div {
    width: 50px;
    height: 3px;
    background-color: #F5A524;
    margin: 0 auto 20px;
    border-radius: 2px;
}

.cover-badge-span {
    background-color: #F5A524;
    color: #1B1746;
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: bold;
}

.cover-card-div {
    border: 1px solid #4537B4;
    border-radius: 8px;
    padding: 10px 14px;
    text-align: center;
    background-color: #2B2470;
}

.cover-card-lbl { font-size: 9px; color: #B0A9F6; margin-bottom: 4px; }
.cover-card-val { font-size: 11px; font-weight: bold; color: #ffffff; }

.cover-footer-div {
    text-align: center;
    margin-top: 28px;
    padding-top: 14px;
    border-top: 1px solid #4537B4;
    font-size: 10px;
    color: #8D82EF;
}

/* ══ منطقة المحتوى ══ */
.content-area {
    padding: 24px 36px;
}

/* ══ فهرس ══ */
.toc-header-div {
    background-color: #5546D6;
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
    padding: 8px 12px;
    vertical-align: middle;
    width: 50%;
}

.toc-num-span {
    background-color: #5546D6;
    color: #ffffff;
    border-radius: 50%;
    display: inline-block;
    width: 24px;
    height: 24px;
    text-align: center;
    line-height: 24px;
    font-size: 10px;
    font-weight: bold;
    margin-left: 8px;
    vertical-align: middle;
}

.toc-name-span {
    font-size: 11px;
    font-weight: bold;
    color: #34314A;
    vertical-align: middle;
}

/* ══ وحدات ══ */
.unit-num-span {
    background-color: #5546D6;
    color: #ffffff;
    border-radius: 50%;
    display: inline-block;
    width: 32px;
    height: 32px;
    text-align: center;
    line-height: 32px;
    font-size: 13px;
    font-weight: bold;
    vertical-align: middle;
}

.unit-title-span {
    font-size: 15px;
    font-weight: bold;
    color: #1B1746;
    vertical-align: middle;
    padding-right: 10px;
}

/* ══ مبادرة فرعية ══ */
.initiative-label {
    background: #F3F2FE;
    border-right: 3px solid #E0920F;
    padding: 7px 14px;
    font-size: 11px;
    font-weight: bold;
    color: #5546D6;
    margin: 12px 0 6px;
    border-radius: 0 4px 4px 0;
}

/* ══ جداول ══ */
.data-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 10.5px;
    margin-top: 4px;
    border: 1px solid #D9D3C7;
    border-radius: 6px;
    overflow: hidden;
}

.data-table th {
    background-color: #5546D6;
    color: #ffffff;
    padding: 7px 10px;
    font-weight: bold;
    text-align: right;
    border-left: 1px solid #382D90;
}

.data-table td {
    padding: 6px 10px;
    border-bottom: 1px solid #E8E3DA;
    border-left: 1px solid #E8E3DA;
    color: #34314A;
    text-align: right;
    vertical-align: top;
    line-height: 1.6;
}

.data-table tr:last-child td { border-bottom: none; }
.data-table tr:nth-child(even) td { background-color: #FBF9F5; }

/* ══ صف الإجمالي ══ */
.budget-total td {
    background-color: #1B1746 !important;
    color: #ffffff !important;
    font-weight: bold;
    font-size: 11px;
}

/* ══ جدول غانت ══ */
.gantt-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5px;
    margin-top: 4px;
    border: 1px solid #D9D3C7;
}

.gantt-table th {
    background-color: #5546D6;
    color: #ffffff;
    padding: 6px 3px;
    text-align: center;
    font-weight: bold;
    font-size: 8px;
    border-left: 1px solid #382D90;
}

.gantt-table th.name-th {
    text-align: right;
    padding-right: 10px;
    min-width: 120px;
}

.gantt-table td {
    border: 1px solid #E8E3DA;
    padding: 4px 3px;
    text-align: center;
    font-size: 8px;
    height: 22px;
}

.gantt-table td.name-td {
    text-align: right;
    padding-right: 10px;
    color: #34314A;
    font-size: 9.5px;
    border-left: none;
}

.gantt-table tr:nth-child(even) td { background-color: #FBF9F5; }
.gantt-table tr:nth-child(even) td.name-td { background-color: #FBF9F5; }

/* ══ شارات الحالة ══ */
.pill-yes { display: inline-block; padding: 2px 10px; border-radius: 20px; background: #C9EFE1; color: #0B7F5D; font-size: 10px; font-weight: bold; }
.pill-no  { display: inline-block; padding: 2px 10px; border-radius: 20px; background: #F3EFE8; color: #8F8BA3; font-size: 10px; }

/* ══ ختام ══ */
.closing {
    background-color: #1B1746;
    color: #ffffff;
    padding: 48px 36px;
    text-align: center;
    margin: 0 36px 0;
    border-radius: 12px;
}

.closing-title { font-size: 18px; font-weight: bold; color: #ffffff; margin-bottom: 10px; }
.closing-text  { font-size: 12px; color: #D0CCFA; margin-bottom: 28px; line-height: 1.9; }

.stamp-box {
    border: 1px solid #4537B4;
    border-radius: 10px;
    padding: 14px 32px;
    display: inline-block;
    background-color: #2B2470;
}

.stamp-lbl  { font-size: 9px; color: #B0A9F6; margin-bottom: 3px; }
.stamp-val  { font-size: 14px; font-weight: bold; color: #ffffff; margin-bottom: 8px; }
.stamp-date { font-size: 11px; color: #D0CCFA; }

.empty-val  { color: #8F8BA3; font-style: italic; }
.empty      { padding: 16px; text-align: center; color: #8F8BA3; font-size: 11px; font-style: italic; background: #FBF9F5; border-radius: 6px; }
.page-break { page-break-before: always; }
.spacer     { height: 14px; }
.unit-sep   { height: 32px; }
</style>
</head>
<body>

@php
    $orgName    = $workflow->user->org_name   ?? 'المنظمة';
    $orgType    = $workflow->user->org_type   ?? '—';
    $consultant = $workflow->consultant->name ?? '—';
    $approvedAt = ($workflow->completed_at ?? now())->format('Y/m/d');
    $approvedAtAr = $workflow->completed_at
        ? \Carbon\Carbon::parse($workflow->completed_at)->locale('ar')->isoFormat('D MMMM YYYY')
        : now()->locale('ar')->isoFormat('D MMMM YYYY');

    $logoWhite  = public_path('logo-white.png');
    $logoNormal = public_path('logo.png');
    $logoWhiteB64  = file_exists($logoWhite)  ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoWhite))  : null;
    $logoNormalB64 = file_exists($logoNormal) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoNormal)) : null;
@endphp

<div class="page-wrapper">

{{-- ════ شريط الطباعة (شاشة فقط) ════ --}}
<div class="print-btn-bar">
    <span class="print-bar-title">الخطة التشغيلية — {{ $orgName }}</span>
    <button class="print-btn" onclick="window.print()">&#0B7F5D; طباعة / حفظ PDF</button>
</div>

{{-- ════ غلاف ════ --}}
<div class="cover">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid #4537B4;">
        <tr>
            <td style="vertical-align:middle;">
                @if($logoWhiteB64)
                    <img src="{{ $logoWhiteB64 }}" alt="منصة دفة" style="height:44px; max-width:150px;" />
                @else
                    <span style="font-size:18px; font-weight:bold; color:#fff;">دفة</span>
                @endif
            </td>
            <td align="left" style="vertical-align:middle;">
                <span class="cover-badge-span">وثيقة رسمية معتمدة</span>
            </td>
        </tr>
    </table>

    @if($orgType && $orgType !== '—')
        <div class="cover-org-type-text">{{ $orgType }}</div>
    @endif
    <div class="cover-title-text">{{ $orgName }}</div>
    <div class="cover-sub-text">الخطة التشغيلية المعتمدة</div>
    <div class="cover-line-div"></div>

    <table width="100%" cellpadding="6" cellspacing="8">
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
                    <div class="cover-card-val">{{ $consultant }}</div>
                </div>
            </td>
            <td>
                <div class="cover-card-div">
                    <div class="cover-card-lbl">تاريخ الاعتماد</div>
                    <div class="cover-card-val">{{ $approvedAt }}</div>
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
        منصة دفة للتخطيط المؤسسي &nbsp;&bull;&nbsp; {{ now()->year }}
    </div>
</div>

{{-- ════ فهرس ════ --}}
<div class="content-area">
    <div class="page-break"></div>
    <div class="toc-header-div">فهرس المحتوى</div>
    <table width="100%" cellpadding="4" cellspacing="4">
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
    @php
        $unit     = $submission->unit;
        $formData = $submission->form_data ?? [];
        $tpl      = $unit?->template_type ?? '';
        $unitName = $unit?->name ?? "الوحدة {$submission->unit_number}";
        $subtitles = [
            'op_import'      => 'قائمة المبادرات الاستراتيجية المُدرجة',
            'op_activities'  => 'الأنشطة التشغيلية الموزعة على المبادرات',
            'op_gantt'       => 'الجدول الزمني لتنفيذ الأنشطة',
            'op_responsible' => 'توزيع المسؤوليات ومؤشرات الأداء',
            'op_budget'      => 'التكاليف التفصيلية والإجمالية',
        ];
        $subtitle = $subtitles[$tpl] ?? '';
    @endphp

    <div class="page-break"></div>
    <div class="unit-sep"></div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #5546D6; margin-bottom:14px; padding-bottom:10px;">
        <tr>
            <td width="40" style="vertical-align:middle;">
                <span class="unit-num-span">{{ $submission->unit_number }}</span>
            </td>
            <td style="vertical-align:middle;">
                <span class="unit-title-span">{{ $unitName }}</span>
                @if($subtitle)
                <div style="font-size:10px; color:#67637A; padding-right:42px; margin-top:3px;">{{ $subtitle }}</div>
                @endif
            </td>
        </tr>
    </table>
    <div class="spacer"></div>

    {{-- ── op_import ── --}}
    @if($tpl === 'op_import')
        @if(!empty($formData['items']))
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:34px; text-align:center;">#</th>
                    <th>المبادرة / البرنامج</th>
                    <th style="width:100px; text-align:center;">الحالة</th>
                </tr>
            </thead>
            <tbody>
                @foreach($formData['items'] as $i => $item)
                <tr>
                    <td style="text-align:center; color:#8F8BA3;">{{ $i + 1 }}</td>
                    <td>{{ $item['name'] ?? '—' }}</td>
                    <td style="text-align:center;">
                        @if($item['checked'] ?? false)
                            <span class="pill-yes">&#10003; مُدرج</span>
                        @else
                            <span class="pill-no">غير مُدرج</span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty">لا توجد بيانات مُدخلة</div>
        @endif

    {{-- ── op_activities ── --}}
    @elseif($tpl === 'op_activities')
        @if(!empty($formData['groups']))
            @foreach($formData['groups'] as $group)
            <div class="initiative-label">&#9658; {{ $group['initiative'] ?? '' }}</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:30px; text-align:center;">#</th>
                        <th style="width:34%;">النشاط</th>
                        <th>الوصف</th>
                        <th style="width:22%;">المخرجات</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($group['activities'] ?? [] as $ai => $act)
                    <tr>
                        <td style="text-align:center; color:#8F8BA3;">{{ $ai + 1 }}</td>
                        <td style="font-weight:bold; color:#1B1746;">{{ $act['name'] ?? '—' }}</td>
                        <td>{{ $act['desc'] ?? '—' }}</td>
                        <td style="color:#5546D6;">{{ $act['output'] ?? '—' }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @if(!$loop->last)<div style="height:8px;"></div>@endif
            @endforeach
        @else
        <div class="empty">لا توجد بيانات مُدخلة</div>
        @endif

    {{-- ── op_gantt ── --}}
    @elseif($tpl === 'op_gantt')
        @if(!empty($formData['activities']))
        @php
            $monthsAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
        @endphp
        <table class="gantt-table">
            <thead>
                <tr>
                    <th class="name-th">النشاط</th>
                    @foreach($monthsAr as $m)
                    <th>{{ mb_substr($m, 0, 3) }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($formData['activities'] as $act)
                <tr>
                    <td class="name-td">{{ $act['name'] ?? '—' }}</td>
                    @foreach($act['months'] ?? array_fill(0, 12, false) as $active)
                    <td style="padding:3px; background-color:{{ $active ? '#5546D6' : 'transparent' }};">
                        @if($active)<span style="color:rgba(255,255,255,0.9); font-size:9px;">&#9632;</span>@endif
                    </td>
                    @endforeach
                </tr>
                @endforeach
            </tbody>
        </table>
        <div style="margin-top:10px; font-size:9px; color:#67637A;">
            <span style="display:inline-block; width:12px; height:12px; background:#5546D6; border-radius:2px; margin-left:4px; vertical-align:middle;"></span>
            شهر تنفيذ
            &nbsp;&nbsp;
            <span style="display:inline-block; width:12px; height:12px; background:#F3EFE8; border:1px solid #E8E3DA; border-radius:2px; margin-left:4px; vertical-align:middle;"></span>
            غير مُجدوَل
        </div>
        @else
        <div class="empty">لا توجد بيانات مُدخلة</div>
        @endif

    {{-- ── op_responsible ── --}}
    @elseif($tpl === 'op_responsible')
        @if(!empty($formData['rows']))
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:30px; text-align:center;">#</th>
                    <th style="width:28%;">النشاط</th>
                    <th style="width:16%;">المسؤول</th>
                    <th style="width:13%;">تاريخ البدء</th>
                    <th style="width:13%;">تاريخ الانتهاء</th>
                    <th>مؤشر الأداء</th>
                </tr>
            </thead>
            <tbody>
                @foreach($formData['rows'] as $ri => $row)
                <tr>
                    <td style="text-align:center; color:#8F8BA3;">{{ $ri + 1 }}</td>
                    <td style="font-weight:bold; color:#1B1746;">{{ $row['activity']    ?? '—' }}</td>
                    <td>{{ $row['responsible'] ?? '—' }}</td>
                    <td style="text-align:center; color:#5546D6;">{{ $row['startDate'] ?? '—' }}</td>
                    <td style="text-align:center; color:#E0920F;">{{ $row['endDate']   ?? '—' }}</td>
                    <td style="color:#67637A;">{{ $row['kpi']         ?? '—' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty">لا توجد بيانات مُدخلة</div>
        @endif

    {{-- ── op_budget ── --}}
    @elseif($tpl === 'op_budget')
        @if(!empty($formData['rows']))
        @php
            $grandTotal = collect($formData['rows'])->sum('total');
            $grandCount = collect($formData['rows'])->sum('count');
        @endphp
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:30px; text-align:center;">#</th>
                    <th>البند / الخدمة</th>
                    <th style="width:18%; text-align:center;">التكلفة الوحدوية</th>
                    <th style="width:10%; text-align:center;">العدد</th>
                    <th style="width:18%; text-align:center;">الإجمالي</th>
                </tr>
            </thead>
            <tbody>
                @foreach($formData['rows'] as $bi => $row)
                <tr>
                    <td style="text-align:center; color:#8F8BA3;">{{ $bi + 1 }}</td>
                    <td style="font-weight:bold;">{{ $row['item'] ?? '—' }}</td>
                    <td style="text-align:center;">{{ number_format((float)($row['unitCost'] ?? 0)) }} ريال</td>
                    <td style="text-align:center; color:#5546D6; font-weight:bold;">{{ $row['count'] ?? '—' }}</td>
                    <td style="text-align:center; font-weight:bold; color:#1B1746;">{{ number_format((float)($row['total'] ?? 0)) }} ريال</td>
                </tr>
                @endforeach
                <tr class="budget-total">
                    <td colspan="2" style="text-align:right; padding-right:14px;">الإجمالي الكلي للميزانية</td>
                    <td></td>
                    <td style="text-align:center;">{{ $grandCount }}</td>
                    <td style="text-align:center;">{{ number_format($grandTotal) }} ريال</td>
                </tr>
            </tbody>
        </table>

        <div style="margin-top:14px; background:#F3F2FE; border-right:4px solid #5546D6; border-radius:0 6px 6px 0; padding:12px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="font-size:12px; color:#5546D6; font-weight:bold;">إجمالي الميزانية التشغيلية</td>
                    <td align="left" style="font-size:18px; font-weight:bold; color:#1B1746;">{{ number_format($grandTotal) }} ريال</td>
                </tr>
            </table>
        </div>
        @else
        <div class="empty">لا توجد بيانات مُدخلة</div>
        @endif

    @else
    <div class="empty">لا توجد بيانات لهذه الوحدة</div>
    @endif

    @endforeach

</div>{{-- end content-area --}}

{{-- ════ ختام ════ --}}
<div class="page-break"></div>
<div style="padding: 0 0 36px;">
    <div class="closing">
        <div style="margin-bottom:20px;">
            @if($logoWhiteB64)
                <img src="{{ $logoWhiteB64 }}" alt="منصة دفة" style="height:52px; max-width:160px;" />
            @else
                <span style="font-size:20px; font-weight:bold; color:#fff;">دفة</span>
            @endif
        </div>
        <div class="closing-title">تم اعتماد الخطة التشغيلية</div>
        <p class="closing-text">
            اعتُمدت هذه الخطة التشغيلية رسمياً بإشراف مستشار متخصص عبر منصة دفة للتخطيط المؤسسي
        </p>
        <div class="stamp-box">
            <div class="stamp-lbl">معتمد من قبل المستشار</div>
            <div class="stamp-val">{{ $consultant }}</div>
            <div class="stamp-lbl">تاريخ الاعتماد</div>
            <div class="stamp-date">{{ $approvedAt }}</div>
        </div>
    </div>
</div>

</div>{{-- end page-wrapper --}}

</body>
</html>
