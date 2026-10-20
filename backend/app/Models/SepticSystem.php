<?php

namespace App\Models;

use Database\Factories\SepticSystemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'device_id', 'tank_type', 'capacity_liters', 'tank_height_cm', 'installation_date', 'last_maintenance_date', 'location', 'firmware_version'])]
class SepticSystem extends Model
{
    /** @use HasFactory<SepticSystemFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, SepticSystem>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<TankReading, SepticSystem>
     */
    public function tankReadings(): HasMany
    {
        return $this->hasMany(TankReading::class);
    }

    /**
     * @return HasMany<TankDesludging, SepticSystem>
     */
    public function desludgings(): HasMany
    {
        return $this->hasMany(TankDesludging::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne<TankDesludging, SepticSystem>
     */
    public function latestDesludging()
    {
        return $this->hasOne(TankDesludging::class)->latestOfMany('performed_on');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne<TankReading, SepticSystem>
     */
    public function latestTankReading()
    {
        return $this->hasOne(TankReading::class)->latestOfMany('measured_at');
    }

    /**
     * @return HasMany<Prediction, SepticSystem>
     */
    public function predictions(): HasMany
    {
        return $this->hasMany(Prediction::class);
    }

    protected function casts(): array
    {
        return [
            'installation_date' => 'date',
            'last_maintenance_date' => 'date',
            'tank_height_cm' => 'decimal:2',
        ];
    }
}
