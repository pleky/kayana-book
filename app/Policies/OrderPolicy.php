<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * View an order's detail page.
     */
    public function view(User $user, Order $order): bool
    {
        return $order->user_id === $user->id;
    }

    /**
     * Start payment for an order.
     */
    public function pay(User $user, Order $order): bool
    {
        return $order->user_id === $user->id;
    }

    /**
     * Confirm a shipped order as received.
     */
    public function confirmReceived(User $user, Order $order): bool
    {
        return $order->user_id === $user->id;
    }

    /**
     * Upload shipment-proof photos.
     */
    public function uploadProof(User $user, Order $order): bool
    {
        return $order->user_id === $user->id;
    }

    /**
     * Stream a private proof photo — the owner or any admin.
     */
    public function viewProof(User $user, Order $order): bool
    {
        return $order->user_id === $user->id || $user->can('admin');
    }
}
