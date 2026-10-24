<?php

namespace App\Http\Controllers;

use App\Services\TankFillForecastService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class ResidentPredictionController extends Controller
{
    public function show(Request $request, TankFillForecastService $forecastService): JsonResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        $system = $request->user()->septicSystem;
        if ($system === null) {
            return response()->json([
                'data' => [
                    'status' => 'no_sensor',
                    'message' => 'Pair a tank device before a forecast can be calculated.',
                    'threshold_percentage' => 80,
                    'current_fill' => null,
                    'readings_used' => 0,
                    'daily_points' => 0,
                    'days_observed' => 0,
                    'history' => [],
                    'fill_rate_per_day' => null,
                    'trend_fit_percent' => null,
                    'days_to_critical' => null,
                    'predicted_critical_at' => null,
                    'as_of' => now()->toISOString(),
                    'method' => '30-day daily-average scikit-learn LinearRegression',
                ],
            ]);
        }

        try {
            return response()->json([
                'data' => $forecastService->forecast($system),
            ]);
        } catch (ConnectionException|RequestException|RuntimeException $exception) {
            Log::error('Tank prediction service request failed.', [
                'user_id' => $request->user()->id,
                'system_id' => $system->id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'The prediction service is temporarily unavailable. Please try again later.',
            ], 503);
        }
    }

}
