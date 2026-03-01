<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdminUserRequest extends FormRequest
{
    /**
     * @var array<int, string>
     */
    private const AVAILABLE_ROLES = [
        'admin',
        'student',
        'adviser',
        'instructor',
        'panelist',
        'dean',
        'program_chairperson',
    ];

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

        return $user !== null && $user->role === 'admin';
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'string', Rule::in(self::AVAILABLE_ROLES)],
            'status' => ['nullable', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role.in' => 'The selected role is invalid.',
            'status.in' => 'The selected status is invalid.',
        ];
    }
}
