# Virnix Beta — Launch Checklist

**Phase:** TRANSCRIPT-FIX-B (last updated)
**Date:** 2026-05-22
**Format:** Check each item before sending first user invite

---

## FREE-BETA-A Verification Notes (2026-05-22)

The following items were verified by static code inspection and production endpoint checks during FREE-BETA-A. Items marked [x] are confirmed via code or live endpoint. Items marked [ ] require manual verification by Miha on virnix.pro.

**Production checks run:**
- `GET https://virnix.pro/api/health/supabase` → `{"status":"ok","authReachable":true}` ✅
- `GET https://virnix.pro/` → HTTP 200 ✅
- `GET https://virnix.pro/api/credits` (unauthenticated) → HTTP 401 `{"error":"Not authenticated"}` ✅

**Code changes made in TRANSCRIPT-FIX-B (2026-05-22):**
- `app/lib/ai/transcript.ts` — Added `diagnoseTranscript()` export, `tryInnerTubeClient()` helper, `TranscriptDiagnosis` type, `[virnix-transcript]` production logging
- `app/api/debug/transcript/route.ts` — NEW auth-gated diagnostic endpoint: `GET /api/debug/transcript?url=YOUTUBE_URL`
- `scripts/test-transcript.mjs` — Now reads sample URLs from `app/page.tsx` at runtime to ensure sync

**Code changes made in TRANSCRIPT-FIX-A (2026-05-22):**
- `app/lib/ai/transcript.ts` — Custom InnerTube fetcher with `?prettyPrint=false` + English caption preference + better errors
- `app/page.tsx` — Hint text updated: "No account required" → "Free beta · Sign in required"
- `scripts/test-transcript.mjs` — URL parsing + transcript tests, all passing

**Code changes made in FREE-BETA-A (2026-05-22):**
- `app/api/generate/route.ts` — 402 credit error now distinguishes 0-credits vs. insufficient-credits; 500 after generation failure now says "Nothing was charged"
- `app/page.tsx` — Beta privacy notice added below platform list in idle state

Mark items: [ ] = not done, [x] = done, [~] = accepted risk / skipped intentionally

---

## A. Product Readiness

- [ ] Real AI generation confirmed working on production (virnix.pro) — MANUAL (TRANSCRIPT-FIX-A deployed; try Simon Sinek sample button)
- [ ] Auth flow tested end-to-end on production: sign in with email → magic link → session active → sign out — MANUAL
- [ ] Generation works when signed in on production — MANUAL
- [x] Generation returns 401 when NOT signed in (code-verified: route checks `supabase.auth.getUser()`)
- [ ] Credits deduct after first generation (check Supabase user_credits balance before and after) — MANUAL
- [x] Error message is clear when credits reach 0: "You've used your free beta credits. Message Miha if you'd like more." (updated FREE-BETA-A)
- [x] Best Angle / UseThisFirstCard exists and is wired: renders when `bestAngle !== null` (code-verified)
- [x] Creator Energy selector visible in idle state (code-verified: `<CreatorEnergySelector>` renders in idle)
- [x] Language selector visible in idle state (code-verified: `<LanguageSelector>` renders in idle)
- [ ] Output cards all render (TikTok, Twitter, LinkedIn, Instagram, YouTube) — MANUAL (requires real AI)
- [ ] Copy buttons work on all output cards — MANUAL
- [ ] Mobile tested on iPhone Safari (or equivalent iOS) — layout, scroll, copy — MANUAL
- [ ] Mobile tested on Android Chrome — layout, scroll, copy — MANUAL
- [ ] Dark mode tested — all output text is readable — MANUAL
- [ ] Light mode tested — all output text is readable — MANUAL
- [x] Error message visible when YouTube transcript fails: friendly messages in `transcript.ts → toFriendlyError()` (code-verified)
- [x] Generate button shows loading state (code-verified: "Generating..." spinner in `<GenerateButton>`)
- [ ] Production is pointing to the correct Vercel deployment (not a preview branch) — MANUAL

---

## B. Cost Controls

