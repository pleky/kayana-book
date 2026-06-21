import { Form, Head, Link, router } from '@inertiajs/react';
import AdminOrderController from '@/actions/App/Http/Controllers/Admin/OrderController';
import { useConfirm } from '@/components/confirm-dialog';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Order, OrderStatus } from '@/types';

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

/** Build a wa.me deep-link to nudge the buyer with the current status. */
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

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function AdminOrderShow({ order }: { order: Order }) {
    const confirm = useConfirm();

    const confirmPost = async (url: string, message: string, data = {}) => {
        if (await confirm({ description: message })) {
            router.post(url, data, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={`Pesanan #${order.id}`} />

            <div className="mx-auto w-full max-w-3xl space-y-6 p-4">
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
                    <CardHeader>
                        <CardTitle>Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="divide-y">
                            {order.items?.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex justify-between gap-2 py-2 text-sm"
                                >
                                    <span className="min-w-0 truncate">
                                        {item.title}
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
                                    {...AdminOrderController.ship.form(order.id)}
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
                            <p>
                                No. resi:{' '}
                                <span className="font-mono">
                                    {order.shipping_tracking_number}
                                </span>
                            </p>
                        )}
                    </CardContent>
                </Card>

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
            </div>
        </>
    );
}

AdminOrderShow.layout = {
    breadcrumbs: [
        { title: 'Pesanan Masuk', href: AdminOrderController.index() },
    ],
};
