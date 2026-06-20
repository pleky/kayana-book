<?php

use App\Http\Controllers\Admin\BookController as AdminBookController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('katalog', [CatalogController::class, 'index'])->name('catalog.index');
Route::get('katalog/{book}', [CatalogController::class, 'show'])->name('catalog.show');

// Keranjang berbasis session — terbuka untuk tamu (ADR-007). Hanya checkout
// yang butuh login (keputusan produk #2).
Route::get('keranjang', [CartController::class, 'index'])->name('cart.index');
Route::post('keranjang/{book}', [CartController::class, 'store'])->name('cart.store');
Route::delete('keranjang/{book}', [CartController::class, 'destroy'])->name('cart.destroy');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('checkout', [CheckoutController::class, 'create'])->name('checkout.create');
    Route::post('checkout', [CheckoutController::class, 'store'])->name('checkout.store');

    Route::get('pesanan', [OrderController::class, 'index'])->name('orders.index');
    Route::get('pesanan/{order}', [OrderController::class, 'show'])->name('orders.show');
});

Route::middleware(['auth', 'verified', 'can:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::resource('books', AdminBookController::class)->except('show');
    });

require __DIR__.'/settings.php';
