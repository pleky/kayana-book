import { Form } from '@inertiajs/react';
import type { VisitOptions } from '@inertiajs/core';
import { useEffect, useState } from 'react';
import AddressController from '@/actions/App/Http/Controllers/Settings/AddressController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { search as searchAddresses } from '@/routes/addresses';
import type { UserAddress } from '@/types';

type Destination = { id: number; label: string };

function useDestinationSearch(initial: Destination | null) {
    const [query, setQuery] = useState(initial?.label ?? '');
    const [results, setResults] = useState<Destination[]>([]);
    const [picked, setPicked] = useState<Destination | null>(initial);

    useEffect(() => {
        if (picked && query === picked.label) {
            return;
        }

        const timer = setTimeout(() => {
            if (query.trim().length < 3) {
                setResults([]);

                return;
            }

            fetch(searchAddresses({ query: { q: query } }).url, {
                headers: { Accept: 'application/json' },
            })
                .then((res) => res.json())
                .then((json) => setResults(json.data ?? []))
                .catch(() => setResults([]));
        }, 500);

        return () => clearTimeout(timer);
    }, [query, picked]);

    const pick = (destination: Destination) => {
        setPicked(destination);
        setQuery(destination.label);
        setResults([]);
    };

    return { query, setQuery, results, picked, pick };
}

type Errors = Partial<Record<string, string>>;

export function AddressForm({
    address,
    onDone,
    hiddenFields,
    submitOptions,
}: {
    address?: UserAddress;
    onDone?: () => void;
    hiddenFields?: Record<string, string>;
    submitOptions?: VisitOptions;
}) {
    const action = address
        ? AddressController.update.form(address.id)
        : AddressController.store.form();

    const loc = useDestinationSearch(
        address?.destination_id
            ? {
                  id: address.destination_id,
                  label: address.destination_label ?? '',
              }
            : null,
    );

    return (
        <Form
            {...action}
            options={{ preserveScroll: true, ...submitOptions }}
            onSuccess={onDone}
            resetOnSuccess={!address}
            className="grid gap-4 sm:grid-cols-2"
        >
            {({
                processing,
                errors,
            }: {
                processing: boolean;
                errors: Errors;
            }) => (
                <>
                    {hiddenFields &&
                        Object.entries(hiddenFields).map(([name, value]) => (
                            <input
                                key={name}
                                type="hidden"
                                name={name}
                                value={value}
                            />
                        ))}

                    <div className="sm:col-span-2">
                        <Label htmlFor="label">Label</Label>
                        <Input
                            id="label"
                            name="label"
                            defaultValue={address?.label ?? ''}
                            placeholder="Rumah / Kantor"
                            required
                        />
                        <InputError className="mt-1" message={errors.label} />
                    </div>

                    <div>
                        <Label htmlFor="recipient_name">Nama penerima</Label>
                        <Input
                            id="recipient_name"
                            name="recipient_name"
                            defaultValue={address?.recipient_name ?? ''}
                            required
                        />
                        <InputError
                            className="mt-1"
                            message={errors.recipient_name}
                        />
                    </div>

                    <div>
                        <Label htmlFor="recipient_phone">No. HP penerima</Label>
                        <Input
                            id="recipient_phone"
                            name="recipient_phone"
                            defaultValue={address?.recipient_phone ?? ''}
                            placeholder="08xxxxxxxxxx"
                            required
                        />
                        <InputError
                            className="mt-1"
                            message={errors.recipient_phone}
                        />
                    </div>

                    <div className="relative sm:col-span-2">
                        <Label htmlFor="destination_search">
                            Lokasi ongkir (kecamatan/desa)
                        </Label>
                        <Input
                            id="destination_search"
                            value={loc.query}
                            onChange={(e) => loc.setQuery(e.target.value)}
                            placeholder="Ketik nama kecamatan / desa…"
                            autoComplete="off"
                        />
                        {loc.results.length > 0 && (
                            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-md">
                                {loc.results.map((result) => (
                                    <li key={result.id}>
                                        <button
                                            type="button"
                                            onClick={() => loc.pick(result)}
                                            className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-accent"
                                        >
                                            {result.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {loc.picked && (
                            <>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Terpilih: {loc.picked.label}
                                </p>
                                <input
                                    type="hidden"
                                    name="destination_id"
                                    value={loc.picked.id}
                                />
                                <input
                                    type="hidden"
                                    name="destination_label"
                                    value={loc.picked.label}
                                />
                            </>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                            Untuk perhitungan ongkir otomatis. Boleh
                            dikosongkan.
                        </p>
                    </div>

                    <div className="sm:col-span-2">
                        <Label htmlFor="address_line">Alamat lengkap</Label>
                        <textarea
                            id="address_line"
                            name="address_line"
                            rows={3}
                            defaultValue={address?.address_line ?? ''}
                            placeholder="Jalan, nomor, RT/RW, kelurahan, kecamatan, kota, provinsi"
                            required
                            className="mt-1 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                        />
                        <InputError
                            className="mt-1"
                            message={errors.address_line}
                        />
                    </div>

                    <div>
                        <Label htmlFor="postal_code">Kode pos</Label>
                        <Input
                            id="postal_code"
                            name="postal_code"
                            defaultValue={address?.postal_code ?? ''}
                        />
                        <InputError
                            className="mt-1"
                            message={errors.postal_code}
                        />
                    </div>

                    <label className="flex items-center gap-2 self-end text-sm">
                        <input
                            type="checkbox"
                            name="is_default"
                            value="1"
                            defaultChecked={address?.is_default ?? false}
                            className="size-4 rounded border-input accent-primary"
                        />
                        Jadikan alamat utama
                    </label>

                    <div className="flex gap-2 sm:col-span-2">
                        <Button type="submit" disabled={processing}>
                            {address ? 'Simpan perubahan' : 'Tambah alamat'}
                        </Button>
                        {address && onDone && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onDone}
                            >
                                Batal
                            </Button>
                        )}
                    </div>
                </>
            )}
        </Form>
    );
}
