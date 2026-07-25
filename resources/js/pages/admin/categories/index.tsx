import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Form, Head, router } from '@inertiajs/react';
import { ChevronRight, GripVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import AdminCategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import CategoryFormFields from '@/components/admin/category-form-fields';
import { useConfirm } from '@/components/confirm-dialog';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useFlashToasts } from '@/hooks/use-flash-toasts';
import { cn } from '@/lib/utils';
import type { BookCategory } from '@/types';

type Editing =
    | { type: 'create-root' }
    | { type: 'add-sub'; parentId: number }
    | { type: 'edit'; id: number }
    | null;

type HandleProps = Record<string, unknown>;

function SortableRow({
    id,
    disabled,
    children,
}: {
    id: number;
    disabled?: boolean;
    children: (handle: HandleProps | null) => ReactNode;
}) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
        useSortable({ id, disabled });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn('relative', isDragging && 'z-10 opacity-60')}
        >
            {children(disabled ? null : { ...attributes, ...listeners })}
        </div>
    );
}

function DragHandle({ handle }: { handle: HandleProps | null }) {
    if (!handle) {
        return <span className="w-1" />;
    }

    return (
        <button
            type="button"
            aria-label="Seret untuk mengurutkan"
            className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
            {...handle}
        >
            <GripVertical className="size-4" />
        </button>
    );
}

