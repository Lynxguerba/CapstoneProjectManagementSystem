<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('site_wide_notifications') && ! Schema::hasTable('site_wide_notification')) {
            Schema::rename('site_wide_notifications', 'site_wide_notification');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('site_wide_notification') && ! Schema::hasTable('site_wide_notifications')) {
            Schema::rename('site_wide_notification', 'site_wide_notifications');
        }
    }
};
