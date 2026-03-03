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