export default function Categories({
    categories,
}: {
    categories: BookCategory[];
}) {
    useFlashToasts();
    const confirm = useConfirm();
    const [editing, setEditing] = useState<Editing>(null);
    const [query, setQuery] = useState('');
    const [openIds, setOpenIds] = useState<Set<number>>(new Set());

    const seedRoots = (list: BookCategory[]) =>
        list.filter((c) => !c.parent_id);
    const seedChildren = (list: BookCategory[]) => {
        const map: Record<number, BookCategory[]> = {};
        list.filter((c) => c.parent_id).forEach((c) => {
            (map[c.parent_id as number] ??= []).push(c);
        });

        return map;
    };

    const [roots, setRoots] = useState<BookCategory[]>(() =>
        seedRoots(categories),
    );
    const [childrenMap, setChildrenMap] = useState<
        Record<number, BookCategory[]>
    >(() => seedChildren(categories));

    useEffect(() => {
        setRoots(seedRoots(categories));
        setChildrenMap(seedChildren(categories));
    }, [categories]);

    const normalized = query.trim().toLowerCase();
    const isFiltering = normalized !== '';
    const matches = (name: string) => name.toLowerCase().includes(normalized);

    // Roots to render + which children to show, given the current search.
    const visible = useMemo(() => {
        return roots
            .map((root) => {
                const children = childrenMap[root.id] ?? [];
                if (!isFiltering) {
                    return { root, children, show: true };
                }
                const rootMatch = matches(root.name);
                const childMatches = children.filter((c) => matches(c.name));

                return {
                    root,
                    children: rootMatch ? children : childMatches,
                    show: rootMatch || childMatches.length > 0,
                };
            })
            .filter((entry) => entry.show);
    }, [roots, childrenMap, isFiltering, normalized]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const persistOrder = (ids: number[]) => {
        router.post(
            AdminCategoryController.reorder().url,
            { ids },
            { preserveScroll: true },
        );
    };

    const onRootDragEnd = ({ active, over }: DragEndEvent) => {
        if (isFiltering || !over || active.id === over.id) {
            return;
        }
        const oldIndex = roots.findIndex((r) => r.id === active.id);
        const newIndex = roots.findIndex((r) => r.id === over.id);
        const next = arrayMove(roots, oldIndex, newIndex);
        setRoots(next);
        persistOrder(next.map((r) => r.id));
    };

    const onChildDragEnd =
        (parentId: number) =>
        ({ active, over }: DragEndEvent) => {
            if (isFiltering || !over || active.id === over.id) {
                return;
            }
            const list = childrenMap[parentId] ?? [];
            const oldIndex = list.findIndex((c) => c.id === active.id);
            const newIndex = list.findIndex((c) => c.id === over.id);
            const next = arrayMove(list, oldIndex, newIndex);
            setChildrenMap({ ...childrenMap, [parentId]: next });
            persistOrder(next.map((c) => c.id));
        };

    const removeCategory = async (category: BookCategory) => {
        if (
            await confirm({
                title: 'Hapus kategori',
                description: `Hapus kategori "${category.name}"? Sub-kategori & buku akan dilepas.`,
                destructive: true,
                confirmLabel: 'Hapus',
            })
        ) {
            router.delete(AdminCategoryController.destroy(category.slug!).url, {
                preserveScroll: true,
            });
        }
    };

    const close = () => setEditing(null);

    const toggleOpen = (id: number) => {
        setOpenIds((current) => {
            const next = new Set(current);
            next.has(id) ? next.delete(id) : next.add(id);

            return next;
        });
    };

    const createForm = (lockedParentId?: number) => (
        <Form
            {...AdminCategoryController.store.form()}
            options={{ preserveScroll: true }}
            onSuccess={close}
            resetOnSuccess
            className="space-y-4"
        >
            {({ processing, errors }) => (
                <>
                    <CategoryFormFields
                        errors={errors}
                        parents={roots}
                        lockedParentId={lockedParentId}
                    />
                    <div className="flex gap-2">
                        <Button size="sm" disabled={processing}>
                            Simpan
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={close}
                        >
                            Batal
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );

    const editForm = (category: BookCategory) => (
        <Form
            {...AdminCategoryController.update.form(category.slug!)}
            options={{ preserveScroll: true }}
            onSuccess={close}
            className="space-y-4"
        >
            {({ processing, errors }) => (
                <>
                    <CategoryFormFields
                        errors={errors}
                        parents={roots.filter((r) => r.id !== category.id)}
                        category={category}
                    />
                    <div className="flex gap-2">
                        <Button size="sm" disabled={processing}>
                            Simpan perubahan
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={close}
                        >
                            Batal
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );

    const rowActions = (category: BookCategory, addSub?: boolean) => (
        <div className="flex shrink-0 items-center gap-0.5">
            {addSub && (
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Tambah sub-kategori"
                    className="size-7"
                    onClick={() =>
                        setEditing({ type: 'add-sub', parentId: category.id })
                    }
                >
                    <Plus className="size-4" />
                </Button>
            )}
            <Button
                variant="ghost"
                size="icon"
                aria-label="Edit"
                className="size-7"
                onClick={() => setEditing({ type: 'edit', id: category.id })}
            >
                <Pencil className="size-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                aria-label="Hapus"
                className="size-7 text-destructive"
                onClick={() => removeCategory(category)}
            >
                <Trash2 className="size-4" />
            </Button>
        </div>
    );

    const countBadge = (category: BookCategory) => (
        <Badge variant="secondary">{category.books_count ?? 0} buku</Badge>
    );

    return (
        <>
            <Head title="Kategori" />

            <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Kategori"
                        description="Kelola genre buku — seret untuk urutkan (maks. 2 tingkat)."
                    />
                    {editing?.type !== 'create-root' && (
                        <Button
                            onClick={() => setEditing({ type: 'create-root' })}
                        >
                            <Plus className="size-4" />
                            Tambah Kategori
                        </Button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari kategori…"
                        className="pl-9"
                    />
                </div>

                {visible.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
                        {isFiltering
                            ? 'Kategori tak ditemukan.'
                            : 'Belum ada kategori.'}
                    </p>
                )}

                {visible.length > 0 && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onRootDragEnd}
                    >
                        <SortableContext
                            items={visible.map((v) => v.root.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                                {visible.map(({ root, children }) => {
                                    const open =
                                        isFiltering || openIds.has(root.id);
                                    const hasBody = children.length > 0;

                                    return (
                                        <SortableRow
                                            key={root.id}
                                            id={root.id}
                                            disabled={isFiltering}
                                        >
                                            {(handle) => (
                                                <Collapsible open={open}>
                                                    <div className="flex items-center gap-1.5 px-2 py-1.5 transition-colors hover:bg-accent/40">
                                                        <DragHandle
                                                            handle={handle}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                !isFiltering &&
                                                                toggleOpen(
                                                                    root.id,
                                                                )
                                                            }
                                                            className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                                                        >
                                                            <ChevronRight
                                                                className={cn(
                                                                    'size-4 shrink-0 text-muted-foreground transition-transform',
                                                                    open &&
                                                                        'rotate-90',
                                                                    children.length ===
                                                                        0 &&
                                                                        'invisible',
                                                                )}
                                                            />
                                                            <span className="truncate text-sm font-medium text-foreground">
                                                                {root.name}
                                                            </span>
                                                            {countBadge(root)}
                                                        </button>
                                                        {rowActions(root, true)}
                                                    </div>

                                                    {hasBody && (
                                                        <CollapsibleContent>
                                                            <div className="space-y-1 bg-muted/30 px-2 py-1.5 pl-8">
                                                                <DndContext
                                                                    sensors={
                                                                        sensors
                                                                    }
                                                                    collisionDetection={
                                                                        closestCenter
                                                                    }
                                                                    onDragEnd={onChildDragEnd(
                                                                        root.id,
                                                                    )}
                                                                >
                                                                    <SortableContext
                                                                        items={children.map(
                                                                            (
                                                                                c,
                                                                            ) =>
                                                                                c.id,
                                                                        )}
                                                                        strategy={
                                                                            verticalListSortingStrategy
                                                                        }
                                                                    >
                                                                        {children.map(
                                                                            (
                                                                                child,
                                                                            ) => (
                                                                                <SortableRow
                                                                                    key={
                                                                                        child.id
                                                                                    }
                                                                                    id={
                                                                                        child.id
                                                                                    }
                                                                                    disabled={
                                                                                        isFiltering
                                                                                    }
                                                                                >
                                                                                    {(
                                                                                        handle,
                                                                                    ) => (
                                                                                        <div className="flex items-center gap-1.5 rounded-md px-1 py-1 transition-colors hover:bg-accent/40">
                                                                                            <DragHandle
                                                                                                handle={
                                                                                                    handle
                                                                                                }
                                                                                            />
                                                                                            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                                                                                {
                                                                                                    child.name
                                                                                                }
                                                                                            </span>
                                                                                            {countBadge(
                                                                                                child,
                                                                                            )}
                                                                                            {rowActions(
                                                                                                child,
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </SortableRow>
                                                                            ),
                                                                        )}
                                                                    </SortableContext>
                                                                </DndContext>
                                                            </div>
                                                        </CollapsibleContent>
                                                    )}
                                                </Collapsible>
                                            )}
                                        </SortableRow>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}

                <Dialog
                    open={editing !== null}
                    onOpenChange={(o) => {
                        if (!o) {
                            close();
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editing?.type === 'edit'
                                    ? 'Edit kategori'
                                    : editing?.type === 'add-sub'
                                      ? 'Tambah sub-kategori'
                                      : 'Tambah kategori'}
                            </DialogTitle>
                        </DialogHeader>
                        {editing?.type === 'edit'
                            ? (() => {
                                  const cat = categories.find(
                                      (c) => c.id === editing.id,
                                  );

                                  return cat ? editForm(cat) : null;
                              })()
                            : editing?.type === 'add-sub'
                              ? createForm(editing.parentId)
                              : editing?.type === 'create-root'
                                ? createForm()
                                : null}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

Categories.layout = {
    breadcrumbs: [{ title: 'Kategori', href: AdminCategoryController.index() }],
};
