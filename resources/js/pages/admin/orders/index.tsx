import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, ChevronDown, Search, X } from 'lucide-react';
import { useState } from 'react';
import AdminOrderController from '@/actions/App/Http/Controllers/Admin/OrderController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type { Order, OrderStatus, Paginated } from '@/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: 'Menunggu bayar',
    paid: 'Diproses',
    shipped: 'Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
};

const STATUS_VARIANT: Record<
    OrderStatus,
    'default' | 'secondary' | 'outline' | 'destructive'
> = {
    pending: 'secondary',
    paid: 'default',
    shipped: 'default',
    completed: 'outline',
    cancelled: 'destructive',
};

const SORTS: { value: string; label: string }[] = [
    { value: '', label: 'Terbaru' },
    { value: 'oldest', label: 'Terlama' },
    { value: 'total_desc', label: 'Total tertinggi' },
    { value: 'total_asc', label: 'Total terendah' },
];

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

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
    action?: string;
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

function needsAction(order: Order): string | null {
    if (
        order.status === 'pending' &&
        order.fulfillment === 'ship' &&
        order.shipping_cost === 0
    ) {
        return 'Perlu ongkir';
    }
    if (order.status === 'paid' && order.fulfillment === 'ship') {
        return 'Perlu dikirim';
    }

    return null;
}

export default function AdminOrders({
    orders,
    filters,
    actionCounts,
}: {
    orders: Paginated<Order>;
    filters: Filters;
    actionCounts: { needs_ongkir: number; needs_ship: number };
}) {
    const [search, setSearch] = useState(filters.search ?? '');

    const apply = (next: Filters) => {
        router.get(
            AdminOrderController.index().url,
            clean({ ...filters, ...next }),
            { preserveScroll: true, preserveState: true, replace: true },
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
        <>
            <Head title="Pesanan Masuk" />

            <div className="w-full space-y-4 p-4">
                <Heading
                    title="Pesanan Masuk"
                    description={`${orders.total} pesanan`}
                />

                {/* Quick action tabs */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={!filters.action ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => apply({ action: undefined })}
                    >
                        Semua
                    </Button>
                    <Button
                        variant={
                            filters.action === 'needs_ongkir'
                                ? 'default'
                                : 'outline'
                        }
                        size="sm"
                        onClick={() => apply({ action: 'needs_ongkir' })}
                    >
                        Perlu ongkir
                        {actionCounts.needs_ongkir > 0 && (
                            <Badge variant="destructive" className="ml-1">
                                {actionCounts.needs_ongkir}
                            </Badge>
                        )}
                    </Button>
                    <Button
                        variant={
                            filters.action === 'needs_ship'
                                ? 'default'
                                : 'outline'
                        }
                        size="sm"
                        onClick={() => apply({ action: 'needs_ship' })}
                    >
                        Perlu dikirim
                        {actionCounts.needs_ship > 0 && (
                            <Badge variant="destructive" className="ml-1">
                                {actionCounts.needs_ship}
                            </Badge>
                        )}
                    </Button>
                </div>

                {/* Toolbar */}
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
                            placeholder="Cari no. / nama / judul buku…"
                            className="h-9 pl-9"
                            aria-label="Cari pesanan"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
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
                            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map(
                                (s) => (
                                    <DropdownMenuItem
                                        key={s}
                                        onClick={() => apply({ status: s })}
                                    >
                                        {STATUS_LABEL[s]}
                                    </DropdownMenuItem>
                                ),
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
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
                                        apply({ sort: s.value || undefined })
                                    }
                                >
                                    {s.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Input
                        type="date"
                        value={filters.date_from ?? ''}
                        onChange={(e) =>
                            apply({ date_from: e.target.value || undefined })
                        }
                        className="h-9 w-36"
                        aria-label="Tanggal dari"
                    />
                    <Input
                        type="date"
                        value={filters.date_to ?? ''}
                        onChange={(e) =>
                            apply({ date_to: e.target.value || undefined })
                        }
                        className="h-9 w-36"
                        aria-label="Tanggal sampai"
                    />
                </div>

                {chips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {chips.map((chip) => (
                            <button
                                key={chip.key}
                                type="button"
                                onClick={() => apply({ [chip.key]: undefined })}
                                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs transition-colors hover:bg-accent/50"
                            >
                                {chip.label}
                                <X className="size-3" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="p-3 font-medium">#</th>
                                <th className="p-3 font-medium">Pelanggan</th>
                                <th className="p-3 font-medium">Tanggal</th>
                                <th className="p-3 font-medium">Kirim</th>
                                <th className="p-3 font-medium">Total</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {orders.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="p-6 text-center text-muted-foreground"
                                    >
                                        Tak ada pesanan.
                                    </td>
                                </tr>
                            )}
                            {orders.data.map((order) => {
                                const action = needsAction(order);

                                return (
                                    <tr
                                        key={order.id}
                                        className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                                    >
                                        <td className="p-3">{order.id}</td>
                                        <td className="p-3">
                                            {order.customer_name}
                                            <div className="text-muted-foreground">
                                                {order.customer_phone}
                                            </div>
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {order.fulfillment === 'ship'
                                                ? 'Kirim'
                                                : 'Ambil'}
                                        </td>
                                        <td className="p-3">
                                            {rupiah.format(order.total)}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap items-center gap-1">
                                                <Badge
                                                    variant={
                                                        STATUS_VARIANT[
                                                            order.status
                                                        ]
                                                    }
                                                >
                                                    {STATUS_LABEL[order.status]}
                                                </Badge>
                                                {action && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                                        <AlertCircle className="size-3" />
                                                        {action}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={AdminOrderController.show(
                                                        order.id,
                                                    )}
                                                >
                                                    Kelola
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {orders.last_page > 1 && (
                    <div className="flex flex-wrap gap-1">
                        {orders.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

AdminOrders.layout = {
    breadcrumbs: [
        { title: 'Pesanan Masuk', href: AdminOrderController.index() },
    ],
};
