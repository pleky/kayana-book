<?php

use App\Models\User;
use App\Models\UserAddress;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\patch;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

function addressPayload(array $overrides = []): array
{
    return array_merge([
        'label' => 'Rumah',
        'recipient_name' => 'Sari',
        'recipient_phone' => '08123456789',
        'address_line' => 'Jl. Melati 5, Denpasar',
        'postal_code' => '80113',
    ], $overrides);
}

it('requires login for the address page', function () {
    get(route('addresses.edit'))->assertRedirect(route('login'));
});

it('lets a user view their addresses', function () {
    actingAs(User::factory()->create());

    get(route('addresses.edit'))->assertOk();
});

it('makes the first address default automatically', function () {
    actingAs($user = User::factory()->create());

    post(route('addresses.store'), addressPayload())->assertRedirect();

    $address = $user->addresses()->firstOrFail();
    expect($address->is_default)->toBeTrue()
        ->and($address->label)->toBe('Rumah');
});

it('keeps a single default when a new default is added', function () {
    actingAs($user = User::factory()->create());
    $first = UserAddress::factory()->for($user)->default()->create();

    post(route('addresses.store'), addressPayload(['is_default' => true]))->assertRedirect();

    expect($first->refresh()->is_default)->toBeFalse()
        ->and($user->addresses()->where('is_default', true)->count())->toBe(1);
});

it('validates required fields', function () {
    actingAs(User::factory()->create());

    post(route('addresses.store'), [])
        ->assertSessionHasErrors(['label', 'recipient_name', 'recipient_phone', 'address_line']);
});

it('updates an owned address', function () {
    actingAs($user = User::factory()->create());
    $address = UserAddress::factory()->for($user)->create();

    put(route('addresses.update', $address), addressPayload(['label' => 'Kantor']))
        ->assertRedirect();

    expect($address->refresh()->label)->toBe('Kantor');
});

it('switches the default address', function () {
    actingAs($user = User::factory()->create());
    $a = UserAddress::factory()->for($user)->default()->create();
    $b = UserAddress::factory()->for($user)->create();

    patch(route('addresses.default', $b))->assertRedirect();

    expect($a->refresh()->is_default)->toBeFalse()
        ->and($b->refresh()->is_default)->toBeTrue();
});

it('promotes another address to default after deleting the default', function () {
    actingAs($user = User::factory()->create());
    $default = UserAddress::factory()->for($user)->default()->create();
    $other = UserAddress::factory()->for($user)->create();

    delete(route('addresses.destroy', $default))->assertRedirect();

    expect(UserAddress::find($default->id))->toBeNull()
        ->and($other->refresh()->is_default)->toBeTrue();
});

it('forbids touching another user\'s address', function () {
    actingAs(User::factory()->create());
    $foreign = UserAddress::factory()->create();

    put(route('addresses.update', $foreign), addressPayload())->assertNotFound();
    patch(route('addresses.default', $foreign))->assertNotFound();
    delete(route('addresses.destroy', $foreign))->assertNotFound();
});
