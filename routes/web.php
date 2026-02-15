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

Route::get('/student/group', function () {
    return Inertia::render('Student/group');
})->name('student.group');

Route::get('/student/titles', function () {
    return Inertia::render('Student/titles');
})->name('student.titles');

Route::get('/student/concepts', function () {
    return Inertia::render('Student/concepts');
})->name('student.concepts');

Route::get('/student/documents', function () {
    return Inertia::render('Student/documents');
})->name('student.documents');

Route::get('/student/schedule', function () {
    return Inertia::render('Student/schedule');
})->name('student.schedule');

Route::get('/student/evaluation', function () {
    return Inertia::render('Student/evaluation');
})->name('student.evaluation');

Route::get('/student/verdict', function () {
    return Inertia::render('Student/verdict');
})->name('student.verdict');

Route::get('/student/deployment', function () {
    return Inertia::render('Student/deployment');
})->name('student.deployment');

Route::get('/student/deadlines', function () {
    return Inertia::render('Student/deadlines');
})->name('student.deadlines');

Route::get('/student/settings', function () {
    return Inertia::render('Student/settings');
})->name('student.settings');

// ADVISER DASHBOARD
Route::get('/adviser/dashboard', function () {
    return Inertia::render('Adviser/dashboard');
})->name('adviser.dashboard');

// ADVISER PAGES (UI ONLY)
Route::get('/adviser/groups', function () {
    return Inertia::render('Adviser/groups');
})->name('adviser.groups');

Route::get('/adviser/group-details', function () {
    return Inertia::render('Adviser/group-details');
})->name('adviser.group-details');

Route::get('/adviser/concepts', function () {
    return Inertia::render('Adviser/concepts');
})->name('adviser.concepts');

Route::get('/adviser/documents', function () {
    return Inertia::render('Adviser/documents');
})->name('adviser.documents');

Route::get('/adviser/evaluations', function () {
    return Inertia::render('Adviser/evaluations');
})->name('adviser.evaluations');

Route::get('/adviser/schedule', function () {
    return Inertia::render('Adviser/schedule');
})->name('adviser.schedule');

Route::get('/adviser/verdict', function () {
    return Inertia::render('Adviser/verdict');
})->name('adviser.verdict');

Route::get('/adviser/minutes', function () {
    return Inertia::render('Adviser/minutes');
})->name('adviser.minutes');

Route::get('/adviser/notifications', function () {
    return Inertia::render('Adviser/notifications');
})->name('adviser.notifications');

Route::get('/adviser/deadlines', function () {
    return Inertia::render('Adviser/deadlines');
})->name('adviser.deadlines');

Route::get('/adviser/reports', function () {
    return Inertia::render('Adviser/reports');
})->name('adviser.reports');

Route::get('/adviser/settings', function () {
    return Inertia::render('Adviser/settings');
})->name('adviser.settings');

// PANELIST DASHBOARD
Route::get('/panelist/dashboard', function () {
    return Inertia::render('Panelist/dashboard');
})->name('panelist.dashboard');

// PANELIST PAGES (UI ONLY)
Route::get('/panelist/assigned-groups', function () {
    return Inertia::render('Panelist/assigned-groups');
})->name('panelist.assigned-groups');

Route::get('/panelist/group-details', function () {
    return Inertia::render('Panelist/group-details');
})->name('panelist.group-details');

Route::get('/panelist/schedule', function () {
    return Inertia::render('Panelist/schedule');
})->name('panelist.schedule');

Route::get('/panelist/documents', function () {
    return Inertia::render('Panelist/documents/document-list');
})->name('panelist.documents');

Route::get('/panelist/documents/viewer', function () {
    return Inertia::render('Panelist/documents/document-viewer');
})->name('panelist.documents.viewer');

Route::get('/panelist/evaluation', function () {
    return Inertia::render('Panelist/evaluation/evaluation-form');
})->name('panelist.evaluation');

Route::get('/panelist/comments', function () {
    return Inertia::render('Panelist/comments/comments-dashboard');
})->name('panelist.comments');

Route::get('/panelist/verdict', function () {
    return Inertia::render('Panelist/verdict/verdict-recommendation');
})->name('panelist.verdict');

Route::get('/panelist/history', function () {
    return Inertia::render('Panelist/history/past-evaluations');
})->name('panelist.history');

Route::get('/panelist/notifications', function () {
    return Inertia::render('Panelist/notifications');
})->name('panelist.notifications');

Route::get('/panelist/settings', function () {
    return Inertia::render('Panelist/settings');
})->name('panelist.settings');

// DEAN DASHBOARD
Route::get('/dean/dashboard', function () {
    return Inertia::render('Dean/dashboard');
})->name('dean.dashboard');

// PROGRAM CHAIRPERSON DASHBOARD
Route::get('/program_chairperson/dashboard', function () {
    return Inertia::render('ProgramChairperson/dashboard');
})->name('program_chairperson.dashboard');