- [ ] Supabase SQL from `docs/credits/SQL.md` has been run in Supabase dashboard — MANUAL BLOCKER
- [ ] `user_credits` table exists in Supabase table editor (with RLS enabled) — MANUAL BLOCKER
- [ ] `ensure_user_credits()` function exists in Supabase → Database → Functions — MANUAL BLOCKER
- [ ] `deduct_credits()` function exists in Supabase → database → Functions — MANUAL BLOCKER
- [x] Verified: a user with 0 credits gets "You've used your free beta credits." (code-verified: route returns 402 with humanized message)
- [ ] Verified: `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true` is set in Vercel production environment — ❌ CONFIRMED FAILING (FREE-BETA-A.1): unauthenticated POST returned HTTP 200 with mock data; flag is missing or false in Vercel
- [x] Know how to switch to mock mode: set `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=false` in Vercel env → Redeploy (~3 min) (docs/beta/COST_CONTROL_POLICY.md)
- [ ] Anthropic dashboard has been checked: billing alerts enabled or cost visible — MANUAL
- [ ] Test generation on production: 1 call, check Anthropic dashboard, confirm ~€0.04–0.06 billed — MANUAL
- [x] 120+ min video blocked: `calculateCreditsForGeneration()` returns -1 → 422 error (code-verified)
- [x] Transcript truncation: `selectBestSegment(transcript, 3000)` implemented in generation pipeline (code-verified)

---

## C. Abuse Controls (FREE-BETA-A)

- [x] Auth is required before generation (code-verified: route returns 401 if `!user`; production endpoint returns 401 unauthenticated)
- [x] 3-credit starting balance: `ensure_user_credits()` inserts `balance = 3` on conflict do nothing (code-verified)
- [x] Credit balance does not reset on page reload: stored in Supabase DB, not client state (code-verified)
- [x] No way to reset credits from UI: no client-side credit manipulation route or form exists (code-verified)
- [x] Credit calculation is server-side only: `calculateCreditsForGeneration()` called in route using `transcriptResult.durationSec`, never from request body (code-verified)
- [ ] No API key exposed in client JS bundle — MANUAL: open DevTools → Network → generate → confirm no API keys in request headers
- [ ] Test: open DevTools → Network tab → generate → confirm no API keys in request headers from client — MANUAL
- [~] Vercel rate limiting — not required for first 20 users (add before 50+ per COST_CONTROL_POLICY.md)

---

## D. UX Readiness

- [ ] Landing page copy clearly says what Virnix does (not a video editor)
- [x] URL input hint text is accurate: "Free beta · Sign in required · Works with captioned YouTube videos" (updated TRANSCRIPT-FIX-A)
- [ ] An example URL or demo link is available for first-time users
- [ ] Loading state is visible and informative (not just a blank screen)
- [ ] Error states are human-readable (not "Error 500" or "Something went wrong")
- [ ] Output cards have visible copy buttons
- [ ] "Copy" confirmation (button changes to "Copied!") works
- [ ] No JavaScript console errors on first load
- [ ] No JavaScript console errors during generation
- [ ] CreditBadge visible to signed-in users (shows remaining credits)
- [ ] AuthButton visible (Sign in / Sign out) in top bar
- [ ] Output area visible without horizontal scrolling on mobile

---

## E. Feedback Capture

- [ ] A feedback mechanism is planned (even if it is just "reply to this DM" or a Tally form link)
- [ ] A 2-question post-generation ask is prepared: "What was most useful?" + "Would you pay €20/month for this?"
- [ ] Miha has a way to reach each beta user directly (DM, WhatsApp, email)
- [ ] [ Nice to have ] A feedback link or button exists somewhere near the output ("Leave feedback")
- [ ] [ Nice to have ] Tally.so or Typeform form created with 3–5 questions

---

## F. Analytics / Manual Tracking

- [ ] Vercel logs accessible: know how to filter by `[virnix]` prefix
- [ ] Supabase → Table editor → `user_credits` accessible: can see all user credit balances
- [ ] BETA_LOG.md created in docs/beta/ (blank file, ready to fill in daily)
- [ ] Anthropic billing dashboard accessible: can check cost at any time
- [ ] Know what a normal-looking generation log line looks like vs. an error line
- [ ] [ Optional ] Posthog or similar analytics installed (not required for 20-user beta)

---

## K. Observability Readiness

