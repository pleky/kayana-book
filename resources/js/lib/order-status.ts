import type { OrderStatus } from '@/types';

/** Canonical, buyer-facing order status copy — used everywhere (buyer + admin). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    pending: 'Menunggu pembayaran',
    paid: 'Sedang diproses',
    shipped: 'Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
};

export const ORDER_STATUS_VARIANT: Record<
    OrderStatus,
    'default' | 'secondary' | 'outline' | 'destructive'
> = {
    pending: 'secondary',
    paid: 'default',
    shipped: 'default',
    completed: 'outline',
    cancelled: 'destructive',
};
