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
        if (Schema::hasTable('document_requirements')) {
            if (! $this->hasIndex('document_requirements', 'document_requirements_academic_year_id_stage_index')) {
                Schema::table('document_requirements', function (Blueprint $table) {
                    $table->index(['academic_year_id', 'stage']);
                });
            }

            if (! $this->hasIndex('document_requirements', 'doc_requirements_ay_stage_type_unique')) {
                Schema::table('document_requirements', function (Blueprint $table) {
                    $table->unique(['academic_year_id', 'stage', 'requirement_type'], 'doc_requirements_ay_stage_type_unique');
                });
            }

            return;
        }

        Schema::create('document_requirements', function (Blueprint $table) {
            $table->id();
            $table->string('requirement_type');
            $table->date('due_date');
            $table->string('stage')->default('Concept');
            $table->boolean('is_mandatory')->default(true);
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['academic_year_id', 'stage']);
            $table->unique(['academic_year_id', 'stage', 'requirement_type'], 'doc_requirements_ay_stage_type_unique');
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        $schema = DB::connection()->getDatabaseName();

        return DB::table('information_schema.statistics')
            ->where('table_schema', $schema)
            ->where('table_name', $table)
            ->where('index_name', $index)
            ->exists();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_requirements');
    }
};
