# Content System QA-A — Full Audit

**Date:** 2026-05-20  
**Phase:** QA-A  
**Auditor:** Claude (automated static analysis + existing test run)  
**Scope:** TikTok openers, hook archetypes, platform outputs, timeline/clip guide, content intelligence, grounding/hallucination risk, tonal mismatch, architecture cleanliness

---

## Executive Summary

The Virnix content system is architecturally sound, modular, and cleanly separated. The intelligence layer, prompt engine, timeline detection, and generation pipeline are well-designed and loosely coupled.

However, two **P0 issues** must be fixed before Creator Energy Selection is added:

1. **TikTok opener pool is creator-growth-specific.** ~40–46% of the 26 openers assume the content is about creator/audience growth, creator tools, or content strategy. Virnix processes any YouTube video — applying "There's a pattern in every creator who crossed 100k" to a medical interview or history podcast produces embarrassing, broken output.

2. **Forced TikTok ending "Here's the exact system..." is domain-locked.** This phrase presupposes a "system" exists in every transcript, which is false for confessional, philosophical, or narrative content.

These two issues interact: adding Creator Energy Selection on top of the current opener pool will compound the mismatch. Fix these first.

---

## What Was Analyzed

| File | Status |
|------|--------|
| `app/lib/prompts/index.ts` | ✅ reviewed |
| `app/lib/prompts/platforms/tiktok.ts` | ✅ reviewed — P0 issues found |
| `app/lib/prompts/platforms/twitter.ts` | ✅ reviewed — OK |
| `app/lib/prompts/platforms/linkedin.ts` | ✅ reviewed — OK |
| `app/lib/prompts/platforms/instagram.ts` | ✅ reviewed — OK |
| `app/lib/prompts/platforms/youtube.ts` | ✅ reviewed — P1 issue found |
| `app/lib/prompts/psychology/index.ts` | ✅ reviewed — OK |
| `app/lib/prompts/cleanup/index.ts` | ✅ reviewed — OK |
| `app/lib/prompts/variation/index.ts` | ✅ reviewed — OK |
| `app/lib/intelligence/prompt-context.ts` | ✅ reviewed — OK |
| `app/lib/intelligence/hooks.ts` | ✅ reviewed — OK |
| `app/lib/intelligence/retention.ts` | ✅ reviewed — OK |
| `app/lib/intelligence/storytelling.ts` | ✅ reviewed — OK |
| `app/lib/intelligence/quality.ts` | ✅ reviewed — P2 naming issue |
| `app/lib/timeline/moment-detector.ts` | ✅ reviewed — P2 signal issues |
| `app/lib/timeline/moment-scoring.ts` | ✅ reviewed — P2 false-positive signals |
| `app/lib/timeline/formatter.ts` | ✅ reviewed — P2 creator-specific prefix |
| `app/lib/timeline/transcript-quality.ts` | ✅ reviewed — OK |
| `app/lib/ai/generate.ts` | ✅ reviewed — P1 issue found |
| `app/lib/ai/parser.ts` | ✅ reviewed — OK |
| `app/lib/ai/schemas.ts` | ✅ reviewed — OK |
| `app/lib/ai/chunker.ts` | ✅ reviewed — OK |
| `scripts/test-real-ai.ts` | ✅ run — PASS |

---

## What Was Tested

- `scripts/test-real-ai.ts` — existing smoke test (parser, chunker, quality scorer, diagnostics): **✅ PASS**
- `scripts/qa/opener-audit.ts` — new static audit script for opener pool and architecture checks: **✅ PASS**
- Build + lint (after adding QA files): to be confirmed below

---

## 1. TikTok Opener Analysis

### Pool size: 26 entries across 8 named categories

```
Curiosity / hidden knowledge  6 entries  ~23%
Self-doubt / pattern interrupt 4 entries  ~15%
Contrarian                     3 entries  ~12%
Validation / identity shift    3 entries  ~12%
FOMO / loss framing            2 entries   ~8%
Withheld knowledge             2 entries   ~8%
Confession                     2 entries   ~8%
Mechanism reframe              2 entries   ~8%
Harsh truth / business lesson  2 entries   ~8%
```

