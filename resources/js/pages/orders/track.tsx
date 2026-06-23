import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PaymentController from '@/actions/App/Http/Controllers/PaymentController';
import SiteHeader from '@/components/catalog/site-header';
import OrderEventList from '@/components/orders/order-event-list';
import OrderStatusTimeline from '@/components/orders/order-status-timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order, OrderEvent, OrderStatus } from '@/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: 'Menunggu pembayaran',
    paid: 'Sedang diproses',
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

type Payment = {
    gateway_enabled: boolean;
    client_key: string;
    snap_url: string;
};

type SnapCallbacks = {
    onSuccess?: () => void;
    onPending?: () => void;
    onError?: () => void;
    onClose?: () => void;
};

declare global {
    interface Window {
        snap?: { pay: (token: string, callbacks: SnapCallbacks) => void };
    }
}

function cookie(name: string): string {
    return (
        document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1] ?? ''
    );
}

export default function OrderTrack({
    order,
    events,
    payment,
}: {
    order: Order;
    events: OrderEvent[];
    payment: Payment;
}) {
    const [loading, setLoading] = useState(false);
    const [awaiting, setAwaiting] = useState(false);
    const useGateway = payment.gateway_enabled;
    const isShip = order.fulfillment === 'ship';
    const awaitingOngkir = isShip && order.shipping_cost === 0;
    const token = order.track_token ?? '';

    useEffect(() => {
        if (!useGateway || order.status !== 'pending') {
            return;
        }
        if (document.querySelector('script[data-midtrans]')) {
            return;
        }
        const script = document.createElement('script');
        script.src = payment.snap_url;
        script.setAttribute('data-client-key', payment.client_key);
        script.setAttribute('data-midtrans', 'true');
        document.body.appendChild(script);
    }, [useGateway, order.status, payment.snap_url, payment.client_key]);

    useEffect(() => {
        if (!awaiting || order.status !== 'pending') {
            setAwaiting(false);

            return;
        }
        let ticks = 0;
        const timer = setInterval(() => {
            ticks += 1;
            router.reload({ only: ['order', 'events'] });
            if (ticks >= 20) {
                clearInterval(timer);
                setAwaiting(false);
            }
        }, 3000);

        return () => clearInterval(timer);
    }, [awaiting, order.status]);

    const pay = async () => {
        setLoading(true);
        try {
            const res = await fetch(PaymentController.payGuest(token).url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(cookie('XSRF-TOKEN')),
                },
            });

            if (!res.ok) {
                throw new Error('pay');
            }

            const { snap_token } = await res.json();
            const startPolling = () => {
                setLoading(false);
                setAwaiting(true);
            };
            window.snap?.pay(snap_token, {
                onSuccess: startPolling,
                onPending: startPolling,
                onClose: startPolling,
                onError: () => setLoading(false),
            });
        } catch {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title={`Lacak pesanan #${order.id}`} />
            <SiteHeader />

            <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
                <div className="flex items-center justify-between">
                    <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                        Pesanan #{order.id}
                    </h1>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                        {STATUS_LABEL[order.status]}
                    </Badge>
                </div>

                <section className="rounded-xl border border-border bg-card p-4">
                    <OrderStatusTimeline order={order} />
                </section>

                {order.status === 'pending' && (
                    <section className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                        <h2 className="font-medium">Pembayaran</h2>
                        <p className="text-2xl font-bold">
                            {rupiah.format(order.total)}
                        </p>

                        {awaitingOngkir ? (
                            <p className="text-sm text-muted-foreground">
                                Menunggu penjual mengonfirmasi ongkir.
                            </p>
                        ) : awaiting ? (
                            <p className="text-sm text-muted-foreground">
                                Menunggu konfirmasi pembayaran… halaman diperbarui
                                otomatis.
                            </p>
                        ) : useGateway ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Bayar aman via QRIS, Virtual Account, atau
                                    e-wallet. Status otomatis diperbarui.
                                </p>
                                <Button onClick={pay} disabled={loading}>
                                    {loading ? 'Memproses…' : 'Bayar sekarang'}
                                </Button>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Hubungi penjual untuk instruksi pembayaran.
                            </p>
                        )}

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

                {isShip && order.shipping_address && (
                    <section className="rounded-xl border border-border bg-card p-4 text-sm">
                        <h2 className="mb-1 font-medium text-foreground">
                            Pengiriman
                        </h2>
                        {order.recipient_name && (
                            <p>
                                {order.recipient_name} · {order.recipient_phone}
                            </p>
                        )}
                        <p className="whitespace-pre-line text-muted-foreground">
                            {order.shipping_address}
                        </p>
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
                                className="flex items-center gap-3 p-3 text-sm"
                            >
                                {item.cover_path ? (
                                    <img
                                        src={`/storage/${item.cover_path}`}
                                        alt={item.title}
                                        loading="lazy"
                                        className="h-12 w-9 shrink-0 rounded border border-border object-cover"
                                    />
                                ) : (
                                    <div className="h-12 w-9 shrink-0 rounded border border-border bg-muted" />
                                )}
                                <span className="min-w-0 flex-1 truncate">
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
                            <dt className="text-muted-foreground">Ongkir</dt>
                            <dd>{rupiah.format(order.shipping_cost)}</dd>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-semibold">
                            <dt>Total</dt>
                            <dd>{rupiah.format(order.total)}</dd>
                        </div>
                    </dl>
                </section>

                <OrderEventList events={events} />
            </main>
        </div>
    );
}
