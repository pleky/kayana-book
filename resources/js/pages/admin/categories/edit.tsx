import { Form, Head } from '@inertiajs/react';
import AdminCategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import CategoryFormFields from '@/components/admin/category-form-fields';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BookCategory } from '@/types';

export default function EditCategory({
    category,
    parents,
}: {
    category: BookCategory;
    parents: BookCategory[];
}) {
    return (
        <>
            <Head title={`Edit: ${category.name}`} />

            <div className="mx-auto w-full max-w-lg p-4">
                <Heading title="Edit Kategori" description={category.name} />

                <Card>
                    <CardContent className="pt-6">
                        <Form
                            {...AdminCategoryController.update.form(
                                category.slug!,
                            )}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <CategoryFormFields
                                        errors={errors}
                                        parents={parents}
                                        category={category}
                                    />
                                    <Button disabled={processing}>
                                        Simpan perubahan
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

EditCategory.layout = {
    breadcrumbs: [
        { title: 'Kategori', href: AdminCategoryController.index() },
        { title: 'Edit', href: AdminCategoryController.index() },
    ],
};
