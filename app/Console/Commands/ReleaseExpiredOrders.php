<?php

namespace App\Console\Commands;

use App\Services\OrderService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('orders:release-expired')]
#[Description('Cancel pending orders past their reservation TTL and release their books (ADR-004).')]
class ReleaseExpiredOrders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(OrderService $orders): int
    {
        $released = $orders->releaseExpired();

        $this->info("Released {$released} expired order(s).");

        return self::SUCCESS;
    }
}
