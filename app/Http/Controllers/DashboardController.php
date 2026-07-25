<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Statuses that count as realised revenue.
     *
     * @var list<string>
     */
    private const REVENUE_STATUSES = ['paid', 'completed'];

    public function index(Request $request): Response
    {
        return Inertia::render('dashboard', [
            'metrics' => $request->user()->is_admin ? $this->metrics() : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function metrics(): array
    {
        $paid = Order::whereIn('status', self::REVENUE_STATUSES);

        return [
            'revenue_today' => (int) (clone $paid)
                ->whereDate('paid_at', today())
                ->sum('total'),
            'revenue_month' => (int) (clone $paid)
                ->whereBetween('paid_at', [now()->startOfMonth(), now()->endOfMonth()])
                ->sum('total'),
            'orders_pending' => Order::where('status', 'pending')->count(),
            'orders_paid' => Order::where('status', 'paid')->count(),
            'books_sold' => Book::where('status', 'sold')->count(),
            'books_available' => Book::where('status', 'available')->count(),
            'recent_orders' => Order::with('user:id,name')
                ->withCount('items')
                ->latest()
                ->limit(8)
                ->get(),
        ];
    }
}
