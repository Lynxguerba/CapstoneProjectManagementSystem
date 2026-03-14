<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_set_id',
        'leader_id',
        'name',
    ];

    public function programSet(): BelongsTo
    {
        return $this->belongsTo(ProgramSet::class);
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_members', 'group_id', 'student_id')
            ->withPivot(['role'])
            ->withTimestamps();
    }

    public function adviserAssignment(): HasOne
    {
        return $this->hasOne(GroupAdviser::class);
    }
}
