<?php

use App\Http\Controllers\SensorReadingController;
use Illuminate\Support\Facades\Route;

Route::post('/sensor/readings', [SensorReadingController::class, 'store'])
    ->middleware('throttle:60,1')
    ->name('api.sensor-readings.store');
