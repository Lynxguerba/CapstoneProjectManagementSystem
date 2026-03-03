<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 */
class Role extends Model
{
    use HasFactory;

    /**
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'slug',
    ];

    /**
     * @var array<string, string>
     */
    private const AVAILABLE_ROLES = [
        'admin' => 'Admin',
        'student' => 'Student',
        'adviser' => 'Adviser',
        'instructor' => 'Instructor',
        'panelist' => 'Panelist',
        'dean' => 'Dean',
        'program_chairperson' => 'Program Chairperson',
    ];

    /**
     * @return array<string, string>
     */
    public static function availableRoles(): array
    {
        return self::AVAILABLE_ROLES;
    }

    /**
     * @return array<int, string>
     */
    public static function slugs(): array
    {
        return array_keys(self::AVAILABLE_ROLES);
    }

    public static function normalizeRole(string $role): ?string
    {
        $normalizedRole = Str::of($role)
            ->trim()
            ->lower()
            ->replace('-', '_')
            ->replace(' ', '_')
            ->value();

        $aliases = [
            'advisor' => 'adviser',
            'program_chair' => 'program_chairperson',
            'programchair' => 'program_chairperson',
        ];

        $normalizedRole = $aliases[$normalizedRole] ?? $normalizedRole;

        return in_array($normalizedRole, self::slugs(), true) ? $normalizedRole : null;
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
