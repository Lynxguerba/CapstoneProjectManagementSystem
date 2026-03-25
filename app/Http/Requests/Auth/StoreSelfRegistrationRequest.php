<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreSelfRegistrationRequest extends FormRequest
{
    /**
     * @var array<int, string>
     */
    private const REGISTERABLE_ROLES = [
        'student',
        'adviser',
        'panelist',
        'instructor',
        'dean',
        'program_chairperson',
    ];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $programRules = ['nullable', 'string', Rule::in(['BSIT', 'BSIS'])];

        if (in_array((string) $this->input('role'), ['student', 'program_chairperson'], true)) {
            $programRules = ['required', 'string', Rule::in(['BSIT', 'BSIS'])];
        }

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'string', Rule::in(self::REGISTERABLE_ROLES)],
            'program' => $programRules,
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'An account request for this generated email already exists.',
            'role.in' => 'The selected role is not available for self-registration.',
            'program.required' => 'Program selection is required for the selected role.',
            'program.in' => 'Program must be BSIT or BSIS.',
            'password.min' => 'Password must be at least 8 characters.',
            'password.confirmed' => 'Password confirmation does not match.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $firstName = is_string($this->input('first_name')) ? $this->input('first_name') : '';
        $lastName = is_string($this->input('last_name')) ? $this->input('last_name') : '';
        $role = is_string($this->input('role')) ? trim($this->input('role')) : '';
        $program = is_string($this->input('program')) ? strtoupper(trim($this->input('program'))) : '';

        $this->merge([
            'email' => $this->generateInstitutionalEmail($firstName, $lastName),
            'role' => $role,
            'program' => $program !== '' ? $program : null,
        ]);
    }

    private function generateInstitutionalEmail(string $firstName, string $lastName): string
    {
        $normalizedLastName = $this->normalizeEmailSegment($lastName);
        $normalizedFirstName = $this->normalizeEmailSegment($firstName);

        return trim($normalizedLastName.'.'.$normalizedFirstName, '.').'@dnsc.ic.ph';
    }

    private function normalizeEmailSegment(string $value): string
    {
        return (string) Str::of($value)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '.')
            ->trim('.');
    }
}
