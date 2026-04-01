<?php

namespace App\Http\Requests\Admin;

use App\Models\Role;
use App\Models\User;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBulkAdminUsersRequest extends FormRequest
{
    /**
     * @var array<int, string>
     */
    private const ENTITY_TYPES = [
        'user',
        'faculty',
        'student',
    ];

    /**
     * @var array<int, string>
     */
    private const FACULTY_ASSIGNABLE_ROLES = [
        'admin',
        'adviser',
        'panelist',
        'instructor',
        'dean',
        'program_chairperson',
    ];

    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasRole('admin');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $entityType = $this->resolveEntityType();
        $sharedRules = [
            'type' => ['sometimes', 'string', Rule::in(self::ENTITY_TYPES)],
        ];

        if ($entityType === 'faculty') {
            return [
                ...$sharedRules,
                'rows' => ['required', 'array', 'min:1'],
                'rows.*.first_name' => ['required', 'string', 'max:255'],
                'rows.*.last_name' => ['required', 'string', 'max:255'],
                'rows.*.email' => ['required', 'string', 'email', 'max:255', 'distinct'],
                'rows.*.roles' => ['required', 'array', 'min:1'],
                'rows.*.roles.*' => ['required', 'string', Rule::in(self::FACULTY_ASSIGNABLE_ROLES)],
                'rows.*.password' => ['required', 'string', 'min:8', 'max:255'],
            ];
        }

        if ($entityType === 'student') {
            return [
                ...$sharedRules,
                'rows' => ['required', 'array', 'min:1'],
                'rows.*.first_name' => ['required', 'string', 'max:255'],
                'rows.*.last_name' => ['required', 'string', 'max:255'],
                'rows.*.email' => ['required', 'string', 'email', 'max:255', 'distinct'],
                'rows.*.program' => ['required', 'string', Rule::in(['BSIT', 'BSIS'])],
                'rows.*.password' => ['required', 'string', 'min:8', 'max:255'],
            ];
        }

        return [
            ...$sharedRules,
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.first_name' => ['required', 'string', 'max:255'],
            'rows.*.last_name' => ['required', 'string', 'max:255'],
            'rows.*.email' => ['required', 'string', 'email', 'max:255', 'distinct'],
            'rows.*.roles' => ['required', 'array', 'min:1'],
            'rows.*.roles.*' => ['required', 'string', Rule::in(Role::slugs())],
            'rows.*.password' => ['required', 'string', 'min:8', 'max:255'],
            'rows.*.program' => ['nullable', 'string', Rule::in(['BSIT', 'BSIS'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $entityType = $this->resolveEntityType();

        if ($entityType === 'student') {
            return [
                'rows.required' => 'No students found in the uploaded CSV file.',
                'rows.*.email.required' => 'Each row must include an email.',
                'rows.*.email.email' => 'Each email must be valid.',
                'rows.*.email.distinct' => 'Duplicate student emails were found in the uploaded CSV file.',
                'rows.*.email.unique' => 'One or more student emails already exist.',
                'rows.*.program.required' => 'Each row must include a program.',
                'rows.*.program.in' => 'Program must be BSIT or BSIS.',
                'rows.*.password.required' => 'Each row must include a password.',
                'rows.*.password.min' => 'Each password must be at least 8 characters.',
            ];
        }

        return [
            'rows.required' => 'No users found in the uploaded CSV file.',
            'rows.*.email.distinct' => 'Duplicate email addresses were found in the uploaded CSV file.',
            'rows.*.email.unique' => 'One or more email addresses already exist.',
            'rows.*.roles.required' => 'Each row must include at least one role.',
            'rows.*.roles.*.in' => 'One or more roles are invalid.',
            'rows.*.password.required' => 'Each row must include a password.',
            'rows.*.password.min' => 'Each password must be at least 8 characters.',
            'rows.*.program.in' => 'Program must be BSIT or BSIS.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $rows = $this->input('rows', []);

            if (! is_array($rows) || count($rows) === 0) {
                return;
            }

            $emailsByIndex = collect($rows)
                ->mapWithKeys(function (mixed $row, int $index): array {
                    if (! is_array($row)) {
                        return [];
                    }

                    $email = $row['email'] ?? null;

                    if (! is_string($email) || trim($email) === '') {
                        return [];
                    }

                    return [$index => strtolower(trim($email))];
                });

            if ($emailsByIndex->isEmpty()) {
                return;
            }

            $existingEmails = User::query()
                ->whereIn('email', $emailsByIndex->values()->all())
                ->pluck('email')
                ->filter(fn (mixed $email): bool => is_string($email) && trim($email) !== '')
                ->map(fn (string $email): string => strtolower(trim($email)))
                ->values()
                ->all();

            if ($existingEmails === []) {
                return;
            }

            $existingEmailLookup = array_fill_keys($existingEmails, true);
            $duplicateEmailMessage = $this->duplicateEmailMessage();

            $emailsByIndex->each(function (string $email, int $index) use ($duplicateEmailMessage, $existingEmailLookup, $validator): void {
                if (array_key_exists($email, $existingEmailLookup)) {
                    $validator->errors()->add("rows.{$index}.email", $duplicateEmailMessage);
                }
            });
        });
    }

    private function duplicateEmailMessage(): string
    {
        return $this->resolveEntityType() === 'student'
            ? 'One or more student emails already exist.'
            : 'One or more email addresses already exist.';
    }

    private function resolveEntityType(): string
    {
        $queryEntityType = $this->query('type');
        if (is_string($queryEntityType) && in_array($queryEntityType, self::ENTITY_TYPES, true)) {
            return $queryEntityType;
        }

        $entityType = $this->input('type', 'user');

        if (! is_string($entityType)) {
            return 'user';
        }

        return in_array($entityType, self::ENTITY_TYPES, true) ? $entityType : 'user';
    }
}
