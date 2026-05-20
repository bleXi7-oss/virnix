# Creator Energy QA — CE-QA-A

**Phase:** CE-QA-A
**Date:** 2026-05-20
**Scope:** Static validation of Creator Energy Selection (CE-A)
**Script:** `scripts/qa/creator-energy-audit.ts`
**Cost:** $0 (no API calls)

---

## Summary

| Metric | Result |
|--------|--------|
| Energies defined | 6 |
| Single-energy modes tested | 6 |
| Multi-energy combos tested | 3 |
| Allowlist: valid IDs checked | 6 |
| Allowlist: invalid inputs checked | 10 |
| Transcript types tested | 3 (creator/business, science, philosophy) |
| Test failures | **0** |
| Warnings | **0** |
| Status | **✓ ALL CHECKS PASS** |

---

## Issues Found and Fixed

### P1 — Variation angle vs. creator energy priority (FIXED before push)

**Problem:** The GENERATION PROFILE contained both the random variation angle (curiosity/controversy/etc.) and the creator energy directives. The instruction "Apply this angle to all 5 platforms" referred ambiguously to "this angle." The model could have prioritized the random variation angle over the creator-selected energy.

**Fix:** Added `Priority:` instruction to `formatEnergyContext()` in `app/lib/creator-energy/prompt-context.ts`:

```
Priority: These energy directives are the primary creative direction for this generation.
The variation profile above provides structural and rhythmic scaffolding.
```

**Verification:** Second run of `creator-energy-audit.ts` passed all checks including section 8 (Variation Angle vs. Energy Priority).

---

## Check Results

### 1. Balanced / Empty Mode

- `formatEnergyContext([])` returns exact empty string ✓
- Balanced mode: `energyContext = ""` → prompt byte-for-byte identical to pre-CE-A ✓

### 2. Single-Energy Contexts (6 energies)

For each energy: Tactical, Contrarian, Analytical, Reflective, Relatable, Harsh Truth:

- Correct label line (`Creator energy: <Label>`) ✓
- Prompt directive present ✓
- Grounding rule present ✓
- Priority / primary creative direction instruction present ✓

All 24 assertions passed.

### 3. Multi-Energy Combinations

Tested: Tactical + Analytical, Contrarian + Reflective, All 6 energies:

- All labels present in combined output ✓
- All directives present in combined output ✓
- Exactly 1 grounding rule (not duplicated per energy) ✓

All 9 assertions passed.

### 4. isValidEnergyId Allowlist

Valid IDs accepted (6 IDs):
- tactical, contrarian, analytical, reflective, relatable, harsh-truth → all `true` ✓

Invalid inputs rejected (10 inputs):
- `"unknown"`, `""`, `"Tactical"`, `"TACTICAL"`, `null`, `0`, `undefined`, `"harsh_truth"`, `"harsh truth"`, `"HARSH-TRUTH"` → all `false` ✓

All 16 assertions passed. Case-sensitive, type-safe, injection-safe.

### 5. Prompt Injection Position & Structure

Using `buildPrompt()` with Analytical energy on all 3 transcript types:

- `Creator energy: Analytical` appears in creator/business prompt ✓
- Energy context is inside GENERATION PROFILE block (after `━━━ GENERATION PROFILE ━━━`) ✓
- Energy context appears BEFORE platform requirements (model sees energy first) ✓
- Analytical energy injects correctly into science transcript prompt ✓
- Reflective energy injects correctly into philosophy transcript prompt ✓

All 5 assertions passed.

### 6. Balanced Mode Prompt Integrity

- Balanced mode prompt has NO `Creator energy:` injection ✓
- Balanced mode prompt still has all platform sections ✓
- TikTok section present in balanced prompt ✓

All 3 assertions passed. No-op contract confirmed.

### 7. Directive Specificity

- No directives start with vague improvement words (good, nice, great, better, more, improve, make it) ✓
- All directives ≥ 60 characters (sufficiently specific) ✓
- No directives mention a specific platform (cross-platform steering confirmed) ✓

All 3 assertions passed.

### 8. Variation Angle vs. Creator Energy Priority

- Energy context has explicit priority instruction (resolves variation angle ambiguity) ✓

Without priority instruction: model may apply random variation angle instead of selected energy.
With priority instruction: creator energy takes precedence; variation profile provides structural scaffolding only.

### 9. Domain Safety — Grounding Rule Adequacy

- Grounding rule explicitly handles mismatched energy/transcript scenarios (`does not fit` / `closest grounded`) ✓
- Grounding rule explicitly prohibits invented facts/emotions (`never invent`) ✓
- All 6 individual energies carry the fabrication prohibition ✓

All 8 assertions passed.

---

## Validation Runs

**Run 1 (before fix):**
```
Test failures: 1
Warnings: 6
Status: ✗ 1 FAILURE — Energy context has NO priority instruction
```

**Run 2 (after P1 fix):**
```
Test failures: 0
Warnings: 0
Status: ✓ ALL CHECKS PASS
```

---

## Full Build Validation

Run after P1 fix was applied:

```
npm.cmd run build   → ✅ TypeScript clean, compiled in 14.4s
npm.cmd run lint    → ✅ clean
opener-audit.ts     → ✅ ALL CHECKS PASS (0 failures, 0 creator-specific, 0 near-duplicates)
creator-energy-audit.ts → ✅ ALL CHECKS PASS (0 failures, 0 warnings)
```

---

## Verdict

**SAFE TO KEEP CREATOR ENERGY: YES**

The Creator Energy Selection feature is structurally sound:

- Empty selection (Balanced) is a guaranteed no-op — existing generation behavior is fully preserved
- Server-side allowlist prevents any injection attack via energyIds
- Energy context lands in the correct prompt position (after GENERATION PROFILE header, before platform requirements)
- Priority instruction ensures creator-selected energy takes precedence over the random variation angle
- Grounding rule prevents the model from hallucinating facts or emotions to satisfy an energy choice that doesn't fit the transcript
- All 6 directives are cross-platform, sufficiently specific, and free of platform-locked language

---

## Next Recommended Step

**Phase CE-B — Real AI energy output testing**

Run actual generations with each of the 6 energies against 2–3 transcript types (creator, science, philosophy) and evaluate:
1. Does the energy direction visibly steer TikTok, Twitter, LinkedIn, Instagram tone?
2. Does "Contrarian" vs. "Analytical" produce meaningfully different outputs on the same transcript?
3. Does the grounding rule hold for mismatched pairs (e.g., Harsh Truth on a philosophical transcript)?
4. Is Balanced mode byte-for-byte consistent with pre-CE-A output shape?

This requires ANTHROPIC_API_KEY and costs ~$0.05–0.10 per run.
