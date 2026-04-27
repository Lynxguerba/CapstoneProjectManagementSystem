<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreStudentManuscriptSubmissionRequest;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StoreStudentManuscriptSubmissionController extends Controller
{
    public function __invoke(StoreStudentManuscriptSubmissionRequest $request): RedirectResponse
    {
        $user = $request->user();
        $group = $this->resolveStudentGroup($user?->id);

        if (! $group instanceof Group) {
            throw ValidationException::withMessages([
                'manuscript_file' => 'You must be assigned to a group before submitting a manuscript.',
            ]);
        }

        if ((int) $group->leader_id !== (int) ($user?->id ?? 0)) {
            throw ValidationException::withMessages([
                'manuscript_file' => 'Only your group Project Manager can submit the manuscript file.',
            ]);
        }

        if (! $this->isPhaseTwoAvailable($group)) {
            throw ValidationException::withMessages([
                'manuscript_file' => 'Phase 2 manuscript submission is locked until your group has an approved project title from Phase 1.',
            ]);
        }

        $manuscriptRequirements = $this->resolveManuscriptRequirements($group);
        $activeRequirement = $manuscriptRequirements->first();

        if (! $activeRequirement instanceof DocumentRequirement) {
            throw ValidationException::withMessages([
                'manuscript_file' => 'No active manuscript requirement is available for your group yet.',
            ]);
        }

        if (! Schema::hasTable('document_submissions')) {
            throw ValidationException::withMessages([
                'manuscript_file' => 'Document submissions table is not available. Please run migrations first.',
            ]);
        }

        $manuscriptFile = $request->file('manuscript_file');
        $originalFileName = pathinfo((string) $manuscriptFile->getClientOriginalName(), PATHINFO_FILENAME);
        $submissionTitle = Str::of($originalFileName)
            ->replace(['_', '-'], ' ')
            ->squish()
            ->title()
            ->value();
        $submissionTitle = $submissionTitle !== '' ? $submissionTitle : 'Manuscript Submission';
        $safeSlug = Str::slug($submissionTitle);
        $timestamp = now()->format('Ymd_His');
        $storedFileName = ($safeSlug !== '' ? $safeSlug : 'manuscript')."-{$group->id}-{$timestamp}.pdf";
        $storedPath = $manuscriptFile->storeAs("document-submissions/group-{$group->id}/outline/manuscript", $storedFileName, 'public');

        $existingSubmissions = $this->resolveExistingManuscriptSubmissions($group->id, $manuscriptRequirements->pluck('id')->values());
        $existingSubmissionIds = $existingSubmissions->pluck('id')->all();
        $existingFilePaths = $existingSubmissions
            ->pluck('file_path')
            ->filter(fn ($path): bool => is_string($path) && trim($path) !== '')
            ->all();

        if ($existingSubmissionIds !== []) {
            DocumentSubmission::query()->whereIn('id', $existingSubmissionIds)->delete();
        }

        foreach ($existingFilePaths as $existingFilePath) {
            if ($existingFilePath !== $storedPath) {
                Storage::disk('public')->delete($existingFilePath);
            }
        }

        DocumentSubmission::query()->create([
            'group_id' => $group->id,
            'document_requirement_id' => $activeRequirement->id,
            'title_category_id' => null,
            'file_name' => $submissionTitle,
            'file_path' => $storedPath,
            'mime_type' => $manuscriptFile->getClientMimeType(),
            'file_size' => $manuscriptFile->getSize(),
            'status' => 'Submitted',
            'submitted_by' => $user?->id,
        ]);

        $successMessage = $existingSubmissionIds === []
            ? 'Manuscript submitted successfully.'
            : 'Manuscript replaced successfully.';

        return redirect()->route('student.manuscripts')->with('success', $successMessage);
    }

    private function resolveStudentGroup(?int $studentId): ?Group
    {
        if ($studentId === null || ! Schema::hasTable('groups')) {
            return null;
        }

        $hasGroupMembersTable = Schema::hasTable('group_members');

        $query = Group::query()
            ->with('programSet:id,academic_year_id')
            ->where(function (Builder $groupQuery) use ($studentId, $hasGroupMembersTable): void {
                $groupQuery->where('leader_id', $studentId);

                if ($hasGroupMembersTable) {
                    $groupQuery->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                        $memberQuery->where('users.id', $studentId);
                    });
                }
            });

        $groupColumns = ['id', 'program_set_id', 'leader_id'];

        if (Schema::hasColumn('groups', 'approved_concept_submission_id')) {
            $groupColumns[] = 'approved_concept_submission_id';
        }

        if (Schema::hasColumn('groups', 'concept_verdict')) {
            $groupColumns[] = 'concept_verdict';
        }

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
    private function resolveManuscriptRequirements(Group $group): Collection
    {
        if (! Schema::hasTable('document_requirements')) {
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
     * @return Collection<int, DocumentSubmission>
     */
    private function resolveExistingManuscriptSubmissions(int $groupId, Collection $requirementIds): Collection
    {
        if ($requirementIds->isEmpty() || ! Schema::hasTable('document_submissions')) {
            return collect();
        }

        return DocumentSubmission::query()
            ->where('group_id', $groupId)
            ->whereIn('document_requirement_id', $requirementIds->all())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(['id', 'file_path']);
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
}
