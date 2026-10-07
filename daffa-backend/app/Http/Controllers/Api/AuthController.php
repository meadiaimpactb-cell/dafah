<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\EmailVerificationMail;
use App\Models\ActivityLog;
use App\Models\EmailVerification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ── Helper: generate & store OTP ────────────────────────────────────────────
    private function sendOtp(string $email, string $name): void
    {
        EmailVerification::where('email', $email)->delete();

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        EmailVerification::create([
            'email'      => $email,
            'code'       => $code,
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($email)->send(new EmailVerificationMail($code, $name));
    }

    // ── POST /api/auth/register ──────────────────────────────────────────────────
    public function register(Request $request)
    {
        $validated = $request->validate([
            'org_name'         => 'required|string|max:255',
            'org_type'         => 'required|string|max:100',
            'rep_name'         => 'required|string|max:255',
            'email'            => 'required|email|unique:users,email',
            'phone'            => 'required|string|max:20|unique:users,phone',
            'sector'           => 'nullable|string|max:100',
            'logo'             => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'password'         => 'required|string|min:8|confirmed',
        ], [
            'email.unique' => 'البريد الإلكتروني مسجّل مسبقاً',
            'phone.unique' => 'رقم الهاتف مسجّل مسبقاً',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('org-logos', 'public');
        }

        $user = User::create([
            'org_name'          => $validated['org_name'],
            'org_type'          => $validated['org_type'],
            'rep_name'          => $validated['rep_name'],
            'email'             => $validated['email'],
            'phone'             => $validated['phone'],
            'sector'            => $validated['sector'] ?? null,
            'logo'              => $logoPath,
            'password'          => Hash::make($validated['password']),
            'role'              => 'client',
            'email_verified_at' => null,
        ]);

        $this->sendOtp($user->email, $user->org_name ?: $user->rep_name);

        ActivityLog::record($user->id, 'تسجيل حساب جديد — بانتظار التحقق', 'auth', 'client',
            $user->org_name . ' — ' . $user->email);

        return response()->json([
            'needs_verification' => true,
            'email'              => $user->email,
            'message'            => 'تم التسجيل. أُرسل رمز التحقق إلى بريدك الإلكتروني.',
        ], 201);
    }

    // ── POST /api/auth/verify-email ──────────────────────────────────────────────
    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ]);

        $verification = EmailVerification::where('email', $request->email)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (!$verification || $verification->isExpired()) {
            return response()->json(['message' => 'الرمز منتهي الصلاحية، اطلب رمزاً جديداً.'], 422);
        }

        if ($verification->code !== $request->code) {
            return response()->json(['message' => 'الرمز غير صحيح، تحقق وأعد المحاولة.'], 422);
        }

        $verification->update(['used_at' => now()]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'المستخدم غير موجود.'], 404);
        }

        $user->update(['email_verified_at' => now()]);

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLog::record($user->id, 'تحقق من البريد الإلكتروني', 'auth', $user->role,
            $user->org_name . ' — ' . $user->email);

        return response()->json([
            'user'  => $user->fresh(),
            'token' => $token,
        ]);
    }

    // ── POST /api/auth/resend-otp ────────────────────────────────────────────────
    public function resendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $user = User::where('email', $request->email)->first();

        if ($user->email_verified_at) {
            return response()->json(['message' => 'البريد الإلكتروني محقق مسبقاً.'], 422);
        }

        $this->sendOtp($user->email, $user->org_name ?: $user->rep_name);

        return response()->json(['message' => 'تم إرسال رمز جديد إلى بريدك الإلكتروني.']);
    }

    // ── POST /api/auth/login ─────────────────────────────────────────────────────
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'الحساب موقوف، تواصل مع الإدارة.'], 403);
        }

        // If email not verified, send new OTP
        if (!$user->email_verified_at) {
            $this->sendOtp($user->email, $user->org_name ?: $user->rep_name);
            return response()->json([
                'needs_verification' => true,
                'email'              => $user->email,
                'message'            => 'يجب التحقق من بريدك الإلكتروني أولاً. أُرسل رمز جديد.',
            ], 403);
        }

        if (Hash::needsRehash($user->password)) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLog::record($user->id, 'تسجيل دخول', 'auth', $user->role,
            'تسجيل دخول ناجح — ' . ($user->org_name ?: $user->rep_name ?: $user->email));

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    // ── POST /api/auth/google ────────────────────────────────────────────────────
    public function googleLogin(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $request->token,
        ]);

        if (!$response->successful()) {
            return response()->json(['message' => 'رمز Google غير صالح.'], 422);
        }

        $data = $response->json();

        $clientId = config('services.google.client_id');
        if ($clientId && isset($data['aud']) && $data['aud'] !== $clientId) {
            return response()->json(['message' => 'رمز Google غير مصرح به.'], 422);
        }

        $email    = $data['email'] ?? null;
        $name     = $data['name'] ?? ($data['given_name'] ?? 'مستخدم Google');
        $googleId = $data['sub'] ?? null;
        $emailVerified = filter_var($data['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (!$email) {
            return response()->json(['message' => 'لم يتم الحصول على البريد الإلكتروني من Google.'], 422);
        }

        if (!$emailVerified) {
            return response()->json(['message' => 'Google email is not verified.'], 422);
        }

        if (!$googleId) {
            return response()->json(['message' => 'Google account id is missing.'], 422);
        }

        $user = User::where('email', $email)->orWhere('google_id', $googleId)->first();

        if (!$user) {
            $user = User::create([
                'org_name'          => $name,
                'org_type'          => 'غير ربحية',
                'rep_name'          => $name,
                'email'             => $email,
                'google_id'         => $googleId,
                'password'          => Hash::make(Str::random(32)),
                'role'              => 'client',
                'is_active'         => true,
                'email_verified_at' => now(),
            ]);

            ActivityLog::record($user->id, 'تسجيل حساب جديد عبر Google', 'auth', 'client', $email);
        } else {
            $updates = [];

            if (!$user->google_id && $googleId) {
                $updates['google_id'] = $googleId;
            }

            if (!$user->email_verified_at) {
                $updates['email_verified_at'] = now();
            }

            if ($updates) {
                $user->update($updates);
            }
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'الحساب موقوف، تواصل مع الإدارة.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLog::record($user->id, 'تسجيل دخول عبر Google', 'auth', $user->role, $email);

        return response()->json([
            'user'          => $user->fresh(),
            'token'         => $token,
            'needs_profile' => !$user->phone,
        ]);
    }

    // ── POST /api/auth/logout ────────────────────────────────────────────────────
    public function logout(Request $request)
    {
        $user = $request->user();
        ActivityLog::record($user->id, 'تسجيل خروج', 'auth', $user->role,
            $user->org_name ?: $user->rep_name ?: $user->email);
        $user->currentAccessToken()->delete();

        return response()->json(['message' => 'تم تسجيل الخروج بنجاح.']);
    }

    // ── GET /api/auth/me ─────────────────────────────────────────────────────────
    public function me(Request $request)
    {
        $user = $request->user();
        $data = $user->toArray();

        $consultant = null;
        if ($user->role === 'consultant') {
            $consultant = \App\Models\Consultant::where('user_id', $user->id)->first();
            $data['specialty']        = $consultant?->specialty;
            $data['bio']              = $consultant?->bio;
            $data['experience_years'] = $consultant?->experience_years;
        }

        $data['logo_url'] = $user->logo
            ? Storage::disk('public')->url($user->logo)
            : ($consultant?->avatar ? Storage::disk('public')->url($consultant->avatar) : null);

        return response()->json($data);
    }

    // ── POST /api/auth/profile/avatar ────────────────────────────────────────────
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ], [
            'avatar.required' => 'يرجى اختيار صورة',
            'avatar.image'    => 'يجب أن يكون الملف صورة',
            'avatar.max'      => 'حجم الصورة يجب أن لا يتجاوز 2 ميغابايت',
        ]);

        $user = $request->user();

        if ($user->logo) {
            Storage::disk('public')->delete($user->logo);
        }

        $path = $request->file('avatar')->store('user-avatars', 'public');
        $user->update(['logo' => $path]);

        if ($user->role === 'consultant') {
            $consultant = \App\Models\Consultant::where('user_id', $user->id)->first();
            if ($consultant) {
                if ($consultant->avatar) {
                    Storage::disk('public')->delete($consultant->avatar);
                }
                $consultant->update(['avatar' => $path]);
            }
        }

        $data = $user->fresh()->toArray();
        $data['logo_url'] = Storage::disk('public')->url($path);

        return response()->json($data);
    }

    // ── PUT /api/auth/profile ─────────────────────────────────────────────────────
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $rules = [
            'rep_name' => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email,' . $user->id,
            'phone'    => 'nullable|string|max:20',
        ];

        if ($user->role === 'client') {
            $rules['org_name'] = 'required|string|max:255';
            $rules['org_type'] = 'nullable|string|max:100';
            $rules['sector']   = 'nullable|string|max:100';
        }

        $validated = $request->validate($rules);
        $user->update($validated);

        if ($user->role === 'consultant') {
            $consultant = \App\Models\Consultant::where('user_id', $user->id)->first();
            if ($consultant) {
                $consultant->update(array_filter([
                    'name'             => $request->rep_name,
                    'specialty'        => $request->specialty,
                    'bio'              => $request->bio,
                    'experience_years' => $request->experience_years,
                ], fn($v) => $v !== null));
            }
        }

        return response()->json($user->fresh());
    }

    // ── PUT /api/auth/password ────────────────────────────────────────────────────
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'كلمة المرور الحالية غير صحيحة'], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json(['message' => 'تم تغيير كلمة المرور بنجاح']);
    }
}
