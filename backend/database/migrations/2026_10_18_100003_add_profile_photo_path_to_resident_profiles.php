<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resident_profiles', function (Blueprint $table): void {
            $table->string('profile_photo_path')->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('resident_profiles', function (Blueprint $table): void {
            $table->dropColumn('profile_photo_path');
        });
    }
};
