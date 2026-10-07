<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index()
    {
        return response()->json(
            Faq::orderBy('category')->orderBy('sort_order')->orderBy('id')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category'   => 'required|string|max:100',
            'question'   => 'required|string|max:500',
            'answer'     => 'required|string|max:2000',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $faq = Faq::create([
            'category'   => $data['category'],
            'question'   => $data['question'],
            'answer'     => $data['answer'],
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active'  => true,
        ]);

        return response()->json($faq, 201);
    }

    public function update(Request $request, int $id)
    {
        $faq  = Faq::findOrFail($id);
        $data = $request->validate([
            'category'   => 'required|string|max:100',
            'question'   => 'required|string|max:500',
            'answer'     => 'required|string|max:2000',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $faq->update($data);

        return response()->json($faq);
    }

    public function toggle(int $id)
    {
        $faq = Faq::findOrFail($id);
        $faq->update(['is_active' => ! $faq->is_active]);

        return response()->json($faq);
    }

    public function destroy(int $id)
    {
        Faq::findOrFail($id)->delete();

        return response()->json(['message' => 'تم الحذف بنجاح']);
    }
}
