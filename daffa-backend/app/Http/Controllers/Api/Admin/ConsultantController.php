<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Consultant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ConsultantController extends Controller
{
    public function index()
    {
        $consultants = Consultant::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($consultants->map(fn($c) => $this->withAvatarUrl($c)));
    }

    private function withAvatarUrl(Consultant $c): array
    {
        $data = $c->toArray();
        $data['avatar_url'] = $c->avatar ? Storage::disk('public')->url($c->avatar) : null;
        return $data;
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'               => 'required|string|max:100',
            'specialty'          => 'required|string|max:100',
            'bio'                => 'nullable|string',
            'experience_years'   => 'required|integer|min:0|max:50',
            'completed_projects' => 'required|integer|min:0',
            'rating'             => 'required|numeric|min:0|max:5',
            'available'          => 'boolean',
            'avatar_initial'     => 'nullable|string|max:5',
            'email'              => 'nullable|email|unique:users,email',
            'password'           => 'nullable|string|min:6|required_with:email',
        ], [
            'email.unique'           => 'البريد الإلكتروني مسجّل مسبقاً في حساب آخر',
            'password.required_with' => 'كلمة المرور مطلوبة عند إدخال البريد الإلكتروني',
            'password.min'           => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'name.required'          => 'اسم المستشار مطلوب',
            'specialty.required'     => 'التخصص مطلوب',
        ]);

        // إنشاء حساب مستخدم للمستشار إذا أُدخل بريد إلكتروني
        $userId = null;
        if ($request->filled('email')) {
            $user = User::create([
                'rep_name' => $request->name,
                'org_name' => $request->name,
                'org_type' => 'مستشار',
                'phone'    => '0000000000',
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'role'     => 'consultant',
            ]);
            $userId = $user->id;
        }

        $consultant = Consultant::create([
            'user_id'            => $userId,
            'name'               => $request->name,
            'specialty'          => $request->specialty,
            'bio'                => $request->bio,
            'experience_years'   => $request->experience_years,
            'completed_projects' => $request->completed_projects,
            'rating'             => $request->rating,
            'available'          => $request->boolean('available', true),
            'avatar_initial'     => $request->avatar_initial ?: mb_substr($request->name, 0, 1),
        ]);

        return response()->json($this->withAvatarUrl($consultant->load('user')), 201);
    }

    public function show(Consultant $consultant)
    {
        return response()->json($this->withAvatarUrl($consultant->load('user')));
    }

    public function update(Request $request, Consultant $consultant)
    {
        $existingUserId = $consultant->user_id;
        $emailRule = $existingUserId
            ? "nullable|email|unique:users,email,{$existingUserId}"
            : 'nullable|email|unique:users,email';

        $request->validate([
            'name'               => 'sometimes|string|max:100',
            'specialty'          => 'sometimes|string|max:100',
            'bio'                => 'nullable|string',
            'experience_years'   => 'sometimes|integer|min:0|max:50',
            'completed_projects' => 'sometimes|integer|min:0',
            'rating'             => 'sometimes|numeric|min:0|max:5',
            'available'          => 'boolean',
            'avatar_initial'     => 'nullable|string|max:5',
            'email'              => $emailRule,
            'password'           => 'nullable|string|min:6|required_with:email',
        ], [
            'email.unique'           => 'البريد الإلكتروني مسجّل مسبقاً في حساب آخر',
            'password.required_with' => 'كلمة المرور مطلوبة عند إدخال البريد الإلكتروني',
            'password.min'           => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        ]);

        // إنشاء حساب دخول إذا لم يكن للمستشار حساب بعد
        if ($request->filled('email') && !$consultant->user_id) {
            $user = User::create([
                'rep_name' => $consultant->name,
                'org_name' => $consultant->name,
                'org_type' => 'مستشار',
                'phone'    => '0000000000',
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'role'     => 'consultant',
            ]);
            $consultant->update(['user_id' => $user->id]);
        }

        $data = $request->only([
            'name', 'specialty', 'bio', 'experience_years',
            'completed_projects', 'rating', 'available', 'avatar_initial',
        ]);
        $consultant->update(array_filter($data, fn($v) => $v !== null));

        return response()->json($this->withAvatarUrl($consultant->fresh(['user'])));
    }

    public function destroy(Consultant $consultant)
    {
        if ($consultant->avatar) {
            Storage::disk('public')->delete($consultant->avatar);
        }
        $consultant->delete();
        return response()->json(['message' => 'تم حذف المستشار بنجاح']);
    }

    public function toggle(Consultant $consultant)
    {
        $consultant->update(['available' => !$consultant->available]);
        return response()->json($this->withAvatarUrl($consultant->fresh()));
    }

    public function uploadAvatar(Request $request, Consultant $consultant)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ], [
            'avatar.required' => 'يرجى اختيار صورة',
            'avatar.image'    => 'يجب أن يكون الملف صورة',
            'avatar.max'      => 'حجم الصورة يجب أن لا يتجاوز 2 ميغابايت',
        ]);

        if ($consultant->avatar) {
            Storage::disk('public')->delete($consultant->avatar);
        }

        $path = $request->file('avatar')->store('consultant-avatars', 'public');
        $consultant->update(['avatar' => $path]);

        return response()->json($this->withAvatarUrl($consultant->fresh(['user'])));
    }
}
