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
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'program_id')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropForeign(['program_id']);
                $table->dropColumn('program_id');
            });
        }

        Schema::dropIfExists('programs');
        Schema::dropIfExists('students');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('programs', function (Blueprint $table): void {
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

        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('program_id')->nullable()->after('status')->constrained('programs')->nullOnDelete();
        });
    }
};
