<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProgramSetRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:255'],
            'program' => ['required', 'string', Rule::in(['BSIT', 'BSIS'])],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Set name is required.',
            'program.required' => 'Program is required.',
            'program.in' => 'Program must be BSIT or BSIS.',
            'academic_year_id.required' => 'School year is required.',
            'academic_year_id.exists' => 'Selected school year is invalid.',
        ];
    }
}
