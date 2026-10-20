<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('resident_profiles', 'sms_notifications_enabled')) {
            Schema::table('resident_profiles', function (Blueprint $table): void {
                $table->dropColumn('sms_notifications_enabled');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('resident_profiles', 'sms_notifications_enabled')) {
            Schema::table('resident_profiles', function (Blueprint $table): void {
                $table->boolean('sms_notifications_enabled')->default(false);
            });
        }
    }
};
