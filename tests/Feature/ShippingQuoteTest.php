<?php

use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use App\Models\UserAddress;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

beforeEach(function () {
    config()->set('services.rajaongkir.key', 'test-key');
    config()->set('services.rajaongkir.origin_id', 100);
    config()->set('services.rajaongkir.couriers', ['jne', 'jnt', 'sicepat']);
    config()->set('services.rajaongkir.daily_limit', 90);
});

function fakeCost(array $rows)
{
    return Http::response([
        'meta' => ['code' => 200, 'status' => 'success'],
        'data' => $rows,
    ]);
}

it('searches destinations and caches the result', function () {
    Http::fake([
        '*destination*' => Http::response([
            'meta' => ['code' => 200],
            'data' => [[
                'id' => 26027,
                'label' => 'DAUH PURI, DENPASAR BARAT, DENPASAR, BALI, 80113',
                'province_name' => 'BALI',
                'city_name' => 'DENPASAR',
                'district_name' => 'DENPASAR BARAT',
                'subdistrict_name' => 'DAUH PURI',
                'zip_code' => '80113',
            ]],
        ]),
    ]);

    actingAs(User::factory()->create());

    get(route('addresses.search', ['q' => 'denpasar']))
        ->assertOk()
        ->assertJsonPath('data.0.id', 26027)
        ->assertJsonPath('data.0.label', 'DAUH PURI, DENPASAR BARAT, DENPASAR, BALI, 80113');

    // Repeated query is served from cache — no second API hit.
    get(route('addresses.search', ['q' => 'denpasar']))->assertOk();

    Http::assertSentCount(1);
});

it('does not call the api for queries under 3 characters', function () {
    Http::fake();
    actingAs(User::factory()->create());

    get(route('addresses.search', ['q' => 'de']))
        ->assertOk()
        ->assertJsonPath('data', []);

    Http::assertNothingSent();
});

it('quotes ongkir for a shipping address', function () {
    Http::fake(['*calculate*' => fakeCost([
        ['name' => 'JNE', 'code' => 'jne', 'service' => 'REG', 'description' => 'Reguler', 'cost' => 30000, 'etd' => '2 day'],
    ])]);

    $user = User::factory()->create();
    $address = UserAddress::factory()->for($user)->create(['destination_id' => 26027]);
    $book = Book::factory()->create(['status' => 'available', 'weight_grams' => 500]);

    actingAs($user)
        ->withSession(['cart' => [$book->id]])
        ->get(route('checkout.quote', ['address_id' => $address->id]))
        ->assertOk()
        ->assertJsonPath('available', true)
        ->assertJsonPath('weight', 500)
        ->assertJsonPath('options.0.courier', 'jne')
        ->assertJsonPath('options.0.cost', 30000);
});

it('reports unavailable when the address has no destination', function () {
    Http::fake();
    $user = User::factory()->create();
    $address = UserAddress::factory()->for($user)->create(['destination_id' => null]);
    $book = Book::factory()->create(['status' => 'available']);

    actingAs($user)
        ->withSession(['cart' => [$book->id]])
        ->get(route('checkout.quote', ['address_id' => $address->id]))
        ->assertOk()
        ->assertJsonPath('available', false);

    Http::assertNothingSent();
});

it('sets shipping cost from a server-side re-quote and ignores client cost', function () {
    Http::fake(['*calculate*' => fakeCost([
        ['name' => 'JNE', 'code' => 'jne', 'service' => 'REG', 'description' => 'Reguler', 'cost' => 30000, 'etd' => '2 day'],
        ['name' => 'SiCepat', 'code' => 'sicepat', 'service' => 'REG', 'description' => 'Reguler', 'cost' => 27000, 'etd' => '4-6 day'],
    ])]);

    $user = User::factory()->create();
    $address = UserAddress::factory()->for($user)->create(['destination_id' => 26027]);
    $book = Book::factory()->create(['status' => 'available', 'price' => 50000, 'weight_grams' => 500]);

    actingAs($user)
        ->withSession(['cart' => [$book->id]])
        ->post(route('checkout.store'), [
            'customer_name' => 'Budi',
            'customer_phone' => '08123456789',
            'fulfillment' => 'ship',
            'user_address_id' => $address->id,
            'shipping_courier' => 'sicepat',
            'shipping_service' => 'REG',
            'shipping_cost' => 1, // client attempt to cheat — must be ignored
        ])
        ->assertRedirect();

    $order = Order::firstOrFail();

    expect($order->shipping_courier)->toBe('sicepat')
        ->and($order->shipping_service)->toBe('REG')
        ->and($order->shipping_cost)->toBe(27000)
        ->and($order->total)->toBe(77000)
        ->and($order->shipping_weight_grams)->toBe(500);
});

it('falls back to cost-pending when the api fails at checkout', function () {
    Http::fake(['*calculate*' => Http::response([], 500)]);

    $user = User::factory()->create();
    $address = UserAddress::factory()->for($user)->create(['destination_id' => 26027]);
    $book = Book::factory()->create(['status' => 'available', 'price' => 50000]);

    actingAs($user)
        ->withSession(['cart' => [$book->id]])
        ->post(route('checkout.store'), [
            'customer_name' => 'Budi',
            'customer_phone' => '08123456789',
            'fulfillment' => 'ship',
            'user_address_id' => $address->id,
            'shipping_courier' => 'jne',
            'shipping_service' => 'REG',
        ])
        ->assertRedirect();

    $order = Order::firstOrFail();

    expect($order->shipping_cost)->toBe(0)
        ->and($order->shipping_courier)->toBeNull()
        ->and($order->status)->toBe('pending');
});

it('stops calling the api once the daily budget is exhausted', function () {
    config()->set('services.rajaongkir.daily_limit', 0);
    Http::fake();

    $user = User::factory()->create();
    $address = UserAddress::factory()->for($user)->create(['destination_id' => 26027]);
    $book = Book::factory()->create(['status' => 'available']);

    actingAs($user)
        ->withSession(['cart' => [$book->id]])
        ->get(route('checkout.quote', ['address_id' => $address->id]))
        ->assertOk()
        ->assertJsonPath('available', false)
        ->assertJsonPath('reason', 'unavailable');

    Http::assertNothingSent();
});
