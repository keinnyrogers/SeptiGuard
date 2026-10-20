<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('septic_systems', function (Blueprint $table): void {
            $table->string('tank_type')->nullable()->change();
            $table->unsignedInteger('capacity_liters')->nullable()->change();
            $table->string('location')->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('septic_systems')->whereNull('tank_type')->update(['tank_type' => 'Unspecified']);
        DB::table('septic_systems')->whereNull('capacity_liters')->update(['capacity_liters' => 0]);
        DB::table('septic_systems')->whereNull('location')->update(['location' => 'Unspecified']);

        Schema::table('septic_systems', function (Blueprint $table): void {
            $table->string('tank_type')->nullable(false)->change();
            $table->unsignedInteger('capacity_liters')->nullable(false)->change();
            $table->string('location')->nullable(false)->change();
        });
    }
};
