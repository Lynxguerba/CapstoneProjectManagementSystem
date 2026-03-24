<?php

namespace App\Http\Requests\Student;

use App\Models\Group;
use App\Models\StudentProgram;
use App\Models\TitleCategory;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;

class UpdateStudentConceptSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasRole('student');
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $studentProgram = $this->resolveStudentProgram($this->user()?->id);

        return [
            'title' => ['required', 'string', 'max:255'],
            'title_category_id' => [
                'required',
                'integer',
                function (string $attribute, mixed $value, Closure $fail) use ($studentProgram): void {
                    if (! Schema::hasTable('title_categories')) {
                        $fail('Category list is unavailable right now.');

                        return;
                    }

                    $isValidCategory = TitleCategory::query()
                        ->whereKey($value)
                        ->where('program', $studentProgram)
                        ->exists();

                    if (! $isValidCategory) {
                        $fail('Select a valid category for your program.');
                    }
                },
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Enter a concept title.',
            'title_category_id.required' => 'Select a concept category.',
        ];
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

            $group = Group::query()
                ->with('programSet:id,program')
                ->where(function (Builder $query) use ($studentId, $hasGroupMembersTable): void {
                    $query->where('leader_id', $studentId);

                    if ($hasGroupMembersTable) {
                        $query->orWhereHas('members', function (Builder $memberQuery) use ($studentId): void {
                            $memberQuery->where('users.id', $studentId);
                        });
                    }
                })
                ->first();

            $program = $group?->programSet?->program;

            if (in_array($program, ['BSIT', 'BSIS'], true)) {
                return (string) $program;
            }
        }

        return 'BSIT';
    }
}
