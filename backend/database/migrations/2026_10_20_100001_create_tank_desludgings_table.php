<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tank_desludgings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('septic_system_id')->constrained()->cascadeOnDelete();
            $table->date('performed_on');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['septic_system_id', 'performed_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tank_desludgings');
    }
};
