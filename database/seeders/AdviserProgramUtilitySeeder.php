<?php

namespace Database\Seeders;

use App\Models\AdviserProgramUtility;
use Illuminate\Database\Seeder;

class AdviserProgramUtilitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        AdviserProgramUtility::factory()
            ->count(6)
            ->create();
    }
}
