import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BookCategory } from '@/types';

const selectClass =
    'mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none';

type Errors = Partial<Record<string, string>>;

export default function CategoryFormFields({
    errors,
    parents,
    category,
    lockedParentId,
}: {
    errors: Errors;
    parents: BookCategory[];
    category?: BookCategory;
    lockedParentId?: number | null;
}) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="name">Nama *</Label>
                <Input
                    id="name"
                    name="name"
                    required
                    autoFocus
                    defaultValue={category?.name ?? ''}
                    placeholder="cth. Novel"
                />
                <InputError className="mt-1" message={errors.name} />
            </div>

            {lockedParentId != null ? (
                <input type="hidden" name="parent_id" value={lockedParentId} />
            ) : (
                <div>
                    <Label htmlFor="parent_id">Kategori induk</Label>
                    <select
                        id="parent_id"
                        name="parent_id"
                        defaultValue={category?.parent_id ?? ''}
                        className={selectClass}
                    >
                        <option value="">— Tingkat atas —</option>
                        {parents.map((parent) => (
                            <option key={parent.id} value={parent.id}>
                                {parent.name}
                            </option>
                        ))}
                    </select>
                    <InputError className="mt-1" message={errors.parent_id} />
                </div>
            )}

            <div>
                <Label htmlFor="sort_order">Urutan</Label>
                <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    min={0}
                    defaultValue={category?.sort_order ?? 0}
                />
                <InputError className="mt-1" message={errors.sort_order} />
            </div>
        </div>
    );
}
