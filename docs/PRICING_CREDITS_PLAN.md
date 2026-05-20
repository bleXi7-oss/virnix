# Virnix Pricing & Credits Plan — PRICING-A

**Phase:** PRICING-A
**Date:** 2026-05-20
**Status:** Strategy and documentation only. Nothing implemented.

---

## 1. Executive Summary

Virnix will use a duration-based credits model. Creators buy a monthly credit pool; each generation deducts credits based on content length plus an optional advanced-mode surcharge.

**Target:** Pro at €20/month, 100 credits, 60–80% gross margin across realistic usage patterns.

**Why credits, not seats or generations:**
A 5-minute YouTube clip costs Virnix ~€0.04 to process. A 90-minute podcast could cost €0.80+ when transcription is factored in. "Unlimited generations" with that spread is a path to inverted unit economics on a small number of power users.

---

## 2. Why Virnix Should Use Credits

The core cost drivers scale with content length, not with the number of users:

| Driver | Scales with | Notes |
|--------|-------------|-------|
| AI token cost (current) | Input tokens | Capped at ~3,000-word best segment. Relatively flat per call (~€0.03–0.05). |
| Transcription cost (future audio upload) | Duration in minutes | Whittle API or Whisper-equivalent. ~€0.006/min is a conservative estimate. |
| Server compute | Call count | Minimal at current scale. Vercel serverless. |

Right now (YouTube captions only), the AI token cost is the only real variable. Future audio upload support changes this materially. Duration-based credits protect margin in both scenarios.

---

## 3. Why Unlimited Is Dangerous

Assume 50 Pro users at €20/month:
- Healthy user: 40 short clips/month → €1.60 in AI costs → fine
- Power user with audio upload: 10 × 90-min podcasts/month → ~€8+ in combined transcription + AI → inverted

With unlimited pricing, one power user captures €8+ of cost on a €20 plan. At 15% of users being power users, gross margin drops below 50% on the whole cohort.

Credits don't prevent power users. They charge them appropriately.

---

## 4. Proposed Plans

### Free (no credit card required)

| Feature | Value |
|---------|-------|
| Credits | 3 total (not monthly — one-time trial pool) |
| Max content | 10 min |
| Output mode | Basic (5 platforms: TikTok, Twitter, LinkedIn, Instagram, YouTube titles) |
| Creator Energy | Locked — not available on Free |
| Advanced Content Kit | Locked |
| Purpose | Product trial only. One good generation is enough to demonstrate value. |

### Pro — €20/month (starting price, validate before locking)

| Feature | Value |
|---------|-------|
| Credits | 100/month (reset on billing date) |
| Max content | 60 min |
| Output mode | Basic included. Advanced Content Kit = +1 credit. |
| Creator Energy | Included, no extra cost |
| Carry-over credits | None — unused credits expire (keeps accounting simple) |
| Purpose | Core creator workflow: weekly podcast → week of short-form content |

### Creator — future tier (not yet priced or launched)

Reserved for: higher credit pools, non-YouTube source support (audio upload, podcast RSS), saved generation history. Do not build until Pro is validated at €1k MRR.

---

## 5. Credit Consumption Rules

### Duration tiers

Content duration is measured from the video/audio source, not from transcript word count.

| Duration | Credits used | Rationale |
|----------|--------------|-----------|
| 0–10 min | 1 credit | Short clip, low AI cost, low future transcription cost |
| 10–30 min | 2 credits | Medium content, 2× cost exposure |
| 30–60 min | 4 credits | Long content, ~4× cost exposure (best-segment selection kicks in) |
| 60–120 min | 8 credits | Heavy podcast, approaching transcription cost inflection point |
| 120+ min | Blocked | Too expensive to serve at Pro tier. Reserved for future custom pricing. |

### Mode extra

| Mode | Extra credits |
|------|--------------|
| Basic generation | +0 |
| Advanced Content Kit (blog, timestamps, short-form script) | +1 |

### Full formula

```
credits_used = duration_base_credits + mode_extra_credits
```

Examples:
- 8-min YouTube clip, basic → 1 credit
- 8-min YouTube clip, advanced kit → 2 credits
- 25-min podcast, basic → 2 credits
- 45-min podcast, advanced kit → 5 credits
- 90-min podcast, basic → 8 credits
- 90-min podcast, advanced kit → 9 credits

---

