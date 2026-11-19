<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\SocialLogin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * الدخول عبر Google / Facebook / LinkedIn:
 *  1) GET  /api/auth/social/providers              — المزوّدون المفعّلون (لإظهار الأزرار)
 *  2) GET  /api/auth/social/{provider}/redirect     — توجيه المتصفح إلى صفحة المزوّد (مع state يمنع التزوير)
 *  3) GET  /api/auth/social/{provider}/callback     — عودة المزوّد: التحقق، إيجاد/إنشاء الحساب، ثم العودة للواجهة برمز لمرة واحدة
 *  4) POST /api/auth/social/exchange                — الواجهة تستبدل الرمز (صالح دقيقتين، مرة واحدة) برمز الدخول
 * لا يمرّ رمز الدخول نفسه في الرابط أبدًا.
 */
class SocialAuthController extends Controller
{
    public function providers()
    {
        return response()->json(SocialLogin::available());
    }

    public function redirect(Request $request, string $provider)
    {
        $intent = $request->query('intent') === 'register' ? 'register' : 'login';
        if (! SocialLogin::enabled($provider)) {
            return $this->backToApp(['social_error' => 'الدخول عبر هذه الخدمة غير مفعّل حاليًا.', 'social_intent' => $intent]);
        }

        $state = Str::random(48);
        Cache::put("social_state:$state", ['provider' => $provider, 'intent' => $intent], now()->addMinutes(15));

        return redirect()->away(SocialLogin::authorizeUrl($provider, $state));
    }

    public function callback(Request $request, string $provider)
    {
        $state = (string) $request->query('state', '');
        $saved = $state !== '' ? Cache::pull("social_state:$state") : null;
        $intent = $saved['intent'] ?? 'login';

        if (! $saved || ($saved['provider'] ?? null) !== $provider || ! SocialLogin::enabled($provider)) {
            return $this->backToApp(['social_error' => 'انتهت صلاحية محاولة الدخول. حاول مرة أخرى.', 'social_intent' => $intent]);
        }

        // المستخدم ألغى أو رفض الإذن لدى المزوّد
        if ($request->filled('error') || ! $request->filled('code')) {
            return $this->backToApp(['social_error' => 'لم يكتمل الدخول عبر '.SocialLogin::LABELS[$provider].'.', 'social_intent' => $intent]);
        }

        try {
            $profile = SocialLogin::fetchProfile($provider, (string) $request->query('code'));
            [$user, $isNew] = SocialLogin::resolveUser($provider, $profile['id'], $profile['email'], $profile['verified'], $profile['name']);
        } catch (RuntimeException $e) {
            return $this->backToApp(['social_error' => $e->getMessage(), 'social_intent' => $intent]);
        } catch (Throwable $e) {
            Log::warning("social login [$provider] failed: ".$e->getMessage());

            return $this->backToApp(['social_error' => 'تعذّر الدخول عبر '.SocialLogin::LABELS[$provider].'. حاول مرة أخرى.', 'social_intent' => $intent]);
        }

        $code = Str::random(64);
        Cache::put("social_login:$code", ['user_id' => $user->id, 'is_new' => $isNew, 'provider' => $provider], now()->addMinutes(2));

        return $this->backToApp(['social_code' => $code]);
    }

    public function exchange(Request $request)
    {
        $request->validate(['code' => 'required|string|max:100']);
        $data = Cache::pull('social_login:'.$request->input('code'));
        $user = $data ? User::find($data['user_id']) : null;

        if (! $user) {
            return response()->json(['message' => 'انتهت صلاحية رابط الدخول. حاول مرة أخرى.'], 422);
        }
        if (! $user->is_active) {
            return response()->json(['message' => 'الحساب موقوف، تواصل مع الإدارة.'], 403);
        }

        return response()->json(SocialLogin::loginPayload($user, (bool) $data['is_new'], $data['provider']));
    }

    private function backToApp(array $params)
    {
        return redirect()->away(SocialLogin::frontendUrl().'/?'.http_build_query($params));
    }
}
