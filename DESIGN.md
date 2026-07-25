---
name: Kayana Book
description: Bright, trustworthy storefront for the Kayana secondhand bookstore — navy ink, orange sparkle, cyan glint.
colors:
  primary: "oklch(0.37 0.17 278)"
  primary-dark: "oklch(0.62 0.17 277)"
  brand-orange: "oklch(0.74 0.145 62)"
  sky-cyan: "oklch(0.7 0.14 233)"
  background: "oklch(0.99 0.004 250)"
  ink: "oklch(0.26 0.06 280)"
  muted-ink: "oklch(0.5 0.035 272)"
  secondary-tint: "oklch(0.95 0.035 235)"
  accent-peach: "oklch(0.93 0.05 67)"
  border: "oklch(0.9 0.013 255)"
  destructive: "oklch(0.57 0.21 27)"
typography:
  display:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(2.25rem, 6vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input-field:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Kayana Book

## 1. Overview

**Creative North Star: "Sparkle & Ink"**

Kayana Book takes its whole visual identity from its own logo: a navy-**ink** wordmark next to a monkey reading, lit by orange and cyan **sparkles**. The system is that logo scaled up to a storefront for a secondhand bookstore — single-copy used books across every genre, each sold with honest condition photos. Confident navy type carries structure and trust; warm orange and cyan appear as punctuation — the spark of a good find, the reassurance a buyer needs before paying for a used book sight-unseen. This is a *brand* register: the store is the ad, so even the cart and the order-tracking screen wear the identity.

Bright, not loud. The energy comes from a small number of saturated pops against generous quiet space, never from filling the screen with color. Fun is manufactured by craft — the Fraunces display serif, purposeful reveal motion, a springy tap — not by cartoon clip-art. Every playful move has to survive one test: *would a buyer still trust this bookstore with their money?* If it reads cheap, it's wrong — a secondhand shop has to feel like a curated treasure hunt, not a bargain bin.

The system explicitly rejects the three things Kayana must never be: the cluttered banner-and-badge density of a generic Indonesian marketplace, the Comic-Sans-and-rainbow cheapness of childish clip-art, and the sterile gray of cold corporate SaaS. Kayana is warm, crafted, and mobile-first for real Indonesian phones.

**Key Characteristics:**
- Navy ink for structure; orange + cyan reserved as sparkle accents (≤10% of a screen).
- Fraunces display serif over Inter body — contrast pairing, not two similar sans.
- Flat at rest; depth arrives on interaction (hover, focus, dialog).
- Bouncy, tactile feedback — motion is part of the build, gated behind reduced-motion.
- Mobile-first, thumb-reachable, fast on mid-range devices.

## 2. Colors

A navy-anchored palette where warmth is delivered by two reserved accents rather than a tinted background.

### Primary
- **Ink Navy** (`oklch(0.37 0.17 278)`): The voice of the brand. Buttons, prices, links, focus rings, the "Kayana" wordmark, active states. Readable on the near-white background; carries almost all structural weight.
- **Lifted Navy** (`oklch(0.62 0.17 277)`): The dark-mode primary — a brighter navy so CTAs stay vivid on dark surfaces.

### Secondary
- **Sky Tint** (`oklch(0.95 0.035 235)`): Cool sky-blue wash for secondary buttons and calm supporting fills.
- **Peach Accent** (`oklch(0.93 0.05 67)`): Soft warm hover/selection fill — the gentle orange echo used behind hovered items and highlighted rows.

### Tertiary
- **Sparkle Orange** (`oklch(0.74 0.145 62)`): The monkey and the "children's book" mark. Playful pops only — hero accent word, badges, icon chips, scroll-progress bar, glows. **Never body text on white.**
- **Glint Cyan** (`oklch(0.7 0.14 233)`): The logo sparkles. Tertiary decoration and occasional data-viz accent; the rarest color on any screen.

### Neutral
- **Near-White Ground** (`oklch(0.99 0.004 250)`): Body background. A true light neutral with the faintest cool tint — not a cream, not a paper.
- **Ink Text** (`oklch(0.26 0.06 280)`): Primary text. Deep navy-black, ≥4.5:1 on the ground.
- **Muted Ink** (`oklch(0.5 0.035 272)`): Secondary text, captions, placeholders. Still meets 4.5:1 — the muted color is dark enough to read.
- **Hairline Border** (`oklch(0.9 0.013 255)`): Borders, inputs, dividers.
- **Alert Red** (`oklch(0.57 0.21 27)`): Destructive actions and validation errors only.

### Named Rules
**The Sparkle Budget Rule.** Orange and cyan combined occupy ≤10% of any given screen. Their rarity is the delight; spend them on one hero accent, a badge, a progress bar — not on every element. Navy does the work.

**The No-Warm-Ground Rule.** The background is a cool near-white, never cream/sand/paper. Warmth in Kayana comes from the orange accent and the Fraunces type, never from a tinted body background.

## 3. Typography

**Display Font:** Fraunces (with ui-serif, Georgia, serif)
**Body Font:** Inter (with ui-sans-serif, system-ui, sans-serif)

**Character:** A high-contrast pairing — Fraunces is a warm, characterful "old-style" serif with soft optical curves that gives headings personality and gift-worthy warmth; Inter is a clean, neutral workhorse that keeps prices, forms, and long copy legible. Serif-plus-sans contrast, never two similar families.

### Hierarchy
- **Display** (Fraunces 600, clamp(2.25rem → 3.75rem), line-height 1.05, tracking -0.02em): Hero and section headlines. Ceiling ~3.75rem — bright, not shouting. Use `text-wrap: balance`.
- **Headline** (Fraunces 600, 1.875rem, line-height 1.15): Page and major section titles.
- **Title** (Inter 600, 1.125rem, line-height 1.3): Card titles, product names, list-item headings.
- **Body** (Inter 400, 1rem, line-height 1.6): Descriptions and prose. Cap measure at 65–75ch; use `text-wrap: pretty` on long runs.
- **Label** (Inter 500, 0.75rem): Badges, meta, form labels, small UI text.

### Named Rules
**The Serif-Is-Special Rule.** Fraunces is for headings and the wordmark only. Body, forms, prices, and UI chrome stay Inter. Setting body copy in the serif reads as decoration and slows reading.

## 4. Elevation

Flat by default. Surfaces sit at rest with only the faintest hairline shadow (`shadow-xs`/`shadow-sm` on cards); depth is a *response to interaction*, not a decoration. This keeps the storefront clean and fast on mobile, and reserves the sense of "lift" for moments that matter — a hovered book cover, a focused input, an open dialog.

### Shadow Vocabulary
- **Resting** (`shadow-xs`, ~`0 1px 2px rgba(0,0,0,0.05)`): Buttons and inputs at rest — barely-there separation.
- **Card** (`shadow-sm`, ~`0 1px 3px rgba(0,0,0,0.08)`): Cards and product tiles.
- **Overlay** (dialog/popover default): Dialogs, dropdowns, sheets — the only genuinely lifted surfaces.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Depth appears only in response to state — hover lift on covers, the 3px focus ring, or an overlay. If a card has a heavy drop shadow doing nothing, delete it.

## 5. Components

Component character: **bouncy and tactile**. Friendly rounded corners, solid navy CTAs, and springy hover/press feedback — approachable enough for a children's brand, decisive enough that a parent taps *buy* without doubt. Built on shadcn/ui with the Kayana token layer; restyle by editing tokens in `resources/css/app.css`, never by forking components.

### Buttons
- **Shape:** Friendly rounded (`rounded-md`, 8px).
- **Primary:** Solid Ink Navy fill, near-white text, `h-9` (36px), `px-4`. The default CTA everywhere in the buy flow.
- **Hover / Focus:** Hover deepens the navy (`bg-primary/90`); focus shows a 3px navy ring (`ring-ring/50`). Add a subtle springy press (`active:scale-[0.98]`) for tactility.
- **Secondary / Outline / Ghost:** Secondary uses Sky Tint; outline is hairline-bordered on the ground with a Peach Accent hover; ghost is fill-on-hover only.

### Cards / Containers
- **Corner Style:** Generous (`rounded-xl`, 12px) — the softest radius in the system, for the friendliest surfaces (product tiles, panels).
- **Background:** Card near-white on the ground; the ground shows through gaps.
- **Shadow Strategy:** `shadow-sm` at rest; lift on hover for interactive covers (see Elevation).
- **Border:** Optional hairline; prefer shadow or tonal separation over heavy borders.
- **Internal Padding:** 24px (`p-6`).

### Inputs / Fields
- **Style:** Hairline border on transparent/ground, `rounded-md` (8px), `h-9`, `px-3`.
- **Focus:** Border shifts to navy plus a 3px navy ring — the same focus language as buttons.
- **Error:** `aria-invalid` drives a destructive-red ring and border; pair with a text message.

### Navigation
- **Style:** Wordmark `Kayana` (navy) + `Book` (orange) set in Fraunces. Sidebar for admin; top nav for storefront.
- **States:** Active item carries navy; hover uses Peach Accent fill. Mobile collapses to a sheet.

### Signature: Scroll Motion
Reveal-on-scroll (`data-reveal`), masked line headlines (`.line-reveal`), ambient drift, and a navy/orange top scroll-progress bar live in `app.css`. All effects are GPU-safe (transform/opacity/filter) and gated behind `prefers-reduced-motion: no-preference` — reduced-motion users get the final state instantly. Easing is `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-quint): fast out, gentle settle, no bounce/elastic.

## 6. Do's and Don'ts

### Do:
- **Do** anchor every screen in Ink Navy and spend orange/cyan as sparkle accents on ≤10% of the surface (The Sparkle Budget Rule).
- **Do** keep the background a cool near-white; carry warmth through the orange accent and Fraunces type, never a cream/paper body.
- **Do** use Fraunces for headings and the wordmark only; Inter for everything else.
- **Do** keep surfaces flat at rest and let depth answer interaction (hover lift, 3px navy focus ring, overlays).
- **Do** add springy, tactile feedback (`active:scale`, ease-out-quint) — and always ship a `prefers-reduced-motion` alternative.
- **Do** verify contrast: body and placeholder text ≥4.5:1. Orange and cyan are decoration, never body text on white.
- **Do** restyle by editing tokens in `app.css`; every shadcn component inherits.

### Don't:
- **Don't** build a generic Indonesian marketplace: no banner spam, no badge noise, no cluttered screaming grids. Editorial calm around the color.
- **Don't** use childish clip-art, Comic Sans, or rainbow gradients. "Fun" must still read as trustworthy and gift-worthy.
- **Don't** ship cold corporate SaaS: no sterile gray, personality-free screens. Cart and order-tracking wear the brand too.
- **Don't** use gradient text (`bg-clip-text` + `text-transparent`). *The current hero headline in `welcome.tsx` does this — it should be replaced with a solid navy headline plus one orange accent word.*
- **Don't** set orange or cyan as body text on the near-white ground; it fails contrast.
- **Don't** use `border-left`/`border-right` >1px as a colored accent stripe on cards or alerts.
- **Don't** let display headings exceed ~3.75rem or go tighter than -0.02em tracking; bright, not shouting.
