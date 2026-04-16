<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequirementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasRole('instructor');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'requirement_type' => ['required', 'string', 'max:255'],
            'due_date' => ['required', 'date'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'is_mandatory' => ['nullable', 'boolean'],
            'stage' => ['nullable', 'string', Rule::in(['Concept', 'Outline', 'Pre-Deployment', 'Deployment', 'Final'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'requirement_type.required' => 'Provide the document requirement type.',
            'due_date.required' => 'Provide a due date.',
            'academic_year_id.required' => 'Select an academic year.',
            'academic_year_id.exists' => 'The selected academic year is invalid.',
            'stage.in' => 'The selected stage is invalid.',
        ];
    }
}
