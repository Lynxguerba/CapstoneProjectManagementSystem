<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\LoginController;

// 
Route::get('/', function () {
    return Inertia::render('login');
})->name('login');

Route::post('/login', [LoginController::class, 'store'])->name('login.store');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// INSTRUCTOR DASHBOARD
Route::get('/instructor/dashboard', function () {
    return Inertia::render('Instructor/dashboard');
})->name('instructor.dashboard');

// STUDENT DASHBOARD
Route::get('/student/dashboard', function () {
    return Inertia::render('Student/dashboard');
})->name('student.dashboard');

// ADMIN DASHBOARD
Route::get('/admin/dashboard', function () {
    return Inertia::render('Admin/dashboard');
})->name('admin.dashboard');

// ADVISER DASHBOARD
Route::get('/adviser/dashboard', function () {
    return Inertia::render('Adviser/dashboard');
})->name('adviser.dashboard');

// PANELIST DASHBOARD
Route::get('/panelist/dashboard', function () {
    return Inertia::render('Panelist/dashboard');
})->name('panelist.dashboard');

// DEAN DASHBOARD
Route::get('/dean/dashboard', function () {
    return Inertia::render('Dean/dashboard');
})->name('dean.dashboard');

// PROGRAM CHAIRPERSON DASHBOARD
Route::get('/program_chairperson/dashboard', function () {
    return Inertia::render('ProgramChairperson/dashboard');
})->name('program_chairperson.dashboard');