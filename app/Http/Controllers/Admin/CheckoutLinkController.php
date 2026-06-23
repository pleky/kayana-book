<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCheckoutLinkRequest;
use App\Models\Book;
use App\Models\CheckoutLink;
use App\Services\CheckoutLinkService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutLinkController extends Controller
{
    public function __construct(private readonly CheckoutLinkService $links) {}

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

    public function store(StoreCheckoutLinkRequest $request): RedirectResponse
    {
        $this->links->create($request->validated());

        return redirect()->route('admin.checkout-links.index')->with('success', 'Link bayar dibuat.');
    }

    /**
     * Revoke a link (no new checkouts) and return its books to the catalog.
     */
    public function revoke(CheckoutLink $checkoutLink): RedirectResponse
    {
        $this->links->revoke($checkoutLink);

        return back()->with('success', 'Link direvoke.');
    }

    /**
     * Issue a fresh token (the old URL stops working immediately).
     */
    public function regenerate(CheckoutLink $checkoutLink): RedirectResponse
    {
        $this->links->regenerate($checkoutLink);

        return back()->with('success', 'Token diperbarui.');
    }

    public function destroy(CheckoutLink $checkoutLink): RedirectResponse
    {
        $this->links->delete($checkoutLink);

        return back()->with('success', 'Link dihapus.');
    }
}
