<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'key',
        'value',
    ];
}
