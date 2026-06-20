import { Link, usePage } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import CartController from '@/actions/App/Http/Controllers/CartController';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFlashToasts } from '@/hooks/use-flash-toasts';
import { dashboard, login } from '@/routes';
import type { Auth } from '@/types';

type SharedProps = {
    auth: Auth;
    cartCount: number;
};

export default function SiteHeader() {
    const { auth, cartCount } = usePage<SharedProps>().props;

    useFlashToasts();

    return (
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
                <Link
                    href={CatalogController.index()}
                    className="font-serif text-xl font-semibold tracking-tight text-foreground"
                >
                    Kayana<span className="text-brand">Book</span>
                </Link>
                <nav className="flex items-center gap-2">
                    <Button variant="ghost" asChild>
                        <Link href={CatalogController.index()}>Katalog</Link>
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="relative"
                    >
                        <Link
                            href={CartController.index()}
                            aria-label="Keranjang"
                        >
                            <ShoppingCart />
                            {cartCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-xs">
                                    {cartCount}
                                </Badge>
                            )}
                        </Link>
                    </Button>

                    {auth?.user ? (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href={OrderController.index()}>
                                    Pesanan
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={dashboard()}>Dashboard</Link>
                            </Button>
                        </>
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
