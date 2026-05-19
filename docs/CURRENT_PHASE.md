# Current Phase — Hero Card Transparency (UI-POLISH-H)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Hero Card Transparency Polish (UI-POLISH-G, 2026-05-20) — complete

---

## Context

After UI-POLISH-G the card was still reading as opaque in both modes — banner visible
around the card but not through it. Made a larger jump: light card from /45 to /30,
dark card from /65 to /40, blur from xl to lg, and dark banner opacity from 0.10 to 0.14.

---

## What Changed

### Updated: `app/page.tsx`

Hero card inner div:
- Light: `bg-white/45` → `bg-white/30`
- Dark: `dark:bg-[#0a0a0a]/65` → `dark:bg-[#0a0a0a]/40`
- Blur: `backdrop-blur-xl` → `backdrop-blur-lg` (both modes)

Dark mode banner image (atmospheric layer):
- `opacity-[0.10]` → `opacity-[0.14]`

Input (`bg-white`), button (`bg-zinc-900`), chrome border glow,
inner highlight, and light-mode CSS gradients all unchanged.

---

## Validation Status

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Light mode: 70% transparency — pearl-chrome wave banner visible through card
- Dark mode: 60% transparency + stronger banner — chrome wave clearly visible through card
- Text readability: preserved in both modes
- Input/button opacity hierarchy: maintained (fully opaque)
