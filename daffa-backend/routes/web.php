<?php

use App\Http\Controllers\Api\OperationalController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\StrategicController;
use App\Http\Controllers\PublicPageController;
use Illuminate\Support\Facades\Route;

// الصفحات العامة: index.html المبني مع عنوان ووصف ورابط قانوني وبيانات منظّمة ومحتوى حقيقي لكل رابط (SEO)
// بلا جلسة ولا كوكيز: الجلسات في قاعدة البيانات على الاستضافة، والصفحات العامة يجب ألا تلمسها مع كل زيارة
$stateless = [
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    \Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class,
];
Route::get('/', [PublicPageController::class, 'show'])->defaults('page', 'home')->withoutMiddleware($stateless);
foreach (['about', 'services', 'pricing', 'contact', 'privacy', 'terms', 'login', 'register'] as $seoPage) {
    Route::get('/'.$seoPage, [PublicPageController::class, 'show'])->defaults('page', $seoPage)->withoutMiddleware($stateless);
}
Route::get('/sitemap.xml', [PublicPageController::class, 'sitemap'])->withoutMiddleware($stateless);
Route::get('/robots.txt', [PublicPageController::class, 'robots'])->withoutMiddleware($stateless);

// PDF download via signed URL (no session/token required — signature IS the auth)
Route::get('/pdf/strategic', [StrategicController::class, 'downloadPDFSigned'])
    ->name('pdf.strategic');

Route::get('/pdf/operational', [OperationalController::class, 'downloadPDFSigned'])
    ->name('pdf.operational');

Route::get('/pdf/policy', [PolicyController::class, 'downloadPDFSigned'])
    ->name('pdf.policy');

Route::get('/pdf/invoice', [OrderController::class, 'showInvoice'])
    ->name('pdf.invoice');
