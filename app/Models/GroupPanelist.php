<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupPanelist extends Model
{
    /** @use HasFactory<\Database\Factories\GroupPanelistFactory> */
    use HasFactory;

    protected $fillable = [
        'group_id',
        'panelist_id',
        'panel_slot',
        'role',
        'assigned_by',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function panelist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'panelist_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
