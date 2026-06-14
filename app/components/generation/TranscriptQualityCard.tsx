"use client";

import type { TranscriptQualityReport } from "../../lib/timeline/transcript-quality";

interface Props {
  report: TranscriptQualityReport;
}

const CLIPABILITY_CONFIG = {
  high: {
    label: "High Clipability",
    sublabel: "Strong psychological content",
    labelColor: "text-emerald-600 dark:text-emerald-400",
    barColor: "bg-emerald-500",
    barWidth: "w-full",
  },
  medium: {
    label: "Medium Clipability",
    sublabel: "Solid content, limited contrast",
    labelColor: "text-amber-600 dark:text-amber-500",
    barColor: "bg-amber-400",
    barWidth: "w-3/5",
  },
  low: {
    label: "Low Clipability",
    sublabel: "Limited short-form potential",
    labelColor: "text-zinc-500 dark:text-zinc-400",
    barColor: "bg-zinc-300 dark:bg-zinc-700",
    barWidth: "w-1/4",
  },
} as const;

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-linear-to-r from-transparent to-zinc-200 dark:to-zinc-800" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-linear-to-l from-transparent to-zinc-200 dark:to-zinc-800" />
    </div>
  );
}

export default function TranscriptQualityCard({ report }: Props) {
  const { clipability, strongestSignals, weaknesses, summary, creatorFit } = report;
  const config = CLIPABILITY_CONFIG[clipability];

  return (
    <div className="mt-8 w-full max-w-2xl animate-[fade-in_0.35s_ease_forwards]">
      <SectionDivider label="Content Intelligence" />

      <div className="rounded-xl border border-zinc-200 bg-white px-7 py-6 dark:border-zinc-800/60 dark:bg-[#0a0a0a] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.03)]">

        {/* Clipability header */}
        <div className="mb-5">
          <p className={`text-[17px] font-semibold tracking-tight ${config.labelColor}`}>
            {config.label}
          </p>
          <p className="mt-0.5 text-[12px] text-zinc-400 dark:text-zinc-500">
            {config.sublabel}
          </p>
          {/* Slim presence bar */}
          <div className="mt-3 h-px w-full bg-zinc-100 dark:bg-zinc-800/80">
            <div className={`h-px transition-all duration-700 ${config.barColor} ${config.barWidth}`} />
          </div>
        </div>

        {/* Summary — the most important element */}
        <p className="mb-5 text-[14px] leading-[1.7] text-zinc-600 dark:text-zinc-300">
          {summary}
        </p>

        {/* Strongest signals */}
        {strongestSignals.length > 0 && (
          <div className="mb-5">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Strongest signals
            </p>
            <div className="flex flex-wrap gap-1.5">
              {strongestSignals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weakness — only for medium/low, honest */}
        {weaknesses.length > 0 && (
          <p className="mb-5 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
            ↳ {weaknesses[0]}
          </p>
        )}

        {/* Platform fit */}
        {creatorFit.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Best fit:</span>
            {creatorFit.map((platform) => (
              <span
                key={platform}
                className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-500 dark:border-zinc-700/60 dark:text-zinc-400"
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
