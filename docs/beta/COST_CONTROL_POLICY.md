# Virnix Beta — Cost Control Policy

**Phase:** FREE-BETA-STRATEGY-A
**Date:** 2026-05-22
**Budget cap:** €100 maximum extra test spend

---

## Core Principle

**False growth is worse than uncontrolled cost.**

A free beta with no limits is not a beta. It is an invitation for abuse and burned runway.
The purpose of this document is to define every cost control mechanism before the first user signs up.

---

## €100 Budget Breakdown

| Category | Allocation | Notes |
|----------|-----------|-------|
| Anthropic API (AI calls) | €65 | Main variable cost |
| Supabase | €10 | Free tier likely sufficient; buffer for upgrades |
| Vercel | €10 | Free tier likely sufficient during beta |
| Marketing micro-experiments | €15 | Promoted posts, small ad tests |
| **Total** | **€100** | Hard cap — stop and review at €80 |

**Review trigger:** If total spend reaches €80, pause all public promotion and review usage patterns before continuing.

**Hard stop:** If total spend reaches €100, switch to mock mode immediately, review what happened, and plan next steps before spending more.

---

## Expected AI Cost Per Generation

Based on measured QA data (LANG-REAL-A, LANG-REAL-A-FIX):

| Generation type | Tokens (approx) | Cost (approx) |
|----------------|----------------|---------------|
| Core 5 outputs (~5 min transcript) | ~1,900 input + ~1,200 output | ~€0.034 |
| Core 5 outputs + Best Angle (~5 min transcript) | ~2,200 input + ~1,400 output | ~€0.042 |
| Advanced outputs (10 min transcript) | ~2,800 input + ~1,800 output | ~€0.060 |

**Conservative estimate for beta budget planning:** €0.05 per generation (covers Best Angle overhead and worst-case longer transcripts).

---

## Cost Scenarios

### Scenario A — 20 users × 3 credits = 60 generations

| Metric | Value |
|--------|-------|
| Total AI calls | 60 |
| AI cost estimate | 60 × €0.05 = **€3.00** |
| Percentage of €100 budget | **3%** |
| Risk level | Very low |

### Scenario B — 50 users × 3 credits = 150 generations

| Metric | Value |
|--------|-------|
| Total AI calls | 150 |
| AI cost estimate | 150 × €0.05 = **€7.50** |
| Percentage of €100 budget | **7.5%** |
| Risk level | Low |

### Scenario C — 100 users × 3 credits = 300 generations

| Metric | Value |
|--------|-------|
| Total AI calls | 300 |
| AI cost estimate | 300 × €0.05 = **€15.00** |
| Percentage of €100 budget | **15%** |
| Risk level | Low |

### Scenario D — 300 users × 3 credits = 900 generations

| Metric | Value |
|--------|-------|
| Total AI calls | 900 |
| AI cost estimate | 900 × €0.05 = **€45.00** |
| Percentage of €100 budget | **45%** |
| Risk level | Medium — watch closely |

### Scenario E — Worst case: 100 users, all use 10-min transcripts, advanced mode

| Metric | Value |
|--------|-------|
| Total AI calls | 300 |
| AI cost per call (advanced, 10 min) | ~€0.10 |
| AI cost estimate | 300 × €0.10 = **€30.00** |
| Percentage of €100 budget | **30%** |
| Risk level | Acceptable — within budget |

**Bottom line:** With the current 3-credit cap and 10-minute max, the AI cost is not dangerous even with 300 users. The risks are edge cases: abuse, very long transcripts slipping through, credits SQL not applied, or sudden viral traffic spike.

---

## Cost Danger Zones

### Danger Zone 1 — Credits SQL not applied in production

**Risk:** If the Supabase SQL (`docs/credits/SQL.md`) has not been run, the credit check in `/api/generate` will fail or silently fall through, potentially allowing unlimited free generation.

**Detection:** Check Supabase table editor — if `user_credits` table does not exist, this is not applied.

**Action:** Run the SQL before going live. This is mandatory. Do not launch beta without this.

### Danger Zone 2 — Real AI flag left on with no credit enforcement

**Risk:** If `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true` but the credit check is not working, every request burns API budget.

**Detection:** Generate as an unauthenticated user or a user with 0 credits. If generation succeeds, credits are not enforced.

**Action:** Test this exact flow before inviting any user.

### Danger Zone 3 — Very long YouTube videos

**Risk:** The 10-minute cap is enforced via `durationSec` from the transcript fetch. If a user submits a 2-hour podcast URL and duration detection fails (returns 0 or null), generation may proceed on a very long transcript.

**Detection:** Submit a 2-hour YouTube URL and check what happens.

**Action:** Add a fallback word count cap in `generate.ts` — if transcript word count exceeds 3,500, truncate before AI call. This is already partially implemented via `selectBestSegment()`.

### Danger Zone 4 — Same user creating multiple accounts

**Risk:** User signs up with 3 email addresses to get 9 free credits.

**Reality check:** At €0.05/generation, 9 free credits costs Virnix €0.45. Not a financial danger. It is a signal that users want more credits and want to pay — that is actually good news.

**Action:** Monitor for patterns (same IP, very similar emails). No automated enforcement needed during beta.

### Danger Zone 5 — Viral spread beyond 300 users

**Risk:** A post goes viral. Thousands of users sign up overnight.

