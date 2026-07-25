<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Offline store / brand info
    |--------------------------------------------------------------------------
    |
    | Surfaced on the public welcome page (store highlight, Instagram promo,
    | footer). Fill the STORE_* vars in your .env. Empty values are hidden
    | gracefully on the page.
    |
    */

    'name' => env('STORE_NAME', 'Kayana Book'),
    'tagline' => env('STORE_TAGLINE', 'Toko buku bekas & baru'),
    'address' => env('STORE_ADDRESS', ''),
    'hours' => env('STORE_HOURS', ''),
    'phone' => env('STORE_PHONE', ''),
    'whatsapp' => env('STORE_WHATSAPP', ''),
    'email' => env('STORE_EMAIL', ''),
    'instagram' => env('STORE_INSTAGRAM', ''),
    'maps_url' => env('STORE_MAPS_URL', ''),

    /*
     | Gallery of offline-store/event photos shown on the welcome page. Drop
     | images in public/images/gallery/ and list their public paths here.
     | An empty list hides the gallery section.
     */
    'gallery' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env(
            'STORE_GALLERY',
            'images/gallery/1.jpg,images/gallery/2.jpg,images/gallery/3.jpg,images/gallery/4.jpg,images/gallery/5.jpg,images/gallery/6.jpg',
        )),
    ))),

];
