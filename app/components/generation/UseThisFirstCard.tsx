"use client";

import { useState } from "react";
import type { BestAngle } from "../../lib/types/generation";

interface Props {
  bestAngle: BestAngle;
}

const VARIANT_LABELS: Record<keyof BestAngle["hook_variants"], string> = {
  curiosity:  "Curiosity",
  contrarian: "Contrarian",
  tactical:   "Tactical",
  reflective: "Reflective",
  punchy:     "Punchy",
};

function CopyInline({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy hook"
      className={`ml-auto shrink-0 flex cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all active:scale-95 ${
        copied
          ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
          : "border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
      }`}
    >
      {copied ? (
        <>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <div className="h-px flex-1 bg-linear-to-r from-transparent to-zinc-200 dark:to-zinc-800" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-linear-to-l from-transparent to-zinc-200 dark:to-zinc-800" />
    </div>
  );
}

export default function UseThisFirstCard({ bestAngle }: Props) {
  const { hook, why, caution, best_platform, hook_variants } = bestAngle;

  return (
    <div className="mt-8 w-full max-w-2xl animate-[fade-in_0.35s_ease_forwards]">
      <SectionDivider label="Use This First" />

      <div className="rounded-xl border border-zinc-200 bg-white px-7 py-6 dark:border-zinc-800/60 dark:bg-[#0a0a0a] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.03)]">

        {/* Best hook */}
        <div className="mb-4 flex items-start gap-3">
          <p className="flex-1 text-[18px] font-semibold leading-[1.35] tracking-tight text-zinc-900 dark:text-white">
            {hook}
          </p>
          <CopyInline text={hook} />
        </div>

        {/* Best platform badge */}
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
            Best on {best_platform}
          </span>
        </div>

        {/* Why it works */}
        <p className="mb-3 text-[13px] leading-[1.7] text-zinc-500 dark:text-zinc-400">
          {why}
        </p>

        {/* Caution */}
        {caution && (
          <p className="mb-5 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">
            ↳ {caution}
          </p>
        )}

        {/* Hook variants */}
        <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800/40">
          <p className="mb-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Hook Variants
          </p>
          <div className="flex flex-col gap-2.5">
            {(Object.keys(VARIANT_LABELS) as (keyof BestAngle["hook_variants"])[]).map((key) => {
              const text = hook_variants[key];
              if (!text) return null;
              return (
                <div
                  key={key}
                  className="flex items-start gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3.5 py-2.5 dark:border-zinc-800/60 dark:bg-zinc-900/30"
                >
                  <span className="mt-0.5 shrink-0 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                    {VARIANT_LABELS[key]}
                  </span>
                  <p className="flex-1 text-[12px] leading-[1.6] text-zinc-600 dark:text-zinc-300">
                    {text}
                  </p>
                  <CopyInline text={text} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
