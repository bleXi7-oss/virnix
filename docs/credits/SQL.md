# CREDITS-A — Supabase SQL

## ⚠ MANUAL ACTION REQUIRED

Run this SQL in the **Supabase dashboard → SQL Editor** before deploying CREDITS-A to production.

Supabase dashboard → Project → SQL Editor → New query → paste → Run.

---

## Full migration (run once)

```sql
-- ─── user_credits table ───────────────────────────────────────────────────────

create table if not exists public.user_credits (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  balance    integer     not null default 3 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.user_credits enable row level security;

-- Users can read their own credit row.
-- All writes go through SECURITY DEFINER RPCs — no direct DML policies.
create policy "users_read_own_credits"
  on public.user_credits
  for select
  using (auth.uid() = user_id);


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
```

---

## Verification

After running the SQL, verify in the Supabase dashboard:

**Table editor → user_credits:**
- Table exists with columns: `user_id`, `balance`, `created_at`, `updated_at`
- RLS is enabled (lock icon visible)

**Authentication → Policies → user_credits:**
- `users_read_own_credits` policy (SELECT, using `auth.uid() = user_id`) is listed

**Database → Functions:**
- `ensure_user_credits()` — security definer, returns void
- `deduct_credits(p_amount integer)` — security definer, returns integer

---

## What this does NOT include

- Monthly credit reset (BILLING-A — triggered by Stripe/Paddle webhook)
- Pro plan credit allocation (BILLING-A)
- `credit_transactions` audit log (future — CREDITS-B)
- Database connectivity check in `/api/health/supabase` (add `SELECT 1 FROM user_credits LIMIT 1` once this schema is confirmed working)

---

## Security notes

- `ensure_user_credits` and `deduct_credits` use `SECURITY DEFINER` — they run as the DB owner (postgres), not as the anon role. This allows them to bypass RLS for writes while still being controlled by the function's own `auth.uid()` checks.
- No direct INSERT/UPDATE/DELETE policy is set on `user_credits`. All writes go through the RPCs. Authenticated users cannot modify their own balance directly.
- `grant execute ... to authenticated` means only authenticated Supabase users can call these RPCs — anonymous callers are rejected.
- The service role key is NOT required for CREDITS-A. The anon key + user session (cookies via `@supabase/ssr`) provides all the necessary auth context.
