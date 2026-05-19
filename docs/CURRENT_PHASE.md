# Current Phase — Hero Card Transparency Polish (UI-POLISH-G)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Hero Card Transparency Polish (UI-POLISH-F, 2026-05-20) — complete

---

## Context

Hero card was at `bg-white/55` / `dark:bg-[#0a0a0a]/80` after UI-POLISH-F.
Still too opaque in both modes. Increased transparency more aggressively in both
light and dark so the banner chrome wave shows clearly through the card surface.

---

## What Changed

### Updated: `app/page.tsx`

Hero card inner div:
- Light before: `bg-white/55` → after: `bg-white/45`
- Dark before: `dark:bg-[#0a0a0a]/80` → after: `dark:bg-[#0a0a0a]/65`

`backdrop-blur-xl`, chrome border glow, inner highlight, input (`bg-white`),
and button (`bg-zinc-900`) all unchanged.

---

## Validation Status

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Light mode: 55% transparency — banner atmosphere clearly visible through card
- Dark mode: 35% opacity card — chrome wave banner shows through notably more
- Text readability: preserved in both modes
- Input/button opacity hierarchy: maintained (fully opaque)
