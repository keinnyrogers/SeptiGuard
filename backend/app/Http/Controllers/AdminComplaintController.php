<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Services\ResidentNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminComplaintController extends Controller
{
    public function index(): JsonResponse
    {
        $complaints = Complaint::query()
            ->with(['user.septicSystem'])
            ->latest()
            ->get()
            ->map(fn (Complaint $complaint): array => $this->complaintData($complaint));

        return response()->json(['data' => $complaints->values()]);
    }

    public function updateStatus(
        Request $request,
        Complaint $complaint,
        ResidentNotificationService $notifications,
    ): JsonResponse {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,in_progress,resolved'],
            'hoa_response' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        $status = $validated['status'] === 'resolved' ? 'completed' : $validated['status'];
        $response = array_key_exists('hoa_response', $validated)
            ? $validated['hoa_response']
            : $complaint->hoa_response;
        $statusChanged = $complaint->status !== $status;
        $responseChanged = $complaint->hoa_response !== $response;

        $updates = [
            'status' => $status,
            'resolved_at' => $validated['status'] === 'resolved' ? now() : null,
        ];
        if (array_key_exists('hoa_response', $validated)) {
            $updates['hoa_response'] = $response;
        }
        DB::transaction(function () use ($complaint, $updates, $notifications, $statusChanged, $responseChanged): void {
            $complaint->loadMissing('user')->update($updates);
            $notifications->complaintUpdated($complaint, $statusChanged, $responseChanged);
        });

        return response()->json([
            'message' => 'Complaint status updated.',
            'data' => $this->complaintData($complaint->fresh(['user.septicSystem'])),
        ]);
    }

    public function photo(string $complaintId): StreamedResponse
    {
        $complaint = Complaint::query()->findOrFail($complaintId);
        abort_if(! $complaint->photo_path || ! Storage::disk('local')->exists($complaint->photo_path), 404);

        return Storage::disk('local')->response(
            $complaint->photo_path,
            basename($complaint->photo_path),
            ['Cache-Control' => 'private, no-store'],
        );
    }

    /** @return array<string, mixed> */
    private function complaintData(Complaint $complaint): array
    {
        return [
            'id' => $complaint->id,
            'ticket_code' => $complaint->ticket_code,
            'title' => $complaint->title,
            'category' => $complaint->category,
            'description' => $complaint->description,
            'location' => $complaint->location,
            'photo_url' => $complaint->photo_path ? route('api.admin.complaints.photo', $complaint->id, false) : null,
            'resident_name' => $complaint->user?->name ?? 'Unknown resident',
            'tank_id' => $complaint->user?->septicSystem?->device_id,
            'status' => $complaint->status === 'completed' ? 'resolved' : $complaint->status,
            'filed_at' => $complaint->created_at?->toISOString(),
            'resolved_at' => $complaint->resolved_at?->toISOString(),
            'scheduled_for' => $complaint->scheduled_for?->toDateString(),
            'assigned_to' => $complaint->assigned_to,
            'hoa_response' => $complaint->hoa_response,
        ];
    }
}
