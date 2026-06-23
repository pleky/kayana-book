<?php

use App\Models\Book;
use App\Services\OrderService;
use Illuminate\Database\Eloquent\Collection;

function orderService(): OrderService
{
    return app(OrderService::class);
}

it('sums parcel weight from the books', function () {
    $books = new Collection([
        new Book(['weight_grams' => 300]),
        new Book(['weight_grams' => 250]),
    ]);

    expect(orderService()->parcelWeightGrams($books))->toBe(550);
});

it('falls back to the configured default weight for books without one', function () {
    config(['shipping.default_weight_grams' => 1000]);

    $books = new Collection([
        new Book(['weight_grams' => 300]),
        new Book(['weight_grams' => null]),
    ]);

    expect(orderService()->parcelWeightGrams($books))->toBe(1300);
});

it('returns zero weight for an empty book set', function () {
    expect(orderService()->parcelWeightGrams(new Collection))->toBe(0);
});

it('humanizes known payment channels', function (string $channel, string $label) {
    expect(OrderService::humanizePaymentChannel($channel))->toBe($label);
})->with([
    ['qris', 'QRIS'],
    ['gopay', 'GoPay'],
    ['bca_va', 'Virtual Account BCA'],
    ['transfer', 'Transfer Bank'],
    ['cash', 'Tunai'],
]);

it('falls back to a title-cased label for unknown channels', function () {
    expect(OrderService::humanizePaymentChannel('akulaku_paylater'))
        ->toBe('Akulaku Paylater');
});

it('handles a null payment channel', function () {
    expect(OrderService::humanizePaymentChannel(null))->toBe('');
});
