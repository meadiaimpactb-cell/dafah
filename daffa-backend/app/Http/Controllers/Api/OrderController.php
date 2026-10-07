<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\ServiceSetting;
use App\Models\SiteContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class OrderController extends Controller
{
    // GET /api/orders/{id}/invoice-link  — returns a temporary signed URL
    public function getInvoiceLink(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'غير مصرح.'], 403);
        }

        $url = URL::temporarySignedRoute(
            'pdf.invoice',
            now()->addMinutes(10),
            ['order_id' => $order->id]
        );

        return response()->json(['url' => $url]);
    }

    // GET /pdf/invoice  — web route served via signed URL (no token needed)
    public function showInvoice(Request $request)
    {
        if (!$request->hasValidSignature()) {
            abort(403, 'الرابط منتهي الصلاحية أو غير صالح.');
        }

        $order = Order::with('user')->findOrFail($request->order_id);

        return $this->buildInvoiceView($order);
    }

    private function buildInvoiceView(Order $order)
    {
        $serviceLabels = [
            'strategic'   => 'خدمة التخطيط الاستراتيجي',
            'operational' => 'خدمة التخطيط التشغيلي',
            'policies'    => 'خدمة السياسات واللوائح',
        ];
        $serviceDescs = [
            'strategic'   => 'إعداد الخطة الاستراتيجية المؤسسية الشاملة مع مراجعة المستشار',
            'operational' => 'إعداد خطة العمل التشغيلية مع مراجعة المستشار',
            'policies'    => 'إعداد السياسات واللوائح المؤسسية مع مراجعة المستشار',
        ];

        $pricingMap   = ServiceSetting::map();
        $contentMap   = SiteContent::map();
        $taxRate      = (float) ($pricingMap['tax_rate'] ?? 15);
        $vatNumber    = $contentMap['payment_vat_number'] ?? null;
        $companyName  = $contentMap['system_platform_name'] ?? 'منصة دافة';
        $supportEmail = $contentMap['email_from_address'] ?? null;

        $user         = $order->user;
        $serviceLabel = $serviceLabels[$order->service_type] ?? $order->service_type;
        $serviceDesc  = $serviceDescs[$order->service_type]  ?? '';

        return view('invoice.show', compact(
            'order', 'user', 'serviceLabel', 'serviceDesc',
            'taxRate', 'vatNumber', 'companyName', 'supportEmail'
        ));
    }

    public function myOrders(Request $request)
    {
        $userId = $request->user()->id;

        $serviceLabel = [
            'strategic'   => 'التخطيط الاستراتيجي',
            'operational' => 'التخطيط التشغيلي',
            'policies'    => 'السياسات واللوائح',
        ];

        $orders = Order::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($o) => [
                'id'             => $o->id,
                'order_number'   => $o->order_number,
                'service_type'   => $o->service_type,
                'service_label'  => $serviceLabel[$o->service_type] ?? $o->service_type,
                'total'          => $o->total,
                'payment_status' => $o->payment_status,
                'date'           => ($o->paid_at ?? $o->created_at)->format('Y/m/d'),
            ]);

        $paidTotal   = Order::where('user_id', $userId)->where('payment_status', 'paid')->sum('total');
        $lastPayment = Order::where('user_id', $userId)->where('payment_status', 'paid')
            ->orderByDesc('paid_at')->value('total');

        return response()->json([
            'total_paid'   => (float) $paidTotal,
            'last_payment' => (float) ($lastPayment ?? 0),
            'orders'       => $orders,
        ]);
    }
}