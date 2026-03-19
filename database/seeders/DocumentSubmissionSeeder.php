<?php

namespace Database\Seeders;

use App\Models\DocumentSubmission;
use Illuminate\Database\Seeder;

class DocumentSubmissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DocumentSubmission::factory()->count(12)->create();
    }
}
