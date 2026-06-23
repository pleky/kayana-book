import { Head, Link } from '@inertiajs/react';
import {
    Atom,
    Baby,
    BookHeart,
    BookOpen,
    BookText,
    Brain,
    Briefcase,
    Camera,
    Clock,
    GraduationCap,
    Instagram,
    Landmark,
    Languages,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Rocket,
    ScrollText,
    Search,
    ShieldCheck,
    Sparkles,
    Sprout,
    UserRound,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import SiteHeader from '@/components/catalog/site-header';
import { Reveal } from '@/components/motion/reveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BOOK_CONDITION_LABEL as CONDITION_LABEL } from '@/lib/book-labels';
import { rupiah } from '@/lib/format';
import type { Book, BookCategory } from '@/types';

type Store = {
    name: string;
    tagline: string;
    address: string;
    hours: string;
    phone: string;
    whatsapp: string;
    email: string;
    instagram: string;
    maps_url: string;
    gallery: string[];
};

const TRUST = [
    {
        icon: Camera,
        title: 'Foto kondisi asli',
        body: 'Setiap buku difoto apa adanya — kamu tahu persis kondisi sebelum beli.',
    },
    {
        icon: ShieldCheck,
        title: 'Stok unik, anti rebutan',
        body: 'Tiap buku satu eksemplar. Begitu masuk keranjang & checkout, ia jadi milikmu.',
    },
    {
        icon: Wallet,
        title: 'Bayar gampang',
        body: 'Checkout, bayar via gateway atau transfer, pesanan langsung tercatat rapi.',
    },
];

const CHIP = [
    'bg-brand/15 text-brand',
    'bg-sky/15 text-sky',
    'bg-primary/10 text-primary',
];

const MOTIF = [
    'aspect-3/4 bg-primary/15',
    'mt-8 aspect-3/4 bg-brand/25',
    'aspect-3/4 bg-sky/20',
    'mt-6 aspect-3/4 bg-secondary',
    'aspect-3/4 bg-brand/20',
    'mt-10 aspect-3/4 bg-primary/15',
];

const CATEGORY_ICON: Record<string, LucideIcon> = {
    novel: BookText,
    sastra: ScrollText,
    'fantasi-sci-fi': Rocket,
    'misteri-thriller': Search,
    'komik-manga': Sparkles,
    biografi: UserRound,
    sejarah: Landmark,
    'pengembangan-diri': Sprout,
    'bisnis-ekonomi': Briefcase,
    'agama-religi': BookHeart,
    'sains-teknologi': Atom,
    'psikologi-filsafat': Brain,
    'buku-pelajaran-kuliah': GraduationCap,
    'kamus-bahasa': Languages,
    'buku-anak': Baby,
};

export default function Welcome({
    categories,
    latestBooks,
    store,
}: {
    categories: BookCategory[];
    latestBooks: Book[];
    store: Store;
}) {
    const progressRef = useRef<HTMLDivElement>(null);
    const parallaxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const reduce = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        const coarse = window.matchMedia('(pointer: coarse)').matches;

        let ticking = false;
        const onScroll = () => {
            if (ticking) {
                return;
            }

            ticking = true;
            requestAnimationFrame(() => {
                const doc = document.documentElement;
                const max = doc.scrollHeight - doc.clientHeight;
                const ratio = max > 0 ? doc.scrollTop / max : 0;
                progressRef.current?.style.setProperty('--scroll', `${ratio}`);

                if (!reduce && !coarse && parallaxRef.current) {
                    parallaxRef.current.style.transform = `translateY(${doc.scrollTop * -0.08}px)`;
                }

                ticking = false;
            });
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const waLink = store.whatsapp
        ? `https://wa.me/${store.whatsapp.replace(/[^0-9]/g, '')}`
        : null;
    const igHandle = store.instagram.replace('@', '');
    const igLink = igHandle ? `https://instagram.com/${igHandle}` : null;
    const hasStoreInfo = Boolean(
        store.address || store.maps_url || waLink || store.hours,
    );

    return (
        <div className="min-h-screen bg-background">
            <Head title={`${store.name} — ${store.tagline}`} />

            <div
                ref={progressRef}
                aria-hidden="true"
                className="scroll-progress fixed inset-x-0 top-0 z-50 h-0.5 bg-brand"
            />

            <SiteHeader />

            <main>
                {/* ---------- Hero ---------- */}
                <section className="relative overflow-hidden">
                    <div
                        aria-hidden="true"
                        className="animate-drift pointer-events-none absolute -top-24 -right-24 size-[28rem] rounded-full bg-brand/25 blur-3xl"
                    />
                    <div
                        aria-hidden="true"
                        className="animate-drift pointer-events-none absolute top-40 -left-32 size-80 rounded-full bg-sky/25 blur-3xl"
                        style={{ animationDelay: '-6s' }}
                    />
                    <div
                        aria-hidden="true"
                        className="animate-drift pointer-events-none absolute right-1/3 -bottom-24 size-72 rounded-full bg-accent/40 blur-3xl"
                        style={{ animationDelay: '-12s' }}
                    />

                    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
                        <div className="space-y-6">
                            <Reveal delay={50}>
                                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                                    <BookOpen className="size-3.5 text-brand" />
                                    {store.tagline}
                                </span>
                            </Reveal>

                            <h1 className="font-serif text-4xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                                <span className="line-reveal block overflow-hidden pb-1">
                                    <span
                                        style={
                                            {
                                                '--line-delay': '120ms',
                                            } as CSSProperties
                                        }
                                    >
                                        Buku bercerita,
                                    </span>
                                </span>
                                <span className="line-reveal block overflow-hidden pb-1">
                                    <span
                                        className="bg-gradient-to-r from-brand via-primary to-sky bg-clip-text text-transparent"
                                        style={
                                            {
                                                '--line-delay': '260ms',
                                            } as CSSProperties
                                        }
                                    >
                                        menunggu pembaca baru.
                                    </span>
                                </span>
                            </h1>

                            <Reveal delay={420}>
                                <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                                    Telusuri ratusan judul pilihan dengan
                                    kondisi jujur dan harga ramah — online
                                    maupun langsung di toko kami.
                                </p>
                            </Reveal>

                            <Reveal delay={560}>
                                <div className="flex flex-wrap gap-3">
                                    <Button size="lg" asChild>
                                        <Link href={CatalogController.index()}>
                                            Jelajahi katalog
                                        </Link>
                                    </Button>
                                    {hasStoreInfo && (
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            asChild
                                        >
                                            <a href="#toko">Kunjungi toko</a>
                                        </Button>
                                    )}
                                </div>
                            </Reveal>
                        </div>

                        <div
                            ref={parallaxRef}
                            aria-hidden="true"
                            className="relative hidden will-change-transform md:block"
                        >
                            <div className="animate-float-slow mx-auto grid max-w-sm grid-cols-3 gap-3">
                                {MOTIF.map((c, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-center rounded-lg border border-border/60 ${c}`}
                                    >
                                        <BookOpen className="size-7 text-foreground/25" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ---------- Latest books ---------- */}
                {latestBooks.length > 0 && (
                    <section className="border-t border-border/60">
                        <div className="mx-auto max-w-6xl px-4 py-16">
                            <Reveal className="mb-8 flex items-end justify-between gap-4">
                                <div>
                                    <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                                        Baru diunggah
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Lima buku terbaru yang masuk koleksi.
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={CatalogController.index()}>
                                        Lihat semua →
                                    </Link>
                                </Button>
                            </Reveal>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                {latestBooks.map((book, i) => {
                                    const cover = book.primary_image;

                                    return (
                                        <Reveal
                                            key={book.id}
                                            delay={Math.min(i, 9) * 45}
                                            className="h-full"
                                        >
                                            <Link
                                                href={CatalogController.show(
                                                    book.slug,
                                                )}
                                                className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
                                            >
                                                <div className="relative aspect-3/4 overflow-hidden bg-muted">
                                                    {cover ? (
                                                        <img
                                                            src={`/storage/${cover.path}`}
                                                            alt={`Sampul ${book.title}`}
                                                            loading="lazy"
                                                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                                                            Tanpa foto
                                                        </div>
                                                    )}
                                                    <Badge
                                                        variant="secondary"
                                                        className="absolute top-2 left-2 backdrop-blur"
                                                    >
                                                        {
                                                            CONDITION_LABEL[
                                                                book.condition
                                                            ]
                                                        }
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                                                    <h3 className="line-clamp-2 text-sm font-medium text-foreground">
                                                        {book.title}
                                                    </h3>
                                                    {book.author && (
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {book.author}
                                                        </p>
                                                    )}
                                                    <p className="mt-auto pt-1 text-sm font-semibold text-primary">
                                                        {rupiah.format(
                                                            book.price,
                                                        )}
                                                    </p>
                                                </div>
                                            </Link>
                                        </Reveal>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ---------- Offline store ---------- */}
                {hasStoreInfo && (
                    <section
                        id="toko"
                        className="scroll-mt-20 border-t border-border/60"
                    >
                        <div className="mx-auto max-w-6xl px-4 py-16">
                            <Reveal variant="scale">
                                <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-brand/10 p-8 md:p-10">
                                    <div
                                        aria-hidden="true"
                                        className="animate-drift pointer-events-none absolute -top-16 -right-10 size-64 rounded-full bg-sky/20 blur-3xl"
                                    />
                                    <div className="relative grid gap-8 md:grid-cols-2">
                                        <div>
                                            <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">
                                                <MapPin className="size-3.5" />
                                                Toko offline
                                            </span>
                                            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground">
                                                Mampir langsung ke {store.name}
                                            </h2>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                Pilih buku sambil ngopi, tanya
                                                rekomendasi, atau ambil pesanan
                                                online-mu.
                                            </p>

                                            <dl className="mt-6 space-y-3 text-sm">
                                                {store.address && (
                                                    <div className="flex gap-3">
                                                        <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                                                        <dd className="text-foreground">
                                                            {store.address}
                                                        </dd>
                                                    </div>
                                                )}
                                                {store.hours && (
                                                    <div className="flex gap-3">
                                                        <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
                                                        <dd className="text-foreground">
                                                            {store.hours}
                                                        </dd>
                                                    </div>
                                                )}
                                                {store.phone && (
                                                    <div className="flex gap-3">
                                                        <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
                                                        <dd className="text-foreground">
                                                            {store.phone}
                                                        </dd>
                                                    </div>
                                                )}
                                            </dl>

                                            <div className="mt-6 flex flex-wrap gap-3">
                                                {waLink && (
                                                    <Button asChild>
                                                        <a
                                                            href={waLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <MessageCircle className="size-4" />
                                                            Chat WhatsApp
                                                        </a>
                                                    </Button>
                                                )}
                                                {store.maps_url && (
                                                    <Button
                                                        variant="outline"
                                                        asChild
                                                    >
                                                        <a
                                                            href={
                                                                store.maps_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <MapPin className="size-4" />
                                                            Lihat di Maps
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {store.gallery
                                                .slice(0, 4)
                                                .map((src) => (
                                                    <div
                                                        key={src}
                                                        className="aspect-square overflow-hidden rounded-xl border border-border/60"
                                                    >
                                                        <img
                                                            src={`/${src}`}
                                                            alt="Toko Kayana Book"
                                                            loading="lazy"
                                                            decoding="async"
                                                            className="size-full object-cover"
                                                        />
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                    </section>
                )}

                {/* ---------- Gallery ---------- */}
                {store.gallery.length > 0 && (
                    <section className="border-t border-border/60 bg-card/40">
                        <div className="mx-auto max-w-6xl px-4 py-16">
                            <Reveal className="mb-8">
                                <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                                    Suasana & momen di toko
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Event, transaksi, dan keseharian Kayana
                                    Book.
                                </p>
                            </Reveal>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {store.gallery.map((src, i) => (
                                    <Reveal
                                        key={src}
                                        delay={Math.min(i, 9) * 45}
                                        className="group overflow-hidden rounded-xl border border-border"
                                    >
                                        <img
                                            src={`/${src}`}
                                            alt="Galeri Kayana Book"
                                            loading="lazy"
                                            decoding="async"
                                            className="aspect-4/3 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ---------- Instagram ---------- */}
                {igLink && (
                    <section className="mx-auto max-w-6xl px-4 py-16">
                        <Reveal variant="scale">
                            <a
                                href={igLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand via-primary to-sky px-6 py-12 text-center text-white"
                            >
                                <Instagram className="size-10" />
                                <h2 className="font-serif text-2xl font-semibold sm:text-3xl">
                                    Ikuti keseharian kami di Instagram
                                </h2>
                                <p className="text-white/85">
                                    Update buku baru, kuis, & event toko —
                                    <span className="font-semibold">
                                        {' '}
                                        @{igHandle}
                                    </span>
                                </p>
                                <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-primary transition-transform group-hover:scale-105">
                                    <Instagram className="size-4" />
                                    Ikuti @{igHandle}
                                </span>
                            </a>
                        </Reveal>
                    </section>
                )}

                {/* ---------- Trust ---------- */}
                <section className="border-t border-border/60 bg-card/40">
                    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3">
                        {TRUST.map(({ icon: Icon, title, body }, i) => (
                            <Reveal
                                key={title}
                                delay={i * 120}
                                className="rounded-xl border border-border bg-card p-6"
                            >
                                <div
                                    className={`mb-4 inline-flex size-11 items-center justify-center rounded-lg ${CHIP[i % CHIP.length]}`}
                                >
                                    <Icon className="size-5" />
                                </div>
                                <h3 className="font-serif text-lg font-semibold text-foreground">
                                    {title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    {body}
                                </p>
                            </Reveal>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="border-t border-border/60">
                <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted-foreground sm:grid-cols-[1fr_auto]">
                    <div>
                        <span className="font-serif text-base font-semibold text-foreground">
                            {store.name.replace(/Book$/, '')}
                            <span className="text-brand">Book</span>
                        </span>
                        <p className="mt-1">{store.tagline}.</p>
                        {store.address && (
                            <p className="mt-2 flex items-start gap-2">
                                <MapPin className="mt-0.5 size-4 shrink-0" />
                                {store.address}
                            </p>
                        )}
                        {store.hours && (
                            <p className="mt-1 flex items-center gap-2">
                                <Clock className="size-4" />
                                {store.hours}
                            </p>
                        )}
                    </div>

                    <div className="flex items-start gap-2">
                        {igLink && (
                            <Button variant="outline" size="icon" asChild>
                                <a
                                    href={igLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="size-4" />
                                </a>
                            </Button>
                        )}
                        {waLink && (
                            <Button variant="outline" size="icon" asChild>
                                <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="WhatsApp"
                                >
                                    <MessageCircle className="size-4" />
                                </a>
                            </Button>
                        )}
                        {store.email && (
                            <Button variant="outline" size="icon" asChild>
                                <a
                                    href={`mailto:${store.email}`}
                                    aria-label="Email"
                                >
                                    <Mail className="size-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
}
