<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: ['api/*']);
        $middleware->alias(['role' => \App\Http\Middleware\EnsureRole::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // تجاوز حد المحاولات في الـ API: رسالة عربية + مدة الانتظار
        $exceptions->render(function (\Illuminate\Http\Exceptions\ThrottleRequestsException $e, $request) {
            if ($request->is('api/*')) {
                $retry = (int) ($e->getHeaders()['Retry-After'] ?? 60);
                return response()->json([
                    'message'     => "محاولات كثيرة خلال وقت قصير. انتظر {$retry} ثانية ثم أعد المحاولة.",
                    'retry_after' => $retry,
                ], 429, $e->getHeaders());
            }
        });
    })->create();
