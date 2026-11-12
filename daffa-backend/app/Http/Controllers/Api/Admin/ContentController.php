<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\PolicyController;
use App\Models\OperationalUnit;
use App\Models\PolicyTypeContent;
use App\Models\StrategicUnit;
use App\Support\PolicyCatalog;
use App\Support\StrategicContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
    // يشمل المحتوى المنظَّم كاملًا (النبذة، الشرح، الإرشادات، تعليمات النماذج) وروابط ملفات PDF
    public function strategicUnits()
    {
        return response()->json(
            StrategicUnit::orderBy('unit_number')->get()->map(fn ($u) => $this->strategicPayload($u))
        );
    }

    private function strategicPayload(StrategicUnit $u): array
    {
        return [
            'id'             => $u->id,
            'unit_number'    => $u->unit_number,
            'name'           => $u->name,
            'template_type'  => $u->template_type,
            'table_rows'     => $u->table_rows,
            'video_url'      => $u->video_url,
            'video_duration' => $u->video_duration,
            'content'        => $u->content,
            'pdf_urls'       => StrategicContent::pdfUrls($u->content),
            'has_default'    => StrategicContent::defaultFor($u->template_type) !== null,
        ];
    }

    // ── PUT /api/admin/content/strategic/{id} ─────────────────────────────────
    // الاسم والفيديو + المحتوى المنظَّم كاملًا (يُضبط على المخطط المعروف قبل الحفظ)
    public function updateStrategic(Request $request, int $id)
    {
        $request->validate([
            'name'           => 'sometimes|required|string|max:255',
            'video_url'      => 'nullable|string|max:500',
            'video_duration' => 'nullable|string|max:20',
            'content'        => 'sometimes|array',
        ]);

        $unit = StrategicUnit::findOrFail($id);
        $data = $request->only(['name', 'video_url', 'video_duration']);

        if ($request->has('content')) {
            $raw = $request->input('content');
            if (strlen(json_encode($raw, JSON_UNESCAPED_UNICODE)) > 2_000_000) {
                return response()->json(['message' => 'حجم المحتوى أكبر من المسموح.'], 422);
            }
            $data['content'] = StrategicContent::normalize($raw, $unit->content);
        }

        $unit->update($data);

        return response()->json($this->strategicPayload($unit->fresh()));
    }

    // ── GET /api/admin/content/strategic/{id}/default ─────────────────────────
    // المحتوى المعتمد الأصلي للوحدة (لزر «استعادة المحتوى المعتمد» — يُحمَّل في المحرر ولا يُحفظ إلا بالحفظ)
    public function strategicDefault(int $id)
    {
        $unit    = StrategicUnit::findOrFail($id);
        $default = StrategicContent::defaultFor($unit->template_type);
        abort_unless($default, 404);

        return response()->json(StrategicContent::normalize($default));
    }

    // ── POST /api/admin/content/strategic/{id}/pdf/{kind} ─────────────────────
    // رفع ملف «الشرح التفصيلي» أو «الإرشادات التفصيلية» واستبدال الحالي
    public function uploadStrategicPdf(Request $request, int $id, string $kind)
    {
        abort_unless(in_array($kind, StrategicContent::PDF_KINDS, true), 404);
        $request->validate(['file' => 'required|file|mimes:pdf|max:51200']);

        $unit    = StrategicUnit::findOrFail($id);
        $content = $unit->content ?: [];
        $prefix  = $kind === 'guidelines' ? 'الإرشادات التفصيلية' : 'الشرح التفصيلي';
        $name    = StrategicContent::safePdfName(
            $request->input('file_name') ?: $request->file('file')->getClientOriginalName(),
            "{$prefix} — {$unit->name}"
        );

        $dir  = "strategic-guides/{$unit->template_type}/{$kind}/" . now()->format('YmdHis');
        $path = $request->file('file')->storeAs($dir, $name, 'public');
        if (!$path) {
            return response()->json(['message' => 'تعذّر حفظ الملف.'], 500);
        }

        $this->deleteStrategicPdf($content[$kind]['pdf_file'] ?? null);

        $content[$kind] = array_merge($content[$kind] ?? [], ['pdf_file' => $path, 'pdf_name' => $name]);
        $unit->update(['content' => $content]);

        return response()->json($this->strategicPayload($unit->fresh()));
    }

    // ── DELETE /api/admin/content/strategic/{id}/pdf/{kind} ───────────────────
    // حذف الملف المرفوع والرجوع إلى الملف المعتمد الافتراضي
    public function removeStrategicPdf(int $id, string $kind)
    {
        abort_unless(in_array($kind, StrategicContent::PDF_KINDS, true), 404);

        $unit    = StrategicUnit::findOrFail($id);
        $content = $unit->content ?: [];

        $this->deleteStrategicPdf($content[$kind]['pdf_file'] ?? null);
        unset($content[$kind]['pdf_file'], $content[$kind]['pdf_name']);
        $unit->update(['content' => $content]);

        return response()->json($this->strategicPayload($unit->fresh()));
    }

    private function deleteStrategicPdf(?string $path): void
    {
        if (!$path || !str_starts_with($path, 'strategic-guides/')) {
            return;
        }
        $disk = Storage::disk('public');
        $disk->delete($path);
        $dir = dirname($path);
        if ($dir !== '.' && empty($disk->files($dir))) {
            $disk->deleteDirectory($dir);
        }
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

        // policyTypes() already merges admin overrides over the catalog defaults
        $data = $types->map(fn ($t) => array_merge($t, [
            'content_id' => $contents->get($t['id'])?->id,
        ]));

        return response()->json($data->values());
    }

    // ── GET /api/public/policy-types — السياسات المتاحة للشراء فقط ───────────
    public function publicPolicyTypes()
    {
        return response()->json(
            collect(PolicyController::policyTypes())->where('active', true)->values()
        );
    }

    // ── PUT /api/admin/content/policies/{typeId} ──────────────────────────────
    public function updatePolicy(Request $request, int $typeId)
    {
        abort_unless(in_array($typeId, PolicyCatalog::allIds(), true), 404);

        $request->validate($this->policyRules());

        $content = PolicyTypeContent::updateOrCreate(
            ['policy_type_id' => $typeId],
            $request->only(array_keys($this->policyRules()))
        );

        return response()->json($content);
    }
}
