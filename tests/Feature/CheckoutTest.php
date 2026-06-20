<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

it('requires login to checkout', function () {
    get(route('checkout.create'))->assertRedirect(route('login'));
    post(route('checkout.store'))->assertRedirect(route('login'));
});

it('reserves books and creates a pending order with snapshots', function () {
    $user = User::factory()->create();
    $a = Book::factory()->create(['status' => 'available', 'price' => 30000, 'title' => 'A']);
    $b = Book::factory()->create(['status' => 'available', 'price' => 45000, 'title' => 'B']);

    actingAs($user)
        ->withSession(['cart' => [$a->id, $b->id]])
        ->post(route('checkout.store'), [
            'customer_name' => 'Budi',
            'customer_phone' => '08123456789',
            'fulfillment' => 'pickup',
        ])
        ->assertRedirect();

    $order = Order::firstOrFail();

    expect($order->status)->toBe('pending')
        ->and($order->user_id)->toBe($user->id)
        ->and($order->subtotal)->toBe(75000)
        ->and($order->shipping_cost)->toBe(0)
        ->and($order->total)->toBe(75000)
        ->and($order->expires_at)->not->toBeNull()
        ->and($order->items)->toHaveCount(2);

    expect($a->refresh()->status)->toBe('reserved')
        ->and($b->refresh()->status)->toBe('reserved');

    // Snapshot title + price are stored on the items.
    expect($order->items->pluck('title')->sort()->values()->all())
        ->toBe(['A', 'B']);

    // Cart is emptied after a successful checkout.
    expect(session('cart', []))->toBe([]);
});

it('computes the total server-side and ignores client-sent prices', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create(['status' => 'available', 'price' => 50000]);

    actingAs($user)
        ->withSession(['cart' => [$book->id]])
        ->post(route('checkout.store'), [
            'customer_name' => 'Budi',
            'customer_phone' => '08123456789',
            'fulfillment' => 'pickup',
            'total' => 1,
            'subtotal' => 1,
        ]);

    expect(Order::firstOrFail()->total)->toBe(50000);
});

it('rolls back the whole checkout when one book was already taken', function () {
    $user = User::factory()->create();
    $free = Book::factory()->create(['status' => 'available', 'title' => 'Bebas']);
    $taken = Book::factory()->reserved()->create(['title' => 'Keburu']);

    actingAs($user)
        ->withSession(['cart' => [$free->id, $taken->id]])
        ->post(route('checkout.store'), [
            'customer_name' => 'Budi',
            'customer_phone' => '08123456789',
            'fulfillment' => 'pickup',
        ])
        ->assertRedirect(route('cart.index'))
        ->assertSessionHas('error');

    // No order, and the previously free book was released back to available.
    expect(Order::count())->toBe(0)
        ->and($free->refresh()->status)->toBe('available')
        ->and($taken->refresh()->status)->toBe('reserved');
});

it('requires a shipping address when shipping', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create(['status' => 'available']);

    actingAs($user)
        ->withSession(['cart' => [$book->id]])
        ->post(route('checkout.store'), [
            'customer_name' => 'Budi',
            'customer_phone' => '08123456789',
            'fulfillment' => 'ship',
        ])
        ->assertSessionHasErrors('shipping_address');

    expect($book->refresh()->status)->toBe('available');
});
