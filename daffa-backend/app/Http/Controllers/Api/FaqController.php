<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Support\PublicCache;

class FaqController extends Controller
{
    // الأسئلة الشائعة مجمّعة بالفئة — من كاش الملفات؛ يُلغى عند أي تعديل من لوحة الأدمن
    public function index()
    {
        $faqs = PublicCache::remember(PublicCache::FAQS, fn () => Faq::active()
            ->orderBy('category')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'category', 'question', 'answer'])
            ->groupBy('category')
            ->toArray());

        return response()->json($faqs);
    }
}
