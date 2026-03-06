<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFacultyRequest extends FormRequest
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

    /**
     * Determine if the user is authorized to make this request.
     */
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
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('faculties', 'email')->ignore($this->route('faculty'))],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['required', 'string', Rule::in(self::FACULTY_ASSIGNABLE_ROLES)],
            'status' => ['required', 'string', Rule::in(self::AVAILABLE_STATUSES)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'roles.required' => 'Role is required.',
            'roles.min' => 'Role is required.',
            'roles.*.in' => 'Selected role is invalid.',
            'status.in' => 'Status must be active or inactive.',
        ];
    }
}
