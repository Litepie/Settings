<?php

use Illuminate\Support\Facades\Route;
use Litepie\Settings\Http\Controllers\SettingController;

Route::group([
    'prefix' => config('settings.api.prefix', 'api/settings'),
    'middleware' => config('settings.api.middleware', ['auth:sanctum']),
], function () {
    Route::get('/', [SettingController::class, 'index']);
    Route::post('/', [SettingController::class, 'store']);
    Route::post('/bulk', [SettingController::class, 'bulk']);
    Route::get('/{key}', [SettingController::class, 'show']);
    Route::put('/{key}', [SettingController::class, 'update']);
    Route::delete('/{key}', [SettingController::class, 'destroy']);
});
