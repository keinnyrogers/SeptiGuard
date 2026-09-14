<?php

namespace App\Models;

use Database\Factories\PredictionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prediction extends Model
{
    /** @use HasFactory<PredictionFactory> */
    use HasFactory;

    protected $fillable = [
        'septic_system_id',
        'current_fill',
        'daily_fill_rate',
        'days_until_full',
        'predicted_full_date',
        'confidence',
        'predicted_at',
    ];

    /**
     * @return BelongsTo<SepticSystem, Prediction>
     */
    public function septicSystem(): BelongsTo
    {
        return $this->belongsTo(SepticSystem::class);
    }

    protected function casts(): array
    {
        return [
            'current_fill' => 'decimal:2',
            'daily_fill_rate' => 'decimal:2',
            'confidence' => 'decimal:2',
            'predicted_full_date' => 'date',
            'predicted_at' => 'datetime',
        ];
    }
}
