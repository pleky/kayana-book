import CategoryCombobox from '@/components/admin/category-combobox';
import MoneyInput from '@/components/admin/money-input';
import MultiImageInput from '@/components/admin/multi-image-input';
import RichTextEditor from '@/components/admin/rich-text-editor';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Book, BookCategory } from '@/types';

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

type Errors = Partial<Record<string, string>>;

function SelectField({
    id,
    name,
    defaultValue,
    required = false,
    options,
}: {
    id: string;
    name: string;
    defaultValue: string;
    required?: boolean;
    options: { value: string; label: string }[];
}) {
    return (
        <Select name={name} defaultValue={defaultValue} required={required}>
            <SelectTrigger id={id} className="mt-1 w-full">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

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
                        autoFocus={!book}
                        defaultValue={book?.title ?? ''}
                        placeholder="cth. Laskar Pelangi"
                    />
                    <InputError className="mt-1" message={errors.title} />
                </div>

                <div>
                    <Label htmlFor="price">Harga *</Label>
                    <MoneyInput
                        id="price"
                        name="price"
                        required
                        defaultValue={book?.price}
                        placeholder="45.000"
                    />
                    <InputError className="mt-1" message={errors.price} />
                </div>

                <div>
                    <Label htmlFor="condition">Kondisi *</Label>
                    <SelectField
                        id="condition"
                        name="condition"
                        required
                        defaultValue={book?.condition ?? 'good'}
                        options={CONDITIONS}
                    />
                    <InputError className="mt-1" message={errors.condition} />
                </div>
            </div>

            {/* Photos */}
            <div>
                <Label>Foto {book ? '(tambah foto baru)' : '*'}</Label>
                <div className="mt-1">
                    <MultiImageInput max={8} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    Maksimal 8 foto, masing-masing ≤ 5 MB (JPG/PNG).
                </p>
                {Object.entries(errors)
                    .filter(
                        ([key]) =>
                            key === 'photos' || key.startsWith('photos.'),
                    )
                    .map(([key, message]) => (
                        <InputError
                            key={key}
                            className="mt-1"
                            message={message}
                        />
                    ))}
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
                    <MoneyInput
                        id="cost_price"
                        name="cost_price"
                        defaultValue={book?.cost_price}
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
                    <SelectField
                        id="language"
                        name="language"
                        defaultValue={book?.language ?? 'id'}
                        options={LANGUAGES}
                    />
                    <InputError className="mt-1" message={errors.language} />
                </div>

                <div>
                    <Label htmlFor="audience">Segmen</Label>
                    <SelectField
                        id="audience"
                        name="audience"
                        defaultValue={book?.audience ?? 'umum'}
                        options={AUDIENCES}
                    />
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
