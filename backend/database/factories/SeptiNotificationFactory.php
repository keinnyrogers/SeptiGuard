<?php

namespace Database\Factories;

use App\Models\SeptiNotification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SeptiNotification>
 */
class SeptiNotificationFactory extends Factory
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
            'title' => fake()->sentence(4),
            'message' => fake()->paragraph(),
            'type' => fake()->randomElement([
                'critical_alert',
                'warning_alert',
                'predictive_alert',
                'ticket_update',
                'announcement',
            ]),
            'channel' => fake()->randomElement(['fcm', 'email', 'sms']),
            'is_read' => false,
            'is_sent' => false,
            'sent_at' => null,
        ];
    }
}
