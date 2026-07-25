import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useState,
} from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type ConfirmOptions = {
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
};

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Promise-based confirmation dialog — a drop-in replacement for the native
 * `confirm()`. Usage: `if (await confirm({ title, description })) { … }`.
 */
export function useConfirm(): ConfirmFn {
    const confirm = useContext(ConfirmContext);

    if (!confirm) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }

    return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<{
        options: ConfirmOptions;
        resolve: (result: boolean) => void;
    } | null>(null);

    const confirm = useCallback<ConfirmFn>(
        (options = {}) =>
            new Promise<boolean>((resolve) => {
                setState({ options, resolve });
            }),
        [],
    );

    const close = (result: boolean) => {
        state?.resolve(result);
        setState(null);
    };

    const options = state?.options;

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            <Dialog
                open={state !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        close(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {options?.title ?? 'Konfirmasi'}
                        </DialogTitle>
                        {options?.description && (
                            <DialogDescription>
                                {options.description}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => close(false)}
                        >
                            {options?.cancelLabel ?? 'Batal'}
                        </Button>
                        <Button
                            variant={
                                options?.destructive ? 'destructive' : 'default'
                            }
                            onClick={() => close(true)}
                        >
                            {options?.confirmLabel ?? 'Ya'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ConfirmContext.Provider>
    );
}
