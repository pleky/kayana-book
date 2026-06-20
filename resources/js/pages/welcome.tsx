import { Head, Link } from '@inertiajs/react';
import { BookOpen, Camera, ShieldCheck, Wallet } from 'lucide-react';
import CatalogController from '@/actions/App/Http/Controllers/CatalogController';
import SiteHeader from '@/components/catalog/site-header';
import { Button } from '@/components/ui/button';

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

export default function Welcome() {
    return (
        <div className="min-h-screen bg-background">
            <Head title="Kayana Book — Toko Buku Bekas" />
            <SiteHeader />

            <main>
                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-primary/10 blur-3xl" />
                    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
                        <div className="space-y-6">
                            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                                <BookOpen className="size-3.5 text-primary" />
                                Toko buku bekas &amp; baru
                            </span>
                            <h1 className="font-serif text-4xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                                Buku bekas bercerita,
                                <br />
                                <span className="text-primary">
                                    menunggu pembaca baru.
                                </span>
                            </h1>
                            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                                Telusuri ratusan judul pilihan dengan kondisi
                                jujur dan harga ramah. Temukan bacaan
                                berikutnya, satu eksemplar yang benar-benar
                                unik.
                            </p>
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
                        </div>

                        {/* Stacked-books motif */}
                        <div className="relative hidden md:block">
                            <div className="mx-auto grid max-w-sm grid-cols-3 gap-3">
                                {[
                                    'aspect-3/4 bg-primary/15',
                                    'mt-8 aspect-3/4 bg-accent',
                                    'aspect-3/4 bg-secondary',
                                    'mt-6 aspect-3/4 bg-secondary',
                                    'aspect-3/4 bg-primary/15',
                                    'mt-10 aspect-3/4 bg-accent',
                                ].map((c, i) => (
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

                {/* Trust */}
                <section className="border-t border-border/60 bg-card/40">
                    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-3">
                        {TRUST.map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="rounded-xl border border-border bg-card p-6"
                            >
                                <div className="mb-4 inline-flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Icon className="size-5" />
                                </div>
                                <h3 className="font-serif text-lg font-semibold text-foreground">
                                    {title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    {body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="mx-auto max-w-6xl px-4 py-16">
                    <div className="rounded-2xl border border-border bg-primary/5 px-6 py-12 text-center">
                        <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                            Siap menemukan buku berikutnya?
                        </h2>
                        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                            Katalog diperbarui setiap kali buku baru masuk. Yang
                            unik cepat habis.
                        </p>
                        <Button size="lg" className="mt-6" asChild>
                            <Link href={CatalogController.index()}>
                                Mulai jelajahi
                            </Link>
                        </Button>
                    </div>
                </section>
            </main>

            <footer className="border-t border-border/60">
                <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
                    <span className="font-serif text-base font-semibold text-foreground">
                        Kayana<span className="text-primary">Book</span>
                    </span>
                    <p className="mt-1">Toko buku bekas &amp; baru.</p>
                </div>
            </footer>
        </div>
    );
}
