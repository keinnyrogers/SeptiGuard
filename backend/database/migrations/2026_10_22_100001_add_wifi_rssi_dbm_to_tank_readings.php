<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tank_readings', function (Blueprint $table) {
            $table->smallInteger('wifi_rssi_dbm')->nullable()->after('distance_cm');
        });
    }

    public function down(): void
    {
        Schema::table('tank_readings', function (Blueprint $table) {
            $table->dropColumn('wifi_rssi_dbm');
        });
    }
};
