<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tank_readings', function (Blueprint $table) {
            $table->index(['septic_system_id', 'measured_at'], 'tank_readings_system_measured_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('tank_readings', function (Blueprint $table) {
            $table->dropIndex('tank_readings_system_measured_at_index');
        });
    }
};
