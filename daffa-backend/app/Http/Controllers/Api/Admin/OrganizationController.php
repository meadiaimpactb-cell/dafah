<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\StrategicWorkflow;
use App\Models\OperationalWorkflow;
use App\Models\PolicyWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', 'client');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('org_name', 'like', "%{$s}%")
                  ->orWhere('rep_name', 'like', "%{$s}%")
                  ->orWhere('email',    'like', "%{$s}%");
            });
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('org_type', $request->type);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'suspended') {
                $query->where('is_active', false);
            } else {
                $query->where('is_active', true);
            }
        }

        $orgs = $query->orderByDesc('created_at')->get()->map(fn($u) => $this->format($u));

        return response()->json($orgs);
    }

    public function show(int $id)
    {
        $user = User::where('role', 'client')->findOrFail($id);
        return response()->json($this->format($user));
    }

    public function store(Request $request)
    {
        $request->validate([
            'org_name' => 'required|string|max:100',
            'org_type' => 'required|string|max:50',
            'rep_name' => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'required|string|max:20|unique:users,phone',
            'sector'   => 'nullable|string|max:100',
            'password' => 'required|string|min:6',
        ], [
            'email.unique' => 'البريد الإلكتروني مسجّل مسبقاً في حساب آخر',
            'phone.unique' => 'رقم الهاتف مسجّل مسبقاً في منظمة أخرى',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ]);

        $user = User::create([
            'org_name'  => $request->org_name,
            'org_type'  => $request->org_type,
            'rep_name'  => $request->rep_name,
            'email'     => $request->email,
            'phone'     => $request->phone,
            'sector'    => $request->sector,
            'password'  => Hash::make($request->password),
            'role'      => 'client',
            'is_active' => true,
        ]);

        return response()->json($this->format($user), 201);
    }

    public function update(Request $request, int $id)
    {
        $user = User::where('role', 'client')->findOrFail($id);

        $request->validate([
            'org_name' => 'sometimes|string|max:100',
            'org_type' => 'sometimes|string|max:50',
            'rep_name' => 'sometimes|string|max:100',
            'email'    => "sometimes|email|unique:users,email,{$id}",
            'phone'    => "sometimes|string|max:20|unique:users,phone,{$id}",
            'sector'   => 'nullable|string|max:100',
            'password' => 'nullable|string|min:6',
        ], [
            'email.unique' => 'البريد الإلكتروني مسجّل مسبقاً في حساب آخر',
            'phone.unique' => 'رقم الهاتف مسجّل مسبقاً في منظمة أخرى',
            'password.min' => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ]);

        $data = $request->only(['org_name', 'org_type', 'rep_name', 'email', 'phone', 'sector']);
        $data = array_filter($data, fn($v) => $v !== null);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json($this->format($user->fresh()));
    }

    public function toggle(int $id)
    {
        $user = User::where('role', 'client')->findOrFail($id);
        $user->update(['is_active' => !$user->is_active]);
        return response()->json($this->format($user->fresh()));
    }

    public function destroy(int $id)
    {
        $user = User::where('role', 'client')->findOrFail($id);
        if ($user->logo) {
            Storage::disk('public')->delete($user->logo);
        }
        $user->delete();
        return response()->json(['message' => 'تم حذف المنظمة بنجاح']);
    }

    public function uploadLogo(Request $request, int $id)
    {
        $user = User::where('role', 'client')->findOrFail($id);

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        if ($user->logo) {
            Storage::disk('public')->delete($user->logo);
        }

        $path = $request->file('logo')->store('org-logos', 'public');
        $user->update(['logo' => $path]);

        return response()->json($this->format($user->fresh()));
    }

    private function format(User $u): array
    {
        $strategic   = StrategicWorkflow::where('user_id', $u->id)->count();
        $operational = OperationalWorkflow::where('user_id', $u->id)->count();
        $policy      = PolicyWorkflow::where('user_id', $u->id)->count();
        $servicesCount = $strategic + $operational + $policy;

        // جلب آخر مستشار مرتبط بالمنظمة
        $consultantName = '—';
        $latestStrategic = StrategicWorkflow::with('consultant')
            ->where('user_id', $u->id)
            ->whereNotNull('consultant_id')
            ->latest()
            ->first();
        if ($latestStrategic?->consultant) {
            $consultantName = $latestStrategic->consultant->name;
        }

        $status = 'جديد';
        if (!$u->is_active) {
            $status = 'معلق';
        } elseif ($servicesCount > 0) {
            $status = 'نشط';
        }

        return [
            'id'             => $u->id,
            'org_name'       => $u->org_name ?? '—',
            'org_type'       => $u->org_type ?? '—',
            'rep_name'       => $u->rep_name ?? '—',
            'email'          => $u->email,
            'phone'          => $u->phone ?? '—',
            'sector'         => $u->sector ?? '—',
            'logo'           => $u->logo,
            'logo_url'       => $u->logo ? Storage::disk('public')->url($u->logo) : null,
            'is_active'      => $u->is_active,
            'services_count' => $servicesCount,
            'consultant'     => $consultantName,
            'status'         => $status,
            'created_at'     => $u->created_at?->format('Y/m'),
        ];
    }
}
