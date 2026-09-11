<?php

namespace Database\Factories;

use App\Models\SepticSystem;
use App\Models\TankReading;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TankReading>
 */
class TankReadingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'septic_system_id' => SepticSystem::factory(),
            'fill_level_percentage' => fake()->numberBetween(0, 100),
            'measured_at' => fake()->dateTimeBetween('-30 days', 'now'),
            'source' => fake()->randomElement(['sensor', 'manual']),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
