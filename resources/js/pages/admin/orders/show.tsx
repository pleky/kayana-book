import { Form, Head, Link, router } from '@inertiajs/react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import AdminBookController from '@/actions/App/Http/Controllers/Admin/BookController';
import AdminOrderController from '@/actions/App/Http/Controllers/Admin/OrderController';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import { useConfirm } from '@/components/confirm-dialog';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import OrderEventList from '@/components/orders/order-event-list';
import OrderStatusTimeline from '@/components/orders/order-status-timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rupiah } from '@/lib/format';
import {
    ORDER_STATUS_LABEL as STATUS_LABEL,
    ORDER_STATUS_VARIANT as STATUS_VARIANT,
} from '@/lib/order-status';
import type { Order, OrderEvent } from '@/types';

const PAYMENT_LABEL: Record<string, string> = {
    qris: 'QRIS',
    gopay: 'GoPay',
    shopeepay: 'ShopeePay',
    dana: 'DANA',
    bank_transfer: 'Transfer Bank',
    bca_va: 'Virtual Account BCA',
    bni_va: 'Virtual Account BNI',
    bri_va: 'Virtual Account BRI',
    permata_va: 'Virtual Account Permata',
    echannel: 'Mandiri Bill',
    credit_card: 'Kartu Kredit',
    cstore: 'Gerai Retail',
    transfer: 'Transfer Bank',
    cash: 'Tunai',
};

