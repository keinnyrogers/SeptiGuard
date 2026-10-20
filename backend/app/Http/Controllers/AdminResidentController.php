<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminResidentController extends Controller
{
    public function index(): JsonResponse
    {
        $residents = User::query()
            ->where('role', 'resident')
            ->with(['residentProfile', 'septicSystem', 'complaints'])
            ->latest()
            ->get()
            ->map(fn (User $user): array => $this->residentData($user));

        return response()->json(['data' => $residents]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'address' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
            'password' => ['required', 'confirmed', 'string', 'min:8'],
        ]);

        $resident = DB::transaction(function () use ($validated): User {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => 'resident',
                'account_status' => 'approved',
                'demo_mode' => false,
            ]);

            $user->residentProfile()->create([
                'address' => $validated['address'],
                'contact_number' => $validated['contact_number'],
            ]);

            return $user;
        });

        $resident->load(['residentProfile', 'septicSystem', 'complaints']);

        return response()->json([
            'message' => 'Resident account created and approved.',
            'data' => $this->residentData($resident),
        ], 201);
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

    public function deactivate(User $user): JsonResponse
    {
        abort_unless($user->role === 'resident' && $user->account_status === 'approved', 404);

        $user->septicSystem?->update(['user_id' => null]);
        $user->update([
            'account_status' => 'inactive',
            'api_token_hash' => null,
        ]);
        $user->load(['residentProfile', 'septicSystem']);

        return response()->json([
            'message' => 'Resident account deactivated and device unpaired.',
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
            'recent_complaints' => $user->complaints
                ->sortByDesc('created_at')
                ->take(4)
                ->values()
                ->map(fn ($complaint): array => [
                    'id' => $complaint->id,
                    'ticket_code' => $complaint->ticket_code,
                    'title' => $complaint->title,
                    'category' => $complaint->category,
                    'status' => $complaint->status === 'completed' ? 'resolved' : $complaint->status,
                    'filed_at' => $complaint->created_at?->toISOString(),
                ])
                ->all(),
        ];
    }
}
