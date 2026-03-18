<?php

use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpdateAdviserPasswordController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'role:adviser'])->prefix('adviser')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Adviser/dashboard');
    })->name('adviser.dashboard');
    Route::get('/groups', function () {
        return Inertia::render('Adviser/groups');
    })->name('adviser.groups');
    Route::get('/group-details', function () {
        return Inertia::render('Adviser/group-details');
    })->name('adviser.group-details');
    Route::get('/concepts', function () {
        return Inertia::render('Adviser/concepts');
    })->name('adviser.concepts');
    Route::get('/documents', function () {
        return Inertia::render('Adviser/documents');
    })->name('adviser.documents');
    Route::get('/evaluations', function () {
        return Inertia::render('Adviser/evaluations');
    })->name('adviser.evaluations');
    Route::get('/schedule', function () {
        return Inertia::render('Adviser/schedule');
    })->name('adviser.schedule');
    Route::get('/verdict', function () {
        return Inertia::render('Adviser/verdict');
    })->name('adviser.verdict');
    Route::get('/minutes', function () {
        return Inertia::render('Adviser/minutes');
    })->name('adviser.minutes');
    Route::get('/notifications', function () {
        return Inertia::render('Adviser/notifications');
    })->name('adviser.notifications');
    Route::get('/deadlines', function () {
        return Inertia::render('Adviser/deadlines');
    })->name('adviser.deadlines');
    Route::get('/reports', function () {
        return Inertia::render('Adviser/reports');
    })->name('adviser.reports');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('Adviser/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('adviser.settings');
    Route::put('/settings/password', UpdateAdviserPasswordController::class)->name('adviser.settings.password.update');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('adviser.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('adviser.settings.e-signature.delete');
});
