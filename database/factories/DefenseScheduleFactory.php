<?php

namespace Database\Factories;

use App\Models\DefenseRoom;
use App\Models\DefenseSchedule;
use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DefenseSchedule>
 */
class DefenseScheduleFactory extends Factory
{
    protected $model = DefenseSchedule::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $group = Group::factory()->create();
        $room = DefenseRoom::factory()->create();
        $scheduledBy = User::factory()->create([
            'role' => 'instructor',
        ]);
        $date = $this->faker->dateTimeBetween('+1 day', '+2 weeks');
        $startTime = $this->faker->dateTimeBetween($date->format('Y-m-d').' 08:00:00', $date->format('Y-m-d').' 15:00:00');
        $endTime = (clone $startTime)->modify('+90 minutes');

        return [
            'group_id' => $group->id,
            'room_id' => $room->id,
            'scheduled_date' => $date->format('Y-m-d'),
            'start_time' => $startTime->format('H:i:s'),
            'end_time' => $endTime->format('H:i:s'),
            'stage' => $this->faker->randomElement(['Concept', 'Outline', 'Pre-Deployment', 'Deployment']),
            'status' => 'Scheduled',
            'notes' => null,
            'scheduled_by' => $scheduledBy->id,
        ];
    }
}
