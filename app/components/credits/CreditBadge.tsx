"use client";

import { useEffect, useState } from "react";

interface Props {
  // Balance from the last generation response. When provided, overrides the local fetch.
  balance: number | null;
}

export default function CreditBadge({ balance }: Props) {
  const [local, setLocal] = useState<number | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: unknown) => {
        if (d && typeof d === "object" && "balance" in d && typeof (d as { balance: unknown }).balance === "number") {
          setLocal((d as { balance: number }).balance);
        }
      })
      .catch(() => {})
      .finally(() => setFetched(true));
  }, []);

  // Use parent's value (most recent generation) when available; fall back to local fetch.
  const display = balance ?? local;

  // Don't render until we've attempted the fetch — avoids flicker of stale state.
  if (!fetched && balance === null) return null;
  if (display === null) return null;

  return (
    <span className="hidden items-center rounded-full border border-zinc-200 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:flex dark:border-zinc-800 dark:text-zinc-500">
      {display} {display === 1 ? "credit" : "credits"}
    </span>
  );
}
