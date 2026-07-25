import { Form, Head } from '@inertiajs/react';
import AdminCategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import CategoryFormFields from '@/components/admin/category-form-fields';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BookCategory } from '@/types';

export default function CreateCategory({
    parents,
}: {
    parents: BookCategory[];
}) {
    return (
        <>
            <Head title="Tambah Kategori" />

            <div className="mx-auto w-full max-w-lg p-4">
                <Heading title="Tambah Kategori" />

                <Card>
                    <CardContent className="pt-6">
                        <Form
                            {...AdminCategoryController.store.form()}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <CategoryFormFields
                                        errors={errors}
                                        parents={parents}
                                    />
                                    <Button disabled={processing}>
                                        Simpan
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CreateCategory.layout = {
    breadcrumbs: [
        { title: 'Kategori', href: AdminCategoryController.index() },
        { title: 'Tambah', href: AdminCategoryController.create() },
    ],
};
