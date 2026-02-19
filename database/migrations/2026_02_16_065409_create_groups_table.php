<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('academic_year')->nullable();
            $table->string('semester')->nullable();
            $table->string('section')->nullable();
            $table->foreignId('adviser_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('status')->default('pending');
            $table->integer('progress')->default(0);
            $table->boolean('is_locked')->default(false);
            $table->string('deployment_status')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('groups');
    }
};
