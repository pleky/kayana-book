import { Form, Head, Link } from '@inertiajs/react';
import { SlidersHorizontal } from 'lucide-react';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import SiteHeader from '@/components/catalog/site-header';
import { Reveal } from '@/components/motion/reveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    Book,
    BookCategory,
    BookCondition,
    Paginated,
    Tag,
} from '@/types';

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
    'h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none';

type Filters = {
    search?: string;
    category?: string;
    tag?: string;
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
    tags,
    filters,
}: {
    books: Paginated<Book>;
    categories: BookCategory[];
    tags: Tag[];
    filters: Filters;
}) {
    const roots = categories.filter((c) => !c.parent_id);
    const childrenOf = (id: number) =>
        categories.filter((c) => c.parent_id === id);

    return (
        <div className="min-h-screen bg-background">
            <Head title="Katalog Buku" />
            <SiteHeader />

            <main className="mx-auto max-w-6xl px-4 py-8">
                <Reveal as="section" className="mb-8">
                    <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                        Katalog
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {books.total} buku tersedia — tiap eksemplar unik.
                    </p>
                </Reveal>

                <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
                    <aside>
                        <Form
                            action={CatalogController.index().url}
                            method="get"
                            className="space-y-4 rounded-xl border border-border bg-card p-4 md:sticky md:top-20"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <SlidersHorizontal className="size-4 text-primary" />
                                Filter
                            </div>

                            <div>
                                <Label htmlFor="search">Cari</Label>
                                <Input
                                    id="search"
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    placeholder="Judul / penulis"
                                    className="bg-card"
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
                                        <optgroup
                                            key={root.id}
                                            label={root.name}
                                        >
                                            <option value={root.slug}>
                                                Semua {root.name}
                                            </option>
                                            {childrenOf(root.id).map(
                                                (child) => (
                                                    <option
                                                        key={child.id}
                                                        value={child.slug}
                                                    >
                                                        {child.name}
                                                    </option>
                                                ),
                                            )}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            {tags.length > 0 && (
                                <div>
                                    <Label htmlFor="tag">Tag</Label>
                                    <select
                                        id="tag"
                                        name="tag"
                                        defaultValue={filters.tag ?? ''}
                                        className={selectClass}
                                    >
                                        <option value="">Semua</option>
                                        {tags.map((tag) => (
                                            <option
                                                key={tag.id}
                                                value={tag.slug}
                                            >
                                                {tag.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

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
                                        className="bg-card"
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
                                        className="bg-card"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-1">
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
                        {books.data.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
                                <p className="font-serif text-lg text-foreground">
                                    Tidak ada buku yang cocok.
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Coba longgarkan filter atau reset pencarian.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {books.data.map((book, i) => {
                                    const cover = book.primary_image?.[0];

                                    return (
                                        <Reveal
                                            key={book.id}
                                            delay={Math.min(i, 9) * 45}
                                            className="h-full"
                                        >
                                            <Link
                                                href={CatalogController.show(
                                                    book.slug,
                                                )}
                                                className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
                                            >
                                                <div className="relative aspect-3/4 overflow-hidden bg-muted">
                                                    {cover ? (
                                                        <img
                                                            src={`/storage/${cover.path}`}
                                                            alt={`Sampul ${book.title}`}
                                                            loading="lazy"
                                                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                                                            Tanpa foto
                                                        </div>
                                                    )}
                                                    <Badge
                                                        variant="secondary"
                                                        className="absolute top-2 left-2 backdrop-blur"
                                                    >
                                                        {
                                                            CONDITION_LABEL[
                                                                book.condition
                                                            ]
                                                        }
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-1 flex-col gap-1 p-3">
                                                    <h3 className="line-clamp-2 font-serif font-medium text-foreground">
                                                        {book.title}
                                                    </h3>
                                                    {book.author && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {book.author}
                                                        </p>
                                                    )}
                                                    <p className="mt-auto pt-1 font-semibold text-primary">
                                                        {rupiah.format(
                                                            book.price,
                                                        )}
                                                    </p>
                                                </div>
                                            </Link>
                                        </Reveal>
                                    );
                                })}
                            </div>
                        )}

                        {books.last_page > 1 && (
                            <div className="mt-8 flex flex-wrap gap-1">
                                {books.links.map((link, i) =>
                                    link.url ? (
                                        <Button
                                            key={i}
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
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
                </div>
            </main>
        </div>
    );
}
