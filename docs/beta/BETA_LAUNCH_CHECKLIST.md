# Virnix Beta — Launch Checklist

**Phase:** FREE-BETA-STRATEGY-A
**Date:** 2026-05-22
**Format:** Check each item before sending first user invite

Mark items: [ ] = not done, [x] = done, [~] = accepted risk / skipped intentionally

---

## A. Product Readiness

- [ ] Real AI generation confirmed working on production (virnix.pro), not just localhost
- [ ] Auth flow tested end-to-end on production: sign in with email → magic link → session active → sign out
- [ ] Generation works when signed in on production
- [ ] Generation returns 401 when NOT signed in (credits enforcement active)
- [ ] Credits deduct after first generation (check Supabase user_credits balance before and after)
- [ ] Error message is clear when credits reach 0 (not a generic server error — a human message)
- [ ] Best Angle / Use This First card renders above ClipGuide on real AI output
- [ ] Creator Energy selector visible in idle state (pills: Balanced, Tactical, Contrarian…)
- [ ] Language selector visible in idle state (pills: Auto, English, Slovenian…)
- [ ] Output cards all render (TikTok, Twitter, LinkedIn, Instagram, YouTube)
- [ ] Copy buttons work on all output cards
- [ ] Mobile tested on iPhone Safari (or equivalent iOS) — layout, scroll, copy
- [ ] Mobile tested on Android Chrome — layout, scroll, copy
- [ ] Dark mode tested — all output text is readable
- [ ] Light mode tested — all output text is readable
- [ ] Error message visible when YouTube transcript fails (not silent fallback)
- [ ] Generate button shows loading state during generation
- [ ] Production is pointing to the correct Vercel deployment (not a preview branch)

---

## B. Cost Controls

- [ ] Supabase SQL from `docs/credits/SQL.md` has been run in Supabase dashboard
- [ ] `user_credits` table exists in Supabase table editor (with RLS enabled)
- [ ] `ensure_user_credits()` function exists in Supabase → Database → Functions
- [ ] `deduct_credits()` function exists in Supabase → Database → Functions
- [ ] Verified: a user with 0 credits cannot generate (returns 402 or credit error)
- [ ] Verified: `NEXT_PUBLIC_FLAG_REAL_AI_GENERATION=true` is set in Vercel production environment
- [ ] Know how to switch to mock mode in under 5 minutes (see COST_CONTROL_POLICY.md)
- [ ] Anthropic dashboard has been checked: billing alerts enabled or cost visible
- [ ] Test generation on production: 1 call, check Anthropic dashboard, confirm ~€0.04–0.06 billed
- [ ] Max 10-minute video enforced: submit a 3-hour YouTube URL, confirm error returned
- [ ] Transcript truncation active: very long transcripts are clipped before AI call

---

## C. Abuse Controls

- [ ] Auth is required before generation (confirmed in section A above)
- [ ] 3-credit starting balance confirmed for new users
- [ ] Credit balance does not reset on page reload or re-login
- [ ] No way to reset credits from the UI (no client-side credit manipulation)
- [ ] Credit calculation is server-side only (not trusted from request body)
- [ ] No API key exposed in client JS bundle or browser network tab
- [ ] Test: open DevTools → Network tab → generate → confirm no API keys in request headers from client
- [ ] [ Optional for 50+ users ] Vercel rate limiting or IP-based throttle configured

---

## D. UX Readiness

- [ ] Landing page copy clearly says what Virnix does (not a video editor)
- [ ] URL input has a clear placeholder or hint ("Paste a YouTube URL to get started")
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
