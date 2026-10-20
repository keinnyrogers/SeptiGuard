<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResidentAccountController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $resident = $request->user();
        abort_unless(
            $resident->role === 'resident' && $resident->account_status === 'approved',
            403,
        );

        return response()->json([
            'data' => $resident->load('residentProfile'),
        ]);
    }

    public function uploadProfilePhoto(Request $request): JsonResponse
    {
        abort_unless(
            $request->user()->role === 'resident' && $request->user()->account_status === 'approved',
            403,
        );

        $validated = $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);
        $profile = $request->user()->residentProfile;
        abort_if($profile === null, 404, 'Resident profile not found.');

        $path = $validated['photo']->store("resident-profile-photos/{$request->user()->id}", 'local');
        if ($path === false) {
            return response()->json(['message' => 'Could not save your profile photo.'], 500);
        }

        $previousPath = $profile->profile_photo_path;
        $profile->update(['profile_photo_path' => $path]);

        if ($previousPath) {
            Storage::disk('local')->delete($previousPath);
        }

        return response()->json([
            'message' => 'Profile photo updated.',
            'data' => ['profile_photo_path' => $path],
        ]);
    }

    public function profilePhoto(Request $request): StreamedResponse
    {
        abort_unless(
            $request->user()->role === 'resident' && $request->user()->account_status === 'approved',
            403,
        );

        $path = $request->user()->residentProfile?->profile_photo_path;
        abort_if(! $path || ! Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response(
            $path,
            basename($path),
            ['Cache-Control' => 'private, no-store'],
            'inline',
        );
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'The current password is incorrect.',
            ]);
        }

        $request->user()->update([
            'password' => $validated['password'],
        ]);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
