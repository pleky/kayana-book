<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

/**
 * Shipped ship-order owned by the given buyer.
 */
function shippedOrder(User $buyer): Order
{
    $book = Book::factory()->create(['status' => 'sold']);
    $order = Order::factory()->for($buyer)->create([
        'status' => 'shipped',
        'fulfillment' => 'ship',
        'subtotal' => 50000,
        'total' => 65000,
        'shipping_cost' => 15000,
        'shipping_courier' => 'jne',
        'shipping_service' => 'REG',
        'shipping_tracking_number' => 'JNE0099',
        'shipped_at' => now()->subDay(),
    ]);
    $order->items()->create(['book_id' => $book->id, 'title' => $book->title, 'price' => 50000]);

    return $order;
}

it('records audit events on order transitions', function () {
    $order = Order::factory()->create(['status' => 'pending', 'subtotal' => 50000, 'fulfillment' => 'ship']);

    app(OrderService::class)->setShipping($order, 15000);

    $event = $order->events()->where('type', 'ongkir_set')->first();
    expect($event)->not->toBeNull()
        ->and($event->meta['amount'])->toBe(15000);
});

it('confirms receipt without a proof', function () {
    $buyer = User::factory()->create();
    User::factory()->create(['is_admin' => true]);
    $order = shippedOrder($buyer);

    actingAs($buyer)
        ->post(route('orders.received', $order))
        ->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe('completed')
        ->and($order->received_at)->not->toBeNull()
        ->and($order->events()->where('type', 'received')->exists())->toBeTrue();
});

it('uploads shipment proofs partially up to the max', function () {
    Storage::fake('local');
    $buyer = User::factory()->create();
    $order = shippedOrder($buyer);

    actingAs($buyer)
        ->post(route('orders.proofs.store', $order), [
            'photos' => [
                UploadedFile::fake()->image('a.jpg'),
                UploadedFile::fake()->image('b.jpg'),
            ],
        ])
        ->assertRedirect();

    expect($order->refresh()->received_proof_paths)->toHaveCount(2);

    // Partial: add the third (still allowed).
    actingAs($buyer)
        ->post(route('orders.proofs.store', $order), [
            'photos' => [UploadedFile::fake()->image('c.jpg')],
        ])
        ->assertRedirect();

    $order->refresh();
    expect($order->received_proof_paths)->toHaveCount(3);
    foreach ($order->received_proof_paths as $path) {
        Storage::disk('local')->assertExists($path);
    }

    // Beyond the max → rejected.
    actingAs($buyer)
        ->post(route('orders.proofs.store', $order), [
            'photos' => [UploadedFile::fake()->image('d.jpg')],
        ])
        ->assertStatus(422);
});

it('rejects uploading more than the remaining slots at once', function () {
    Storage::fake('local');
    $buyer = User::factory()->create();
    $order = shippedOrder($buyer);

    actingAs($buyer)
        ->post(route('orders.proofs.store', $order), [
            'photos' => [
                UploadedFile::fake()->image('a.jpg'),
                UploadedFile::fake()->image('b.jpg'),
                UploadedFile::fake()->image('c.jpg'),
                UploadedFile::fake()->image('d.jpg'),
            ],
        ])
        ->assertSessionHasErrors('photos');
});

it('forbids uploading proof to another buyer order', function () {
    $order = shippedOrder(User::factory()->create());

    actingAs(User::factory()->create())
        ->post(route('orders.proofs.store', $order), [
            'photos' => [UploadedFile::fake()->image('a.jpg')],
        ])
        ->assertForbidden();
});

it('streams a proof by index to owner & admin but forbids others', function () {
    Storage::fake('local');
    $buyer = User::factory()->create();
    $admin = User::factory()->create(['is_admin' => true]);
    $order = shippedOrder($buyer);
    actingAs($buyer)->post(route('orders.proofs.store', $order), [
        'photos' => [UploadedFile::fake()->image('a.jpg')],
    ]);

    actingAs($buyer)->get(route('orders.proof', ['order' => $order, 'index' => 0]))->assertOk();
    actingAs($admin)->get(route('orders.proof', ['order' => $order, 'index' => 0]))->assertOk();
    actingAs(User::factory()->create())
        ->get(route('orders.proof', ['order' => $order, 'index' => 0]))
        ->assertForbidden();
    actingAs($buyer)
        ->get(route('orders.proof', ['order' => $order, 'index' => 5]))
        ->assertNotFound();
});
