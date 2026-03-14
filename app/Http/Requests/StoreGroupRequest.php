<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGroupRequest extends FormRequest
{
    /**
     * @var array<int, string>
     */
    private const ROLES = [
        'Project Manager',
        'Programmer',
        'Documentarian',
        'Data Analyst',
    ];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'program_set_id' => ['required', 'integer', 'exists:program_sets,id'],
            'members' => ['required', 'array', 'min:2'],
            'members.*.student_id' => ['required', 'integer', 'exists:users,id', 'distinct'],
            'members.*.role' => ['required', 'string', Rule::in(self::ROLES)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'program_set_id.required' => 'Select a program set to continue.',
            'members.required' => 'Choose at least two students to create a group.',
            'members.min' => 'Choose at least two students to create a group.',
            'members.*.student_id.distinct' => 'Duplicate students are not allowed in the same group.',
            'members.*.role.in' => 'Select a valid role for each student.',
        ];
    }
}
