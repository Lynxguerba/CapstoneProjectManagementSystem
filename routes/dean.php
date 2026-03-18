<?php

use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'role:dean'])->prefix('dean')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dean/dashboard');
    })->name('dean.dashboard');
    Route::get('/projects', function () {
        return Inertia::render('Dean/projects');
    })->name('dean.projects');
    Route::get('/project-details', function () {
        return Inertia::render('Dean/project-details');
    })->name('dean.project-details');
    Route::get('/students', function () {
        return Inertia::render('Dean/students');
    })->name('dean.students');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('Dean/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('dean.settings');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('dean.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('dean.settings.e-signature.delete');
    Route::get('/reports', function () {
        return Inertia::render('Dean/reports');
    })->name('dean.reports');
});
