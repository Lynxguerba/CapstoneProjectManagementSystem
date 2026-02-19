<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InstructorController;

// Instructor routes
Route::prefix('instructor')->name('instructor.')->group(function () {
    Route::get('/dashboard', [InstructorController::class, 'dashboard'])->name('dashboard');
    Route::get('/groups', [InstructorController::class, 'groups'])->name('groups');
    Route::get('/groups/{group}', [InstructorController::class, 'groupShow'])->name('groups.show');
    Route::get('/advisers', [InstructorController::class, 'advisers'])->name('advisers');
    Route::get('/schedules', [InstructorController::class, 'schedules'])->name('schedules');
    Route::get('/deadlines', [InstructorController::class, 'deadlines'])->name('deadlines');
    Route::get('/deadlines/create', [InstructorController::class, 'deadlinesCreate'])->name('deadlines.create');
    Route::get('/payments', [InstructorController::class, 'payments'])->name('payments');
    Route::get('/deployments', [InstructorController::class, 'deployments'])->name('deployments');
    Route::get('/analytics', [InstructorController::class, 'analytics'])->name('analytics');
    Route::get('/documents', [InstructorController::class, 'documents'])->name('documents');
});
