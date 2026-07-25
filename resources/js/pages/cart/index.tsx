import { Form, Head, Link } from '@inertiajs/react';
import CartController from '@/actions/App/Http/Controllers/CartController';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import CheckoutController from '@/actions/App/Http/Controllers/CheckoutController';
import SiteHeader from '@/components/catalog/site-header';
import { Button } from '@/components/ui/button';
import { BOOK_CONDITION_LABEL as CONDITION_LABEL } from '@/lib/book-labels';
import { rupiah } from '@/lib/format';
import type { BookCondition } from '@/types';

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

            <main className="mx-auto max-w-3xl px-4 py-8">
                <h1 className="mb-6 font-serif text-3xl font-semibold tracking-tight text-foreground">
                    Keranjang
                </h1>

                {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
                        <p className="font-serif text-lg text-foreground">
                            Keranjang masih kosong.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Temukan buku yang menunggu pembaca barunya.
                        </p>
                        <Button asChild className="mt-5">
                            <Link href={CatalogController.index()}>
                                Jelajahi katalog
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
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

                        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Subtotal
                                </p>
                                <p className="text-2xl font-bold text-primary">
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
