<?php

namespace App\Services;

use App\Exceptions\CartConflictException;
use App\Models\Book;
use App\Models\Order;
use App\Models\User;
use App\Models\UserAddress;
use App\Notifications\OrderCompleted;
use App\Notifications\OrderPaid;
use App\Notifications\OrderReadyToPay;
use App\Notifications\OrderShipped;
use App\Services\Shipping\RajaOngkirService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification as NotificationFacade;

class OrderService
{
    /**
     * The reservation window before a pending order auto-cancels (ADR-004).
     */
    public const RESERVE_TTL_HOURS = 24;

    /**
     * How long a shipped order waits for the buyer to confirm receipt before it
     * is auto-completed by the scheduler.
     */
    public const AUTO_COMPLETE_DAYS = 7;

    public function __construct(
        private readonly CartService $cart,
        private readonly RajaOngkirService $rajaOngkir,
    ) {}

    /**
     * Total parcel weight (grams) for a set of books, falling back to the
     * configured default for any book without a weight.
     *
     * @param  Collection<int, Book>  $books
     */
    public function parcelWeightGrams(Collection $books): int
    {
        $default = (int) config('shipping.default_weight_grams');

        return (int) $books->sum(fn (Book $book): int => (int) ($book->weight_grams ?? $default));
    }

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
     * @param  array{customer_name: string, customer_phone: string, fulfillment: string, user_address_id?: int|null, shipping_courier?: string|null, shipping_service?: string|null}  $details
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
            $books = Book::whereIn('id', $ids)->with('primaryImage')->get();

            $subtotal = (int) $books->sum('price');

            $quote = $this->resolveQuote($books, $address, $details);

            $order = Order::create([
                'user_id' => $user->id,
                'status' => 'pending',
                'channel' => 'online',
                'subtotal' => $subtotal,
                'shipping_cost' => $quote['shipping_cost'],
                'total' => $subtotal + $quote['shipping_cost'],
                'customer_name' => $details['customer_name'],
                'customer_phone' => $details['customer_phone'],
                'fulfillment' => $details['fulfillment'],
                'recipient_name' => $address?->recipient_name,
                'recipient_phone' => $address?->recipient_phone,
                'shipping_address' => $address?->address_line,
                'shipping_postal_code' => $address?->postal_code,
                'shipping_destination_id' => $address?->destination_id,
                'shipping_destination_label' => $address?->destination_label,
                'shipping_courier' => $quote['shipping_courier'],
                'shipping_service' => $quote['shipping_service'],
                'shipping_etd' => $quote['shipping_etd'],
                'shipping_weight_grams' => $quote['shipping_weight_grams'],
                'payment_method' => 'transfer',
                'expires_at' => now()->addHours(self::RESERVE_TTL_HOURS),
            ]);

            $order->items()->createMany(
                $books->map(fn (Book $book): array => [
                    'book_id' => $book->id,
                    'title' => $book->title,
                    'cover_path' => $book->primaryImage->first()?->path,
                    'price' => $book->price,
                ])->all(),
            );

            $this->cart->clear();

