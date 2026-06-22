import { Check, Clock, CreditCard, PackageCheck, ShoppingBag, Truck, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Order } from '@/types';

type Step = { label: string; at: string | null; icon: LucideIcon };

const fmt = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

export default function OrderStatusTimeline({ order }: { order: Order }) {
    if (order.status === 'cancelled') {
        const steps: Step[] = [
            { label: 'Dibuat', at: order.created_at, icon: ShoppingBag },
            { label: 'Dibatalkan', at: null, icon: XCircle },
        ];

        return <Timeline steps={steps} activeIndex={1} cancelled />;
    }

    const steps: Step[] = [
        { label: 'Dibuat', at: order.created_at, icon: ShoppingBag },
        { label: 'Dibayar', at: order.paid_at, icon: CreditCard },
    ];

    if (order.fulfillment === 'ship') {
        steps.push({ label: 'Dikirim', at: order.shipped_at, icon: Truck });
    }

    steps.push({
        label: 'Selesai',
        at: order.received_at ?? order.completed_at,
        icon: PackageCheck,
    });

    const activeIndex = steps.findIndex((s) => !s.at);

    return (
        <Timeline
            steps={steps}
            activeIndex={activeIndex === -1 ? steps.length - 1 : activeIndex}
        />
    );
}

function Timeline({
    steps,
    activeIndex,
    cancelled,
}: {
    steps: Step[];
    activeIndex: number;
    cancelled?: boolean;
}) {
    return (
        <ol className="flex">
            {steps.map((step, i) => {
                const done = !!step.at;
                const active = i === activeIndex;
                const Icon = done ? Check : step.icon;

                return (
                    <li
                        key={step.label}
                        className="relative flex flex-1 flex-col items-center text-center"
                    >
                        {/* connector lines, centered on the node row */}
                        {i > 0 && (
                            <span
                                className={cn(
                                    'absolute top-4 left-0 h-0.5 w-1/2 -translate-y-1/2',
                                    done ? 'bg-primary' : 'bg-border',
                                )}
                            />
                        )}
                        {i < steps.length - 1 && (
                            <span
                                className={cn(
                                    'absolute top-4 right-0 h-0.5 w-1/2 -translate-y-1/2',
                                    steps[i + 1].at ? 'bg-primary' : 'bg-border',
                                )}
                            />
                        )}

                        <span
                            className={cn(
                                'relative z-10 flex size-8 items-center justify-center rounded-full border-2 bg-card transition-colors',
                                cancelled && active
                                    ? 'border-destructive bg-destructive text-white'
                                    : done
                                      ? 'border-primary bg-primary text-white'
                                      : active
                                        ? 'border-primary text-primary'
                                        : 'border-border text-muted-foreground',
                            )}
                        >
                            <Icon className="size-4" />
                        </span>

                        <p
                            className={cn(
                                'mt-2 px-1 text-xs font-medium',
                                done || active
                                    ? 'text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {step.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            {fmt(step.at) ??
                                (active ? (
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="size-3" /> proses
                                    </span>
                                ) : (
                                    '—'
                                ))}
                        </p>
                    </li>
                );
            })}
        </ol>
    );
}
