<?php

use App\Http\Controllers\Settings\AddressController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::get('settings/addresses', [AddressController::class, 'edit'])->name('addresses.edit');
    Route::post('settings/addresses', [AddressController::class, 'store'])->name('addresses.store');
    Route::put('settings/addresses/{address}', [AddressController::class, 'update'])->name('addresses.update');
    Route::patch('settings/addresses/{address}/default', [AddressController::class, 'setDefault'])->name('addresses.default');
    Route::delete('settings/addresses/{address}', [AddressController::class, 'destroy'])->name('addresses.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});
