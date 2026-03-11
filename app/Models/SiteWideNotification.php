<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteWideNotification extends Model
{
    public const TABLE = 'site_wide_notification';

    /**
     * @var string
     */
    protected $table = self::TABLE;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'message',
    ];
}
