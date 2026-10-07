<?php

namespace Database\Seeders;

use App\Models\SepticSystem;
use App\Models\TankReading;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'HOA Administrator',
            'email' => 'hoa-admin@example.com',
            'password' => 'password123',
            'role' => 'hoa_admin',
            'account_status' => 'approved',
        ]);

        $resident = User::factory()->create([
            'name' => 'Demo Resident',
            'email' => 'resident@example.com',
            'password' => 'password123',
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => true,
        ]);

        $septicSystem = SepticSystem::create([
            'user_id' => $resident->id,
            'device_id' => 'ESP32-DEMO-001',
            'tank_type' => 'Concrete',
            'capacity_liters' => 5000,
            'installation_date' => '2022-06-15',
            'last_maintenance_date' => '2026-01-20',
            'location' => 'Backyard inspection area',
        ]);

        TankReading::create([
            'septic_system_id' => $septicSystem->id,
            'fill_level_percentage' => 65,
            'measured_at' => now(),
            'source' => 'manual',
            'notes' => 'Demo reading for dashboard testing.',
            'status' => 'normal',
            'distance_cm' => 84.50,
        ]);
    }
}
