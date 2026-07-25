<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'midtrans' => [
        'server_key' => env('MIDTRANS_SERVER_KEY'),
        'client_key' => env('MIDTRANS_CLIENT_KEY'),
        'merchant_id' => env('MIDTRANS_MERCHANT_ID'),
        'is_production' => (bool) env('MIDTRANS_IS_PRODUCTION', false),
        'base_url' => env('MIDTRANS_IS_PRODUCTION', false)
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com',
        'snap_url' => env('MIDTRANS_IS_PRODUCTION', false)
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js',
        'timeout' => (int) env('MIDTRANS_TIMEOUT', 10),
    ],

    'rajaongkir' => [
        'key' => env('RAJAONGKIR_KEY'),
        'base_url' => env('RAJAONGKIR_BASE_URL', 'https://rajaongkir.komerce.id/api/v1'),
        'origin_id' => env('RAJAONGKIR_ORIGIN_ID'),
        'couriers' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('RAJAONGKIR_COURIERS', 'jne,jnt,sicepat')),
        ))),
        'timeout' => (int) env('RAJAONGKIR_TIMEOUT', 5),
        // Stop calling the live API once this many real hits happen in a day
        // (account quota is 100/day) — see PRD-SHIPPING.md §6.5.
        'daily_limit' => (int) env('RAJAONGKIR_DAILY_LIMIT', 90),
        'cost_cache_days' => (int) env('RAJAONGKIR_COST_CACHE_DAYS', 21),
        'search_cache_days' => (int) env('RAJAONGKIR_SEARCH_CACHE_DAYS', 30),
    ],

];
