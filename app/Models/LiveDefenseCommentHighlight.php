<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveDefenseCommentHighlight extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'live_defense_comment_id',
        'highlight_id',
        'quote_text',
        'comment_emoji',
        'content',
        'position',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content' => 'array',
            'position' => 'array',
        ];
    }

    public function liveDefenseComment(): BelongsTo
    {
        return $this->belongsTo(LiveDefenseComment::class);
    }
}
