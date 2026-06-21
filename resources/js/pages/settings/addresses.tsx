import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AddressController from '@/actions/App/Http/Controllers/Settings/AddressController';
import { AddressForm } from '@/components/settings/address-form';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFlashToasts } from '@/hooks/use-flash-toasts';
import type { UserAddress } from '@/types';

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
