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
                'email' => ['required', 'string', 'email', 'max:255', 'unique:faculties,email'],
                'roles' => ['required', 'array', 'min:1'],
                'roles.*' => ['required', 'string', Rule::in(['admin', 'faculty'])],
                'status' => ['nullable', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            ];
        }

        if ($entityType === 'student') {
            return [
                'first_name' => ['required', 'string', 'max:255'],
                'last_name' => ['required', 'string', 'max:255'],
                'program' => ['required', 'string', Rule::in(['BSIT', 'BSIS'])],
                'password' => ['required', 'string', 'min:8', 'max:255'],
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
                'password.required' => 'Password is required.',
                'password.min' => 'Password must be at least 8 characters.',
            ];
        }

        return [
            'roles.required' => 'At least one role is required.',
            'roles.array' => 'Roles must be sent as a list.',
            'roles.min' => 'At least one role is required.',
            'roles.*.in' => 'One or more selected roles are invalid.',
            'status.in' => 'The selected status is invalid.',
        ];
    }
}
