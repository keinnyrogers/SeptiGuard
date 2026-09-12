<?php

namespace App\Http\Controllers;

use App\Models\SepticSystem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SensorReadingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        abort_unless(
            hash_equals((string) config('services.sensor.api_key'), (string) $request->header('X-Sensor-Key')),
            401,
        );

        $validated = $request->validate([
            'device_id' => ['required', 'string', 'max:100'],
            'fill_level_percentage' => ['required', 'integer', 'between:0,100'],
            'distance_cm' => ['nullable', 'numeric', 'min:0'],
            'measured_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $septicSystem = SepticSystem::query()
            ->where('device_id', $validated['device_id'])
            ->firstOrFail();

        $fillLevel = (int) $validated['fill_level_percentage'];
        $status = match (true) {
            $fillLevel >= 80 => 'critical',
            $fillLevel >= 70 => 'warning',
            default => 'normal',
        };

        $reading = $septicSystem->tankReadings()->create([
            'fill_level_percentage' => $fillLevel,
            'distance_cm' => $validated['distance_cm'] ?? null,
            'measured_at' => isset($validated['measured_at'])
                ? Carbon::parse($validated['measured_at'])
                : now(),
            'source' => 'sensor',
            'notes' => $validated['notes'] ?? null,
            'status' => $status,
        ]);

        return response()->json([
            'message' => 'Sensor reading stored successfully.',
            'data' => $reading,
        ], 201);
    }
}
