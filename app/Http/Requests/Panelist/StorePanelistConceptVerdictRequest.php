<?php

namespace App\Http\Requests\Panelist;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePanelistConceptVerdictRequest extends FormRequest
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
            'group_id' => [
                'required',
                'integer',
                Rule::exists('groups', 'id'),
            ],
            'verdict' => [
                'required',
                'string',
                Rule::in([
                    'Passed (No revisions needed)',
                    'Passed (With revisions needed)',
                    'Conditional Passed',
                    'Deffered',
                    'Failed',
                    'Pass with revision',
                    'Conditional Pass',
                ]),
            ],
            'approved_document_submission_id' => [
                Rule::requiredIf(in_array((string) $this->input('verdict'), [
                    'Passed (No revisions needed)',
                    'Passed (With revisions needed)',
                    'Pass with revision',
                ], true)),
                'nullable',
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
            'group_id.required' => 'Group is required to save concept verdict.',
            'group_id.exists' => 'Selected group does not exist.',
            'verdict.required' => 'Select a concept verdict first.',
            'verdict.in' => 'Selected concept verdict is invalid.',
            'approved_document_submission_id.required' => 'Select the approved concept title when verdict is a Passed option.',
            'approved_document_submission_id.exists' => 'Selected approved concept title is not valid.',
        ];
    }
}
