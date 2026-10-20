<?php

namespace Tests\Feature;

use App\Models\Complaint;
use App\Models\SepticSystem;
use App\Models\TankReading;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_report_summarizes_filtered_approved_resident_data(): void
    {
        $admin = $this->createUser('hoa_admin', 'approved');
        $resident = $this->createUser('resident', 'approved');
        $system = SepticSystem::factory()->create([
            'user_id' => $resident->id,
            'device_id' => 'TNK-REPORT-001',
        ]);
        TankReading::factory()->create([
            'septic_system_id' => $system->id,
            'fill_level_percentage' => 40,
            'measured_at' => now()->subDays(40),
        ]);
        TankReading::factory()->create([
            'septic_system_id' => $system->id,
            'fill_level_percentage' => 60,
            'measured_at' => now()->subDay(),
        ]);
        $complaint = Complaint::query()->create([
            'user_id' => $resident->id,
            'ticket_code' => 'CMP-REPORT-001',
            'title' => 'Tank inspection',
            'category' => 'septic_tank',
            'description' => 'Please inspect the tank.',
            'status' => 'completed',
        ]);
        $complaint->forceFill(['created_at' => now()->subDay()])->save();
        $oldComplaint = Complaint::query()->create([
            'user_id' => $resident->id,
            'ticket_code' => 'CMP-REPORT-OLD',
            'title' => 'Old complaint',
            'category' => 'garbage',
            'description' => 'Old report outside requested period.',
            'status' => 'pending',
        ]);
        $oldComplaint->forceFill(['created_at' => now()->subDays(60)])->save();
        $pendingResident = $this->createUser('resident', 'pending');
        $pendingSystem = SepticSystem::factory()->create(['user_id' => $pendingResident->id]);
        TankReading::factory()->create([
            'septic_system_id' => $pendingSystem->id,
            'fill_level_percentage' => 99,
            'measured_at' => now(),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->getJson('/api/admin/reports?days=30')
            ->assertOk()
            ->assertJsonPath('data.period_days', '30')
            ->assertJsonPath('data.summary.complaints_filed', 1)
            ->assertJsonPath('data.summary.open_complaints', 1)
            ->assertJsonPath('data.summary.connected_tanks', 1)
            ->assertJsonPath('data.summary.average_fill', 60)
            ->assertJsonPath('data.summary.active_residents', 1)
            ->assertJsonPath('data.summary.tank_readings', 1)
            ->assertJsonPath('data.category_counts.septic_tank', 1)
            ->assertJsonPath('data.category_counts.garbage', 0)
            ->assertJsonPath('data.status_counts.resolved', 1)
            ->assertJsonPath('data.tanks.0.device_id', 'TNK-REPORT-001')
            ->assertJsonPath('data.tanks.0.readings_in_period', 1)
            ->assertJsonPath('data.recent_complaints.0.ticket_code', $complaint->ticket_code)
            ->assertJsonPath('data.complaint_records.0.ticket_code', $complaint->ticket_code)
            ->assertJsonCount(1, 'data.complaint_records');
    }

    public function test_report_endpoint_requires_hoa_role_and_valid_date_range(): void
    {
        $resident = $this->createUser('resident', 'approved');
        $token = $this->tokenFor($resident);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/admin/reports')
            ->assertForbidden();

        $admin = $this->createUser('hoa_admin', 'approved');
        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->getJson('/api/admin/reports?days=45')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('days');
    }

    private function createUser(string $role, string $accountStatus): User
    {
        return User::factory()->create([
            'role' => $role,
            'account_status' => $accountStatus,
        ]);
    }

    private function tokenFor(User $user): string
    {
        $token = 'report-test-token-'.$user->id;
        $user->forceFill(['api_token_hash' => hash('sha256', $token)])->save();

        return $token;
    }
}
