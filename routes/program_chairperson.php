<?php

use App\Http\Controllers\Adviser\DeleteAdviserESignatureController;
use App\Http\Controllers\Adviser\UpsertAdviserESignatureController;
use App\Models\ProgramSet;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::middleware(['auth', 'role:program_chairperson'])->prefix('program_chairperson')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('ProgramChairperson/dashboard');
    })->name('program_chairperson.dashboard');
    Route::get('/concept-titles', function () {
        $selectedAcademicYearId = request()->query('academic_year_id');
        $selectedAcademicYearId = is_numeric($selectedAcademicYearId) ? (int) $selectedAcademicYearId : null;
        $selectedAcademicYearId = $selectedAcademicYearId !== null && $selectedAcademicYearId > 0 ? $selectedAcademicYearId : null;
        $selectedAcademicYear = request()->query('academic_year');
        $selectedAcademicYear = is_string($selectedAcademicYear) && $selectedAcademicYear !== '' ? $selectedAcademicYear : null;
        $normalizedSelectedAcademicYear = is_string($selectedAcademicYear)
            ? trim((string) preg_replace('/^A\.?Y\.?\s*/i', '', $selectedAcademicYear))
            : null;
        $academicYearCandidates = collect([$selectedAcademicYear, $normalizedSelectedAcademicYear])
            ->filter(fn ($value): bool => is_string($value) && $value !== '')
            ->unique()
            ->values()
            ->all();
        $hasProgramSetsSchoolYearColumn = Schema::hasTable('program_sets') && Schema::hasColumn('program_sets', 'school_year');
        $assignedProgram = null;
        $programSets = [];

        try {
            $user = Auth::guard('web')->user();
            $rawAssignedProgram = Schema::hasTable('users') && Schema::hasColumn('users', 'program')
                ? $user?->program
                : null;
            $normalizedAssignedProgram = is_string($rawAssignedProgram) ? strtoupper(trim($rawAssignedProgram)) : null;
            $assignedProgram = in_array($normalizedAssignedProgram, ['BSIT', 'BSIS'], true)
                ? $normalizedAssignedProgram
                : null;

            if ($assignedProgram !== null && class_exists(ProgramSet::class) && Schema::hasTable('program_sets')) {
                $hasProgramSetStudentTable = Schema::hasTable('program_set_student');
                $hasGroupsTable = Schema::hasTable('groups');
                $hasGroupMembersTable = Schema::hasTable('group_members');
                $hasGroupMembersIsCrossSetColumn = $hasGroupMembersTable && Schema::hasColumn('group_members', 'is_cross_set');
                $programSetColumns = ['id', 'name', 'program', 'academic_year_id', 'instructor_id'];

                if ($hasProgramSetsSchoolYearColumn) {
                    $programSetColumns[] = 'school_year';
                }

                $programSetsQuery = ProgramSet::query()
                    ->with(['academicYear:id,label,is_current', 'instructor:id,name,first_name,last_name'])
                    ->where('program', $assignedProgram)
                    ->when($selectedAcademicYearId !== null, fn ($query) => $query->where('academic_year_id', $selectedAcademicYearId))
                    ->when(
                        $selectedAcademicYearId === null && count($academicYearCandidates) > 0 && ! in_array('All', $academicYearCandidates, true),
                        function ($query) use ($academicYearCandidates, $hasProgramSetsSchoolYearColumn): void {
                            $query->where(function ($subQuery) use ($academicYearCandidates, $hasProgramSetsSchoolYearColumn): void {
                                $subQuery->whereHas('academicYear', fn ($academicYearQuery) => $academicYearQuery->whereIn('label', $academicYearCandidates));

                                if ($hasProgramSetsSchoolYearColumn) {
                                    $subQuery->orWhereIn('school_year', $academicYearCandidates);
                                }
                            });
                        }
                    )
                    ->when($hasProgramSetStudentTable, fn ($query) => $query->withCount('students'))
                    ->when($hasGroupsTable, fn ($query) => $query->withCount('groups'))
                    ->when(
                        $hasProgramSetStudentTable && $hasGroupsTable && $hasGroupMembersTable,
                        function ($query) use ($hasGroupMembersIsCrossSetColumn): void {
                            $query->selectSub(
                                DB::table('program_set_student as pss')
                                    ->join('group_members as gm', 'gm.student_id', '=', 'pss.student_id')
                                    ->join('groups as g', 'g.id', '=', 'gm.group_id')
                                    ->whereColumn('pss.program_set_id', 'program_sets.id')
                                    ->whereColumn('g.program_set_id', '!=', 'pss.program_set_id')
                                    ->when($hasGroupMembersIsCrossSetColumn, fn ($subQuery) => $subQuery->where('gm.is_cross_set', true))
                                    ->selectRaw('count(distinct g.id)'),
                                'cross_set_groups_count',
                            );
                        },
                    )
                    ->orderByDesc('created_at')
                    ->get($programSetColumns);

                $programSets = $programSetsQuery
                    ->map(function ($programSet) use ($hasProgramSetStudentTable, $hasGroupsTable, $hasGroupMembersTable, $hasProgramSetsSchoolYearColumn): array {
                        $localGroupsCount = $hasGroupsTable ? (int) ($programSet->groups_count ?? 0) : 0;
                        $crossSetGroupsCount = $hasProgramSetStudentTable && $hasGroupsTable && $hasGroupMembersTable
                            ? (int) ($programSet->cross_set_groups_count ?? 0)
                            : 0;
                        $instructorFirstName = is_string($programSet->instructor?->first_name) ? trim($programSet->instructor->first_name) : '';
                        $instructorLastName = is_string($programSet->instructor?->last_name) ? trim($programSet->instructor->last_name) : '';
                        $instructorName = trim($instructorFirstName.' '.$instructorLastName);
                        $instructorName = $instructorName !== '' ? $instructorName : $programSet->instructor?->name;

                        return [
                            'id' => $programSet->id,
                            'name' => $programSet->name,
                            'program' => $programSet->program,
                            'school_year' => $programSet->academicYear?->label ?? ($hasProgramSetsSchoolYearColumn ? $programSet->school_year : null),
                            'instructor_name' => $instructorName,
                            'students_count' => $hasProgramSetStudentTable ? (int) ($programSet->students_count ?? 0) : 0,
                            'groups_count' => $localGroupsCount + $crossSetGroupsCount,
                            'local_groups_count' => $localGroupsCount,
                            'cross_set_groups_count' => $crossSetGroupsCount,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable) {
            $programSets = [];
        }

        return Inertia::render('ProgramChairperson/concept-titles', [
            'programSets' => $programSets,
            'assignedProgram' => $assignedProgram,
            'selectedAcademicYear' => $selectedAcademicYear,
            'selectedAcademicYearId' => $selectedAcademicYearId,
        ]);
    })->name('program_chairperson.concept-titles');
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
