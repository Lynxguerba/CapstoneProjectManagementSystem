<?php

namespace App\Http\Requests\Admin;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBulkAdminUsersRequest extends FormRequest
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
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $entityType = $this->query('type', 'user');

        if ($entityType === 'faculty') {
            return [
                'rows' => ['required', 'array', 'min:1'],
                'rows.*.first_name' => ['required', 'string', 'max:255'],
                'rows.*.last_name' => ['required', 'string', 'max:255'],
                'rows.*.email' => ['required', 'string', 'email', 'max:255', 'distinct', 'unique:faculties,email'],
                'rows.*.roles' => ['required', 'array', 'min:1'],
                'rows.*.roles.*' => ['required', 'string', Rule::in(['admin', 'faculty'])],
                'rows.*.status' => ['nullable', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            ];
        }

        if ($entityType === 'student') {
            return [
                'rows' => ['required', 'array', 'min:1'],
                'rows.*.first_name' => ['required', 'string', 'max:255'],
                'rows.*.last_name' => ['required', 'string', 'max:255'],
                'rows.*.email' => ['required', 'string', 'email', 'max:255', 'distinct', 'unique:students,email'],
                'rows.*.program' => ['required', 'string', Rule::in(['BSIT', 'BSIS'])],
                'rows.*.password' => ['required', 'string', 'min:8', 'max:255'],
                'rows.*.status' => ['nullable', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            ];
        }

        return [
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.first_name' => ['required', 'string', 'max:255'],
            'rows.*.last_name' => ['required', 'string', 'max:255'],
            'rows.*.email' => ['required', 'string', 'email', 'max:255', 'distinct', 'unique:users,email'],
            'rows.*.roles' => ['required', 'array', 'min:1'],
            'rows.*.roles.*' => ['required', 'string', Rule::in(Role::slugs())],
            'rows.*.status' => ['nullable', 'string', Rule::in(self::AVAILABLE_STATUSES)],
            'rows.*.password' => ['required', 'string', 'min:8', 'max:255'],
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
                'rows.required' => 'No students found in the uploaded CSV file.',
                'rows.*.email.required' => 'Each row must include an email.',
                'rows.*.email.email' => 'Each email must be valid.',
                'rows.*.email.distinct' => 'Duplicate student emails were found in the uploaded CSV file.',
                'rows.*.email.unique' => 'One or more student emails already exist.',
                'rows.*.program.required' => 'Each row must include a program.',
                'rows.*.program.in' => 'Program must be BSIT or BSIS.',
                'rows.*.password.required' => 'Each row must include a password.',
                'rows.*.password.min' => 'Each password must be at least 8 characters.',
                'rows.*.status.in' => 'Each status must be active or inactive.',
            ];
        }

        return [
            'rows.required' => 'No users found in the uploaded CSV file.',
            'rows.*.email.distinct' => 'Duplicate email addresses were found in the uploaded CSV file.',
            'rows.*.email.unique' => 'One or more email addresses already exist.',
            'rows.*.roles.required' => 'Each row must include at least one role.',
            'rows.*.roles.*.in' => 'One or more roles are invalid.',
            'rows.*.status.in' => 'One or more statuses are invalid.',
        ];
    }
}
