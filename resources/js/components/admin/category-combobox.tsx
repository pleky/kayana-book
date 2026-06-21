import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { BookCategory } from '@/types';

/**
 * Searchable, hierarchy-aware category picker. Renders a combobox (type to
 * filter) grouped by parent so children stay easy to find even with many
 * categories. Selection is written to a hidden `category_id` input so the
 * surrounding Inertia <Form> submits it unchanged.
 */
export default function CategoryCombobox({
    categories,
    name = 'category_id',
    defaultValue = null,
}: {
    categories: BookCategory[];
    name?: string;
    defaultValue?: number | null;
}) {
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(defaultValue);

    const byId = (id: number | null) =>
        id === null ? null : (categories.find((c) => c.id === id) ?? null);

    // Full label for a category: "Parent › Child" for a child, else its name.
    const labelOf = (cat: BookCategory) => {
        const parent = byId(cat.parent_id ?? null);

        return parent ? `${parent.name} › ${cat.name}` : cat.name;
    };

    const selected = byId(selectedId);
    const selectedLabel = selected ? labelOf(selected) : null;

    const choose = (id: number | null) => {
        setSelectedId(id);
        setOpen(false);
    };

    return (
        <>
            <input type="hidden" name={name} value={selectedId ?? ''} />

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            'mt-1 h-9 w-full justify-between font-normal',
                            !selectedLabel && 'text-muted-foreground',
                        )}
                    >
                        <span className="truncate">
                            {selectedLabel ?? 'Pilih kategori'}
                        </span>
                        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                >
                    <Command>
                        <CommandInput placeholder="Cari kategori…" />
                        <CommandList>
                            <CommandEmpty>
                                Kategori tak ditemukan.
                            </CommandEmpty>

                            <CommandGroup>
                                <CommandItem
                                    value="tanpa kategori"
                                    onSelect={() => choose(null)}
                                >
                                    <Check
                                        className={cn(
                                            selectedId === null
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    Tanpa kategori
                                </CommandItem>

                                {categories.map((cat) => (
                                    <CommandItem
                                        key={cat.id}
                                        value={`${labelOf(cat)} ${cat.id}`}
                                        onSelect={() => choose(cat.id)}
                                    >
                                        <Check
                                            className={cn(
                                                selectedId === cat.id
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                            )}
                                        />
                                        {labelOf(cat)}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </>
    );
}
