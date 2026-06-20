import { Form, Head, Link } from '@inertiajs/react';
import AdminCategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BookCategory } from '@/types';

export default function Categories({
    categories,
}: {
    categories: BookCategory[];
}) {
    const roots = categories.filter((c) => !c.parent_id);
    const childrenOf = (id: number) =>
        categories.filter((c) => c.parent_id === id);

    const row = (category: BookCategory, child = false) => (
        <li
            key={category.id}
            className="flex items-center justify-between gap-3 p-3"
        >
            <div className={child ? 'pl-6' : ''}>
                <span className="font-medium">{category.name}</span>
                {child && (
                    <Badge variant="outline" className="ml-2">
                        sub
                    </Badge>
                )}
                <span className="ml-2 text-sm text-muted-foreground">
                    {category.books_count ?? 0} buku
                </span>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={AdminCategoryController.edit(category.slug!)}>
                        Edit
                    </Link>
                </Button>
                <Form
                    {...AdminCategoryController.destroy.form(category.slug!)}
                    options={{ preserveScroll: true }}
                    onBefore={() =>
                        confirm(`Hapus kategori "${category.name}"?`)
                    }
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                    >
                        Hapus
                    </Button>
                </Form>
            </div>
        </li>
    );

    return (
        <>
            <Head title="Kategori" />

            <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Kategori"
                        description="Kelola genre buku (maks. 2 tingkat)."
                    />
                    <Button asChild>
                        <Link href={AdminCategoryController.create()}>
                            Tambah Kategori
                        </Link>
                    </Button>
                </div>

                <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                    {roots.length === 0 && (
                        <li className="p-6 text-center text-muted-foreground">
                            Belum ada kategori.
                        </li>
                    )}
                    {roots.map((root) => (
                        <li key={root.id}>
                            <ul className="divide-y divide-border">
                                {row(root)}
                                {childrenOf(root.id).map((child) =>
                                    row(child, true),
                                )}
                            </ul>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}

Categories.layout = {
    breadcrumbs: [{ title: 'Kategori', href: AdminCategoryController.index() }],
};
