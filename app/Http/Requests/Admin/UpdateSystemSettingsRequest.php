<?php

namespace App\Http\Requests\Admin;

use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'academicYear' => ['filled', 'string', 'max:20', 'regex:/^\\d{4}[\\-–]\\d{4}$/'],
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
            'academicYear.regex' => 'The academic year must be in the format YYYY-YYYY.',
            'finalDefenseDeadline.after_or_equal' => 'The final defense deadline must be on or after the title proposal deadline.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->filled('academicYear')) {
                return;
            }

            $normalized = str_replace('–', '-', (string) $this->input('academicYear'));

            if (! preg_match('/^(?<start>\\d{4})-(?<end>\\d{4})$/', $normalized, $matches)) {
                return;
            }

            $startYear = (int) $matches['start'];
            $endYear = (int) $matches['end'];

            if ($endYear <= $startYear) {
                $validator->errors()->add('academicYear', 'The academic year end year must be after the start year.');

                return;
            }

            if (! Schema::hasTable('academic_years')) {
                return;
            }
            
            $academicYearExists = AcademicYear::query()
                ->where('start_year', $startYear)
                ->where('end_year', $endYear)
                ->exists();

            if ($academicYearExists) {
                $validator->errors()->add('academicYear', 'The academic year already exists.');
            }
        });
    }
}
