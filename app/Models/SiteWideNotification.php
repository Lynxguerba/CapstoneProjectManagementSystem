<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteWideNotification extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'message',
    ];
}
