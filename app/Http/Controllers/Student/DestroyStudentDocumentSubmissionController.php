<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\DocumentSubmission;
use App\Models\Group;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class DestroyStudentDocumentSubmissionController extends Controller
{
    public function __invoke(DocumentSubmission $submission): RedirectResponse
    {
        $userId = request()->user()?->id;
        $group = $this->resolveStudentGroup($userId);

        $submission->loadMissing([
            'requirement:id,requirement_type',
            'adviserRecommendationDocument:id,document_submission_id',
        ]);

        abort_unless(
            $group instanceof Group
                && $submission->group_id === $group->id
                && (int) $group->leader_id === (int) ($userId ?? 0)
                && ! $this->isRecommendationSubmission($submission),
            403,
        );

        $filePath = $submission->file_path;
        $submission->delete();

        if (is_string($filePath) && $filePath !== '') {
            Storage::disk('public')->delete($filePath);
        }

        return redirect()->route('student.documents')->with('success', 'Document file removed successfully.');
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

    private function isRecommendationSubmission(DocumentSubmission $submission): bool
    {
        $requirementType = strtolower(trim((string) ($submission->requirement?->requirement_type ?? '')));

        return str_contains($requirementType, 'recommendation')
            || $submission->adviserRecommendationDocument !== null;
    }
}
