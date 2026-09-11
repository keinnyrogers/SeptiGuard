<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HoaApprovalController;
use App\Http\Controllers\HoaMaintenanceRequestController;
use App\Http\Controllers\MaintenanceRequestController;
use App\Http\Controllers\ResidentProfileController;
use App\Http\Controllers\SepticSystemController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/registration-pending/{status?}', function (?string $status = 'pending') {
    abort_unless(in_array($status, ['pending', 'rejected'], true), 404);

    return view('auth.registration-pending', ['status' => $status]);
})->name('registration.pending');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        $user = Auth::user();
        $septicSystem = $user->septicSystem;
        $latestReading = $septicSystem?->tankReadings()->latest('measured_at')->first();
        $recentReadings = $septicSystem?->tankReadings()->latest('measured_at')->limit(5)->get() ?? collect();

        return view('dashboard', compact('user', 'latestReading', 'recentReadings'));
    })->name('dashboard');

    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/resident-profile', [ResidentProfileController::class, 'edit'])->name('resident-profile.edit');
    Route::put('/resident-profile', [ResidentProfileController::class, 'update'])->name('resident-profile.update');
    Route::get('/septic-system', [SepticSystemController::class, 'edit'])->name('septic-system.edit');
    Route::put('/septic-system', [SepticSystemController::class, 'update'])->name('septic-system.update');
    Route::get('/maintenance-requests', [MaintenanceRequestController::class, 'index'])->name('maintenance-requests.index');
    Route::post('/maintenance-requests', [MaintenanceRequestController::class, 'store'])->name('maintenance-requests.store');
});

Route::middleware(['auth', 'hoa'])->prefix('hoa')->name('hoa.')->group(function () {
    Route::get('/users/pending', [HoaApprovalController::class, 'index'])->name('users.pending');
    Route::post('/users/{user}/approve', [HoaApprovalController::class, 'approve'])->name('users.approve');
    Route::post('/users/{user}/reject', [HoaApprovalController::class, 'reject'])->name('users.reject');
    Route::get('/maintenance-requests', [HoaMaintenanceRequestController::class, 'index'])->name('maintenance-requests.index');
    Route::patch('/maintenance-requests/{maintenanceRequest}/status', [HoaMaintenanceRequestController::class, 'updateStatus'])->name('maintenance-requests.update-status');
});
