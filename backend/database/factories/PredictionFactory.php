<?php

namespace Database\Factories;

use App\Models\Prediction;
use App\Models\SepticSystem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Prediction>
 */
class PredictionFactory extends Factory
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
            'current_fill' => fake()->randomFloat(2, 0, 100),
            'daily_fill_rate' => fake()->randomFloat(2, 0.1, 5),
            'days_until_full' => fake()->numberBetween(1, 365),
            'predicted_full_date' => fake()->dateTimeBetween('now', '+1 year')->format('Y-m-d'),
            'confidence' => fake()->randomFloat(2, 50, 99.99),
            'predicted_at' => now(),
        ];
    }
}
