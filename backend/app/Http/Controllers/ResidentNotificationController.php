<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResidentNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        return response()->json([
            'data' => $request->user()->septiNotifications()->where('channel', 'in_app')->latest()->get()->map(fn ($notification): array => [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'is_read' => $notification->is_read,
                'created_at' => $notification->created_at?->toISOString(),
            ]),
        ]);
    }

    public function markRead(Request $request): JsonResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);
        $request->user()->septiNotifications()
            ->where('channel', 'in_app')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Notifications marked as read.']);
    }

    public function markOneRead(Request $request, string $notificationId): JsonResponse
    {
        abort_unless($request->user()->account_status === 'approved', 403);

        $notification = $request->user()
            ->septiNotifications()
            ->where('channel', 'in_app')
            ->whereKey($notificationId)
            ->firstOrFail();
        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notification marked as read.']);
    }
}
