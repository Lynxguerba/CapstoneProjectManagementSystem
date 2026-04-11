<?php

namespace App\Http\Requests\Admin;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminUserRequest extends FormRequest
{
    /**
     * @var array<int, string>
     */
    private const AVAILABLE_STATUSES = [
        'active',
        'inactive',
        'pending',
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
        $programRules = ['nullable', 'string', Rule::in(['BSIT', 'BSIS'])];

        if ($this->query('from') === 'student') {
            $programRules = ['required', 'string', Rule::in(['BSIT', 'BSIS'])];
        } elseif ($this->query('from') === 'faculty' && $this->hasProgramChairpersonRole()) {
            $programRules = ['required', 'string', Rule::in(['BSIT', 'BSIS'])];
        }

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['required', 'string', Rule::in(Role::slugs())],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            'status' => ['required', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            'program' => $programRules,
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'roles.required' => 'At least one role is required.',
            'roles.array' => 'Roles must be sent as a list.',
            'roles.min' => 'At least one role is required.',
            'roles.*.in' => 'One or more selected roles are invalid.',
            'password.min' => 'Password must be at least 8 characters.',
            'status.in' => 'The selected status is invalid.',
            'program.required' => 'Program is required for student records and Program Chairperson role.',
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
