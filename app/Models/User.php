<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = ['name', 'first_name', 'last_name', 'email', 'password', 'role', 'status', 'program', 'active_session_id', 'active_session_last_activity_at'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'active_session_last_activity_at' => 'datetime',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function eSignature(): HasOne
    {
        return $this->hasOne(ESignature::class);
    }

    public function studentProgram(): HasOne
    {
        return $this->hasOne(StudentProgram::class, 'student_id');
    }

    public function programSets(): BelongsToMany
    {
        return $this->belongsToMany(ProgramSet::class, 'program_set_student', 'student_id', 'program_set_id')
            ->withTimestamps();
    }

    public function advisedGroups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'group_advisers', 'adviser_id', 'group_id')
            ->withTimestamps();
    }

    public function adviserAvailability(): HasOne
    {
        return $this->hasOne(AdviserAvailability::class, 'adviser_id');
    }

    public function adviserProgramUtilities(): HasMany
    {
        return $this->hasMany(AdviserProgramUtility::class, 'adviser_id');
    }

    public function panelAssignments(): HasMany
    {
        return $this->hasMany(GroupPanelist::class, 'panelist_id');
    }

    public function panelistAvailability(): HasOne
    {
        return $this->hasOne(PanelistAvailability::class, 'panelist_id');
    }

    public function panelistProgramUtilities(): HasMany
    {
        return $this->hasMany(PanelistProgramUtility::class, 'panelist_id');
    }

    public function panelGroups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'group_panelists', 'panelist_id', 'group_id')
            ->withPivot(['panel_slot', 'role', 'assigned_by'])
            ->withTimestamps();
    }

    public function createdTitleRepositories(): HasMany
    {
        return $this->hasMany(TitleRepository::class, 'created_by');
    }

    public function advisedTitleRepositories(): HasMany
    {
        return $this->hasMany(TitleRepository::class, 'adviser_id');
    }

    public function liveDefenseComments(): HasMany
    {
        return $this->hasMany(LiveDefenseComment::class, 'author_id');
    }

    public function acknowledgementReceiptRows(): HasMany
    {
        return $this->hasMany(GroupAcknowledgementReceipt::class, 'faculty_user_id');
    }

    public function acknowledgementReceiptSignatures(): HasMany
    {
        return $this->hasMany(GroupAcknowledgementReceipt::class, 'signed_by_user_id');
    }

    public function hasRole(string $role): bool
    {
        $normalizedRole = Role::normalizeRole($role);

        if ($normalizedRole === null) {
            return false;
        }

        $assignedRoles = $this->relationLoaded('roles')
            ? $this->roles->pluck('slug')->all()
            : $this->roles()->pluck('slug')->all();

        $hasAssignedRole = collect($assignedRoles)
            ->map(fn (string $assignedRole): ?string => Role::normalizeRole($assignedRole))
            ->filter()
            ->contains($normalizedRole);

        if ($hasAssignedRole) {
            return true;
        }

        $legacyRoles = collect(explode(',', (string) $this->role))
            ->map(fn (string $legacyRole): ?string => Role::normalizeRole($legacyRole))
            ->filter()
            ->values()
            ->all();

        if (count($legacyRoles) > 0) {
            return in_array($normalizedRole, $legacyRoles, true);
        }

        return Role::normalizeRole((string) $this->role) === $normalizedRole;
    }

    /**
     * @param  array<int, string>  $roles
     */
    public function syncRoles(array $roles): void
    {
        $normalizedRoles = collect($roles)
            ->map(fn (string $role): ?string => Role::normalizeRole($role))
            ->filter()
            ->unique()
            ->values();

        if ($normalizedRoles->isEmpty()) {
            $this->roles()->detach();

            return;
        }

        $roleIds = Role::query()
            ->whereIn('slug', $normalizedRoles->all())
            ->pluck('id')
            ->all();

        $this->roles()->sync($roleIds);
    }

    /**
     * @return array<int, string>
     */
    public function roleSlugs(): array
    {
        if ($this->relationLoaded('roles')) {
            return $this->roles
                ->pluck('slug')
                ->values()
                ->all();
        }

        return $this->roles()
            ->pluck('slug')
            ->values()
            ->all();
    }
}
