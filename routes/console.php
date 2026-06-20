<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Release stuck reservations so unique stock never locks forever (ADR-004).
Schedule::command('orders:release-expired')->everyFiveMinutes();
