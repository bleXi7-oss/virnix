# Current Phase — Hero Card True Glass Surface (UI-POLISH-I)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Hero Card Transparency (UI-POLISH-H, 2026-05-20) — complete

---

## Context

UI-POLISH-H at /30 + /40 + blur-lg was still reading as an opaque slab. Made a
decisive jump to /20 + /25 + blur-md — 80% and 75% transparency respectively.
The banner wave should now be legibly present through the card surface, not just
around it.

---

## What Changed

### Updated: `app/page.tsx`

Hero card inner div:
- Light: `bg-white/30` → `bg-white/20`
- Dark: `dark:bg-[#0a0a0a]/40` → `dark:bg-[#0a0a0a]/25`
- Blur: `backdrop-blur-lg` → `backdrop-blur-md` (both modes)

Border, shadow, chrome glow, inner highlight, input, button all unchanged.
Dark banner opacity stays at `opacity-[0.14]` (set in UI-POLISH-H).

---

## Validation Status

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Light mode: 80% transparency — pearl-chrome wave clearly visible through card
- Dark mode: 75% transparency — black chrome wave clearly visible through card
- Blur: 12px (backdrop-blur-md) — banner shape preserved, not milk-blurred away
- Text readability: preserved in both modes
- Input/button opacity hierarchy: maintained (fully opaque)
