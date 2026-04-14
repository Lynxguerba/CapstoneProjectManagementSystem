<?php

use App\Http\Controllers\Auth\ImpersonationController;
use App\Http\Controllers\Auth\LoginController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::guard('web')->check()) {
        $user = Auth::guard('web')->user();

        if ($user !== null) {
            $routeName = (string) $user->role.'.dashboard';

            if (Route::has($routeName)) {
                return redirect()->route($routeName);
            }
        }
    }

    return Inertia::render('login');
})->name('login');

Route::get('/login', function () {
    return redirect()->route('login');
})->name('login.show');

Route::get('/architecture-flow', function () {
    return Inertia::render('architecture-flow');
})->name('architecture-flow');

Route::post('/login', [LoginController::class, 'store'])->name('login.store');
Route::post('/register', [LoginController::class, 'register'])->name('register.store');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
Route::post('/switch-role', \App\Http\Controllers\Auth\SwitchRoleController::class)
    ->name('switch-role')
    ->middleware('auth');
Route::get('/admin/impersonate/search', [ImpersonationController::class, 'search'])
    ->name('impersonation.search')
    ->middleware('auth');
Route::post('/admin/impersonate', [ImpersonationController::class, 'store'])
    ->name('impersonation.store')
    ->middleware('auth');
Route::post('/admin/impersonate/leave', [ImpersonationController::class, 'destroy'])
    ->name('impersonation.destroy')
    ->middleware('auth');
