<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\SepticSystem;
use App\Services\ResidentNotificationService;
use App\Services\TankFillForecastService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AdminTankController extends Controller
{
    public function index(TankFillForecastService $forecastService): JsonResponse
    {
        $tanks = SepticSystem::query()
            ->whereHas('user', fn ($query) => $query->where('account_status', 'approved'))
            ->with(['user.residentProfile', 'latestTankReading', 'latestDesludging'])
            ->orderBy('device_id')
            ->get()
            ->map(fn (SepticSystem $tank): array => $this->tankData($tank, $forecastService))
            ->values();

        $levels = $tanks->pluck('level')->filter(fn ($level): bool => $level !== null);
        $total = $tanks->count();
        $normal = $tanks->where('status', 'normal')->count();
        $warning = $tanks->where('status', 'warning')->count();
        $critical = $tanks->where('status', 'critical')->count();

        return response()->json([
            'data' => [
                'tanks' => $tanks,
                'summary' => [
                    'total_tanks' => $total,
                    'average_fill' => $levels->isNotEmpty() ? round($levels->avg(), 2) : null,
                    'critical_tanks' => $critical,
                    'open_complaints' => Complaint::query()
                        ->whereNotIn('status', ['completed', 'rejected'])
                        ->count(),
                    'distribution' => [
                        ['label' => 'Normal', 'value' => $normal, 'percent' => $this->percent($normal, $total), 'color' => 'text-success'],
                        ['label' => 'Warning', 'value' => $warning, 'percent' => $this->percent($warning, $total), 'color' => 'text-warning'],
                        ['label' => 'Critical', 'value' => $critical, 'percent' => $this->percent($critical, $total), 'color' => 'text-danger'],
                    ],
                ],
            ],
        ]);
    }

    public function devices(): JsonResponse
    {
        $devices = SepticSystem::query()
            ->where(function ($query): void {
                $query->whereNull('user_id')
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('account_status', 'approved'));
            })
            ->with(['user.residentProfile', 'latestTankReading'])
            ->orderBy('device_id')
            ->get()
            ->map(function (SepticSystem $tank): array {
                $reading = $tank->latestTankReading;
                $online = $reading?->measured_at?->greaterThanOrEqualTo(now()->subMinutes(15)) ?? false;

                return [
                    'id' => $tank->id,
                    'device_id' => $tank->device_id,
                    'resident' => $tank->user?->name,
                    'block_lot' => $tank->user?->residentProfile?->address,
                    'status' => $online ? 'online' : 'offline',
                    'signal' => null,
                    'battery' => null,
                    'last_reading_at' => $reading?->measured_at?->toISOString(),
                    'firmware' => $tank->firmware_version,
                ];
            })
            ->values();

        return response()->json(['data' => $devices]);
    }

    public function recordDesludging(Request $request, SepticSystem $septicSystem): JsonResponse
    {
        $validated = $request->validate([
            'performed_on' => ['required', 'date', 'before_or_equal:today'],
        ]);

        $latestDesludging = $septicSystem->desludgings()->latest('performed_on')->first();
        if (
            $latestDesludging !== null &&
            $validated['performed_on'] < $latestDesludging->performed_on->toDateString()
        ) {
            throw ValidationException::withMessages([
                'performed_on' => 'The completed date cannot be earlier than the latest recorded desludging.',
            ]);
        }

        $desludging = $septicSystem->desludgings()->create([
            'performed_on' => $validated['performed_on'],
            'recorded_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Completed desludging recorded. Forecasting will use readings from after this date.',
            'data' => [
                'id' => $desludging->id,
                'performed_on' => $desludging->performed_on->toDateString(),
            ],
        ], 201);
    }

    public function dispatchDesludging(
        Request $request,
        SepticSystem $septicSystem,
        ResidentNotificationService $notifications,
    ): JsonResponse {
        $validated = $request->validate([
            'scheduled_for' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $septicSystem->load('user.residentProfile');
        abort_unless(
            $septicSystem->user !== null && $septicSystem->user->account_status === 'approved',
            422,
            'A desludging job can only be scheduled for an approved resident tank.',
        );

        $complaint = $septicSystem->user->complaints()->create([
            'ticket_code' => Complaint::generateTicketCode(),
            'category' => 'septic_tank',
            'title' => 'Maintenance request: Desludging service for '.$septicSystem->device_id,
            'description' => 'The HOA scheduled a desludging service for '.\Illuminate\Support\Carbon::parse($validated['scheduled_for'])->toFormattedDateString().'. The HOA will update this request as work progresses.',
            'location' => $septicSystem->user->residentProfile?->address ?? $septicSystem->location,
            'status' => 'pending',
            'scheduled_for' => $validated['scheduled_for'],
        ]);

        $notifications->maintenanceScheduled($complaint);

        return response()->json([
            'message' => 'Desludging job saved. Update its status from the Complaints page as work progresses.',
            'data' => [
                'id' => $complaint->id,
                'ticket_code' => $complaint->ticket_code,
                'scheduled_for' => $complaint->scheduled_for?->toDateString(),
                'status' => 'pending',
            ],
        ], 201);
    }

    public function storeDevice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => ['required', 'string', 'max:100', 'unique:septic_systems,device_id'],
            'tank_height_cm' => ['nullable', 'numeric', 'between:25,1000'],
            'tank_type' => ['nullable', 'string', 'max:100'],
            'capacity_liters' => ['nullable', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $device = SepticSystem::create([
            ...$validated,
            'user_id' => null,
        ]);

        return response()->json([
            'data' => [
                'id' => $device->id,
                'device_id' => $device->device_id,
                'resident' => null,
                'block_lot' => null,
                'status' => 'offline',
                'signal' => null,
                'battery' => null,
                'last_reading_at' => null,
                'firmware' => null,
            ],
        ], 201);
    }

    /** @return array<string, mixed> */
    private function tankData(SepticSystem $tank, TankFillForecastService $forecastService): array
    {
        $reading = $tank->latestTankReading;
        $level = $reading?->fill_level_percentage !== null
            ? (float) $reading->fill_level_percentage
            : null;
        if ($level !== null && $level >= 80) {
            $forecast = ['status' => 'threshold_reached', 'days_to_critical' => 0];
        } else {
            try {
                $forecast = $forecastService->forecast($tank);
            } catch (ConnectionException|RequestException|RuntimeException $exception) {
                Log::error('Admin tank forecast request failed.', [
                    'system_id' => $tank->id,
                    'error' => $exception->getMessage(),
                ]);
                $forecast = ['status' => 'service_unavailable', 'days_to_critical' => null];
            }
        }

        return [
            'system_id' => $tank->id,
            'id' => $tank->device_id,
            'resident' => $tank->user?->name,
            'address' => $tank->user?->residentProfile?->address,
            'block' => $this->blockFromAddress($tank->user?->residentProfile?->address),
            'lot' => $this->lotFromAddress($tank->user?->residentProfile?->address),
            'level' => $level,
            'status' => $reading?->status,
            'measured_at' => $reading?->measured_at?->toISOString(),
            'forecast_status' => $forecast['status'],
            'days_to_critical' => $forecast['days_to_critical'],
            'installed' => $tank->installation_date?->toISOString(),
            'location' => $tank->location,
            'lastDesludged' => $tank->latestDesludging?->performed_on?->toDateString(),
        ];
    }

    private function percent(int $value, int $total): int
    {
        return $total > 0 ? (int) round(($value / $total) * 100) : 0;
    }

    private function blockFromAddress(?string $address): ?int
    {
        return preg_match('/(?:Blk|Block)\s*(\d+)/i', $address ?? '', $matches)
            ? (int) $matches[1]
            : null;
    }

    private function lotFromAddress(?string $address): ?int
    {
        return preg_match('/Lot\s*(\d+)/i', $address ?? '', $matches)
            ? (int) $matches[1]
            : null;
    }
}
