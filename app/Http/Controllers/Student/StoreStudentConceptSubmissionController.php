<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StoreStudentConceptSubmissionRequest;
use App\Models\DocumentRequirement;
use App\Models\DocumentSubmission;
use App\Models\Group;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StoreStudentConceptSubmissionController extends Controller
{
    public function __invoke(StoreStudentConceptSubmissionRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $group = $this->resolveStudentGroup($user?->id);

        if (! $group instanceof Group) {
            throw ValidationException::withMessages([
                'concept_file' => 'You must be assigned to a group before submitting a concept paper.',
            ]);
        }

        $requirement = $this->resolveActiveRequirement($group);

        if (! $requirement instanceof DocumentRequirement) {
            throw ValidationException::withMessages([
                'concept_file' => 'No active concept requirement is available for your group yet.',
            ]);
        }

        if (! Schema::hasTable('document_submissions')) {
            throw ValidationException::withMessages([
                'concept_file' => 'Document submissions table is not available. Please run migrations first.',
            ]);
        }

        if (! Schema::hasColumn('document_submissions', 'title_category_id')) {
            throw ValidationException::withMessages([
                'title_category_id' => 'Concept categories are not available yet. Please run the latest migrations first.',
            ]);
        }

        $conceptFile = $request->file('concept_file');

        $slug = Str::slug((string) $validated['title']);
        $safeSlug = $slug !== '' ? $slug : 'concept-paper';
        $timestamp = now()->format('Ymd_His');
        $storedFileName = "{$safeSlug}-{$group->id}-{$timestamp}.pdf";
        $storedPath = $conceptFile->storeAs("document-submissions/group-{$group->id}/concept", $storedFileName, 'public');

        DocumentSubmission::query()->create([
            'group_id' => $group->id,
            'document_requirement_id' => $requirement->id,
            'title_category_id' => null,
            'file_name' => trim((string) $validated['title']),
            'file_path' => $storedPath,
            'mime_type' => $conceptFile->getClientMimeType(),
            'file_size' => $conceptFile->getSize(),
            'status' => 'Submitted',
            'submitted_by' => $user?->id,
        ]);

        return back()->with('success', 'Concept paper submitted successfully.');
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

        return $query->first(['id', 'program_set_id', 'leader_id']);
    }

    private function resolveActiveRequirement(Group $group): ?DocumentRequirement
    {
        if (! Schema::hasTable('document_requirements')) {
            return null;
        }

        $query = DocumentRequirement::query()
            ->where('stage', 'Concept')
            ->orderBy('due_date')
            ->orderByDesc('id');

        $academicYearId = $group->programSet?->academic_year_id;

        if (is_int($academicYearId)) {
            $query->where('academic_year_id', $academicYearId);
        }

        $keywordMatched = (clone $query)
            ->whereRaw('LOWER(requirement_type) like ?', ['%concept%'])
            ->first(['id', 'requirement_type', 'academic_year_id', 'stage']);

        if ($keywordMatched instanceof DocumentRequirement) {
            return $keywordMatched;
        }

        return $query->first(['id', 'requirement_type', 'academic_year_id', 'stage']);
    }
}
