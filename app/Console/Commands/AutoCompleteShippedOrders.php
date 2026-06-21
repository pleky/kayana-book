<?php

namespace App\Console\Commands;

use App\Services\OrderService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('orders:auto-complete-shipped')]
#[Description('Complete shipped orders the buyer never confirmed after the grace window.')]
class AutoCompleteShippedOrders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(OrderService $orders): int
    {
        $completed = $orders->autoCompleteShipped();

        $this->info("Auto-completed {$completed} shipped order(s).");

        return self::SUCCESS;
    }
}
