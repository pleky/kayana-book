# Product

## Register

brand

## Users

Two audiences, one storefront:

- **Book lovers hunting affordable used books (primary)** — Indonesian readers browsing a secondhand bookstore across every genre (novels, sastra, sci-fi, biografi, self-help, children's, and more). Often on mobile. Stock is unique: one copy per title, sold with honest condition photos. They want to find a good book, trust its real condition, see the price and shipping up front, and grab it before someone else does. Some also visit the physical shop.
- **Shop operator (admin)** — manages the catalog (categories, photos, tags, condition), fulfills and tracks orders. Wants speed and clarity over polish on the admin side; the brand shine lives on the customer-facing surfaces.

The buy path is the spine: **catalog → cart → checkout (or shareable checkout-link) → order tracking**.

## Product Purpose

Kayana Book is the online + offline storefront for a Kayana secondhand bookstore (logo: a monkey reading). It sells single-copy used books across all genres, each photographed in its real condition. It exists to turn browsers into confident buyers: discover a book, trust its condition, understand shipping and price up front, check out or hand off a prefilled checkout-link, then track the order — before the one copy is gone. Success = a reader completes a purchase without hesitation and comes back for the next find. The storefront carries the brand — the shopping experience itself is the marketing.

## Brand Personality

**Bright, fun, energetic** — but trustworthy. A secondhand bookstore should feel like a joyful treasure hunt, not a dusty bargain bin or a cold marketplace. Warmth and play come from the logo palette (navy + warm orange + sparkle cyan), Fraunces display type, and purposeful motion — not from cartoon clip-art. Voice is friendly and plain-spoken (Indonesian-first), never corporate, never cutesy to the point of feeling cheap. Joyful, but the joy is crafted, and the honesty (real condition, real photos) is part of the charm.

## Anti-references

- **Generic Indonesian marketplace** (Shopee/Tokopedia density) — no banner spam, no badge noise, no cluttered grids screaming for attention. Editorial calm around the color, not chaos.
- **Childish clip-art** — no Comic Sans, no rainbow gradients, no cartoon overload. "Fun" must still read as trustworthy and gift-worthy, not cheap.
- **Cold corporate SaaS** — no sterile gray dashboard, no personality-free forms. Even the utility screens (cart, addresses, order status) should feel like Kayana.

## Design Principles

1. **The store is the ad.** Every surface — even cart and order tracking — carries the brand. No "utility" screen gets to be gray and joyless.
2. **Bright, not loud.** Color and motion do the delight; whitespace and restraint keep it trustworthy. One playful pop per view beats ten.
3. **Confidence before checkout.** Show price, shipping, and — critically — real condition up front. A used-book buyer hesitates when the condition or a number is hidden. One copy each, so scarcity is real: make it clear without cheap urgency tricks.
4. **Fun that a buyer trusts.** Play comes from craft (type, palette, motion), never from clip-art. Honesty (condition photos) is part of the trust. If it reads cheap, it undermines the sale.
5. **Mobile-first, Indonesia-real.** Most buyers arrive on mid-range phones. Fast, thumb-reachable, works on a slow connection.

## Accessibility & Inclusion

Target **WCAG 2.1 AA**. Body text ≥4.5:1 (watch orange/cyan on white — decoration only, never body text per the token notes), large text ≥3:1, visible focus rings (navy `--ring`), full keyboard nav on the buy flow. Reduced-motion already honored in `app.css` (all reveal/drift/float effects gated behind `prefers-reduced-motion: no-preference`); keep that contract on any new motion. Indonesian-first copy.
