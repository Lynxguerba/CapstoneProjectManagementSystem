<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdviserRecommendationDocument extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = ['group_id', 'adviser_id', 'document_requirement_id', 'document_submission_id', 'file_name', 'file_path', 'approved_titles', 'submitted_by_names', 'signed_at'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'approved_titles' => 'array',
            'signed_at' => 'datetime',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function adviser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adviser_id');
    }

    public function requirement(): BelongsTo
    {
        return $this->belongsTo(DocumentRequirement::class, 'document_requirement_id');
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(DocumentSubmission::class, 'document_submission_id');
    }
}
