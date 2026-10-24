<?php

namespace App\Http\Controllers;

use App\Models\ResidentInformationChangeRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ResidentInformationChangeController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $resident = $request->user();
        abort_unless(
            $resident->role === 'resident'
                && $resident->account_status === 'approved'
                && ! $resident->demo_mode,
            403,
        );

        $validated = $request->validate([
            'field' => ['required', 'in:name,email,phone,address,household,other'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'requested_value' => match ($request->input('field')) {
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($resident->id)],
                'phone' => ['required', 'string', 'max:255'],
                'address' => ['required', 'string', 'max:255'],
                'household' => ['required', 'integer', 'min:1', 'max:100'],
                default => ['required', 'string', 'max:1000'],
            },
        ]);

        $currentValue = match ($validated['field']) {
            'name' => $resident->name,
            'email' => $resident->email,
            'phone' => $resident->residentProfile?->contact_number,
            'address' => $resident->residentProfile?->address,
            'household' => $resident->residentProfile?->household_members,
            default => null,
        };

        $pendingRequest = ResidentInformationChangeRequest::query()
            ->where('user_id', $resident->id)
            ->where('field', $validated['field'])
            ->where('status', 'pending')
            ->exists();

        if ($pendingRequest) {
            return response()->json([
                'message' => 'You already have a pending request for this information.',
            ], 409);
        }

        $changeRequest = DB::transaction(function () use ($resident, $validated, $currentValue): ResidentInformationChangeRequest {
            $changeRequest = ResidentInformationChangeRequest::query()->create([
                'user_id' => $resident->id,
                'field' => $validated['field'],
                'current_value' => $currentValue === null ? null : (string) $currentValue,
                'requested_value' => trim($validated['requested_value']),
                'reason' => isset($validated['reason']) ? trim($validated['reason']) : null,
                'status' => 'pending',
            ]);

            $fieldName = [
                'name' => 'full name',
                'email' => 'email address',
                'phone' => 'phone number',
                'address' => 'address',
                'household' => 'household information',
                'other' => 'account information',
            ][$validated['field']];

            $resident->septiNotifications()->create([
                'title' => 'Information change request received',
                'message' => "Your request to update your {$fieldName} was sent to the HOA for review.",
                'type' => 'announcement',
                'channel' => 'in_app',
                'is_read' => false,
                'is_sent' => true,
                'sent_at' => now(),
            ]);

            return $changeRequest;
        });

        return response()->json([
            'message' => 'Your information change request was sent to the HOA for review.',
            'data' => $changeRequest,
        ], 201);
    }
}
