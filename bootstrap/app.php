<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PreventBackHistory;
use App\Http\Middleware\RecordAdminAuditLog;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        then: function () {
            Route::middleware('web')
                ->group(base_path('routes/admin.php'));
            Route::middleware('web')
                ->group(base_path('routes/instructor.php'));
            Route::middleware('web')
                ->group(base_path('routes/student.php'));
            Route::middleware('web')
                ->group(base_path('routes/adviser.php'));
            Route::middleware('web')
                ->group(base_path('routes/panelist.php'));
            Route::middleware('web')
                ->group(base_path('routes/dean.php'));
            Route::middleware('web')
                ->group(base_path('routes/program_chairperson.php'));
        },
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            PreventBackHistory::class,
            RecordAdminAuditLog::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (SymfonyResponse $response, \Throwable $exception, Request $request): SymfonyResponse {
            if ($request->expectsJson()) {
                return $response;
            }

            return match ($response->getStatusCode()) {
                403 => Inertia::render('Error/Forbidden')->toResponse($request)->setStatusCode(403),
                404 => Inertia::render('Error/NotFound')->toResponse($request)->setStatusCode(404),
                419 => Inertia::render('Error/PageExpired')->toResponse($request)->setStatusCode(419),
                default => $response,
            };
        });
    })->create();
