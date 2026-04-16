<?php

namespace App\Http\Requests\Adviser;

use Illuminate\Foundation\Http\FormRequest;

class MarkAllAdviserNotificationsReadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
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
            'notification_keys' => ['required', 'array', 'min:1'],
            'notification_keys.*' => ['required', 'string', 'max:191'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'notification_keys.required' => 'Select at least one notification to mark as read.',
            'notification_keys.array' => 'Select at least one notification to mark as read.',
            'notification_keys.min' => 'Select at least one notification to mark as read.',
            'notification_keys.*.required' => 'Notification key is required.',
            'notification_keys.*.string' => 'Notification key must be a string.',
            'notification_keys.*.max' => 'Notification key may not be greater than 191 characters.',
        ];
    }
}