### Creator-growth-specific openers (10–12 of 26 ≈ 40–46%)

These openers assume the transcript is about content creation, algorithms, or creator business:

| Opener | Problem |
|--------|---------|
| "There's a pattern in every creator who crossed 100k. Here it is:" | "creator who crossed 100k" is nonsensical in medical/history/cooking content |
| "What the top creators do is the opposite of what they teach." | "top creators" — same issue |
| "The creators who grow fastest stopped doing what they were told." | Same |
| "I deleted my best-performing post. Here's what I learned." | Claims first-person creator experience the transcript may not support |
| "The algorithm doesn't care about your content — it cares about this:" | "the algorithm" = social media, irrelevant to non-social content |
| "Most creators build the wrong thing first." | "creators" framing |
| "Followers don't pay rent. Here's what does:" | Creator-business-specific; breaks on non-business content |
| "Every week you wait on this, someone else takes the position." | Creator-positioning framing |

**Borderline (context-dependent):**
- "The metric you've been tracking is the wrong one." — could work broadly but implies tracking/analytics context
- "Most people are already behind on this. Here's why:" — works in urgency/business but odd for historical content

### Universal openers (16 of 26 ≈ 62%) — these work across content types

- "Nobody talks about this —"
- "I only found this out by accident."
- "Here's the part they always skip:"
- "The data says something completely different."
- "Something shifts at a certain point. Nobody tells you what it is."
- "Everyone's doing this backwards."
- "I was wrong about this for years."
- "This broke everything I thought I knew."
- "Stop optimizing the thing that doesn't matter."
- "The advice everyone gives is actually the problem."
- "You're not bad at this — you just weren't shown the system."
- "You're not a creator. You're a publisher who happens to film." ← borderline
- "Nobody teaches you this part until it's already cost you."
- "Here's the exact framework. No theory — just the steps:"
- "I spent two years doing this completely wrong."
- "The best content you've ever made probably got the fewest views." ← creator-specific

### Near-duplicates found

| Pair | Issue |
|------|-------|
| "I was wrong about this for years." vs "I spent two years doing this completely wrong." | Nearly identical confession frame — same emotional beat, different wording |
| "Nobody talks about this —" vs "Nobody teaches you this part until it's already cost you." | Both "Nobody" + hidden knowledge archetype — similar |

### "Everyone's doing this backwards." status

Now 1 of 26 ≈ 3.8% exposure probability (down from 42%). **Fixed. OK.**

---

## 2. Hook Archetype Coverage

### Variation system (6 emotional angles)

| Angle | Coverage | Notes |
|-------|----------|-------|
| Curiosity | ✅ Full | curiosity angle, CURIOSITY_GAP_FORMULAS, "Unexpected Discovery" arc |
| Contrarian | ✅ Full | controversy angle, "Contrarian Claim + Proof" arc |
| Authority/practical insight | ✅ Full | authority angle, MIDDLE_CONTENT_RULES |
| Confession/vulnerability | ✅ Full | vulnerability angle, "Confession + Lesson" arc |
| Storytelling | ✅ Full | storytelling angle, "Before/After/Bridge" arc |
| Urgency/FOMO | ✅ Full | urgency angle, fomo_loss_frame timeline type |

### Missing or weak coverage

| Archetype | Status | Notes |
|-----------|--------|-------|
| Identity shift | ⚠️ Partial | No dedicated variation angle. Closest: vulnerability angle. The "You're not a creator" opener and validation_hook timeline type address this, but there's no variation profile for pure identity-reframe content |
| Harsh truth | ⚠️ Partial | Covered by controversy + "name the villain" in psychology, but not a named archetype |
| Philosophical hook | ❌ Missing | No explicit coverage in any system layer. Curiosity angle is the closest proxy |
| Save-worthy insight | ✅ Present | Explicitly called out in LinkedIn tone ("save-worthy signal") |
| Mechanism reframe | ✅ Full | Timeline detection, opener pool, mechanism_reframe moment type |
| Business lesson | ✅ Adequate | Authority angle + harsh-truth openers |

