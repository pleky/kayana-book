import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import CheckoutLinkController from '@/actions/App/Http/Controllers/CheckoutLinkController';
import SiteHeader from '@/components/catalog/site-header';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rupiah } from '@/lib/format';

type LinkBook = {
    id: number;
    title: string;
    price: number;
    cover_path: string | null;
};

type LinkData = {
    token: string;
    label: string | null;
    shipping_mode: 'admin_set' | 'pickup';
    shipping_cost: number;
    subtotal: number;
    total: number;
    recipient_name: string | null;
    shipping_address: string | null;
    books: LinkBook[];
};

export default function CheckoutLinkShow({ link }: { link: LinkData }) {
    const { props } = usePage<{ flash?: { error?: string } }>();
    const form = useForm({ customer_name: '', customer_phone: '' });

    useEffect(() => {
        if (props.flash?.error) {
            toast.error(props.flash.error);
        }
    }, [props.flash?.error]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(CheckoutLinkController.store(link.token).url);
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title={link.label ?? 'Checkout'} />
            <SiteHeader />

            <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
                <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                    {link.label ?? 'Pesanan siap bayar'}
                </h1>

                <section className="rounded-xl border border-border bg-card">
                    <ul className="divide-y divide-border">
                        {link.books.map((book) => (
                            <li
                                key={book.id}
                                className="flex items-center gap-3 p-3 text-sm"
                            >
                                {book.cover_path ? (
                                    <img
                                        src={`/storage/${book.cover_path}`}
                                        alt={book.title}
                                        loading="lazy"
                                        className="h-14 w-10 shrink-0 rounded border border-border object-cover"
                                    />
                                ) : (
                                    <div className="h-14 w-10 shrink-0 rounded border border-border bg-muted" />
                                )}
                                <span className="min-w-0 flex-1 truncate">
                                    {book.title}
                                </span>
                                <span>{rupiah.format(book.price)}</span>
                            </li>
                        ))}
                    </ul>
                    <dl className="space-y-1 border-t p-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">Subtotal</dt>
                            <dd>{rupiah.format(link.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">
                                {link.shipping_mode === 'pickup'
                                    ? 'Pengambilan'
                                    : 'Ongkir'}
                            </dt>
                            <dd>
                                {link.shipping_mode === 'pickup'
                                    ? 'Ambil di toko'
                                    : rupiah.format(link.shipping_cost)}
                            </dd>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-semibold">
                            <dt>Total</dt>
                            <dd>{rupiah.format(link.total)}</dd>
                        </div>
                    </dl>
                </section>

                {link.shipping_mode === 'admin_set' &&
                    link.shipping_address && (
                        <section className="rounded-xl border border-border bg-card p-4 text-sm">
                            <h2 className="mb-1 font-medium text-foreground">
                                Dikirim ke
                            </h2>
                            {link.recipient_name && (
                                <p>{link.recipient_name}</p>
                            )}
                            <p className="whitespace-pre-line text-muted-foreground">
                                {link.shipping_address}
                            </p>
                        </section>
                    )}

                <form
                    onSubmit={submit}
                    className="space-y-4 rounded-xl border border-border bg-card p-4"
                >
                    <h2 className="font-medium text-foreground">
                        Data pembeli
                    </h2>
                    <div className="space-y-1">
                        <Label htmlFor="customer_name">Nama</Label>
                        <Input
                            id="customer_name"
                            value={form.data.customer_name}
                            onChange={(e) =>
                                form.setData('customer_name', e.target.value)
                            }
                            required
                        />
                        <InputError message={form.errors.customer_name} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="customer_phone">No. WhatsApp</Label>
                        <Input
                            id="customer_phone"
                            value={form.data.customer_phone}
                            onChange={(e) =>
                                form.setData('customer_phone', e.target.value)
                            }
                            placeholder="08xxxxxxxxxx"
                            required
                        />
                        <InputError message={form.errors.customer_phone} />
                    </div>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing
                            ? 'Memproses…'
                            : 'Lanjut ke pembayaran'}
                    </Button>
                </form>
            </main>
        </div>
    );
}
