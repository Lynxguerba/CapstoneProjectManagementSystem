<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrossSetGroupRequest extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = ['group_id', 'student_id', 'requested_by', 'requested_to', 'from_program_set_id', 'to_program_set_id', 'status', 'remarks', 'responded_at'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'responded_at' => 'datetime',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function requestedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_to');
    }

    public function fromProgramSet(): BelongsTo
    {
        return $this->belongsTo(ProgramSet::class, 'from_program_set_id');
    }

    public function toProgramSet(): BelongsTo
    {
        return $this->belongsTo(ProgramSet::class, 'to_program_set_id');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
