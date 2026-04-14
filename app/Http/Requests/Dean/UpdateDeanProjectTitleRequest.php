<?php

namespace App\Http\Requests\Dean;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeanProjectTitleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Enter a project title.',
            'title.string' => 'Project title must be a valid text value.',
            'title.max' => 'Project title must not exceed 255 characters.',
        ];
    }
}
