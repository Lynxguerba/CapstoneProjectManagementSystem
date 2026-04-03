<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = ['start_year', 'end_year', 'label', 'is_current'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_year' => 'integer',
            'end_year' => 'integer',
            'is_current' => 'boolean',
        ];
    }

    public function titleRepositories(): HasMany
    {
        return $this->hasMany(TitleRepository::class);
    }
}
