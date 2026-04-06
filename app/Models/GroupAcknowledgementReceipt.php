<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupAcknowledgementReceipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'faculty_user_id',
        'defense_type_key',
        'faculty_role',
        'amount_received',
        'date_received',
        'signed_at',
        'signed_by_user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_received' => 'date',
            'signed_at' => 'datetime',
            'amount_received' => 'integer',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function facultyUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'faculty_user_id');
    }

    public function signedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by_user_id');
    }
}
