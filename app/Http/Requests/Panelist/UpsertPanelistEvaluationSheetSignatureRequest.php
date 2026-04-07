<?php

namespace App\Http\Requests\Panelist;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertPanelistEvaluationSheetSignatureRequest extends FormRequest
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
            'panelist_user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id'),
            ],
            'defense_type_key' => [
                'required',
                'string',
                Rule::in([
                    'concept_presentation',
                    'outline_defense',
                    'pre_deployment_defense',
                    'final_defense',
                ]),
            ],
            'defense_date' => [
                'required',
                'date',
            ],
            'presenters' => [
                'required',
                'array',
                'min:1',
            ],
            'presenters.*' => [
                'nullable',
                'string',
                'max:255',
            ],
            'individual_scores' => [
                'required',
                'array',
            ],
            'individual_scores.disposition' => ['nullable', 'integer', 'min:1', 'max:5'],
            'individual_scores.organization' => ['nullable', 'integer', 'min:1', 'max:5'],
            'individual_scores.manner' => ['nullable', 'integer', 'min:1', 'max:5'],
            'individual_scores.defense' => ['nullable', 'integer', 'min:1', 'max:5'],
            'group_scores' => [
                'required',
                'array',
            ],
            'group_scores.system' => ['nullable', 'integer', 'min:0'],
            'group_scores.documentation' => ['nullable', 'integer', 'min:0'],
            'group_scores.total' => ['nullable', 'integer', 'min:0'],
            'passing_grade_date' => [
                'nullable',
                'date',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'group_id.required' => 'Group is required to save evaluation sheet signature.',
            'group_id.exists' => 'Selected group is invalid.',
            'panelist_user_id.required' => 'Panelist row is required.',
            'panelist_user_id.exists' => 'Selected panelist row is invalid.',
            'defense_type_key.required' => 'Defense phase is required.',
            'defense_type_key.in' => 'Selected defense phase is invalid.',
            'defense_date.required' => 'Defense date is required before signing the evaluation sheet.',
            'presenters.required' => 'Presenters are required before signing the evaluation sheet.',
            'presenters.array' => 'Presenters list format is invalid.',
            'individual_scores.required' => 'Individual scores are required before signing the evaluation sheet.',
            'individual_scores.array' => 'Individual scores format is invalid.',
            'group_scores.required' => 'Group scores are required before signing the evaluation sheet.',
            'group_scores.array' => 'Group scores format is invalid.',
        ];
    }
}
