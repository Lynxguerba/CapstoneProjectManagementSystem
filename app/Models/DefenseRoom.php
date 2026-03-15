<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DefenseRoom extends Model
{
    /** @use HasFactory<\Database\Factories\DefenseRoomFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'capacity',
        'is_active',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(DefenseSchedule::class, 'room_id');
    }
}
