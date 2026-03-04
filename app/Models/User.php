<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'password',
        'role',
        'status',
    ];

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

    public function hasRole(string $role): bool
    {
        $normalizedRole = Role::normalizeRole($role);

        if ($normalizedRole === null) {
            return false;
        }

        if ($this->relationLoaded('roles')) {
            return $this->roles->contains(fn (Role $assignedRole): bool => $assignedRole->slug === $normalizedRole);
        }

        if ($this->roles()->where('slug', $normalizedRole)->exists()) {
            return true;
        }

        return $this->role === $normalizedRole;
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
