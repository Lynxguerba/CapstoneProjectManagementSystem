<?php

namespace App\Http\Requests\Panelist;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApprovePanelistConceptTitleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasRole('panelist');
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'document_submission_id' => [
                'required',
                'integer',
                Rule::exists('document_submissions', 'id'),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'document_submission_id.required' => 'Select a concept title to approve.',
            'document_submission_id.exists' => 'The selected concept submission does not exist.',
        ];
    }
}
