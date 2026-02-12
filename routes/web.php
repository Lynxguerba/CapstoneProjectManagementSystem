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