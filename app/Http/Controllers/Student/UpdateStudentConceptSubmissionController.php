<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\UpdateStudentConceptSubmissionRequest;
use App\Models\DocumentSubmission;
use App\Models\Group;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;

class UpdateStudentConceptSubmissionController extends Controller
{
    public function __invoke(UpdateStudentConceptSubmissionRequest $request, DocumentSubmission $submission): RedirectResponse
    {
        $userId = $request->user()?->id;
        $group = $this->resolveStudentGroup($userId);
        $submission->loadMissing('requirement:id,stage');

        abort_unless(
            $group instanceof Group
                && $submission->group_id === $group->id
                && (int) $group->leader_id === (int) ($userId ?? 0)
                && $submission->requirement?->stage === 'Concept',
            403,
        );

        $submission->update([
            'file_name' => trim((string) $request->validated()['title']),
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
            ->first(['id', 'leader_id']);
    }
}
