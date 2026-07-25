import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    ChevronsUpDown,
    Search,
} from 'lucide-react';
import { useState } from 'react';
import BookController from '@/actions/App/Http/Controllers/Admin/BookController';
import { useConfirm } from '@/components/confirm-dialog';
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
import {
    BOOK_CONDITION_LABEL as CONDITION_LABEL,
    BOOK_STATUS_LABEL as STATUS_LABEL,
    BOOK_STATUS_VARIANT as STATUS_VARIANT,
} from '@/lib/book-labels';
import { rupiah } from '@/lib/format';
import type { Book, BookStatus, Paginated } from '@/types';

const tanggal = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });

type Filters = {
    search?: string;
    status?: string;
    visibility?: string;
    sort?: string;
    direction?: string;
};

const VISIBILITY_LABEL: Record<string, string> = {
    listed: 'Tampil di katalog',
    unlisted: 'Tersembunyi',
};

/** Drop empty/null/undefined filter values so the URL stays clean. */
function clean(params: Filters): Record<string, string> {
    return Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) =>
                value !== undefined && value !== null && value !== '',
        ),
    ) as Record<string, string>;
}

function SortIcon({
    active,
    direction,
}: {
    active: boolean;
    direction?: string;
}) {
    if (!active) {
        return <ChevronsUpDown className="size-3.5 opacity-50" />;
    }

    return direction === 'asc' ? (
        <ArrowUp className="size-3.5" />
    ) : (
        <ArrowDown className="size-3.5" />
    );
}

function SortHeader({
    column,
    filters,
    onSort,
    children,
}: {
    column: string;
    filters: Filters;
    onSort: (column: string) => void;
    children: React.ReactNode;
}) {
    return (
        <th className="p-3 font-medium">
            <button
                type="button"
                onClick={() => onSort(column)}
                className="inline-flex items-center gap-1 hover:text-foreground"
            >
                {children}
                <SortIcon
                    active={filters.sort === column}
                    direction={filters.direction}
                />
            </button>
        </th>
    );
}

