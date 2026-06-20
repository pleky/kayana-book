import { Form, Head, Link, router } from '@inertiajs/react';
import AdminOrderController from '@/actions/App/Http/Controllers/Admin/OrderController';
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

export default function AdminOrderShow({ order }: { order: Order }) {
    const confirmPost = (url: string, message: string, data = {}) => {
        if (confirm(message)) {
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
                    {order.status === 'paid' && (
                        <Button
                            onClick={() =>
                                confirmPost(
                                    AdminOrderController.complete(order.id).url,
                                    'Tandai pesanan selesai (diserahkan/dikirim)?',
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
