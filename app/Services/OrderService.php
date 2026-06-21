<?php

namespace App\Services;

use App\Exceptions\CartConflictException;
use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use App\Models\UserAddress;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class OrderService
{
    /**
     * The reservation window before a pending order auto-cancels (ADR-004).
     */
    public const RESERVE_TTL_HOURS = 24;

    public function __construct(private readonly CartService $cart) {}

    /**
     * Reserve each cart book atomically, then create a pending order with
     * price/title snapshots. Totals are computed server-side from the database
     * rows, never trusting client input (ARCHITECTURE §4.1).
     *
     * Shipping cost starts at 0; the owner fills it in manually after checkout
     * (product decision #3), which recomputes the total.
     *
     * For `ship`, the chosen saved address is snapshotted onto the order so
     * history survives the user later editing or deleting it.
     *
     * @param  array{customer_name: string, customer_phone: string, fulfillment: string, user_address_id?: int|null}  $details
     *
     * @throws CartConflictException when a book was taken by someone else first.
     */
    public function createFromCart(User $user, array $details): Order
    {
        $ids = $this->cart->ids();

        abort_if($ids === [], 422, 'Keranjang kosong.');

        $address = ($details['fulfillment'] === 'ship' && ! empty($details['user_address_id']))
            ? UserAddress::where('user_id', $user->id)->find($details['user_address_id'])
            : null;

        return DB::transaction(function () use ($user, $details, $ids, $address): Order {
            foreach ($ids as $id) {
                $reserved = Book::where('id', $id)
                    ->where('status', 'available')
                    ->update(['status' => 'reserved']);

                if ($reserved === 0) {
                    $title = Book::whereKey($id)->value('title') ?? "ID {$id}";

                    throw new CartConflictException($title);
                }
            }

            /** @var Collection<int, Book> $books */
            $books = Book::whereIn('id', $ids)->get();

            $subtotal = (int) $books->sum('price');

            $order = Order::create([
                'user_id' => $user->id,
                'status' => 'pending',
                'channel' => 'online',
                'subtotal' => $subtotal,
                'shipping_cost' => 0,
                'total' => $subtotal,
                'customer_name' => $details['customer_name'],
                'customer_phone' => $details['customer_phone'],
                'fulfillment' => $details['fulfillment'],
                'recipient_name' => $address?->recipient_name,
                'recipient_phone' => $address?->recipient_phone,
                'shipping_address' => $address?->address_line,
                'shipping_postal_code' => $address?->postal_code,
                'shipping_destination_id' => $address?->destination_id,
                'shipping_destination_label' => $address?->destination_label,
                'payment_method' => 'transfer',
                'expires_at' => now()->addHours(self::RESERVE_TTL_HOURS),
            ]);

            $order->items()->createMany(
                $books->map(fn (Book $book): array => [
                    'book_id' => $book->id,
                    'title' => $book->title,
                    'price' => $book->price,
                ])->all(),
            );

            $this->cart->clear();

            return $order;
        });
    }

    /**
     * Confirm payment: order paid, its reserved books become sold.
     */
    public function markPaid(Order $order): void
    {
        DB::transaction(function () use ($order): void {
            Book::whereIn('id', $order->items()->pluck('book_id'))
                ->where('status', 'reserved')
                ->update(['status' => 'sold', 'sold_at' => now()]);

            $order->update([
                'status' => 'paid',
                'paid_at' => now(),
                'expires_at' => null,
            ]);
        });
    }

    /**
     * Mark a paid order as completed (handed over / shipped) — the operational
     * final state.
     */
    public function complete(Order $order): void
    {
        $order->update(['status' => 'completed']);
    }

    /**
     * Set the manually-quoted shipping cost and recompute the total
     * (product decision #3). Only meaningful before payment.
     */
    public function setShipping(Order $order, int $shippingCost): void
    {
        $order->update([
            'shipping_cost' => $shippingCost,
            'total' => $order->subtotal + $shippingCost,
        ]);
    }

    /**
     * Cancel an order and release its still-reserved books back to available.
     * Books already sold are left untouched.
     */
    public function cancel(Order $order, string $reason): void
    {
        DB::transaction(function () use ($order, $reason): void {
            Book::whereIn('id', $order->items()->pluck('book_id'))
                ->where('status', 'reserved')
                ->update(['status' => 'available']);

            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => $reason,
                'expires_at' => null,
            ]);
        });
    }

    /**
     * Release every pending order past its TTL (ADR-004). Returns the count
     * cancelled.
     */
    public function releaseExpired(): int
    {
        $expired = Order::where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->get();

        foreach ($expired as $order) {
            $this->cancel($order, 'expired');
        }

        return $expired->count();
    }
}
