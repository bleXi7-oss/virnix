# Virnix Auth — Setup Notes (AUTH-A / AUTH-A-FIX-3)

**Phase:** AUTH-A-FIX-3  
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

**If these are missing or empty:**
- `AuthButton` renders nothing (no crash, no error screen) — the top bar shows only the theme toggle
- `/login` form shows "Authentication is not configured" when submitted
- The landing page and generation flow are completely unaffected
- The app will never show the error boundary screen because of missing Supabase env vars

**On Vercel:** set both vars in Project → Settings → Environment Variables for Production, Preview, and Development. Without them the app works but auth is hidden.

---

## Troubleshooting: "Failed to fetch" on /login

If the magic-link form shows **"Could not reach the authentication service"** (or a `TypeError: Failed to fetch` in browser dev tools), work through this checklist in order:

### 1. Check Supabase project status (most likely cause)

Supabase **free-tier projects pause after 1 week of inactivity**. When paused, the subdomain stops resolving in DNS — every request fails with a network error before it reaches Supabase.

**Fix:**
1. Log in at https://app.supabase.com
2. Find your project
3. If the project shows "Paused", click **Restore project** (takes ~30–60 seconds)
4. Once restored, DNS resolves and auth works immediately

### 2. Verify the project URL is correct

The `NEXT_PUBLIC_SUPABASE_URL` must match your Supabase project URL exactly:
- Format: `https://<project-id>.supabase.co`
- No trailing slash
- Must start with `https://`
- Get the correct URL from: Supabase dashboard → Project → Settings → API

### 3. Check the anon key is valid

- Must be on **one line** — no line breaks, no quotes around the value
- Must be the **anon/public** key, not the service_role key
- Anon key is a JWT (~200 chars); service_role key is longer and starts differently
- After any edit to `.env.local`, **restart the dev server** (`Ctrl+C` then `npm.cmd run dev`)

### 4. Run the built-in connectivity check

```bash
npx tsx scripts/check-supabase-auth.ts
```

This script reads `.env.local`, prints safe diagnostics (no secrets), and tests DNS + HTTP reachability to your Supabase project. Exit 0 = healthy, Exit 1 = misconfigured or unreachable.

### 5. Browser/network checks

If the script reaches Supabase but the browser still fails:
- Disable browser extensions (ad blockers, privacy extensions can block Supabase)
- Check if a VPN or corporate firewall is routing traffic
- Try in an incognito window
- Check browser network tab: the failing request URL and error message are shown there

---

## Troubleshooting: Production ERR_NAME_NOT_RESOLVED

If the **production** app fails with `net::ERR_NAME_NOT_RESOLVED` on the Supabase OTP request:

### Step 1 — Confirm the request host in DevTools

Open browser DevTools → Network tab → submit the login form → find the `otp` request.

- Check the request URL: it will be `https://<project-id>.supabase.co/auth/v1/otp?...`
- If `<project-id>` is wrong, the production Vercel env var has the wrong URL (or old deployment is serving stale bundle — see below)
- If `<project-id>` is correct but DNS fails → Supabase project itself is the problem (paused, wrong ref, or still restoring)

### Step 2 — NEXT_PUBLIC_* vars are baked at Vercel build time

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are inlined into the JavaScript bundle when Vercel builds the app. They are **not read at runtime** from environment variables.

**Consequences:**
- After changing either variable in Vercel Project → Settings → Environment Variables, you **must trigger a new deployment** before production picks up the new values.
- A hard refresh in the browser is not enough — the browser is still serving the old bundle.
- The fastest way to redeploy: push any commit to `main`, or use Vercel dashboard → Deployments → Redeploy.

**How to verify the production bundle has the right URL:**
1. Open the production site
2. Open DevTools → Application tab → Sources (or Network)
3. Trigger the login form and check the request host
4. If still wrong: Vercel env var is missing or the redeploy hasn't propagated yet (wait ~60s after deploy finishes)

### Step 3 — Verify the Supabase project URL in the dashboard

After every Supabase project restore or recreation, copy the Project URL fresh from:

**Supabase dashboard → Project → Settings → API → Project URL**

Do not rely on a URL saved in a previous session — Supabase may issue a new project ref on restore or if the project is recreated.

Update `.env.local` and Vercel env vars, then redeploy.

---

## Required Supabase dashboard configuration

### Auth → URL Configuration → Redirect URLs

Add all three:
```
http://localhost:3000/auth/callback
https://virnix.pro/auth/callback
https://www.virnix.pro/auth/callback
```

**Important:** The production browser error showed `redirect_to=https://www.virnix.pro/auth/callback` (with www). Both www and non-www must be in the allowlist or magic links will fail with a redirect URL error after DNS is resolved.

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

---

## Future: Supabase heartbeat route (post-CREDITS-A)

Before or during CREDITS-A, add a server-side health route that verifies Supabase config and reachability without exposing secrets:

Preferred endpoint: `/api/health/supabase`

What it should check:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Supabase auth endpoint (`/auth/v1/health`) is reachable from the server
- Returns `{ ok: true }` or `{ ok: false, reason: "..." }` — never exposes key values

This gives production Vercel deployments a fast way to verify Supabase connectivity without checking logs.
Do not implement until CREDITS-A — the route is only useful once auth is enforced server-side.
