# Virnix Auth — Setup Notes (AUTH-A)

**Phase:** AUTH-A  
**Date:** 2026-05-20  
**Package:** `@supabase/ssr` + `@supabase/supabase-js`

---

## What was implemented

- Supabase browser and server clients (`app/lib/auth/`)
- Magic link sign-in flow (`app/login/page.tsx`)
- Auth callback route (`app/auth/callback/route.ts`)
- AuthButton in top bar — shows Sign in / email + Sign out (`app/components/auth/AuthButton.tsx`)
- Generation and landing page remain public — no auth gate on usage yet (CREDITS-A will enforce)

---

## Required environment variables

Add to `.env.local` (copy from `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get both from: Supabase dashboard → Project → Settings → API

---

## Required Supabase dashboard configuration

### Auth → URL Configuration → Redirect URLs

Add both:
```
http://localhost:3000/auth/callback
https://virnix.com/auth/callback
```

Without these, magic link emails will fail with a redirect URL error.

### Auth → Email Templates (optional polish)

The default magic link email is serviceable. Customise it later with Virnix branding.

---

## How the magic link flow works

1. User visits `/login`, enters email
2. `signInWithOtp({ email, emailRedirectTo: origin + '/auth/callback' })` — Supabase sends email
3. User clicks link → browser hits `/auth/callback?code=...`
4. Route handler calls `exchangeCodeForSession(code)` — Supabase sets session cookies
5. Redirect to `/` — AuthButton now shows email + Sign out

---

## File structure

```
app/lib/auth/
  supabase-client.ts    ← createBrowserClient (use in "use client" components)
  supabase-server.ts    ← createServerClient (use in Server Components / Route Handlers)

app/components/auth/
  AuthButton.tsx        ← client component: Sign in link or email + Sign out

app/login/
  page.tsx              ← magic link form

app/auth/callback/
  route.ts              ← code exchange → session cookie → redirect home
```

---

## Security notes

- Anon key is public — safe to expose in client. Never expose the service role key.
- Session tokens are stored in cookies by `@supabase/ssr` — not in localStorage.
- Auth state on the client is UX convenience only. CREDITS-A will enforce usage server-side via server-side session reads.
- Do not log session tokens or access tokens anywhere.

---

## What AUTH-A does NOT include

- No credit check or deduction (CREDITS-A)
- No Pro gating (BILLING-A)
- No generation history (v0.4.x)
- No feedback storage (v0.3.x)
- No middleware for automatic token refresh (add in CREDITS-A when server routes need reliable sessions)

---

## Next step: CREDITS-A

CREDITS-A will:
1. Read user session server-side in `/api/generate`
2. Check credit balance before AI call
3. Deduct credits atomically
4. Allocate trial credits on first sign-in
5. Add middleware for session refresh on all routes
