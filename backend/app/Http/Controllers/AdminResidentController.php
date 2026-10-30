<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ResidentRegistrationStatusEmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

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

    public function updateApproval(
        Request $request,
        User $user,
        ResidentRegistrationStatusEmailService $emailService,
    ): JsonResponse {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'rejection_reason' => ['required_if:status,rejected', 'nullable', 'string', 'max:1000'],
        ]);

        abort_unless($user->role === 'resident' && $user->account_status === 'pending', 404);

        $rejectionReason = $validated['status'] === 'rejected'
            ? trim($validated['rejection_reason'])
            : null;
        $emailQueued = false;
        DB::transaction(function () use ($user, $validated, $rejectionReason, $emailService, &$emailQueued): void {
            $user->update([
                'account_status' => $validated['status'],
                'rejection_reason' => $rejectionReason,
            ]);
            $emailQueued = $emailService->queueStatusEmail($user, $validated['status'], $rejectionReason);

            if ($validated['status'] === 'rejected') {
                $this->anonymizeResidentRecord($user, true);
            }
        });

        $user->refresh();
        $user->load(['residentProfile', 'septicSystem']);

        $message = match (true) {
            $validated['status'] === 'rejected' && $emailQueued => 'Resident registration declined and email released. Status email queued.',
            $validated['status'] === 'rejected' => 'Resident registration declined and email released, but no email was queued because SMTP is not configured.',
            $emailQueued => 'Resident account approved. Status email queued.',
            default => 'Resident account approved, but no email was queued because SMTP is not configured.',
        };

        return response()->json([
            'message' => $message,
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

    public function anonymizeDeactivated(User $user): JsonResponse
    {
        abort_unless(
            $user->role === 'resident' && in_array($user->account_status, ['inactive', 'rejected'], true),
            404,
        );

        DB::transaction(function () use ($user): void {
            $this->anonymizeResidentRecord($user);
        });

        $user->refresh();
        $user->load(['residentProfile', 'septicSystem']);

        return response()->json([
            'message' => 'Resident account removed. The resident name and complaint/service history were retained, and the original email can be used to register again.',
            'data' => $this->residentData($user),
        ]);
    }

    private function anonymizeResidentRecord(User $user, bool $preserveRejectionReason = false): void
    {
        $profile = $user->residentProfile;
        $profilePhotoPath = $profile?->profile_photo_path;
        if ($profilePhotoPath && ! Storage::disk('local')->delete($profilePhotoPath)) {
            throw new RuntimeException('The resident profile photo could not be removed.');
        }

        $user->septicSystem?->update(['user_id' => null]);
        $user->residentPushTokens()->delete();
        $user->septiNotifications()->delete();
        DB::table('resident_information_change_requests')
            ->where('user_id', $user->id)
            ->delete();

        $user->update([
            'email' => 'deleted-'.$user->id.'-'.Str::uuid().'@deleted.invalid',
            'password' => Str::random(64),
            'account_status' => 'deleted',
            'rejection_reason' => $preserveRejectionReason ? $user->rejection_reason : null,
            'api_token_hash' => null,
            'anonymized_at' => now(),
        ]);

        $profile?->update([
            'profile_photo_path' => null,
            'address' => 'Removed',
            'contact_number' => 'Removed',
            'household_members' => 0,
            'notes' => null,
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
            'rejection_reason' => $user->rejection_reason,
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
