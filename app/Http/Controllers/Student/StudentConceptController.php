<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use App\Models\StudentProgram;
use App\Models\TitleCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StudentConceptController extends Controller
{
    public function __invoke(): Response
    {
        /** @var User|null $student */
        $student = Auth::guard('web')->user();
        $group = $this->resolveStudentGroup($student?->id);
        $isGroupLeader = $group !== null
            && $student !== null
            && (int) $group->leader_id === (int) $student->id;
        $studentProgram = $this->resolveStudentProgram($student?->id, $group);
        $academicYearId = $group?->programSet?->academic_year_id;
        $conceptRequirements = $this->resolveConceptRequirements($academicYearId);
        $categoryOptions = $this->resolveConceptCategories($studentProgram);

        /** @var DocumentRequirement|null $activeRequirement */
        $activeRequirement = $conceptRequirements
            ->sortBy(fn (DocumentRequirement $requirement) => (string) ($requirement->due_date?->format('Y-m-d') ?? '9999-12-31'))
            ->first();

        $conceptSubmissions = $this->resolveConceptSubmissions(
            $group?->id,
            $conceptRequirements->pluck('id')->values(),
        );

        $deadlineDate = $activeRequirement?->due_date;
        $hasConceptRequirement = $activeRequirement instanceof DocumentRequirement;
        $isReadyToSubmit = $group !== null && $hasConceptRequirement;

        $readinessMessage = ! $group
            ? 'You are not assigned to a group yet. Concept submission is locked.'
            : (! $hasConceptRequirement
                ? 'Waiting for your instructor to declare the Concept Paper requirement.'
                : ($isGroupLeader
                    ? 'Concept requirement is declared by your instructor. You can now submit your Concept Paper.'
                    : 'Only your Project Manager can submit concept files. You can still monitor submissions and progress here.'));

        return Inertia::render('Student/concepts', [
            'group' => $group ? [
                'id' => $group->id,
                'name' => $group->name,
                'programSetName' => $group->programSet?->name,
                'academicYear' => $group->programSet?->academicYear?->label,
            ] : null,
            'isGroupLeader' => $isGroupLeader,
            'studentProgram' => $studentProgram,
            'categoryOptions' => $categoryOptions
                ->map(fn (TitleCategory $category): array => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                ])
                ->values()
                ->all(),
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
            'requirements' => $conceptRequirements
                ->map(fn (DocumentRequirement $requirement): array => [
                    'id' => $requirement->id,
                    'type' => (string) $requirement->requirement_type,
                    'deadlineDate' => $requirement->due_date?->format('Y-m-d'),
                    'deadlineLabel' => $requirement->due_date?->format('F d, Y').' · 11:59 PM',
                ])
                ->values()
                ->all(),
            'submissions' => $conceptSubmissions
                ->map(fn (DocumentSubmission $submission): array => [
                    'id' => $submission->id,
                    'title' => (string) $submission->file_name,
                    'titleCategoryId' => $submission->title_category_id,
                    'category' => $submission->titleCategory?->name,
                    'instructorStatus' => (string) ($submission->status ?? 'Submitted'),
                    'adviserStatus' => (string) ($submission->adviser_status ?? 'Submitted'),
                    'adviserReviewedAt' => $submission->adviser_reviewed_at?->format('Y-m-d H:i'),
                    'submittedAt' => $submission->created_at?->format('Y-m-d H:i'),
                    'requirementType' => (string) ($submission->requirement?->requirement_type ?? 'Concept Paper'),
                    'mimeType' => $submission->mime_type,
                    'fileSizeLabel' => $this->formatFileSize($submission->file_size),
                    'fileUrl' => $submission->file_path !== null ? Storage::disk('public')->url($submission->file_path) : null,
                    'viewUrl' => route('student.concepts.submissions.show', $submission),
                ])
                ->values()
                ->all(),
            'notifications' => [
                'deadline' => $deadlineDate?->format('F d, Y').' · 11:59 PM',
                'approvedTitlesUrl' => route('student.titles'),
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
            $query->with('programSet:id,name,program,academic_year_id');

            if ($hasAcademicYearsTable) {
                $query->with('programSet.academicYear:id,label');
            }
        }

        $query->where(function (Builder $groupQuery) use ($studentId, $hasGroupMembersTable): void {
            $groupQuery->where('leader_id', $studentId);

            if ($hasGroupMembersTable) {
                $groupQuery->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                    $memberQuery->where('users.id', $studentId);
                });
            }
        });

        return $query->first(['id', 'name', 'program_set_id', 'leader_id']);
    }

    private function resolveStudentProgram(?int $studentId, ?Group $group = null): string
    {
        if ($studentId !== null && Schema::hasTable('student_program')) {
            $program = StudentProgram::query()
                ->where('student_id', $studentId)
                ->value('program');

            if (in_array($program, ['BSIT', 'BSIS'], true)) {
                return (string) $program;
            }
        }

        $program = $group?->programSet?->program;

        if (in_array($program, ['BSIT', 'BSIS'], true)) {
            return (string) $program;
        }

        return 'BSIT';
    }

    /**
     * @return Collection<int, DocumentRequirement>
     */
    private function resolveConceptRequirements(?int $academicYearId): Collection
    {
        if (! Schema::hasTable('document_requirements')) {
            return collect();
        }

        $baseQuery = DocumentRequirement::query()
            ->where('stage', 'Concept')
            ->when(is_int($academicYearId), fn (Builder $query) => $query->where('academic_year_id', $academicYearId))
            ->orderBy('due_date')
            ->orderByDesc('id');

        $keywordMatched = (clone $baseQuery)
            ->whereRaw('LOWER(requirement_type) like ?', ['%concept%'])
            ->get(['id', 'requirement_type', 'due_date', 'academic_year_id', 'stage']);

        if ($keywordMatched->isNotEmpty()) {
            return $keywordMatched;
        }

        return $baseQuery->get(['id', 'requirement_type', 'due_date', 'academic_year_id', 'stage']);
    }

    /**
     * @param  Collection<int, int>  $requirementIds
     * @return Collection<int, DocumentSubmission>
     */
    private function resolveConceptSubmissions(?int $groupId, Collection $requirementIds): Collection
    {
        if (
            $groupId === null
            || $requirementIds->isEmpty()
            || ! Schema::hasTable('document_submissions')
        ) {
            return collect();
        }

        return DocumentSubmission::query()
            ->with([
                'requirement:id,requirement_type',
                'titleCategory:id,name,program',
            ])
            ->where('group_id', $groupId)
            ->whereIn('document_requirement_id', $requirementIds->all())
            ->orderByDesc('created_at')
            ->get([
                'id',
                'group_id',
                'document_requirement_id',
                'title_category_id',
                'file_name',
                'file_path',
                'mime_type',
                'file_size',
                'status',
                'adviser_status',
                'adviser_reviewed_at',
                'created_at',
            ]);
    }

    /**
     * @return Collection<int, TitleCategory>
     */
    private function resolveConceptCategories(string $studentProgram): Collection
    {
        if (! Schema::hasTable('title_categories')) {
            return collect();
        }

        return TitleCategory::query()
            ->where('program', $studentProgram)
            ->orderBy('name')
            ->get(['id', 'program', 'name', 'description']);
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
