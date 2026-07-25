import { ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

type Picked = { id: number; file: File; url: string };

/**
 * Controlled multi-image picker. Two inputs by design:
 *  - a `picker` the user interacts with (its value is cleared after each pick so
 *    the same file can be chosen again);
 *  - a hidden `accumulator` named `photos[]` that the Inertia <Form> serialises;
 *    its FileList is rebuilt from React state via DataTransfer on every change
 *    and is never cleared (clearing a file input's value wipes its FileList).
 *
 * The accumulator is synced synchronously inside each handler — not in an effect
 * — so it always holds every file before a submit can run.
 */
export default function MultiImageInput({
    name = 'photos[]',
    max = 8,
}: {
    name?: string;
    max?: number;
}) {
    const [items, setItems] = useState<Picked[]>([]);
    const accumulatorRef = useRef<HTMLInputElement>(null);
    const pickerRef = useRef<HTMLInputElement>(null);
    const nextId = useRef(0);

    const syncAccumulator = (list: Picked[]) => {
        if (!accumulatorRef.current) {
            return;
        }

        const dataTransfer = new DataTransfer();
        list.forEach((item) => dataTransfer.items.add(item.file));
        accumulatorRef.current.files = dataTransfer.files;
    };

    const addFiles = (incoming: FileList | null) => {
        if (!incoming || incoming.length === 0) {
            return;
        }

        const room = Math.max(0, max - items.length);
        const added = Array.from(incoming)
            .slice(0, room)
            .map((file) => ({
                id: nextId.current++,
                file,
                url: URL.createObjectURL(file),
            }));

        if (added.length === 0) {
            return;
        }

        const next = [...items, ...added];
        setItems(next);
        syncAccumulator(next);
    };

    const removeItem = (id: number) => {
        const target = items.find((item) => item.id === id);
        if (target) {
            URL.revokeObjectURL(target.url);
        }

        const next = items.filter((item) => item.id !== id);
        setItems(next);
        syncAccumulator(next);
    };

    return (
        <div className="space-y-3">
            <input
                ref={accumulatorRef}
                type="file"
                name={name}
                multiple
                hidden
            />

            <input
                ref={pickerRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = '';
                }}
            />

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={items.length >= max}
                    onClick={() => pickerRef.current?.click()}
                >
                    <ImagePlus className="size-4" />
                    Tambah foto
                </Button>
                <span className="text-xs text-muted-foreground">
                    {items.length}/{max}
                </span>
            </div>

            {items.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                        <div key={item.id} className="relative">
                            <img
                                src={item.url}
                                alt="Pratinjau"
                                className="size-20 rounded-md border object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-0.5 text-white shadow"
                                aria-label="Hapus foto"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
