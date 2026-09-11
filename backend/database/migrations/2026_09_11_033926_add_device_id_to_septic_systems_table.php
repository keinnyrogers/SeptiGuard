<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('septic_systems', function (Blueprint $table) {
            $table->string('device_id')->nullable()->unique()->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('septic_systems', function (Blueprint $table) {
            $table->dropUnique(['device_id']);
            $table->dropColumn('device_id');
        });
    }
};
