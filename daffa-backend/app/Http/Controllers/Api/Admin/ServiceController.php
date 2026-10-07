<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use App\Models\ServiceSetting;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    // ── GET /api/admin/services/settings ─────────────────────────────────────
    public function indexSettings()
    {
        return response()->json(ServiceSetting::orderBy('id')->get());
    }

    // ── PUT /api/admin/services/settings/{key} ────────────────────────────────
    public function updateSetting(Request $request, string $key)
    {
        $request->validate([
            'value'     => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $setting = ServiceSetting::where('key', $key)->firstOrFail();
        $setting->update($request->only('value', 'is_active'));

        return response()->json($setting);
    }

    // ── GET /api/admin/services/discounts ─────────────────────────────────────
    public function indexDiscounts()
    {
        return response()->json(DiscountCode::orderBy('id')->get());
    }

    // ── POST /api/admin/services/discounts ────────────────────────────────────
    public function storeDiscount(Request $request)
    {
        $request->validate([
            'code'       => 'required|string|max:50|unique:discount_codes,code',
            'type'       => 'required|in:percentage,fixed',
            'value'      => 'required|numeric|min:0',
            'expires_at' => 'nullable|date',
            'max_uses'   => 'nullable|integer|min:1',
        ]);

        $code = DiscountCode::create([
            'code'       => strtoupper(trim($request->code)),
            'type'       => $request->type,
            'value'      => $request->value,
            'expires_at' => $request->expires_at,
            'max_uses'   => $request->max_uses,
            'is_active'  => true,
        ]);

        return response()->json($code, 201);
    }

    // ── PUT /api/admin/services/discounts/{id} ────────────────────────────────
    public function updateDiscount(Request $request, int $id)
    {
        $request->validate([
            'code'       => "required|string|max:50|unique:discount_codes,code,{$id}",
            'type'       => 'required|in:percentage,fixed',
            'value'      => 'required|numeric|min:0',
            'expires_at' => 'nullable|date',
            'max_uses'   => 'nullable|integer|min:1',
            'is_active'  => 'boolean',
        ]);

        $code = DiscountCode::findOrFail($id);
        $code->update([
            'code'       => strtoupper(trim($request->code)),
            'type'       => $request->type,
            'value'      => $request->value,
            'expires_at' => $request->expires_at,
            'max_uses'   => $request->max_uses,
            'is_active'  => $request->boolean('is_active', $code->is_active),
        ]);

        return response()->json($code);
    }

    // ── POST /api/admin/services/discounts/{id}/toggle ────────────────────────
    public function toggleDiscount(int $id)
    {
        $code = DiscountCode::findOrFail($id);
        $code->update(['is_active' => !$code->is_active]);
        return response()->json($code);
    }

    // ── DELETE /api/admin/services/discounts/{id} ─────────────────────────────
    public function destroyDiscount(int $id)
    {
        DiscountCode::findOrFail($id)->delete();
        return response()->json(['message' => 'تم الحذف.']);
    }
}
