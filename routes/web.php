<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 
Route::get('/', function () {
    return Inertia::render('login');
})->name('login');

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