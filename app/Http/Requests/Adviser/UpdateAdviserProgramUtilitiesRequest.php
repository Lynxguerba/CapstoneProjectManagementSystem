<?php

namespace App\Http\Requests\Adviser;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAdviserProgramUtilitiesRequest extends FormRequest
{
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
            'programs' => ['required', 'array', 'min:1'],
            'programs.*.program' => ['required', 'string', 'max:50'],
            'programs.*.max_groups' => ['required', 'integer', 'min:0', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'programs.required' => 'Add at least one program utility.',
            'programs.array' => 'Program utilities must be a list.',
            'programs.*.program.required' => 'Program name is required.',
            'programs.*.program.max' => 'Program name must be 50 characters or less.',
            'programs.*.max_groups.required' => 'Set the maximum number of groups.',
            'programs.*.max_groups.integer' => 'Maximum groups must be a number.',
            'programs.*.max_groups.min' => 'Maximum groups must be zero or more.',
            'programs.*.max_groups.max' => 'Maximum groups must be 50 or less.',
        ];
    }
}
