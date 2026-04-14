<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreImpersonationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->resolveActingDean() instanceof User;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'email',
                Rule::exists('users', 'email'),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Select a user to impersonate.',
            'email.email' => 'Choose a valid account email.',
            'email.exists' => 'The selected user account could not be found.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $email = is_string($this->input('email')) ? trim(strtolower($this->input('email'))) : '';

        $this->merge([
            'email' => $email,
        ]);
    }

    private function resolveActingDean(): ?User
    {
        $user = $this->user();

        if ($user instanceof User && $user->hasRole('dean')) {
            return $user;
        }

        $impersonatorId = (int) $this->session()->get('impersonator_id');
        if ($impersonatorId <= 0) {
            return null;
        }

        $impersonator = User::query()->find($impersonatorId);

        return $impersonator instanceof User && $impersonator->hasRole('dean')
            ? $impersonator
            : null;
    }
}
