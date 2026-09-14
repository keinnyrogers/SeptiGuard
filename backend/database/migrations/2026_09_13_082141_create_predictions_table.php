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
        Schema::create('predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('septic_system_id')->constrained()->cascadeOnDelete();
            $table->decimal('current_fill', 5, 2);
            $table->decimal('daily_fill_rate', 5, 2);
            $table->unsignedInteger('days_until_full');
            $table->date('predicted_full_date');
            $table->decimal('confidence', 5, 2)->nullable();
            $table->timestamp('predicted_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('predictions');
    }
};
