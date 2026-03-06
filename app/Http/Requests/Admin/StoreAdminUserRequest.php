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
    private const AVAILABLE_STATUSES = [
        'active',
        'inactive',
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
        $entityType = $this->query('type', 'user');

        if ($entityType === 'faculty') {
            return [
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'roles' => ['required', 'array', 'min:1'],
                'roles.*' => ['required', 'string', Rule::in(self::FACULTY_ASSIGNABLE_ROLES)],
                'password' => ['required', 'string', 'min:8', 'max:255'],
                'status' => ['nullable', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            ];
        }

        if ($entityType === 'student') {
            return [
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'program' => ['required', 'string', Rule::in(['BSIT', 'BSIS'])],
                'password' => ['required', 'string', 'min:8', 'max:255'],
                'status' => ['nullable', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            ];
        }

        return [
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
        $entityType = $this->query('type', 'user');

        if ($entityType === 'student') {
            return [
                'program.required' => 'Program is required.',
                'program.in' => 'Program must be BSIT or BSIS.',
                'email.required' => 'Email is required.',
                'email.email' => 'Email must be a valid email address.',
                'email.unique' => 'This student email is already in use.',
                'password.required' => 'Password is required.',
                'password.min' => 'Password must be at least 8 characters.',
                'status.in' => 'Status must be active or inactive.',
            ];
        }

        return [
            'roles.required' => 'At least one role is required.',
            'roles.array' => 'Roles must be sent as a list.',
            'roles.min' => 'At least one role is required.',
            'roles.*.in' => 'One or more selected roles are invalid.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
            'status.in' => 'The selected status is invalid.',
            'program.in' => 'Program must be BSIT or BSIS.',
        ];
    }
}