            return $order;
        });
    }

    /**
     * Re-quote server-side and pick the customer's chosen courier + service so
     * the shipping cost is never trusted from the client. Falls back to a
     * 0 / cost-pending order when shipping isn't applicable or the quote is
     * unavailable (API down or daily budget exhausted) — the owner then sets
     * it manually.
     *
     * @param  Collection<int, Book>  $books
     * @param  array{fulfillment: string, shipping_courier?: string|null, shipping_service?: string|null}  $details
     * @return array{shipping_cost: int, shipping_courier: string|null, shipping_service: string|null, shipping_etd: string|null, shipping_weight_grams: int|null}
     */
    private function resolveQuote(Collection $books, ?UserAddress $address, array $details): array
    {
        $blank = [
            'shipping_cost' => 0,
            'shipping_courier' => null,
            'shipping_service' => null,
            'shipping_etd' => null,
            'shipping_weight_grams' => null,
        ];

        if ($details['fulfillment'] !== 'ship' || $address === null || empty($address->destination_id)) {
            return $blank;
        }

        $weight = $this->parcelWeightGrams($books);
        $courier = $details['shipping_courier'] ?? null;
        $service = $details['shipping_service'] ?? null;

        if (empty($courier) || empty($service)) {
            return [...$blank, 'shipping_weight_grams' => $weight];
        }

        $options = $this->rajaOngkir->calculateCost((int) $address->destination_id, $weight);

        /** @var array{courier: string, courier_name: string, service: string, description: string, cost: int, etd: string}|null $chosen */
        $chosen = collect($options ?? [])->first(
            fn (array $option): bool => $option['courier'] === $courier && $option['service'] === $service,
        );

        if ($chosen === null) {
            return [...$blank, 'shipping_weight_grams' => $weight];
        }

        return [
            'shipping_cost' => $chosen['cost'],
            'shipping_courier' => $chosen['courier'],
            'shipping_service' => $chosen['service'],
            'shipping_etd' => $chosen['etd'],
            'shipping_weight_grams' => $weight,
        ];
    }

    /**
     * Re-sync a pending order's item snapshots (price, title, cover) and total
     * from the current book records, so the buyer always pays the latest price
     * up until payment. No-op once the order has left `pending` — paid/completed
     * orders stay frozen. Returns whether anything changed.
     */
    public function syncPendingFromBooks(Order $order): bool
    {
        if ($order->status !== 'pending') {
            return false;
        }

        $order->loadMissing('items');

        $bookIds = $order->items->pluck('book_id')->filter()->all();

        if ($bookIds === []) {
            return false;
        }

        /** @var \Illuminate\Support\Collection<int, Book> $books */
        $books = Book::withTrashed()
            ->with('primaryImage')
            ->whereIn('id', $bookIds)
            ->get()
            ->keyBy('id');

        $changed = false;

        DB::transaction(function () use ($order, $books, &$changed): void {
            foreach ($order->items as $item) {
                $book = $item->book_id ? $books->get($item->book_id) : null;

                if ($book === null) {
                    continue; // book gone — keep the snapshot
                }

                $cover = $book->primaryImage->first()?->path;

                if ($item->price !== (int) $book->price
                    || $item->title !== $book->title
                    || $item->cover_path !== $cover) {
                    $item->update([
                        'price' => $book->price,
                        'title' => $book->title,
                        'cover_path' => $cover,
                    ]);
                    $changed = true;
                }
            }

            $subtotal = (int) $order->items()->sum('price');

            if ($order->subtotal !== $subtotal) {
                $changed = true;
            }

            $order->update([
                'subtotal' => $subtotal,
                'total' => $subtotal + $order->shipping_cost,
            ]);
        });

        return $changed;
    }

    /**
     * Read-only check: does a pending order have item snapshots that differ from
     * the current book records (price/title/cover)? Used to flag "updated" orders
     * on the list without mutating anything. Expects `items.book.primaryImage`
     * eager-loaded by the caller to avoid N+1.
     */
    public function pendingHasBookChanges(Order $order): bool
    {
        if ($order->status !== 'pending') {
            return false;
        }

        foreach ($order->items as $item) {
            $book = $item->book;

            if ($book === null) {
                continue;
            }

            $cover = $book->primaryImage->first()?->path;

            if ($item->price !== (int) $book->price
                || $item->title !== $book->title
                || $item->cover_path !== $cover) {
                return true;
            }
        }

        return false;
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

        $this->notifyAdmins(new OrderPaid($order));
    }

    /**
     * Seller marks a paid order as shipped, recording the courier tracking
     * number (resi). Notifies the buyer so they can track and later confirm
     * receipt.
     */
    public function markShipped(Order $order, ?string $trackingNumber): void
    {
        $order->update([
            'status' => 'shipped',
            'shipping_tracking_number' => $trackingNumber,
            'shipped_at' => now(),
        ]);

        $order->user?->notify(new OrderShipped($order));
    }

    /**
     * Confirm payment coming from the payment gateway webhook. Idempotent: a
     * notification may fire several times, so this is a no-op once the order has
     * left the `pending` state. Records the actual instrument used.
     */
    public function markPaidFromGateway(Order $order, string $channel, string $reference): void
    {
        if ($order->status !== 'pending') {
            return;
        }

        $order->update([
            'payment_gateway' => 'midtrans',
            'payment_channel' => $channel,
            'payment_reference' => $reference,
        ]);

        $this->markPaid($order);
    }

    /**
     * Mark a paid order as completed (handed over / shipped) — the operational
     * final state.
     */
    public function complete(Order $order): void
    {
        $order->update(['status' => 'completed']);

        $this->notifyAdmins(new OrderCompleted($order));
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

        if ($order->fulfillment === 'ship' && $order->status === 'pending') {
            $order->user?->notify(new OrderReadyToPay($order));
        }
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

    /**
     * Auto-complete shipped orders the buyer never confirmed, after the grace
     * window. Returns the count completed.
     */
    public function autoCompleteShipped(): int
    {
        $stale = Order::where('status', 'shipped')
            ->whereNotNull('shipped_at')
            ->where('shipped_at', '<', now()->subDays(self::AUTO_COMPLETE_DAYS))
            ->get();

        foreach ($stale as $order) {
            $this->complete($order);
        }

        return $stale->count();
    }

    /**
     * Notify every admin (seller) with the given notification.
     */
    private function notifyAdmins(Notification $notification): void
    {
        NotificationFacade::send(User::where('is_admin', true)->get(), $notification);
    }
}
