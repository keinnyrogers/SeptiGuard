<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('septic_systems', function (Blueprint $table): void {
            $table->string('firmware_version', 32)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('septic_systems', function (Blueprint $table): void {
            $table->dropColumn('firmware_version');
        });
    }
};
