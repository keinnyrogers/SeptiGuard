<?php

namespace Tests\Feature;

use App\Models\SepticSystem;
use App\Models\TankDesludging;
use App\Models\TankReading;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ResidentPredictionTest extends TestCase
{
    use RefreshDatabase;

    public function test_resident_gets_no_sensor_state_without_a_paired_tank(): void
    {
        $this->approvedResident();

        $this->withToken('prediction-token')
            ->getJson('/api/resident/prediction')
            ->assertOk()
            ->assertJsonPath('data.status', 'no_sensor')
            ->assertJsonPath('data.history', []);
    }

    public function test_resident_prediction_delegates_daily_averages_to_fastapi(): void
    {
        config([
            'services.prediction.url' => 'http://127.0.0.1:8001',
            'services.prediction.api_key' => 'test-prediction-key',
            'services.prediction.timeout' => 5,
        ]);
        Http::fake([
            '127.0.0.1:8001/forecast' => Http::response([
                'data' => [
                    'status' => 'ready',
                    'message' => 'Linear-regression estimate.',
                    'current_fill' => 50,
                    'daily_points' => 3,
                    'readings_used' => 4,
                    'days_observed' => 2,
                    'history' => [],
                    'fill_rate_per_day' => 4.5,
                    'trend_fit_percent' => 98.2,
                    'days_to_critical' => 7,
                    'predicted_critical_at' => now()->addDays(7)->toISOString(),
                    'threshold_percentage' => 80,
                    'as_of' => now()->toISOString(),
                    'method' => '30-day daily-average scikit-learn LinearRegression',
                ],
            ]),
        ]);
        $resident = $this->approvedResident();
        $system = SepticSystem::factory()->create(['user_id' => $resident->id]);
        $firstReadingDate = now()->subDays(2)->toDateString();
        $this->addReading($system, 40, now()->subDays(2)->setTime(9, 0));
        $this->addReading($system, 42, now()->subDays(2)->setTime(12, 0));
        $this->addReading($system, 99, now()->subDays(2)->setTime(15, 0), 'simulated');
        $this->addReading($system, 45, now()->subDay()->setTime(12, 0));
        $this->addReading($system, 50, now()->setTime(12, 0));

        $this->withToken('prediction-token')
            ->getJson('/api/resident/prediction')
            ->assertOk()
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonPath('data.data_source', 'live')
            ->assertJsonPath('data.method', '30-day daily-average scikit-learn LinearRegression')
            ->assertJsonPath('data.current_fill', 50);

        Http::assertSent(function (Request $request) use ($system, $firstReadingDate): bool {
            $this->assertSame('Bearer test-prediction-key', $request->header('Authorization')[0] ?? null);
            $this->assertCount(3, $request['history']);
            $this->assertSame(4, array_sum(array_column($request['history'], 'readings_count')));
            $this->assertEquals(41, $request['history'][0]['fill_percentage']);

            $this->assertSame($firstReadingDate, $request['history'][0]['reading_date']);

            return $request->url() === 'http://127.0.0.1:8001/forecast'
                && count($system->tankReadings) === 5;
        });
    }

    public function test_forecast_uses_only_readings_after_latest_desludging_date(): void
    {
        config([
            'services.prediction.url' => 'http://127.0.0.1:8001',
            'services.prediction.api_key' => 'test-prediction-key',
            'services.prediction.timeout' => 5,
        ]);
        Http::fake([
            '127.0.0.1:8001/forecast' => Http::response([
                'data' => [
                    'status' => 'insufficient_data',
                    'message' => 'At least three readings from three separate days spanning two or more days are needed.',
                    'current_fill' => 50,
                    'daily_points' => 2,
                    'readings_used' => 2,
                    'days_observed' => 1,
                    'history' => [],
                    'fill_rate_per_day' => null,
                    'trend_fit_percent' => null,
                    'days_to_critical' => null,
                    'predicted_critical_at' => null,
                    'threshold_percentage' => 80,
                    'as_of' => now()->toISOString(),
                    'method' => '30-day daily-average scikit-learn LinearRegression',
                ],
            ]),
        ]);
        $resident = $this->approvedResident();
        $system = SepticSystem::factory()->create(['user_id' => $resident->id]);
        $serviceDate = now()->subDays(2)->toDateString();
        TankDesludging::query()->create([
            'septic_system_id' => $system->id,
            'performed_on' => $serviceDate,
        ]);
        $this->addReading($system, 65, now()->subDays(3)->setTime(12, 0));
        $this->addReading($system, 1, now()->subDays(2)->setTime(12, 0));
        $this->addReading($system, 10, now()->subDay()->setTime(12, 0));
        $this->addReading($system, 15, now()->setTime(12, 0));

        $this->withToken('prediction-token')
            ->getJson('/api/resident/prediction')
            ->assertOk()
            ->assertJsonPath('data.status', 'insufficient_data');

        Http::assertSent(function (Request $request): bool {
            $this->assertCount(2, $request['history']);
            $this->assertSame(now()->subDay()->toDateString(), $request['history'][0]['reading_date']);
            $this->assertSame(now()->toDateString(), $request['history'][1]['reading_date']);
            $this->assertSame(2, array_sum(array_column($request['history'], 'readings_count')));

            return $request->url() === 'http://127.0.0.1:8001/forecast';
        });

        $this->assertDatabaseCount('tank_readings', 4);
    }

    public function test_prediction_uses_simulated_history_when_latest_eligible_reading_is_simulated(): void
    {
        config([
            'services.prediction.url' => 'http://127.0.0.1:8001',
            'services.prediction.api_key' => 'test-prediction-key',
            'services.prediction.timeout' => 5,
        ]);
        Http::fake([
            '127.0.0.1:8001/forecast' => Http::response([
                'data' => [
                    'status' => 'insufficient_data',
                    'message' => 'At least three readings from three separate days spanning two or more days are needed.',
                    'current_fill' => 50,
                    'daily_points' => 2,
                    'readings_used' => 2,
                    'days_observed' => 1,
                    'history' => [],
                    'fill_rate_per_day' => null,
                    'trend_fit_percent' => null,
                    'days_to_critical' => null,
                    'predicted_critical_at' => null,
                    'threshold_percentage' => 80,
                    'as_of' => now()->toISOString(),
                    'method' => '30-day daily-average scikit-learn LinearRegression',
                ],
            ]),
        ]);
        $resident = $this->approvedResident();
        $system = SepticSystem::factory()->create(['user_id' => $resident->id]);
        $this->addReading($system, 40, now()->subDays(2)->setTime(12, 0), 'simulated');
        $this->addReading($system, 45, now()->subDay()->setTime(12, 0), 'sensor');
        $this->addReading($system, 50, now()->setTime(12, 0), 'simulated');

        $this->withToken('prediction-token')
            ->getJson('/api/resident/prediction')
            ->assertOk()
            ->assertJsonPath('data.status', 'insufficient_data')
            ->assertJsonPath('data.data_source', 'simulated');

        Http::assertSent(function (Request $request): bool {
            $this->assertCount(2, $request['history']);
            $this->assertSame(2, array_sum(array_column($request['history'], 'readings_count')));

            return $request->url() === 'http://127.0.0.1:8001/forecast';
        });
    }

    public function test_missing_prediction_service_configuration_returns_clear_unavailable_response(): void
    {
        config([
            'services.prediction.url' => null,
            'services.prediction.api_key' => null,
        ]);
        $resident = $this->approvedResident();
        SepticSystem::factory()->create(['user_id' => $resident->id]);

        $this->withToken('prediction-token')
            ->getJson('/api/resident/prediction')
            ->assertStatus(503)
            ->assertJsonPath('message', 'The prediction service is temporarily unavailable. Please try again later.');
    }

    public function test_prediction_service_http_failure_returns_clear_unavailable_response(): void
    {
        config([
            'services.prediction.url' => 'http://127.0.0.1:8001',
            'services.prediction.api_key' => 'test-prediction-key',
            'services.prediction.timeout' => 5,
        ]);
        Http::fake([
            '127.0.0.1:8001/forecast' => Http::response(['detail' => 'Unavailable'], 503),
        ]);
        $resident = $this->approvedResident();
        SepticSystem::factory()->create(['user_id' => $resident->id]);

        $this->withToken('prediction-token')
            ->getJson('/api/resident/prediction')
            ->assertStatus(503)
            ->assertJsonPath('message', 'The prediction service is temporarily unavailable. Please try again later.');
    }

    private function approvedResident(): User
    {
        $resident = User::factory()->create([
            'role' => 'resident',
            'account_status' => 'approved',
            'demo_mode' => false,
        ]);
        $resident->forceFill([
            'api_token_hash' => hash('sha256', 'prediction-token'),
        ])->save();

        return $resident;
    }

    private function addReading(
        SepticSystem $system,
        float $fill,
        \Illuminate\Support\Carbon $measuredAt,
        string $source = 'sensor',
    ): void
    {
        TankReading::factory()->create([
            'septic_system_id' => $system->id,
            'fill_level_percentage' => $fill,
            'measured_at' => $measuredAt,
            'source' => $source,
        ]);
    }
}
