<?php

namespace App\Http\Controllers;

use App\Models\ResidentInformationChangeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;

class AdminResidentInformationChangeController extends Controller
{
    public function index(): JsonResponse
    {
        $requests = ResidentInformationChangeRequest::query()
            ->with(['user.residentProfile', 'reviewer'])
            ->latest()
            ->get()
            ->map(fn (ResidentInformationChangeRequest $changeRequest): array => $this->requestData($changeRequest));

        return response()->json(['data' => $requests]);
    }

    public function review(Request $request, ResidentInformationChangeRequest $informationChangeRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
        ]);

        abort_unless($informationChangeRequest->status === 'pending', 409, 'This request has already been reviewed.');

        DB::transaction(function () use ($informationChangeRequest, $validated, $request): void {
            if ($validated['status'] === 'approved') {
                $resident = $informationChangeRequest->user;
                $value = $informationChangeRequest->requested_value;

                $valueRules = match ($informationChangeRequest->field) {
                    'name' => ['required', 'string', 'max:255'],
                    'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($resident->id)],
                    'phone' => ['required', 'string', 'max:255'],
                    'address' => ['required', 'string', 'max:255'],
                    'household' => ['required', 'integer', 'min:1', 'max:100'],
                    'other' => ['required', 'string', 'max:1000'],
                    default => abort(422, 'This information field cannot be updated.'),
                };
                Validator::make(['requested_value' => $value], ['requested_value' => $valueRules])->validate();

                if (in_array($informationChangeRequest->field, ['phone', 'address', 'household'], true)
                    && $resident->residentProfile === null) {
                    abort(409, 'The resident profile is unavailable, so this request cannot be applied.');
                }

                match ($informationChangeRequest->field) {
                    'name' => $resident->update(['name' => $value]),
                    'email' => $resident->update(['email' => $value]),
                    'phone' => $resident->residentProfile?->update(['contact_number' => $value]),
                    'address' => $resident->residentProfile?->update(['address' => $value]),
                    'household' => $resident->residentProfile?->update(['household_members' => (int) $value]),
                    'other' => null,
                    default => abort(422, 'This information field cannot be updated.'),
                };
            }

            $informationChangeRequest->update([
                'status' => $validated['status'],
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        });

        $informationChangeRequest->refresh()->load(['user.residentProfile', 'reviewer']);

        return response()->json([
            'message' => $validated['status'] === 'approved' ? 'Request approved.' : 'Request rejected.',
            'data' => $this->requestData($informationChangeRequest),
        ]);
    }

    /** @return array<string, mixed> */
    private function requestData(ResidentInformationChangeRequest $changeRequest): array
    {
        return [
            'id' => $changeRequest->id,
            'field' => $changeRequest->field,
            'current_value' => $changeRequest->current_value,
            'requested_value' => $changeRequest->requested_value,
            'reason' => $changeRequest->reason,
            'status' => $changeRequest->status,
            'reviewed_at' => $changeRequest->reviewed_at?->toISOString(),
            'reviewer_name' => $changeRequest->reviewer?->name,
            'created_at' => $changeRequest->created_at?->toISOString(),
            'resident' => [
                'id' => $changeRequest->user->id,
                'name' => $changeRequest->user->name,
                'email' => $changeRequest->user->email,
                'phone' => $changeRequest->user->residentProfile?->contact_number,
                'address' => $changeRequest->user->residentProfile?->address,
                'address' => $changeRequest->user->residentProfile?->address,
            ],
        ];
    }
}
