import { Form, Head, Link } from '@inertiajs/react';
import CartController from '@/actions/App/Http/Controllers/CartController';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import CheckoutController from '@/actions/App/Http/Controllers/CheckoutController';
import SiteHeader from '@/components/catalog/site-header';
import { Button } from '@/components/ui/button';
import type { BookCondition } from '@/types';

const CONDITION_LABEL: Record<BookCondition, string> = {
    new: 'Baru',
    like_new: 'Seperti baru',
    good: 'Bagus',
    fair: 'Cukup',
    poor: 'Kurang',
};

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

type CartItem = {
    id: number;
    slug: string;
    title: string;
    author: string | null;
    price: number;
    condition: BookCondition;
    cover: string | null;
};

export default function Cart({
    items,
    subtotal,
}: {
    items: CartItem[];
    subtotal: number;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Head title="Keranjang" />
            <SiteHeader />

            <main className="mx-auto max-w-3xl p-4">
                <h1 className="mb-4 text-2xl font-semibold tracking-tight">
                    Keranjang
                </h1>

                {items.length === 0 ? (
                    <div className="rounded-xl border p-8 text-center">
                        <p className="text-muted-foreground">
                            Keranjang masih kosong.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href={CatalogController.index()}>
                                Jelajahi katalog
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <ul className="divide-y rounded-xl border">
                            {items.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-center gap-3 p-3"
                                >
                                    {item.cover ? (
                                        <img
                                            src={`/storage/${item.cover}`}
                                            alt={item.title}
                                            className="size-16 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="size-16 rounded bg-muted" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={CatalogController.show(
                                                item.slug,
                                            )}
                                            className="font-medium hover:underline"
                                        >
                                            {item.title}
                                        </Link>
                                        <p className="text-sm text-muted-foreground">
                                            {CONDITION_LABEL[item.condition]}
                                            {item.author && ` · ${item.author}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">
                                            {rupiah.format(item.price)}
                                        </p>
                                        <Form
                                            {...CartController.destroy.form(
                                                item.slug,
                                            )}
                                            options={{ preserveScroll: true }}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                            >
                                                Hapus
                                            </Button>
                                        </Form>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="flex items-center justify-between rounded-xl border p-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Subtotal
                                </p>
                                <p className="text-xl font-bold">
                                    {rupiah.format(subtotal)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Ongkir dikonfirmasi penjual setelah pesan.
                                </p>
                            </div>
                            <Button size="lg" asChild>
                                <Link href={CheckoutController.create()}>
                                    Checkout
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
