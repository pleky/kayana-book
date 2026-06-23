import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    CalendarDays,
    ChevronDown,
    Package,
    Search,
    Truck,
    X,
} from 'lucide-react';
import {  useState } from 'react';
import type {ReactNode} from 'react';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import SiteHeader from '@/components/catalog/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { rupiah } from '@/lib/format';
import {
    ORDER_STATUS_LABEL as STATUS_LABEL,
    ORDER_STATUS_VARIANT as STATUS_VARIANT,
} from '@/lib/order-status';
import type { Order, OrderStatus, Paginated } from '@/types';

const SORTS: { value: string; label: string }[] = [
    { value: '', label: 'Terbaru' },
    { value: 'oldest', label: 'Terlama' },
    { value: 'total_desc', label: 'Total tertinggi' },
    { value: 'total_asc', label: 'Total terendah' },
];

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

type Filters = {
    search?: string;
    status?: string;
    sort?: string;
    date_from?: string;
    date_to?: string;
};

function clean(params: Filters): Record<string, string> {
    return Object.fromEntries(
        Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== null && v !== '',
        ),
    ) as Record<string, string>;
}

export default function Orders({
    orders,
    filters,
}: {
    orders: Paginated<Order>;
    filters: Filters;
}) {
    const [search, setSearch] = useState(filters.search ?? '');

    const term = (filters.search ?? '').trim().toLowerCase();

    const highlight = (text: string): ReactNode => {
        if (!term) {
            return text;
        }

        const idx = text.toLowerCase().indexOf(term);

        if (idx < 0) {
            return text;
        }

        return (
            <>
                {text.slice(0, idx)}
                <mark className="rounded bg-brand/30 px-0.5 text-foreground">
                    {text.slice(idx, idx + term.length)}
                </mark>
                {text.slice(idx + term.length)}
            </>
        );
    };

    const apply = (next: Filters) => {
        router.get(
            OrderController.index().url,
            clean({ ...filters, ...next }),
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const statusLabel = filters.status
        ? STATUS_LABEL[filters.status as OrderStatus]
        : 'Semua status';
    const sortLabel =
        SORTS.find((s) => s.value === (filters.sort ?? ''))?.label ?? 'Terbaru';

    const chips: { key: keyof Filters; label: string }[] = [];

    if (filters.search) {
        chips.push({ key: 'search', label: `Cari: "${filters.search}"` });
    }

    if (filters.status) {
        chips.push({
            key: 'status',
            label: STATUS_LABEL[filters.status as OrderStatus],
        });
    }

    if (filters.date_from) {
        chips.push({ key: 'date_from', label: `Dari ${filters.date_from}` });
    }

    if (filters.date_to) {
        chips.push({ key: 'date_to', label: `Sampai ${filters.date_to}` });
    }

    return (
        <div className="min-h-screen bg-background">
            <Head title="Pesanan Saya" />
            <SiteHeader />

            <main className="mx-auto max-w-3xl px-4 py-8">
                <h1 className="mb-6 font-serif text-3xl font-semibold tracking-tight text-foreground">
                    Pesanan Saya
                </h1>

                {/* Toolbar */}
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-48 flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        apply({ search: search || undefined });
                                    }
                                }}
                                placeholder="Cari no. pesanan / judul buku…"
                                className="h-9 pl-9"
                                aria-label="Cari pesanan"
                            />
                        </div>

                        {/* Status */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="justify-between gap-2"
                                >
                                    {statusLabel}
                                    <ChevronDown className="size-4 opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => apply({ status: undefined })}
                                >
                                    Semua status
                                </DropdownMenuItem>
                                {(
                                    Object.keys(STATUS_LABEL) as OrderStatus[]
                                ).map((s) => (
                                    <DropdownMenuItem
                                        key={s}
                                        onClick={() => apply({ status: s })}
                                    >
                                        {STATUS_LABEL[s]}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Sort */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="justify-between gap-2"
                                >
                                    {sortLabel}
                                    <ChevronDown className="size-4 opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {SORTS.map((s) => (
                                    <DropdownMenuItem
                                        key={s.value || 'latest'}
                                        onClick={() =>
                                            apply({
                                                sort: s.value || undefined,
                                            })
                                        }
                                    >
                                        {s.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Date range */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <CalendarDays className="size-4 text-muted-foreground" />
                        <Input
                            type="date"
                            value={filters.date_from ?? ''}
                            onChange={(e) =>
                                apply({
                                    date_from: e.target.value || undefined,
                                })
                            }
                            className="h-9 w-40"
                            aria-label="Tanggal dari"
                        />
                        <span className="text-muted-foreground">–</span>
                        <Input
                            type="date"
                            value={filters.date_to ?? ''}
                            onChange={(e) =>
                                apply({ date_to: e.target.value || undefined })
                            }
                            className="h-9 w-40"
                            aria-label="Tanggal sampai"
                        />
                    </div>

                    {/* Active chips */}
                    {chips.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
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
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-7"
                            >
                                <Link href={OrderController.index()}>
                                    Reset
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* List */}
                <div className="mt-6">
                    {orders.data.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground">
                            {chips.length > 0
                                ? 'Tak ada pesanan yang cocok.'
                                : 'Belum ada pesanan.'}
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {orders.data.map((order) => (
                                <li
                                    key={order.id}
                                    className="rounded-xl border border-border bg-card p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">
                                                    Pesanan #{order.id}
                                                </span>
                                                <Badge
                                                    variant={
                                                        STATUS_VARIANT[
                                                            order.status
                                                        ]
                                                    }
                                                >
                                                    {STATUS_LABEL[order.status]}
                                                </Badge>
                                                {order.has_updates && (
                                                    <span
                                                        className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand"
                                                        title="Detail/harga buku berubah — buka untuk lihat versi terbaru"
                                                    >
                                                        <AlertCircle className="size-3.5" />
                                                        Ada pembaruan
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays className="size-3.5" />
                                                    {formatDate(
                                                        order.created_at,
                                                    )}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Package className="size-3.5" />
                                                    {order.items_count ?? 0}{' '}
                                                    buku
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Truck className="size-3.5" />
                                                    {order.fulfillment ===
                                                    'ship'
                                                        ? 'Kirim'
                                                        : 'Ambil di toko'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="font-semibold text-primary">
                                                {rupiah.format(order.total)}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                                className="mt-1"
                                            >
                                                <Link
                                                    href={OrderController.show(
                                                        order.id,
                                                    )}
                                                >
                                                    Detail
                                                    <ArrowRight className="size-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>

                                    {(() => {
                                        const items = order.items ?? [];

                                        if (items.length === 0) {
                                            return null;
                                        }

                                        const sorted = term
                                            ? [...items].sort(
                                                  (a, b) =>
                                                      Number(
                                                          b.title
                                                              .toLowerCase()
                                                              .includes(term),
                                                      ) -
                                                      Number(
                                                          a.title
                                                              .toLowerCase()
                                                              .includes(term),
                                                      ),
                                              )
                                            : items;
                                        const shown = sorted.slice(0, 3);
                                        const rest =
                                            items.length - shown.length;

                                        return (
                                            <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
                                                {shown.map((item) => (
                                                    <li
                                                        key={item.id}
                                                        className="flex items-center gap-2"
                                                    >
                                                        {item.cover_path ? (
                                                            <img
                                                                src={`/storage/${item.cover_path}`}
                                                                alt={item.title}
                                                                loading="lazy"
                                                                className="h-12 w-9 shrink-0 rounded border border-border object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded border border-border bg-muted">
                                                                <BookOpen className="size-4 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <span className="min-w-0 truncate text-sm text-foreground">
                                                            {highlight(
                                                                item.title,
                                                            )}
                                                        </span>
                                                    </li>
                                                ))}
                                                {rest > 0 && (
                                                    <li className="text-xs text-muted-foreground">
                                                        +{rest} judul lain
                                                    </li>
                                                )}
                                            </ul>
                                        );
                                    })()}
                                </li>
                            ))}
                        </ul>
                    )}

                    {orders.last_page > 1 && (
                        <div className="mt-6 flex flex-wrap gap-1">
                            {orders.links.map((link, i) =>
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
                </div>
            </main>
        </div>
    );
}