## 6. Advanced Mode Pricing Decision

Advanced Content Kit (+1 credit) adds blog summary, YouTube timestamps, and short-form script. These increase output tokens from ~1,200 to ~2,500, and use a higher `maxTokens` cap (3,500 vs 2,048).

At current Sonnet 4.6 pricing, the additional token cost is approximately €0.02–0.03 per generation. The +1 credit surcharge on a €20/100-credit plan equals €0.20 per generation — well above cost.

**Decision: Advanced Content Kit is +1 credit.** Creator Energy is included in Pro at no extra credit cost (it adds ~100–150 tokens to the prompt, cost impact under €0.003).

---

## 7. Creator Energy Pricing Decision

Creator Energy Selection adds minimal AI cost (~100–150 additional prompt tokens). It is a product differentiator, not a cost driver.

**Decision: Creator Energy is included in all Pro generations at no extra credit cost.** Lock it on Free tier to create upgrade motivation.

If multi-energy combinations (3+ energies) show materially higher retry rates or token use in production, revisit. For now: included.

---

## 8. Example User Scenarios

**All assume: Pro plan at €20/month, 100 credits/month.**

Assumptions marked ⚠ are estimates requiring production validation.

---

### Scenario A — Mostly short video creator

Profile: repurposes 3–5 YouTube shorts/Reels per week, 5–8 min each.

| Week | Generations | Credits | Mode |
|------|-------------|---------|------|
| 1–4 | 4 × 4 = 16 | 16 × 1 = 16 | Basic |
| Running total | 16 | 16 | |

Monthly usage: ~16–20 credits.
AI cost ⚠: 20 × €0.035 = **€0.70**
Profit: €20 − €0.70 − ~€0.90 Stripe fee = **~€18.40**
Gross margin: **~92%**

This user is highly profitable. Most short-form creators will fall in this bucket.

---

### Scenario B — Mixed creator (typical Pro user)

Profile: 2 podcast episodes/month (30–45 min) + 4–6 short clips.

| Content | Credits |
|---------|---------|
| 2 × 35-min podcast, basic | 2 × 4 = 8 |
| 2 × 35-min podcast, advanced kit | 2 × 5 = 10 |
| 5 × 8-min clips, basic | 5 × 1 = 5 |
| Total | 23 credits |

Monthly usage: ~23 credits (well within 100).
AI cost ⚠: 4 × €0.045 + 5 × €0.035 = €0.18 + €0.175 = **€0.355**
Profit: €20 − €0.355 − ~€0.90 Stripe = **~€18.75**
Gross margin: **~94%**

This is the target archetype. Extremely healthy margin even with advanced kit.

---

### Scenario C — Long podcast power user (stress test)

Profile: produces 2 × 90-min podcast episodes/week, basic mode only.

| Generations/month | Credits |
|-------------------|---------|
| 8 × 90-min podcast | 8 × 8 = 64 |
| Total | 64 credits |

Monthly usage: 64 credits (within 100-credit budget).
AI cost ⚠: 8 × €0.050 = **€0.40** (best-segment selection means input tokens stay flat even at 90 min)
Future transcription cost ⚠ (when audio upload is live): 8 × 90 min × €0.006/min = **€4.32** extra
Combined cost (future): **~€4.72**
Profit (future): €20 − €4.72 − ~€0.90 Stripe = **~€14.38**
Gross margin (future): **~72%**

This is the worst-case Pro user when transcription is live. Still within the 60–80% target range. The 8-credit / 8-credit budget guard also limits them to ~12 episodes/month max, preventing runaway cost.

**Note:** Current implementation (YouTube captions = free transcription) makes this user nearly as profitable as Scenario A. The danger zone only becomes real with future audio upload.

---

### Scenario D — Advanced mode heavy user

Profile: everything on advanced kit, mix of 20-min and 45-min content.

| Content | Credits |
|---------|---------|
| 10 × 25-min, advanced kit | 10 × 3 = 30 |
| 6 × 45-min, advanced kit | 6 × 5 = 30 |
| Total | 60 credits |

AI cost ⚠: 16 × ~€0.070 (advanced mode) = **€1.12**
Profit: €20 − €1.12 − ~€0.90 Stripe = **~€17.98**
Gross margin: **~90%**

Advanced mode barely moves the needle on margin because output token costs are modest. The +1 credit surcharge is primarily about perceived value and tier separation, not cost recovery.

