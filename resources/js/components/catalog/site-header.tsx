import { Link, usePage } from '@inertiajs/react';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import { Button } from '@/components/ui/button';
import { dashboard, home, login } from '@/routes';
import type { Auth } from '@/types';

export default function SiteHeader() {
    const { auth } = usePage<{ auth: Auth }>().props;

    return (
        <header className="border-b">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
                <Link
                    href={home()}
                    className="text-lg font-semibold tracking-tight"
                >
                    Kayana Book
                </Link>
                <nav className="flex items-center gap-2">
                    <Button variant="ghost" asChild>
                        <Link href={CatalogController.index()}>Katalog</Link>
                    </Button>
                    {auth?.user ? (
                        <Button asChild>
                            <Link href={dashboard()}>Dashboard</Link>
                        </Button>
                    ) : (
                        <Button asChild>
                            <Link href={login()}>Masuk</Link>
                        </Button>
                    )}
                </nav>
            </div>
        </header>
    );
}
