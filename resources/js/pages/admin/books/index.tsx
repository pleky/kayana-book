import { Form, Head, Link, router } from '@inertiajs/react';
import BookController from '@/actions/App/Http/Controllers/Admin/BookController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Book, BookStatus, Paginated } from '@/types';

const STATUS_LABEL: Record<BookStatus, string> = {
    available: 'Tersedia',
    reserved: 'Dipesan',
    sold: 'Terjual',
};

const STATUS_VARIANT: Record<BookStatus, 'default' | 'secondary' | 'outline'> =
    {
        available: 'default',
        reserved: 'secondary',
        sold: 'outline',
    };

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function BooksIndex({
    books,
    filters,
}: {
    books: Paginated<Book>;
    filters: { search?: string; status?: string };
}) {
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

                <Form
                    action={BookController.index().url}
                    method="get"
                    className="flex flex-wrap items-center gap-2"
                >
                    <Input
                        name="search"
                        defaultValue={filters.search ?? ''}
                        placeholder="Cari judul / penulis…"
                        className="max-w-xs"
                    />
                    <select
                        name="status"
                        defaultValue={filters.status ?? ''}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                    >
                        <option value="">Semua status</option>
                        <option value="available">Tersedia</option>
                        <option value="reserved">Dipesan</option>
                        <option value="sold">Terjual</option>
                    </select>
                    <Button variant="secondary">Cari</Button>
                </Form>

                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="p-3 font-medium">Buku</th>
                                <th className="p-3 font-medium">Harga</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {books.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="p-6 text-center text-muted-foreground"
                                    >
                                        Belum ada buku.
                                    </td>
                                </tr>
                            )}
                            {books.data.map((book) => {
                                const cover = book.primary_image?.[0];

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
                                                    <div className="font-medium">
                                                        {book.title}
                                                    </div>
                                                    {book.author && (
                                                        <div className="text-muted-foreground">
                                                            {book.author}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
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
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            `Hapus "${book.title}"?`,
                                                        )
                                                    ) {
                                                        router.delete(
                                                            BookController.destroy(
                                                                book.slug,
                                                            ).url,
                                                        );
                                                    }
                                                }}
                                            >
                                                Hapus
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
