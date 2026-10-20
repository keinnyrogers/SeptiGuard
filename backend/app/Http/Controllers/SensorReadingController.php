<?php

namespace App\Http\Controllers;

use App\Services\SensorReadingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SensorReadingController extends Controller
{
    public function store(Request $request, SensorReadingService $readingService): JsonResponse
    {
        abort_unless(
            hash_equals((string) config('services.sensor.api_key'), (string) $request->header('X-Sensor-Key')),
            401,
        );

        $validated = $request->validate([
            'device_id' => ['required', 'string', 'max:100'],
            'fill_level_percentage' => ['required', 'numeric', 'between:0,100'],
            'distance_cm' => ['nullable', 'numeric', 'min:0'],
            'measured_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $reading = $readingService->store($validated);

        return response()->json([
            'message' => 'Sensor reading stored successfully.',
            'data' => $reading,
        ], 201);
    }
}
