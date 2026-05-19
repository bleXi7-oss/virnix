"use client";

import type { AIDiagnostics } from "../lib/ai/diagnostics";
import type { TimelineMoment } from "../lib/timeline/types";
import { isEnabled } from "../lib/flags";

interface Props {
  diagnostics: AIDiagnostics | null | undefined;
  timelineMoments?: TimelineMoment[] | null;
}

// Developer-only AI diagnostics panel.
// Visible ONLY when NEXT_PUBLIC_FLAG_DEV_DEBUG=true (baked at build time).
// Shows request metadata — no sensitive info, no raw AI output.
export default function DebugPanel({ diagnostics, timelineMoments }: Props) {
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
    ...(diagnostics.timelineMomentsDetected != null
      ? [["moments", `${diagnostics.timelineMomentsDetected} detected`] as [string, string]]
      : []),
  ];

  return (
    <div className="mt-6 w-full max-w-2xl space-y-3">
      {/* AI Diagnostics */}
      <details className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
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

      {/* Timeline Moments */}
      {timelineMoments && timelineMoments.length > 0 && (
        <details className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <summary className="cursor-pointer select-none text-[11px] font-mono font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            Best Clip Opportunities — {timelineMoments.length} detected
          </summary>
          <div className="mt-3 space-y-4">
            {timelineMoments.map((m) => (
              <div
                key={m.id}
                className="border-l-2 border-zinc-300 pl-3 dark:border-zinc-700"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                    {m.startTime}–{m.endTime}
                  </span>
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {m.title}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                    {m.confidenceScore}/100
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-1 leading-relaxed">
                  {m.sourceTextPreview}{m.sourceTextPreview.length >= 120 ? "…" : ""}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 italic mb-1">
                  &ldquo;{m.suggestedHook}&rdquo;
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {m.platformFit.slice(0, 3).map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-zinc-300 px-2 py-0.5 text-[9px] uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-500"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
