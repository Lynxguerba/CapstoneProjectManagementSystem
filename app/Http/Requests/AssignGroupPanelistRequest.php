<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignGroupPanelistRequest extends FormRequest
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
            'group_id' => ['required', 'integer', 'exists:groups,id'],
            'panelist_id' => ['required', 'integer', 'exists:users,id'],
            'replace_panelist_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'group_id.required' => 'Select a group to assign.',
            'panelist_id.required' => 'Select a panelist to assign.',
            'replace_panelist_id.required' => 'Select a panelist to replace.',
        ];
    }
}
