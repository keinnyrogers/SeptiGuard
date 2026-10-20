<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResidentComplaintController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        $complaints = $request->user()->complaints()->latest()->get()->map(
            fn (Complaint $complaint): array => $this->data($complaint)
        );

        return response()->json(['data' => $complaints->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        $validated = $request->validate([
            'category' => ['required', 'in:septic_tank,garbage,street_lights,road_damage,noise,water_supply,other'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:1000'],
            'location' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'image', 'max:10240'],
        ]);

        $location = trim((string) ($validated['location'] ?? ''));
        if ($location === '') {
            $location = $request->user()->residentProfile?->address;
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('complaints', 'local');
            if ($photoPath === false) {
                return response()->json(['message' => 'Could not save the complaint photo.'], 500);
            }
        }

        $complaint = $request->user()->complaints()->create([
            ...collect($validated)->except('photo')->all(),
            'location' => $location,
            'photo_path' => $photoPath,
            'ticket_code' => Complaint::generateTicketCode(),
            'status' => 'pending',
        ]);

        return response()->json(['data' => $this->data($complaint)], 201);
    }

    public function photo(Request $request, string $complaintId): StreamedResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        $complaint = $request->user()
            ->complaints()
            ->whereKey($complaintId)
            ->firstOrFail();
        abort_if(! $complaint->photo_path || ! Storage::disk('local')->exists($complaint->photo_path), 404);

        return Storage::disk('local')->response(
            $complaint->photo_path,
            basename($complaint->photo_path),
            ['Cache-Control' => 'private, no-store'],
        );
    }

    /** @return array<string, mixed> */
    private function data(Complaint $complaint): array
    {
        return [
            'id' => $complaint->id,
            'ticket_code' => $complaint->ticket_code,
            'category' => $complaint->category,
            'title' => $complaint->title,
            'description' => $complaint->description,
            'location' => $complaint->location,
            'photo_url' => $complaint->photo_path ? route('api.resident.complaints.photo', $complaint->id, false) : null,
            'status' => $complaint->status === 'completed' ? 'resolved' : $complaint->status,
            'filed_at' => $complaint->created_at?->toISOString(),
            'resolved_at' => $complaint->resolved_at?->toISOString(),
            'scheduled_for' => $complaint->scheduled_for?->toDateString(),
            'assigned_to' => $complaint->assigned_to,
            'hoa_response' => $complaint->hoa_response,
        ];
    }
}
