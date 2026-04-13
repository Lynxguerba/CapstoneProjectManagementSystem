<?php

namespace App\Http\Requests\Dean;

use App\Models\TitleCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDeanCategoryRequest extends FormRequest
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
        $category = $this->route('category');
        $categoryId = $category instanceof TitleCategory ? $category->id : null;
        $program = $category instanceof TitleCategory ? $category->program : null;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('title_categories', 'name')
                    ->ignore($categoryId)
                    ->where(fn ($query) => $query->where('program', $program)),
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
            'name.required' => 'Enter a category name.',
            'name.max' => 'Category name must not exceed 255 characters.',
            'name.unique' => 'This category already exists for this program.',
            'description.max' => 'Description must not exceed 1000 characters.',
        ];
    }
}
