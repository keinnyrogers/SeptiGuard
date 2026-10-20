<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('septic_systems', function (Blueprint $table) {
            $table->decimal('tank_height_cm', 8, 2)->nullable()->after('capacity_liters');
        });
    }

    public function down(): void
    {
        Schema::table('septic_systems', function (Blueprint $table) {
            $table->dropColumn('tank_height_cm');
        });
    }
};
