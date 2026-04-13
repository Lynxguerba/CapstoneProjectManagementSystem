<?php

namespace App\Http\Requests\Dean;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDeanCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'program' => [
                'required',
                Rule::in(['BSIT', 'BSIS']),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('title_categories', 'name')->where(
                    fn ($query) => $query->where('program', $this->string('program')->toString())
                ),
            ],
            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'program.required' => 'Select a program.',
            'program.in' => 'Program must be BSIT or BSIS.',
            'name.required' => 'Enter a category name.',
            'name.max' => 'Category name must not exceed 255 characters.',
            'name.unique' => 'This category already exists for the selected program.',
            'description.max' => 'Description must not exceed 1000 characters.',
        ];
    }
}
