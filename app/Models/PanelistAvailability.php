<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PanelistAvailability extends Model
{
    /** @use HasFactory<\Database\Factories\PanelistAvailabilityFactory> */
    use HasFactory;

    protected $fillable = ['panelist_id', 'is_available'];

    protected function casts(): array
    {
        return [
            'is_available' => 'boolean',
        ];
    }

    public function panelist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'panelist_id');
    }
}
