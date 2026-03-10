<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminSystemSettingsController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpdateAdviserPasswordController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\EnsureWebAuthenticated;
use Illuminate\Auth\Middleware\Authenticate as AuthenticateMiddleware;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

//
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

Route::post('/login', [LoginController::class, 'store'])->name('login.store');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
Route::post('/switch-role', [LoginController::class, 'switchRole'])
    ->middleware(EnsureWebAuthenticated::class)
    ->name('role.switch');

// ADMIN ROUTES (protected)
Route::prefix('admin')->middleware([EnsureWebAuthenticated::class, EnsureRole::class.':admin'])->group(function () {
    Route::get('/dashboard', AdminDashboardController::class)->name('admin.dashboard');
    Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users.index');
    Route::get('/users/students', [AdminUserController::class, 'students'])->name('admin.users.students');
    Route::get('/users/faculty', [AdminUserController::class, 'faculty'])->name('admin.users.faculty');
    Route::post('/users', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::post('/users/bulk', [AdminUserController::class, 'bulkStore'])->name('admin.users.bulk-store');
    Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('admin.users.update');
    Route::get('/system-settings', [AdminSystemSettingsController::class, 'edit'])->name('admin.system-settings');
    Route::put('/system-settings', [AdminSystemSettingsController::class, 'update'])->name('admin.system-settings.update');
    Route::get('/audit-logs', function () {
        return Inertia::render('Admin/audit-logs');
    })->name('admin.audit-logs');

    Route::get('/project-repository', function () {
        return Inertia::render('Admin/project-repository'); 
    })->name('admin.repository');
    Route::get('/backup-restore', function () {
        return Inertia::render('Admin/backup-restore'); 
    })->name('admin.backup-restore');
});

// INSTRUCTOR ROUTES (protected)
Route::prefix('instructor')->middleware([AuthenticateMiddleware::class, EnsureRole::class.':instructor'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Instructor/dashboard');
    })->name('instructor.dashboard');
    Route::get('/groups', function () {
        return Inertia::render('Instructor/groups');
    })->name('instructor.groups');
    Route::get('/students', function () {
        return Inertia::render('Instructor/students');
    })->name('instructor.students');
    Route::get('/adviser-assignment', function () {
        return Inertia::render('Instructor/adviser-assignment');
    })->name('instructor.adviser-assignment');
     Route::get('/scheduling', function () {
        return Inertia::render('Instructor/scheduling');
    })->name('instructor.scheduling');
    Route::get('/titles', function () {
        return Inertia::render('Instructor/titles');
    })->name('instructor.titles');
    Route::get('/concepts', function () {
        return Inertia::render('Instructor/concepts');
    })->name('instructor.concepts');
   
    Route::get('/evaluation', function () {
        return Inertia::render('Instructor/evaluation');
    })->name('instructor.evaluation');
    Route::get('/verdict', function () {
        return Inertia::render('Instructor/verdict');
    })->name('instructor.verdict');
    Route::get('/minutes', function () {
        return Inertia::render('Instructor/minutes');
    })->name('instructor.minutes');
    Route::get('/deadlines', function () {
        return Inertia::render('Instructor/deadlines');
    })->name('instructor.deadlines');
    Route::get('/deployment', function () {
        return Inertia::render('Instructor/deployment');
    })->name('instructor.deployment');
    Route::get('/notifications', function () {
        return Inertia::render('Instructor/notifications');
    })->name('instructor.notifications');
    Route::get('/reports', function () {
        return Inertia::render('Instructor/reports');
    })->name('instructor.reports');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('Instructor/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('instructor.settings');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('instructor.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('instructor.settings.e-signature.delete');
});

// STUDENT ROUTES (protected)
Route::prefix('student')->middleware([AuthenticateMiddleware::class, EnsureRole::class.':student'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Student/dashboard');
    })->name('student.dashboard');
    Route::get('/group', function () {
        return Inertia::render('Student/group');
    })->name('student.group');
    Route::get('/titles', function () {
        return Inertia::render('Student/titles');
    })->name('student.titles');
    Route::get('/concepts', function () {
        return Inertia::render('Student/concepts');
    })->name('student.concepts');
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

