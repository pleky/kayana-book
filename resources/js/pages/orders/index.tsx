import { Head, Link } from '@inertiajs/react';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import SiteHeader from '@/components/catalog/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order, OrderStatus, Paginated } from '@/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: 'Menunggu bayar',
    paid: 'Diproses',
    shipped: 'Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
};

const STATUS_VARIANT: Record<
    OrderStatus,
    'default' | 'secondary' | 'outline' | 'destructive'
> = {
    pending: 'secondary',
    paid: 'default',
    shipped: 'default',
    completed: 'outline',
    cancelled: 'destructive',
};

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function Orders({ orders }: { orders: Paginated<Order> }) {
    return (
        <div className="min-h-screen bg-background">
            <Head title="Pesanan Saya" />
            <SiteHeader />

            <main className="mx-auto max-w-3xl px-4 py-8">
                <h1 className="mb-6 font-serif text-3xl font-semibold tracking-tight text-foreground">
                    Pesanan Saya
                </h1>

                {orders.data.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground">
                        Belum ada pesanan.
                    </p>
                ) : (
                    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                        {orders.data.map((order) => (
                            <li
                                key={order.id}
                                className="flex items-center justify-between gap-3 p-4"
                            >
                                <div>
                                    <p className="font-medium">
                                        Pesanan #{order.id}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {order.items_count ?? 0} buku ·{' '}
                                        {rupiah.format(order.total)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge
                                        variant={STATUS_VARIANT[order.status]}
                                    >
                                        {STATUS_LABEL[order.status]}
                                    </Badge>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link
                                            href={OrderController.show(
                                                order.id,
                                            )}
                                        >
                                            Detail
                                        </Link>
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}
