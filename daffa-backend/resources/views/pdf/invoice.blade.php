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
    margin: 14mm 16mm;
}

.header {
    background-color: #0E2A3D;
    color: #ffffff;
    padding: 22px 24px 18px;
    border-radius: 0 0 10px 10px;
    margin-bottom: 20px;
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}

.brand-name {
    font-size: 24px;
    font-weight: bold;
    color: #ffffff;
}

.brand-sub {
    font-size: 11px;
    color: #9fd4de;
}

.invoice-badge {
    background: #EF6A2C;
    color: #0E2A3D;
    font-size: 16px;
    font-weight: bold;
    padding: 6px 18px;
    border-radius: 8px;
}

.header-divider {
    border-top: 1px solid rgba(255,255,255,0.2);
    margin: 10px 0;
}

.header-meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #B5D2E3;
}

.section {
    margin-bottom: 16px;
}

.section-title {
    font-size: 13px;
    font-weight: bold;
    color: #0E2A3D;
    border-right: 3px solid #E05A1F;
    padding-right: 8px;
    margin-bottom: 10px;
}

.info-box {
    background: #FBF9F5;
    border: 1px solid #E8E3DA;
    border-radius: 8px;
    padding: 12px 14px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    border-bottom: 1px solid #F3EFE8;
    font-size: 11.5px;
}

.info-row:last-child { border-bottom: none; }

