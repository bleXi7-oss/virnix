"use client";

import type { AIDiagnostics } from "../lib/ai/diagnostics";
import { isEnabled } from "../lib/flags";

interface Props {
  diagnostics: AIDiagnostics | null | undefined;
}

// Developer-only AI diagnostics panel.
// Visible ONLY when NEXT_PUBLIC_FLAG_DEV_DEBUG=true (baked at build time).
// Shows request metadata — no sensitive info, no raw AI output.
export default function DebugPanel({ diagnostics }: Props) {
  if (!isEnabled("dev_debug") || !diagnostics) return null;

  const rows: [string, string | number | boolean][] = [
    ["provider",    diagnostics.provider],
    ["elapsed",     `${diagnostics.elapsedMs}ms`],
    ["tokens ~",    diagnostics.estimatedTokens],
    ["chunks",      diagnostics.chunkCount],
    ["type",        diagnostics.outputType],
    ["retries",     diagnostics.retryCount],
    ["fallback",    diagnostics.fallbackUsed],
    ["repaired",    diagnostics.parseRepaired],
    ["coerced",     diagnostics.coercionUsed],
    ...(diagnostics.stopReason ? [["stopReason", diagnostics.stopReason] as [string, string]] : []),
    ...(diagnostics.viralityScore != null
      ? [["score", `${diagnostics.viralityScore}/100`] as [string, string]]
      : []),
  ];

  return (
    <details className="mt-6 w-full max-w-2xl rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
      <summary className="cursor-pointer select-none text-[11px] font-mono font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        AI Diagnostics
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              {label}
            </span>
            <span
              className={`font-mono text-[12px] ${
                value === true
                  ? "text-amber-500"
                  : value === false
                    ? "text-zinc-400 dark:text-zinc-600"
                    : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {String(value)}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}
