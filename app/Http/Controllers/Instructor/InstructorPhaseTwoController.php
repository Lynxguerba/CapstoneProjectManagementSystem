<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\DefenseSchedule;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\GroupAcknowledgementReceipt;
use App\Models\GroupDefenseVerdict;
use App\Models\PanelistEvaluationSheetSignature;
use App\Models\ProgramSet;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class InstructorPhaseTwoController extends Controller
{
    public function __invoke(): Response
    {
        $userId = Auth::guard('web')->id();
        $programSets = [];
        $groups = [];
        $defenseSchedules = [];
        $requirements = [];
        $documentSubmissions = [];
        $academicYears = [];

        $resolveUserName = static function (?User $user): string {
            if (! $user instanceof User) {
                return '';
            }

            $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
            $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
            $fullName = $firstName !== '' || $lastName !== ''
                ? trim($firstName.' '.$lastName)
                : (is_string($user->name) ? $user->name : '');

            return $fullName;
        };

        try {
            if (class_exists(ProgramSet::class) && Schema::hasTable('program_sets')) {
                $programSets = ProgramSet::query()
                    ->with('academicYear')
                    ->when($userId !== null, fn ($query) => $query->where('instructor_id', $userId))
                    ->orderByDesc('created_at')
                    ->get(['id', 'name', 'program', 'academic_year_id', 'instructor_id'])
                    ->map(function (ProgramSet $programSet): array {
                        $schoolYear = $programSet->academicYear?->label;

                        if ($schoolYear === null && Schema::hasColumn('program_sets', 'school_year')) {
                            $schoolYear = $programSet->school_year;
                        }

                        return [
                            'id' => $programSet->id,
                            'name' => $programSet->name,
                            'program' => $programSet->program,
                            'school_year' => $schoolYear,
                        ];
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable) {
            $programSets = [];
        }

        try {
            if (class_exists(Group::class) && Schema::hasTable('groups')) {
                $hasConceptVerdictColumn = Schema::hasColumn('groups', 'concept_verdict');
                $hasApprovedConceptSubmissionColumn = Schema::hasColumn('groups', 'approved_concept_submission_id');
                $hasGroupPanelistsTable = Schema::hasTable('group_panelists');
                $hasGroupMembersTable = Schema::hasTable('group_members');

                $groupColumns = ['id', 'name', 'program_set_id', 'leader_id', 'created_at'];

                if ($hasConceptVerdictColumn) {
                    $groupColumns[] = 'concept_verdict';
                }

                if ($hasApprovedConceptSubmissionColumn) {
                    $groupColumns[] = 'approved_concept_submission_id';
                }

                $groupsQuery = Group::query()
                    ->with([
                        'programSet.academicYear',
                        'leader:id,name,first_name,last_name,email',
                        'adviserAssignment:id,group_id,adviser_id',
                    ])
                    ->when($userId !== null, function ($query) use ($userId): void {
                        $query->whereHas('programSet', fn ($subQuery) => $subQuery->where('instructor_id', $userId));
                    })
                    ->orderByDesc('created_at');

                if ($hasGroupMembersTable) {
                    $groupsQuery->with('members:id,name,first_name,last_name,email');
                }

                if ($hasGroupPanelistsTable) {
                    $groupsQuery->withCount('panelAssignments');
                }

                if ($hasApprovedConceptSubmissionColumn) {
                    $groupsQuery->whereNotNull('approved_concept_submission_id');
                }

                $groupCollection = $groupsQuery->get($groupColumns);
                $groupIds = $groupCollection
                    ->pluck('id')
                    ->filter(static fn ($groupId): bool => is_numeric($groupId))
                    ->map(static fn ($groupId): int => (int) $groupId)
                    ->values();

                $outlineVerdictsByGroupId = collect();
                if ($groupIds->isNotEmpty() && Schema::hasTable('group_defense_verdicts')) {
                    $outlineVerdictsByGroupId = GroupDefenseVerdict::query()
                        ->whereIn('group_id', $groupIds->all())
                        ->whereRaw('LOWER(stage) = ?', ['outline'])
                        ->get([
                            'id',
                            'group_id',
                            'verdict',
                            'approved_document_submission_id',
                            'decided_at',
                        ])
                        ->keyBy('group_id');
                }

                $evaluationSignedCountsByGroupId = collect();
                if ($groupIds->isNotEmpty() && Schema::hasTable('panelist_evaluation_sheet_signatures')) {
                    $evaluationSignedCountsByGroupId = PanelistEvaluationSheetSignature::query()
                        ->selectRaw('group_id, COUNT(*) as signed_count')
                        ->whereIn('group_id', $groupIds->all())
                        ->where('defense_type_key', 'outline_defense')
                        ->groupBy('group_id')
                        ->get()
                        ->mapWithKeys(fn (PanelistEvaluationSheetSignature $signature): array => [
                            (int) $signature->group_id => (int) ($signature->signed_count ?? 0),
                        ]);
                }

                $receiptSignedCountsByGroupId = collect();
                if ($groupIds->isNotEmpty() && Schema::hasTable('group_acknowledgement_receipts')) {
                    $receiptSignedCountsByGroupId = GroupAcknowledgementReceipt::query()
                        ->selectRaw('group_id, COUNT(*) as signed_count')
                        ->whereIn('group_id', $groupIds->all())
                        ->where('defense_type_key', 'outline_defense')
                        ->groupBy('group_id')
                        ->get()
                        ->mapWithKeys(fn (GroupAcknowledgementReceipt $receipt): array => [
                            (int) $receipt->group_id => (int) ($receipt->signed_count ?? 0),
                        ]);
                }

                $groups = $groupCollection
                    ->map(function (Group $group) use (
                        $resolveUserName,
                        $hasConceptVerdictColumn,
                        $hasApprovedConceptSubmissionColumn,
                        $hasGroupPanelistsTable,
                        $outlineVerdictsByGroupId,
                        $evaluationSignedCountsByGroupId,
                        $receiptSignedCountsByGroupId,
                    ): array {
                        $programSet = $group->programSet;
                        $schoolYear = $programSet?->academicYear?->label;

                        if ($schoolYear === null && $programSet && Schema::hasColumn('program_sets', 'school_year')) {
                            $schoolYear = $programSet->school_year;
                        }

                        $fallbackName = trim(($programSet?->program ?? '').' '.($schoolYear ?? ''));
                        $memberRows = collect([$group->leader])
                            ->merge($group->relationLoaded('members') ? $group->members : collect())
                            ->filter(fn (?User $member): bool => $member instanceof User)
                            ->unique(fn (User $member): int => (int) $member->id)
                            ->map(fn (User $member): array => [
                                'id' => (int) $member->id,
                                'name' => $resolveUserName($member),
                            ])
                            ->values()
                            ->all();
                        $panelistsCount = $hasGroupPanelistsTable && is_numeric($group->panel_assignments_count ?? null)
                            ? (int) $group->panel_assignments_count
                            : 0;
                        $receiptRequiredCount = $panelistsCount + ((int) ($group->adviserAssignment?->adviser_id ?? 0) > 0 ? 1 : 0);
                        $outlineVerdict = $outlineVerdictsByGroupId->get($group->id);

                        return [
                            'id' => $group->id,
                            'name' => $group->name,
                            'program_set_id' => $programSet?->id,
                            'program_set_name' => $programSet?->name ?: $fallbackName,
                            'program' => $programSet?->program,
                            'school_year' => $schoolYear,
                            'concept_verdict' => $hasConceptVerdictColumn && is_string($group->concept_verdict) && trim($group->concept_verdict) !== ''
                                ? trim($group->concept_verdict)
                                : null,
                            'approved_concept_submission_id' => $hasApprovedConceptSubmissionColumn && is_numeric($group->approved_concept_submission_id)
                                ? (int) $group->approved_concept_submission_id
                                : null,
                            'leader_name' => $resolveUserName($group->leader),
                            'members' => $memberRows,
                            'members_count' => count($memberRows),
                            'panelists_count' => $panelistsCount,
                            'receipt_signed_count' => (int) ($receiptSignedCountsByGroupId->get($group->id) ?? 0),
                            'receipt_required_count' => $receiptRequiredCount,
                            'evaluation_signed_count' => (int) ($evaluationSignedCountsByGroupId->get($group->id) ?? 0),
                            'evaluation_required_count' => $panelistsCount,
                            'outline_verdict' => is_string($outlineVerdict?->verdict) && trim($outlineVerdict->verdict) !== ''
                                ? trim($outlineVerdict->verdict)
                                : null,
                            'outline_verdict_decided_at' => $outlineVerdict?->decided_at?->format('Y-m-d H:i'),
                            'outline_approved_document_submission_id' => is_numeric($outlineVerdict?->approved_document_submission_id)
                                ? (int) $outlineVerdict->approved_document_submission_id
                                : null,
                        ];
                    })
                    ->filter(function (array $groupRow) use ($hasApprovedConceptSubmissionColumn): bool {
                        if ($hasApprovedConceptSubmissionColumn) {
                            return true;
                        }

                        return $this->hasApprovedConceptVerdict($groupRow['concept_verdict'] ?? null);
                    })
                    ->values()
                    ->all();
            }
        } catch (\Throwable) {
            $groups = [];
        }

        try {
            if (class_exists(DefenseSchedule::class) && Schema::hasTable('defense_schedules')) {
                $groupIds = collect($groups)
                    ->pluck('id')
                    ->filter(static fn ($groupId): bool => is_numeric($groupId))
                    ->map(static fn ($groupId): int => (int) $groupId)
                    ->values();

                if ($groupIds->isNotEmpty()) {
                    $defenseSchedules = DefenseSchedule::query()
                        ->with(['group:id,name', 'room'])
                        ->whereIn('group_id', $groupIds->all())
                        ->whereRaw('LOWER(stage) = ?', ['outline'])
                        ->orderBy('scheduled_date')
                        ->orderBy('start_time')
                        ->get()
                        ->map(static fn (DefenseSchedule $schedule): array => [
                            'id' => $schedule->id,
                            'group_id' => $schedule->group_id,
                            'group_name' => $schedule->group?->name,
                            'stage' => $schedule->stage,
                            'scheduled_date' => $schedule->scheduled_date?->format('Y-m-d'),
                            'start_time' => $schedule->start_time,
                            'end_time' => $schedule->end_time,
                            'room' => $schedule->room
                                ? [
                                    'id' => $schedule->room->id,
                                    'name' => $schedule->room->name,
                                ]
                                : null,
                        ])
                        ->values()
                        ->all();
                }
            }
        } catch (\Throwable) {
            $defenseSchedules = [];
        }

        try {
            if (Schema::hasTable('academic_years')) {
                $academicYears = AcademicYear::query()
                    ->orderByDesc('start_year')
                    ->orderByDesc('end_year')
                    ->get(['id', 'label', 'is_current'])
                    ->map(static fn (AcademicYear $academicYear): array => [
                        'id' => $academicYear->id,
                        'label' => $academicYear->label,
                        'is_current' => $academicYear->is_current,
                    ])
                    ->values()
                    ->all();
            }
        } catch (\Throwable) {
            $academicYears = [];
        }

        try {
            if (class_exists(DocumentRequirement::class) && Schema::hasTable('document_requirements')) {
                $requirements = DocumentRequirement::query()
                    ->with('academicYear')
                    ->where('stage', 'Outline')
                    ->orderBy('due_date')
                    ->get()
                    ->map(static fn (DocumentRequirement $requirement): array => [
                        'id' => $requirement->id,
                        'requirement_type' => $requirement->requirement_type,
                        'due_date' => $requirement->due_date?->format('Y-m-d'),
                        'is_mandatory' => $requirement->is_mandatory,
                        'academic_year_id' => $requirement->academic_year_id,
                        'academic_year_label' => $requirement->academicYear?->label,
                    ])
                    ->values()
                    ->all();
            }
        } catch (\Throwable) {
            $requirements = [];
        }

        try {
            if (class_exists(DocumentSubmission::class) && Schema::hasTable('document_submissions')) {
                $groupIds = collect($groups)->pluck('id')->filter()->values();
                $requirementIds = collect($requirements)->pluck('id')->filter()->values();

                if ($groupIds->isNotEmpty() && $requirementIds->isNotEmpty()) {
                    $documentSubmissions = DocumentSubmission::query()
                        ->whereIn('group_id', $groupIds)
                        ->whereIn('document_requirement_id', $requirementIds)
                        ->orderByDesc('created_at')
                        ->get()
                        ->map(static fn (DocumentSubmission $submission): array => [
                            'id' => $submission->id,
                            'group_id' => $submission->group_id,
                            'document_requirement_id' => $submission->document_requirement_id,
                            'status' => $submission->status,
                            'submitted_at' => $submission->created_at?->format('Y-m-d'),
                        ])
                        ->values()
                        ->all();
                }
            }
        } catch (\Throwable) {
            $documentSubmissions = [];
        }

        return Inertia::render('Instructor/phase2', [
            'programSets' => $programSets,
            'groups' => $groups,
            'defenseSchedules' => $defenseSchedules,
            'requirements' => $requirements,
            'documentSubmissions' => $documentSubmissions,
            'academicYears' => $academicYears,
        ]);
    }

    private function hasApprovedConceptVerdict(?string $verdict): bool
    {
        $normalizedVerdict = is_string($verdict) ? strtolower(trim($verdict)) : '';

        if ($normalizedVerdict === '') {
            return false;
        }

        if (str_contains($normalizedVerdict, 'failed') || str_contains($normalizedVerdict, 'deferred') || str_contains($normalizedVerdict, 'deffered')) {
            return false;
        }

        return str_contains($normalizedVerdict, 'pass') || str_contains($normalizedVerdict, 'approved');
    }
}
