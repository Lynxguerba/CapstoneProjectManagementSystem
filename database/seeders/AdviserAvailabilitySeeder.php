<?php

namespace Database\Seeders;

use App\Models\AdviserAvailability;
use Illuminate\Database\Seeder;

class AdviserAvailabilitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        AdviserAvailability::factory()
            ->count(3)
            ->create();
    }
}
