<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DefenseSchedule extends Model
{
    /** @use HasFactory<\Database\Factories\DefenseScheduleFactory> */
    use HasFactory;

    protected $fillable = [
        'group_id',
        'room_id',
        'scheduled_date',
        'start_time',
        'end_time',
        'stage',
        'status',
        'notes',
        'scheduled_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date:Y-m-d',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(DefenseRoom::class, 'room_id');
    }

    public function scheduledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scheduled_by');
    }
}
