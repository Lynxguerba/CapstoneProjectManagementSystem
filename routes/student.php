<?php

use App\Http\Controllers\Student\DestroyStudentConceptSubmissionController;
use App\Http\Controllers\Student\ShowStudentConceptSubmissionController;
use App\Http\Controllers\Student\StoreStudentConceptSubmissionController;
use App\Http\Controllers\Student\StudentConceptController;
use App\Http\Controllers\Student\StudentDashboardController;
use App\Http\Controllers\Student\StudentGroupController;
use App\Http\Controllers\Student\StudentTitleRepositoryController;
use App\Http\Controllers\Student\UpdateStudentConceptSubmissionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'role:student'])->prefix('student')->group(function () {
    Route::get('/dashboard', StudentDashboardController::class)->name('student.dashboard');
    Route::get('/group', StudentGroupController::class)->name('student.group');
    Route::get('/titles', StudentTitleRepositoryController::class)->name('student.titles');
    Route::get('/concepts', StudentConceptController::class)->name('student.concepts');
    Route::post('/concepts/submissions', StoreStudentConceptSubmissionController::class)->name('student.concepts.submissions.store');
    Route::get('/concepts/submissions/{submission}', ShowStudentConceptSubmissionController::class)->name('student.concepts.submissions.show');
    Route::patch('/concepts/submissions/{submission}', UpdateStudentConceptSubmissionController::class)->name('student.concepts.submissions.update');
    Route::delete('/concepts/submissions/{submission}', DestroyStudentConceptSubmissionController::class)->name('student.concepts.submissions.destroy');
    Route::get('/documents', function () {
        return Inertia::render('Student/documents');
    })->name('student.documents');
    Route::get('/schedule', function () {
        return Inertia::render('Student/schedule');
    })->name('student.schedule');
    Route::get('/evaluation', function () {
        return Inertia::render('Student/evaluation');
    })->name('student.evaluation');
    Route::get('/verdict', function () {
        return Inertia::render('Student/verdict');
    })->name('student.verdict');
    Route::get('/deployment', function () {
        return Inertia::render('Student/deployment');
    })->name('student.deployment');
    Route::get('/deadlines', function () {
        return Inertia::render('Student/deadlines');
    })->name('student.deadlines');
    Route::get('/settings', function () {
        return Inertia::render('Student/settings');
    })->name('student.settings');
});
