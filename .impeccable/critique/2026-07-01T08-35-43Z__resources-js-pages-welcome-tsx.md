---
target: welcome page
total_score: 33
p0_count: 0
p1_count: 1
timestamp: 2026-07-01T08-35-43Z
slug: resources-js-pages-welcome-tsx
---
Method: dual-agent (A: design@opus · B: detector+lint+tsc@sonnet)

# Re-critique — `resources/js/pages/welcome.tsx` (Kayana Book landing) — after 3 fixes

## Design Health Score

| # | Heuristic | Score | Prior | Key Issue |
|---|-----------|-------|-------|-----------|
| 1 | Visibility of system status | 3 | 2 | Status/condition badges + real covers give perceptible state. |
| 2 | Match system & real world | 4 | 4 | "satu eksemplar — sekali hilang, hilang", honest condition labels. |
| 3 | User control & freedom | 3 | 3 | No traps, rel=noopener external links. |
| 4 | Consistency & standards | 4 | 4 | Token-driven, shadcn Badge/Button, consistent radii/motion. |
| 5 | Error prevention | 3 | 3 | No `onError` img fallback (deferred). |
| 6 | Recognition rather than recall | 4 | 3 | Real covers hero + grid, price/condition/status on-tile. |
| 7 | Flexibility & efficiency | 3 | 3 | Hero covers deep-link to product. |
| 8 | Aesthetic & minimalist | 3 | 2 | Imageless valley fixed (+1); 6 orbs + float cap it at 3. |
| 9 | Error recovery | 3 | 3 | Missing-img fallback the one gap. |
| 10 | Help & documentation | 3 | 3 | Trust trio + store info. |
| **Total** | | **33 / 40** | **GOOD (upper), +3 vs 30** |

No heuristic regressed. Movers: #1, #6, #8 — all trace to the landed fixes (real covers + status badges).

## Anti-Patterns Verdict

**LLM:** All impeccable bans clear — gradient text confirmed gone, no side-stripe / hero-metric / per-section eyebrow / 01-02-03. Hero pile judged distinctive, not cliché: real single-copy inventory rendered as `<Link>`s, not decorative stock (degrades to cliché only in the all-photoless case). Scarcity restrained and honest — universal fact stated once at the grid header, exceptions surfaced via status Badge only. Surviving tell: **orb-soup** — 6 `blur-3xl` blobs (3 hero, 1 Toko, 2 IG) + a perpetual float on the pile, in tension with DESIGN.md's ≤10% Sparkle Budget and "bright, not loud." It is the ceiling on Aesthetic.

**Deterministic:** `detect.mjs` → exit 0, 0 findings. `tsc --noEmit` clean. `eslint` → 2 errors, both pre-existing dead code (`CATEGORY_ICON` L85, unused `categories` prop L104) — untouched by the fixes, not regressions.

**Overlays:** none — no browser automation tool, target is a client-rendered Inertia SPA with no static DOM. Assessment from source + OKLCH token math (contrast directional).

## What's Working

1. **Hero fix is real, not cosmetic.** Covers sorted photo-first, capped at 5, deep-link to each product, carry `alt`, degrade to a titled navy spine. Converts the imageless valley into a product-forward opening — earned +1 in both Recognition and Aesthetic.
2. **Scarcity handled with restraint and honesty.** One uniqueness line at the grid header instead of noisy per-tile "1 tersisa"; status Badge surfaces only the exceptions (`status !== 'available'`). Exactly PRODUCT.md principle 3, no cheap-urgency tricks.
3. **Badge placement collision-free.** Condition top-left, status top-right — opposite corners.

## Priority Issues

**[P1] Hidden mobile covers still eager-download (NEW — introduced by the hero fix).**
- Covers i≥3 get `hidden sm:block` on the Link but the inner `<img loading="eager">` still renders; `display:none` images are still fetched. On mobile, 2 covers download eagerly and invisibly — on the exact mid-range-phone / slow-connection buyer the product optimizes for.
- Fix: `loading={i === 0 ? 'eager' : 'lazy'}` (lazy + hidden = never fetched until shown; visible mobile covers still load promptly; first cover stays eager for LCP). Or don't render i≥3 at all on mobile.
- Command: **optimize.**

