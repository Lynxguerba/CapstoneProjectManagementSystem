<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdviserProgramUtility extends Model
{
    use HasFactory;

    protected $fillable = [
        'adviser_id',
        'program',
        'max_groups',
    ];

    protected function casts(): array
    {
        return [
            'max_groups' => 'integer',
        ];
    }

    public function adviser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adviser_id');
    }
}
