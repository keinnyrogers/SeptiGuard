<?php

namespace App\Http\Controllers;

use App\Models\SepticSystem;
use App\Services\MqttDeviceConfigPublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use PhpMqtt\Client\Exceptions\MqttClientException;

class ResidentDeviceController extends Controller
{
    public function pair(Request $request, MqttDeviceConfigPublisher $configPublisher): JsonResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        $validated = $request->validate([
            'device_id' => ['required', 'string', 'max:100'],
            'tank_height_cm' => ['required', 'numeric', 'between:25,1000'],
        ]);

        $system = SepticSystem::query()
            ->where('device_id', $validated['device_id'])
            ->first();

        if (! $system) {
            throw ValidationException::withMessages([
                'device_id' => 'That device was not found in the device registry.',
            ]);
        }

        if ($system->user_id !== null && $system->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'That device is already paired with another resident.',
            ], 409);
        }

        $system->update([
            'user_id' => $request->user()->id,
            'tank_height_cm' => $validated['tank_height_cm'],
        ]);

        try {
            $configPublisher->publishTankHeight(
                $system->device_id,
                (float) $validated['tank_height_cm'],
            );
        } catch (MqttClientException $exception) {
            Log::error('Unable to publish paired tank height to the device.', [
                'device_id' => $system->device_id,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'The device was paired, but its height could not be sent. Please try pairing again while the MQTT broker is available.',
            ], 503);
        }

        return response()->json([
            'message' => 'Device paired successfully.',
            'data' => [
                'device_id' => $system->device_id,
                'tank_height_cm' => $system->tank_height_cm,
                'location' => $system->location,
            ],
        ]);
    }
}
