import { Head, Link, router } from '@inertiajs/react';
import AdminOrderController from '@/actions/App/Http/Controllers/Admin/OrderController';
import Heading from '@/components/heading';
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

export default function AdminOrders({
    orders,
    filters,
}: {
    orders: Paginated<Order>;
    filters: { status?: string };
}) {
    return (
        <>
            <Head title="Pesanan Masuk" />

            <div className="w-full space-y-4 p-4">
                <Heading
                    title="Pesanan Masuk"
                    description={`${orders.total} pesanan`}
                />

                <select
                    value={filters.status ?? ''}
                    onChange={(e) =>
                        router.get(
                            AdminOrderController.index().url,
                            e.target.value ? { status: e.target.value } : {},
                            { preserveState: true },
                        )
                    }
                    className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                >
                    <option value="">Semua status</option>
                    <option value="pending">Menunggu bayar</option>
                    <option value="paid">Diproses</option>
                    <option value="shipped">Dikirim</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                </select>

                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="p-3 font-medium">#</th>
                                <th className="p-3 font-medium">Pelanggan</th>
                                <th className="p-3 font-medium">Buku</th>
                                <th className="p-3 font-medium">Total</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {orders.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="p-6 text-center text-muted-foreground"
                                    >
                                        Belum ada pesanan.
                                    </td>
                                </tr>
                            )}
                            {orders.data.map((order) => (
                                <tr
                                    key={order.id}
                                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                                >
                                    <td className="p-3">{order.id}</td>
                                    <td className="p-3">
                                        {order.customer_name}
                                        <div className="text-muted-foreground">
                                            {order.customer_phone}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        {order.items_count ?? 0}
                                    </td>
                                    <td className="p-3">
                                        {rupiah.format(order.total)}
                                    </td>
                                    <td className="p-3">
                                        <Badge
                                            variant={
                                                STATUS_VARIANT[order.status]
                                            }
                                        >
                                            {STATUS_LABEL[order.status]}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={AdminOrderController.show(
                                                    order.id,
                                                )}
                                            >
                                                Kelola
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {orders.last_page > 1 && (
                    <div className="flex flex-wrap gap-1">
                        {orders.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

AdminOrders.layout = {
    breadcrumbs: [
        { title: 'Pesanan Masuk', href: AdminOrderController.index() },
    ],
};
