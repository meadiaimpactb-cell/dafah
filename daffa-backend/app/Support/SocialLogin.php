<?php

namespace App\Support;

use App\Models\ActivityLog;
use App\Models\User;
use App\Rules\RealEmail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * الدخول/التسجيل عبر Google وFacebook وLinkedIn (OAuth 2.0 — Authorization Code).
 *
 * - أزرار المزوّدين الثلاثة ظاهرة دائمًا؛ ويعمل المزوّد فقط متى ضُبط معرّفه وسرّه في ‎.env‏ الخادم (لا أسرار في Git ولا في الواجهة)، وإلا ظهر زره معطّلًا.
 * - حساب جديد ← عميل مؤكَّد البريد يُكمل بيانات منظمته بعد الدخول (needs_profile).
 * - بريد موجود مسبقًا ← يُربط الحساب الاجتماعي به (البريد مؤكَّد لدى المزوّد).
 */
class SocialLogin
{
    public const PROVIDERS = ['google', 'facebook', 'linkedin'];

    public const LABELS = ['google' => 'Google', 'facebook' => 'Facebook', 'linkedin' => 'LinkedIn'];

    private const COLUMNS = ['google' => 'google_id', 'facebook' => 'facebook_id', 'linkedin' => 'linkedin_id'];

    private const GRAPH = 'https://graph.facebook.com/v19.0';

    public static function enabled(string $provider): bool
    {
        return in_array($provider, self::PROVIDERS, true)
            && config("services.$provider.client_id")
            && config("services.$provider.client_secret");
    }

    /**
     * المزوّدون الثلاثة دائمًا مع حالة كلٍّ منهم: `enabled` صحيح متى ضُبط معرّفه وسرّه في ‎.env‏ الخادم.
     * الواجهة تعرض زر المزوّد غير المفعّل معطّلًا (بانتظار التفعيل) — ومعرّف عميل Google (عام) يُعاد فقط عند تفعيله لنافذة الدخول بنقرة واحدة.
     */
    public static function available(): array
    {
        $out = [];
        foreach (self::PROVIDERS as $p) {
            $on = self::enabled($p);
            $out[] = ['key' => $p, 'label' => self::LABELS[$p], 'enabled' => $on]
                + ($on && $p === 'google' ? ['client_id' => config('services.google.client_id')] : []);
        }

        return $out;
    }

    public static function callbackUrl(string $provider): string
    {
        $base = rtrim(config('services.social.base_url') ?: config('app.url'), '/');

        return "$base/api/auth/social/$provider/callback";
    }

    public static function frontendUrl(): string
    {
        return rtrim(config('app.frontend_url') ?: env('FRONTEND_URL') ?: config('app.url'), '/');
    }

