import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AddressController from '@/actions/App/Http/Controllers/Settings/AddressController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToasts } from '@/hooks/use-flash-toasts';
import type { UserAddress } from '@/types';

type Errors = Partial<Record<string, string>>;

function AddressForm({
    address,
    onDone,
}: {
    address?: UserAddress;
    onDone?: () => void;
}) {
    const action = address
        ? AddressController.update.form(address.id)
        : AddressController.store.form();

    return (
        <Form
            {...action}
            options={{ preserveScroll: true }}
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

export default function Addresses({ addresses }: { addresses: UserAddress[] }) {
    useFlashToasts();
    const [editingId, setEditingId] = useState<number | null>(null);

    return (
        <>
            <Head title="Alamat" />
            <h1 className="sr-only">Alamat pengiriman</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Alamat"
                    description="Kelola alamat pengiriman tersimpan."
                />

                {addresses.length > 0 && (
                    <ul className="space-y-3">
                        {addresses.map((address) => (
                            <li
                                key={address.id}
                                className="rounded-xl border border-border bg-card p-4"
                            >
                                {editingId === address.id ? (
                                    <AddressForm
                                        address={address}
                                        onDone={() => setEditingId(null)}
                                    />
                                ) : (
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">
                                                    {address.label}
                                                </span>
                                                {address.is_default && (
                                                    <Badge variant="secondary">
                                                        Utama
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-foreground">
                                                {address.recipient_name} ·{' '}
                                                {address.recipient_phone}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {address.address_line}
                                                {address.postal_code
                                                    ? `, ${address.postal_code}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setEditingId(address.id)
                                                }
                                            >
                                                Edit
                                            </Button>
                                            {!address.is_default && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.patch(
                                                            AddressController.setDefault(
                                                                address.id,
                                                            ).url,
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    Jadikan utama
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            `Hapus alamat "${address.label}"?`,
                                                        )
                                                    ) {
                                                        router.delete(
                                                            AddressController.destroy(
                                                                address.id,
                                                            ).url,
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    }
                                                }}
                                            >
                                                Hapus
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="rounded-xl border border-dashed border-border p-4">
                    <h3 className="mb-3 font-serif text-base font-semibold text-foreground">
                        Tambah alamat baru
                    </h3>
                    <AddressForm />
                </div>
            </div>
        </>
    );
}
