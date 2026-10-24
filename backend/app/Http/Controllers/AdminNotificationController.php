<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\ResidentInformationChangeRequest;
use App\Models\SepticSystem;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AdminNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = $this->notificationItems();
        $readKeys = DB::table('admin_notification_reads')
            ->where('admin_user_id', $request->user()->id)
            ->whereIn('notification_key', $items->pluck('id'))
            ->pluck('notification_key')
            ->all();

        return response()->json([
            'data' => $items->map(function (array $item) use ($readKeys): array {
                $item['unread'] = ! in_array($item['id'], $readKeys, true);
                return collect($item)->except('sort_at')->all();
            }),
        ]);
    }

    public function markRead(Request $request, string $notificationKey): JsonResponse
    {
        $exists = $this->notificationItems()->contains(
            fn (array $item): bool => $item['id'] === $notificationKey,
        );
        if (! $exists) {
            throw new NotFoundHttpException('Notification not found.');
        }

        DB::table('admin_notification_reads')->updateOrInsert(
            [
                'admin_user_id' => $request->user()->id,
                'notification_key' => $notificationKey,
            ],
            [
                'read_at' => now(),
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function notificationItems()
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
                'path' => '/admin/complaints',
                'sort_at' => $complaint->created_at,
            ]));

        ResidentInformationChangeRequest::query()
            ->with('user')
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get()
            ->each(function (ResidentInformationChangeRequest $changeRequest) use ($items): void {
                $fieldName = [
                    'name' => 'full name',
                    'email' => 'email address',
                    'phone' => 'phone number',
                    'address' => 'address',
                    'household' => 'household information',
                    'other' => 'account information',
                ][$changeRequest->field] ?? 'account information';

                $items->push([
                    'id' => 'information-change-'.$changeRequest->id,
                    'type' => 'information_change',
                    'title' => 'Resident information change request',
                    'detail' => $changeRequest->user->name.' requested a change to their '.$fieldName.'.',
                    'time' => $changeRequest->created_at?->diffForHumans(),
                    'path' => '/admin/residents',
                    'sort_at' => $changeRequest->created_at,
                ]);
            });

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
                        'path' => '/admin/tanks',
                        'sort_at' => $reading->measured_at,
                    ]);
                }
            });

        return $items
            ->sortByDesc('sort_at')
            ->values()
            ->groupBy('type')
            ->flatMap(fn ($group) => $group->take(5))
            ->sortByDesc('sort_at')
            ->values();
    }
}
