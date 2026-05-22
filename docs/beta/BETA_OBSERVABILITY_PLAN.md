# Virnix Beta — Observability Plan

**Phase:** FREE-BETA-OBSERVABILITY-A
**Date:** 2026-05-22
**Status:** Planning / documentation only

---

## 1. Purpose — Why Beta Tracking Matters

The 20-user beta is not a demo. It is a learning exercise.

The only way it produces value is if you know:
- Who tried the product
- What they did
- What broke
- What they said
- Whether they would pay

Without structured tracking, beta feedback becomes noise: disconnected impressions you cannot act on. With a lightweight system, the same 20 users produce a clear picture you can use to make a confident decision about billing, roadmap, and product direction.

The goal is not a full analytics product. The goal is enough structure to answer "what did we learn?" at the end of week 2.

---

## 2. Minimum Beta Data to Capture

For every generation that completes (or fails), capture:

| Field | Source | Why |
|-------|--------|-----|
| `user_id` | Supabase auth | Identify which user generated |
| `user_email` | Supabase auth | For direct follow-up |
| `created_at` | Server timestamp | When they generated |
| `youtube_url` | Request body | What they tested (useful to spot patterns) |
| `output_language` | Request body | Which language was used |
| `energy_ids` | Request body | Which creator energies were selected |
| `best_angle_returned` | Boolean | Did AI return a best_angle? (quality signal) |
| `generation_status` | `success` / `error` / `blocked_by_credits` | Outcome |
| `credits_used` | Server calculation | Confirms credit deduction math |
| `credits_remaining` | Post-deduction balance | Track depletion rate |
| `error_category` | Server error type | What broke and why |
| `transcript_duration_sec` | Transcript result | Video length distribution |
| `ai_elapsed_ms` | Timer in generate.ts | Performance baseline |

**What NOT to capture:**
- Transcript text content
- AI output content (generated cards)
- Session tokens or access tokens
- Full error stack traces in DB (use logs for those)
- Any PII beyond email (no names, no location)

All generation data is internal only. Never send to third-party analytics.

---

## 3. Feedback Data — What to Collect Per User

After a user generates, ask for structured feedback. Even a Tally form with 5 questions is enough.

| Field | Type | Why |
|-------|------|-----|
| `useful` | `yes` / `no` / `sort of` | Quick signal |
| `output_quality` | 1–5 scale | Quantifiable quality signal |
| `would_pay` | `yes` / `maybe` / `no` | Core beta question |
| `favorite_output_type` | freeform | Which output felt most valuable |
| `what_was_missing` | freeform | Biggest gap |
| `testimonial_permission` | `yes` / `no` | Can we quote this? |

Collect via:
- Tally.so or Typeform form (link near output area or in follow-up DM)
- Or directly in a conversation / DM (then log it manually)

Do NOT try to auto-capture this in the database at this stage. Manually logging 20 responses is faster than building a feedback endpoint.

---

## 4. Founder Notes — Per-User Tagging

For each beta user, keep a private note (Supabase table or a simple text file is fine):

| Tag | Meaning |
|-----|---------|
| `follow_up_needed` | User tried it but hasn't responded to feedback ask yet |
| `good_lead` | User showed genuine interest or mentioned a real use case |
| `bug_report` | User encountered a specific bug (log separately) |
| `likely_paid_user` | Said "I would pay" or asked about pricing unprompted |
| `ignore_noise` | Tried once out of curiosity, clearly not the target user |
| `founder_note` | Anything else worth remembering about this user's context |

One row per user. Update as conversations happen. This is how 20 users stay manageable.

---

## 5. Privacy Rules

**What users must know before generating:**

The site must show a minimal privacy notice before the first beta invite is sent. Minimum text:

> "Virnix uses the YouTube URL you provide to extract a transcript. That transcript is sent to Anthropic's Claude API to generate content. We do not store your transcript or generated output. We log metadata (timestamps, error rates, usage counts) to improve the product. By using Virnix, you agree to these terms."

Place this:
- On the landing page (footer or modal)
- Or as a one-time acceptance before the first generation

**Privacy constraints that must never be violated:**
- Never log transcript text to any database or analytics service
- Never log generated output text (hooks, threads, posts) to any database
- Never send email addresses to third-party analytics
- Never share user data (even anonymized) publicly without explicit permission
- Metadata logs (user_id, duration_sec, elapsed_ms, status) are acceptable and expected
- If a user asks what data you store: the honest answer is "your email (via Supabase auth) and your credit balance. We log usage metadata but not your content."

---

## 6. Minimum Implementation Recommendation — 20-User Beta

For 20 users, the minimal viable observability stack is:

**Tier 1 — Free / already available:**
- **Vercel logs**: structured `console.log` in the route — already in place via `[virnix]` prefix
- **Supabase table editor**: read `user_credits` daily to see sign-ups and credit depletion
- **Anthropic dashboard**: check total cost weekly

**Tier 2 — Add before first invite (database):**
- One `generation_logs` table in Supabase (schema below)
- A single `INSERT` in the generate route after success/failure
- No new API routes, no new frontend code

**Tier 3 — After 50+ users:**
- PostHog or similar (client-side UX events only)
- Internal admin page to view generation logs by user
- Automated daily summary email or webhook