---

### Summary table

| Scenario | Credits used | Est. AI cost | Gross margin | Status |
|----------|-------------|--------------|--------------|--------|
| A. Short video | ~20/100 | €0.70 | ~92% | ✓ Healthy |
| B. Mixed creator | ~23/100 | €0.36 | ~94% | ✓ Target archetype |
| C. Long podcast (current) | ~64/100 | €0.40 | ~98% | ✓ Fine now |
| C. Long podcast (w/ transcription) | ~64/100 | €4.72 | ~72% | ✓ Acceptable |
| D. Advanced-mode heavy | ~60/100 | €1.12 | ~90% | ✓ Healthy |

No scenario in this table breaches the 60% floor at current costs.

---

## 9. Margin Assumptions

**Conservative cost inputs used in this document (⚠ must be validated with production logs):**

| Input | Assumed value | Source |
|-------|--------------|--------|
| Sonnet 4.6 input price | $3.00 / M tokens | Anthropic pricing page (2026-05-20) |
| Sonnet 4.6 output price | $15.00 / M tokens | Anthropic pricing page (2026-05-20) |
| Avg input tokens/call | ~2,000 | CE-B real AI test output |
| Avg output tokens/call | ~1,200 | CE-B real AI test output |
| Cost per basic call | ~€0.035 | Derived from above |
| Cost per advanced call | ~€0.070 | ~2× output tokens |
| Transcription (future) | €0.006/min | Conservative estimate (Whisper-equivalent) |
| Stripe fee | €0.30 + 2.9% | Standard EU rate |
| Infrastructure (Vercel, Supabase) | €10–30/month shared | Estimate, depends on scale |
| EUR/USD rate | ~0.92 | Approximate |

**Target gross margin range:** 60–80% after AI + transcription costs, before billing provider fees and infrastructure.

> ⚠ Billing fee assumption: Stripe €0.30 + 2.9% used in scenario calculations above. If MoR is chosen (Paddle/Lemon Squeezy), the fee is approximately €0.50 + 5% per transaction — roughly €1.50–€1.72/transaction at €20 net, vs. ~€0.88 for Stripe. See Section 16 for MoR transaction examples. The MoR fee reduces payout by ~€0.60–€0.84 per transaction compared to Stripe direct, but removes VAT compliance overhead. Margin scenarios should be recalculated once provider is chosen.

**Danger zone:** Any user whose combined AI + transcription cost exceeds €12/month on a €20 plan (60% gross margin floor). The credit cap and duration limits prevent this in all modeled scenarios.

---

## 10. Abuse Prevention / Cost Guardrails

### Hard limits (enforce before any AI call)

1. **Max duration: 60 min** on Pro. Block 120+ min with a clear user-facing message.
2. **Credit check before generation:** If `user.credits_remaining < credits_for_this_call`, reject with 402. Never start an AI call and then fail.
3. **Rate limit: max 20 generations/hour per user.** Prevents scripted abuse even with credits available.
4. **Free tier: 3 total credits.** Not 3/month — one-time pool. Stops serial account creation for free AI access.

### Soft limits (monitor, don't auto-block)

1. **Cost alert threshold:** If a single user exceeds €8 AI cost in a calendar month, flag for review. Not auto-blocked — may be a legitimate power user.
2. **Token spike detection:** Log estimated token counts per call. Alert on calls that exceed 2× the expected input token estimate (may indicate prompt injection attempt).
3. **Transcript source validation:** On YouTube, validate URL before transcript fetch. Do not fetch from arbitrary URLs. Future audio upload = virus-scan first.

### Free tier abuse vectors to close at implementation

