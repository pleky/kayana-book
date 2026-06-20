import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
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

            <main className="mx-auto max-w-5xl p-4">
                <Link
                    href={CatalogController.index()}
                    className="text-sm text-muted-foreground hover:underline"
                >
                    ← Kembali ke katalog
                </Link>

                <div className="mt-4 grid gap-8 md:grid-cols-2">
                    <div className="space-y-3">
                        <div className="aspect-3/4 overflow-hidden rounded-xl border bg-muted">
                            {active && (
                                <img
                                    src={`/storage/${active}`}
                                    alt={book.title}
                                    className="size-full object-cover"
                                />
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="flex flex-wrap gap-2">
                                {images.map((img) => (
                                    <button
                                        key={img.id}
                                        type="button"
                                        onClick={() => setActive(img.path)}
                                        className={`size-16 overflow-hidden rounded-md border ${
                                            active === img.path
                                                ? 'ring-2 ring-ring'
                                                : ''
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

                        <h1 className="text-2xl font-semibold tracking-tight">
                            {book.title}
                        </h1>
                        {book.author && (
                            <p className="text-muted-foreground">
                                oleh {book.author}
                            </p>
                        )}

                        <p className="text-2xl font-bold">
                            {rupiah.format(book.price)}
                        </p>

                        {book.description && (
                            <p className="text-sm leading-relaxed whitespace-pre-line">
                                {book.description}
                            </p>
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

                        <Button size="lg" disabled className="w-full">
                            Pemesanan segera hadir
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
