<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'academic_year',
        'semester',
        'section',
        'adviser_id',
        'status',
        'progress',
        'is_locked',
        'deployment_status',
    ];

    protected $casts = [
        'is_locked' => 'boolean',
    ];

    public function members()
    {
        return $this->belongsToMany(User::class, 'group_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function adviser()
    {
        return $this->belongsTo(User::class, 'adviser_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function defenseSchedules()
    {
        return $this->hasMany(DefenseSchedule::class);
    }
}
