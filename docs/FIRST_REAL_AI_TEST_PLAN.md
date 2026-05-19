# Virnix — First Real AI Test Plan

Step-by-step plan for the first controlled real AI generation run.

**Prerequisite:** You have an Anthropic API key (`sk-ant-...`).  
Get one at: https://console.anthropic.com/

---

## Phase 1 — Local Environment Setup

### Step 1: Verify .env.local exists

Open `C:\Users\MihaKos\Projects\VirnixApp\.env.local`.

If missing, create it from the example:

```powershell
Copy-Item .env.example .env.local
```

### Step 2: Set required values

Edit `.env.local` to contain exactly this (replace the key placeholder):

```env
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE

NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true
NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS=false
NEXT_PUBLIC_FLAG_DEV_DEBUG=true

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Rules:**
- `ANTHROPIC_API_KEY` must NOT have a `NEXT_PUBLIC_` prefix — it runs server-side only
- `ADVANCED_OUTPUTS` stays `false` for the first test — simpler output, cheaper, easier to debug
- `DEV_DEBUG` stays `true` — you need the diagnostics panel to inspect the run

### Step 3: Confirm .env.local is gitignored

```powershell
git status
```

`.env.local` must NOT appear in the output. If it does, stop and check `.gitignore`.

---

## Phase 2 — Local Smoke Test (Zero Cost)

Run this before spending any API credits.

```powershell
npx.cmd tsx scripts/test-real-ai.ts
```

Expected output:
```
Status: ✓ PASS
parse repaired: false
virality score: >0/100
```

If this fails, fix the issue before proceeding. The parser and quality scorer must work correctly before a real API call is worth making.

---

## Phase 3 — Start Dev Server

```powershell
npm.cmd run dev
```

Wait for:
```
▲ Next.js 16.2.6 (Turbopack)
✓ Ready in X.Xs
```

Open `http://localhost:3000` in a browser.

**Verify (before generating anything):**
- [ ] Page loads without errors
- [ ] No ErrorBoundary fallback is visible
- [ ] Dark/light mode toggle works
- [ ] Generate button is visible

---

## Phase 4 — Choose a Test Video

Pick a **short YouTube video** for the first test:
- Under 5 minutes
- Clear speech, minimal filler
- Content-dense (business, education, creator advice, personal story)
- English language

**Good test content types (see `docs/test-fixtures/` for reference):**
- Creator/business advice (see `creator-business-short.md`)
- Personal transformation story (see `podcast-story-short.md`)
- Educational concept explanation (see `educational-short.md`)

**Avoid for first test:**
- Heavily sponsored videos (sponsor filler degrades the transcript segment)
- Videos with lots of background music or cross-talk
- Videos longer than 10 minutes (higher token cost, harder to debug)

---

## Phase 5 — First Generation Run

1. Paste the YouTube URL into the Virnix input field.
2. Click **Generate**.
3. Wait. The first real AI call typically takes **5–20 seconds**.

**What you should see:**
- Loading animation runs
- 5 output cards appear: TikTok, Twitter, LinkedIn, Instagram, YouTube Titles
- Debug panel appears collapsed below the cards (click to expand)

**What would be a problem:**
- ErrorBoundary fallback renders instead of cards
- Spinning never stops (likely timeout — check terminal)
- Cards render but content is blank or shows "[object Object]"

---

## Phase 6 — Inspect Terminal Logs

In the terminal running `npm.cmd run dev`, look for:

```
[VIRNIX_AI] provider=anthropic elapsed=Xms tokens=~XXXX chunks=1
            type=core retries=0 fallback=false repaired=false coerced=false
            stopReason=end_turn score=XX
```

**What to check:**

| Field | Expected | Concern if |
|---|---|---|
| `provider` | `anthropic` | `mock` means flag is off |
| `elapsed` | Under 30,000ms | Over 45,000ms = timeout |
| `retries` | `0` | `2` = provider had issues |
| `fallback` | `false` | `true` = transcript fetch failed |
| `repaired` | `false` | `true` = JSON parser had to recover |
| `coerced` | `false` | `true` = output schema had gaps |
| `stopReason` | `end_turn` | `max_tokens` = output was truncated |
| `score` | `40–100` | Under `30` = weak hooks |

---

## Phase 7 — Inspect the Debug Panel

In the browser, expand the debug panel (bottom of the page).

Confirm the same values as the terminal log appear:
- Provider = anthropic
- Elapsed = reasonable number
- Fallback = false
- Parse repaired = false

---

## Phase 8 — Review Output Quality

Open `docs/OUTPUT_QUALITY_CHECKLIST.md` and score the 5 core cards:

- TikTok Hook Script
- Twitter / X Thread
- LinkedIn Post
- Instagram Caption
- YouTube Title Ideas

**Minimum acceptable bar for v1:**
- Average score ≥ 3/5 on each criterion
- No coercion used
- No fallback used
- Stop reason = `end_turn` (not `max_tokens`)

If any card scores 1–2 on curiosity or specificity consistently, it points to a prompt instruction that needs strengthening. Note it — do not change the prompt until you have 3 test runs to confirm the pattern.

---

## Phase 9 — (Optional) Test Advanced Outputs

Only proceed here after core outputs pass Phase 8.

1. Stop the dev server.
2. Edit `.env.local`: set `NEXT_PUBLIC_FLAG_ADVANCED_OUTPUTS=true`.
3. Restart: `npm.cmd run dev`.
4. Generate again with the same YouTube URL.
5. Confirm 3 additional cards appear: Short-Form Script, YouTube Timestamps, Blog Summary.
6. Score using `docs/OUTPUT_QUALITY_CHECKLIST.md`.

**Token cost note:** Advanced mode requests ~300–500 more output tokens than core mode.

---

## Phase 10 — Cost Check

After the test run, check the Anthropic usage dashboard:  
https://console.anthropic.com/usage

Confirm the cost per call is in an acceptable range. Typical for a 3-5 min YouTube video:
- Core output: ~$0.02–$0.08 per call
- Advanced output: ~$0.04–$0.12 per call

These are rough estimates — actual cost depends on transcript length and model pricing.

---

## Rollback

If anything goes wrong or costs run unexpectedly:

**Local rollback (immediate):**
1. Edit `.env.local`: set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=false`.
2. Save and the dev server hot-reloads.
3. The app returns to mock mode instantly.

**Vercel rollback:**
1. Go to Vercel → Settings → Environment Variables.
2. Set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` to `false`.
3. Trigger a redeploy.

No code changes are needed for rollback. The mock flow is always present.

---

## Known Issues to Watch For

| Issue | Symptom | Fix |
|---|---|---|
| Transcript fetch fails | `fallback=true` in logs | Use a different video; confirm it has captions |
| Response truncated | `stopReason=max_tokens` | Raise `maxTokens` in `app/lib/ai/generate.ts` |
| Blank cards after generation | `coerced=true` or missing fields | Check parser logs; may need prompt schema reinforcement |
| Timeout (>45s) | Terminal shows timeout error | Retry; if consistent, check Anthropic API status |
| Key not loaded | `provider=mock` despite flag `true` | Confirm `.env.local` has the key; restart dev server |

---

## After the First Successful Run

1. Record results in `docs/OUTPUT_QUALITY_CHECKLIST.md`.
2. If prompts need improvement, make one targeted change at a time.
3. Run `npm.cmd run build` and `npm.cmd run lint` before committing any changes.
4. Update `docs/CURRENT_PHASE.md` with results.
