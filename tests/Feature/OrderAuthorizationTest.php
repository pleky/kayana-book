<?php

use App\Models\Order;
use App\Models\User;

use function Pest\Laravel\actingAs;

it('lets the owner view their order', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create();

    actingAs($user)->get(route('orders.show', $order))->assertOk();
});

it('forbids a stranger from viewing the order', function () {
    $order = Order::factory()->create();

    actingAs(User::factory()->create())
        ->get(route('orders.show', $order))
        ->assertForbidden();
});

it('forbids a stranger from confirming receipt', function () {
    $order = Order::factory()->create(['status' => 'shipped', 'fulfillment' => 'ship']);

    actingAs(User::factory()->create())
        ->post(route('orders.received', $order))
        ->assertForbidden();
});

it('forbids a stranger from uploading proofs', function () {
    $order = Order::factory()->create(['status' => 'shipped', 'fulfillment' => 'ship']);

    actingAs(User::factory()->create())
        ->post(route('orders.proofs.store', $order))
        ->assertForbidden();
});

it('forbids a stranger from streaming a proof photo', function () {
    $order = Order::factory()->create();

    actingAs(User::factory()->create())
        ->get(route('orders.proof', ['order' => $order, 'index' => 0]))
        ->assertForbidden();
});

it('lets an admin past the gate to stream another user proof photo', function () {
    $order = Order::factory()->create();

    // Admin clears the policy; the missing file then yields 404, not 403.
    actingAs(User::factory()->create(['is_admin' => true]))
        ->get(route('orders.proof', ['order' => $order, 'index' => 0]))
        ->assertNotFound();
});
