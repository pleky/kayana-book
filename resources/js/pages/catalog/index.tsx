import { Head, Link, router } from '@inertiajs/react';
import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import CatalogFilters, {
    type CatalogFiltersValue,
} from '@/components/catalog/catalog-filters';
import SiteHeader from '@/components/catalog/site-header';
import { Reveal } from '@/components/motion/reveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import type { Book, BookCategory, BookCondition, Paginated } from '@/types';

const CONDITION_LABEL: Record<BookCondition, string> = {
    new: 'Baru',
    like_new: 'Seperti baru',
    good: 'Bagus',
    fair: 'Cukup',
    poor: 'Kurang',
};

const LANG_LABEL: Record<string, string> = {
    id: 'Indonesia',
    en: 'Inggris',
    lainnya: 'Lainnya',
};

const AUDIENCE_LABEL: Record<string, string> = {
    umum: 'Umum',
    anak: 'Anak',
    remaja: 'Remaja',
    dewasa: 'Dewasa',
};

const SORTS: { value: string; label: string }[] = [
    { value: '', label: 'Terbaru' },
    { value: 'price_asc', label: 'Termurah' },
    { value: 'price_desc', label: 'Termahal' },
];

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function clean(params: CatalogFiltersValue): Record<string, string> {
    return Object.fromEntries(
        Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== null && v !== '',
        ),
    ) as Record<string, string>;
}

export default function Catalog({
    books,
    categories,
    filters,
}: {
    books: Paginated<Book>;
    categories: BookCategory[];
    filters: CatalogFiltersValue;
}) {
    const [sheetOpen, setSheetOpen] = useState(false);

    const apply = (next: CatalogFiltersValue) => {
        router.get(
            CatalogController.index().url,
            clean({ ...filters, ...next }),
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const nameBySlug = (list: { slug?: string; name: string }[], slug?: string) =>
        list.find((c) => c.slug === slug)?.name ?? slug;

    // Active filter chips (sort & search excluded — they live in the toolbar).
    const chips: { key: keyof CatalogFiltersValue; label: string }[] = [];
    if (filters.search) {
        chips.push({ key: 'search', label: `Cari: "${filters.search}"` });
    }
    if (filters.category) {
        chips.push({
            key: 'category',
            label: `Kategori: ${nameBySlug(categories, filters.category)}`,
        });
    }
    if (filters.condition) {
        chips.push({
            key: 'condition',
            label: `Kondisi: ${CONDITION_LABEL[filters.condition as BookCondition]}`,
        });
    }
    if (filters.language) {
        chips.push({
            key: 'language',
            label: `Bahasa: ${LANG_LABEL[filters.language] ?? filters.language}`,
        });
    }
    if (filters.audience) {
        chips.push({
            key: 'audience',
            label: `Segmen: ${AUDIENCE_LABEL[filters.audience] ?? filters.audience}`,
        });
    }
    if (filters.min_price) {
        chips.push({
            key: 'min_price',
            label: `≥ ${rupiah.format(Number(filters.min_price))}`,
        });
    }
    if (filters.max_price) {
        chips.push({
            key: 'max_price',
            label: `≤ ${rupiah.format(Number(filters.max_price))}`,
        });
    }

    const activeCount = chips.length;

    return (
        <div className="min-h-screen bg-background">
            <Head title="Katalog Buku" />
            <SiteHeader />

            <main className="mx-auto max-w-7xl px-4 py-6">
                <div className="grid gap-6 md:grid-cols-[15rem_1fr]">
                    {/* Sidebar filter — desktop */}
                    <aside className="hidden md:block">
                        <div className="sticky top-20 rounded-xl border border-border bg-card px-4 py-2">
                            <div className="flex items-center justify-between border-b border-border py-2">
                                <span className="flex items-center gap-2 text-sm font-semibold">
                                    <SlidersHorizontal className="size-4 text-primary" />
                                    Filter
                                </span>
                                {activeCount > 0 && (
                                    <Link
                                        href={CatalogController.index()}
                                        className="text-xs font-medium text-primary"
                                    >
                                        Reset
                                    </Link>
                                )}
                            </div>
                            <CatalogFilters
                                filters={filters}
                                categories={categories}
                            />
                        </div>
                    </aside>

                    <section>
                        {/* Top bar: search + sort + mobile filter */}
                        <div className="mb-4 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Sheet
                                    open={sheetOpen}
                                    onOpenChange={setSheetOpen}
                                >
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="md:hidden"
                                        >
                                            <SlidersHorizontal className="size-4" />
                                            Filter
                                            {activeCount > 0 && (
                                                <Badge className="ml-1">
                                                    {activeCount}
                                                </Badge>
                                            )}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent
                                        side="left"
                                        className="w-80 overflow-y-auto"
                                    >
                                        <SheetHeader>
                                            <SheetTitle>Filter</SheetTitle>
                                        </SheetHeader>
                                        <div className="px-4 pb-6">
                                            <CatalogFilters
                                                filters={filters}
                                                categories={categories}
                                                onApplied={() =>
                                                    setSheetOpen(false)
                                                }
                                            />
                                            {activeCount > 0 && (
                                                <Button
                                                    variant="outline"
                                                    className="mt-4 w-full"
                                                    asChild
                                                >
                                                    <Link
                                                        href={CatalogController.index()}
                                                    >
                                                        Reset filter
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </SheetContent>
                                </Sheet>

                                <div className="ml-auto flex items-center gap-2">
                                    <label
                                        htmlFor="sort"
                                        className="hidden text-sm text-muted-foreground sm:inline"
                                    >
                                        Urutkan
                                    </label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-40 justify-between"
                                            >
                                                {SORTS.find(
                                                    (s) =>
                                                        s.value ===
                                                        (filters.sort ?? ''),
                                                )?.label ?? 'Terbaru'}
                                                <ChevronDown className="size-4 opacity-60" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-40"
                                        >
                                            {SORTS.map((s) => (
                                                <DropdownMenuItem
                                                    key={s.value || 'latest'}
                                                    onClick={() =>
                                                        apply({
                                                            sort:
                                                                s.value ||
                                                                undefined,
                                                        })
                                                    }
                                                >
                                                    <Check
                                                        className={
                                                            (filters.sort ??
                                                                '') === s.value
                                                                ? 'opacity-100'
                                                                : 'opacity-0'
                                                        }
                                                    />
                                                    {s.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {books.total} buku
                                </span>
                                {chips.map((chip) => (
                                    <button
                                        key={chip.key}
                                        type="button"
                                        onClick={() =>
                                            apply({ [chip.key]: undefined })
                                        }
                                        className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-accent/50"
                                    >
                                        {chip.label}
                                        <X className="size-3" />
                                    </button>
                                ))}
                            </div>
                        </div>

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
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {books.data.map((book, i) => {
                                    const cover = book.primary_image?.[0];

                                    return (
                                        <Reveal
                                            key={book.id}
                                            delay={Math.min(i, 9) * 40}
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
                                                <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                                                    <h3 className="line-clamp-2 text-sm font-medium text-foreground">
                                                        {book.title}
                                                    </h3>
                                                    {book.author && (
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {book.author}
                                                        </p>
                                                    )}
                                                    <p className="mt-auto pt-1 text-sm font-semibold text-primary">
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