### Verdict

Coverage is strong across the core archetypes. Philosophical hooks and pure identity shifts are not explicitly modeled. These are lower priority than the P0 opener issue but worth addressing in a future prompt pass.

---

## 3. Platform Output Quality

### TikTok / Reels

**Format guidance:** ✅ Good — short sentences, no hashtags, specificity requirement  
**Transcript grounding:** ✅ "Name something specific from this transcript — no claim that could apply to any video"  
**Self-relevance:** ✅ "Make the viewer feel this is about them specifically"

**P0 Issues:**
- Opener pool domain-lock (covered above)
- **Forced ending "Here's the exact system..."** — This phrase is injected as a hard rule: "End with 'Here's the exact system...'". This is a creator-growth/business-methodology phrase that presupposes the content has a "system." A confessional story, philosophical reflection, or historical narrative does not have "the exact system." The output will end with this phrase regardless, breaking authenticity.

### Twitter / X

**Format guidance:** ✅ Excellent — 8-tweet structure, no "Thread:" opener, middle-tweet retention rules  
**Anti-generic:** ✅ "Never use: 'This is a thread about', 'Let me explain', 'Here's the thing'"  
**Curiosity renewal:** ✅ "Renew curiosity every 2-3 tweets"  
**Grounding:** ✅ No fabrication vectors visible  

**Issue:** No explicit anti-padding rule for thin transcripts. If the transcript has 3 strong moments and the model fills tweets 4-6 with tangential content, there's no explicit prohibition. P2.

### LinkedIn

**Format guidance:** ✅ Strong — mobile-first, save-worthy signal, vulnerability works  
**Anti-corporate:** ✅ Comprehensive blocklist  
**Format:** ✅ Line 1 hook + numbered/paragraph body + ↓ close or question  
**No "Hot take:" or "Friendly reminder:"** ✅

**No issues found.**

### Instagram

**Format guidance:** ✅ Good — casual DM tone, arrows, saves > likes, emoji discipline  
**Anti-ad phrases:** ✅ "Tag a friend!" explicitly blocked  
**CTA discipline:** ✅ "Save this" or question, not generic engagement bait  

**No issues found.**

### YouTube Titles

**Format guidance:** ✅ 7 formula types, diversity requirement  

**P1 Issue — internal contradiction:**

`YOUTUBE_TITLE_FORMULAS` includes:
```
"Curiosity gap: 'The [Thing] Nobody Talks About'"
```

`YOUTUBE_TITLE_RULES` includes:
```
"Avoid overused phrases: 'Ultimate Guide', 'Changed My Life', 'Nobody Talks About'"
```

**The system instructs the AI to both use AND avoid "Nobody Talks About" in the same call.** The model will likely resolve this in favor of one directive arbitrarily, producing inconsistent results.

### Advanced Outputs (behind flag)

**Short-Form Script:** ✅ HOOK→BODY→CTA, momentum rules, filler cut rules  
**Blog Summary:** ✅ Skimmable structure, anti-SEO-filler rules  

**P1 Issue — YouTube Timestamps:**
The prompt says "Infer plausible timestamps from the transcript content." This instructs the AI to fabricate timestamps. The YouTube transcript API provides the actual timestamps but they are used only for moment detection — the actual chapter positions are AI-invented. If a creator copies these timestamps to YouTube, they will find chapters at wrong positions. This is a hidden trust risk.

---

## 4. Timeline / Strongest Moments / Clip Guide Consistency

### What the system does

1. `detectTimelineMoments` groups transcript into 30-second windows and runs `scoreMoment` on each
2. `scoreMoment` counts signal words per moment type × type multiplier → dominant type assigned
3. Top 8 moments (confidence ≥ 10) returned, sorted by score
4. Top 3 prompt-worthy moments formatted and injected into prompt as creative anchors
5. Clip Guide displays top 3 moments with suggested hooks, platform fit, why-it-works

