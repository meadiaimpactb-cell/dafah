<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>فاتورة ضريبية — {{ $order->order_number }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
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
.print-bar-brand { font-size: 15px; font-weight: 800; color: #fff; }
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
    transition: background 0.2s;
    white-space: nowrap;
}
.print-btn:hover { background: #c75409; }

/* ═══ DOCUMENT WRAPPER ═══ */
.doc-wrap {
    max-width: 820px;
    margin: 72px auto 48px;
}

/* ═══ INVOICE CARD ═══ */
.invoice-card {
    background: #fff;
    border-radius: 0 0 16px 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    margin-bottom: 16px;
}

/* ═══ HEADER ═══ */
.inv-header {
    background: linear-gradient(145deg, #0f3d48 0%, #14505E 40%, #1A6B7C 100%);
    color: #fff;
    padding: 32px 36px 28px;
    position: relative;
    overflow: hidden;
}
.inv-header::before {
    content: '';
    position: absolute;
    top: -60px; left: -60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    pointer-events: none;
}
.inv-header-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.15);
}
.inv-brand { font-size: 22px; font-weight: 900; color: #fff; }
.inv-badge {
    background: #E8620A;
    color: #fff;
    padding: 6px 20px;
    border-radius: 20px;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.3px;
}
.inv-meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}
.inv-meta-item { }
.inv-meta-label { font-size: 11px; color: #9ecfda; margin-bottom: 2px; }
.inv-meta-value { font-size: 14px; font-weight: 700; color: #fff; }

/* ═══ BODY ═══ */
.inv-body { padding: 28px 36px; }

/* ═══ 2-COL GRID ═══ */
.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
}

/* ═══ INFO BOX ═══ */
.info-box {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
}
.info-box-title {
    background: #f8fafc;
    padding: 9px 14px;
    font-size: 12px;
    font-weight: 800;
    color: #14505E;
    border-bottom: 1px solid #e5e7eb;
    border-right: 3px solid #E8620A;
}
.info-row {
    display: flex;
    justify-content: space-between;
    padding: 7px 14px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 12px;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: #6b7280; }
.info-value { color: #1e293b; font-weight: 600; text-align: left; }

/* ═══ SERVICE TABLE ═══ */
.section-title {
    font-size: 13px;
    font-weight: 800;
    color: #14505E;
    border-right: 3px solid #E8620A;
    padding-right: 10px;
    margin-bottom: 12px;
}
table.items {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 12px;
}
table.items th {
    background: #14505E;
    color: #fff;
    padding: 10px 12px;
    text-align: right;
    font-weight: 700;
}
table.items td {
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
}
table.items tr:nth-child(even) td { background: #f8fafc; }
table.items .num { width: 40px; text-align: center; }
table.items .amount { text-align: left; font-weight: 700; }

/* ═══ TOTALS ═══ */
.totals-wrap {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
}
.totals-box {
    width: 320px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
}
.totals-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 14px;
    font-size: 12px;
    border-bottom: 1px solid #f3f4f6;
}
.totals-row:last-child {
    border-bottom: none;
    background: #f0f9ff;
    font-size: 14px;
    font-weight: 800;
    color: #14505E;
    padding: 12px 14px;
}
.totals-label { color: #6b7280; }
.totals-value { font-weight: 700; color: #1e293b; }
.totals-row:last-child .totals-value { color: #14505E; }
.discount-value { color: #166534; font-weight: 700; }

/* ═══ VAT NOTE ═══ */
.vat-note {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 11px;
    color: #92400e;
    margin-bottom: 20px;
}

/* ═══ STATUS STAMP ═══ */
.stamp-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.stamp {
    border: 3px solid #16a34a;
    color: #16a34a;
    padding: 6px 20px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 2px;
    transform: rotate(-6deg);
    display: inline-block;
    opacity: 0.85;
}
.auto-note {
    font-size: 11px;
    color: #9ca3af;
    text-align: left;
}

/* ═══ PRINT ═══ */
@media print {
    body { background: #fff; }
    .print-bar { display: none; }
    .doc-wrap { margin: 0; max-width: 100%; }
    .invoice-card { box-shadow: none; border-radius: 0; }
    img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
</head>
<body>

<!-- Print Bar -->
<div class="print-bar">
    <img src="/logo-white.png" alt="منصة دافة" style="height:34px; max-width:110px; object-fit:contain;" />
    <span class="print-bar-title">فاتورة ضريبية — {{ $order->order_number }}</span>
    <button class="print-btn" onclick="window.print()">🖨&nbsp; طباعة / تحميل PDF</button>
</div>

<div class="doc-wrap">
  <div class="invoice-card">

    <!-- Header -->
    <div class="inv-header">
      <div class="inv-header-topbar">
        <img src="/logo-white.png" alt="منصة دافة" style="height:46px; max-width:150px; object-fit:contain;" />
        <div class="inv-badge">فاتورة ضريبية</div>
      </div>
      <div class="inv-meta-grid">
        <div class="inv-meta-item">
          <div class="inv-meta-label">رقم الفاتورة</div>
          <div class="inv-meta-value">{{ $order->order_number }}</div>
        </div>
        <div class="inv-meta-item">
          <div class="inv-meta-label">تاريخ الإصدار</div>
          <div class="inv-meta-value">{{ ($order->paid_at ?? $order->created_at)->format('Y/m/d') }}</div>
        </div>
        <div class="inv-meta-item">
          <div class="inv-meta-label">حالة الدفع</div>
          <div class="inv-meta-value" style="color:#86efac;">مدفوعة ✓</div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="inv-body">

      <!-- Client & Vendor Info -->
      <div class="two-col">
        <div class="info-box">
          <div class="info-box-title">بيانات العميل</div>
          <div class="info-row"><span class="info-label">اسم المنظمة</span><span class="info-value">{{ $user->org_name ?: $user->rep_name }}</span></div>
          @if($user->org_type)
          <div class="info-row"><span class="info-label">نوع المنظمة</span><span class="info-value">{{ $user->org_type }}</span></div>
          @endif
          @if($user->sector)
          <div class="info-row"><span class="info-label">القطاع</span><span class="info-value">{{ $user->sector }}</span></div>
          @endif
          <div class="info-row"><span class="info-label">المسؤول</span><span class="info-value">{{ $user->rep_name }}</span></div>
          <div class="info-row"><span class="info-label">البريد الإلكتروني</span><span class="info-value">{{ $user->email }}</span></div>
          @if($user->phone)
          <div class="info-row"><span class="info-label">الهاتف</span><span class="info-value">{{ $user->phone }}</span></div>
          @endif
        </div>
        <div class="info-box">
          <div class="info-box-title">بيانات المورد</div>
          <div class="info-row"><span class="info-label">اسم المنصة</span><span class="info-value">{{ $companyName }}</span></div>
          @if($vatNumber)
          <div class="info-row"><span class="info-label">الرقم الضريبي</span><span class="info-value">{{ $vatNumber }}</span></div>
          @endif
          @if($supportEmail)
          <div class="info-row"><span class="info-label">البريد الإلكتروني</span><span class="info-value">{{ $supportEmail }}</span></div>
          @endif
          <div class="info-row"><span class="info-label">تاريخ الطلب</span><span class="info-value">{{ $order->created_at->format('Y/m/d') }}</span></div>
          <div class="info-row"><span class="info-label">طريقة الدفع</span><span class="info-value">{{ $order->payment_method ?? '—' }}</span></div>
        </div>
      </div>

      <!-- Service Table -->
      <div class="section-title">تفاصيل الخدمة</div>
      <table class="items">
        <thead>
          <tr>
            <th class="num">#</th>
            <th>الخدمة</th>
            <th>الوصف</th>
            <th style="text-align:left; width:130px;">المبلغ (ريال)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="num">1</td>
            <td>{{ $serviceLabel }}</td>
            <td style="color:#6b7280;">{{ $serviceDesc }}</td>
            <td class="amount">{{ number_format($order->subtotal + ($order->discount_amount ?? 0), 2) }}</td>
          </tr>
          @if($order->discount_amount && $order->discount_amount > 0)
          <tr>
            <td class="num"></td>
            <td colspan="2" style="color:#166534; font-size:11px;">خصم — {{ $order->discount_code }}</td>
            <td class="amount" style="color:#166534;">- {{ number_format($order->discount_amount, 2) }}</td>
          </tr>
          @endif
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals-wrap">
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
            <span class="totals-value discount-value">- {{ number_format($order->discount_amount, 2) }} ريال</span>
          </div>
          @endif
          <div class="totals-row">
            <span class="totals-label">الإجمالي المستحق</span>
            <span class="totals-value">{{ number_format($order->total, 2) }} ريال</span>
          </div>
        </div>
      </div>

      <!-- VAT Note -->
      @if($vatNumber)
      <div class="vat-note">
        هذه فاتورة ضريبية وفق متطلبات هيئة الزكاة والضريبة والجمارك — الرقم الضريبي للمورد: <strong>{{ $vatNumber }}</strong>
      </div>
      @endif

      <!-- Stamp + Footer -->
      <div class="stamp-row">
        <div class="stamp">مدفوعة</div>
        <div class="auto-note">
          هذه الفاتورة صادرة إلكترونياً<br>
          ولا تحتاج إلى توقيع أو ختم
        </div>
      </div>

      <div style="margin-top:28px; padding-top:16px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center;">
        <img src="/logo.png" alt="منصة دافة" style="height:38px; max-width:120px; object-fit:contain; opacity:0.85;" />
        <div style="font-size:11px; color:#9ca3af; text-align:left;">
          منصة دافة للتخطيط الاستراتيجي والمؤسسي<br>
          {{ $supportEmail ?? '' }}
        </div>
      </div>

    </div>
  </div>
</div>

</body>
</html>