For the first 20 users, Tier 1 + Tier 2 is enough. Do not build Tier 3 during beta.

---

## 7. Suggested Database Tables

### `generation_logs` — one row per generation attempt

```sql
create table generation_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  youtube_url text,
  output_language text,
  energy_ids text[], -- array of selected energy IDs
  best_angle_returned boolean default false,
  generation_status text check (generation_status in ('success', 'error', 'blocked_by_credits')),
  error_category text, -- null on success
  credits_used numeric,
  credits_remaining numeric,
  transcript_duration_sec integer,
  ai_elapsed_ms integer,
  created_at timestamptz default now()
);

-- RLS: service role only (never exposed to client)
alter table generation_logs enable row level security;
-- No client-facing policies — internal use only
```

### `generation_feedback` — optional, one row per user feedback response

```sql
create table generation_feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  useful text check (useful in ('yes', 'no', 'sort_of')),
  output_quality integer check (output_quality between 1 and 5),
  would_pay text check (would_pay in ('yes', 'maybe', 'no')),
  favorite_output_type text,
  what_was_missing text,
  testimonial_permission boolean default false,
  created_at timestamptz default now()
);
```

### `founder_beta_notes` — internal founder notes per user

```sql
create table founder_beta_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  tags text[], -- follow_up_needed, good_lead, bug_report, likely_paid_user, ignore_noise
  founder_note text,
  updated_at timestamptz default now()
);
```

**Important:** These tables do not need to be built before the beta starts. `generation_logs` is the highest priority. The other two can be replaced by a text file or spreadsheet for 20 users.

---

## 8. Daily Review Workflow — 15-Minute Checklist

Every morning during beta:

| Step | Time | Where |
|------|------|-------|
| New sign-ups | 2 min | Supabase → Table editor → `user_credits` (new rows = new users) |
| Credit activity | 2 min | Same table — who used credits, who has 0 left |
| Generation log review | 3 min | Supabase → `generation_logs` → sort by created_at desc |
| Error rate | 3 min | Vercel dashboard → Functions → filter by route `/api/generate` → look for 500s |
| Anthropic cost | 2 min | Anthropic dashboard — daily or weekly |
| Unread messages from users | 3 min | DMs, email — respond within 4 hours |

Total: ~15 minutes. Log anything unexpected in BETA_LOG.md.

**What to log in BETA_LOG.md:**
- One sentence summarizing the day's activity
- Any errors seen and what caused them
- Any user feedback received (exact words if possible)
- Any changes made (with commit hash)

---

## 9. Signal vs. Noise Framework

### What counts as signal

- Same complaint or request from 3+ different users independently
- A user stops using the product and explains why
- A user says "I would pay for this if it did X"
- A generation failure rate above 10% for a specific URL pattern, language, or energy
- A user compares Virnix to a specific competitor and names the difference

### What counts as noise

- One user asks for a feature nobody else has mentioned
- A user tries the product once, never engages again, gives vague critique
- Friends say "looks great!" — that is politeness, not feedback
- A user asks for video editing, auto-posting, or team features (wrong audience)
- A user complains about something you already know is rough and planned to fix

### How to act on signal vs. noise

| Type | Action |
|------|--------|
| P0 signal (blocks usage) | Fix same day |
| P1 signal (causes confusion for multiple users) | Fix within 48 hours |
| Product signal (new feature, 3+ users) | Log in docs/roadmap/FEATURE_ROADMAP.md, do not build during beta |
| Noise | Log briefly in BETA_LOG.md, do not act |
| "Would pay" signal | Log in founder_beta_notes, follow up personally |

---

## 10. Required Before First 20 Users

These observability items must be in place before sending the first invite:

- [ ] **Privacy notice visible** on virnix.pro (even one paragraph — see Section 5 above)
- [ ] **Vercel logs accessible** — know how to filter `[virnix]` prefix logs
- [ ] **Supabase dashboard accessible** — can see `user_credits` table
- [ ] **Anthropic billing dashboard** — alerts enabled or cost visible
- [ ] **BETA_LOG.md** created at `docs/beta/BETA_LOG.md` (blank file, ready to fill daily)
- [ ] **Feedback collection method** — even "reply to my DM" counts; a Tally form is better
- [ ] **Direct contact with each user** — have a way to reach every beta user (DM, email, WhatsApp)
- [ ] **Founder note system** — even a simple text file with one line per user
- [ ] [ Optional ] `generation_logs` table created in Supabase (schema in Section 7)

**Hard rule:** Do not invite users if you have no way to know whether they generated something or not. Supabase `user_credits` watching is the minimum floor.

---

## Why This Plan Stays Lightweight

At 20 users:
- A spreadsheet beats a dashboard
- A daily text log beats an analytics provider
- A DM conversation beats a feedback widget
- Watching Supabase directly beats a custom admin page

The risk of underbuilding observability at 20 users: you miss a pattern across 5 users that you could have caught. Solution: ask each user directly.

The risk of overbuilding: you spend 3 days on a feedback pipeline instead of talking to users.

Build `generation_logs` in Supabase. Talk to users. Read logs. That is the whole plan.
