"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User | null;
}

type Response = "yes" | "some" | "no";

const LABELS: Record<Response, string> = { yes: "Yes", some: "Some", no: "No" };

export default function FeedbackWidget({ user }: Props) {
  const [selected, setSelected] = useState<Response | null>(null);
  const [done, setDone] = useState(false);

  if (!user) return null;

  async function handleSelect(response: Response) {
    if (selected !== null) return;
    setSelected(response);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response }),
      });
      setDone(true);
    } catch {
      // Network error — buttons stay disabled, no Thanks! shown
    }
  }

  const isDisabled = selected !== null;

  return (
    <div className="mt-8 w-full max-w-2xl animate-[fade-in_0.35s_ease_forwards]">
      <div className="rounded-xl border border-zinc-200 bg-white px-7 py-6 dark:border-zinc-800/60 dark:bg-[#0a0a0a] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.03)]">
        <p className="mb-4 text-[14px] font-medium text-zinc-700 dark:text-zinc-300">
          Would you post any of this?
        </p>

        {done ? (
          <div className="flex items-center gap-2 text-[13px] text-zinc-400 dark:text-zinc-500">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Thanks!
          </div>
        ) : (
          <div role="group" aria-label="Would you post any of this?" className="flex gap-3">
            {(["yes", "some", "no"] as const).map((response) => {
              const isSelected = selected === response;
              return (
                <button
                  key={response}
                  type="button"
                  onClick={() => void handleSelect(response)}
                  disabled={isDisabled}
                  className={[
                    "px-5 py-3 text-[13px] font-medium rounded-lg border transition-all",
                    isDisabled ? "pointer-events-none" : "cursor-pointer active:scale-95",
                    isSelected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : isDisabled
                      ? "opacity-40 border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400"
                      : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200",
                  ].join(" ")}
                >
                  {LABELS[response]}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
