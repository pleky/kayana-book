<?php

use App\Http\Controllers\Admin\BookController as AdminBookController;
use App\Http\Controllers\CatalogController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('katalog', [CatalogController::class, 'index'])->name('catalog.index');
Route::get('katalog/{book}', [CatalogController::class, 'show'])->name('catalog.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth', 'verified', 'can:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::resource('books', AdminBookController::class)->except('show');
    });

require __DIR__.'/settings.php';