**[P2] Hero spine-tile clips long titles mid-word (NEW surface from the fix).**
- Photo-less book → spine tile renders raw `{book.title}` in `text-xs` in a 112×149px box with no `line-clamp`; long titles hard-clip mid-word via parent `overflow-hidden`, reads as breakage.
- Fix: `line-clamp-4 leading-tight` so titles ellipsis cleanly.
- Command: **layout / harden.**

**[P2] Footer wordmark orange fails AA (pre-existing).**
- `<span className="text-brand">Book</span>` — oklch(0.74) on near-white ≈ ~2:1 at 16px semibold. The contrast pass moved eyebrow/pill/chips off raw `text-brand` but not this wordmark (nor the matching one in SiteHeader). DESIGN.md nav spec wants orange "Book" — genuine brand-vs-WCAG tension, but still a measurable AA text fail.
- Fix: a darker `--brand-ink` (≥oklch 0.55) for text use of the wordmark, or accept as a documented logotype exception. Don't leave it silently failing.
- Command: **colorize.**

**[P3] All-photoless / zero-book hero degrades badly (edge).**
- 0 books → right column hidden, `md:grid-cols-2` leaves an empty right column → lopsided hero. All-photoless → 3-5 navy title boxes, recreating the imageless valley AND contradicting the "honest condition photos" promise on the marketing hero.
- Fix: require ≥2 real covers before rendering the pile (else a crafted brand lockup); collapse the hero grid to single-column when the pile is absent.
- Command: **harden.**

**[P3] Hero covers read as decoration (affordance).**
- Covers are real product links but present as a poster; the only affordance is hover-lift, invisible on touch. A prettier dead-end than the boxes they replaced.
- Command: **delight / clarify.**

**[P3] Orb-soup + dead code.**
- 6 `blur-3xl` blobs breach the Sparkle Budget. `CATEGORY_ICON` + ~15 orphan lucide imports + unused `categories` prop are dead.
- Command: **quieter** + cleanup.

## Persona Red Flags

- **Jordan:** understands the model (uniqueness line + condition badges) but won't discover hero covers are tappable.
- **Riley:** 0 books → lopsided hero (NEW) · all-photoless → navy text wall · long spine title clips mid-word · gallery-empty Toko lopsided (deferred) · reserved+sold → two badges opposite corners, fine.
- **Casey (mobile):** cover tap targets ~112px good; `-space-x-8` overlap makes the overlapped strip an ambiguous tap target (may open wrong book). No horizontal-scroll — section clips rotation bleed.
- **Indonesian bargain-hunter, cheap phone:** worst-served — 2 invisible eager fetches (P1) + 6 blurred compositing layers + perpetual float. Motion gated behind `prefers-reduced-motion` ✓, but a default phone still pays paint/battery.

## Minor Observations

- Hero-cover URL matches grid tile URL → browser cache dedupes; eager hero cover warms the lazy grid cover. Good side-effect.
- `heroCovers` sorts a copy (`[...latestBooks]`) — no prop mutation. Good.
- Scroll handler rAF-throttled, parallax gated on `!coarse` — mobile skips the transform. Good.
- Toko `bg-gradient-to-br` is a background gradient (allowed), not banned gradient text.
- Instagram block `text-white`/`text-white/85` on navy passes comfortably.

## Questions to Consider

1. When inventory is unphotographed, the "honest photos" hero renders as navy title boxes — does the centerpiece contradict its core promise? Refuse to render below ≥2 real covers?
2. Two covers download invisibly on every mobile load, on the precise buyer you optimize for. Worth a 5-wide fan for 2 wasted fetches?
3. Six `blur-3xl` orbs + a perpetually floating pile — has "sparkle" become ambient noise past the ≤10% Sparkle Budget?
4. Hero covers are real product links that read as pure decoration — a prettier dead-end than the motif boxes they replaced?
