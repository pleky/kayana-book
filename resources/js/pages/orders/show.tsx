import { Head, Link } from '@inertiajs/react';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import SiteHeader from '@/components/catalog/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order, OrderStatus } from '@/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: 'Menunggu pembayaran',
    paid: 'Sudah dibayar',
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

type Bank = { bank: string; account_number: string; account_name: string };

export default function OrderShow({
    order,
    bank,
}: {
    order: Order;
    bank: Bank;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Head title={`Pesanan #${order.id}`} />
            <SiteHeader />

            <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
                <div className="flex items-center justify-between">
                    <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                        Pesanan #{order.id}
                    </h1>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                        {STATUS_LABEL[order.status]}
                    </Badge>
                </div>

                {order.status === 'pending' && (
                    <section className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                        <h2 className="font-medium">Instruksi pembayaran</h2>
                        <p className="text-sm text-muted-foreground">
                            Transfer tepat sebesar berikut ke rekening di bawah,
                            lalu konfirmasi ke penjual via WhatsApp.
                        </p>
                        <p className="text-2xl font-bold">
                            {rupiah.format(order.total)}
                        </p>
                        <dl className="text-sm">
                            <div className="flex gap-2">
                                <dt className="w-28 text-muted-foreground">
                                    Bank
                                </dt>
                                <dd>{bank.bank}</dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className="w-28 text-muted-foreground">
                                    No. Rekening
                                </dt>
                                <dd className="font-mono">
                                    {bank.account_number}
                                </dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className="w-28 text-muted-foreground">
                                    Atas nama
                                </dt>
                                <dd>{bank.account_name}</dd>
                            </div>
                        </dl>
                        {order.expires_at && (
                            <p className="text-xs text-muted-foreground">
                                Selesaikan sebelum{' '}
                                {new Date(order.expires_at).toLocaleString(
                                    'id-ID',
                                )}{' '}
                                atau pesanan otomatis dibatalkan.
                            </p>
                        )}
                    </section>
                )}

                {order.status === 'cancelled' && order.cancel_reason && (
                    <p className="rounded-xl border p-4 text-sm text-muted-foreground">
                        Dibatalkan ({order.cancel_reason}).
                    </p>
                )}

                <section className="rounded-xl border border-border bg-card">
                    <ul className="divide-y divide-border">
                        {order.items?.map((item) => (
                            <li
                                key={item.id}
                                className="flex justify-between gap-2 p-3 text-sm"
                            >
                                <span className="min-w-0 truncate">
                                    {item.title}
                                </span>
                                <span>{rupiah.format(item.price)}</span>
                            </li>
                        ))}
                    </ul>
                    <dl className="space-y-1 border-t p-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Subtotal</dt>
                            <dd>{rupiah.format(order.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">
                                Ongkir
                                {order.shipping_cost === 0 &&
                                    order.fulfillment === 'ship' &&
                                    ' (menunggu konfirmasi)'}
                            </dt>
                            <dd>{rupiah.format(order.shipping_cost)}</dd>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-semibold">
                            <dt>Total</dt>
                            <dd>{rupiah.format(order.total)}</dd>
                        </div>
                    </dl>
                </section>

                <div>
                    <Button variant="outline" asChild>
                        <Link href={OrderController.index()}>
                            ← Semua pesanan
                        </Link>
                    </Button>
                </div>
            </main>
        </div>
    );
}