.info-label { color: #5E6B78; font-weight: 600; }
.info-value { color: #0E2A3D; }

.items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11.5px;
}

.items-table th {
    background: #0E2A3D;
    color: white;
    padding: 9px 10px;
    text-align: right;
    font-weight: 600;
}

.items-table td {
    padding: 9px 10px;
    border-bottom: 1px solid #E8E3DA;
}

.items-table tr:nth-child(even) td {
    background: #FBF9F5;
}

.totals-box {
    background: #FBF9F5;
    border: 1px solid #E8E3DA;
    border-radius: 8px;
    padding: 12px 16px;
    width: 50%;
    float: left;
    margin-top: 16px;
}

.totals-row {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    font-size: 12px;
    border-bottom: 1px solid #F3EFE8;
}

.totals-row:last-child {
    border-bottom: none;
    font-size: 14px;
    font-weight: bold;
    color: #0E2A3D;
    padding-top: 8px;
    margin-top: 4px;
    border-top: 2px solid #0E2A3D;
}

.totals-label { color: #5E6B78; }
.totals-value { color: #0E2A3D; font-weight: 600; }

.clearfix::after { content: ""; display: table; clear: both; }

.status-paid {
    background: #C9EFE1;
    color: #086449;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: bold;
    display: inline-block;
}

.footer {
    margin-top: 30px;
    padding-top: 14px;
    border-top: 1px solid #E8E3DA;
    text-align: center;
    font-size: 10px;
    color: #94a3b8;
}

.vat-note {
    background: #FEF3EC;
    border: 1px solid #FBC3A3;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 10.5px;
    color: #7F310E;
    margin-top: 12px;
}
</style>
</head>
<body>

{{-- Header --}}
<div class="header">
    <div class="header-top">
        <div>
            <div class="brand-name">دافة</div>
            <div class="brand-sub">منصة التخطيط الاستراتيجي والمؤسسي</div>
        </div>
        <div class="invoice-badge">فاتورة ضريبية</div>
    </div>
    <div class="header-divider"></div>
    <div class="header-meta">
        <span>رقم الفاتورة: <strong style="color:white;">{{ $order->order_number }}</strong></span>
        <span>تاريخ الإصدار: <strong style="color:white;">{{ ($order->paid_at ?? $order->created_at)->format('Y/m/d') }}</strong></span>
        <span>حالة الدفع: <strong style="color: #7FD3B5;">مدفوعة</strong></span>
    </div>
</div>

{{-- Client Info + Platform Info --}}
<div style="display:flex; gap:16px; margin-bottom:16px;">
    <div style="flex:1;" class="section">
        <div class="section-title">بيانات العميل</div>
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">اسم المنظمة</span>
                <span class="info-value">{{ $user->org_name ?: $user->rep_name }}</span>
            </div>
            @if($user->org_type)
            <div class="info-row">
                <span class="info-label">نوع المنظمة</span>
                <span class="info-value">{{ $user->org_type }}</span>
            </div>
            @endif
            @if($user->sector)
            <div class="info-row">
                <span class="info-label">القطاع</span>
                <span class="info-value">{{ $user->sector }}</span>
            </div>
            @endif
            <div class="info-row">
                <span class="info-label">المسؤول</span>
                <span class="info-value">{{ $user->rep_name }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">البريد الإلكتروني</span>
                <span class="info-value">{{ $user->email }}</span>
            </div>
            @if($user->phone)
            <div class="info-row">
                <span class="info-label">الهاتف</span>
                <span class="info-value">{{ $user->phone }}</span>
            </div>
            @endif
        </div>
    </div>
    <div style="flex:1;" class="section">
        <div class="section-title">بيانات المورد</div>
        <div class="info-box">
            @if($vatNumber)
            <div class="info-row">
                <span class="info-label">الرقم الضريبي</span>
                <span class="info-value">{{ $vatNumber }}</span>
            </div>
            @endif
            @if($companyName)
            <div class="info-row">
                <span class="info-label">اسم الشركة</span>
                <span class="info-value">{{ $companyName }}</span>
            </div>
            @endif
            @if($address)
            <div class="info-row">
                <span class="info-label">العنوان</span>
                <span class="info-value">{{ $address }}</span>
            </div>
            @endif
            @if($supportEmail)
            <div class="info-row">
                <span class="info-label">البريد الإلكتروني</span>
                <span class="info-value">{{ $supportEmail }}</span>
            </div>
            @endif
            @if($supportPhone)
            <div class="info-row">
                <span class="info-label">الهاتف</span>
                <span class="info-value">{{ $supportPhone }}</span>
            </div>
            @endif
        </div>
    </div>
</div>

{{-- Services Table --}}
<div class="section">
    <div class="section-title">تفاصيل الخدمة</div>
    <table class="items-table">
        <thead>
            <tr>
                <th>#</th>
                <th>الخدمة</th>
                <th>الوصف</th>
                <th style="text-align:left;">المبلغ (ريال)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>{{ $serviceLabel }}</td>
                <td>{{ $serviceDesc }}</td>
                <td style="text-align:left; font-weight:600;">{{ number_format($order->subtotal + ($order->discount_amount ?? 0), 2) }}</td>
            </tr>
            @if($order->discount_amount && $order->discount_amount > 0)
            <tr>
                <td></td>
                <td colspan="2" style="color:#086449;">خصم ({{ $order->discount_code }})</td>
                <td style="text-align:left; color:#086449; font-weight:600;">- {{ number_format($order->discount_amount, 2) }}</td>
            </tr>
            @endif
        </tbody>
    </table>
</div>

{{-- Totals --}}
<div class="clearfix">
    <div class="totals-box">
        <div class="totals-row">
            <span class="totals-label">المجموع قبل الضريبة</span>
            <span class="totals-value">{{ number_format($order->subtotal, 2) }} ريال</span>
        </div>
        <div class="totals-row">
            <span class="totals-label">ضريبة القيمة المضافة ({{ $taxRate }}%)</span>
            <span class="totals-value">{{ number_format($order->tax_amount, 2) }} ريال</span>
        </div>
        @if($order->discount_amount && $order->discount_amount > 0)
        <div class="totals-row">
            <span class="totals-label">الخصم</span>
            <span class="totals-value" style="color:#086449;">- {{ number_format($order->discount_amount, 2) }} ريال</span>
        </div>
        @endif
        <div class="totals-row">
            <span class="totals-label">الإجمالي المستحق</span>
            <span class="totals-value">{{ number_format($order->total, 2) }} ريال</span>
        </div>
    </div>
</div>

{{-- VAT note --}}
@if($vatNumber)
<div class="vat-note" style="margin-top: 80px;">
    هذه فاتورة ضريبية وفق متطلبات هيئة الزكاة والضريبة والجمارك — الرقم الضريبي: {{ $vatNumber }}
</div>
@endif

<div class="footer">
    <div>شكراً لثقتكم بمنصة دافة للتخطيط الاستراتيجي والمؤسسي</div>
    <div style="margin-top:4px;">هذه الفاتورة صادرة إلكترونياً ولا تحتاج إلى توقيع أو ختم</div>
</div>

</body>
</html>
