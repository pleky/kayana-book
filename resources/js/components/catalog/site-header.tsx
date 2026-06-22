import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, LayoutGrid, Search, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import CartController from '@/actions/App/Http/Controllers/CartController';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useFlashToasts } from '@/hooks/use-flash-toasts';
import { dashboard, login } from '@/routes';
import type { Auth, BookCategory } from '@/types';

type SharedProps = {
    auth: Auth;
    cartCount: number;
    navCategories: BookCategory[];
};

export default function SiteHeader() {
    const { auth, cartCount, navCategories } = usePage<SharedProps>().props;
    const [search, setSearch] = useState('');

    useFlashToasts();

    const roots = (navCategories ?? []).filter((c) => !c.parent_id);
    const childrenOf = (id: number) =>
        (navCategories ?? []).filter((c) => c.parent_id === id);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            CatalogController.index().url,
            search.trim() ? { search: search.trim() } : {},
            { preserveScroll: true },
        );
    };

    const categoryHref = (slug?: string) =>
        CatalogController.index({ query: { category: slug } });

    return (
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
                <Link
                    href={CatalogController.index()}
                    className="shrink-0 font-serif text-xl font-semibold tracking-tight text-foreground"
                >
                    Kayana<span className="text-brand">Book</span>
                </Link>

                {/* Category panel + search */}
                <div className="flex flex-1 items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="hidden shrink-0 sm:inline-flex"
                            >
                                <LayoutGrid className="size-4" />
                                Kategori
                                <ChevronDown className="size-4 opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuItem asChild>
                                <Link href={CatalogController.index()}>
                                    Semua kategori
                                </Link>
                            </DropdownMenuItem>
                            {roots.map((root) => {
                                const children = childrenOf(root.id);

                                return children.length > 0 ? (
                                    <DropdownMenuSub key={root.id}>
                                        <DropdownMenuSubTrigger>
                                            {root.name}
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={categoryHref(
                                                        root.slug,
                                                    )}
                                                >
                                                    Semua {root.name}
                                                </Link>
                                            </DropdownMenuItem>
                                            {children.map((child) => (
                                                <DropdownMenuItem
                                                    key={child.id}
                                                    asChild
                                                >
                                                    <Link
                                                        href={categoryHref(
                                                            child.slug,
                                                        )}
                                                    >
                                                        {child.name}
                                                    </Link>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                ) : (
                                    <DropdownMenuItem key={root.id} asChild>
                                        <Link href={categoryHref(root.slug)}>
                                            {root.name}
                                        </Link>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <form onSubmit={submitSearch} className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari judul / penulis…"
                            className="h-9 w-full pl-9"
                            aria-label="Cari buku"
                        />
                    </form>
                </div>

                <nav className="flex shrink-0 items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="relative"
                    >
                        <Link href={CartController.index()} aria-label="Keranjang">
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
                            <Button
                                variant="ghost"
                                asChild
                                className="hidden sm:inline-flex"
                            >
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
