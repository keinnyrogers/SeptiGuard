<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResidentTankController extends Controller
{
    public function latest(Request $request): JsonResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        $system = $request->user()->septicSystem;
        $latestDesludging = $system?->latestDesludging;
        $reading = $system?->tankReadings()->latest('measured_at')->first();
        $historyQuery = $system?->tankReadings()
            ->where('measured_at', '>=', now()->subDays(90));
        if ($latestDesludging !== null) {
            $historyQuery?->whereDate('measured_at', '>', $latestDesludging->performed_on);
        }
        $history = $historyQuery
            ?->selectRaw('DATE(measured_at) as reading_date, AVG(fill_level_percentage) as fill_percentage, COUNT(*) as readings_count')
            ->groupByRaw('DATE(measured_at)')
            ->orderBy('reading_date')
            ->get()
            ->map(fn ($point): array => [
                'date_key' => $point->reading_date,
                'value' => round((float) $point->fill_percentage, 2),
                'readings_count' => (int) $point->readings_count,
            ])
            ->values() ?? collect();

        return response()->json([
            'data' => [
                'has_sensor' => $system !== null,
                'device_id' => $system?->device_id,
                'location' => $system?->location,
                'tank_height_cm' => $system?->tank_height_cm,
                'installation_date' => $system?->installation_date?->toISOString(),
                'last_maintenance_date' => $system?->last_maintenance_date?->toISOString(),
                'last_service_date' => $latestDesludging?->performed_on?->toDateString()
                    ?? $system?->last_maintenance_date?->toDateString(),
                'reading' => $reading,
                'history' => $history,
            ],
        ]);
    }
}
