<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use App\Support\PublicCache;
use Illuminate\Http\Request;

class SiteContentController extends Controller
{
    // GET /api/site-content  (public — no auth) — من كاش الملفات؛ يُلغى عند أي تعديل
    public function publicIndex()
    {
        return response()->json(
            PublicCache::remember(PublicCache::SITE_CONTENT, fn () => SiteContent::pluck('value', 'key')->all())
        );
    }

    // GET /api/admin/site-content  (admin — grouped)
    public function adminIndex()
    {
        $grouped = SiteContent::orderBy('group')->orderBy('id')
            ->get()
            ->groupBy('group');

        return response()->json($grouped);
    }

    // PUT /api/admin/site-content/{key}
    public function update(Request $request, string $key)
    {
        $request->validate(['value' => 'nullable|string']);

        $content = SiteContent::where('key', $key)->firstOrFail();
        $content->update(['value' => $request->input('value', '')]);
        PublicCache::forget(PublicCache::SITE_CONTENT, PublicCache::POLICY_TYPES);

        return response()->json($content);
    }

    // POST /api/admin/site-content/bulk
    public function bulk(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.key' => 'required|string',
            'items.*.value' => 'nullable|string',
        ]);

        foreach ($request->items as $item) {
            SiteContent::where('key', $item['key'])
                ->update(['value' => $item['value'] ?? '']);
        }
        PublicCache::forget(PublicCache::SITE_CONTENT, PublicCache::POLICY_TYPES);

        return response()->json(['ok' => true]);
    }
}
