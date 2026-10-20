<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('septi_notifications', function (Blueprint $table) {
            $table->enum('channel', ['in_app', 'fcm', 'email', 'sms'])->default('in_app')->change();
        });
    }

    public function down(): void
    {
        DB::table('septi_notifications')
            ->where('channel', 'in_app')
            ->update(['channel' => 'fcm']);

        Schema::table('septi_notifications', function (Blueprint $table) {
            $table->enum('channel', ['fcm', 'email', 'sms'])->default('fcm')->change();
        });
    }
};
