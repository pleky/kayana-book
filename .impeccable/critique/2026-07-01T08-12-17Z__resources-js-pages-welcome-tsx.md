---
target: welcome page
total_score: 30
p0_count: 0
p1_count: 2
timestamp: 2026-07-01T08-12-17Z
slug: resources-js-pages-welcome-tsx
---
Method: dual-agent (A: design-review@opus · B: detector@sonnet)

# Critique — `resources/js/pages/welcome.tsx` (Kayana Book landing)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 3 | Lazy `<img>` has no skeleton; slow-connection users (stated audience) watch tiles pop in blank. |
| 2 | Match system & real world | 4 | Indonesian-first, plain, warm ("anti rebutan", "sambil ngopi"). Perfect audience fit. |
| 3 | User control & freedom | 3 | Sticky header escape everywhere, no traps. Barely applies to a landing. |
| 4 | Consistency & standards | 3 | Token drift: hero accent uses correct `accent-foreground`, but Toko eyebrow uses raw `text-brand` (fails). Two eyebrow styles for one role. |
| 5 | Error prevention | 3 | Strong section guards (`latestBooks.length`, `hasStoreInfo`, `igLink`). Little to prevent on a landing. |
| 6 | Recognition vs recall | 3 | Everything visible, icons labeled. Categories only in header dropdown, not on page. |
| 7 | Flexibility & efficiency | 3 | Clear CTAs, keyboard-reachable. No Inertia prefetch on catalog links — cheap win missed. |
| 8 | Aesthetic & minimalist | 3 | Great type system, but orb-soup + empty MOTIF placeholders + generic trust triptych = busy-decorative, not clean. |
| 9 | Error recovery | 2 | No `onError` on any `<img>`. A dead `/storage/...` path (likely on real used stock) yields a broken box with only alt text. |
| 10 | Help & documentation | 3 | Real, relevant help present: WhatsApp, hours, Maps, phone, email. |
| **Total** | | **30 / 40** | **GOOD (28–35)** |

## Anti-Patterns Verdict

**LLM assessment:** Mostly escaped the template. Gradient text is gone (hero now solid navy Fraunces + one italic ember accent word — the correct "Sparkle & Ink" fix). No eyebrow-on-every-section, no 01/02/03 scaffolding, no hero-metric template, no side-stripe borders, no default glassmorphism. Two register tells remain:
- **Blur-orb soup** — six `blur-3xl` radial blobs (3 hero, 1 Toko, 2 Instagram). The dominant AI-landing gesture of the era; pushes the "bright, not loud" Sparkle Budget.
- **Zero book imagery in the hero** — the whole brand promise is "foto kondisi asli" (honest condition photos), yet the hero shows six empty colored rectangles with a 25%-opacity book icon, and the column is `hidden md:block` so mobile (primary audience) gets no visual at all. Brand-register slop at the peak moment.

Palette is NOT timid — navy/orange/cyan used with conviction. Problem is the opposite: too many diffuse glows and no real photography where photography IS the product.

**Deterministic scan:** `detect.mjs` on the file — **exit 0, 0 findings, clean.** The gradient-text ban that would have fired last week was already fixed in the prior polish pass. Detector and LLM agree there are no syntactic ban violations; every issue below is semantic/register-level, which the detector can't see. No false positives to discount.

**Visual overlays:** none — no browser automation tool exposed and the target is a client-rendered Inertia SPA with no static DOM. Assessment done from source + OKLCH token math (contrast figures directional, not lab-measured).

## Overall Impression

A confident, on-brand landing with a strong type system and genuinely good Indonesian voice — held back by three things: one real WCAG AA text-contrast fail, a hero that shows no books on a store whose entire pitch is book photos, and no image-error handling on the surface that sells trust. Biggest single opportunity: **put real, slightly-worn covers in the hero** (mobile included). That one change fixes the emotional valley and the register slop at once.

## What's Working

1. **Hero headline fix is brand-true.** Solid navy Fraunces + one italic `text-accent-foreground` word ("bercerita") + masked line-reveal. `accent-foreground` (oklch 0.45) computes ~5:1 on the ground — passes AA where raw orange never could. Avoids every hero anti-pattern.
2. **Confidence-before-checkout honored on the tiles.** Every cover in "Baru diunggah" shows real photo + condition badge + author + price, with `line-clamp-2`/`truncate` guarding long metadata. The most important brand principle, executed on the surface that matters.
3. **Voice.** Indonesian-first, specific, non-corporate ("sambil ngopi, tanya rekomendasi"). Personality lives in the copy, not just the palette.

Cognitive load: **LOW** (0–1 checklist failures). Only >4-option decision point is the header Kategori dropdown — appropriate progressive disclosure, not overload.

## Priority Issues

