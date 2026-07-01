---
target: hero in welcome page
total_score: 18
p0_count: 0
p1_count: 1
timestamp: 2026-07-01T08-55-26Z
slug: resources-js-pages-welcome-tsx-hero
---
Method: dual-agent (A: design@opus · B: detector@sonnet). SCOPE: hero section only.

# Critique — Hero section, welcome.tsx (Kayana Book)

## Hero Health (applicable heuristics) — 18/20
| Heuristic | Score | Key issue |
|---|---|---|
| Match real world | 4/4 | Real cover pile = literal treasure pile; warm native Indonesian headline. |
| Consistency | 4/4 | Fraunces + navy CTA + one accent word, token-driven. |
| Aesthetic/minimalist | 3/4 | High craft, low boldness — text-left/card-fan-right frame is safe to the point of invisible. |
| Recognition | 4/4 | CTAs labeled, covers clearly clickable, aria-label each. |
| Accessibility | 3/4 | Headline ~10:1, accent ~5:1; docked for borderline pill + overlapped-cover focus ring. |
| Visibility of status | n/a | Static hero. |

## Anti-Patterns
LLM: fan-deck NOT slop — rescued by real single-copy clickable covers (brand promise + buy path + visual in one). Bans clear in-hero (gradient text gone, no glass/stripe). Single drift blob now reads as sparkle. BUT the container is the most generic hero frame in the category — distinctive content, anonymous shell.
Detector: 0 findings; tsc + eslint clean. Caveat: .tsx routes to regex engine only, so structural patterns (eyebrow-chip, italic-serif-display, hover-transform) were NOT evaluated — clean is weak evidence here, not proof.

## Overall
Empty-boxes → competent on-brand opening. Remaining gap is emotional not technical: a tidy fan-deck ("curated shelf") where the brand wants a rummaged pile ("strike gold"). Craft ~100%, treasure-hunt frisson ~70%.

## Working
1. Real clickable single-copy covers as hero image — best decision.
2. Disciplined choreography + full reduced-motion contract.
3. Smart empty state (showHeroPile >= 2 collapses to centered column).

## Priority Issues
[P1] Stock frame + hero DUPLICATES the section below it. Pile renders the same latestBooks as the "Baru diunggah" grid ~100px down — a tilted copy in the most-seen landing container. Fix: break the pile out of its grid cell (one cover ~1.4x bleeding behind headline's right edge, 3 supporting at varied rotation/depth) and/or differentiate hero covers from the grid (curated vs latest). Command: bolder / shape.
[P2] Signature element skips the entrance cascade + borderline pill contrast. Pile is static-then-floating while every left element animates in. Pill label text-muted-foreground @ 12px ~= 4.3-4.5:1, at the AA edge. Fix: <Reveal variant="scale" delay={320}> on pile; pill label -> text-foreground. Command: animate / colorize.
[P3] No text-wrap:balance on h1 (DESIGN.md mandates) -> ragged wrap on ~360px phones. Fix: add text-balance. Command: typeset.
[P3] Above-fold covers 1-2 are lazy -> pop-in after entrance. Fix: i < 3 ? 'eager' : 'lazy'. Command: optimize.

## Minor
- Overlapped rotated covers: verify focus-visible ring not clipped by next sibling; overlap-band tap ambiguous (top-painted wins, no touch cue).
- Two perpetual loops (drift 20s + float 9s) — watch for fidgety feel.

## Questions
1. Hero previews the exact latestBooks grid 100px below — what does the hero add besides rotation?
2. showHeroPile false -> visual brand degrades to text-only hero. Acceptable, or curated evergreen fallback?
3. Is a fan-deck the right metaphor — deck is ordered/closed, treasure hunt is messy/open?
