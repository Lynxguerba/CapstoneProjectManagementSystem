<?php

namespace App\Http\Requests\Adviser;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdviserConceptSubmissionStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasRole('adviser');
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'adviser_status' => ['required', 'string', Rule::in(['Approved', 'Revision Required'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'adviser_status.required' => 'Select an adviser status.',
            'adviser_status.in' => 'Adviser status must be either Approved or Revision Required.',
        ];
    }
}
