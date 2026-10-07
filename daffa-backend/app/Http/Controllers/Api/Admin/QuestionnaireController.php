<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\QuestionnaireSection;
use App\Models\QuestionnaireQuestion;
use Illuminate\Http\Request;

class QuestionnaireController extends Controller
{
    // ── GET /api/admin/questionnaire?policy_type_id=1 ────────────────────────
    public function index(Request $request)
    {
        $q = QuestionnaireSection::withCount('questions')
            ->orderBy('sort_order')->orderBy('id');

        if ($request->filled('policy_type_id')) {
            $q->where('policy_type_id', $request->policy_type_id);
        }

        return response()->json($q->get());
    }

    // ── POST /api/admin/questionnaire/sections ────────────────────────────────
    public function storeSection(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:100',
            'policy_type_id' => 'nullable|integer|min:1|max:7',
        ]);

        $maxOrder = QuestionnaireSection::where('policy_type_id', $request->policy_type_id)->max('sort_order') ?? 0;
        $section  = QuestionnaireSection::create([
            'name'           => trim($request->name),
            'sort_order'     => $maxOrder + 1,
            'policy_type_id' => $request->policy_type_id,
        ]);

        $section->questions_count = 0;
        return response()->json($section, 201);
    }

    // ── PUT /api/admin/questionnaire/sections/{id} ────────────────────────────
    public function updateSection(Request $request, int $id)
    {
        $request->validate(['name' => 'required|string|max:100']);

        $section = QuestionnaireSection::findOrFail($id);
        $section->update(['name' => trim($request->name)]);

        return response()->json($section->loadCount('questions'));
    }

    // ── DELETE /api/admin/questionnaire/sections/{id} ─────────────────────────
    public function destroySection(int $id)
    {
        QuestionnaireSection::findOrFail($id)->delete();
        return response()->json(['message' => 'تم الحذف.']);
    }

    // ── POST /api/admin/questionnaire/sections/reorder ───────────────────────
    public function reorderSections(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        foreach ($request->ids as $order => $id) {
            QuestionnaireSection::where('id', $id)->update(['sort_order' => $order]);
        }
        return response()->json(['message' => 'ok']);
    }

    // ── GET /api/admin/questionnaire/sections/{id}/questions ─────────────────
    public function sectionQuestions(int $id)
    {
        $section = QuestionnaireSection::findOrFail($id);
        return response()->json([
            'section'   => $section,
            'questions' => $section->questions,
        ]);
    }

    // ── POST /api/admin/questionnaire/sections/{id}/questions ────────────────
    public function storeQuestion(Request $request, int $id)
    {
        $request->validate([
            'question'           => 'required|string|max:500',
            'type'               => 'required|in:single,multiple,yesno,text,scale',
            'options'            => 'nullable|array',
            'options.*'          => 'string|max:200',
            'required'           => 'boolean',
            'hint'               => 'nullable|string|max:300',
            'display_condition'  => 'nullable|string|max:300',
        ]);

        QuestionnaireSection::findOrFail($id);
        $maxOrder = QuestionnaireQuestion::where('section_id', $id)->max('sort_order') ?? 0;

        $question = QuestionnaireQuestion::create([
            'section_id'        => $id,
            'question'          => trim($request->question),
            'type'              => $request->type,
            'options'           => $this->cleanOptions($request->options, $request->type),
            'required'          => $request->boolean('required'),
            'hint'              => $request->hint ? trim($request->hint) : null,
            'display_condition' => $request->display_condition ? trim($request->display_condition) : null,
            'sort_order'        => $maxOrder + 1,
        ]);

        return response()->json($question, 201);
    }

    // ── PUT /api/admin/questionnaire/questions/{id} ───────────────────────────
    public function updateQuestion(Request $request, int $id)
    {
        $request->validate([
            'question'           => 'required|string|max:500',
            'type'               => 'required|in:single,multiple,yesno,text,scale',
            'options'            => 'nullable|array',
            'options.*'          => 'string|max:200',
            'required'           => 'boolean',
            'hint'               => 'nullable|string|max:300',
            'display_condition'  => 'nullable|string|max:300',
        ]);

        $question = QuestionnaireQuestion::findOrFail($id);
        $question->update([
            'question'          => trim($request->question),
            'type'              => $request->type,
            'options'           => $this->cleanOptions($request->options, $request->type),
            'required'          => $request->boolean('required'),
            'hint'              => $request->hint ? trim($request->hint) : null,
            'display_condition' => $request->display_condition ? trim($request->display_condition) : null,
        ]);

        return response()->json($question->fresh());
    }

    // ── DELETE /api/admin/questionnaire/questions/{id} ────────────────────────
    public function destroyQuestion(int $id)
    {
        QuestionnaireQuestion::findOrFail($id)->delete();
        return response()->json(['message' => 'تم الحذف.']);
    }

    // ── POST /api/admin/questionnaire/questions/reorder ──────────────────────
    public function reorderQuestions(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);
        foreach ($request->ids as $order => $id) {
            QuestionnaireQuestion::where('id', $id)->update(['sort_order' => $order]);
        }
        return response()->json(['message' => 'ok']);
    }

    private function cleanOptions(?array $options, string $type): ?array
    {
        if (!in_array($type, ['single', 'multiple'])) return null;
        if (!$options) return null;
        $clean = array_values(array_filter(array_map('trim', $options)));
        return count($clean) ? $clean : null;
    }
}
