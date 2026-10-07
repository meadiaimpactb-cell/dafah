<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    // GET /api/admin/users
    public function index(Request $request)
    {
        $query = User::query()->orderByDesc('created_at');

        if ($request->role && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('rep_name', 'like', "%$s%")
                  ->orWhere('org_name', 'like', "%$s%")
                  ->orWhere('email',    'like', "%$s%");
            });
        }

        return response()->json(
            $query->with('consultant')->get()->map(fn($u) => $this->format($u))
        );
    }

    // POST /api/admin/users
    public function store(Request $request)
    {
        $request->validate([
            'rep_name' => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'role'     => 'required|in:admin,consultant,client',
            'password' => 'required|string|min:8',
            'phone'    => 'nullable|string|max:20',
            'org_name' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'rep_name' => $request->rep_name,
            'org_name' => $request->org_name ?: $request->rep_name,
            'org_type' => $request->role === 'consultant' ? 'مستشار' : ($request->org_type ?: 'غير محدد'),
            'email'    => $request->email,
            'phone'    => $request->phone ?: '0000000000',
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        return response()->json($this->format($user->load('consultant')), 201);
    }

    // PUT /api/admin/users/{id}
    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'rep_name' => 'sometimes|string|max:255',
            'email'    => 'sometimes|email|unique:users,email,' . $id,
            'role'     => 'sometimes|in:admin,consultant,client',
            'phone'    => 'nullable|string|max:20',
            'org_name' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:8',
        ]);

        $data = $request->only(['rep_name', 'email', 'role', 'phone', 'org_name', 'org_type', 'is_active']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update(array_filter($data, fn($v) => $v !== null));

        return response()->json($this->format($user->fresh(['consultant'])));
    }

    // POST /api/admin/users/{id}/toggle
    public function toggle(int $id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => !$user->is_active]);
        return response()->json($this->format($user->fresh(['consultant'])));
    }

    // DELETE /api/admin/users/{id}
    public function destroy(int $id)
    {
        $user = User::findOrFail($id);
        // prevent deleting yourself
        if (auth()->id() === $id) {
            return response()->json(['message' => 'لا يمكن حذف حسابك الشخصي'], 422);
        }
        $user->delete();
        return response()->json(['message' => 'تم حذف المستخدم']);
    }

    // POST /api/admin/users/{id}/avatar
    public function uploadAvatar(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ], [
            'avatar.required' => 'يرجى اختيار صورة',
            'avatar.image'    => 'يجب أن يكون الملف صورة',
            'avatar.max'      => 'حجم الصورة يجب أن لا يتجاوز 2 ميغابايت',
        ]);

        if ($user->logo) {
            Storage::disk('public')->delete($user->logo);
        }

        $path = $request->file('avatar')->store('user-avatars', 'public');
        $user->update(['logo' => $path]);

        return response()->json($this->format($user->fresh(['consultant'])));
    }

    private function format(User $u): array
    {
        return [
            'id'         => $u->id,
            'name'       => $u->rep_name ?: ($u->org_name ?: $u->email),
            'org_name'   => $u->org_name,
            'rep_name'   => $u->rep_name,
            'email'      => $u->email,
            'phone'      => $u->phone,
            'role'       => $u->role,
            'is_active'  => $u->is_active ?? true,
            'created_at' => $u->created_at?->format('Y/m/d'),
            'last_login' => $u->updated_at?->diffForHumans(),
            'avatar'     => mb_substr($u->rep_name ?? $u->org_name ?? $u->email ?? '?', 0, 1),
            'avatar_url'  => $u->logo
                ? Storage::disk('public')->url($u->logo)
                : ($u->consultant?->avatar ? Storage::disk('public')->url($u->consultant->avatar) : null),
            'permissions' => $u->permissions ?? [],
        ];
    }

    // PUT /api/admin/users/{id}/permissions
    public function updatePermissions(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'permissions'   => 'present|array',
            'permissions.*' => 'string',
        ]);

        $user->update(['permissions' => $request->permissions]);

        return response()->json($this->format($user->fresh(['consultant'])));
    }
}
