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
    background: #e8edf2;
}

@page { size: A4 portrait; margin: 10mm 12mm; }

/* ══ تغليف ══ */
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

/* ══ شريط الطباعة ══ */
.print-btn-bar {
    background: #14505E;
    padding: 10px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
}
.print-btn {
    background: #E8620A;
    color: #ffffff;
    border: none;
    padding: 8px 22px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    font-family: 'dejavusans', sans-serif;
}
.print-btn:hover { background: #d45508; }
.print-bar-title { font-size: 13px; font-weight: bold; color: #ffffff; }

/* ══ غلاف ══ */
.cover {
    background-color: #14505E;
    color: #ffffff;
    padding: 28px 36px 32px;
}
.cover-title-text    { font-size: 24px; font-weight: bold; color: #ffffff; text-align: center; margin-bottom: 4px; }
.cover-sub-text      { font-size: 12px; color: #b2d8df; text-align: center; margin-bottom: 14px; }
.cover-org-type-text { font-size: 11px; color: #b2d8df; text-align: center; margin-bottom: 6px; }
.cover-line-div      { width: 50px; height: 3px; background-color: #E8620A; margin: 0 auto 20px; border-radius: 2px; }
.cover-badge-span    { background-color: #E8620A; color: #ffffff; padding: 4px 14px; border-radius: 20px; font-size: 10px; font-weight: bold; }

/* بطاقة السياسة المميزة */
.policy-card {
    background: linear-gradient(135deg, #1a6070 0%, #0f4a58 100%);
    border: 1px solid #3a7a8a;
    border-radius: 8px;
    padding: 10px 20px;
    text-align: center;
    margin: 0 auto 14px;
    max-width: 400px;
}
.policy-card-icon { font-size: 22px; margin-bottom: 4px; }
.policy-card-name { font-size: 14px; font-weight: bold; color: #ffffff; margin-bottom: 4px; }
.policy-card-desc { font-size: 10px; color: #9ecfda; line-height: 1.6; }
.policy-card-divider { width: 32px; height: 2px; background: #E8620A; margin: 6px auto 5px; border-radius: 2px; }

.cover-card-div { border: 1px solid #3a7a8a; border-radius: 8px; padding: 10px 14px; text-align: center; background-color: #1a6070; }
.cover-card-lbl { font-size: 9px; color: #9ecfda; margin-bottom: 4px; }
.cover-card-val { font-size: 11px; font-weight: bold; color: #ffffff; }

.cover-footer-div {
    text-align: center; margin-top: 28px; padding-top: 14px;
    border-top: 1px solid #3a7a8a; font-size: 10px; color: #7fbdca;
}

/* ══ منطقة المحتوى ══ */
.content-area { padding: 24px 36px; }

/* ══ رأس القسم ══ */
.section-header-row {
    border-bottom: 2px solid #1A6B7C;
    margin-bottom: 14px;
    padding-bottom: 10px;
    margin-top: 4px;
}
.section-num-circle {
    background-color: #1A6B7C;
    color: #ffffff;
    border-radius: 50%;
    display: inline-block;
    width: 32px; height: 32px;
    text-align: center; line-height: 32px;
    font-size: 13px; font-weight: bold;
    vertical-align: middle;
}
.section-title-span {
    font-size: 15px;
    font-weight: bold;
    color: #14505E;
    vertical-align: middle;
    padding-right: 10px;
}
.section-subtitle { font-size: 10px; color: #6b7280; padding-right: 42px; margin-top: 3px; }

/* ══ حقول الإجابات ══ */
.field-block {
    margin-bottom: 10px;
    background-color: #f9fafb;
    padding: 10px 12px 10px 10px;
    border-right: 3px solid #1A6B7C;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
}
.field-label {
    font-size: 9px;
    font-weight: bold;
    color: #1A6B7C;
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}
.field-value { font-size: 11px; color: #374151; line-height: 1.7; }
.field-value ul { padding-right: 18px; margin: 0; }
.field-value li { margin-bottom: 4px; }

/* حقل مميز للقسم الأول */
.field-block-accent {
    border-right-color: #E8620A;
}

/* ══ بطاقة المعلومات الأساسية ══ */
.info-grid { margin-bottom: 14px; }
.info-grid-row { display: flex; gap: 0; margin-bottom: 6px; }

/* ══ ملاحظات المستشار ══ */
.consultant-note-box {
    background: #f0f9fb;
    border: 1px solid #bde3ec;
    border-right: 4px solid #1A6B7C;
    border-radius: 0 8px 8px 0;
    padding: 14px 16px;
    margin-top: 6px;
}
.consultant-note-lbl { font-size: 10px; font-weight: bold; color: #1A6B7C; margin-bottom: 6px; }
.consultant-note-val { font-size: 11px; color: #374151; line-height: 1.8; }

/* ══ فهرس الأقسام ══ */
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
    padding: 8px 12px;
    vertical-align: middle;
    width: 50%;
}
.toc-num-span {
    background-color: #1A6B7C;
    color: #ffffff;
    border-radius: 50%;
    display: inline-block;
    width: 24px; height: 24px;
    text-align: center; line-height: 24px;
    font-size: 10px; font-weight: bold;
    margin-left: 8px; vertical-align: middle;
}
.toc-name-span { font-size: 11px; font-weight: bold; color: #374151; vertical-align: middle; }

/* ══ ختام ══ */
.closing {
    background-color: #14505E;
    color: #ffffff;
    padding: 48px 36px;
    text-align: center;
    margin: 0 36px 0;
    border-radius: 12px;
}
.closing-title { font-size: 18px; font-weight: bold; color: #ffffff; margin-bottom: 10px; }
.closing-text  { font-size: 12px; color: #b2d8df; margin-bottom: 28px; line-height: 1.9; }
.stamp-box {
    border: 1px solid #3a7a8a;
    border-radius: 10px;
    padding: 14px 32px;
    display: inline-block;
    background-color: #1a6070;
}
.stamp-lbl  { font-size: 9px; color: #9ecfda; margin-bottom: 3px; }
.stamp-val  { font-size: 14px; font-weight: bold; color: #ffffff; margin-bottom: 8px; }
.stamp-date { font-size: 11px; color: #b2d8df; }

.empty-val   { color: #9ca3af; font-style: italic; }
.page-break  { page-break-before: always; }
.spacer      { height: 14px; }
.section-sep { height: 32px; }
</style>
</head>
<body>

@php
    $orgName    = $workflow->user->org_name   ?? 'المنظمة';
    $orgType    = $workflow->user->org_type   ?? '';
    $consultant = $workflow->consultant->name ?? '—';
    $approvedAt = ($selection->reviewed_at ?? $workflow->completed_at ?? now())->format('Y/m/d');
    $sections   = $policyType['sections'] ?? [];
    $formData   = $selection->form_data ?? [];

    $logoWhite  = public_path('logo-white.png');
    $logoNormal = public_path('logo.png');
    $logoWhiteB64  = file_exists($logoWhite)  ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoWhite))  : null;
    $logoNormalB64 = file_exists($logoNormal) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoNormal)) : null;

    $fieldLabels = [
        'org_name'   => 'الاسم الرسمي للمنظمة',
        'org_type'   => 'نوع المنظمة',
        'employees'  => 'عدد الموظفين',
        'main_tasks' => 'المهام الرئيسية',
        'policies'   => 'السياسات والإجراءات المطلوبة',
        'procedure'  => 'آلية العمل',
        'has_policy' => 'هل توجد سياسة مكتوبة حالياً؟',
        'notes'      => 'ملاحظات وإضافات خاصة',
    ];

    // تجميع الإجابات حسب رقم القسم
    $grouped = [];
    foreach ($formData as $key => $value) {
        if (preg_match('/^s(\d+)_(.+)$/', $key, $m)) {
            $grouped[(int)$m[1]][$m[2]] = $value;
        }
    }
    ksort($grouped);
@endphp

<div class="page-wrapper">

{{-- ════ شريط الطباعة ════ --}}
<div class="print-btn-bar">
    <span class="print-bar-title">{{ $policyType['name'] ?? 'السياسة' }} — {{ $orgName }}</span>
    <button class="print-btn" onclick="window.print()">&#128438; طباعة / حفظ PDF</button>
</div>

{{-- ════ غلاف ════ --}}
<div class="cover">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid #3a7a8a;">
        <tr>
            <td style="vertical-align:middle;">
                @if($logoWhiteB64)
                    <img src="{{ $logoWhiteB64 }}" alt="منصة دفة" style="height:44px; max-width:150px;" />
                @else
                    <span style="font-size:18px; font-weight:bold; color:#fff;">دفة</span>
                @endif
            </td>
            <td align="left" style="vertical-align:middle;">
                <span class="cover-badge-span">سياسة رسمية معتمدة</span>
            </td>
        </tr>
    </table>

    @if($orgType)
        <div class="cover-org-type-text">{{ $orgType }}</div>
    @endif
    <div class="cover-title-text">{{ $orgName }}</div>
    <div class="cover-sub-text">السياسات واللوائح الداخلية المعتمدة</div>
    <div class="cover-line-div"></div>

    {{-- بطاقة السياسة --}}
    <div class="policy-card">
        <div class="policy-card-icon">{{ $policyType['icon'] ?? '📜' }}</div>
        <div class="policy-card-name">{{ $policyType['name'] ?? 'السياسة' }}</div>
        <div class="policy-card-divider"></div>
        <div class="policy-card-desc">{{ $policyType['description'] ?? '' }}</div>
    </div>

    <table width="100%" cellpadding="6" cellspacing="8">
        <tr>
            @if(!empty($workflow->user->rep_name))
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
                    <div class="cover-card-lbl">عدد الأقسام</div>
                    <div class="cover-card-val">{{ count($sections) }} قسم</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="cover-footer-div">
        منصة دفة للتخطيط المؤسسي &nbsp;&bull;&nbsp; {{ now()->year }}
    </div>
</div>

{{-- ════ المحتوى ════ --}}
<div class="content-area">

    {{-- فهرس الأقسام --}}
    <div class="page-break"></div>
    <div class="toc-header-div">فهرس أقسام السياسة</div>
    <table width="100%" cellpadding="4" cellspacing="4">
        @foreach(collect($sections)->chunk(2) as $chunk)
        <tr>
            @foreach($chunk as $idx => $sName)
            <td class="toc-item-td">
                <span class="toc-num-span">{{ $idx + 1 }}</span>
                <span class="toc-name-span">{{ $sName }}</span>
            </td>
            @endforeach
            @if($chunk->count() === 1)
            <td width="50%">&nbsp;</td>
            @endif
        </tr>
        @endforeach
    </table>

    {{-- أقسام الإجابات --}}
    @foreach($grouped as $sIdx => $fields)
    <div class="page-break"></div>
    <div class="section-sep"></div>

    <div class="section-header-row">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td width="40" style="vertical-align:middle;">
                    <span class="section-num-circle">{{ $sIdx + 1 }}</span>
                </td>
                <td style="vertical-align:middle;">
                    <span class="section-title-span">{{ $sections[$sIdx] ?? ('القسم ' . ($sIdx + 1)) }}</span>
                    @if($sIdx === 0)
                    <div class="section-subtitle">المعلومات الأساسية عن المنظمة</div>
                    @elseif($sIdx === 1)
                    <div class="section-subtitle">المتطلبات والممارسات الحالية للقسم</div>
                    @else
                    <div class="section-subtitle">آلية العمل والإجراءات الداخلية</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>
    <div class="spacer"></div>

    @foreach($fields as $field => $value)
    @php
        $isAccent = in_array($field, ['org_name','main_tasks','procedure']);
    @endphp
    <div class="field-block {{ $isAccent ? 'field-block-accent' : '' }}">
        <div class="field-label">{{ $fieldLabels[$field] ?? $field }}</div>
        <div class="field-value">
            @if(is_array($value))
                @if(count($value) > 0)
                <ul>
                    @foreach($value as $item)
                    <li>{{ $item }}</li>
                    @endforeach
                </ul>
                @else
                <span class="empty-val">لم يُحدَّد</span>
                @endif
            @elseif($value !== null && $value !== '')
                {{ $value }}
            @else
                <span class="empty-val">لم يُدخَل</span>
            @endif
        </div>
    </div>
    @endforeach

    @endforeach

    {{-- ملاحظات المستشار --}}
    @if($selection->consultant_notes)
    <div class="page-break"></div>
    <div class="section-sep"></div>
    <div class="section-header-row">
        <table width="100%"><tr>
            <td width="40" style="vertical-align:middle;">
                <span class="section-num-circle" style="background:#E8620A;">&#128172;</span>
            </td>
            <td style="vertical-align:middle;">
                <span class="section-title-span">ملاحظات المستشار</span>
            </td>
        </tr></table>
    </div>
    <div class="spacer"></div>
    <div class="consultant-note-box">
        <div class="consultant-note-lbl">المستشار: {{ $consultant }}</div>
        <div class="consultant-note-val">{{ $selection->consultant_notes }}</div>
    </div>
    @endif

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
        <div class="closing-title">{{ $policyType['icon'] ?? '📜' }} تم اعتماد {{ $policyType['name'] ?? 'السياسة' }}</div>
        <p class="closing-text">
            اعتُمدت هذه السياسة رسمياً بناءً على استبيان ذكي موجّه<br>
            بإشراف مستشار متخصص عبر منصة دفة للتخطيط المؤسسي
        </p>
        <div class="stamp-box">
            <div class="stamp-lbl">المنظمة</div>
            <div class="stamp-val">{{ $orgName }}</div>
            <div class="stamp-lbl">معتمد من المستشار</div>
            <div class="stamp-val">{{ $consultant }}</div>
            <div class="stamp-date">{{ $approvedAt }}</div>
        </div>
    </div>
</div>

</div>{{-- end page-wrapper --}}
</body>
</html>
