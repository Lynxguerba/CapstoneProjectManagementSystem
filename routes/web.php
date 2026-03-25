<?php

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

Route::post('/login', [LoginController::class, 'store'])->name('login.store');
Route::post('/register', [LoginController::class, 'register'])->name('register.store');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
Route::post('/switch-role', \App\Http\Controllers\Auth\SwitchRoleController::class)
    ->name('switch-role')
    ->middleware('auth');