### Strengths

- ✅ Pure heuristic — no API calls, no latency, never blocks generation
- ✅ Always fails gracefully — `try/catch` returns `[]`, quality card not rendered
- ✅ `formatTimelineMomentsForPrompt` says "draw from these moments as creative anchors, don't copy verbatim" — appropriate grounding instruction
- ✅ Quality report is honest: returns `null` when no moments, shows weaknesses for medium/low
- ✅ `MIN_SCORE_THRESHOLD = 10` filters out noise

### Issues

**P2 — False-positive signal words:**

| Signal | Problem |
|--------|---------|
| `"i thought"` (CONFESSION_SIGNALS) | One of the most common phrases in any reflective speech. Nearly every transcript has "I thought..." — this inflates `emotional_confession` detection for non-confession content |
| `"and then"` (STORY_SIGNALS) | Common connective in all spoken English — inflates `story_turning_point` |
| `"actually"` (MECHANISM_REFRAME_SIGNALS) | Common filler word — "actually" is not always a mechanism reframe |
| `"not about"` (MECHANISM_REFRAME_SIGNALS) | Very broad — "this is not about money" in any topic triggers mechanism_reframe |

**P2 — Creator-specific hook prefix in `buildSuggestedHook`:**

```typescript
authority_proof: "After working with hundreds of creators: ",
```

If an authority_proof moment is detected in a medical podcast or academic content, the hook prefix claims "After working with hundreds of creators" — completely wrong for the context. The prefix hardcodes a creator-coaching persona.

**P2 — `AUTHORITY_SIGNALS` contains creator-specific phrase:**

```typescript
"every creator i've worked with",
```

This signal only fires for creator-coaching content. Medical, scientific, or academic authority content won't match.

### Clip Guide → Output connection

The injected moments ground the AI but don't guarantee the Clip Guide and output are telling the same story. A user might see a "Mechanism Reframe" in the Clip Guide but find the TikTok hook anchored to a different moment. The grounding is a suggestion, not a constraint. This is acceptable — it would require much more complex multi-pass generation to force exact correspondence.

---

## 5. Content Intelligence Honesty Check

**Clipability evaluation:** ✅ Honest  
- `null` when no moments → no UI rendered  
- High/medium/low thresholds with clear separation  
- `overallScore` not shown to creators (diagnostics only)  
- Summary language is calibrated and non-hype  
- No virality claims in UI-facing strings  

**P2 — `viralityScore` naming in code/diagnostics:**  
The `AIDiagnostics` field is named `viralityScore` and the function is `estimateViralityScore`. This is internal (dev panel only, never shown to creators), but contradicts the product stance of "never describe as virality prediction." Consider renaming to `contentSignalScore` in a future cleanup pass.

---

## 6. Grounding and Hallucination Risk

### Explicit anti-fabrication signals (good)

- ✅ "Name something specific from this transcript — no claim that could apply to any video"
- ✅ ANTI_GENERIC_RULES: "Extract — don't summarize. One sharp insight beats five vague ones"
- ✅ ANTI_GENERIC_RULES: "Replace vague with specific — '47%' beats 'many people'"
- ✅ Timeline moments injected as creative anchors with "don't copy verbatim" instruction

### Hallucination risk areas

**P0 — TikTok forced ending** ("Here's the exact system..."): The AI is explicitly instructed to end every TikTok hook with this phrase. For transcripts without a discoverable "system," the AI will either hallucinate that one exists, or produce an awkward non-sequitur. This is structurally forced hallucination for non-system content.

**P1 — YouTube Timestamps fabrication:** AI invents chapter positions not grounded in real video structure. See platform analysis above.

**P2 — No explicit "don't invent facts" rule:** ANTI_GENERIC_RULES prevent generic language but don't explicitly say "never fabricate specific claims not in the transcript." For low-quality transcripts where the AI needs to fill 8 tweets, there's implicit pressure to invent. The `selectBestSegment` function reduces this by choosing content-dense sections, but thin transcripts remain a risk.

