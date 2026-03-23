<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentConceptSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasRole('student');
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'document_requirement_id' => ['required', 'integer', Rule::exists('document_requirements', 'id')],
            'concept_file' => ['required', 'file', 'mimes:pdf', 'max:51200'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Enter a concept title.',
            'document_requirement_id.required' => 'Select a concept requirement.',
            'document_requirement_id.exists' => 'The selected concept requirement is invalid.',
            'concept_file.required' => 'Upload a PDF concept paper.',
            'concept_file.mimes' => 'Only PDF files are allowed for concept submissions.',
            'concept_file.max' => 'Concept PDF must not exceed 50MB.',
        ];
    }
}
