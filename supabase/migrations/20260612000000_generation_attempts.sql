-- ============================================================
-- MIGRATION: generation_attempts — credit deduction idempotency
-- Apply manually in Supabase SQL Editor.
-- This is idempotent — safe to run multiple times.
-- ============================================================

-- Table: one row per client generation attempt.
-- unique(user_id, attempt_key) is the idempotency constraint.
create table if not exists public.generation_attempts (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  attempt_key      text        not null,
  status           text        not null default 'started'
                               check (status in ('started', 'warning', 'success', 'error')),
  credits_deducted integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint generation_attempts_user_attempt_unique unique (user_id, attempt_key)
);

-- Index for fast (user_id, attempt_key) lookups.
create index if not exists generation_attempts_user_key_idx
  on public.generation_attempts (user_id, attempt_key);

-- RLS: users see only their own attempts.
alter table public.generation_attempts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'generation_attempts'
      and policyname = 'users_own_attempts'
  ) then
    create policy "users_own_attempts" on public.generation_attempts
      for all using (auth.uid() = user_id);
  end if;
end $$;

-- ─── start_generation_attempt ──────────────────────────────────────────────────
-- Atomically tries to start a new attempt.
-- Returns:
--   'new'         — fresh insert succeeded, proceed with generation
--   'in_progress' — same ID already started, duplicate request, block safely
--   'completed'   — same ID already succeeded, duplicate request, block safely
-- (For 'error'/'warning' status the row is reset to 'started' and 'new' is returned,
--  allowing the client to retry with the same ID after a failure.)
create or replace function public.start_generation_attempt(p_attempt_key text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  insert into public.generation_attempts (user_id, attempt_key, status)
  values (auth.uid(), p_attempt_key, 'started')
  on conflict (user_id, attempt_key) do nothing;

  if found then
    return 'new';
  end if;

  select status into v_status
  from public.generation_attempts
  where user_id = auth.uid() and attempt_key = p_attempt_key;

  case v_status
    when 'started' then
      return 'in_progress';
    when 'success' then
      return 'completed';
    else
      -- 'error' or 'warning': reset to allow retry.
      update public.generation_attempts
         set status = 'started', updated_at = now()
       where user_id = auth.uid() and attempt_key = p_attempt_key;
      return 'new';
  end case;
end;
$$;

-- ─── complete_generation_attempt ───────────────────────────────────────────────
-- Marks a started attempt as succeeded with the credits charged.
create or replace function public.complete_generation_attempt(
  p_attempt_key      text,
  p_credits_deducted integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.generation_attempts
     set status           = 'success',
         credits_deducted = p_credits_deducted,
         updated_at       = now()
   where user_id = auth.uid() and attempt_key = p_attempt_key;
end;
$$;

-- ─── fail_generation_attempt ───────────────────────────────────────────────────
-- Marks an attempt as failed or blocked (no credits charged).
-- p_status should be 'error' or 'warning'.
create or replace function public.fail_generation_attempt(
  p_attempt_key text,
  p_status      text default 'error'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.generation_attempts
     set status     = p_status,
         updated_at = now()
   where user_id = auth.uid() and attempt_key = p_attempt_key;
end;
$$;
