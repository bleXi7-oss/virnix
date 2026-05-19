# Current Phase — Clip Guide UI

Phase started: 2026-05-19
Status: complete and pushed

---

## Context

Phase 12 (Timeline Intelligence Activation) built the full detection pipeline and wired it to the generation result. Moments were visible only in the dev debug panel.

Phase 13 surfaces that intelligence directly in the main user experience — the first public-facing creator-oriented feature derived from timeline detection.

---

## What Changed

### New: `app/components/generation/ClipMomentCard.tsx`

Single moment card component. Renders:

- Timestamp range (`MM:SS–MM:SS`) in monospace
- Moment type badge with subtle accent color per type
- Confidence indicator (dot + label: "Strong match" / "Good match" / "Possible")
- Suggested hook (prominent, quoted)
- Why it works (psychological context)
- Platform fit tags (top 3, humanized labels)
- Source text preview (monospace, subtle, 2-line clamp)

Left border accent per type:
- `validation_hook` → amber
- `mechanism_reframe` → violet
- `emotional_confession` → rose
- `contrarian_insight` → sky
- `transformation_moment` → emerald
- `educational_gem` → cyan
- Others → zinc

---

### New: `app/components/generation/ClipGuide.tsx`

Section container. Shows top 3 moments (by confidence, already sorted by detector).

- Matching divider-header style as OutputPanel ("Best moments to clip")
- Single card: `rounded-xl border` container, moments separated by thin `h-px` dividers
- Footer: "{N} moments detected · ranked by psychological impact"
- Fully isolated — returns `null` if no moments

---

### Updated: `app/page.tsx`

- `ClipGuide` imported
- Rendered in `phase === "done"` block, **above** `OutputPanel`
- Guard: only renders when `timelineMoments && timelineMoments.length > 0`
- No new state, no new props — reuses existing `timelineMoments` state

---

## Integration Pattern

```
phase === "done"
  ├── ClipGuide (moments)        ← NEW — psychological moment discovery
  ├── OutputPanel (cards)        ← existing generated content
  └── DebugPanel (diagnostics)   ← dev only
```

---

## Component Isolation

- `app/components/generation/ClipGuide.tsx` and `ClipMomentCard.tsx` are fully removable
- Removing them requires only removing the `ClipGuide` import and render in `page.tsx`
- No changes to generation pipeline, timeline detection, types, or API

---

## Validation Status

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- Mock mode: ✅ unaffected (no moments → ClipGuide renders null)
- Real AI mode: ✅ moments flow through to ClipGuide when detected
- Mobile: ✅ flex-wrap on meta row, line-clamp on preview

---

## Known Limitations

- Heuristic detection only — confidence score is relative, not a virality predictor
- No video rendering, no clip export, no editing tools
- English transcripts only
- Top 3 shown; remaining moments accessible via dev debug panel