See `docs/beta/BETA_OBSERVABILITY_PLAN.md` for full detail. Minimum before first invite:

- [x] **Privacy notice** visible on virnix.pro — beta notice added to landing page in FREE-BETA-A (`app/page.tsx`, `<BetaNotice>` component, renders in idle state below platform list)
- [ ] **Supabase `user_credits` watching** — you can see new sign-ups and credit depletion daily — MANUAL (also see /api/health/supabase `dbReachable` field added in FREE-BETA-A.1)
- [ ] **Direct contact method** for every beta user — DM, email, or WhatsApp before sending invite
- [ ] **BETA_LOG.md** created at `docs/beta/BETA_LOG.md` (blank file, write in it daily)
- [ ] **Feedback collection method** confirmed — "reply to my DM" is acceptable; Tally form is better
- [ ] **Founder note system** ready — even a text file with one line per user
- [ ] [ Recommended ] `generation_logs` table created in Supabase (schema in observability plan Section 7)
- [ ] [ Recommended ] Generation route logs to `generation_logs` after each attempt
- [ ] [ Optional ] `generation_feedback` and `founder_beta_notes` tables created (Section 7)

---

## G. Marketing Assets

- [ ] Invite message written and ready (warm DM format — see MARKETING_TEST_PLAN.md)
- [ ] One-sentence Virnix description confirmed: can say it without notes
- [ ] "What Virnix is NOT" one-liner ready (for when users ask about video)
- [ ] Beta user list of 20 people identified by name and channel
- [ ] Response prepared for "how much does it cost?" (free beta, Pro will be €20/month)
- [ ] Response prepared for "can it do X?" (answer honestly: yes/no/later)
- [ ] [ Optional ] 1 demo video or screen recording ready to share (30–60 seconds)
- [ ] [ Optional ] virnix.pro has a minimal "about" or "what is this" blurb

---

## H. Founder Daily Routine

- [ ] Committed to checking Vercel logs each morning (5 minutes)
- [ ] Committed to checking Supabase signups each morning (3 minutes)
- [ ] Committed to responding to beta user messages within 4 hours
- [ ] BETA_LOG.md updated at end of each day (1–2 sentences is enough)
- [ ] Beta launch date set and communicated to at least one person as accountability

---

## I. Stop Conditions

Know these before starting. If any occur, stop and review before continuing.

- [ ] Documented: what to do if Anthropic cost exceeds €20 in one day
- [ ] Documented: what to do if a user reports seeing another user's data
- [ ] Documented: what to do if generation consistently fails (>50% error rate)
- [ ] Documented: what to do if a user reports a legal concern (data, privacy, copyright)
- [ ] Know: how to switch to mock mode in under 5 minutes
- [ ] Know: how to disable all new sign-ups (remove Supabase auth redirect URLs)

---

## J. Launch Day Script

On the day of first invite:

1. **Morning (10 min):** Run through sections A, B, C one more time. Confirm everything still green.
2. **Generate test output:** Submit a real YouTube URL on production. Confirm real AI output, Best Angle visible, credits deducted. Take a screenshot.
3. **Send first invite:** Send to the 1–2 warmest people on your list first. Watch what happens.
4. **Monitor:** Keep Vercel logs and Supabase dashboard open for the first 2 hours.
5. **Follow up:** Message the first user 2 hours after invite: "Did you try it? What happened?"
6. **Log:** Write one paragraph in BETA_LOG.md: what happened, what surprised you.
7. **Decide:** Based on first user result, send 4 more invites or fix something first.

**Do NOT:** Post publicly on day 1. Do NOT send all 20 invites at once. Do NOT add new features on launch day.

---

## Must-Have Before Beta (Non-Negotiable)

These are hard blockers. Beta does not launch without all of them:

1. Real AI generation confirmed working on production
2. Auth works (sign in, magic link, session, sign out)
3. Credits SQL applied and credit deduction verified
4. Clear error message when credits are gone (not a generic error)
5. Max transcript/video length enforced
6. No secrets exposed to client
7. No raw video storage
8. Feedback mechanism planned (even a DM is fine)
9. A simple privacy/terms notice exists on the site (even one paragraph)
10. Kill switch documented and tested (mock mode switch)
