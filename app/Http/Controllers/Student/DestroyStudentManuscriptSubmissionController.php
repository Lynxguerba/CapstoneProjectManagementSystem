<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\DocumentSubmission;
use App\Models\Group;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class DestroyStudentManuscriptSubmissionController extends Controller
{
    public function __invoke(DocumentSubmission $submission): RedirectResponse
    {
        $userId = request()->user()?->id;
        $group = $this->resolveStudentGroup($userId);
        $submission->loadMissing('requirement:id,stage,requirement_type');

        abort_unless(
            $group instanceof Group
                && $submission->group_id === $group->id
                && (int) $group->leader_id === (int) ($userId ?? 0)
                && $submission->requirement?->stage === 'Outline'
                && $this->isManuscriptRequirementType($submission->requirement?->requirement_type),
            403,
        );

        $filePath = $submission->file_path;
        $submission->delete();

        if (is_string($filePath) && $filePath !== '') {
            Storage::disk('public')->delete($filePath);
        }

        return redirect()->route('student.manuscripts')->with('success', 'Manuscript removed successfully.');
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

    private function isManuscriptRequirementType(?string $requirementType): bool
    {
        $normalizedRequirementType = strtolower(trim((string) $requirementType));

        return str_contains($normalizedRequirementType, 'manuscript')
            || str_contains($normalizedRequirementType, 'project outline')
            || $normalizedRequirementType === 'outline';
    }
}
