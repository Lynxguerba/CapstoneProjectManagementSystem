<?php

namespace App\Http\Requests\Panelist;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeletePanelistEvaluationSheetSignatureRequest extends FormRequest
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
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'group_id.required' => 'Group is required to clear evaluation sheet signature.',
            'group_id.exists' => 'Selected group is invalid.',
            'panelist_user_id.required' => 'Panelist row is required.',
            'panelist_user_id.exists' => 'Selected panelist row is invalid.',
            'defense_type_key.required' => 'Defense phase is required.',
            'defense_type_key.in' => 'Selected defense phase is invalid.',
        ];
    }
}
