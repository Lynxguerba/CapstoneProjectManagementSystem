<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentManuscriptSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasRole('student');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'manuscript_file' => ['required', 'file', 'mimes:pdf', 'max:102400'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'manuscript_file.required' => 'Upload a PDF manuscript file.',
            'manuscript_file.mimes' => 'Only PDF files are allowed for manuscript submissions.',
            'manuscript_file.max' => 'Manuscript PDF must not exceed 100MB.',
        ];
    }
}
