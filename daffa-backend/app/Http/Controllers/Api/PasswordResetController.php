<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class PasswordResetController extends Controller
{
    /**
     * إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني.
     * نُرجع نفس الرسالة بغض النظر عن وجود البريد أو لا (أمان).
     */
    public function sendLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => 'البريد الإلكتروني مطلوب',
            'email.email'    => 'صيغة البريد الإلكتروني غير صحيحة',
        ]);

        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة تحتوي على رابط إعادة التعيين.',
        ]);
    }

    /**
     * تعيين كلمة المرور الجديدة باستخدام التوكن.
     */
    public function reset(Request $request)
    {
        $request->validate([
            'token'                 => 'required',
            'email'                 => 'required|email',
            'password'              => 'required|min:8|confirmed',
            'password_confirmation' => 'required',
        ], [
            'token.required'                 => 'رابط إعادة التعيين غير صالح',
            'email.required'                 => 'البريد الإلكتروني مطلوب',
            'password.required'              => 'كلمة المرور الجديدة مطلوبة',
            'password.min'                   => 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
            'password.confirmed'             => 'كلمتا المرور غير متطابقتين',
            'password_confirmation.required' => 'تأكيد كلمة المرور مطلوب',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                // الـ 'hashed' cast في User model يتولى التشفير تلقائياً
                $user->forceFill(['password' => $password])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.']);
        }

        return response()->json([
            'message' => 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.',
        ], 422);
    }
}
