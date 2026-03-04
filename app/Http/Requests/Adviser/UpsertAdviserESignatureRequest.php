<?php

namespace App\Http\Requests\Adviser;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertAdviserESignatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'signature_data' => ['required', 'string', 'starts_with:data:image/png;base64,'],
            'mime_type' => ['required', 'string', Rule::in(['image/png'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'signature_data.starts_with' => 'The e-signature must be a valid PNG data URL.',
            'mime_type.in' => 'Only PNG e-signature files are supported.',
        ];
    }
}
