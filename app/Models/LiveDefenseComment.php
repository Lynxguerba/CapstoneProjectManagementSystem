<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LiveDefenseComment extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = ['group_id', 'document_submission_id', 'author_id', 'author_role', 'message', 'is_highlight_comment'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_highlight_comment' => 'boolean',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function documentSubmission(): BelongsTo
    {
        return $this->belongsTo(DocumentSubmission::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function highlight(): HasOne
    {
        return $this->hasOne(LiveDefenseCommentHighlight::class);
    }
}
