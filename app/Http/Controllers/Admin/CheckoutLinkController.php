<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\CheckoutLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutLinkController extends Controller
{
    public function index(): Response
    {
        $links = CheckoutLink::query()
            ->withCount('books')
            ->with('order:id,status,track_token')
            ->latest()
            ->paginate(20);

        return Inertia::render('admin/checkout-links/index', [
            'links' => $links,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/checkout-links/create', [
            'books' => Book::query()
                ->listed()
                ->orderBy('title')
                ->get(['id', 'title', 'price']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:255'],
            'book_ids' => ['required', 'array', 'min:1'],
            'book_ids.*' => ['integer', 'exists:books,id'],
            'shipping_mode' => ['required', 'in:admin_set,pickup'],
            'shipping_cost' => ['required_if:shipping_mode,admin_set', 'integer', 'min:0'],
            'weight_grams' => ['nullable', 'integer', 'min:0'],
            'recipient_name' => ['nullable', 'string', 'max:255'],
            'recipient_phone' => ['nullable', 'string', 'max:30'],
            'shipping_address' => ['nullable', 'string', 'max:1000'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);

        DB::transaction(function () use ($validated): void {
            // Only books that are genuinely available and not already in a link.
            $available = Book::whereIn('id', $validated['book_ids'])
                ->where('status', 'available')
                ->where('is_unlisted', false)
                ->pluck('id')
                ->all();

            abort_if($available === [], 422, 'Buku terpilih tidak tersedia.');

            $link = CheckoutLink::create([
                'label' => $validated['label'] ?? null,
                'token' => Str::random(40),
                'status' => 'active',
                'shipping_mode' => $validated['shipping_mode'],
                'shipping_cost' => $validated['shipping_mode'] === 'admin_set' ? (int) $validated['shipping_cost'] : 0,
                'weight_grams' => $validated['weight_grams'] ?? null,
                'recipient_name' => $validated['recipient_name'] ?? null,
                'recipient_phone' => $validated['recipient_phone'] ?? null,
                'shipping_address' => $validated['shipping_address'] ?? null,
                'expires_at' => $validated['expires_at'] ?? null,
            ]);

            $link->books()->attach($available);
            Book::whereIn('id', $available)->update(['is_unlisted' => true]);
        });

        return redirect()->route('admin.checkout-links.index')->with('success', 'Link bayar dibuat.');
    }

    /**
     * Revoke a link (no new checkouts) and return its books to the catalog.
     */
    public function revoke(CheckoutLink $checkoutLink): RedirectResponse
    {
        DB::transaction(function () use ($checkoutLink): void {
            $checkoutLink->update(['status' => 'revoked']);
            $this->relistBooks($checkoutLink);
        });

        return back()->with('success', 'Link direvoke.');
    }

    /**
     * Issue a fresh token (the old URL stops working immediately).
     */
    public function regenerate(CheckoutLink $checkoutLink): RedirectResponse
    {
        $checkoutLink->update(['token' => Str::random(40)]);

        return back()->with('success', 'Token diperbarui.');
    }

    public function destroy(CheckoutLink $checkoutLink): RedirectResponse
    {
        DB::transaction(function () use ($checkoutLink): void {
            $this->relistBooks($checkoutLink);
            $checkoutLink->books()->detach();
            $checkoutLink->delete();
        });

        return back()->with('success', 'Link dihapus.');
    }

    /**
     * Un-hide a link's still-available books so they reappear in the catalog.
     * Sold/reserved books are left as-is.
     */
    private function relistBooks(CheckoutLink $checkoutLink): void
    {
        Book::whereIn('id', $checkoutLink->books()->pluck('books.id'))
            ->where('status', 'available')
            ->update(['is_unlisted' => false]);
    }
}
