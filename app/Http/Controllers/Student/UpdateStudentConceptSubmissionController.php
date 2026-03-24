<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\UpdateStudentConceptSubmissionRequest;
use App\Models\DocumentSubmission;
use App\Models\Group;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class UpdateStudentConceptSubmissionController extends Controller
{
    public function __invoke(UpdateStudentConceptSubmissionRequest $request, DocumentSubmission $submission): RedirectResponse
    {
        $group = $this->resolveStudentGroup($request->user()?->id);
        $submission->loadMissing('requirement:id,stage');

        abort_unless(
            $group instanceof Group
                && $submission->group_id === $group->id
                && $submission->requirement?->stage === 'Concept',
            403,
        );

        if (! Schema::hasColumn('document_submissions', 'title_category_id')) {
            throw ValidationException::withMessages([
                'title_category_id' => 'Concept categories are not available yet. Please run the latest migrations first.',
            ]);
        }

        $submission->update([
            'file_name' => trim((string) $request->validated()['title']),
            'title_category_id' => (int) $request->validated()['title_category_id'],
        ]);

        return redirect()
            ->route('student.concepts.submissions.show', $submission)
            ->with('success', 'Concept details updated successfully.');
    }

    private function resolveStudentGroup(?int $studentId): ?Group
    {
        if ($studentId === null || ! Schema::hasTable('groups')) {
            return null;
        }

        $hasGroupMembersTable = Schema::hasTable('group_members');

        return Group::query()
            ->where(function (Builder $groupQuery) use ($studentId, $hasGroupMembersTable): void {
                $groupQuery->where('leader_id', $studentId);

                if ($hasGroupMembersTable) {
                    $groupQuery->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                        $memberQuery->where('users.id', $studentId);
                    });
                }
            })
            ->first(['id']);
    }
}
