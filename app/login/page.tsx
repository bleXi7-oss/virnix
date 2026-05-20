"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "../lib/auth/supabase-client";

type State = "idle" | "loading" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setState("loading");
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState("error");
      setErrorMsg(error.message);
    } else {
      setState("sent");
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f8f8f6] px-4 text-zinc-900 dark:bg-black dark:text-white">

      {/* Atmospheric layer */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 dark:hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-5%,rgba(170,170,200,0.22),rgba(185,185,215,0.06)_55%,transparent_80%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(155,155,195,0.55),transparent)]" />
          <Image
            src="/banner.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_25%] [filter:grayscale(1)_brightness(1.8)] opacity-[0.22] mix-blend-multiply"
          />
        </div>
        <div className="absolute inset-0 hidden dark:block">
          <Image
            src="/banner.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[center_25%] opacity-[0.14]"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-[#f8f8f6] dark:from-black to-transparent" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Chrome border glow */}
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl bg-linear-to-b from-zinc-300/40 via-zinc-200/10 to-transparent dark:from-zinc-600/20 dark:via-zinc-800/5"
          aria-hidden="true"
        />
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/40 p-8 backdrop-blur-lg shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_56px_rgba(0,0,0,0.13),inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-zinc-700/40 dark:bg-[#0a0a0a]/52 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_100px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.04)]">

          {/* Internal atmosphere */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
            <Image
              src="/banner.png"
              alt=""
              fill
              sizes="384px"
              className="object-cover object-[center_30%] [filter:grayscale(1)_brightness(1.6)] opacity-[0.18] mix-blend-multiply dark:hidden"
            />
            <Image
              src="/banner.png"
              alt=""
              fill
              sizes="384px"
              className="hidden object-cover object-[center_30%] opacity-[0.12] dark:block"
            />
          </div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="mb-7 flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Virnix"
                width={18}
                height={18}
                className="rounded-full opacity-100 dark:opacity-70"
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-600">
                VIRNIX
              </span>
            </div>

            {state === "sent" ? (
              <div>
                <p className="mb-1 text-base font-semibold text-zinc-900 dark:text-white">
                  Check your email
                </p>
                <p className="mb-6 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                  We sent a magic link to{" "}
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">{email}</span>.
                  Click it to sign in.
                </p>
                <button
                  onClick={() => { setState("idle"); setEmail(""); }}
                  className="text-[12px] text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="mb-1 text-base font-semibold text-zinc-900 dark:text-white">
                  Sign in to Virnix
                </p>
                <p className="mb-6 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                  Enter your email — we&apos;ll send you a magic link.
                </p>

                <div className="mb-3 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 focus-within:border-zinc-400 focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-zinc-600 dark:focus-within:shadow-none">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    required
                    disabled={state === "loading"}
                    className="flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none disabled:opacity-50 dark:text-white dark:placeholder-zinc-600"
                  />
                </div>

                {state === "error" && errorMsg && (
                  <p className="mb-3 text-[12px] text-red-500 dark:text-red-400">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={state === "loading" || !email.trim()}
                  className="w-full cursor-pointer rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(0,0,0,0.14),0_4px_24px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.07)] transition-all hover:bg-zinc-800 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.20),0_8px_32px_rgba(0,0,0,0.20)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 dark:bg-white dark:text-black dark:shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_4px_24px_rgba(255,255,255,0.08)] dark:hover:bg-zinc-50"
                >
                  {state === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending…
                    </span>
                  ) : (
                    "Send magic link"
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-zinc-200/60 pt-5 dark:border-zinc-800/60">
              <Link
                href="/"
                className="text-[12px] text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                ← Back to Virnix
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
