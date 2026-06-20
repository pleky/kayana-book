import { Form, Head, Link } from '@inertiajs/react';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import SiteHeader from '@/components/catalog/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Book, BookCategory, BookCondition, Paginated } from '@/types';

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

const selectClass =
    'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm';

type Filters = {
    search?: string;
    category?: string;
    language?: string;
    audience?: string;
    condition?: string;
    min_price?: string;
    max_price?: string;
    sort?: string;
};

export default function Catalog({
    books,
    categories,
    filters,
}: {
    books: Paginated<Book>;
    categories: BookCategory[];
    filters: Filters;
}) {
    const roots = categories.filter((c) => !c.parent_id);
    const childrenOf = (id: number) =>
        categories.filter((c) => c.parent_id === id);

    return (
        <div className="min-h-screen bg-background">
            <Head title="Katalog Buku" />
            <SiteHeader />

            <main className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[16rem_1fr]">
                <aside>
                    <Form
                        action={CatalogController.index().url}
                        method="get"
                        className="space-y-4"
                    >
                        <div>
                            <Label htmlFor="search">Cari</Label>
                            <Input
                                id="search"
                                name="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Judul / penulis"
                            />
                        </div>

                        <div>
                            <Label htmlFor="sort">Urutkan</Label>
                            <select
                                id="sort"
                                name="sort"
                                defaultValue={filters.sort ?? ''}
                                className={selectClass}
                            >
                                <option value="">Terbaru</option>
                                <option value="price_asc">
                                    Harga termurah
                                </option>
                                <option value="price_desc">
                                    Harga termahal
                                </option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="category">Kategori</Label>
                            <select
                                id="category"
                                name="category"
                                defaultValue={filters.category ?? ''}
                                className={selectClass}
                            >
                                <option value="">Semua</option>
                                {roots.map((root) => (
                                    <optgroup key={root.id} label={root.name}>
                                        <option value={root.slug}>
                                            Semua {root.name}
                                        </option>
                                        {childrenOf(root.id).map((child) => (
                                            <option
                                                key={child.id}
                                                value={child.slug}
                                            >
                                                {child.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="condition">Kondisi</Label>
                            <select
                                id="condition"
                                name="condition"
                                defaultValue={filters.condition ?? ''}
                                className={selectClass}
                            >
                                <option value="">Semua</option>
                                {Object.entries(CONDITION_LABEL).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="language">Bahasa</Label>
                            <select
                                id="language"
                                name="language"
                                defaultValue={filters.language ?? ''}
                                className={selectClass}
                            >
                                <option value="">Semua</option>
                                <option value="id">Indonesia</option>
                                <option value="en">Inggris</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="audience">Segmen</Label>
                            <select
                                id="audience"
                                name="audience"
                                defaultValue={filters.audience ?? ''}
                                className={selectClass}
                            >
                                <option value="">Semua</option>
                                <option value="umum">Umum</option>
                                <option value="anak">Anak</option>
                                <option value="remaja">Remaja</option>
                                <option value="dewasa">Dewasa</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label htmlFor="min_price">Harga min</Label>
                                <Input
                                    id="min_price"
                                    name="min_price"
                                    type="number"
                                    min={0}
                                    defaultValue={filters.min_price ?? ''}
                                />
                            </div>
                            <div>
                                <Label htmlFor="max_price">Harga max</Label>
                                <Input
                                    id="max_price"
                                    name="max_price"
                                    type="number"
                                    min={0}
                                    defaultValue={filters.max_price ?? ''}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1">
                                Terapkan
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={CatalogController.index()}>
                                    Reset
                                </Link>
                            </Button>
                        </div>
                    </Form>
                </aside>

                <section>
                    <p className="mb-4 text-sm text-muted-foreground">
                        {books.total} buku tersedia
                    </p>

                    {books.data.length === 0 ? (
                        <p className="rounded-xl border p-8 text-center text-muted-foreground">
                            Tidak ada buku yang cocok.
                        </p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {books.data.map((book) => {
                                const cover = book.primary_image?.[0];

                                return (
                                    <Link
                                        key={book.id}
                                        href={CatalogController.show(book.slug)}
                                        className="group overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
                                    >
                                        <div className="aspect-3/4 overflow-hidden bg-muted">
                                            {cover ? (
                                                <img
                                                    src={`/storage/${cover.path}`}
                                                    alt={book.title}
                                                    className="size-full object-cover transition-transform group-hover:scale-105"
                                                />
                                            ) : null}
                                        </div>
                                        <div className="space-y-1 p-3">
                                            <Badge variant="secondary">
                                                {
                                                    CONDITION_LABEL[
                                                        book.condition
                                                    ]
                                                }
                                            </Badge>
                                            <h3 className="line-clamp-2 font-medium">
                                                {book.title}
                                            </h3>
                                            {book.author && (
                                                <p className="text-sm text-muted-foreground">
                                                    {book.author}
                                                </p>
                                            )}
                                            <p className="font-semibold">
                                                {rupiah.format(book.price)}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {books.last_page > 1 && (
                        <div className="mt-6 flex flex-wrap gap-1">
                            {books.links.map((link, i) =>
                                link.url ? (
                                    <Button
                                        key={i}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        asChild
                                    >
                                        <Link
                                            href={link.url}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    </Button>
                                ) : (
                                    <Button
                                        key={i}
                                        variant="outline"
                                        size="sm"
                                        disabled
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ),
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
