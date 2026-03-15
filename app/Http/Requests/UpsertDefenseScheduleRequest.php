<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertDefenseScheduleRequest extends FormRequest
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
            'schedule_id' => ['nullable', 'integer', 'exists:defense_schedules,id'],
            'group_id' => ['required', 'integer', 'exists:groups,id'],
            'room_id' => ['required', 'integer', 'exists:defense_rooms,id'],
            'scheduled_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'stage' => ['required', 'string', 'in:Concept,Outline,Pre-Deployment,Deployment'],
            'status' => ['nullable', 'string', 'in:Scheduled,Completed,Pending,Cancelled'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'group_id.required' => 'Select a group to schedule.',
            'room_id.required' => 'Select a room for the defense.',
            'scheduled_date.required' => 'Select a defense date.',
            'start_time.required' => 'Select a start time.',
            'end_time.required' => 'Select an end time.',
            'end_time.after' => 'End time must be after the start time.',
            'stage.in' => 'Select a valid defense stage.',
        ];
    }
}
