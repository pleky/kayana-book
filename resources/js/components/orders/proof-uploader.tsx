import { useForm } from '@inertiajs/react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useState } from 'react';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types';

/**
 * Partial multi-photo uploader for shipment proof (max remaining slots). Files
 * accumulate before submit; each submit appends server-side.
 */
export default function ProofUploader({
    order,
    remaining,
}: {
    order: Order;
    remaining: number;
}) {
    const [files, setFiles] = useState<File[]>([]);
    const form = useForm<{ photos: File[] }>({ photos: [] });

    const add = (incoming: FileList | null) => {
        if (!incoming) {
            return;
        }
        const next = [...files, ...Array.from(incoming)].slice(0, remaining);
        setFiles(next);
        form.setData('photos', next);
    };

    const removeAt = (index: number) => {
        const next = files.filter((_, i) => i !== index);
        setFiles(next);
        form.setData('photos', next);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) {
            return;
        }
        form.post(OrderController.uploadProofs(order.id).url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setFiles([]);
                form.reset();
            },
        });
    };

    if (remaining < 1) {
        return null;
    }

    return (
        <form onSubmit={submit} className="space-y-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent/50">
                <ImagePlus className="size-4" />
                Tambah foto
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                        add(e.target.files);
                        e.target.value = '';
                    }}
                />
            </label>
            <span className="ml-2 text-xs text-muted-foreground">
                sisa {remaining} foto
            </span>
            <InputError message={form.errors.photos} />

            {files.length > 0 && (
                <>
                    <div className="flex flex-wrap gap-2">
                        {files.map((file, i) => (
                            <div key={i} className="relative">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt="Pratinjau bukti"
                                    className="size-20 rounded-md border border-border object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeAt(i)}
                                    className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-0.5 text-white"
                                    aria-label="Hapus"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button type="submit" size="sm" disabled={form.processing}>
                        <Upload className="size-4" />
                        {form.processing ? 'Mengunggah…' : 'Unggah bukti'}
                    </Button>
                </>
            )}
        </form>
    );
}
