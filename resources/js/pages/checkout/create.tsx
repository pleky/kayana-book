import { Form, Head, Link, usePage } from '@inertiajs/react';
import { type ReactNode, useEffect, useState } from 'react';
import CheckoutController from '@/actions/App/Http/Controllers/CheckoutController';
import SiteHeader from '@/components/catalog/site-header';
import InputError from '@/components/input-error';
import { AddressForm } from '@/components/settings/address-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit as editAddresses } from '@/routes/addresses';
import { quote as quoteRoute } from '@/routes/checkout';
import type { Auth, UserAddress } from '@/types';

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

type CheckoutItem = { id: number; title: string; price: number };

type QuoteOption = {
    courier: string;
    courier_name: string;
    service: string;
    description: string;
    cost: number;
    etd: string;
};

type QuoteState = {
    status: 'idle' | 'loading' | 'ok' | 'unavailable';
    options: QuoteOption[];
};

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
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
        addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null,
    );
    const [addrOpen, setAddrOpen] = useState(false);
    const [quote, setQuote] = useState<QuoteState>({
        status: 'idle',
        options: [],
    });
    const [chosen, setChosen] = useState<QuoteOption | null>(null);

    // Sync selection when the address list changes (e.g. after adding the first
    // address inline) — the freshly added address becomes default and selected.
    useEffect(() => {
        if (addresses.some((a) => a.id === selectedAddressId)) {
            return;
        }

        setSelectedAddressId(
            addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null,
        );
    }, [addresses, selectedAddressId]);

    const selectedAddress =
        addresses.find((a) => a.id === selectedAddressId) ?? null;

    const resetQuote = () => {
        setQuote({ status: 'idle', options: [] });
        setChosen(null);
    };

    const checkOngkir = () => {
        if (!selectedAddressId) {
            return;
        }

        setQuote({ status: 'loading', options: [] });
        setChosen(null);
        fetch(quoteRoute({ query: { address_id: selectedAddressId } }).url, {
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((json) =>
                setQuote(
                    json.available
                        ? { status: 'ok', options: json.options }
                        : { status: 'unavailable', options: [] },
                ),
            )
            .catch(() => setQuote({ status: 'unavailable', options: [] }));
    };

    const shippingCost = chosen?.cost ?? 0;

    const addressDialog = (trigger: ReactNode) => (
        <Dialog open={addrOpen} onOpenChange={setAddrOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Tambah alamat</DialogTitle>
                </DialogHeader>
                <AddressForm
                    hiddenFields={{ redirect_to: 'checkout' }}
                    submitOptions={{
                        preserveState: true,
                        preserveScroll: true,
                    }}
                    onDone={() => setAddrOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );

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
                                                onChange={() => {
                                                    setFulfillment(value);
                                                    resetQuote();
                                                }}
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
                                        {addressDialog(
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                            >
                                                Tambah alamat
                                            </Button>,
                                        )}
                                        <InputError
                                            className="mt-2"
                                            message={errors.user_address_id}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Alamat pengiriman</Label>
                                            {addressDialog(
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    + Tambah alamat lain
                                                </Button>,
                                            )}
                                        </div>
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
                                                        checked={
                                                            selectedAddressId ===
                                                            address.id
                                                        }
                                                        onChange={() => {
                                                            setSelectedAddressId(
                                                                address.id,
                                                            );
                                                            resetQuote();
                                                        }}
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

                                        {/* Ongkir */}
                                        {selectedAddress &&
                                            !selectedAddress.destination_id && (
                                                <p className="text-xs text-muted-foreground">
                                                    Alamat ini belum punya
                                                    lokasi ongkir.{' '}
                                                    <Link
                                                        href={editAddresses()}
                                                        className="text-primary underline"
                                                    >
                                                        Lengkapi
                                                    </Link>{' '}
                                                    untuk cek ongkir, atau
                                                    lanjut (ongkir dikonfirmasi
                                                    penjual).
                                                </p>
                                            )}

                                        {selectedAddress?.destination_id && (
                                            <div className="space-y-2">
                                                {quote.status !== 'ok' && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={checkOngkir}
                                                        disabled={
                                                            quote.status ===
                                                            'loading'
                                                        }
                                                    >
                                                        {quote.status ===
                                                        'loading'
                                                            ? 'Mengecek…'
                                                            : 'Cek ongkir'}
                                                    </Button>
                                                )}

                                                {quote.status ===
                                                    'unavailable' && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Ongkir tidak bisa dicek
                                                        sekarang — pesanan tetap
                                                        bisa dibuat, ongkir
                                                        dikonfirmasi penjual.
                                                    </p>
                                                )}

                                                {quote.status === 'ok' && (
                                                    <div className="space-y-2">
                                                        {quote.options.map(
                                                            (option) => {
                                                                const id = `${option.courier}-${option.service}`;
                                                                const active =
                                                                    chosen?.courier ===
                                                                        option.courier &&
                                                                    chosen?.service ===
                                                                        option.service;

                                                                return (
                                                                    <label
                                                                        key={id}
                                                                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors ${
                                                                            active
                                                                                ? 'border-primary bg-primary/5'
                                                                                : 'border-border hover:bg-accent/40'
                                                                        }`}
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            <input
                                                                                type="radio"
                                                                                name="quote_option"
                                                                                checked={
                                                                                    active
                                                                                }
                                                                                onChange={() =>
                                                                                    setChosen(
                                                                                        option,
                                                                                    )
                                                                                }
                                                                                className="accent-primary"
                                                                            />
                                                                            <span>
                                                                                <span className="font-medium text-foreground uppercase">
                                                                                    {
                                                                                        option.courier
                                                                                    }{' '}
                                                                                    {
                                                                                        option.service
                                                                                    }
                                                                                </span>
                                                                                <span className="block text-xs text-muted-foreground">
                                                                                    {
                                                                                        option.description
                                                                                    }
                                                                                    {option.etd
                                                                                        ? ` · ${option.etd}`
                                                                                        : ''}
                                                                                </span>
                                                                            </span>
                                                                        </span>
                                                                        <span className="font-semibold text-primary">
                                                                            {rupiah.format(
                                                                                option.cost,
                                                                            )}
                                                                        </span>
                                                                    </label>
                                                                );
                                                            },
                                                        )}
                                                        <p className="text-xs text-muted-foreground">
                                                            Estimasi — ongkir
                                                            final dikonfirmasi
                                                            penjual.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {chosen && (
                                            <>
                                                <input
                                                    type="hidden"
                                                    name="shipping_courier"
                                                    value={chosen.courier}
                                                />
                                                <input
                                                    type="hidden"
                                                    name="shipping_service"
                                                    value={chosen.service}
                                                />
                                            </>
                                        )}
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
                    <div className="space-y-1 border-t pt-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Subtotal
                            </span>
                            <span>{rupiah.format(subtotal)}</span>
                        </div>
                        {chosen && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Ongkir (estimasi)
                                </span>
                                <span>{rupiah.format(shippingCost)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t pt-1 font-semibold">
                            <span>Total</span>
                            <span>
                                {rupiah.format(subtotal + shippingCost)}
                            </span>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}
