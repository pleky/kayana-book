import { useState } from 'react';
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
    const [previews, setPreviews] = useState<string[]>([]);

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
                <Label htmlFor="photos">
                    Foto {book ? '(tambah foto baru)' : '*'}
                </Label>
                <input
                    id="photos"
                    name="photos[]"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        setPreviews(files.map((f) => URL.createObjectURL(f)));
                    }}
                    className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
                <InputError className="mt-1" message={errors.photos} />
                <InputError className="mt-1" message={errors['photos.0']} />
                {previews.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {previews.map((src) => (
                            <img
                                key={src}
                                src={src}
                                alt="Pratinjau"
                                className="size-20 rounded-md border object-cover"
                            />
                        ))}
                    </div>
                )}
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
                    <Label htmlFor="category_id">Kategori</Label>
                    <select
                        id="category_id"
                        name="category_id"
                        defaultValue={book?.category_id ?? ''}
                        className={selectClass}
                    >
                        <option value="">— Tanpa kategori —</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
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
                    <Label htmlFor="description">Deskripsi</Label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        defaultValue={book?.description ?? ''}
                        placeholder="Catatan kondisi, edisi, dll."
                        className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
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
