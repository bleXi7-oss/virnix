# Current Phase — Hero Card Internal Atmosphere (UI-POLISH-K)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Hero Card True Glass Surface (UI-POLISH-I, 2026-05-20) — complete

---

## Context

Opacity-only tweaking (bg-white/20, dark/25) made the card milky and cheap, not premium.
Root cause: the card had no internal atmosphere — transparency showed only the blurred
page background, not real chrome texture. Fixed by rebalancing opacity to /40 + /52
AND adding an internal banner layer + radial highlight directly inside the card,
clipped by overflow-hidden.

---

## What Changed

### Updated: `app/page.tsx` — HeroCard

**Card outer div:**
- Added `overflow-hidden` (clips internal atmosphere to card shape)
- Light: `bg-white/20` → `bg-white/40`
- Dark: `dark:bg-[#0a0a0a]/25` → `dark:bg-[#0a0a0a]/52`
- Blur: `backdrop-blur-md` → `backdrop-blur-lg` (both modes)

**New: internal atmosphere layer (z-0, absolute inset-0, pointer-events-none):**
- Light: banner.png `[filter:grayscale(1)_brightness(1.6)] opacity-[0.18] mix-blend-multiply`
  + radial gradient `rgba(200,200,220,0.15)` top highlight
- Dark: banner.png `opacity-[0.12]`
  + radial gradient `rgba(255,255,255,0.05)` top highlight
- Clipped to card shape via `rounded-[inherit]` + parent `overflow-hidden`

**Content wrapper:** existing h1/p/input/button/chips wrapped in `relative z-10`
so they sit above the internal atmosphere layer.

---

## Architecture: Why This Works

`overflow-hidden` on the card + absolute-fill internal image = banner texture
rendered inside the card boundary, not just around it. The card fill (bg-white/40)
acts as a translucent white glaze over the banner, giving the pearl-chrome effect.
`backdrop-blur-lg` blurs the page atmosphere behind the card. The internal layer
adds the texture *on top of* the card fill, inside the card shape.

---

## Validation Status

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Light mode: pearl-chrome banner texture visible inside the card
- Dark mode: black chrome texture visible inside the card
- Text readability: z-10 content layer preserves all readability
- Input/button: remain solid and high contrast
