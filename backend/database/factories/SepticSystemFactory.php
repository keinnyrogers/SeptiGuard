<?php

namespace Database\Factories;

use App\Models\SepticSystem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SepticSystem>
 */
class SepticSystemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'device_id' => fake()->unique()->bothify('ESP32-????-####'),
            'tank_type' => fake()->randomElement(['Concrete', 'Fiberglass', 'Plastic']),
            'capacity_liters' => fake()->numberBetween(1000, 10000),
            'installation_date' => fake()->dateTimeBetween('-10 years', '-1 year')->format('Y-m-d'),
            'last_maintenance_date' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'location' => fake()->address(),
        ];
    }
}
