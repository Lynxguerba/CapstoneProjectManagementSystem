<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class StudentManuscriptController extends Controller
{
    public function __invoke(): Response
    {
        /** @var User|null $student */
        $student = Auth::guard('web')->user();
        $group = $this->resolveStudentGroup($student?->id);
        $isGroupLeader = $group !== null
            && $student !== null
            && (int) $group->leader_id === (int) $student->id;
        $isPhaseTwoAvailable = $this->isPhaseTwoAvailable($group);
        $manuscriptRequirements = $this->resolveManuscriptRequirements($group);

        /** @var DocumentRequirement|null $activeRequirement */
        $activeRequirement = $manuscriptRequirements->first();
        $currentSubmission = $this->resolveCurrentSubmission($group?->id, $manuscriptRequirements->pluck('id')->values());

        $deadlineDate = $activeRequirement?->due_date;
        $hasManuscriptRequirement = $activeRequirement instanceof DocumentRequirement;
        $isReadyToSubmit = $group !== null && $isPhaseTwoAvailable && $hasManuscriptRequirement;

        $readinessMessage = ! $group
            ? 'You are not assigned to a group yet. Manuscript submission is locked.'
            : (! $isPhaseTwoAvailable
                    ? 'Phase 2 manuscript submission is locked until your group has an approved project title from Phase 1.'
                    : (! $hasManuscriptRequirement
                        ? 'Waiting for your instructor to declare the Phase 2 manuscript requirement.'
                        : ($isGroupLeader
                        ? 'Phase 2 manuscript submission is ready. Upload one PDF manuscript file for adviser review.'
                        : 'Only your Project Manager can submit the manuscript file. You can still monitor the current upload here.')));

        return Inertia::render('Student/manuscripts', [
            'group' => $group ? [
                'id' => $group->id,
                'name' => $group->name,
                'programSetName' => $group->programSet?->name,
                'academicYear' => $group->programSet?->academicYear?->label,
            ] : null,
            'isGroupLeader' => $isGroupLeader,
            'readiness' => [
                'isReady' => $isReadyToSubmit,
                'message' => $readinessMessage,
            ],
            'activeRequirement' => $activeRequirement ? [
                'id' => $activeRequirement->id,
                'type' => (string) $activeRequirement->requirement_type,
                'deadlineDate' => $deadlineDate?->format('Y-m-d'),
                'deadlineLabel' => $deadlineDate?->format('F d, Y').' · 11:59 PM',
            ] : null,
            'submission' => $currentSubmission ? [
                'id' => $currentSubmission->id,
                'title' => (string) $currentSubmission->file_name,
                'requirementType' => (string) ($currentSubmission->requirement?->requirement_type ?? 'Manuscript'),
                'instructorStatus' => (string) ($currentSubmission->status ?? 'Submitted'),
                'adviserStatus' => (string) ($currentSubmission->adviser_status ?? 'Submitted'),
                'submittedAt' => $currentSubmission->created_at?->format('Y-m-d H:i'),
                'fileSizeLabel' => $this->formatFileSize($currentSubmission->file_size),
                'viewUrl' => route('student.documents.show', [
                    'type' => 'submission',
                    'id' => $currentSubmission->id,
                ]),
                'removeUrl' => $isGroupLeader
                    ? route('student.manuscripts.submissions.destroy', $currentSubmission)
                    : null,
            ] : null,
            'notifications' => [
                'deadline' => $deadlineDate?->format('F d, Y').' · 11:59 PM',
                'documentsUrl' => route('student.documents'),
            ],
        ]);
    }

    private function resolveStudentGroup(?int $studentId): ?Group
    {
        if ($studentId === null || ! Schema::hasTable('groups')) {
            return null;
        }

        $hasGroupMembersTable = Schema::hasTable('group_members');
        $hasProgramSetsTable = Schema::hasTable('program_sets');
        $hasAcademicYearsTable = Schema::hasTable('academic_years');

        $query = Group::query();

        if ($hasProgramSetsTable) {
            $query->with('programSet:id,name,academic_year_id');

            if ($hasAcademicYearsTable) {
                $query->with('programSet.academicYear:id,label');
            }
        }

        $groupColumns = ['id', 'name', 'program_set_id', 'leader_id'];

        if (Schema::hasColumn('groups', 'approved_concept_submission_id')) {
            $groupColumns[] = 'approved_concept_submission_id';
        }

        if (Schema::hasColumn('groups', 'concept_verdict')) {
            $groupColumns[] = 'concept_verdict';
        }

        $query->where(function (Builder $groupQuery) use ($studentId, $hasGroupMembersTable): void {
            $groupQuery->where('leader_id', $studentId);

            if ($hasGroupMembersTable) {
                $groupQuery->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                    $memberQuery->where('users.id', $studentId);
                });
            }
        });

        return $query->first($groupColumns);
    }

    private function isPhaseTwoAvailable(?Group $group): bool
    {
        if (! $group instanceof Group) {
            return false;
        }

        if (Schema::hasColumn('groups', 'approved_concept_submission_id')) {
            return is_numeric($group->approved_concept_submission_id)
                && (int) $group->approved_concept_submission_id > 0;
        }

        if (! Schema::hasColumn('groups', 'concept_verdict') || ! is_string($group->concept_verdict)) {
            return false;
        }

        $normalizedVerdict = strtolower(trim($group->concept_verdict));

        if ($normalizedVerdict === '') {
            return false;
        }

        if (str_contains($normalizedVerdict, 'failed') || str_contains($normalizedVerdict, 'deferred') || str_contains($normalizedVerdict, 'deffered')) {
            return false;
        }

        return str_contains($normalizedVerdict, 'pass') || str_contains($normalizedVerdict, 'approved');
    }

    /**
     * @return Collection<int, DocumentRequirement>
     */
    private function resolveManuscriptRequirements(?Group $group): Collection
    {
        if (! $group instanceof Group || ! Schema::hasTable('document_requirements')) {
            return collect();
        }

        $requirementsQuery = DocumentRequirement::query()
            ->where('stage', 'Outline')
            ->orderBy('due_date')
            ->orderBy('id');

        $academicYearId = $group->programSet?->academic_year_id;

        if (is_int($academicYearId)) {
            $requirementsQuery->where(function (Builder $query) use ($academicYearId): void {
                $query->where('academic_year_id', $academicYearId)
                    ->orWhereNull('academic_year_id');
            });
        }

        return $requirementsQuery
            ->get(['id', 'requirement_type', 'due_date', 'academic_year_id', 'stage'])
            ->filter(fn (DocumentRequirement $requirement): bool => $this->isManuscriptRequirementType($requirement->requirement_type))
            ->sortBy(function (DocumentRequirement $requirement): string {
                $priority = $this->isPrimaryManuscriptRequirement($requirement->requirement_type) ? '0' : '1';
                $dueDate = (string) ($requirement->due_date?->format('Y-m-d') ?? '9999-12-31');

                return $priority.'-'.$dueDate.'-'.str_pad((string) $requirement->id, 10, '0', STR_PAD_LEFT);
            })
            ->values();
    }

    /**
     * @param  Collection<int, int>  $requirementIds
     */
    private function resolveCurrentSubmission(?int $groupId, Collection $requirementIds): ?DocumentSubmission
    {
        if ($groupId === null || $requirementIds->isEmpty() || ! Schema::hasTable('document_submissions')) {
            return null;
        }

        return DocumentSubmission::query()
            ->with('requirement:id,requirement_type,stage')
            ->where('group_id', $groupId)
            ->whereIn('document_requirement_id', $requirementIds->all())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first([
                'id',
                'group_id',
                'document_requirement_id',
                'file_name',
                'file_size',
                'status',
                'adviser_status',
                'created_at',
            ]);
    }

    private function isManuscriptRequirementType(?string $requirementType): bool
    {
        $normalizedRequirementType = strtolower(trim((string) $requirementType));

        return str_contains($normalizedRequirementType, 'manuscript')
            || str_contains($normalizedRequirementType, 'project outline')
            || $normalizedRequirementType === 'outline';
    }

    private function isPrimaryManuscriptRequirement(?string $requirementType): bool
    {
        return str_contains(strtolower(trim((string) $requirementType)), 'manuscript');
    }

    private function formatFileSize(?int $size): ?string
    {
        if (! is_int($size) || $size <= 0) {
            return null;
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $value = (float) $size;
        $unitIndex = 0;

        while ($value >= 1024 && $unitIndex < count($units) - 1) {
            $value /= 1024;
            $unitIndex++;
        }

        $formatted = $unitIndex === 0
            ? (string) ((int) $value)
            : number_format($value, 1);

        return $formatted.' '.$units[$unitIndex];
    }
}
