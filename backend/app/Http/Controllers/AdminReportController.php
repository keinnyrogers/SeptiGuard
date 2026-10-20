<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\SepticSystem;
use App\Models\TankReading;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'days' => ['sometimes', Rule::in(['30', '90', '180', '365', 'all'])],
        ]);
        $cutoff = ($validated['days'] ?? '180') === 'all'
            ? null
            : now()->subDays((int) ($validated['days'] ?? '180'));

        $eligibleSystemIds = SepticSystem::query()
            ->whereHas('user', fn ($query) => $query->where('account_status', 'approved'))
            ->select('id');

        $complaints = Complaint::query()
            ->whereHas('user', fn ($query) => $query->where('account_status', 'approved'))
            ->with('user:id,name')
            ->when($cutoff, fn ($query) => $query->where('created_at', '>=', $cutoff))
            ->latest()
            ->get();

        $categoryKeys = [
            'septic_tank', 'garbage', 'street_lights', 'road_damage',
            'noise', 'water_supply', 'other',
        ];
        $categories = array_fill_keys($categoryKeys, 0);
        $statuses = ['pending' => 0, 'in_progress' => 0, 'resolved' => 0];

        foreach ($complaints as $complaint) {
            if (array_key_exists($complaint->category, $categories)) {
                $categories[$complaint->category]++;
            }
            $status = $complaint->status === 'completed' ? 'resolved' : $complaint->status;
            if (array_key_exists($status, $statuses)) {
                $statuses[$status]++;
            }
        }

        $tanks = SepticSystem::query()
            ->whereHas('user', fn ($query) => $query->where('account_status', 'approved'))
            ->with(['user:id,name', 'latestTankReading'])
            ->orderBy('device_id')
            ->get();
        $readingCounts = TankReading::query()
            ->whereIn('septic_system_id', $eligibleSystemIds)
            ->when($cutoff, fn ($query) => $query->where('measured_at', '>=', $cutoff))
            ->selectRaw('septic_system_id, COUNT(*) as reading_count')
            ->groupBy('septic_system_id')
            ->pluck('reading_count', 'septic_system_id');
        $levels = $tanks->map(fn (SepticSystem $tank): ?float => $tank->latestTankReading?->fill_level_percentage === null
            ? null
            : (float) $tank->latestTankReading->fill_level_percentage)
            ->filter(fn (?float $level): bool => $level !== null);
        $currentOpenComplaints = Complaint::query()
            ->whereHas('user', fn ($query) => $query->where('account_status', 'approved'))
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();
        $activeResidents = User::query()
            ->where('role', 'resident')
            ->where('account_status', 'approved')
            ->count();
        $readingQuery = TankReading::query()->whereIn('septic_system_id', $eligibleSystemIds);
        if ($cutoff) {
            $readingQuery->where('measured_at', '>=', $cutoff);
        }
        $complaintRecords = $complaints->map(fn (Complaint $complaint): array => [
            'ticket_code' => $complaint->ticket_code,
            'title' => $complaint->title,
            'category' => $complaint->category,
            'status' => $complaint->status === 'completed' ? 'resolved' : $complaint->status,
            'resident_name' => $complaint->user?->name ?? 'Unknown resident',
            'filed_at' => $complaint->created_at?->toISOString(),
        ])->values();

        return response()->json([
            'data' => [
                'period_days' => $validated['days'] ?? '180',
                'summary' => [
                    'complaints_filed' => $complaints->count(),
                    'open_complaints' => $currentOpenComplaints,
                    'connected_tanks' => $tanks->count(),
                    'average_fill' => $levels->isNotEmpty() ? round($levels->avg(), 2) : null,
                    'tanks_with_readings' => $levels->count(),
                    'active_residents' => $activeResidents,
                    'tank_readings' => $readingQuery->count(),
                ],
                'category_counts' => $categories,
                'status_counts' => $statuses,
                'tanks' => $tanks->map(function (SepticSystem $tank) use ($readingCounts): array {
                    $reading = $tank->latestTankReading;

                    return [
                        'device_id' => $tank->device_id,
                        'resident_name' => $tank->user?->name,
                        'fill_level' => $reading?->fill_level_percentage === null
                            ? null
                            : (float) $reading->fill_level_percentage,
                        'last_reading_at' => $reading?->measured_at?->toISOString(),
                        'readings_in_period' => (int) ($readingCounts[$tank->id] ?? 0),
                    ];
                })->values(),
                'complaint_records' => $complaintRecords,
                'recent_complaints' => $complaintRecords->take(10),
            ],
        ]);
    }
}
