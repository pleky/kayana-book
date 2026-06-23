import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminCheckoutLinkController from '@/actions/App/Http/Controllers/Admin/CheckoutLinkController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

type PickBook = { id: number; title: string; price: number };

export default function CheckoutLinkCreate({ books }: { books: PickBook[] }) {
    const [search, setSearch] = useState('');
    const form = useForm<{
        label: string;
        book_ids: number[];
        shipping_mode: 'admin_set' | 'pickup';
        shipping_cost: number;
        weight_grams: string;
        recipient_name: string;
        recipient_phone: string;
        shipping_address: string;
        expires_at: string;
    }>({
        label: '',
        book_ids: [],
        shipping_mode: 'pickup',
        shipping_cost: 0,
        weight_grams: '',
        recipient_name: '',
        recipient_phone: '',
        shipping_address: '',
        expires_at: '',
    });

    const isShip = form.data.shipping_mode === 'admin_set';
    const filtered = books.filter((b) =>
        b.title.toLowerCase().includes(search.toLowerCase()),
    );

    const toggle = (id: number) => {
        form.setData(
            'book_ids',
            form.data.book_ids.includes(id)
                ? form.data.book_ids.filter((x) => x !== id)
                : [...form.data.book_ids, id],
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(AdminCheckoutLinkController.store().url);
    };

    return (
        <>
            <Head title="Buat Link Bayar" />

            <form
                onSubmit={submit}
                className="mx-auto w-full max-w-2xl space-y-5 p-4"
            >
                <Heading title="Buat Link Bayar" />

                <div className="space-y-1">
                    <Label htmlFor="label">Label (internal)</Label>
                    <Input
                        id="label"
                        value={form.data.label}
                        onChange={(e) => form.setData('label', e.target.value)}
                        placeholder="mis. Pesanan IG — Budi"
                    />
                    <InputError message={form.errors.label} />
                </div>

                {/* Book picker */}
                <div className="space-y-2">
                    <Label>
                        Pilih buku ({form.data.book_ids.length} terpilih)
                    </Label>
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari judul…"
                    />
                    <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                        {filtered.length === 0 && (
                            <p className="p-3 text-sm text-muted-foreground">
                                Tak ada buku tersedia.
                            </p>
                        )}
                        {filtered.map((book) => (
                            <label
                                key={book.id}
                                className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0 hover:bg-accent/50"
                            >
                                <input
                                    type="checkbox"
                                    checked={form.data.book_ids.includes(
                                        book.id,
                                    )}
                                    onChange={() => toggle(book.id)}
                                />
                                <span className="min-w-0 flex-1 truncate">
                                    {book.title}
                                </span>
                                <span className="text-muted-foreground">
                                    {rupiah.format(book.price)}
                                </span>
                            </label>
                        ))}
                    </div>
                    <InputError message={form.errors.book_ids} />
                </div>

                {/* Shipping mode */}
                <div className="space-y-2">
                    <Label>Pengiriman</Label>
                    <div className="flex gap-4 text-sm">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="shipping_mode"
                                checked={form.data.shipping_mode === 'pickup'}
                                onChange={() =>
                                    form.setData('shipping_mode', 'pickup')
                                }
                            />
                            Ambil di toko
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="shipping_mode"
                                checked={isShip}
                                onChange={() =>
                                    form.setData('shipping_mode', 'admin_set')
                                }
                            />
                            Kirim (ongkir diset admin)
                        </label>
                    </div>
                </div>

                {isShip && (
                    <div className="space-y-4 rounded-md border border-border p-4">
                        <div className="space-y-1">
                            <Label htmlFor="shipping_cost">Ongkir (Rp)</Label>
                            <Input
                                id="shipping_cost"
                                type="number"
                                min={0}
                                value={form.data.shipping_cost}
                                onChange={(e) =>
                                    form.setData(
                                        'shipping_cost',
                                        Number(e.target.value),
                                    )
                                }
                            />
                            <InputError message={form.errors.shipping_cost} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="recipient_name">
                                Nama penerima
                            </Label>
                            <Input
                                id="recipient_name"
                                value={form.data.recipient_name}
                                onChange={(e) =>
                                    form.setData(
                                        'recipient_name',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="recipient_phone">No. penerima</Label>
                            <Input
                                id="recipient_phone"
                                value={form.data.recipient_phone}
                                onChange={(e) =>
                                    form.setData(
                                        'recipient_phone',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="shipping_address">Alamat</Label>
                            <textarea
                                id="shipping_address"
                                value={form.data.shipping_address}
                                onChange={(e) =>
                                    form.setData(
                                        'shipping_address',
                                        e.target.value,
                                    )
                                }
                                rows={3}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="weight_grams">
                            Berat override (gram, opsional)
                        </Label>
                        <Input
                            id="weight_grams"
                            type="number"
                            min={0}
                            value={form.data.weight_grams}
                            onChange={(e) =>
                                form.setData('weight_grams', e.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="expires_at">
                            Kedaluwarsa (opsional)
                        </Label>
                        <Input
                            id="expires_at"
                            type="datetime-local"
                            value={form.data.expires_at}
                            onChange={(e) =>
                                form.setData('expires_at', e.target.value)
                            }
                        />
                        <InputError message={form.errors.expires_at} />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Menyimpan…' : 'Buat link'}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={AdminCheckoutLinkController.index()}>
                            Batal
                        </Link>
                    </Button>
                </div>
            </form>
        </>
    );
}

CheckoutLinkCreate.layout = {
    breadcrumbs: [
        { title: 'Link Bayar', href: AdminCheckoutLinkController.index() },
        { title: 'Buat', href: AdminCheckoutLinkController.create() },
    ],
};
