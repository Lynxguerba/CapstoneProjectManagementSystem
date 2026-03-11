<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSystemSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->hasRole('admin');
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'academicYear' => ['filled', 'string', 'max:20'],
            'semester' => ['filled', 'string', Rule::in(['1st', '2nd', 'summer'])],
            'titleProposalDeadline' => ['filled', 'date'],
            'finalDefenseDeadline' => [
                'filled',
                'date',
                Rule::when($this->filled('titleProposalDeadline'), 'after_or_equal:titleProposalDeadline'),
            ],
            'siteWideNotification' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'finalDefenseDeadline.after_or_equal' => 'The final defense deadline must be on or after the title proposal deadline.',
        ];
    }
}