**[P1] `text-brand` eyebrow fails WCAG AA as text.**
- Why it matters: Line 373 — "Toko offline" in `text-brand` (oklch 0.74) on `bg-brand/15` ≈ **1.85:1**. Small semibold TEXT, not decoration. Direct AA fail on the exact rule PRODUCT.md + DESIGN.md both warn against ("orange never body text on white"). Same problem on its MapPin icon.
- Fix: swap text glyph to `text-accent-foreground` (~5:1) or `text-primary`; keep orange as chip fill only.
- Command: **colorize** (+ **audit** to sweep siblings).

**[P1] Hero shows zero book imagery.**
- Why it matters: brand's core promise is real condition photos; the highest-attention surface shows none, and `hidden md:block` gives mobile nothing. Register slop that hits the primary audience hardest.
- Fix: replace the `MOTIF` grid with real covers (reuse `latestBooks[i].primary_image`, already server-side) in a staggered/tilted stack; show a compact 2-cover strip on mobile instead of hiding it.
- Command: **shape** (or **bolder**).

**[P2] Icon chips fail 3:1 graphical contrast.**
- Why it matters: `CHIP` uses `text-brand`/`text-sky` on `/15` tints for Trust icons (~2:1 / ~2.3:1) — below the 3:1 for meaningful graphics. Icons carry meaning (camera = photos, shield = scarcity).
- Fix: darken the glyph (accent-foreground / darker sky / navy), keep the light tint as fill.
- Command: **colorize / audit.**

**[P2] Scarcity is told, never shown at the decision point.**
- Why it matters: "satu eksemplar / anti rebutan" lives only in Trust copy, three sections from where the user picks a book. The emotional lever of a single-copy store is disconnected from the action — weakens urgency AND reassurance.
- Fix: add a subtle "Stok terakhir / 1 tersisa" chip to the cover tile (reuse Badge, orange fill + dark text). Honest, not a fake countdown.
- Command: **clarify** (touch of **delight**).

**[P3] Ambient orb overload pushes the Sparkle Budget.**
- Why it matters: six `blur-3xl` blobs read loud-adjacent and are the era's dominant AI-hero cliché; "bright, not loud" is a stated principle.
- Fix: cut hero from three blobs to one, drop one of the Instagram pair. One pop per view.
- Command: **quieter / distill.**

**[P3] No image-error handling; empty-gallery lopsided card.**
- Why it matters: no `onError` on any `<img>` — a dead path yields a broken box on the emotional-peak grid. And address-set-but-gallery-empty renders the Toko card 2-col with a blank right column. Also: unknown `book.condition` key → empty Badge.
- Fix: add `onError` fallback (reuse the "Tanpa foto" placeholder); collapse Toko grid to single-column when gallery empty; fallback label for unknown condition.
- Command: **harden.**

## Persona Red Flags

**Jordan (first-timer):** hero claims "kondisi jujur" next to six empty boxes — promise not demonstrated until they scroll to "Baru diunggah". Two hero CTAs are clear — that part works.

**Riley (stress-tester):** empty `latestBooks` handled (section hidden) ✓. `gallery` empty + address present → lopsided Toko card ✗. Unknown `book.condition` → empty Badge ✗. Broken `primary_image` path → broken img, no fallback ✗ (null case IS handled — only broken-path leaks). Long title/author → clamped ✓.

**Casey (mobile):** hero visual `hidden md:block` → mobile hero is text-only, no book ✗. "Lihat semua →" ghost button (~32px) and footer social icons (~36px) under the 44px thumb target ✗. Cover tiles (whole Link) are large taps ✓.

**Indonesian bargain-hunter, mid-range phone:** parallax correctly off on `pointer: coarse` ✓, but drift/float blobs still animate — paint cost on cheap GPUs, watch it. Lazy images with no skeleton → treasure-hunt peak renders as empty boxes first on 3G. Scarcity — the thing they race for — invisible on the tiles they scan.

## Minor Observations

- `muted-foreground` (oklch 0.5) ≈ 4.2–4.6:1 on white — borderline for small `text-xs` runs (283, 339, 479). Passes with zero margin; don't let it drift lighter.
- Footer/header wordmark "Book" in `text-brand` ≈ 2:1 — WCAG exempts logotypes, technically fine, but reads faint.
- Catalog `<Link>`s don't use Inertia prefetch — free perceived-speed win for the buy spine.
- Instagram panel `text-white` on `bg-primary` navy ≈ 8:1 — excellent; the recolor landed well.
- `DESIGN.md` line ~204 still claims the hero uses gradient text — stale; code already fixed. Worth correcting the doc.

## Questions to Consider

1. Your differentiator is "we photograph every book's real condition" — so why does the hero contain zero book photos, and hide even its placeholder on mobile?
2. You tell the user "anti rebutan, satu eksemplar" in a feature card — why isn't that on the product tile where the fear actually lives?
3. Six blurred orbs — "bright, not loud," or the exact hero-orb gesture every AI landing shipped? Which one blob, kept alone, does real work?
4. A used bookstore will have a dead image path eventually. On the cover grid — your emotional peak — an un-handled `<img>` shows a broken box. Acceptable on the surface that sells trust?
