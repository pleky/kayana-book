import CategoryCombobox from '@/components/admin/category-combobox';
import MultiImageInput from '@/components/admin/multi-image-input';
import RichTextEditor from '@/components/admin/rich-text-editor';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Book, BookCategory } from '@/types';

const CONDITIONS: { value: string; label: string }[] = [
    { value: 'new', label: 'Baru' },
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

const selectClass =
    'mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none';

type Errors = Partial<Record<string, string>>;

export default function BookFormFields({
    errors,
    categories,
    book,
}: {
    errors: Errors;
    categories: BookCategory[];
    book?: Book;
}) {
    return (
        <div className="space-y-6">
            {/* Required, fast-input row */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Label htmlFor="title">Judul *</Label>
                    <Input
                        id="title"
                        name="title"
                        required
                        autoFocus
                        defaultValue={book?.title ?? ''}
                        placeholder="cth. Laskar Pelangi"
                    />
                    <InputError className="mt-1" message={errors.title} />
                </div>

                <div>
                    <Label htmlFor="price">Harga (Rp) *</Label>
                    <Input
                        id="price"
                        name="price"
                        type="number"
                        min={0}
                        required
                        defaultValue={book?.price ?? ''}
                        placeholder="45000"
                    />
                    <InputError className="mt-1" message={errors.price} />
                </div>

                <div>
                    <Label htmlFor="condition">Kondisi *</Label>
                    <select
                        id="condition"
                        name="condition"
                        required
                        defaultValue={book?.condition ?? 'good'}
                        className={selectClass}
                    >
                        {CONDITIONS.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                    <InputError className="mt-1" message={errors.condition} />
                </div>
            </div>

            {/* Photos */}
            <div>
                <Label>Foto {book ? '(tambah foto baru)' : '*'}</Label>
                <div className="mt-1">
                    <MultiImageInput max={8} />
                </div>
                <InputError className="mt-1" message={errors.photos} />
                <InputError className="mt-1" message={errors['photos.0']} />
            </div>

            {/* Optional details */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <Label htmlFor="author">Penulis</Label>
                    <Input
                        id="author"
                        name="author"
                        defaultValue={book?.author ?? ''}
                        placeholder="Andrea Hirata"
                    />
                    <InputError className="mt-1" message={errors.author} />
                </div>

                <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                        id="isbn"
                        name="isbn"
                        defaultValue={book?.isbn ?? ''}
                    />
                    <InputError className="mt-1" message={errors.isbn} />
                </div>

                <div>
                    <Label>Kategori</Label>
                    <CategoryCombobox
                        categories={categories}
                        defaultValue={book?.category_id ?? null}
                    />
                    <InputError className="mt-1" message={errors.category_id} />
                </div>

                <div>
                    <Label htmlFor="cost_price">Harga modal (privat)</Label>
                    <Input
                        id="cost_price"
                        name="cost_price"
                        type="number"
                        min={0}
                        defaultValue={book?.cost_price ?? ''}
                        placeholder="opsional"
                    />
                    <InputError className="mt-1" message={errors.cost_price} />
                </div>

                <div>
                    <Label htmlFor="weight_grams">Berat (gram)</Label>
                    <Input
                        id="weight_grams"
                        name="weight_grams"
                        type="number"
                        min={1}
                        defaultValue={book?.weight_grams ?? ''}
                        placeholder="cth. 300 — untuk ongkir"
                    />
                    <InputError
                        className="mt-1"
                        message={errors.weight_grams}
                    />
                </div>

                <div>
                    <Label htmlFor="language">Bahasa</Label>
                    <select
                        id="language"
                        name="language"
                        defaultValue={book?.language ?? 'id'}
                        className={selectClass}
                    >
                        {LANGUAGES.map((l) => (
                            <option key={l.value} value={l.value}>
                                {l.label}
                            </option>
                        ))}
                    </select>
                    <InputError className="mt-1" message={errors.language} />
                </div>

                <div>
                    <Label htmlFor="audience">Segmen</Label>
                    <select
                        id="audience"
                        name="audience"
                        defaultValue={book?.audience ?? 'umum'}
                        className={selectClass}
                    >
                        {AUDIENCES.map((a) => (
                            <option key={a.value} value={a.value}>
                                {a.label}
                            </option>
                        ))}
                    </select>
                    <InputError className="mt-1" message={errors.audience} />
                </div>

                <div className="sm:col-span-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                        id="tags"
                        name="tags"
                        defaultValue={
                            book?.tags?.map((t) => t.name).join(', ') ?? ''
                        }
                        placeholder="langka, edisi pertama (pisahkan dengan koma)"
                    />
                    <InputError className="mt-1" message={errors.tags} />
                </div>

                <div className="sm:col-span-2">
                    <Label>Deskripsi</Label>
                    <RichTextEditor
                        name="description"
                        defaultValue={book?.description ?? ''}
                    />
                    <InputError className="mt-1" message={errors.description} />
                </div>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        name="is_new"
                        value="1"
                        defaultChecked={book?.is_new ?? false}
                        className="size-4 rounded border-input"
                    />
                    Buku baru (bukan bekas)
                </label>
            </div>
        </div>
    );
}
