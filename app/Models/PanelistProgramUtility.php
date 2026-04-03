<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PanelistProgramUtility extends Model
{
    /** @use HasFactory<\Database\Factories\PanelistProgramUtilityFactory> */
    use HasFactory;

    protected $fillable = ['panelist_id', 'program', 'max_groups'];

    protected function casts(): array
    {
        return [
            'max_groups' => 'integer',
        ];
    }

    public function panelist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'panelist_id');
    }
}
