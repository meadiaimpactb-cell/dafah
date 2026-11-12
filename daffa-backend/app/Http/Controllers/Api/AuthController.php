<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use App\Rules\RealEmail;
use App\Support\EmailOtp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ── Helper: إرسال رمز تأكيد البريد (انظر App\Support\EmailOtp) ──────────────
    private function sendOtp(User $user): array
    {
        return EmailOtp::send($user->email, $user->org_name ?: $user->rep_name ?: '', EmailOtp::VERIFY, $user->id);
    }

    /** استجابة «يلزم تأكيد البريد» الموحّدة (لا تحتوي الرمز أبدًا) */
    private function needsVerification(User $user, array $sent, string $sentText, int $status)
    {
        return response()->json([
            'needs_verification' => true,
            'email'              => $user->email,
            'send_status'        => $sent['status'],
            'retry_after'        => $sent['retry_after'],
            'message'            => EmailOtp::sendMessage($sent, $sentText),
        ], $status);
    }

    // ── POST /api/auth/register ──────────────────────────────────────────────────
    public function register(Request $request)
    {
        $request->merge(['email' => RealEmail::normalize($request->input('email'))]);

        $validated = $request->validate([
            'org_name'         => 'required|string|max:255',
            'org_type'         => 'required|string|max:100',
            'rep_name'         => 'required|string|max:255',
            'email'            => RealEmail::rules(),
            'phone'            => 'required|string|max:20|unique:users,phone',
            'sector'           => 'nullable|string|max:100',
            'logo'             => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'password'         => 'required|string|min:8|confirmed',
        ], RealEmail::messages() + [
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

        $sent = $this->sendOtp($user);

        ActivityLog::record($user->id, 'تسجيل حساب جديد — بانتظار التحقق', 'auth', 'client',
            $user->org_name . ' — ' . $user->email);

        return $this->needsVerification($user, $sent,
            'تم إنشاء حسابك. أرسلنا رمز التأكيد إلى بريدك الإلكتروني — أدخله لتفعيل الحساب.', 201);
    }

    // ── POST /api/auth/verify-email ──────────────────────────────────────────────
    public function verifyEmail(Request $request)
    {
        $request->merge(['email' => RealEmail::normalize($request->input('email'))]);
        $request->validate([
            'email' => 'required|email',
            'code'  => ['required', 'string', 'regex:/^[0-9]{6}$/'],
        ], [
            'code.required' => 'رمز التحقق مطلوب.',
            'code.regex'    => 'الرمز يتكوّن من 6 أرقام.',
        ]);

        $user = User::where('email', $request->email)->first();
        $result = $user ? EmailOtp::check($user->email, $request->code, EmailOtp::VERIFY) : 'expired';

        if ($result !== 'ok') {
            return response()->json([
                'message' => EmailOtp::checkMessage($result),
                'errors'  => ['code' => [EmailOtp::checkMessage($result)]],
                'locked'  => $result === 'locked',
            ], 422);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'الحساب موقوف، تواصل مع الإدارة.'], 403);
        }

        if (!$user->email_verified_at) {
            $user->update(['email_verified_at' => now()]);
        }

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
        $request->merge(['email' => RealEmail::normalize($request->input('email'))]);
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // لا نكشف وجود الحساب أو حالته: الرد نفسه إن لم يكن هناك حساب بانتظار التأكيد
        if (!$user || $user->email_verified_at) {
            return response()->json([
                'message'     => 'إن كان هذا البريد بانتظار التأكيد فسيصلك رمز جديد خلال دقائق.',
                'retry_after' => EmailOtp::RESEND_SECONDS,
            ]);
        }

        $sent = $this->sendOtp($user);
        $status = ['sent' => 200, 'throttled' => 429, 'failed' => 503][$sent['status']];

        return response()->json([
            'message'     => EmailOtp::sendMessage($sent, 'أرسلنا رمزًا جديدًا إلى بريدك الإلكتروني.'),
            'retry_after' => $sent['retry_after'],
        ], $status);
    }

    // ── POST /api/auth/login ─────────────────────────────────────────────────────
    public function login(Request $request)
    {
        $request->merge(['email' => RealEmail::normalize($request->input('email'))]);
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

        // البريد غير مؤكَّد: نرسل رمزًا (مع مهلة إعادة الإرسال) ونطلب التأكيد قبل الدخول
        if (!$user->email_verified_at) {
            return $this->needsVerification($user, $this->sendOtp($user),
                'يجب تأكيد بريدك الإلكتروني قبل الدخول. أرسلنا رمز التأكيد إلى بريدك.', 403);
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

        // لا يُقبل الدخول عبر Google إلا بمعرّف عميل مضبوط، ويجب أن يكون الرمز صادرًا له تحديدًا
        // (بدونه يمكن استعمال رمز Google صادر لموقع آخر للدخول إلى حساب هنا)
        $clientId = config('services.google.client_id');
        if (!$clientId) {
            return response()->json(['message' => 'تسجيل الدخول عبر Google غير مفعّل حاليًا.'], 503);
        }

        $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $request->token,
        ]);

        if (!$response->successful()) {
            return response()->json(['message' => 'رمز Google غير صالح.'], 422);
        }

        $data = $response->json();

        if (($data['aud'] ?? null) !== $clientId) {
            return response()->json(['message' => 'رمز Google غير مصرح به.'], 422);
        }

        $email    = RealEmail::normalize($data['email'] ?? null);
        $name     = $data['name'] ?? ($data['given_name'] ?? 'مستخدم Google');
        $googleId = $data['sub'] ?? null;
        $emailVerified = filter_var($data['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (!$email) {
            return response()->json(['message' => 'لم يتم الحصول على البريد الإلكتروني من Google.'], 422);
        }

        if (!$emailVerified) {
            return response()->json(['message' => 'بريد حساب Google هذا غير مؤكَّد لدى Google. أكّده أولًا ثم أعد المحاولة.'], 422);
        }

        if (!$googleId) {
            return response()->json(['message' => 'تعذّر التعرف على حساب Google. حاول مرة أخرى.'], 422);
        }

        $user = User::where('google_id', $googleId)->first() ?: User::where('email', $email)->first();
        $isNew = false;

        if (!$user) {
            $domain = substr(strrchr($email, '@') ?: '', 1);
            if ($domain === '' || RealEmail::isDisposable($domain)) {
                return response()->json(['message' => 'لا يُقبل البريد المؤقت أو الوهمي — استخدم حساب Google ببريد حقيقي.'], 422);
            }
            $isNew = true;
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
            'needs_profile' => $user->role === 'client' && !$user->phone,
            'is_new'        => $isNew,
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

        $request->merge(['email' => RealEmail::normalize($request->input('email'))]);

        $rules = [
            'rep_name' => 'required|string|max:255',
            'email'    => RealEmail::rules($user->id),
            'phone'    => 'nullable|string|max:20',
        ];

        if ($user->role === 'client') {
            $rules['org_name'] = 'required|string|max:255';
            $rules['org_type'] = 'nullable|string|max:100';
            $rules['sector']   = 'nullable|string|max:100';
        }

        $validated = $request->validate($rules, RealEmail::messages());

        // تغيير البريد لا يُطبَّق مباشرة: يُرسل رمز إلى البريد الجديد ولا يتغير إلا بعد تأكيده
        $newEmail = $validated['email'];
        unset($validated['email']);
        $emailChange = null;
        if (mb_strtolower($newEmail) !== mb_strtolower($user->email)) {
            $sent = EmailOtp::send($newEmail, $user->org_name ?: $user->rep_name ?: '', EmailOtp::EMAIL_CHANGE, $user->id);
            $emailChange = [
                'pending'     => $newEmail,
                'send_status' => $sent['status'],
                'retry_after' => $sent['retry_after'],
                'message'     => EmailOtp::sendMessage($sent, "أرسلنا رمز التأكيد إلى {$newEmail}. لن يتغير بريد حسابك إلا بعد إدخال الرمز."),
            ];
        }

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

        $data = $user->fresh()->toArray();
        if ($emailChange) {
            $data['email_change'] = $emailChange;
        }
        return response()->json($data);
    }

    // ── POST /api/auth/profile/email/resend ─────────────────────────────────────
    // إعادة إرسال رمز تأكيد البريد الجديد
    public function resendEmailChange(Request $request)
    {
        $user = $request->user();
        $request->merge(['email' => RealEmail::normalize($request->input('email'))]);
        $request->validate(['email' => RealEmail::rules($user->id)], RealEmail::messages());

        $sent = EmailOtp::send($request->email, $user->org_name ?: $user->rep_name ?: '', EmailOtp::EMAIL_CHANGE, $user->id);
        $status = ['sent' => 200, 'throttled' => 429, 'failed' => 503][$sent['status']];

        return response()->json([
            'message'     => EmailOtp::sendMessage($sent, 'أرسلنا رمزًا جديدًا إلى البريد الجديد.'),
            'retry_after' => $sent['retry_after'],
        ], $status);
    }

    // ── POST /api/auth/profile/email/confirm ────────────────────────────────────
    // تأكيد البريد الجديد بالرمز ثم تطبيق التغيير
    public function confirmEmailChange(Request $request)
    {
        $user = $request->user();
        $request->merge(['email' => RealEmail::normalize($request->input('email'))]);
        $request->validate([
            'email' => RealEmail::rules($user->id),
            'code'  => ['required', 'string', 'regex:/^[0-9]{6}$/'],
        ], RealEmail::messages() + [
            'code.required' => 'رمز التحقق مطلوب.',
            'code.regex'    => 'الرمز يتكوّن من 6 أرقام.',
        ]);

        $result = EmailOtp::check($request->email, $request->code, EmailOtp::EMAIL_CHANGE, $user->id);
        if ($result !== 'ok') {
            return response()->json([
                'message' => EmailOtp::checkMessage($result),
                'errors'  => ['code' => [EmailOtp::checkMessage($result)]],
                'locked'  => $result === 'locked',
            ], 422);
        }

        $old = $user->email;
        $user->update(['email' => $request->email, 'email_verified_at' => now()]);

        ActivityLog::record($user->id, 'تغيير البريد الإلكتروني بعد التأكيد', 'auth', $user->role, "{$old} ← {$request->email}");

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
