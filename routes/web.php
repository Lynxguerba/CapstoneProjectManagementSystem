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

// INSTRUCTOR PAGES (UI ONLY)
Route::get('/instructor/groups', function () {
    return Inertia::render('Instructor/groups');
})->name('instructor.groups');

Route::get('/instructor/titles', function () {
    return Inertia::render('Instructor/titles');
})->name('instructor.titles');

Route::get('/instructor/concepts', function () {
    return Inertia::render('Instructor/concepts');
})->name('instructor.concepts');

Route::get('/instructor/scheduling', function () {
    return Inertia::render('Instructor/scheduling');
})->name('instructor.scheduling');

Route::get('/instructor/evaluation', function () {
    return Inertia::render('Instructor/evaluation');
})->name('instructor.evaluation');

Route::get('/instructor/verdict', function () {
    return Inertia::render('Instructor/verdict');
})->name('instructor.verdict');

Route::get('/instructor/minutes', function () {
    return Inertia::render('Instructor/minutes');
})->name('instructor.minutes');

Route::get('/instructor/deadlines', function () {
    return Inertia::render('Instructor/deadlines');
})->name('instructor.deadlines');

Route::get('/instructor/deployment', function () {
    return Inertia::render('Instructor/deployment');
})->name('instructor.deployment');

Route::get('/instructor/notifications', function () {
    return Inertia::render('Instructor/notifications');
})->name('instructor.notifications');

Route::get('/instructor/reports', function () {
    return Inertia::render('Instructor/reports');
})->name('instructor.reports');

Route::get('/instructor/settings', function () {
    return Inertia::render('Instructor/settings');
})->name('instructor.settings');

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