export default function BooksIndex({
    books,
    filters,
}: {
    books: Paginated<Book>;
    filters: Filters;
}) {
    const confirm = useConfirm();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const apply = (next: Filters): void => {
        router.get(BookController.index().url, clean({ ...filters, ...next }), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const applySort = (column: string): void => {
        const direction =
            filters.sort === column && filters.direction === 'asc'
                ? 'desc'
                : 'asc';

        apply({ sort: column, direction });
    };

    const hasFilters = Boolean(
        filters.search || filters.status || filters.visibility,
    );

    return (
        <>
            <Head title="Kelola Buku" />

            <div className="w-full space-y-4 p-4">
                <div className="flex items-center justify-between gap-4">
                    <Heading
                        title="Kelola Buku"
                        description={`${books.total} buku`}
                    />
                    <Button asChild>
                        <Link href={BookController.create()}>Tambah Buku</Link>
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative max-w-xs flex-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    apply({ search: search || undefined });
                                }
                            }}
                            placeholder="Cari judul / penulis / ISBN…"
                            className="pl-9"
                            aria-label="Cari buku"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                {filters.status
                                    ? STATUS_LABEL[filters.status as BookStatus]
                                    : 'Semua status'}
                                <ChevronDown className="size-4 opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem
                                onClick={() => apply({ status: undefined })}
                            >
                                Semua status
                            </DropdownMenuItem>
                            {(Object.keys(STATUS_LABEL) as BookStatus[]).map(
                                (value) => (
                                    <DropdownMenuItem
                                        key={value}
                                        onClick={() => apply({ status: value })}
                                    >
                                        {STATUS_LABEL[value]}
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
                                {filters.visibility
                                    ? VISIBILITY_LABEL[filters.visibility]
                                    : 'Semua visibilitas'}
                                <ChevronDown className="size-4 opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem
                                onClick={() => apply({ visibility: undefined })}
                            >
                                Semua visibilitas
                            </DropdownMenuItem>
                            {Object.entries(VISIBILITY_LABEL).map(
                                ([value, label]) => (
                                    <DropdownMenuItem
                                        key={value}
                                        onClick={() =>
                                            apply({ visibility: value })
                                        }
                                    >
                                        {label}
                                    </DropdownMenuItem>
                                ),
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {hasFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearch('');
                                router.get(BookController.index().url);
                            }}
                        >
                            Reset
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <SortHeader
                                    column="title"
                                    filters={filters}
                                    onSort={applySort}
                                >
                                    Buku
                                </SortHeader>
                                <th className="p-3 font-medium">Kondisi</th>
                                <th className="p-3 font-medium">Kategori</th>
                                <SortHeader
                                    column="price"
                                    filters={filters}
                                    onSort={applySort}
                                >
                                    Harga
                                </SortHeader>
                                <SortHeader
                                    column="status"
                                    filters={filters}
                                    onSort={applySort}
                                >
                                    Status
                                </SortHeader>
                                <SortHeader
                                    column="created_at"
                                    filters={filters}
                                    onSort={applySort}
                                >
                                    Masuk
                                </SortHeader>
                                <th className="p-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {books.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="p-6 text-center text-muted-foreground"
                                    >
                                        {filters.search ||
                                        filters.status ||
                                        filters.visibility
                                            ? 'Tidak ada buku yang cocok dengan filter.'
                                            : 'Belum ada buku.'}
                                    </td>
                                </tr>
                            )}
                            {books.data.map((book) => {
                                const cover = book.primary_image;

                                return (
                                    <tr
                                        key={book.id}
                                        className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                                    >
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                {cover ? (
                                                    <img
                                                        src={`/storage/${cover.path}`}
                                                        alt={book.title}
                                                        className="size-12 rounded object-cover"
                                                    />
                                                ) : (
                                                    <div className="size-12 rounded bg-muted" />
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2 font-medium">
                                                        {book.title}
                                                        {book.is_unlisted && (
                                                            <Badge variant="outline">
                                                                Tersembunyi
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {book.author && (
                                                        <div className="text-muted-foreground">
                                                            {book.author}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {CONDITION_LABEL[book.condition]}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {book.category?.name ?? '—'}
                                        </td>
                                        <td className="p-3">
                                            {rupiah.format(book.price)}
                                        </td>
                                        <td className="p-3">
                                            <Badge
                                                variant={
                                                    STATUS_VARIANT[book.status]
                                                }
                                            >
                                                {STATUS_LABEL[book.status]}
                                            </Badge>
                                        </td>
                                        <td className="p-3 whitespace-nowrap text-muted-foreground">
                                            {tanggal.format(
                                                new Date(book.created_at),
                                            )}
                                        </td>
                                        <td className="p-3 text-right whitespace-nowrap">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                            >
                                                <Link
                                                    href={BookController.edit(
                                                        book.slug,
                                                    )}
                                                >
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                disabled={
                                                    deletingId === book.id
                                                }
                                                onClick={async () => {
                                                    if (
                                                        await confirm({
                                                            title: 'Hapus buku',
                                                            description: `Hapus "${book.title}"?`,
                                                            destructive: true,
                                                            confirmLabel:
                                                                'Hapus',
                                                        })
                                                    ) {
                                                        router.delete(
                                                            BookController.destroy(
                                                                book.slug,
                                                            ).url,
                                                            {
                                                                preserveScroll: true,
                                                                onStart: () =>
                                                                    setDeletingId(
                                                                        book.id,
                                                                    ),
                                                                onFinish: () =>
                                                                    setDeletingId(
                                                                        null,
                                                                    ),
                                                            },
                                                        );
                                                    }
                                                }}
                                            >
                                                {deletingId === book.id
                                                    ? 'Menghapus…'
                                                    : 'Hapus'}
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {books.last_page > 1 && (
                    <div className="flex flex-wrap gap-1">
                        {books.links.map((link, i) => (
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

BooksIndex.layout = {
    breadcrumbs: [{ title: 'Buku', href: BookController.index() }],
};
