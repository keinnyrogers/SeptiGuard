<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ApiAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if ($user->account_status !== 'approved') {
            return response()->json([
                'message' => 'Your account is awaiting HOA approval.',
                'status' => $user->account_status,
            ], 403);
        }

        $token = Str::random(80);
        $user->forceFill(['api_token_hash' => hash('sha256', $token)])->save();

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'address' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
            'password' => ['required', 'confirmed', 'string', 'min:8'],
        ]);

        $user = DB::transaction(function () use ($validated): User {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => 'resident',
                'account_status' => 'pending',
            ]);

            $user->residentProfile()->create([
                'address' => $validated['address'],
                'contact_number' => $validated['contact_number'],
            ]);

            return $user;
        });

        return response()->json([
            'message' => 'Registration submitted and is awaiting HOA approval.',
            'user' => $user->load('residentProfile'),
        ], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();

        if ($token) {
            User::query()
                ->where('api_token_hash', hash('sha256', $token))
                ->update(['api_token_hash' => null]);
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }
}