// ADVISER ROUTES (protected)
Route::prefix('adviser')->middleware([AuthenticateMiddleware::class, EnsureRole::class.':adviser'])->group(function () {
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

// PANELIST ROUTES (protected)
Route::prefix('panelist')->middleware([AuthenticateMiddleware::class, EnsureRole::class.':panelist'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Panelist/dashboard');
    })->name('panelist.dashboard');
    Route::get('/assigned-groups', function () {
        return Inertia::render('Panelist/assigned-groups');
    })->name('panelist.assigned-groups');
    Route::get('/group-details', function () {
        return Inertia::render('Panelist/group-details');
    })->name('panelist.group-details');
    Route::get('/schedule', function () {
        return Inertia::render('Panelist/schedule');
    })->name('panelist.schedule');
    Route::get('/documents', function () {
        return Inertia::render('Panelist/documents/document-list');
    })->name('panelist.documents');
    Route::get('/documents/viewer', function () {
        return Inertia::render('Panelist/documents/document-viewer');
    })->name('panelist.documents.viewer');
    Route::get('/evaluation', function () {
        return Inertia::render('Panelist/evaluation/evaluation-form');
    })->name('panelist.evaluation');
    Route::get('/comments', function () {
        return Inertia::render('Panelist/comments/comments-dashboard');
    })->name('panelist.comments');
    Route::get('/verdict', function () {
        return Inertia::render('Panelist/verdict/verdict-recommendation');
    })->name('panelist.verdict');
    Route::get('/history', function () {
        return Inertia::render('Panelist/history/past-evaluations');
    })->name('panelist.history');
    Route::get('/notifications', function () {
        return Inertia::render('Panelist/notifications');
    })->name('panelist.notifications');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('Panelist/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('panelist.settings');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('panelist.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('panelist.settings.e-signature.delete');
});

// DEAN ROUTES (protected)
Route::prefix('dean')->middleware([AuthenticateMiddleware::class, EnsureRole::class.':dean'])->group(function () {
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

// PROGRAM CHAIRPERSON ROUTES (protected)
Route::prefix('program_chairperson')->middleware([AuthenticateMiddleware::class, EnsureRole::class.':program_chairperson'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('ProgramChairperson/dashboard');
    })->name('program_chairperson.dashboard');
    Route::get('/pre-deployment-letters', function () {
        return Inertia::render('ProgramChairperson/pre-deployment-letters');
    })->name('program_chairperson.pre-deployment-letters');
    Route::get('/deployment-approval', function () {
        return Inertia::render('ProgramChairperson/deployment-approval');
    })->name('program_chairperson.deployment-approval');
    Route::get('/deployment-monitoring', function () {
        return Inertia::render('ProgramChairperson/deployment-monitoring');
    })->name('program_chairperson.deployment-monitoring');
    Route::get('/post-deployment-review', function () {
        return Inertia::render('ProgramChairperson/post-deployment-review');
    })->name('program_chairperson.post-deployment-review');
    Route::get('/document-approval', function () {
        return Inertia::render('ProgramChairperson/document-approval');
    })->name('program_chairperson.document-approval');
    Route::get('/deployment-history', function () {
        return Inertia::render('ProgramChairperson/deployment-history');
    })->name('program_chairperson.deployment-history');
    Route::get('/notifications', function () {
        return Inertia::render('ProgramChairperson/notifications');
    })->name('program_chairperson.notifications');
    Route::get('/settings', function () {
        $user = Auth::guard('web')->user();
        $user?->loadMissing('eSignature');

        return Inertia::render('ProgramChairperson/settings', [
            'eSignature' => $user?->eSignature !== null
                ? [
                    'signatureData' => $user->eSignature->signature_data,
                    'mimeType' => $user->eSignature->mime_type,
                ]
                : null,
        ]);
    })->name('program_chairperson.settings');
    Route::put('/settings/e-signature', UpsertAdviserESignatureController::class)->name('program_chairperson.settings.e-signature.upsert');
    Route::delete('/settings/e-signature', DeleteAdviserESignatureController::class)->name('program_chairperson.settings.e-signature.delete');
});
