import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import PaymentController from '@/actions/App/Http/Controllers/PaymentController';
import SiteHeader from '@/components/catalog/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order, OrderStatus } from '@/types';

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

type Bank = { bank: string; account_number: string; account_name: string };

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

/** Read a cookie value (Laravel sets XSRF-TOKEN for POST requests). */
function cookie(name: string): string {
    return (
        document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1] ?? ''
    );
}

export default function OrderShow({
    order,
    bank,
    payment,
}: {
    order: Order;
    bank: Bank;
    payment: Payment;
}) {
    const [loading, setLoading] = useState(false);
    const [awaiting, setAwaiting] = useState(false);
    const useGateway = payment.gateway_enabled;

    // Ship orders whose ongkir the seller hasn't confirmed yet (cost still 0)
    // can't be paid — the total would be wrong. Gate payment until it's set.
    const awaitingOngkir =
        order.fulfillment === 'ship' && order.shipping_cost === 0;

    // Load the Snap script once when the gateway is enabled for a pending order.
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

    // The webhook is the source of truth and lands a moment after the popup
    // closes (async for QRIS/VA), so poll the order until it leaves `pending`.
    useEffect(() => {
        if (!awaiting || order.status !== 'pending') {
            setAwaiting(false);

            return;
        }

        let ticks = 0;
        const timer = setInterval(() => {
            ticks += 1;
            router.reload({ only: ['order'] });

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
            const res = await fetch(PaymentController.pay(order.id).url, {
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
                    <section className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                        <h2 className="font-medium">Pembayaran</h2>
                        <p className="text-2xl font-bold">
                            {rupiah.format(order.total)}
                        </p>

                        {awaitingOngkir ? (
                            <p className="text-sm text-muted-foreground">
                                Menunggu penjual mengonfirmasi ongkir. Setelah
                                ongkir ditetapkan, total final muncul di sini dan
                                kamu bisa langsung membayar.
                            </p>
                        ) : awaiting ? (
                            <p className="text-sm text-muted-foreground">
                                Menunggu konfirmasi pembayaran… halaman akan
                                diperbarui otomatis.
                            </p>
                        ) : useGateway ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Bayar aman via QRIS, Virtual Account, atau
                                    e-wallet. Status pesanan diperbarui otomatis
                                    setelah pembayaran berhasil.
                                </p>
                                <Button onClick={pay} disabled={loading}>
                                    {loading ? 'Memproses…' : 'Bayar sekarang'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Transfer tepat sebesar nominal di atas ke
                                    rekening berikut, lalu konfirmasi ke penjual
                                    via WhatsApp.
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
                            </>
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

                {order.status === 'paid' && (
                    <section className="rounded-xl border border-border bg-card p-4 text-sm">
                        <h2 className="font-medium text-foreground">
                            Pembayaran diterima
                        </h2>
                        <p className="mt-1 text-muted-foreground">
                            {order.fulfillment === 'ship'
                                ? 'Pesanan sedang disiapkan penjual dan akan segera dikirim. Nomor resi muncul di sini setelah dikirim.'
                                : 'Pesanan sedang disiapkan. Silakan ambil di toko sesuai kesepakatan.'}
                        </p>
                    </section>
                )}

                {order.status === 'shipped' && (
                    <section className="space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
                        <h2 className="font-medium text-foreground">
                            Pesanan dikirim
                        </h2>
                        {order.shipping_courier && (
                            <p className="text-muted-foreground">
                                Kurir:{' '}
                                <span className="uppercase">
                                    {order.shipping_courier}
                                </span>{' '}
                                {order.shipping_service}
                            </p>
                        )}
                        {order.shipping_tracking_number && (
                            <p>
                                No. resi:{' '}
                                <span className="font-mono font-medium">
                                    {order.shipping_tracking_number}
                                </span>
                            </p>
                        )}
                        <p className="text-muted-foreground">
                            Sudah terima barangnya? Konfirmasi untuk
                            menyelesaikan pesanan.
                        </p>
                        <Button
                            onClick={() => {
                                if (confirm('Konfirmasi pesanan sudah diterima?')) {
                                    router.post(
                                        OrderController.confirmReceived(
                                            order.id,
                                        ).url,
                                        {},
                                        { preserveScroll: true },
                                    );
                                }
                            }}
                        >
                            Pesanan diterima
                        </Button>
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
