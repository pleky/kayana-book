import {
    Check,
    Copy,
    CreditCard,
    PackageCheck,
    RefreshCw,
    ShoppingBag,
    Truck,
    Wallet,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { OrderEvent } from '@/types';

async function copyText(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const el = document.createElement('textarea');
            el.value = text;
            el.style.position = 'fixed';
            el.style.opacity = '0';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }

        return true;
    } catch {
        return false;
    }
}

function ResiCopy({ resi }: { resi: string }) {
    const [copied, setCopied] = useState(false);

    return (
        <div className="mt-1 flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 font-mono text-sm font-medium text-foreground">
                {resi}
            </code>
            <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Salin nomor resi"
                onClick={async () => {
                    if (await copyText(resi)) {
                        setCopied(true);
                        toast.success('Resi disalin');
                        setTimeout(() => setCopied(false), 2000);
                    } else {
                        toast.error('Gagal menyalin');
                    }
                }}
            >
                {copied ? (
                    <Check className="size-3.5" />
                ) : (
                    <Copy className="size-3.5" />
                )}
                Salin
            </Button>
        </div>
    );
}

const ICON: Record<OrderEvent['type'], LucideIcon> = {
    created: ShoppingBag,
    ongkir_set: Wallet,
    repriced: RefreshCw,
    paid: CreditCard,
    shipped: Truck,
    received: PackageCheck,
    completed: PackageCheck,
    cancelled: XCircle,
};

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const fmt = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });

export default function OrderEventList({ events }: { events: OrderEvent[] }) {
    if (events.length === 0) {
        return null;
    }

    return (
        <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 font-medium text-foreground">Riwayat pesanan</h2>
            <ol className="space-y-3 border-l border-border pl-4">
                {events.map((event) => {
                    const Icon = ICON[event.type] ?? ShoppingBag;

                    return (
                        <li key={event.id} className="relative">
                            <span className="absolute top-0.5 -left-[1.45rem] flex size-4 items-center justify-center rounded-full bg-card text-muted-foreground">
                                <Icon className="size-3.5" />
                            </span>
                            <p className="text-sm text-foreground">
                                {event.description}
                            </p>
                            {event.type === 'repriced' &&
                                event.meta?.items?.map((it, i) => (
                                    <div
                                        key={i}
                                        className="mt-0.5 text-xs text-muted-foreground"
                                    >
                                        <p className="font-medium text-foreground">
                                            {it.name}
                                        </p>
                                        {it.title_from && (
                                            <p>
                                                Judul: {it.title_from} →{' '}
                                                <span className="text-foreground">
                                                    {it.title_to}
                                                </span>
                                            </p>
                                        )}
                                        {it.price_from != null && (
                                            <p>
                                                Harga:{' '}
                                                {rupiah.format(it.price_from)} →{' '}
                                                <span className="text-foreground">
                                                    {rupiah.format(
                                                        it.price_to ?? 0,
                                                    )}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                ))}
                            {event.type === 'shipped' && event.meta?.resi && (
                                <ResiCopy resi={event.meta.resi} />
                            )}
                            <p className="text-[11px] text-muted-foreground">
                                {fmt(event.created_at)}
                            </p>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