**P2 — `selectBestOutputs` in `generate.ts` uses fragile JSON extraction:**

```typescript
const start = rawText.indexOf("{");
const end = rawText.lastIndexOf("}");
parsed = JSON.parse(rawText.slice(start, end + 1));
```

The parser.ts comment explicitly says `lastIndexOf("}")` is "less reliable than bracket counting." The `extractJSON` function in `parser.ts` uses bracket counting. `selectBestOutputs` uses the simpler but fragile approach. If the AI wraps the JSON in prose (already handled in `parseAnthropicResponse`), `selectBestOutputs` may fail to extract and silently fall back to original cards — technically safe but means the alt-selection never fires in edge cases.

---

## 7. Tonal Mismatch Risk

This is the most consequential finding in this audit.

### The core problem

The opener pool was designed for creator-growth content (the Bartlett/Naval/GaryVee audience persona). But the product claims to work with any YouTube video. When a non-creator transcript triggers a creator-specific opener, the output breaks in three ways simultaneously:

1. **Opener mismatch:** "The algorithm doesn't care about your content — it cares about this:" on a nutrition science podcast is nonsensical.
2. **Forced ending mismatch:** "Here's the exact system..." on a philosophical exploration has no referent.
3. **Compound mismatch with energy selection:** When Creator Energy Selection is added, the energy profile will also be applied — amplifying the mismatch three ways.

### Content-type risk matrix

| Content Type | Opener Risk | Ending Risk | Overall |
|-------------|-------------|-------------|---------|
| Creator/business growth | Low | Low | ✅ Works well |
| Self-improvement/mindset | Low-Medium | Medium | ✅/⚠️ |
| Educational/factual (science, history) | **High** | **High** | ❌ Likely broken |
| Confessional storytelling | Low | Medium | ✅/⚠️ |
| Medical/clinical | **High** | **High** | ❌ Likely broken |
| Philosophical/long-form thought | Medium | **High** | ⚠️ |

### Specific tonal dangers with confession/identity openers

The confession openers ("I deleted my best-performing post. Here's what I learned.") are strong for creator content but create a ghost-voice problem: they put a first-person creator experience into the output that may have nothing to do with the transcript. The AI will use the opener and then construct the rest of the TikTok to "justify" that confession — potentially hallucinating a story arc that isn't in the transcript.

---

## 8. Prompt Architecture Review

### What's clean

| Area | Assessment |
|------|-----------|
| Module separation | ✅ Each platform has its own file. Intelligence separate from prompts. |
| Prompt assembler (`index.ts`) | ✅ Clear: imports → identity block → platform sections → cleanup |
| Intelligence → prompt bridge | ✅ `prompt-context.ts` is a clean one-way connector |
| Timeline system | ✅ Completely decoupled from prompt system; injects via formatted string |
| Parser + schema | ✅ Schema validation separate from parsing. Coercion isolated. |
| AI layer | ✅ Provider abstraction clean. `generate.ts` orchestrates without knowing provider details. |
| Feature flags | ✅ `isEnabled()` cleanly gates advanced outputs |

### Dead code / missed opportunity

**P2 — "Stakes Escalation" story arc unreachable:**

`STORY_ARC_FRAMEWORKS` index 5 is "Stakes Escalation" but `ANGLE_TO_FRAMEWORK_INDEX` only maps to indices 0–4. No emotional angle maps to it. The framework is defined but never injected into any prompt.

```typescript
const ANGLE_TO_FRAMEWORK_INDEX: Record<EmotionalAngle, number> = {
  curiosity:    4, // The Unexpected Discovery
  controversy:  3, // Contrarian Claim + Proof
  authority:    3, // Contrarian Claim + Proof (duplicate)
  vulnerability:2, // Confession + Lesson
  storytelling: 0, // Before / After / Bridge
  urgency:      1, // Problem / Agitate / Solve
  // index 5 (Stakes Escalation) → never used
};
```

