<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->timestamps();
        });

        $now = now();

        DB::table('programs')->insert([
            [
                'code' => 'BSIT',
                'name' => 'Bachelor of Science in Information Technology',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => 'BSIS',
                'name' => 'Bachelor of Science in Information Systems',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('programs');
    }
};
