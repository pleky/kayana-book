<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default parcel weight
    |--------------------------------------------------------------------------
    |
    | Fallback weight (grams) used for a book with no `weight_grams` set, when
    | computing an order's total parcel weight for shipping quotes.
    |
    */
    'default_weight_grams' => (int) env('SHIPPING_DEFAULT_WEIGHT_GRAMS', 300),
];
