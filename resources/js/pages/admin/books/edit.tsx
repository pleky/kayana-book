import { Form, Head, Link, router } from '@inertiajs/react';
import BookController from '@/actions/App/Http/Controllers/Admin/BookController';
import BookImageController from '@/actions/App/Http/Controllers/Admin/BookImageController';
import BookFormFields from '@/components/admin/book-form-fields';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { Book, BookCategory } from '@/types';

const STATUSES: { value: string; label: string }[] = [
    { value: 'available', label: 'Tersedia' },
    { value: 'reserved', label: 'Dipesan' },
    { value: 'sold', label: 'Terjual' },
];

const selectClass =
    'mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none';

export default function EditBook({
    book,
    categories,
}: {
    book: Book;
    categories: BookCategory[];
}) {
    return (
        <>
            <Head title={`Edit: ${book.title}`} />

            <div className="mx-auto w-full max-w-3xl p-4">
                <Heading title="Edit Buku" description={book.title} />

                {book.images && book.images.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-3">
                        {book.images.map((img) => (
                            <div key={img.id} className="w-24 space-y-1">
                                <div className="relative">
                                    <img
                                        src={`/storage/${img.path}`}
                                        alt={book.title}
                                        className="size-24 rounded-md border object-cover"
                                    />
                                    {img.is_primary && (
                                        <Badge className="absolute top-1 left-1">
                                            Utama
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    {!img.is_primary && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-1 text-xs"
                                            onClick={() =>
                                                router.patch(
                                                    BookImageController.setPrimary(
                                                        {
                                                            book: book.slug,
                                                            image: img.id,
                                                        },
                                                    ).url,
                                                    {},
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            Jadikan utama
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-1 text-xs text-destructive"
                                        onClick={() => {
                                            if (confirm('Hapus foto ini?')) {
                                                router.delete(
                                                    BookImageController.destroy(
                                                        {
                                                            book: book.slug,
                                                            image: img.id,
                                                        },
                                                    ).url,
                                                    { preserveScroll: true },
                                                );
                                            }
                                        }}
                                    >
                                        Hapus
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Card>
                    <CardContent className="pt-6">
                        <Form
                            {...BookController.update.form(book.slug)}
                            options={{ preserveScroll: true }}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div>
                                        <Label htmlFor="status">Status</Label>
                                        <select
                                            id="status"
                                            name="status"
                                            defaultValue={book.status}
                                            className={selectClass}
                                        >
                                            {STATUSES.map((s) => (
                                                <option
                                                    key={s.value}
                                                    value={s.value}
                                                >
                                                    {s.label}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            className="mt-1"
                                            message={errors.status}
                                        />
                                    </div>

                                    <BookFormFields
                                        errors={errors}
                                        categories={categories}
                                        book={book}
                                    />

                                    <div className="flex items-center gap-3">
                                        <Button disabled={processing}>
                                            Simpan perubahan
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            asChild
                                            type="button"
                                        >
                                            <Link href={BookController.index()}>
                                                Kembali
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

EditBook.layout = {
    breadcrumbs: [
        { title: 'Buku', href: BookController.index() },
        { title: 'Edit', href: BookController.index() },
    ],
};
