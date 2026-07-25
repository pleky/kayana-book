import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { useConfirm } from '@/components/confirm-dialog';

/**
 * Renders nothing; warns before the user abandons a dirty form.
 *  - tab close / refresh: the native `beforeunload` (the only API browsers allow
 *    here — it is not a dialog we control, so it cannot be swapped for our own);
 *  - in-app navigation: the Inertia `before` event, limited to GET visits so the
 *    form's own submit (POST/PUT) and image mutations (PATCH/DELETE) pass freely.
 *    Since our confirm dialog is async, we cancel the visit, ask, then re-issue it.
 */
export default function UnsavedGuard({ dirty }: { dirty: boolean }) {
    const confirm = useConfirm();
    const bypass = useRef(false);

    useEffect(() => {
        if (!dirty) {
            return;
        }

        const onBeforeUnload = (event: BeforeUnloadEvent): void => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', onBeforeUnload);

        const stopListening = router.on('before', (event) => {
            const visit = event.detail.visit;

            // Hover/prefetch requests aren't real navigations — ignore them,
            // otherwise just hovering a sidebar link would trigger the prompt.
            if (visit.prefetch || visit.method !== 'get') {
                return;
            }

            if (bypass.current) {
                bypass.current = false;

                return;
            }

            event.preventDefault();

            confirm({
                title: 'Perubahan belum disimpan',
                description:
                    'Tinggalkan halaman ini? Perubahan yang belum disimpan akan hilang.',
                destructive: true,
                confirmLabel: 'Tinggalkan',
                cancelLabel: 'Tetap di sini',
            }).then((leave) => {
                if (leave) {
                    bypass.current = true;
                    router.visit(visit.url);
                }
            });
        });

        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            stopListening();
        };
    }, [dirty, confirm]);

    return null;
}
