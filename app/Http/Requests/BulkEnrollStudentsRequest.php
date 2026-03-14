<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkEnrollStudentsRequest extends FormRequest
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
            'program_set_id' => ['required', 'integer', 'exists:program_sets,id'],
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.student_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'program_set_id.required' => 'Program set is required.',
            'program_set_id.exists' => 'The selected program set is invalid.',
            'rows.required' => 'Please select at least one student to enroll.',
            'rows.min' => 'Please select at least one student to enroll.',
            'rows.*.student_id.required' => 'Each row must include a student.',
            'rows.*.student_id.exists' => 'One or more selected students could not be found.',
        ];
    }
}
