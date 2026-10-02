<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminResidentController extends Controller
{
    public function index(): JsonResponse
    {
        $residents = User::query()
            ->where('role', 'resident')
            ->with(['residentProfile', 'septicSystem'])
            ->latest()
            ->get()
            ->map(fn (User $user): array => $this->residentData($user));

        return response()->json(['data' => $residents]);
    }

    public function updateApproval(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        abort_unless($user->role === 'resident' && $user->account_status === 'pending', 404);

        $user->update(['account_status' => $validated['status']]);
        $user->load(['residentProfile', 'septicSystem']);

        return response()->json([
            'message' => 'Resident account '.($validated['status'] === 'approved' ? 'approved' : 'rejected').'.',
            'data' => $this->residentData($user),
        ]);
    }

    /** @return array<string, mixed> */
    private function residentData(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->residentProfile?->contact_number,
            'role' => 'Homeowner',
            'block_lot' => $user->residentProfile?->address,
            'tank_id' => $user->septicSystem?->device_id,
            'fill_level' => null,
            'tank_status' => null,
            'status' => $user->account_status,
            'is_active' => $user->account_status === 'approved',
            'last_activity' => $user->updated_at?->toISOString(),
        ];
    }
}
