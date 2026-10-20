<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tank_readings', function (Blueprint $table) {
            $table->decimal('fill_level_percentage', 5, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('tank_readings', function (Blueprint $table) {
            $table->unsignedTinyInteger('fill_level_percentage')->change();
        });
    }
};
