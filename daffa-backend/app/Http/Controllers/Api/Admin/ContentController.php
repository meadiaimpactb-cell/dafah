<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\PolicyController;
use App\Models\OperationalUnit;
use App\Models\PolicyTypeContent;
use App\Models\StrategicUnit;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    private function unitRules(): array
    {
        return [
            'name'                 => 'nullable|string|max:255',
            'overview'             => 'nullable|string',
            'overview2'            => 'nullable|string',
            'written_description'  => 'nullable|string',
            'topics'               => 'nullable|array',
            'topics.*.t'           => 'nullable|string',
            'topics.*.d'           => 'nullable|string',
            'steps'                => 'nullable|array',
            'steps.*.t'            => 'nullable|string',
            'steps.*.d'            => 'nullable|string',
            'tip'                  => 'nullable|string',
            'video_url'            => 'nullable|string|max:500',
            'video_duration'       => 'nullable|string|max:20',
        ];
    }

    private function policyRules(): array
    {
        return [
            'name'                 => 'nullable|string|max:255',
            'description'          => 'nullable|string',
            'price'                => 'nullable|numeric|min:0',
            'overview'             => 'nullable|string',
            'written_description'  => 'nullable|string',
            'tip'                  => 'nullable|string',
            'video_url'            => 'nullable|string|max:500',
            'video_duration'       => 'nullable|string|max:20',
        ];
    }

    private function unitFields(): array
    {
        return ['id', 'unit_number', 'name', 'overview', 'overview2', 'written_description', 'topics', 'steps', 'tip', 'video_url', 'video_duration'];
    }

    // ── GET /api/admin/content/strategic ─────────────────────────────────────
    public function strategicUnits()
    {
        return response()->json(StrategicUnit::orderBy('unit_number')->get($this->unitFields()));
    }

    // ── PUT /api/admin/content/strategic/{id} ─────────────────────────────────
    public function updateStrategic(Request $request, int $id)
    {
        $request->validate($this->unitRules());
        $unit = StrategicUnit::findOrFail($id);
        $unit->update($request->only(['name', 'overview', 'overview2', 'written_description', 'topics', 'steps', 'tip', 'video_url', 'video_duration']));
        return response()->json($unit->only($this->unitFields()));
    }

    // ── GET /api/admin/content/operational ───────────────────────────────────
    public function operationalUnits()
    {
        return response()->json(OperationalUnit::orderBy('unit_number')->get($this->unitFields()));
    }

    // ── PUT /api/admin/content/operational/{id} ───────────────────────────────
    public function updateOperational(Request $request, int $id)
    {
        $request->validate($this->unitRules());
        $unit = OperationalUnit::findOrFail($id);
        $unit->update($request->only(['name', 'overview', 'overview2', 'written_description', 'topics', 'steps', 'tip', 'video_url', 'video_duration']));
        return response()->json($unit->only($this->unitFields()));
    }

    // ── GET /api/admin/content/policies ──────────────────────────────────────
    public function policyTypes()
    {
        $types    = collect(PolicyController::policyTypes());
        $contents = PolicyTypeContent::all()->keyBy('policy_type_id');

        $data = $types->map(function ($t) use ($contents) {
            $c = $contents->get($t['id']);
            return array_merge($t, [
                'name'                => $c?->name          ?? $t['name'],
                'description'         => $c?->description   ?? $t['description'],
                'price'               => $c?->price          ?? $t['price'],
                'overview'            => $c?->overview,
                'written_description' => $c?->written_description,
                'tip'                 => $c?->tip,
                'video_url'           => $c?->video_url,
                'video_duration'      => $c?->video_duration,
                'content_id'          => $c?->id,
            ]);
        });

        return response()->json($data);
    }

    // ── PUT /api/admin/content/policies/{typeId} ──────────────────────────────
    public function updatePolicy(Request $request, int $typeId)
    {
        $request->validate($this->policyRules());

        $content = PolicyTypeContent::updateOrCreate(
            ['policy_type_id' => $typeId],
            $request->only(array_keys($this->policyRules()))
        );

        return response()->json($content);
    }
}
