# Current Phase — Creator Energy Selection (CE-A)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: TikTok Domain Unlock + Closing Pool (QB-A, 2026-05-20) — complete

---

## Context

Following QB-A (domain-agnostic opener/closing pools), the foundation was clean enough to add
Creator Energy Selection — a creator-native control for steering the output angle before generation.

This feature lets the creator choose what kind of energy/angle they want in the outputs.
It is explicitly NOT a settings panel — it is a creative direction control.
Empty selection = Virnix picks automatically (balanced/default). No generation is blocked.

---

## What Changed

### New: `app/lib/creator-energy/types.ts`
- `CreatorEnergyId` union type (tactical | contrarian | analytical | reflective | relatable | harsh-truth)
- `CreatorEnergy` interface (id, label, tagline, promptDirective)

### New: `app/lib/creator-energy/options.ts`
- `CREATOR_ENERGIES` — 6 energy definitions with short labels, tooltips, and prompt directives
- `VALID_ENERGY_IDS` set for allowlist validation
- `isValidEnergyId(id)` type guard for server-side safety

### New: `app/lib/creator-energy/prompt-context.ts`
- `formatEnergyContext(energyIds)` — returns "" when empty (no-op), or a structured block with
  selected energy labels, directives, and a grounding rule injected into the GENERATION PROFILE

### New: `app/components/CreatorEnergySelector.tsx`
- Pill-style toggle UI matching ExamplesRow pill aesthetic (premium, not settings-panel)
- "Balanced" pill = default/clear (active when no specific energy selected)
- Individual energy pills are multiselect toggles
- Selecting "Balanced" clears all others; selecting any energy deactivates "Balanced"
- `title` attributes show taglines on hover (no visual clutter)
- Light + dark mode via existing zinc palette

### Updated: `app/lib/types/generation.ts`
- Added `energyIds?: CreatorEnergyId[]` to `GenerateRequest`

### Updated: `app/api/generate/route.ts`
- Changed body type to `Record<string, unknown>` (proper JSON parsing)
- Validates energyIds against VALID_ENERGY_IDS allowlist (unknown values silently dropped)
- Passes `{ youtubeUrl, energyIds }` to `generate()`

### Updated: `app/lib/ai/generate.ts`
- Imports `CreatorEnergyId` and `formatEnergyContext`
- `realGenerate()` gains `energyIds: CreatorEnergyId[] = []` parameter
- Builds `energyContext = formatEnergyContext(energyIds)` — empty string when no energies
- Logs `[virnix] creator energy: tactical, contrarian` when energies are selected
- Passes `energyContext` as third arg to `buildPrompt()` / `buildAdvancedPrompt()`

### Updated: `app/lib/prompts/index.ts`
- `buildPrompt(transcript, timelineContext, energyContext = "")` — optional third param
- `buildAdvancedPrompt(transcript, timelineContext, energyContext = "")` — same
- `energyContext` appended after timelineContext in GENERATION PROFILE block when non-empty

### Updated: `app/page.tsx`
- Imports `CreatorEnergySelector` and `CreatorEnergyId`
- `useState<CreatorEnergyId[]>([])` for selected energies
- `runGeneration(targetUrl, energies)` — energies passed explicitly (no stale closure)
- `handleGenerate`, `handleExampleSelect`, `handlePaste` all pass `selectedEnergies`
- `HeroCard` receives `selectedEnergies` + `onEnergyChange` props
- `<CreatorEnergySelector>` rendered inside HeroCard at `phase === "idle"` only

---

## Prompt Injection Format (when energies selected)

```
Creator energy: Tactical, Contrarian
Directives:
- Make outputs save-worthy and practical. Prioritize clear steps, concrete takeaways...
- Lead with the assumption most people have wrong. Find the sharpest reframe...
Grounding rule: Use selected energies as creative steering. If an energy does not fit
the transcript, use the closest grounded version — never invent facts or emotions.
```

When empty: `formatEnergyContext([])` returns `""` — prompt is identical to pre-CE-A behavior.

---

## Energy Options

| Label | Tagline | Direction |
|-------|---------|-----------|
| Balanced | (default) | Automatic — Virnix picks the angle |
| Tactical | Steps · Tips · Takeaways | Save-worthy, actionable, clear steps |
| Contrarian | Challenge · Reframe · Flip | Assumption-breaking, sharp position |
| Analytical | Mechanism · Pattern · Why | Cause-effect, system, mechanism-first |
| Reflective | Meaning · Identity · Worldview | Deeper meaning, identity shift |
| Relatable | Story · Emotion · Human | Human tension, confession, story beats |
| Harsh Truth | Direct · Uncomfortable · Grounded | Plain uncomfortable truth, no hedging |

---

## Validation Status

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- opener-audit.ts: ✅ ALL CHECKS PASS (0 failures, 0 creator-specific openers)
- Mock flow: ✅ unaffected (bypasses generate() before energyIds are used)
- Real AI flow: ✅ energy context correctly injected when energies selected
- Empty selection: ✅ no-op (prompt identical to balanced/default mode)
