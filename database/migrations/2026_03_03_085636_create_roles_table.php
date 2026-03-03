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
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        $availableRoles = [
            'admin' => 'Admin',
            'student' => 'Student',
            'adviser' => 'Adviser',
            'instructor' => 'Instructor',
            'panelist' => 'Panelist',
            'dean' => 'Dean',
            'program_chairperson' => 'Program Chairperson',
        ];
        $timestamp = now();

        foreach ($availableRoles as $slug => $name) {
            DB::table('roles')->insert([
                'name' => $name,
                'slug' => $slug,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
