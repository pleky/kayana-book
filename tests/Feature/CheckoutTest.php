<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use App\Models\UserAddress;

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

it('requires a saved address when shipping', function () {
    $user = User::factory()->create();
    $book = Book::factory()->create(['status' => 'available']);

    actingAs($user)
        ->withSession(['cart' => [$book->id]])
        ->post(route('checkout.store'), [
            'customer_name' => 'Budi',
            'customer_phone' => '08123456789',
            'fulfillment' => 'ship',
        ])
        ->assertSessionHasErrors('user_address_id');

    expect($book->refresh()->status)->toBe('available');
});

it('snapshots the chosen address onto a shipping order', function () {
    $user = User::factory()->create();
    $address = UserAddress::factory()->for($user)->create([
        'recipient_name' => 'Sari',
        'recipient_phone' => '0811222333',
        'address_line' => 'Jl. Melati 5',
        'postal_code' => '80113',
    ]);
    $book = Book::factory()->create(['status' => 'available']);

    actingAs($user)
        ->withSession(['cart' => [$book->id]])
        ->post(route('checkout.store'), [
            'customer_name' => 'Budi',
            'customer_phone' => '08123456789',
            'fulfillment' => 'ship',
            'user_address_id' => $address->id,
        ])
        ->assertRedirect();

    $order = Order::firstOrFail();

    expect($order->fulfillment)->toBe('ship')
        ->and($order->recipient_name)->toBe('Sari')
        ->and($order->recipient_phone)->toBe('0811222333')
        ->and($order->shipping_address)->toBe('Jl. Melati 5')
        ->and($order->shipping_postal_code)->toBe('80113');
});

it('rejects an address belonging to another user', function () {
    $user = User::factory()->create();
    $otherAddress = UserAddress::factory()->create();
    $book = Book::factory()->create(['status' => 'available']);

    actingAs($user)
        ->withSession(['cart' => [$book->id]])
        ->post(route('checkout.store'), [
            'customer_name' => 'Budi',
            'customer_phone' => '08123456789',
            'fulfillment' => 'ship',
            'user_address_id' => $otherAddress->id,
        ])
        ->assertSessionHasErrors('user_address_id');
});
