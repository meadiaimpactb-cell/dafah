<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\PolicyController;
use App\Models\Notification;
use App\Models\PolicyWorkflow;
use Illuminate\Http\Request;

class PolicyDesignController extends Controller
{
    // GET /api/admin/policies/designs
    public function index()
    {
        $typeMap = collect(PolicyController::policyTypes())->keyBy('id');

        $workflows = PolicyWorkflow::with(['user', 'consultant'])
            ->where('want_design', true)
            ->where('design_payment_status', 'paid')
            ->orderByRaw("FIELD(design_status, 'revision_requested', 'pending', 'uploaded', 'approved')")
            ->orderByDesc('design_paid_at')
            ->get()
            ->map(function ($wf) use ($typeMap) {
                $selectedNames = collect($wf->selected_policies ?? [])
                    ->map(fn($id) => $typeMap->get($id)['name'] ?? '—')
                    ->values();

                return [
                    'id'                    => $wf->id,
                    'org_name'              => $wf->user?->org_name ?: $wf->user?->email,
                    'rep_name'              => $wf->user?->rep_name,
                    'consultant_name'       => $wf->consultant?->name,
                    'selected_policies'     => $selectedNames,
                    'design_status'         => $wf->design_status,
                    'design_file'           => $wf->design_file ? url('storage/' . $wf->design_file) : null,
                    'design_fee'            => $wf->design_fee,
                    'design_paid_at'        => $wf->design_paid_at?->format('Y/m/d'),
                    'design_uploaded_at'    => $wf->design_uploaded_at?->format('Y/m/d'),
                    'design_approved_at'    => $wf->design_approved_at?->format('Y/m/d'),
                    'design_revision_notes' => $wf->design_revision_notes,
                    'design_brief'          => $wf->design_brief,
                    'design_logo_url'       => $wf->design_logo ? url('storage/' . $wf->design_logo) : null,
                    'status'                => $wf->status,
                    'created_at'            => $wf->created_at->format('Y/m/d'),
                ];
            });

        return response()->json($workflows);
    }

    // POST /api/admin/policies/designs/{id}/upload
    public function upload(Request $request, int $id)
    {
        $request->validate([
            'design_file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:20480',
        ]);

        $wf = PolicyWorkflow::findOrFail($id);

        if ($wf->design_payment_status !== 'paid') {
            return response()->json(['message' => 'لم يتم الدفع لهذا الطلب.'], 422);
        }

        if (!in_array($wf->design_status, ['pending', 'revision_requested'])) {
            return response()->json(['message' => 'لا يمكن رفع التصميم في الحالة الحالية.'], 422);
        }

        $path = $request->file('design_file')->store('policy-designs', 'public');

        $wf->update([
            'design_file'           => $path,
            'design_status'         => 'uploaded',
            'design_uploaded_at'    => now(),
            'design_revision_notes' => null,
        ]);

        Notification::notify(
            $wf->user_id,
            'design_uploaded',
            'تم رفع التصميم الاحترافي',
            'تم رفع التصميم الاحترافي لسياساتك. يمكنك الآن الدخول ومراجعة التصميم واعتماده.'
        );

        return response()->json([
            'message'       => 'تم رفع التصميم بنجاح.',
            'design_status' => 'uploaded',
            'design_file'   => url('storage/' . $path),
        ]);
    }
}
