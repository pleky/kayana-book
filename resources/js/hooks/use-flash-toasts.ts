import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

type FlashProps = {
    flash?: { success?: string | null; error?: string | null };
};

/**
 * Surfaces server flash messages (success/error) as toasts. Safe to mount in
 * any layout — fires once per flash payload.
 */
export function useFlashToasts(): void {
    const { flash } = usePage<FlashProps>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);
}
