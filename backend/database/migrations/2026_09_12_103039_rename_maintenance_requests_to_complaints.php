<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('maintenance_requests', 'complaints');

        Schema::table('complaints', function (Blueprint $table) {
            $table->string('ticket_code')->unique()->after('id');
            $table->string('location')->nullable()->after('description');
            $table->string('photo_path')->nullable()->after('location');
            $table->text('hoa_response')->nullable()->after('photo_path');
            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->after('hoa_response');
            $table->timestamp('resolved_at')->nullable()->after('assigned_to');
            $table->renameColumn('request_type', 'category');
            $table->string('status')->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn([
                'ticket_code',
                'location',
                'photo_path',
                'hoa_response',
                'assigned_to',
                'resolved_at',
            ]);
            $table->renameColumn('category', 'request_type');
        });

        Schema::rename('complaints', 'maintenance_requests');
    }
};
