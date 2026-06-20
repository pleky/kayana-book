import { Form, Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import CheckoutController from '@/actions/App/Http/Controllers/CheckoutController';
import SiteHeader from '@/components/catalog/site-header';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Auth } from '@/types';

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

type CheckoutItem = { id: number; title: string; price: number };

export default function Checkout({
    items,
    subtotal,
}: {
    items: CheckoutItem[];
    subtotal: number;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [fulfillment, setFulfillment] = useState<'pickup' | 'ship'>('pickup');

    return (
        <div className="min-h-screen bg-background">
            <Head title="Checkout" />
            <SiteHeader />

            <main className="mx-auto grid max-w-4xl gap-6 p-4 md:grid-cols-[1fr_20rem]">
                <Form
                    {...CheckoutController.store.form()}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Data pemesan
                            </h1>

                            <div>
                                <Label htmlFor="customer_name">Nama</Label>
                                <Input
                                    id="customer_name"
                                    name="customer_name"
                                    defaultValue={auth.user.name}
                                    required
                                />
                                <InputError
                                    className="mt-1"
                                    message={errors.customer_name}
                                />
                            </div>

                            <div>
                                <Label htmlFor="customer_phone">
                                    No. HP / WhatsApp
                                </Label>
                                <Input
                                    id="customer_phone"
                                    name="customer_phone"
                                    placeholder="08xxxxxxxxxx"
                                    required
                                />
                                <InputError
                                    className="mt-1"
                                    message={errors.customer_phone}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Pengambilan</Label>
                                <div className="flex gap-4 text-sm">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="fulfillment"
                                            value="pickup"
                                            checked={fulfillment === 'pickup'}
                                            onChange={() =>
                                                setFulfillment('pickup')
                                            }
                                        />
                                        Ambil di toko
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="fulfillment"
                                            value="ship"
                                            checked={fulfillment === 'ship'}
                                            onChange={() =>
                                                setFulfillment('ship')
                                            }
                                        />
                                        Kirim
                                    </label>
                                </div>
                                <InputError message={errors.fulfillment} />
                            </div>

                            {fulfillment === 'ship' && (
                                <div>
                                    <Label htmlFor="shipping_address">
                                        Alamat pengiriman
                                    </Label>
                                    <textarea
                                        id="shipping_address"
                                        name="shipping_address"
                                        rows={3}
                                        className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                                    />
                                    <InputError
                                        className="mt-1"
                                        message={errors.shipping_address}
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Ongkir dihitung & dikonfirmasi penjual
                                        setelah pesanan masuk.
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                disabled={processing}
                            >
                                Buat pesanan
                            </Button>
                        </>
                    )}
                </Form>

                <aside className="h-fit space-y-3 rounded-xl border p-4">
                    <h2 className="font-medium">Ringkasan</h2>
                    <ul className="space-y-1 text-sm">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className="flex justify-between gap-2"
                            >
                                <span className="min-w-0 truncate">
                                    {item.title}
                                </span>
                                <span>{rupiah.format(item.price)}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                        <span>Subtotal</span>
                        <span>{rupiah.format(subtotal)}</span>
                    </div>
                </aside>
            </main>
        </div>
    );
}
