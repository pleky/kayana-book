import { Form, Head } from '@inertiajs/react';
import BookController from '@/actions/App/Http/Controllers/Admin/BookController';
import BookFormFields from '@/components/admin/book-form-fields';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BookCategory } from '@/types';

export default function CreateBook({
    categories,
}: {
    categories: BookCategory[];
}) {
    return (
        <>
            <Head title="Tambah Buku" />

            <div className="mx-auto w-full max-w-3xl p-4">
                <Heading
                    title="Tambah Buku"
                    description="Isi data buku. Hanya judul, harga, kondisi, dan foto yang wajib."
                />

                <Card>
                    <CardContent className="pt-6">
                        <Form
                            {...BookController.store.form()}
                            options={{ preserveScroll: true }}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <BookFormFields
                                        errors={errors}
                                        categories={categories}
                                    />

                                    <div className="flex items-center gap-3">
                                        <Button disabled={processing}>
                                            Simpan buku
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

CreateBook.layout = {
    breadcrumbs: [
        { title: 'Buku', href: BookController.index() },
        { title: 'Tambah', href: BookController.create() },
    ],
};
