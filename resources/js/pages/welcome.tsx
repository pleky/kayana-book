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
    GraduationCap,
    Landmark,
    Languages,
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
import { Button } from '@/components/ui/button';
import type { BookCategory } from '@/types';

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
        title: 'Bayar transfer, gampang',
        body: 'Checkout, transfer bank, konfirmasi. Pesanan langsung tercatat rapi.',
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
}: {
    categories: BookCategory[];
}) {
    const progressRef = useRef<HTMLDivElement>(null);
    const parallaxRef = useRef<HTMLDivElement>(null);

    // Scroll-progress bar + subtle hero parallax. rAF-throttled, GPU-safe,
    // and disabled for reduced-motion / touch devices.
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

    return (
        <div className="min-h-screen bg-background">
            <Head title="Kayana Book — Toko Buku Bekas" />

            {/* Scroll progress */}
            <div
                ref={progressRef}
                aria-hidden="true"
                className="scroll-progress fixed inset-x-0 top-0 z-50 h-0.5 bg-brand"
            />

            <SiteHeader />

            <main>
                {/* ---------- Hero ---------- */}
                <section className="relative overflow-hidden">
                    {/* depth-1 — ambient glow */}
                    <div
                        aria-hidden="true"
                        className="animate-drift pointer-events-none absolute -top-24 -right-24 size-[28rem] rounded-full bg-brand/20 blur-3xl"
                    />
                    <div
                        aria-hidden="true"
                        className="animate-drift pointer-events-none absolute top-40 -left-32 size-80 rounded-full bg-sky/20 blur-3xl"
                        style={{ animationDelay: '-6s' }}
                    />

                    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
                        {/* depth-4 — hero text */}
                        <div className="space-y-6">
                            <Reveal delay={50}>
                                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                                    <BookOpen className="size-3.5 text-brand" />
                                    Toko buku bekas &amp; baru
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
                                        Buku bekas bercerita,
                                    </span>
                                </span>
                                <span className="line-reveal block overflow-hidden pb-1">
                                    <span
                                        className="text-brand"
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
                                    kondisi jujur dan harga ramah. Temukan
                                    bacaan berikutnya, satu eksemplar yang
                                    benar-benar unik.
                                </p>
                            </Reveal>

                            <Reveal delay={560}>
                                <div className="flex flex-wrap gap-3">
                                    <Button size="lg" asChild>
                                        <Link href={CatalogController.index()}>
                                            Jelajahi katalog
                                        </Link>
                                    </Button>
                                    <Button size="lg" variant="outline" asChild>
                                        <Link
                                            href={CatalogController.index({
                                                query: { sort: 'price_asc' },
                                            })}
                                        >
                                            Buku termurah
                                        </Link>
                                    </Button>
                                </div>
                            </Reveal>
                        </div>

                        {/* depth-2 — book-spine motif (parallax + float) */}
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

                {/* ---------- Categories ---------- */}
                {categories.length > 0 && (
                    <section className="border-t border-border/60">
                        <div className="mx-auto max-w-6xl px-4 py-16">
                            <Reveal className="mb-8">
                                <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                                    Jelajahi kategori
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Genre dengan koleksi terbanyak.
                                </p>
                            </Reveal>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                {categories.map((category, i) => {
                                    const Icon =
                                        CATEGORY_ICON[category.slug ?? ''] ??
                                        BookOpen;

                                    return (
                                        <Reveal
                                            key={category.id}
                                            delay={Math.min(i, 9) * 45}
                                            className="h-full"
                                        >
                                            <Link
                                                href={CatalogController.index({
                                                    query: {
                                                        category: category.slug,
                                                    },
                                                })}
                                                className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                                            >
                                                <span
                                                    className={`inline-flex size-10 items-center justify-center rounded-lg ${CHIP[i % CHIP.length]}`}
                                                >
                                                    <Icon className="size-5" />
                                                </span>
                                                <div>
                                                    <h3 className="font-serif font-medium text-foreground">
                                                        {category.name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {category.books_count ??
                                                            0}{' '}
                                                        buku
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

                {/* ---------- CTA ---------- */}
                <section className="mx-auto max-w-6xl px-4 py-16">
                    <Reveal variant="scale">
                        <div className="relative overflow-hidden rounded-2xl border border-border bg-primary/5 px-6 py-14 text-center">
                            <div
                                aria-hidden="true"
                                className="animate-drift pointer-events-none absolute -bottom-20 left-1/2 size-72 -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
                            />
                            <h2 className="relative font-serif text-3xl font-semibold tracking-tight text-foreground">
                                Siap menemukan buku berikutnya?
                            </h2>
                            <p className="relative mx-auto mt-3 max-w-md text-muted-foreground">
                                Katalog diperbarui setiap kali buku baru masuk.
                                Yang unik cepat habis.
                            </p>
                            <Button size="lg" className="relative mt-6" asChild>
                                <Link href={CatalogController.index()}>
                                    Mulai jelajahi
                                </Link>
                            </Button>
                        </div>
                    </Reveal>
                </section>
            </main>

            <footer className="border-t border-border/60">
                <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
                    <span className="font-serif text-base font-semibold text-foreground">
                        Kayana<span className="text-brand">Book</span>
                    </span>
                    <p className="mt-1">Toko buku bekas &amp; baru.</p>
                </div>
            </footer>
        </div>
    );
}
