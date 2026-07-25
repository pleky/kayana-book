import { router } from '@inertiajs/react';
import { Check, ChevronDown } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BookCategory } from '@/types';

export type CatalogFiltersValue = {
    search?: string;
    category?: string;
    tag?: string;
    language?: string;
    audience?: string;
    condition?: string;
    min_price?: string;
    max_price?: string;
    sort?: string;
};

const CONDITIONS: { value: string; label: string }[] = [
    { value: 'like_new', label: 'Seperti baru' },
    { value: 'good', label: 'Bagus' },
    { value: 'fair', label: 'Cukup' },
    { value: 'poor', label: 'Kurang' },
];

const LANGUAGES: { value: string; label: string }[] = [
    { value: 'id', label: 'Indonesia' },
    { value: 'en', label: 'Inggris' },
    { value: 'lainnya', label: 'Lainnya' },
];

const AUDIENCES: { value: string; label: string }[] = [
    { value: 'umum', label: 'Umum' },
    { value: 'anak', label: 'Anak' },
    { value: 'remaja', label: 'Remaja' },
    { value: 'dewasa', label: 'Dewasa' },
];

function clean(params: CatalogFiltersValue): Record<string, string> {
    return Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) => value !== undefined && value !== null && value !== '',
        ),
    ) as Record<string, string>;
}

function Section({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(true);

    return (
        <div className="border-b border-border py-3 last:border-0">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
            >
                {title}
                <ChevronDown
                    className={cn(
                        'size-4 text-muted-foreground transition-transform',
                        !open && '-rotate-90',
                    )}
                />
            </button>
            {open && <div className="mt-2 space-y-0.5">{children}</div>}
        </div>
    );
}

function RadioSection({
    title,
    name,
    options,
    value,
    onChange,
}: {
    title: string;
    name: string;
    options: { value: string; label: string }[];
    value?: string;
    onChange: (value: string | undefined) => void;
}) {
    const rows = [{ value: '', label: 'Semua' }, ...options];

    return (
        <Section title={title}>
            {rows.map((opt) => (
                <label
                    key={opt.value || 'all'}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50"
                >
                    <input
                        type="radio"
                        name={name}
                        value={opt.value}
                        checked={(value ?? '') === opt.value}
                        onChange={() => onChange(opt.value || undefined)}
                        className="size-4 accent-primary"
                    />
                    {opt.label}
                </label>
            ))}
        </Section>
    );
}

export default function CatalogFilters({
    filters,
    categories,
    onApplied,
}: {
    filters: CatalogFiltersValue;
    categories: BookCategory[];
    onApplied?: () => void;
}) {
    const [minPrice, setMinPrice] = useState(filters.min_price ?? '');
    const [maxPrice, setMaxPrice] = useState(filters.max_price ?? '');

    const childrenOf = (id: number) =>
        categories.filter((c) => c.parent_id === id);

    // Only show the category section when a category is active, scoped to the
    // selected branch (its root + that root's children).
    const selected = categories.find((c) => c.slug === filters.category) ?? null;
    const activeRoot = selected
        ? selected.parent_id
            ? (categories.find((c) => c.id === selected.parent_id) ?? selected)
            : selected
        : null;

    const apply = (next: CatalogFiltersValue) => {
        router.get(
            CatalogController.index().url,
            clean({ ...filters, ...next }),
            { preserveScroll: true, preserveState: true, replace: true },
        );
        onApplied?.();
    };

    // Toggle a single-value filter: pick it, or clear it if already active.
    const toggle = (key: keyof CatalogFiltersValue, value: string) =>
        apply({ [key]: filters[key] === value ? undefined : value });

    const OptionRow = ({
        active,
        onClick,
        children,
        indent,
    }: {
        active: boolean;
        onClick: () => void;
        children: ReactNode;
        indent?: boolean;
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/50',
                indent && 'pl-4',
                active
                    ? 'font-medium text-primary'
                    : 'text-foreground',
            )}
        >
            <Check
                className={cn(
                    'size-3.5 shrink-0 text-primary',
                    active ? 'opacity-100' : 'opacity-0',
                )}
            />
            <span className="truncate">{children}</span>
        </button>
    );

    return (
        <div className="text-sm">
            {activeRoot && (
                <Section title="Kategori">
                    <OptionRow
                        active={filters.category === activeRoot.slug}
                        onClick={() => toggle('category', activeRoot.slug!)}
                    >
                        {activeRoot.name}
                    </OptionRow>
                    {childrenOf(activeRoot.id).map((child) => (
                        <OptionRow
                            key={child.id}
                            indent
                            active={filters.category === child.slug}
                            onClick={() => toggle('category', child.slug!)}
                        >
                            {child.name}
                        </OptionRow>
                    ))}
                </Section>
            )}

            <Section title="Harga">
                <div className="space-y-2 px-1">
                    <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                            Rp
                        </span>
                        <Input
                            type="number"
                            min={0}
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            placeholder="Harga minimum"
                            className="h-9 pl-9"
                            aria-label="Harga minimum"
                        />
                    </div>
                    <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                            Rp
                        </span>
                        <Input
                            type="number"
                            min={0}
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder="Harga maksimum"
                            className="h-9 pl-9"
                            aria-label="Harga maksimum"
                        />
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                            apply({
                                min_price: minPrice || undefined,
                                max_price: maxPrice || undefined,
                            })
                        }
                    >
                        Terapkan harga
                    </Button>
                </div>
            </Section>

            <RadioSection
                title="Kondisi"
                name="condition"
                options={CONDITIONS}
                value={filters.condition}
                onChange={(v) => apply({ condition: v })}
            />

            <RadioSection
                title="Bahasa"
                name="language"
                options={LANGUAGES}
                value={filters.language}
                onChange={(v) => apply({ language: v })}
            />

            <RadioSection
                title="Segmen"
                name="audience"
                options={AUDIENCES}
                value={filters.audience}
                onChange={(v) => apply({ audience: v })}
            />

        </div>
    );
}
