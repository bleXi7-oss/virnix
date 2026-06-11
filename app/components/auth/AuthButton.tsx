"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../../lib/auth/supabase-client";

export default function AuthButton() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  // Start loading only if Supabase is configured — otherwise skip auth entirely
  const [loading, setLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Supabase not configured or auth check in progress — render nothing
  if (loading || !supabase) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex h-7 items-center rounded-full border border-zinc-200 bg-zinc-100 px-3 text-[11px] font-medium text-zinc-500 transition-all hover:border-zinc-300 hover:bg-zinc-200 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        Sign in with email
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[130px] truncate font-mono text-[10px] text-zinc-500 dark:text-zinc-500 sm:block">
        {user.email}
      </span>
      <button
        onClick={() => void supabase.auth.signOut()}
        className="flex h-7 items-center rounded-full border border-zinc-200 bg-zinc-100 px-3 text-[11px] font-medium text-zinc-500 transition-all hover:border-zinc-300 hover:bg-zinc-200 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        Sign out
      </button>
    </div>
  );
}
