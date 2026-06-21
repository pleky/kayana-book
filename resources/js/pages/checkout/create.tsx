import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import CheckoutController from '@/actions/App/Http/Controllers/CheckoutController';
import SiteHeader from '@/components/catalog/site-header';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit as editAddresses } from '@/routes/addresses';
import type { Auth, UserAddress } from '@/types';

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

type CheckoutItem = { id: number; title: string; price: number };

export default function Checkout({
    items,
    subtotal,
    addresses,
}: {
    items: CheckoutItem[];
    subtotal: number;
    addresses: UserAddress[];
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [fulfillment, setFulfillment] = useState<'pickup' | 'ship'>('pickup');
    const defaultAddressId =
        addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null;

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
                            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
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
                                <div className="grid grid-cols-2 gap-3">
                                    {(
                                        [
                                            ['pickup', 'Ambil di toko'],
                                            ['ship', 'Kirim'],
                                        ] as const
                                    ).map(([value, label]) => (
                                        <label
                                            key={value}
                                            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                                                fulfillment === value
                                                    ? 'border-primary bg-primary/5 text-foreground'
                                                    : 'border-border hover:bg-accent/40'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="fulfillment"
                                                value={value}
                                                checked={fulfillment === value}
                                                onChange={() =>
                                                    setFulfillment(value)
                                                }
                                                className="accent-primary"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.fulfillment} />
                            </div>

                            {fulfillment === 'ship' &&
                                (addresses.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-border p-4 text-sm">
                                        <p className="text-muted-foreground">
                                            Belum ada alamat tersimpan.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            asChild
                                        >
                                            <Link href={editAddresses()}>
                                                Tambah alamat
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>Alamat pengiriman</Label>
                                        <div className="space-y-2">
                                            {addresses.map((address) => (
                                                <label
                                                    key={address.id}
                                                    className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="user_address_id"
                                                        value={address.id}
                                                        defaultChecked={
                                                            address.id ===
                                                            defaultAddressId
                                                        }
                                                        required
                                                        className="mt-1 accent-primary"
                                                    />
                                                    <span className="min-w-0">
                                                        <span className="font-medium text-foreground">
                                                            {address.label}
                                                        </span>{' '}
                                                        —{' '}
                                                        {address.recipient_name}{' '}
                                                        ·{' '}
                                                        {
                                                            address.recipient_phone
                                                        }
                                                        <span className="block text-muted-foreground">
                                                            {
                                                                address.address_line
                                                            }
                                                            {address.postal_code
                                                                ? `, ${address.postal_code}`
                                                                : ''}
                                                        </span>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <InputError
                                            message={errors.user_address_id}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Ongkir dikonfirmasi penjual setelah
                                            pesanan masuk.
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={editAddresses()}>
                                                Kelola alamat
                                            </Link>
                                        </Button>
                                    </div>
                                ))}

                            <Button
                                type="submit"
                                size="lg"
                                disabled={processing}
                            >
                                {processing ? 'Memproses…' : 'Buat pesanan'}
                            </Button>
                        </>
                    )}
                </Form>

                <aside className="h-fit space-y-3 rounded-xl border border-border bg-card p-4 md:sticky md:top-20">
                    <h2 className="font-serif text-lg font-semibold">
                        Ringkasan
                    </h2>
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
