import { Head, Link, router } from '@inertiajs/react';
import { Check, Copy, KeyRound, Plus, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import AdminCheckoutLinkController from '@/actions/App/Http/Controllers/Admin/CheckoutLinkController';
import CheckoutLinkController from '@/actions/App/Http/Controllers/CheckoutLinkController';
import { useConfirm } from '@/components/confirm-dialog';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CheckoutLink, Paginated } from '@/types';

function fullUrl(token: string): string {
    return `${window.location.origin}${CheckoutLinkController.show(token).url}`;
}

function statusOf(link: CheckoutLink): {
    label: string;
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
} {
    if (link.status === 'revoked') {
        return { label: 'Direvoke', variant: 'destructive' };
    }
    if (link.order && link.order.status !== 'cancelled') {
        return { label: 'Terpakai', variant: 'outline' };
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return { label: 'Kedaluwarsa', variant: 'secondary' };
    }

    return { label: 'Aktif', variant: 'default' };
}

export default function CheckoutLinksIndex({
    links,
}: {
    links: Paginated<CheckoutLink>;
}) {
    const confirm = useConfirm();
    const [copied, setCopied] = useState<number | null>(null);

    const copy = async (link: CheckoutLink) => {
        try {
            await navigator.clipboard.writeText(fullUrl(link.token));
            setCopied(link.id);
            toast.success('URL disalin');
            setTimeout(() => setCopied(null), 2000);
        } catch {
            toast.error('Gagal menyalin');
        }
    };

    return (
        <>
            <Head title="Link Bayar" />

            <div className="w-full space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Link Bayar"
                        description={`${links.total} link`}
                    />
                    <Button asChild>
                        <Link href={AdminCheckoutLinkController.create()}>
                            <Plus className="size-4" />
                            Buat link
                        </Link>
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="p-3 font-medium">Label</th>
                                <th className="p-3 font-medium">Buku</th>
                                <th className="p-3 font-medium">Kirim</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3 font-medium">Expiry</th>
                                <th className="p-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {links.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="p-6 text-center text-muted-foreground"
                                    >
                                        Belum ada link.
                                    </td>
                                </tr>
                            )}
                            {links.data.map((link) => {
                                const status = statusOf(link);

                                return (
                                    <tr
                                        key={link.id}
                                        className="border-b border-border last:border-0"
                                    >
                                        <td className="p-3">
                                            {link.label ?? (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                            {link.order?.track_token && (
                                                <a
                                                    href={`/lacak/${link.order.track_token}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-xs text-primary hover:underline"
                                                >
                                                    Pesanan #{link.order.id}
                                                </a>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {link.books_count ?? 0}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {link.shipping_mode === 'admin_set'
                                                ? 'Kirim'
                                                : 'Ambil'}
                                        </td>
                                        <td className="p-3">
                                            <Badge variant={status.variant}>
                                                {status.label}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {link.expires_at
                                                ? new Date(
                                                      link.expires_at,
                                                  ).toLocaleDateString('id-ID')
                                                : '—'}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copy(link)}
                                                    aria-label="Salin URL"
                                                >
                                                    {copied === link.id ? (
                                                        <Check className="size-4" />
                                                    ) : (
                                                        <Copy className="size-4" />
                                                    )}
                                                </Button>
                                                {link.status === 'active' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label="Token baru"
                                                        onClick={async () => {
                                                            if (
                                                                await confirm({
                                                                    description:
                                                                        'Buat token baru? URL lama langsung mati.',
                                                                })
                                                            ) {
                                                                router.post(
                                                                    AdminCheckoutLinkController.regenerate(
                                                                        link.token,
                                                                    ).url,
                                                                    {},
                                                                    {
                                                                        preserveScroll:
                                                                            true,
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <KeyRound className="size-4" />
                                                    </Button>
                                                )}
                                                {link.status === 'active' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label="Revoke"
                                                        onClick={async () => {
                                                            if (
                                                                await confirm({
                                                                    description:
                                                                        'Revoke link? Buku kembali ke katalog.',
                                                                })
                                                            ) {
                                                                router.post(
                                                                    AdminCheckoutLinkController.revoke(
                                                                        link.token,
                                                                    ).url,
                                                                    {},
                                                                    {
                                                                        preserveScroll:
                                                                            true,
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <XCircle className="size-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label="Hapus"
                                                    onClick={async () => {
                                                        if (
                                                            await confirm({
                                                                title: 'Hapus link',
                                                                description:
                                                                    'Hapus link ini? Buku kembali ke katalog.',
                                                                confirmLabel:
                                                                    'Hapus',
                                                            })
                                                        ) {
                                                            router.delete(
                                                                AdminCheckoutLinkController.destroy(
                                                                    link.token,
                                                                ).url,
                                                                {
                                                                    preserveScroll:
                                                                        true,
                                                                },
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

CheckoutLinksIndex.layout = {
    breadcrumbs: [
        { title: 'Link Bayar', href: AdminCheckoutLinkController.index() },
    ],
};
