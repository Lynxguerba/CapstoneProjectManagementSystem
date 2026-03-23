<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\StudentProgram;
use App\Models\TitleCategory;
use App\Models\TitleRepository;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class StudentTitleRepositoryController extends Controller
{
    public function __invoke(): Response
    {
        /** @var User|null $student */
        $student = Auth::guard('web')->user();
        $studentProgram = $this->resolveStudentProgram($student?->id);

        $categories = [];
        $titles = [];

        if (Schema::hasTable('title_categories')) {
            $categories = TitleCategory::query()
                ->where('program', $studentProgram)
                ->orderBy('name')
                ->pluck('name')
                ->values()
                ->all();
        }

        if (Schema::hasTable('title_repositories') && Schema::hasTable('title_categories')) {
            $titles = TitleRepository::query()
                ->with([
                    'category:id,name,program',
                    'academicYear:id,label,start_year,end_year',
                    'adviser:id,name,first_name,last_name',
                ])
                ->whereHas('category', function (Builder $query) use ($studentProgram): void {
                    $query->where('program', $studentProgram);
                })
                ->get(['id', 'title', 'title_category_id', 'academic_year_id', 'adviser_id', 'status'])
                ->sortByDesc(fn (TitleRepository $title): int => (int) ($title->academicYear?->start_year ?? 0))
                ->values()
                ->map(function (TitleRepository $title): array {
                    return [
                        'id' => $title->id,
                        'title' => $title->title,
                        'academicYear' => $this->normalizeAcademicYearLabel($title->academicYear?->label),
                        'adviser' => $this->resolveDisplayName($title->adviser),
                        'status' => in_array($title->status, ['Approved', 'Archived'], true) ? $title->status : 'Approved',
                        'category' => $title->category?->name ?? 'Uncategorized',
                    ];
                })
                ->all();
        }

        return Inertia::render('Student/titles', [
            'studentProgram' => $studentProgram,
            'categories' => $categories,
            'titles' => $titles,
        ]);
    }

    private function resolveStudentProgram(?int $studentId): string
    {
        if ($studentId === null) {
            return 'BSIT';
        }

        if (Schema::hasTable('student_program')) {
            $program = StudentProgram::query()
                ->where('student_id', $studentId)
                ->value('program');

            if (in_array($program, ['BSIT', 'BSIS'], true)) {
                return (string) $program;
            }
        }

        if (Schema::hasTable('groups') && Schema::hasTable('program_sets')) {
            $hasGroupMembersTable = Schema::hasTable('group_members');

            $groupQuery = Group::query()
                ->with('programSet:id,program')
                ->where(function (Builder $query) use ($studentId, $hasGroupMembersTable): void {
                    $query->where('leader_id', $studentId);

                    if ($hasGroupMembersTable) {
                        $query->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                            $memberQuery->where('users.id', $studentId);
                        });
                    }
                });

            $group = $groupQuery->first();
            $program = $group?->programSet?->program;

            if (in_array($program, ['BSIT', 'BSIS'], true)) {
                return (string) $program;
            }
        }

        return 'BSIT';
    }

    private function resolveDisplayName(?User $user): string
    {
        if (! $user) {
            return 'N/A';
        }

        $firstName = is_string($user->first_name) ? trim($user->first_name) : '';
        $lastName = is_string($user->last_name) ? trim($user->last_name) : '';
        $fullName = trim($firstName.' '.$lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        if (is_string($user->name) && trim($user->name) !== '') {
            return (string) $user->name;
        }

        return 'N/A';
    }

    private function normalizeAcademicYearLabel(?string $label): string
    {
        if (! is_string($label) || trim($label) === '') {
            return 'N/A';
        }

        return trim((string) preg_replace('/^A\\.Y\\s*/i', '', $label));
    }
}
