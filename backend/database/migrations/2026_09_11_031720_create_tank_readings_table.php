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
        Schema::create('tank_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('septic_system_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('fill_level_percentage');
            $table->timestamp('measured_at');
            $table->string('source')->default('manual');
            $table->text('notes')->nullable();
            $table->enum('status', ['normal', 'warning', 'critical'])->default('normal');
            $table->decimal('distance_cm', 6, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tank_readings');
    }
};
