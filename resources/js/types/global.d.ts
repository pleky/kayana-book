import type { Auth } from '@/types/auth';
import type { BookCategory } from '@/types/book';

/** Props shared with every Inertia page via HandleInertiaRequests::share. */
export type SharedProps = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    cartCount: number;
    navCategories: BookCategory[];
    flash?: { success?: string | null; error?: string | null };
};

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: SharedProps & {
            [key: string]: unknown;
        };
    }
}
