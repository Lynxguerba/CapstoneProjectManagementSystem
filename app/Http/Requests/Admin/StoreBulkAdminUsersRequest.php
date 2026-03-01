<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBulkAdminUsersRequest extends FormRequest
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
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.name' => ['required', 'string', 'max:255'],
            'rows.*.email' => ['required', 'string', 'email', 'max:255', 'distinct', 'unique:users,email'],
            'rows.*.role' => ['required', 'string', Rule::in(self::AVAILABLE_ROLES)],
            'rows.*.status' => ['nullable', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            'rows.*.password' => ['required', 'string', 'min:8', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'rows.required' => 'No users found in the uploaded CSV file.',
            'rows.*.email.distinct' => 'Duplicate email addresses were found in the uploaded CSV file.',
            'rows.*.email.unique' => 'One or more email addresses already exist.',
            'rows.*.role.in' => 'One or more roles are invalid.',
            'rows.*.status.in' => 'One or more statuses are invalid.',
        ];
    }
}
