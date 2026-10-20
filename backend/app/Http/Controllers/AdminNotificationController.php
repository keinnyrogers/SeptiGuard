<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\SepticSystem;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminNotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $items = collect();

        User::query()
            ->where('role', 'resident')
            ->where('account_status', 'pending')
            ->latest()
            ->limit(5)
            ->get()
            ->each(fn (User $user) => $items->push([
                'id' => 'resident-'.$user->id,
                'type' => 'registration',
                'title' => 'New resident registration',
                'detail' => $user->name.' is awaiting approval.',
                'time' => $user->created_at?->diffForHumans(),
                'unread' => true,
                'path' => '/admin/residents',
                'sort_at' => $user->created_at,
            ]));

        Complaint::query()
            ->whereIn('status', ['pending', 'in_progress'])
            ->latest()
            ->limit(5)
            ->get()
            ->each(fn (Complaint $complaint) => $items->push([
                'id' => 'complaint-'.$complaint->id,
                'type' => 'complaint',
                'title' => 'Open complaint '.$complaint->ticket_code,
                'detail' => $complaint->title,
                'time' => $complaint->created_at?->diffForHumans(),
                'unread' => true,
                'path' => '/admin/complaints',
                'sort_at' => $complaint->created_at,
            ]));

        SepticSystem::query()
            ->with('latestTankReading')
            ->whereHas('user', fn ($query) => $query->where('account_status', 'approved'))
            ->get()
            ->each(function (SepticSystem $tank) use ($items): void {
                $reading = $tank->latestTankReading;
                if ($reading?->fill_level_percentage >= 80) {
                    $items->push([
                        'id' => 'critical-'.$tank->id,
                        'type' => 'critical',
                        'title' => $tank->device_id.' reached critical level',
                        'detail' => (float) $reading->fill_level_percentage.'% fill level.',
                        'time' => $reading->measured_at?->diffForHumans(),
                        'unread' => true,
                        'path' => '/admin/tanks',
                        'sort_at' => $reading->measured_at,
                    ]);
                }
            });

        return response()->json([
            'data' => $items
                ->sortByDesc('sort_at')
                ->values()
                ->groupBy('type')
                ->flatMap(fn ($group) => $group->take(5))
                ->sortByDesc('sort_at')
                ->values()
                ->map(fn (array $item) => collect($item)->except('sort_at')->all()),
        ]);
    }
}