- Serial new accounts (free 3 credits each time): mitigate with email verification + 1 free account per email
- Shared API keys: not applicable (users don't have API key access — all calls are server-side
- Credit farming: not applicable in the credit model (users can't earn credits, only spend them)

---

## 11. What to Show Users in UI

Use simple, creator-native language. Never expose infrastructure concepts.

### Credit display

- `100 credits remaining` (not "API units" or "compute tokens")
- `This generation will use 2 credits` (show before they click Generate)
- `74 credits left this month`

### Credit cost labels on content upload / URL input

Show credit cost estimate as soon as video duration is known:

- `Short video (under 10 min) — 1 credit`
- `Medium video (10–30 min) — 2 credits`
- `Long content (30–60 min) — 4 credits`
- `Podcast (60–90 min) — 8 credits`

### Upgrade prompt

When a Free user runs out of credits:
`You've used your 3 trial generations. Upgrade to Pro for 100 credits/month — short videos start from 1 credit.`

### Advanced kit upsell

When basic mode is active:
`Get blog summary, YouTube timestamps, and a short-form script for +1 credit.`

### Creator Energy

No credit callout needed — it's included. Just show the selector without mentioning cost.

---

## 12. What NOT to Expose to Users

Never show:
- Token counts or token estimates
- AI model names or provider names
- Transcription API or pipeline details
- Cost per call in euros/dollars
- Internal credit calculation formula
- "AI context" or "compute" language
- Raw duration in seconds/milliseconds

The user only needs to understand: content length → credit cost. Everything else is invisible infrastructure.

---

## 13. Future Pricing Tiers

**Launch tiers: Free + Pro only.** Do not add Studio or Agency until Pro validates.

---

### Studio — €49/month (future)

Target: serious creators, podcasters, small teams who exhaust Pro's 100 credits.

| Feature | Value |
|---------|-------|
| Credits | 350/month |
| Max content | 90 min (requires audio upload) |
| Output mode | All — basic + advanced kit |
| Creator Energy | Included |
| Saved history | Included |
| Export packs | Included |
| Team seats | Candidate (2–3 seats) |
| Priority processing | Candidate |

**Margin estimate at 350 credits with realistic usage:** similar to Pro or better — most Studio users won't saturate 350 credits in current-AI-only mode. Transcription costs become significant at this tier with heavy audio upload use.

**When to build:** Pro at €1k MRR + audio upload live + export pack feature complete.

---

### Agency — €99/month (future)

Target: agencies doing client content work, teams needing project organization.

| Feature | Value |
|---------|-------|
| Credits | 900/month |
| Everything in Studio | Included |
| Client/project folders | Included |
| Team seats | Multiple (TBD) |
| Client-ready exports | Included |
| Priority support | Included |

**When to build:** Studio validated with paying users + evidence of agency usage patterns in real data.

---

### Pay-as-you-go (candidate, not designed)

€0.30/credit à la carte. No subscription.

Serves occasional users who won't commit to monthly. Lower margin per credit (€0.30/credit vs. €0.20/credit on Pro) but no churn. Consider as a fallback offer only if subscription conversion is lower than expected.

---

### Tier positioning summary

| Tier | Who it's for | Price |
|------|-------------|-------|
| Free | First-time trial | — |
| Pro | Individual creator, weekly workflow | €20/month |
| Studio | Serious creator / podcaster / small team | €49/month (future) |
| Agency | Client work, agency, multi-seat | €99/month (future) |

**Do not position Studio or Agency as launch tiers.** They complicate the initial pricing page and imply feature parity that isn't shipped yet.

---

## 14. Implementation Notes for Later

**Do not implement any of this now.** This section exists so future implementation follows clean architecture from day one.

### Proposed file structure

```
app/lib/pricing/
  plans.ts           ← plan definitions (Free, Pro, Studio, Agency)
  index.ts           ← exports

app/lib/credits/
  types.ts           ← CreditCost, CreditTransaction, UserCreditState
  rules.ts           ← DURATION_CREDIT_TIERS, MODE_EXTRA_CREDITS
  calculateCredits.ts ← calculateCreditsForGeneration(durationSec, mode)
  index.ts           ← exports

app/lib/billing/
  stripe.ts          ← Stripe integration (when needed)
```

### Credit calculation (server-side only)

```typescript
// app/lib/credits/calculateCredits.ts (future, not now)
function calculateCreditsForGeneration(
  durationSeconds: number,
  mode: "basic" | "advanced"
): number {
  const durationBase = getDurationTierCredits(durationSeconds);
  const modeExtra = mode === "advanced" ? 1 : 0;
  return durationBase + modeExtra;
}
```

### Key implementation principles

- **Never trust the client.** Credit cost must be calculated server-side from the resolved video duration, not from any client-supplied value.
- **Check credits before the AI call.** Reject with HTTP 402 if insufficient, never after spending compute.
- **Deduct atomically.** Credit deduction and generation start must be in the same database transaction. If the AI call fails, restore credits.
- **Log cost safely.** Log `estimatedCredits`, `estimatedAICost`, `durationSeconds` — never API keys or transcript content.
- **Centralize pricing rules.** All credit amounts live in `rules.ts`. Never hardcode credit costs inside UI components, API handlers, or prompt builders.
- **Future audio upload:** duration must come from server-side audio metadata analysis, not from client-reported duration.

### Database table (future, not designed now)

When auth is wired (Supabase):

```sql
-- Sketch only — design properly at implementation time
user_credits (
  user_id       uuid references auth.users,
  plan          text,         -- 'free' | 'pro' | 'creator'
  credits_remaining  int,
  credits_total      int,
  period_start       timestamptz,
  period_end         timestamptz
)

credit_transactions (
  id            uuid,
  user_id       uuid,
  amount        int,          -- negative = deduction, positive = top-up
  reason        text,         -- 'generation' | 'purchase' | 'refund' | 'period_reset'
  generation_id uuid nullable,
  created_at    timestamptz
)
```

---

## 15. Open Questions Before Coding

These must be answered before any billing implementation:

1. **Billing provider: MoR or processor?** Key candidates: Paddle (MoR), Lemon Squeezy (MoR), Stripe + Stripe Tax (processor). MoR handles EU VAT and global sales tax automatically at higher per-transaction cost (~5% + ~€0.50). Stripe requires you to file tax returns per jurisdiction. Decision affects tax compliance timeline and implementation architecture. **Evaluate before starting BILLING-A.** See Section 16 for full comparison and transaction examples.

2. **Auth first?** Credits system requires user identity. Supabase auth must ship before credits. Current state: no auth. Don't build credits without auth.

3. **How to handle free-trial-to-paid migration?** When a free user upgrades, do their remaining free credits carry over? (Recommendation: no — they become a Pro user with 100 fresh credits.)

4. **Credit roll-over policy?** Unused Pro credits expire monthly. This is clean for accounting and prevents credit debt. Validate that creators accept this — some may expect carry-over.

5. **What happens mid-month if user runs out of credits?** Options: (a) block and show upgrade prompt, (b) let them buy a top-up credit pack, (c) auto-upgrade. Recommendation: block + upgrade prompt. Top-up packs are a future feature.

6. **Duration source for YouTube:** `youtube-transcript` library returns segments with `offset` and `duration`. Total video duration is computable from these. Must validate that duration is available for all video types before using it for credit calculation.

7. **Duration source for future audio upload:** Must come from server-side analysis of the audio file metadata. Client-reported duration is not trusted.

8. **Grandfathering / beta pricing:** Will early beta users get any pricing benefit? If yes, plan the migration path before launch.

9. **€ or $ pricing?** Business direction suggests €. Validate target market — if US-heavy, $ may reduce friction. Stripe supports multi-currency.

10. **When does real-cost validation happen?** Before shipping credits. Need at least 50 real generations in production logs to validate the token cost estimates used in this document.

---

## 16. Merchant of Record / VAT-Safe Pricing Approach

> ⚠ This section is business planning documentation, not legal or tax advice.
> VAT treatment must be confirmed by a qualified accountant before public launch.
> Provider fees must be verified from official pricing pages before implementation.

---

### What is a Merchant of Record?

A Merchant of Record (MoR) is a payment service provider that acts as the legally responsible seller of your product to the end customer. This means the MoR:

- Calculates and adds VAT or sales tax at checkout based on the customer's country and type (B2C, B2B, VAT-registered)
- Collects tax on behalf of the applicable authorities
- Files and remits tax returns in relevant jurisdictions
- Issues compliant invoices to customers
- Manages chargebacks and disputes

The practical benefit for a solo founder: you receive a single net payout, and the MoR handles tax paperwork across every country your customer is in. No manual VAT registration in each EU country. No OSS filing. No per-country compliance calendar.

**The MoR is not a substitute for:**
- Your own bookkeeping and payout reconciliation
- Accountant review before launch and at year-end
- Understanding your own tax residency obligations as the company
- Reading the provider's terms of service before signing up

---

### MoR vs. payment processor comparison

Two practical approaches to handling billing for Virnix:

| Approach | How it works | Tax handling | Approximate fee | Founder complexity |
|----------|-------------|--------------|-----------------|-------------------|
| **Merchant of Record** (Paddle, Lemon Squeezy) | MoR is the seller. You receive net payout. MoR handles all tax. | Automatic: VAT + sales tax calculated, collected, filed globally | ~5% + ~€0.50/transaction ⚠ verify | Low — MoR owns compliance |
| **Payment processor + Tax plugin** (Stripe + Stripe Tax) | You are the seller. Stripe processes payment and calculates tax. You file returns. | Stripe Tax calculates; you file in each jurisdiction | ~2.9% + ~€0.30 + Stripe Tax costs ⚠ verify | Higher — you own filing calendar |

**Early-stage recommendation:** MoR trades a higher per-transaction fee for significantly lower operational and compliance overhead. This is the preferred path for global launch before internal finance capacity exists.

**At higher revenue:** compare total cost — MoR fee (5%) vs. processor fee (2.9%) + Stripe Tax overhead + accountant time for multi-country filing. The right choice depends on volume and in-house capacity.

---

### Pro pricing: net + VAT model

**Pro — €20/month + VAT where applicable**

The €20 is the net revenue target — the amount Virnix aims to receive after payment/MoR fees, before AI and transcription costs. VAT and sales tax are added at checkout by the MoR based on the customer's country and customer type.

- For valid EU B2B VAT-registered customers: reverse charge may apply (no VAT collected, handled by the buyer's business) ⚠ confirm with accountant
- For B2C customers in VAT-applicable countries: VAT is added on top of the €20 at the applicable local rate ⚠ confirm with accountant
- Do not present €20 as "including all taxes" or "VAT included" until this is legally confirmed
- Do not treat any of the above as guaranteed without professional advice

---

### Fee assumptions

> ⚠ These are based on publicly available information as of 2026-05-20.
> Verify current rates directly from each provider's official pricing page before implementation.
> Providers may have different rates by region, currency, or transaction size.
> Custom pricing may be available at scale.

| Provider | Type | Approx. fee | Notes |
|----------|------|------------|-------|
| Paddle | MoR | ~5% + ~$0.50/transaction | Handles EU VAT, US sales tax, global SaaS compliance |
| Lemon Squeezy | MoR | ~5% + ~$0.50/transaction | US-based, handles EU VAT, US sales tax, international SaaS |
| Stripe | Processor | ~2.9% + ~€0.30/transaction | Does not handle tax filing |
| Stripe + Stripe Tax | Processor + tax calc | ~2.9% + ~€0.30 + Stripe Tax costs | Tax calculation only; you file returns per jurisdiction |

Do not hardcode a provider choice. Evaluate Paddle, Lemon Squeezy, and Stripe Tax before BILLING-A implementation. Final decision should account for fee rates, payout timelines, supported currencies, acceptable-use policy, and support quality.

---

### Transaction examples

> All figures are estimates. Fee basis (gross vs. net) varies by provider — both scenarios shown.

---

**Example A — Single B2C transaction with 22% VAT**

| Item | Amount |
|------|--------|
| Virnix Pro (net price) | €20.00 |
| VAT at 22% (added at checkout) | €4.40 |
| **Customer pays (gross)** | **€24.40** |

MoR fee scenario 1 — fee applied to gross checkout amount:

| Item | Amount |
|------|--------|
| Fee: 5% × €24.40 | €1.22 |
| Fixed fee | ~€0.50 |
| Total MoR fee | **~€1.72** |
| VAT remitted by MoR | €4.40 |
| **Approx. payout before AI/transcription** | **~€18.28** |

MoR fee scenario 2 — fee applied to net amount:

| Item | Amount |
|------|--------|
| Fee: 5% × €20.00 | €1.00 |
| Fixed fee | ~€0.50 |
| Total MoR fee | **~€1.50** |
| VAT remitted by MoR | €4.40 |
| **Approx. payout before AI/transcription** | **~€18.50** |

**Summary:** For a €20 net Pro plan, estimated payout before AI/transcription is approximately **€18.28–€18.50** depending on exact provider fee basis. Verify actual fee basis with provider documentation before finalizing.

---

**Example B — 100 Pro transactions**

| Item | Amount |
|------|--------|
| Net sales target (100 × €20) | €2,000 |
| Approx. MoR fees (100 × €1.50–€1.72) | €150–€172 |
| **Approx. payout before AI/transcription** | **€1,828–€1,850** |

---

**Example C — After AI/transcription costs (100 users)**

Payout baseline before AI (from Example B): **~€1,828**

| Avg cost per user | Net per user (after MoR fees) | Net per 100 users |
|-------------------|-------------------------------|-------------------|
| €3/user | ~€15.28 | **~€1,528** |
| €5/user | ~€13.28 | **~€1,328** |
| €7/user | ~€11.28 | **~€1,128** |

> Infrastructure costs (Vercel, Supabase) not included above.
> Current AI-only cost is ~€0.035/call. The €3–€7/user range reflects future audio transcription scenarios, not current YouTube-captions-only implementation.
> All figures are estimates requiring production validation.

---

### Pricing optimization recommendations

1. **Keep Pro at €20 net + VAT.** The €20 is the revenue target; VAT is added at checkout. Do not absorb VAT into the sticker price unless there is a specific strategic reason (e.g., a market where tax-inclusive display is strongly expected).

2. **Use credits to control AI cost.** 100 credits/month, duration-based tiers, Advanced Content Kit +1 credit, 120+ min blocked, 60+ min Pro cap. These protect margin in all modeled scenarios including future audio transcription.

3. **Keep Free genuinely limited.** 3 one-time credits, max 10 min, basic outputs only, Creator Energy locked. No path to unlimited free usage. 3 credits is enough for one strong generation — enough to demonstrate value, not enough to extract value indefinitely.

4. **Prefer MoR for early global launch simplicity.** Lower tax/admin burden during the period when all focus must be on product, not compliance paperwork. The higher per-transaction fee is the cost of simplicity.

5. **Revisit provider choice at volume.** When monthly revenue is materially higher (€5k+ MRR), model total cost: MoR fee vs. Stripe + Stripe Tax + accountant cost per month. The right answer depends on volume and internal capacity at that point.

6. **Avoid micro-transactions.** The ~€0.50 fixed fee makes tiny PAYG credit packs uneconomical. €20/month subscription absorbs fixed fees across the month. If PAYG is added later, price credits high enough to cover the fixed fee floor (€0.30/credit minimum at current fee assumptions).

7. **Verify before implementing.** Provider pricing, fee basis, supported payment methods, payout timelines, and acceptable-use policies must all be verified from official sources before BILLING-A implementation.

---

### What not to over-optimize yet

| Do not do | Why |
|-----------|-----|
| Build manual VAT tax logic | If MoR is chosen, the provider handles this |
| Implement EU OSS (One-Stop-Shop) filing manually | MoR handles OSS if chosen |
| Add many pricing tiers at launch | Free + Pro only. Complexity hurts conversion at early stage. |
| Promise tax-inclusive pricing ("€20 all in") | Tax treatment is country- and customer-type-dependent |
| Sell unlimited AI usage | Credits protect margin. Unlimited destroys it at scale. |
| Lock in a billing provider before evaluation | Paddle vs. Lemon Squeezy vs. Stripe Tax requires a decision phase |
| Build BILLING-A before provider is chosen | Provider choice drives architecture (webhook format, SDK, fee structure) |

---

### Legal and accounting disclaimer

> **This section is internal business planning documentation, not legal or tax advice.**
>
> - VAT treatment, including reverse charge eligibility, must be confirmed by a qualified accountant or tax advisor before public launch.
> - Provider fees, tax handling rules, and terms of service must be verified directly from each provider before implementation.
> - Virnix's tax residency, entity type, and registration obligations vary by jurisdiction and must be evaluated with professional advice.
> - The transaction examples and margin estimates in this section are for internal planning only and must not be relied upon for legal or financial compliance decisions.

---

## Appendix: UI Copy Reference

| Context | Suggested copy |
|---------|----------------|
| Plan name | Pro |
| Monthly price | €20/month |
| Credit quantity | 100 monthly credits |
| TikTok short | Short videos start from 1 credit |
| Long podcast | Long podcasts use more credits |
| Advanced kit | Advanced content kits use +1 credit |
| Creator Energy | Creator Energy included |
| Free tier CTA | Try free — no credit card needed |
| Upgrade CTA | Upgrade to Pro |
| Out of credits | You've used all your credits for this month |
| Credit counter | X credits remaining |

**Copy to avoid at all times:**

| ❌ Avoid | ✓ Use instead |
|---------|--------------|
| Token limits | Credits |
| AI context cost | (don't mention) |
| Compute units | Credits |
| Model usage | (don't mention) |
| API calls | Generations |
| Input tokens | (don't mention) |
| Rate limit | (don't mention to users — enforce silently) |
