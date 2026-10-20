<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resident_profiles', function (Blueprint $table) {
            $table->boolean('sms_notifications_enabled')->default(false)->after('contact_number');
        });
    }

    public function down(): void
    {
        Schema::table('resident_profiles', function (Blueprint $table) {
            $table->dropColumn('sms_notifications_enabled');
        });
    }
};
