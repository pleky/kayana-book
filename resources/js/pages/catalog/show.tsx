import { Form, Head, Link } from '@inertiajs/react';
import DOMPurify from 'dompurify';
import { ArrowLeft, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import CartController from '@/actions/App/Http/Controllers/CartController';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import SiteHeader from '@/components/catalog/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Book, BookCondition } from '@/types';

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

export default function BookDetail({ book }: { book: Book }) {
    const images = book.images ?? [];
    const [active, setActive] = useState(
        images.find((i) => i.is_primary)?.path ?? images[0]?.path,
    );

    return (
        <div className="min-h-screen bg-background">
            <Head title={book.title} />
            <SiteHeader />

            <main className="mx-auto max-w-5xl px-4 py-8">
                <Link
                    href={CatalogController.index()}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Kembali ke katalog
                </Link>

                <div className="mt-6 grid gap-8 md:grid-cols-2">
                    <div className="space-y-3 md:sticky md:top-20 md:self-start">
                        <div className="aspect-3/4 overflow-hidden rounded-xl border border-border bg-muted">
                            {active ? (
                                <img
                                    src={`/storage/${active}`}
                                    alt={`Sampul ${book.title}`}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                                    Tanpa foto
                                </div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="flex flex-wrap gap-2">
                                {images.map((img) => (
                                    <button
                                        key={img.id}
                                        type="button"
                                        onClick={() => setActive(img.path)}
                                        className={`size-16 cursor-pointer overflow-hidden rounded-md border border-border transition ${
                                            active === img.path
                                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                                                : 'opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <img
                                            src={`/storage/${img.path}`}
                                            alt={book.title}
                                            className="size-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge>{CONDITION_LABEL[book.condition]}</Badge>
                            {book.is_new && (
                                <Badge variant="secondary">Baru</Badge>
                            )}
                            {book.category && (
                                <Badge variant="outline">
                                    {book.category.name}
                                </Badge>
                            )}
                        </div>

                        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                            {book.title}
                        </h1>
                        {book.author && (
                            <p className="text-muted-foreground">
                                oleh {book.author}
                            </p>
                        )}

                        <p className="text-3xl font-bold text-primary">
                            {rupiah.format(book.price)}
                        </p>

                        {book.description && (
                            <div
                                className="text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-medium [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(book.description),
                                }}
                            />
                        )}

                        {(book.tags?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {book.tags?.map((tag) => (
                                    <Link
                                        key={tag.id}
                                        href={CatalogController.index({
                                            query: { tag: tag.slug },
                                        })}
                                    >
                                        <Badge
                                            variant="outline"
                                            className="transition-colors hover:bg-accent"
                                        >
                                            #{tag.name}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}

                        <dl className="grid grid-cols-2 gap-2 text-sm">
                            {book.isbn && (
                                <>
                                    <dt className="text-muted-foreground">
                                        ISBN
                                    </dt>
                                    <dd>{book.isbn}</dd>
                                </>
                            )}
                        </dl>

                        <Form
                            {...CartController.store.form(book.slug)}
                            options={{ preserveScroll: true }}
                        >
                            {({ processing }) => (
                                <Button
                                    size="lg"
                                    className="w-full"
                                    disabled={processing}
                                >
                                    <ShoppingCart className="size-4" />
                                    {processing
                                        ? 'Menambahkan…'
                                        : 'Tambah ke keranjang'}
                                </Button>
                            )}
                        </Form>

                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="size-4 text-primary" />
                            Eksemplar unik — diamankan untukmu saat checkout.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