const humanize = (code: string | null) =>
    code
        ? (PAYMENT_LABEL[code] ??
          code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
        : '—';

const fmt = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

/** wa.me deep-link to nudge the buyer with the current status. */
function waLink(order: Order): string {
    const phone = order.customer_phone
        .replace(/[^0-9]/g, '')
        .replace(/^0/, '62');
    const lines: Record<string, string> = {
        pending: `Halo ${order.customer_name}, pesanan #${order.id} menunggu pembayaran.`,
        paid: `Halo ${order.customer_name}, pembayaran pesanan #${order.id} sudah kami terima dan sedang diproses.`,
        shipped: `Halo ${order.customer_name}, pesanan #${order.id} sudah dikirim${order.shipping_tracking_number ? `, resi ${order.shipping_tracking_number}` : ''}.`,
        completed: `Halo ${order.customer_name}, terima kasih! Pesanan #${order.id} selesai.`,
        cancelled: `Halo ${order.customer_name}, pesanan #${order.id} dibatalkan.`,
    };

    return `https://wa.me/${phone}?text=${encodeURIComponent(lines[order.status] ?? '')}`;
}

export default function AdminOrderShow({
    order,
    events,
    proofCount,
}: {
    order: Order;
    events: OrderEvent[];
    proofCount: number;
    maxProofs: number;
}) {
    const confirm = useConfirm();
    const [copied, setCopied] = useState(false);

    const confirmPost = async (url: string, message: string, data = {}) => {
        if (await confirm({ description: message })) {
            router.post(url, data, { preserveScroll: true });
        }
    };

    const copyResi = async () => {
        const resi = order.shipping_tracking_number;

        if (!resi) {
            return;
        }

        try {
            await navigator.clipboard.writeText(resi);
            setCopied(true);
            toast.success('Resi disalin');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Gagal menyalin');
        }
    };

    return (
        <>
            <Head title={`Pesanan #${order.id}`} />

            <div className="mx-auto w-full max-w-3xl space-y-5 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title={`Pesanan #${order.id}`}
                        description={`${order.customer_name} · ${order.customer_phone}`}
                    />
                    <Badge variant={STATUS_VARIANT[order.status]}>
                        {STATUS_LABEL[order.status]}
                    </Badge>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <OrderStatusTimeline order={order} />
                    </CardContent>
                </Card>

                {/* Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="divide-y">
                            {order.items?.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-center gap-3 py-2 text-sm"
                                >
                                    {item.cover_path ? (
                                        <img
                                            src={`/storage/${item.cover_path}`}
                                            alt={item.title}
                                            className="h-12 w-9 shrink-0 rounded border border-border object-cover"
                                        />
                                    ) : (
                                        <div className="h-12 w-9 shrink-0 rounded border border-border bg-muted" />
                                    )}
                                    <span className="min-w-0 flex-1 truncate">
                                        {item.book ? (
                                            <Link
                                                href={AdminBookController.edit(
                                                    item.book.slug,
                                                )}
                                                className="inline-flex items-center gap-1 text-primary hover:underline"
                                            >
                                                {item.title}
                                                <ExternalLink className="size-3" />
                                            </Link>
                                        ) : (
                                            item.title
                                        )}
                                    </span>
                                    <span>{rupiah.format(item.price)}</span>
                                </li>
                            ))}
                        </ul>
                        <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                    Subtotal
                                </dt>
                                <dd>{rupiah.format(order.subtotal)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">
                                    Ongkir
                                </dt>
                                <dd>{rupiah.format(order.shipping_cost)}</dd>
                            </div>
                            <div className="flex justify-between border-t pt-1 font-semibold">
                                <dt>Total</dt>
                                <dd>{rupiah.format(order.total)}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Customer & payment */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pembeli & Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                            <p className="text-muted-foreground">Pembeli</p>
                            <p>{order.user?.name ?? order.customer_name}</p>
                            {order.user?.email && (
                                <a
                                    href={`mailto:${order.user.email}`}
                                    className="text-primary hover:underline"
                                >
                                    {order.user.email}
                                </a>
                            )}
                        </div>
                        <div>
                            <p className="text-muted-foreground">Pembayaran</p>
                            <p>
                                {humanize(
                                    order.payment_channel ??
                                        order.payment_method,
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Dibayar: {fmt(order.paid_at)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Shipping */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pengiriman</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p>
                            {order.fulfillment === 'ship'
                                ? 'Kirim'
                                : 'Ambil di toko'}
                        </p>
                        {order.recipient_name && (
                            <p>
                                Penerima: {order.recipient_name} ·{' '}
                                {order.recipient_phone}
                            </p>
                        )}
                        {order.shipping_address && (
                            <p className="whitespace-pre-line text-muted-foreground">
                                {order.shipping_address}
                            </p>
                        )}

                        {order.status === 'pending' &&
                            order.fulfillment === 'ship' && (
                                <Form
                                    {...AdminOrderController.update.form(
                                        order.id,
                                    )}
                                    options={{ preserveScroll: true }}
                                    className="flex items-end gap-2"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="flex-1">
                                                <Label htmlFor="shipping_cost">
                                                    Ongkir (Rp)
                                                </Label>
                                                <Input
                                                    id="shipping_cost"
                                                    name="shipping_cost"
                                                    type="number"
                                                    min={0}
                                                    defaultValue={
                                                        order.shipping_cost
                                                    }
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={
                                                        errors.shipping_cost
                                                    }
                                                />
                                            </div>
                                            <Button
                                                variant="secondary"
                                                disabled={processing}
                                            >
                                                Set ongkir
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            )}

                        {order.status === 'paid' &&
                            order.fulfillment === 'ship' && (
                                <Form
                                    {...AdminOrderController.ship.form(
                                        order.id,
                                    )}
                                    options={{ preserveScroll: true }}
                                    className="flex items-end gap-2"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="flex-1">
                                                <Label htmlFor="tracking_number">
                                                    No. resi
                                                </Label>
                                                <Input
                                                    id="tracking_number"
                                                    name="tracking_number"
                                                    placeholder="mis. JNE0012345678"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={
                                                        errors.tracking_number
                                                    }
                                                />
                                            </div>
                                            <Button disabled={processing}>
                                                Tandai dikirim
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            )}

                        {order.shipping_tracking_number && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                    Resi:
                                </span>
                                <code className="rounded bg-muted px-2 py-1 font-mono">
                                    {order.shipping_tracking_number}
                                </code>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={copyResi}
                                    aria-label="Salin resi"
                                >
                                    {copied ? (
                                        <Check className="size-3.5" />
                                    ) : (
                                        <Copy className="size-3.5" />
                                    )}
                                    Salin
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Proof gallery */}
                {proofCount > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Bukti pengiriman</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {Array.from({ length: proofCount }).map((_, i) => (
                                <a
                                    key={i}
                                    href={
                                        OrderController.proof({
                                            order: order.id,
                                            index: i,
                                        }).url
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={
                                            OrderController.proof({
                                                order: order.id,
                                                index: i,
                                            }).url
                                        }
                                        alt={`Bukti ${i + 1}`}
                                        className="size-24 rounded-lg border border-border object-cover"
                                    />
                                </a>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    {order.status === 'pending' && (
                        <Button
                            onClick={() =>
                                confirmPost(
                                    AdminOrderController.pay(order.id).url,
                                    'Tandai pesanan ini sudah dibayar?',
                                )
                            }
                        >
                            Tandai lunas
                        </Button>
                    )}
                    {((order.status === 'paid' &&
                        order.fulfillment === 'pickup') ||
                        order.status === 'shipped') && (
                        <Button
                            onClick={() =>
                                confirmPost(
                                    AdminOrderController.complete(order.id).url,
                                    'Tandai pesanan selesai?',
                                )
                            }
                        >
                            Tandai selesai
                        </Button>
                    )}
                    {order.status !== 'completed' &&
                        order.status !== 'cancelled' && (
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    confirmPost(
                                        AdminOrderController.cancel(order.id)
                                            .url,
                                        'Batalkan pesanan ini? Buku yang masih reserved akan dilepas.',
                                    )
                                }
                            >
                                Batalkan
                            </Button>
                        )}
                    {order.status !== 'cancelled' && (
                        <Button variant="outline" asChild>
                            <a
                                href={waLink(order)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Kabari via WA
                            </a>
                        </Button>
                    )}
                    <Button variant="outline" asChild>
                        <Link href={AdminOrderController.index()}>Kembali</Link>
                    </Button>
                </div>

                {/* History */}
                <OrderEventList events={events} />
            </div>
        </>
    );
}

AdminOrderShow.layout = {
    breadcrumbs: [
        { title: 'Pesanan Masuk', href: AdminOrderController.index() },
    ],
};
