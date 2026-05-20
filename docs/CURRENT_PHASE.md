# Current Phase — Supabase Authentication (AUTH-A)

Phase started: 2026-05-20
Status: complete and pushed

---

## Previous phase: Feedback / Improvement Loop Plan (BUSINESS-DOCS-C, 2026-05-20) — complete

---

## Context

AUTH-A adds Supabase magic link authentication. Generation and landing page remain public — no auth gate on usage yet. CREDITS-A will enforce usage server-side.

---

## What Changed

### New files

| File | Purpose |
|------|---------|
| `app/lib/auth/supabase-client.ts` | `createBrowserClient` for `"use client"` components |
| `app/lib/auth/supabase-server.ts` | Async `createServerClient` with cookie store for server components / route handlers |
| `app/auth/callback/route.ts` | Magic link code exchange → session cookies → redirect |
| `app/components/auth/AuthButton.tsx` | Sign in link / email + Sign out button |
| `app/login/page.tsx` | Magic link form with premium Virnix aesthetic |
| `docs/auth/README.md` | Setup notes, env vars, dashboard config, flow walkthrough, security notes |

### Modified files

| File | Change |
|------|--------|
| `app/page.tsx` | `AuthButton` added to top bar via `dynamic(..., { ssr: false })`; top bar flex row with ThemeToggle |
| `.env.example` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` added; redirect URL docs |
| `docs/CURRENT_PHASE.md` | This file |
| `docs/PHASE_HISTORY.md` | Phase 36 appended |
| `docs/roadmap/FEATURE_ROADMAP.md` | Auth rows marked ✅ Shipped |
| `docs/roadmap/RELEASE_PLAN.md` | AUTH-A (36) added to v0.1.0 phases |

---

## What Was NOT Implemented

- No credit check or deduction (CREDITS-A)
- No Pro gating (BILLING-A)
- No generation history (v0.4.x)
- No feedback storage (v0.3.x)
- No middleware for automatic token refresh (CREDITS-A)
- No auth gate on generation or landing page

---

## Validation

- Build: ✅ clean (TypeScript, Turbopack)
- Lint: ✅ clean
- `dynamic(..., { ssr: false })` fix applied for SSR prerender compatibility

---

## Next Recommended Step

**CREDITS-A — Server-side credit check and deduction**

Auth is the prerequisite. Now implement:
1. Server-side session read in `/api/generate`
2. Credit balance check before AI call
3. Atomic deduction
4. Free tier trial credit allocation on first sign-in
5. Middleware for session refresh on all routes
