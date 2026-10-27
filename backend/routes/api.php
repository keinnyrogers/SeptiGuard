<?php

use App\Http\Controllers\AdminComplaintController;
use App\Http\Controllers\AdminNotificationController;
use App\Http\Controllers\AdminReportController;
use App\Http\Controllers\AdminResidentController;
use App\Http\Controllers\AdminResidentInformationChangeController;
use App\Http\Controllers\AdminTankController;
use App\Http\Controllers\ApiAuthController;
use App\Http\Controllers\ResidentAccountController;
use App\Http\Controllers\ResidentComplaintController;
use App\Http\Controllers\ResidentDeviceController;
use App\Http\Controllers\ResidentNotificationController;
use App\Http\Controllers\ResidentInformationChangeController;
use App\Http\Controllers\ResidentPredictionController;
use App\Http\Controllers\ResidentPushTokenController;
use App\Http\Controllers\ResidentTankController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\SensorReadingController;
use Illuminate\Support\Facades\Route;

Route::post('/sensor/readings', [SensorReadingController::class, 'store'])
    ->middleware('throttle:60,1')
    ->name('api.sensor-readings.store');

Route::post('/login', [ApiAuthController::class, 'login'])->name('api.login');
Route::post('/admin/login', [ApiAuthController::class, 'adminLogin'])->name('api.admin.login');
Route::post('/register', [ApiAuthController::class, 'register'])->name('api.register');
Route::post('/logout', [ApiAuthController::class, 'logout'])->name('api.logout');
Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])
    ->middleware('throttle:5,1')
    ->name('api.password.email');
Route::post('/reset-password', [PasswordResetController::class, 'reset'])
    ->middleware('throttle:5,1')
    ->name('api.password.update');

Route::middleware('api.token')->group(function () {
    Route::get('/resident/tank/latest', [ResidentTankController::class, 'latest'])->name('api.resident.tank.latest');
    Route::get('/resident/prediction', [ResidentPredictionController::class, 'show'])->name('api.resident.prediction.show');
    Route::post('/resident/tank/pair', [ResidentDeviceController::class, 'pair'])->name('api.resident.tank.pair');
    Route::get('/resident/complaints', [ResidentComplaintController::class, 'index'])->name('api.resident.complaints.index');
    Route::post('/resident/complaints', [ResidentComplaintController::class, 'store'])->name('api.resident.complaints.store');
    Route::get('/resident/complaints/{complaintId}/photo', [ResidentComplaintController::class, 'photo'])->name('api.resident.complaints.photo');
    Route::get('/resident/notifications', [ResidentNotificationController::class, 'index'])->name('api.resident.notifications.index');
    Route::post('/resident/notifications/read', [ResidentNotificationController::class, 'markRead'])->name('api.resident.notifications.read');
    Route::post('/resident/notifications/{notificationId}/read', [ResidentNotificationController::class, 'markOneRead'])->name('api.resident.notifications.read-one');
    Route::post('/resident/push/status', [ResidentPushTokenController::class, 'status'])->name('api.resident.push.status');
    Route::post('/resident/push/tokens', [ResidentPushTokenController::class, 'store'])->name('api.resident.push.tokens.store');
    Route::delete('/resident/push/tokens', [ResidentPushTokenController::class, 'destroy'])->name('api.resident.push.tokens.destroy');
    Route::get('/resident/account', [ResidentAccountController::class, 'show'])->name('api.resident.account.show');
    Route::post('/resident/profile/photo', [ResidentAccountController::class, 'uploadProfilePhoto'])->name('api.resident.profile.photo.upload');
    Route::get('/resident/profile/photo', [ResidentAccountController::class, 'profilePhoto'])->name('api.resident.profile.photo');
    Route::post('/resident/information-change-requests', [ResidentInformationChangeController::class, 'store'])->name('api.resident.information-change-requests.store');
    Route::put('/resident/password', [ResidentAccountController::class, 'changePassword'])->name('api.resident.password.update');
});

Route::middleware(['api.token', 'hoa'])->prefix('admin')->name('api.admin.')->group(function () {
    Route::get('/residents', [AdminResidentController::class, 'index'])->name('residents.index');
    Route::post('/residents', [AdminResidentController::class, 'store'])->name('residents.store');
    Route::get('/residents/information-change-requests', [AdminResidentInformationChangeController::class, 'index'])->name('residents.information-change-requests.index');
    Route::patch('/residents/information-change-requests/{informationChangeRequest}/review', [AdminResidentInformationChangeController::class, 'review'])->name('residents.information-change-requests.review');
    Route::get('/tanks', [AdminTankController::class, 'index'])->name('tanks.index');
    Route::post('/tanks/{septicSystem}/desludgings', [AdminTankController::class, 'recordDesludging'])->name('tanks.desludgings.store');
    Route::post('/tanks/{septicSystem}/dispatch', [AdminTankController::class, 'dispatchDesludging'])->name('tanks.dispatch');
    Route::get('/devices', [AdminTankController::class, 'devices'])->name('devices.index');
    Route::post('/devices', [AdminTankController::class, 'storeDevice'])->name('devices.store');
    Route::get('/complaints', [AdminComplaintController::class, 'index'])->name('complaints.index');
    Route::get('/complaints/{complaintId}/photo', [AdminComplaintController::class, 'photo'])->name('complaints.photo');
    Route::get('/notifications', [AdminNotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notificationKey}/read', [AdminNotificationController::class, 'markRead'])->name('notifications.read');
    Route::get('/reports', [AdminReportController::class, 'index'])->name('reports.index');
    Route::patch('/complaints/{complaint}/status', [AdminComplaintController::class, 'updateStatus'])->name('complaints.status');
    Route::patch('/residents/{user}/approval', [AdminResidentController::class, 'updateApproval'])->name('residents.approval');
    Route::patch('/residents/{user}/deactivate', [AdminResidentController::class, 'deactivate'])->name('residents.deactivate');
});