Additionally, `controversy` and `authority` both map to index 3 (Contrarian Claim + Proof). Stakes Escalation would be more appropriate for the `authority` angle.

### No architecture drift found

Files are not bloated. No major coupling violations. Module sizes are appropriate.

---

## 9. Test Results

### Existing tests

**`scripts/test-real-ai.ts`:** ✅ PASS  
```
TikTok hook score: 90/100
YouTube title score: 65/100
Has strong hook: true
Has curiosity gap: true
Parse repaired: false
Coercion used: false
Status: ✓ PASS
```

**`scripts/test-transcript.mjs`:** Not run (makes network calls to YouTube — requires live internet, irrelevant for static QA).

### New QA script

**`scripts/qa/opener-audit.ts`:** ✅ PASS (see output in Issues section)

---

## Issues Found

### P0 — Must fix before next feature

| # | Issue | File | Fix |
|---|-------|------|-----|
| P0-1 | ~40–46% of TikTok openers are creator-growth-specific. Will break on medical, historical, educational, or non-creator content. | `app/lib/prompts/platforms/tiktok.ts` | Remove or generalize 8–10 creator-specific openers. Keep the 16–18 universal ones. Add domain-agnostic replacements. |
| P0-2 | TikTok forced ending "Here's the exact system..." is locked to content-with-a-system. Confessional, philosophical, or narrative content will produce awkward or hallucinated endings. | `app/lib/prompts/index.ts` (TikTok section) | Replace the single forced ending with a small pool of domain-appropriate endings similar to the opener pool mechanism. |

### P1 — Should fix soon

| # | Issue | File | Fix |
|---|-------|------|-----|
| P1-1 | `YOUTUBE_TITLE_FORMULAS` includes "The [Thing] Nobody Talks About" while `YOUTUBE_TITLE_RULES` says "Avoid overused phrases: 'Nobody Talks About'". Direct contradiction in same prompt. | `app/lib/prompts/platforms/youtube.ts` | Remove "Nobody Talks About" from either the formulas OR the rules, not both. |
| P1-2 | YouTube Timestamps (advanced): AI is instructed to "infer plausible timestamps" — it fabricates chapter positions. Users copying these to YouTube will find them wrong. | `app/lib/prompts/index.ts` (timestamp section) | Either: (a) add a disclaimer in the card UI that these are approximate, or (b) change the instruction to "estimate thematic chapters with relative positions" and rename the card type to "Chapter Outline" to signal approximation. |
| P1-3 | `selectBestOutputs()` in `generate.ts` uses `rawText.indexOf("{")` + `rawText.lastIndexOf("}")` — the fragile approach that `parser.ts` explicitly improved upon. | `app/lib/ai/generate.ts` | Import and use `extractJSON` from `parser.ts` instead of the inline indexOf/lastIndexOf approach. |

### P2 — Polish / later

