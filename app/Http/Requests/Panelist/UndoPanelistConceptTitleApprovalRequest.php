<?php

namespace App\Http\Requests\Panelist;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UndoPanelistConceptTitleApprovalRequest extends FormRequest
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
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'group_id.required' => 'Group is required to undo title approval.',
            'group_id.exists' => 'Selected group does not exist.',
        ];
    }
}
