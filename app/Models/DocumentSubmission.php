<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DocumentSubmission extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = ['group_id', 'document_requirement_id', 'title_category_id', 'file_name', 'file_path', 'mime_type', 'file_size', 'status', 'adviser_status', 'submitted_by', 'adviser_reviewed_by', 'adviser_reviewed_at'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'adviser_reviewed_at' => 'datetime',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function requirement(): BelongsTo
    {
        return $this->belongsTo(DocumentRequirement::class, 'document_requirement_id');
    }

    public function titleCategory(): BelongsTo
    {
        return $this->belongsTo(TitleCategory::class, 'title_category_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function adviserReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adviser_reviewed_by');
    }

    public function adviserRecommendationDocument(): HasOne
    {
        return $this->hasOne(AdviserRecommendationDocument::class, 'document_submission_id');
    }

    public function liveDefenseComments(): HasMany
    {
        return $this->hasMany(LiveDefenseComment::class);
    }
}
