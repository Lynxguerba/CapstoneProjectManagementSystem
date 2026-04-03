<?php

namespace App\Http\Requests\Panelist;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLiveDefenseCommentRequest extends FormRequest
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
            'document_submission_id' => ['required', 'integer', 'exists:document_submissions,id'],
            'message' => ['required', 'string', 'max:10000'],
            'is_highlight_comment' => ['required', 'boolean'],
            'highlight' => ['nullable', 'array'],
            'highlight.highlight_id' => [
                Rule::requiredIf((bool) $this->boolean('is_highlight_comment')),
                'string',
                'max:120',
                'unique:live_defense_comment_highlights,highlight_id',
            ],
            'highlight.quote_text' => ['nullable', 'string', 'max:10000'],
            'highlight.comment_emoji' => ['nullable', 'string', 'max:16'],
            'highlight.content' => ['nullable', 'array'],
            'highlight.position' => ['nullable', 'array'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'document_submission_id.required' => 'Select a concept submission first.',
            'document_submission_id.exists' => 'The selected concept submission does not exist.',
            'message.required' => 'Enter a comment before sending.',
            'message.max' => 'Comment must not exceed 10,000 characters.',
            'highlight.highlight_id.required' => 'Highlight identifier is required for highlighted comments.',
            'highlight.highlight_id.unique' => 'This highlighted comment was already submitted.',
        ];
    }
}
