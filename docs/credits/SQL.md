# CREDITS-A — Supabase SQL

## ⚠ MANUAL ACTION REQUIRED

Run this SQL in the **Supabase dashboard → SQL Editor** before deploying to production.

Supabase dashboard → Project → SQL Editor → New query → paste → Run.

> **STOP:** Do NOT trigger a Vercel redeploy until this SQL has been applied
> and verified in the Supabase dashboard. The `generation_feedback` table must
> exist before the feedback API route goes live.

---

## Full migration (safe to re-run)

All statements are idempotent. Safe to run on a fresh database or against an
existing schema — nothing will be duplicated or overwritten.

```sql
-- ─── user_credits table ───────────────────────────────────────────────────────

create table if not exists public.user_credits (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  balance    integer     not null default 3 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_credits enable row level security;

-- Policy: users can read their own credit row (safe to re-run)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'user_credits'
      and policyname = 'users_read_own_credits'
  ) then
    create policy "users_read_own_credits"
      on public.user_credits
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;


-- ─── RPC: ensure_user_credits ────────────────────────────────────────────────
-- Creates a 3-credit trial row for first-time users. Idempotent (ON CONFLICT DO NOTHING).
-- Called by the server at the start of every authenticated generation and by GET /api/credits.

create or replace function public.ensure_user_credits()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_credits (user_id, balance)
  values (auth.uid(), 3)
  on conflict (user_id) do nothing;
end;
$$;

grant execute on function public.ensure_user_credits() to authenticated;


-- ─── RPC: deduct_credits ─────────────────────────────────────────────────────
-- Atomically deducts p_amount from the authenticated user's credit balance.
-- Returns the new balance on success, or -1 if balance < p_amount (insufficient).
-- The UPDATE is atomic — no race condition between check and deduction.
-- Called by the server AFTER a successful AI generation (never before).

create or replace function public.deduct_credits(p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid         uuid    := auth.uid();
  v_new_balance integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Ensure the row exists before attempting deduction.
  insert into public.user_credits (user_id, balance)
  values (v_uid, 3)
  on conflict (user_id) do nothing;

  -- Atomic: check balance >= amount AND deduct in one UPDATE.
  update public.user_credits
  set
    balance    = balance - p_amount,
    updated_at = now()
  where user_id = v_uid
    and balance >= p_amount
  returning balance into v_new_balance;

  -- No row updated → insufficient credits.
  if v_new_balance is null then
    return -1;
  end if;

  return v_new_balance;
end;
$$;

grant execute on function public.deduct_credits(integer) to authenticated;


-- ─── generation_feedback table ───────────────────────────────────────────────
-- Stores "Would you post any of this?" responses from authenticated users.
-- Written by POST /api/feedback; read by analytics queries only.
-- response CHECK is added separately (safe for both fresh and existing tables).

create table if not exists public.generation_feedback (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  response   text        not null,
  created_at timestamptz not null default now()
);

-- CHECK constraint: enforce allowed response values (safe to re-run)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.generation_feedback'::regclass
      and conname  = 'generation_feedback_response_check'
  ) then
    alter table public.generation_feedback
      add constraint generation_feedback_response_check
        check (response in ('yes', 'some', 'no'));
  end if;
end
$$;

alter table public.generation_feedback enable row level security;

-- Policy: users can read their own feedback rows (safe to re-run)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'generation_feedback'
      and policyname = 'users_read_own_feedback'
  ) then
    create policy "users_read_own_feedback"
      on public.generation_feedback
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

-- Policy: users can insert their own feedback rows (safe to re-run)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'generation_feedback'
      and policyname = 'users_insert_own_feedback'
  ) then
    create policy "users_insert_own_feedback"
      on public.generation_feedback
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;
```

---

## Verification checklist

After running the SQL, confirm each item in the Supabase dashboard before triggering a Vercel redeploy.

**Table editor → `user_credits`:**
- [ ] Table exists with columns: `user_id`, `balance`, `created_at`, `updated_at`
- [ ] RLS enabled (lock icon visible next to table name)

**Table editor → `generation_feedback`:**
- [ ] Table exists with columns: `id`, `user_id`, `response`, `created_at`
- [ ] RLS enabled (lock icon visible next to table name)

**Database → Policies (or Authentication → Policies):**
- [ ] `users_read_own_credits` on `user_credits` — SELECT, `auth.uid() = user_id`
- [ ] `users_read_own_feedback` on `generation_feedback` — SELECT, `auth.uid() = user_id`
- [ ] `users_insert_own_feedback` on `generation_feedback` — INSERT, `auth.uid() = user_id`

**Database → Constraints (Table editor → `generation_feedback` → Constraints tab):**
- [ ] `generation_feedback_response_check` — CHECK `response in ('yes', 'some', 'no')`

**Database → Functions:**
- [ ] `ensure_user_credits()` — security definer, returns void
- [ ] `deduct_credits(p_amount integer)` — security definer, returns integer

---

## What this does NOT include

- Monthly credit reset (BILLING-A — triggered by Stripe/Paddle webhook)
- Pro plan credit allocation (BILLING-A)
- `credit_transactions` audit log (future — CREDITS-B)
- Database connectivity check in `/api/health/supabase` (add `SELECT 1 FROM user_credits LIMIT 1` once this schema is confirmed working)
- Indexes on `generation_feedback` — add when row count exceeds ~1,000 (see TODOS.md)

---

## Security notes

- `ensure_user_credits` and `deduct_credits` use `SECURITY DEFINER` — they run as the DB owner (postgres), not as the anon role. This allows them to bypass RLS for writes while still being controlled by the function's own `auth.uid()` checks.
- No direct INSERT/UPDATE/DELETE policy is set on `user_credits`. All writes go through the RPCs. Authenticated users cannot modify their own balance directly.
- `grant execute ... to authenticated` means only authenticated Supabase users can call these RPCs — anonymous callers are rejected.
- The service role key is NOT required for CREDITS-A. The anon key + user session (cookies via `@supabase/ssr`) provides all the necessary auth context.
- `generation_feedback` INSERT policy uses `with check` (not `using`) — correct for INSERT-only policies in PostgreSQL RLS.
