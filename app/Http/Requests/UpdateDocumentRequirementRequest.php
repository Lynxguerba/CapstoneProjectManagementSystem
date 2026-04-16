<?php

namespace App\Http\Requests;

use App\Models\DocumentRequirement;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentRequirementRequest extends FormRequest
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
        $requirement = $this->route('requirement');
        $requirementId = $requirement instanceof DocumentRequirement ? $requirement->id : null;
        $requirementStage = $requirement instanceof DocumentRequirement && is_string($requirement->stage)
            ? trim($requirement->stage)
            : 'Concept';

        if ($requirementStage === '') {
            $requirementStage = 'Concept';
        }

        return [
            'requirement_type' => [
                'required',
                'string',
                'max:255',
                Rule::unique('document_requirements', 'requirement_type')
                    ->where(fn ($query) => $query
                        ->where('academic_year_id', $this->input('academic_year_id'))
                        ->where('stage', $requirementStage))
                    ->ignore($requirementId),
            ],
            'due_date' => ['required', 'date'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'is_mandatory' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'requirement_type.required' => 'Provide the document requirement type.',
            'requirement_type.unique' => 'This requirement already exists for the academic year.',
            'due_date.required' => 'Provide a due date.',
            'academic_year_id.required' => 'Select an academic year.',
            'academic_year_id.exists' => 'The selected academic year is invalid.',
        ];
    }
}