**Detection:** Vercel traffic spike, Anthropic cost spike, Supabase signups spike.

**Action:** Switch `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=false` immediately. Site falls back to mock mode — users still see the product flow, just with demo output. Investigate before re-enabling. See Kill Switches below.

---

## Kill Switches

Listed in order from safest to most drastic:

### Switch 1 — Generation rate limit (not yet implemented)
Add Vercel Edge rate limiting or a simple Redis counter. Blocks more than N generations per IP per hour.
**When to add:** Before expanding beyond 50 users.
**Cost to add:** 2–4 hours of engineering.

### Switch 2 — Mock mode (already implemented)
Set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=false` in Vercel environment variables.
**Effect:** App stays fully functional. Users see demo output. Zero Anthropic cost.
**How to activate:** Vercel dashboard → Project → Settings → Environment Variables → set flag → Redeploy.
**Time to activate:** ~3 minutes.

### Switch 3 — Auth gate on generation (partially implemented)
CREDITS-A already checks for an authenticated session before allowing real AI generation. If auth is broken, generation returns 401. This is the passive kill switch.
**Verify:** Sign out, attempt generation, confirm 401/error response.

### Switch 4 — Full generation block
Return a static maintenance message from `/api/generate` (hardcode a 503 response temporarily).
**When to use:** Only if Switch 2 is insufficient and something is actively broken.
**Revert time:** Immediate (remove the hardcode, redeploy).

### Switch 5 — Vercel deployment pause
Pause the Vercel deployment entirely. Site shows Vercel's default "deployment not found" screen.
**When to use:** Emergency only — active security issue, data exposure, or a severe structural bug.
**Note:** This takes the entire product offline. Use as last resort.

---

## Required Limits Before Public Testing

All of these must be confirmed active before inviting the first user:

| Requirement | Where enforced | Status |
|-------------|---------------|--------|
| 3 free credits per user | Supabase `user_credits` table + `/api/generate` | Requires SQL to be run |
| Max 10-minute video | `calculateCreditsForGeneration()` — 120+ min blocked | Implemented (CREDITS-A) |
| Auth required for real AI generation | `/api/generate` route — 401 if no session | Implemented (CREDITS-A) |
| Server-side credit deduction | `deduct_credits()` RPC | Implemented (CREDITS-A) |
| Transcript truncation | `selectBestSegment(transcript, 3000)` | Implemented |
| Mock mode fallback flag | `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION` | Implemented |
| No secrets exposed to client | Confirmed — API key is server-only | Verified |
| No raw video storage | Confirmed — transcript text only, no file storage | Confirmed |

---

## What to Log Without Storing Sensitive Data

**Do log (already logged via `[virnix]` console prefix in Vercel):**
- `[virnix] transcript: N words → best 3000-word segment selected`
- `[virnix] AI call — provider: anthropic, ~N input tokens, ~$X estimated`
- `[virnix] creator energy: [ids]`
- `[virnix] output language: [id]`
- `[virnix] timeline: N moments detected`

**Do NOT log:**
- Transcript text content
- User email addresses
- Session tokens or auth cookies
- Credit balances (only log deduction result: "credits deducted: N, remaining: N")
- Full AI response text
- YouTube URLs (they may contain private video IDs)

**Safe to log:**
- Generation elapsed time
- Credit deduction success/failure
- Error type (timeout, 401, 402, 500) without user-identifying detail
- Token counts and cost estimates

---

## What to Do If Costs Climb Too Fast

**Step 1 — Confirm it is real spend, not an estimate:** Check the actual Anthropic billing dashboard, not just the log estimates. Log estimates can be off by ±30%.

**Step 2 — Identify the pattern:**
- Is it one user making many calls? → likely abuse or a loop bug
- Is it many users each making one call? → expected growth, check if credits enforced
- Is it very high per-call cost? → long transcripts slipping through, check word count

**Step 3 — Apply the appropriate kill switch:** See Kill Switches section above.

**Step 4 — Do not panic and add new code.** Adding rate limiting while under active cost pressure is how bugs get introduced. Apply the mock-mode switch first, stabilize, then add infrastructure.

---

## What to Do If YouTube Transcript Extraction Fails Often

**Signs:** Users report "no output" or Vercel logs show transcript fetch errors.

**Known failure modes:**
- Private/unlisted video: YouTube does not provide transcripts
- No captions on video: Some creators don't have auto-captions
- Age-restricted video: May require authentication
- Very new upload: Captions may not be available yet
- Regional restriction: Some videos are blocked by country

**Response during beta:**
- Add a clear error message to the UI: "Could not extract transcript from this video. Try a public video with captions, or paste a transcript directly."
- Log transcript failures: `[virnix] transcript fetch failed: [reason]`
- Do NOT add manual upload in beta — stay in scope

**Mitigation to add before beta:**
The current error handling falls back to mock output silently. For beta, the error message must be clearly visible to users, not just a fallback that looks like it worked.

---

## What to Do If Anthropic API Is Down

Anthropic has had occasional outages. Current mitigation:
- 2-retry exponential backoff (1s → 2s) already implemented
- 30s timeout per attempt
- Falls back to mock output on complete failure

**During beta:** If Anthropic is down for more than 15 minutes, users will see mock demo output. This is acceptable — it shows the product shape without burning budget. Add a banner message later: "Live generation temporarily paused — showing demo output."
