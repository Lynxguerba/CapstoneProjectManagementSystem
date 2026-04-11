<?php

namespace App\Http\Requests\Admin;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdminUserRequest extends FormRequest
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
    private const AVAILABLE_STATUSES = [
        'active',
        'inactive',
        'pending',
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $entityType = $this->resolveEntityType();
        $sharedRules = [
            'type' => ['sometimes', 'string', Rule::in(self::ENTITY_TYPES)],
        ];

        if ($entityType === 'faculty') {
            $programRules = [
                'nullable',
                'string',
                Rule::in(['BSIT', 'BSIS']),
                Rule::requiredIf(fn (): bool => $this->hasProgramChairpersonRole()),
            ];

            return [
                ...$sharedRules,
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'roles' => ['required', 'array', 'min:1'],
                'roles.*' => ['required', 'string', Rule::in(self::FACULTY_ASSIGNABLE_ROLES)],
                'program' => $programRules,
                'password' => ['required', 'string', 'min:8', 'max:255'],
                'status' => ['nullable', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            ];
        }

        if ($entityType === 'student') {
            return [
                ...$sharedRules,
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'program' => ['required', 'string', Rule::in(['BSIT', 'BSIS'])],
                'password' => ['required', 'string', 'min:8', 'max:255'],
                'status' => ['nullable', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            ];
        }

        return [
            ...$sharedRules,
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['required', 'string', Rule::in(Role::slugs())],
            'status' => ['nullable', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'program' => ['nullable', 'string', Rule::in(['BSIT', 'BSIS'])],
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
                'program.required' => 'Program is required.',
                'program.in' => 'Program must be BSIT or BSIS.',
                'email.required' => 'Email is required.',
                'email.email' => 'Email must be a valid email address.',
                'email.unique' => 'This student email is already in use.',
                'password.required' => 'Password is required.',
                'password.min' => 'Password must be at least 8 characters.',
                'status.in' => 'Status must be active, inactive, or pending.',
            ];
        }

        return [
            'roles.required' => 'At least one role is required.',
            'roles.array' => 'Roles must be sent as a list.',
            'roles.min' => 'At least one role is required.',
            'roles.*.in' => 'One or more selected roles are invalid.',
            'program.required' => 'Program is required when Program Chairperson role is selected.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
            'status.in' => 'The selected status is invalid.',
            'program.in' => 'Program must be BSIT or BSIS.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $program = $this->input('program');
        $normalizedProgram = is_string($program) ? strtoupper(trim($program)) : null;
        $roles = $this->input('roles');

        $payload = [
            'program' => is_string($normalizedProgram) && $normalizedProgram !== '' ? $normalizedProgram : null,
        ];

        if (is_array($roles)) {
            $payload['roles'] = collect($roles)
                ->map(function (mixed $role): mixed {
                    if (! is_string($role)) {
                        return $role;
                    }

                    return Role::normalizeRole($role) ?? trim($role);
                })
                ->values()
                ->all();
        }

        $this->merge($payload);
    }

    private function resolveEntityType(): string
    {
        $entityType = $this->input('type', $this->query('type', 'user'));

        if (! is_string($entityType)) {
            return 'user';
        }

        return in_array($entityType, self::ENTITY_TYPES, true) ? $entityType : 'user';
    }

    private function hasProgramChairpersonRole(): bool
    {
        $roles = $this->input('roles', []);

        if (! is_array($roles)) {
            return false;
        }

        return collect($roles)
            ->contains(fn (mixed $role): bool => is_string($role) && Role::normalizeRole($role) === 'program_chairperson');
    }
}
