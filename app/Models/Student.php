<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    /** @use HasFactory<\Database\Factories\StudentFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = ['user_id', 'program'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