    public static function authorizeUrl(string $provider, string $state): string
    {
        $id = config("services.$provider.client_id");
        $redirect = self::callbackUrl($provider);

        return match ($provider) {
            'google' => 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
                'client_id' => $id, 'redirect_uri' => $redirect, 'response_type' => 'code',
                'scope' => 'openid email profile', 'state' => $state, 'prompt' => 'select_account',
                'access_type' => 'online', 'hl' => 'ar',
            ]),
            'facebook' => 'https://www.facebook.com/v19.0/dialog/oauth?'.http_build_query([
                'client_id' => $id, 'redirect_uri' => $redirect, 'response_type' => 'code',
                'scope' => 'email,public_profile', 'state' => $state,
            ]),
            'linkedin' => 'https://www.linkedin.com/oauth/v2/authorization?'.http_build_query([
                'client_id' => $id, 'redirect_uri' => $redirect, 'response_type' => 'code',
                'scope' => 'openid profile email', 'state' => $state,
            ]),
        };
    }

    /**
     * يستبدل رمز التفويض ببيانات المستخدم لدى المزوّد.
     *
     * @return array{id:string,email:?string,verified:bool,name:?string}
     */
    public static function fetchProfile(string $provider, string $code): array
    {
        $id = config("services.$provider.client_id");
        $secret = config("services.$provider.client_secret");
        $redirect = self::callbackUrl($provider);

        if ($provider === 'facebook') {
            $token = Http::timeout(15)->get(self::GRAPH.'/oauth/access_token', [
                'client_id' => $id, 'client_secret' => $secret, 'redirect_uri' => $redirect, 'code' => $code,
            ]);
            $access = $token->json('access_token');
            if (! $token->successful() || ! $access) {
                throw new RuntimeException('تعذّر إكمال الدخول عبر Facebook. حاول مرة أخرى.');
            }
            $me = Http::timeout(15)->get(self::GRAPH.'/me', [
                'fields' => 'id,name,email', 'access_token' => $access,
                'appsecret_proof' => hash_hmac('sha256', $access, $secret),
            ]);
            if (! $me->successful() || ! $me->json('id')) {
                throw new RuntimeException('تعذّر قراءة بيانات حساب Facebook. حاول مرة أخرى.');
            }

            // Facebook لا يعيد إلا البريد المؤكَّد لديه
            return ['id' => (string) $me->json('id'), 'email' => $me->json('email'), 'verified' => (bool) $me->json('email'), 'name' => $me->json('name')];
        }

        $tokenUrl = $provider === 'google' ? 'https://oauth2.googleapis.com/token' : 'https://www.linkedin.com/oauth/v2/accessToken';
        $token = Http::asForm()->timeout(15)->post($tokenUrl, [
            'grant_type' => 'authorization_code', 'code' => $code, 'redirect_uri' => $redirect,
            'client_id' => $id, 'client_secret' => $secret,
        ]);
        $access = $token->json('access_token');
        if (! $token->successful() || ! $access) {
            throw new RuntimeException('تعذّر إكمال الدخول عبر '.self::LABELS[$provider].'. حاول مرة أخرى.');
        }

        $infoUrl = $provider === 'google' ? 'https://openidconnect.googleapis.com/v1/userinfo' : 'https://api.linkedin.com/v2/userinfo';
        $info = Http::withToken($access)->timeout(15)->get($infoUrl);
        if (! $info->successful() || ! $info->json('sub')) {
            throw new RuntimeException('تعذّر قراءة بيانات حساب '.self::LABELS[$provider].'. حاول مرة أخرى.');
        }

        $name = $info->json('name') ?: trim(($info->json('given_name') ?? '').' '.($info->json('family_name') ?? ''));

        return [
            'id' => (string) $info->json('sub'),
            'email' => $info->json('email'),
            'verified' => filter_var($info->json('email_verified') ?? false, FILTER_VALIDATE_BOOLEAN),
            'name' => $name ?: null,
            'picture' => $info->json('picture') ?: null,
        ];
    }

    /**
     * يجد الحساب أو ينشئه ويربطه بالمزوّد.
     *
     * @return array{0:User,1:bool} [المستخدم، هل هو جديد]
     *
     * @throws RuntimeException برسالة عربية جاهزة للعرض
     */
    public static function resolveUser(string $provider, ?string $providerId, ?string $email, bool $verified, ?string $name, ?string $picture = null): array
    {
        $label = self::LABELS[$provider];
        $column = self::COLUMNS[$provider];
        $email = RealEmail::normalize($email);

        if (! $providerId) {
            throw new RuntimeException("تعذّر التعرف على حساب $label. حاول مرة أخرى.");
        }

        $user = User::where($column, $providerId)->first();

        if (! $user) {
            if (! $email) {
                throw new RuntimeException("حساب $label لا يتيح بريدًا إلكترونيًا للمنصة. أضف بريدًا لحسابك أو سجّل بالبريد الإلكتروني.");
            }
            if (! $verified) {
                throw new RuntimeException("بريد حساب $label هذا غير مؤكَّد لديه. أكّده أولًا ثم أعد المحاولة.");
            }
            $user = User::where('email', $email)->first();
        }

        $isNew = false;
        $name = $name ?: "مستخدم $label";

        if (! $user) {
            $domain = substr(strrchr($email, '@') ?: '', 1);
            if ($domain === '' || RealEmail::isDisposable($domain)) {
                throw new RuntimeException("لا يُقبل البريد المؤقت أو الوهمي — استخدم حساب $label ببريد حقيقي.");
            }
            $isNew = true;
            // البيانات الأساسية من الحساب فقط؛ اسم المنظمة ونوعها والجوال يكملها العميل في «استكمال الملف»
            $user = User::create([
                'org_name' => '',
                'org_type' => '',
                'rep_name' => $name,
                'email' => $email,
                $column => $providerId,
                'password' => Hash::make(Str::random(32)),
                'role' => 'client',
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
            ActivityLog::record($user->id, "تسجيل حساب جديد عبر $label", 'auth', 'client', $email);
            self::savePicture($user, $picture);
        } else {
            $updates = [];
            if (! $user->{$column}) {
                $updates[$column] = $providerId;
            }
            if (! $user->email_verified_at) {
                $updates['email_verified_at'] = now();
            }
            if ($updates) {
                $user->update($updates);
            }
        }

        if (! $user->is_active) {
            throw new RuntimeException('الحساب موقوف، تواصل مع الإدارة.', 403);
        }

        return [$user, $isNew];
    }

    /** صورة الحساب من المزوّد تصبح صورة الملف (روابط Google/LinkedIn الرسمية فقط، حتى 2MB) — فشلها لا يمنع الدخول */
    public static function savePicture(User $user, ?string $url): void
    {
        if (! $url || $user->logo || ! preg_match('#^https://([a-z0-9-]+\.)*(googleusercontent\.com|licdn\.com|fbcdn\.net)/#i', $url)) {
            return;
        }
        try {
            $res = Http::timeout(8)->withOptions(['allow_redirects' => false])->get($url);
            $type = strtolower(explode(';', (string) $res->header('Content-Type'))[0]);
            $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$type] ?? null;
            $body = $res->body();
            if ($res->successful() && $ext && strlen($body) > 0 && strlen($body) <= 2 * 1024 * 1024 && @getimagesizefromstring($body)) {
                $path = 'user-avatars/'.\Illuminate\Support\Str::random(40).'.'.$ext;
                \Illuminate\Support\Facades\Storage::disk('public')->put($path, $body);
                $user->update(['logo' => $path]);
            }
        } catch (\Throwable) {
            // الصورة اختيارية
        }
    }

    /** الاستجابة الموحّدة للدخول (رمز Sanctum + بيانات المستخدم) */
    public static function loginPayload(User $user, bool $isNew, string $provider): array
    {
        $token = $user->createToken('auth_token')->plainTextToken;
        ActivityLog::record($user->id, 'تسجيل دخول عبر '.self::LABELS[$provider], 'auth', $user->role, $user->email);

        $fresh = $user->fresh();
        $data = $fresh->toArray();
        $data['logo_url'] = $fresh->logo ? \Illuminate\Support\Facades\Storage::disk('public')->url($fresh->logo) : null;

        return [
            'user' => $data,
            'token' => $token,
            'needs_profile' => $fresh->role === 'client' && ! $fresh->profile_completed_at,
            'missing' => $fresh->profileMissing(),
            'is_new' => $isNew,
        ];
    }
}
