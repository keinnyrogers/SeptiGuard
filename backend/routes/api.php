<?php

use App\Http\Controllers\ApiAuthController;
use App\Http\Controllers\SensorReadingController;
use Illuminate\Support\Facades\Route;

Route::post('/sensor/readings', [SensorReadingController::class, 'store'])
    ->middleware('throttle:60,1')
    ->name('api.sensor-readings.store');

Route::post('/login', [ApiAuthController::class, 'login'])->name('api.login');
Route::post('/register', [ApiAuthController::class, 'register'])->name('api.register');
Route::post('/logout', [ApiAuthController::class, 'logout'])->name('api.logout');
