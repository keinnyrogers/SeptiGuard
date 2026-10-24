<?php

namespace App\Http\Controllers;

use App\Models\ResidentPushToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResidentPushTokenController extends Controller
{
    public function status(Request $request): JsonResponse
    {
        $resident = $request->user();
        $this->authorizeResident($resident);
        $validated = $request->validate([
            'token' => ['nullable', 'string', 'max:4096'],
        ]);

        $enabled = isset($validated['token'])
            && $resident->residentPushTokens()
                ->where('token_hash', hash('sha256', $validated['token']))
                ->exists();

        return response()->json([
            'data' => [
                'configured' => $this->firebaseConfigured(),
                'enabled' => $enabled,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $resident = $request->user();
        $this->authorizeResident($resident);
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:4096'],
        ]);
        $tokenHash = hash('sha256', $validated['token']);
        $existing = ResidentPushToken::query()->where('token_hash', $tokenHash)->first();

        if ($existing && $existing->user_id !== $resident->id) {
            return response()->json([
                'message' => 'This device is already linked to another resident account. Sign out of that account first.',
            ], 409);
        }

        $resident->residentPushTokens()->updateOrCreate(
            ['token_hash' => $tokenHash],
            ['token' => $validated['token']],
        );

        return response()->json(['message' => 'Push notifications enabled for this device.']);
    }

    public function destroy(Request $request): JsonResponse
    {
        $resident = $request->user();
        $this->authorizeResident($resident);
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:4096'],
        ]);

        $resident->residentPushTokens()
            ->where('token_hash', hash('sha256', $validated['token']))
            ->delete();

        return response()->json(['message' => 'Push notifications disabled for this device.']);
    }

    private function authorizeResident(User $resident): void
    {
        abort_unless(
            $resident->role === 'resident'
                && $resident->account_status === 'approved'
                && ! $resident->demo_mode,
            403,
            'Push notifications are available only to approved resident accounts.',
        );
    }

    private function firebaseConfigured(): bool
    {
        $credentials = config('services.firebase.credentials');

        return is_string($credentials)
            && $credentials !== ''
            && is_file($credentials)
            && (string) config('services.firebase.project_id') !== '';
    }
}
