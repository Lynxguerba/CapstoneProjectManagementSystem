<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PanelistEvaluationSheetSignature extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'defense_type_key',
        'panelist_user_id',
        'defense_date',
        'presenters',
        'individual_scores',
        'group_scores',
        'passing_grade_date',
        'signed_at',
        'signed_by_user_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'defense_date' => 'date',
            'presenters' => 'array',
            'individual_scores' => 'array',
            'group_scores' => 'array',
            'passing_grade_date' => 'date',
            'signed_at' => 'datetime',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function panelist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'panelist_user_id');
    }

    public function signedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by_user_id');
    }
}
