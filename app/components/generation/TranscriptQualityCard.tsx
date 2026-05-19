"use client";

import type { TranscriptQualityReport } from "../../lib/timeline/transcript-quality";

interface Props {
  report: TranscriptQualityReport;
}

const CLIPABILITY_CONFIG = {
  high: {
    icon: "🔥",
    label: "High Clipability",
    labelColor: "text-emerald-600 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  medium: {
    icon: "⚠️",
    label: "Medium Clipability",
    labelColor: "text-amber-600 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  low: {
    icon: "○",
    label: "Low Clipability",
    labelColor: "text-zinc-500 dark:text-zinc-400",
    dotColor: "bg-zinc-400",
  },
} as const;

export default function TranscriptQualityCard({ report }: Props) {
  const { clipability, strongestSignals, weaknesses, summary, creatorFit } = report;
  const config = CLIPABILITY_CONFIG[clipability];

  return (
    <div className="mt-8 w-full max-w-2xl animate-[fade-in_0.35s_ease_forwards]">
      {/* Section header — matches ClipGuide and OutputPanel style */}
      <div className="mb-5 flex items-center gap-4">
        <div className="h-px flex-1 bg-linear-to-r from-transparent to-zinc-200 dark:to-zinc-800" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-600">
          Transcript Quality
        </span>
        <div className="h-px flex-1 bg-linear-to-l from-transparent to-zinc-200 dark:to-zinc-800" />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-[#0a0a0a]">
        {/* Clipability rating */}
        <div className="mb-4 flex items-center gap-2.5">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${config.dotColor}`}
            aria-hidden="true"
          />
          <span className={`text-[13px] font-semibold ${config.labelColor}`}>
            {config.icon} {config.label}
          </span>
        </div>

        {/* Strongest signals */}
        {strongestSignals.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
              Strongest signals
            </p>
            <div className="flex flex-wrap gap-1.5">
              {strongestSignals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <p className="mb-3 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          {summary}
        </p>

        {/* Weaknesses — only for medium/low */}
        {weaknesses.length > 0 && (
          <p className="mb-3 text-[11px] text-zinc-400 dark:text-zinc-600">
            ↳ {weaknesses[0]}
          </p>
        )}

        {/* Platform fit */}
        {creatorFit.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600">Best fit:</span>
            {creatorFit.map((platform) => (
              <span
                key={platform}
                className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-500"
              >
                {platform}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