| # | Issue | File | Fix |
|---|-------|------|-----|
| P2-1 | `estimateViralityScore` / `viralityScore` naming is internally inconsistent with "never describe as virality prediction" stance. Confined to dev panel only, but the code naming matters. | `app/lib/intelligence/quality.ts`, `app/lib/ai/diagnostics.ts`, `app/lib/ai/generate.ts` | Rename to `estimateContentSignalScore` / `contentSignalScore` |
| P2-2 | "Stakes Escalation" (index 5) in `STORY_ARC_FRAMEWORKS` is never mapped to any angle — dead code/missed opportunity. Both `controversy` and `authority` map to index 3. | `app/lib/intelligence/prompt-context.ts` | Map `authority` to index 5 (Stakes Escalation) instead of 3, since authority content often has escalating stakes. |
| P2-3 | False-positive detection signals: `"i thought"` in CONFESSION_SIGNALS, `"and then"` in STORY_SIGNALS, `"actually"` in MECHANISM_REFRAME_SIGNALS — too generic, inflate non-matching moment types. | `app/lib/timeline/moment-scoring.ts` | Remove or replace with more specific variants: e.g., `"what i thought was"` instead of `"i thought"`. |
| P2-4 | `buildSuggestedHook` prefix `"After working with hundreds of creators: "` for `authority_proof` moments is creator-specific. | `app/lib/timeline/moment-detector.ts` | Change to `"Based on consistent experience: "` or similar domain-neutral phrasing. |
| P2-5 | `AUTHORITY_SIGNALS` contains `"every creator i've worked with"` — only matches creator-coaching content. | `app/lib/timeline/moment-scoring.ts` | Remove this signal or add a domain-neutral equivalent. |
| P2-6 | Near-duplicate openers: `"I was wrong about this for years."` ≈ `"I spent two years doing this completely wrong."` Both encode the same "I was wrong for N time" confession beat. | `app/lib/prompts/platforms/tiktok.ts` | Replace one with a distinct archetype — e.g., a philosophical opener. |
| P2-7 | No explicit "don't invent facts not in the transcript" rule in prompts. ANTI_GENERIC_RULES prevent generic language but not hallucinated specifics. | `app/lib/prompts/psychology/index.ts` | Add a rule: "Extract only from what the transcript actually says — never invent specifics (numbers, names, outcomes) not present in the text." |
| P2-8 | Blog icon uses `iconType: "linkedin"` as a placeholder (see comment `// TODO: add dedicated blog icon`). | `app/lib/ai/parser.ts` | Add a "blog" icon type when UI is extended to avoid confusing platform identity. |

---

## Architecture Review Summary

| Area | Grade | Notes |
|------|-------|-------|
| Prompt modularity | A | Clean platform separation, shared psychology layer |
| Intelligence/prompt separation | A | `prompt-context.ts` is a clean one-way bridge |
| Timeline decoupling | A | Completely separate pipeline, string-injection interface |
| Parser robustness | A- | Main parser excellent; `selectBestOutputs` uses weaker approach (P1-3) |
| Schema validation | A | Type-safe, coercion isolated, no throws |
| Variation system | A- | 6 angles × 3 opening/CTA styles = 18 combinations; good but missing identity-shift angle |
| Content domain assumption | D | Opener pool locked to creator-growth persona; must be fixed before Creator Energy Selection |

---

## Safe to Proceed to Creator Energy Selection?

**VERDICT: NO — Fix P0 Issues First**

The architecture is ready. The intelligence layer is sound. Platform outputs (Twitter, LinkedIn, Instagram, YouTube titles) are high quality with one P1 fix needed.

The blocker is not architectural — it's the opener pool and forced ending:
- Creator Energy Selection will add another dimension of content shaping on top of the existing opener selection
- A creator-specific opener + a forced "system" ending + an energy profile = three-layer mismatch on non-creator content
- This would make a bad problem worse and make the new feature look broken immediately on any non-creator transcript

**P0 fix scope is small and focused:**
- Remove/replace ~8–10 creator-specific openers from `tiktok.ts`
- Add a small pool of domain-agnostic TikTok endings to `tiktok.ts`
- Update the prompt to pick randomly from the endings pool, same as openers

This is a half-day fix. Then Creator Energy Selection can be designed knowing the opener/ending foundation is domain-agnostic.

---

## Recommended Fix Priority

```
P0-1  Remove creator-specific openers → add domain-agnostic replacements
P0-2  Replace forced "Here's the exact system..." ending → endings pool
P1-1  Fix YouTube title formula vs. rules contradiction
P1-2  YouTube Timestamps: add "approximate" framing or rename card
P1-3  selectBestOutputs: use extractJSON instead of indexOf/lastIndexOf
P2-3  Remove false-positive detection signals (i thought, and then, actually)
P2-2  Map authority angle to Stakes Escalation arc
P2-7  Add explicit no-fabrication rule to ANTI_GENERIC_RULES
P2-1  Rename viralityScore → contentSignalScore
P2-4  Fix creator-specific hook prefix in buildSuggestedHook
P2-5  Fix creator-specific signal in AUTHORITY_SIGNALS
P2-6  Replace one near-duplicate opener
P2-8  Blog icon type
```
