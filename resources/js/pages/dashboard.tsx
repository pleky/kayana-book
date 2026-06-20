import { Head, Link } from '@inertiajs/react';
import AdminOrderController from '@/actions/App/Http/Controllers/Admin/OrderController';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { dashboard } from '@/routes';
import type { Order, OrderStatus } from '@/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: 'Menunggu bayar',
    paid: 'Dibayar',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
};

const STATUS_VARIANT: Record<
    OrderStatus,
    'default' | 'secondary' | 'outline' | 'destructive'
> = {
    pending: 'secondary',
    paid: 'default',
    completed: 'outline',
    cancelled: 'destructive',
};

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

type Metrics = {
    revenue_today: number;
    revenue_month: number;
    orders_pending: number;
    orders_paid: number;
    books_sold: number;
    books_available: number;
    recent_orders: Order[];
};

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{value}</p>
            </CardContent>
        </Card>
    );
}

export default function Dashboard({ metrics }: { metrics: Metrics | null }) {
    if (!metrics) {
        return (
            <>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-4 p-4">
                    <div className="relative min-h-[60vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat
                        label="Omzet hari ini"
                        value={rupiah.format(metrics.revenue_today)}
                    />
                    <Stat
                        label="Omzet bulan ini"
                        value={rupiah.format(metrics.revenue_month)}
                    />
                    <Stat
                        label="Perlu konfirmasi"
                        value={`${metrics.orders_pending} pesanan`}
                    />
                    <Stat
                        label="Stok tersedia"
                        value={`${metrics.books_available} buku`}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Stat
                        label="Buku terjual"
                        value={`${metrics.books_sold}`}
                    />
                    <Stat
                        label="Dibayar (belum selesai)"
                        value={`${metrics.orders_paid} pesanan`}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pesanan terbaru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {metrics.recent_orders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada pesanan.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {metrics.recent_orders.map((order) => (
                                    <li key={order.id}>
                                        <Link
                                            href={AdminOrderController.show(
                                                order.id,
                                            )}
                                            className="flex items-center justify-between gap-2 py-2 text-sm hover:underline"
                                        >
                                            <span>
                                                #{order.id} ·{' '}
                                                {order.customer_name}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                {rupiah.format(order.total)}
                                                <Badge
                                                    variant={
                                                        STATUS_VARIANT[
                                                            order.status
                                                        ]
                                                    }
                                                >
                                                    {STATUS_LABEL[order.status]}
                                                </Badge>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
