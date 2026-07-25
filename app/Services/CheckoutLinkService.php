<?php

namespace App\Services;

use App\Models\Book;
use App\Models\CheckoutLink;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutLinkService
{
    /**
     * Create a pay-by-link from the given validated data (keys: label, book_ids,
     * shipping_mode, shipping_cost, weight_grams, recipient_name, recipient_phone,
     * shipping_address, expires_at). Only books that are genuinely available and
     * not already behind another link are attached, and those books are hidden
     * from the public catalog.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): CheckoutLink
    {
        return DB::transaction(function () use ($data): CheckoutLink {
            $available = Book::whereIn('id', $data['book_ids'])
                ->where('status', 'available')
                ->where('is_unlisted', false)
                ->pluck('id')
                ->all();

            abort_if($available === [], 422, 'Buku terpilih tidak tersedia.');

            $link = CheckoutLink::create([
                'label' => $data['label'] ?? null,
                'token' => Str::random(40),
                'status' => 'active',
                'shipping_mode' => $data['shipping_mode'],
                'shipping_cost' => $data['shipping_mode'] === 'admin_set' ? (int) ($data['shipping_cost'] ?? 0) : 0,
                'weight_grams' => $data['weight_grams'] ?? null,
                'recipient_name' => $data['recipient_name'] ?? null,
                'recipient_phone' => $data['recipient_phone'] ?? null,
                'shipping_address' => $data['shipping_address'] ?? null,
                'expires_at' => $data['expires_at'] ?? null,
            ]);

            $link->books()->attach($available);
            Book::whereIn('id', $available)->update(['is_unlisted' => true]);

            return $link;
        });
    }

    /**
     * Revoke a link (no new checkouts) and return its books to the catalog.
     */
    public function revoke(CheckoutLink $link): void
    {
        DB::transaction(function () use ($link): void {
            $link->update(['status' => 'revoked']);
            $this->relistBooks($link);
        });
    }

    /**
     * Issue a fresh token; the old URL stops working immediately.
     */
    public function regenerate(CheckoutLink $link): void
    {
        $link->update(['token' => Str::random(40)]);
    }

    /**
     * Delete a link, relisting and detaching its books first.
     */
    public function delete(CheckoutLink $link): void
    {
        DB::transaction(function () use ($link): void {
            $this->relistBooks($link);
            $link->books()->detach();
            $link->delete();
        });
    }

    /**
     * Un-hide a link's still-available books so they reappear in the catalog.
     * Sold/reserved books are left as-is.
     */
    private function relistBooks(CheckoutLink $link): void
    {
        Book::whereIn('id', $link->books()->pluck('books.id'))
            ->where('status', 'available')
            ->update(['is_unlisted' => false]);
    }
}
