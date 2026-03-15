<?php

namespace Database\Seeders;

use App\Models\DefenseSchedule;
use Illuminate\Database\Seeder;

class DefenseScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DefenseSchedule::factory()
            ->count(3)
            ->create();
    }
}
