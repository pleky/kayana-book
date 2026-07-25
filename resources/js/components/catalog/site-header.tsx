import { Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    LayoutGrid,
    LogOut,
    MapPin,
    Package,
    Search,
    ShoppingCart,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import CartController from '@/actions/App/Http/Controllers/CartController';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import AddressController from '@/actions/App/Http/Controllers/Settings/AddressController';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { UserInfo } from '@/components/user-info';
import { useFlashToasts } from '@/hooks/use-flash-toasts';
import { useInitials } from '@/hooks/use-initials';
import { login, logout } from '@/routes';
import type { SharedProps } from '@/types/global';

export default function SiteHeader() {
    const { auth, cartCount, navCategories } = usePage<SharedProps>().props;
    const [search, setSearch] = useState('');
    const getInitials = useInitials();

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

                <nav className="flex shrink-0 items-center gap-4">
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
                            <ShoppingCart className="size-5" />
                            {cartCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-xs">
                                    {cartCount}
                                </Badge>
                            )}
                        </Link>
                    </Button>

                    {auth?.user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    aria-label="Akun saya"
                                >
                                    <Avatar className="size-7">
                                        <AvatarImage
                                            src={auth.user.avatar}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <UserInfo user={auth.user} showEmail />
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={OrderController.index()}>
                                        <Package className="mr-2 size-4" />
                                        Pesanan
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={ProfileController.edit()}
                                        prefetch
                                    >
                                        <UserRound className="mr-2 size-4" />
                                        Edit profil
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={AddressController.edit()}
                                        prefetch
                                    >
                                        <MapPin className="mr-2 size-4" />
                                        Alamat
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={logout()}
                                        as="button"
                                        onClick={() => router.flushAll()}
                                        className="w-full cursor-pointer"
                                        data-test="logout-button"
                                    >
                                        <LogOut className="mr-2 size-4" />
                                        Keluar
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
