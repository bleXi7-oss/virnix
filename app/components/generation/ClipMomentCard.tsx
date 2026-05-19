"use client";

import type { TimelineMoment, MomentType, PlatformFit } from "../../lib/timeline/types";

const TYPE_META: Record<MomentType, { label: string; accent: string; badgeColor: string }> = {
  validation_hook: {
    label: "Validation Hook",
    accent: "border-amber-300/60 dark:border-amber-600/40",
    badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-500",
  },
  mechanism_reframe: {
    label: "Reframe",
    accent: "border-violet-300/60 dark:border-violet-600/40",
    badgeColor: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  },
  emotional_confession: {
    label: "Confession",
    accent: "border-rose-300/60 dark:border-rose-600/40",
    badgeColor: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  },
  contrarian_insight: {
    label: "Contrarian Take",
    accent: "border-sky-300/60 dark:border-sky-600/40",
    badgeColor: "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400",
  },
  transformation_moment: {
    label: "Transformation",
    accent: "border-emerald-300/60 dark:border-emerald-600/40",
    badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  educational_gem: {
    label: "Key Insight",
    accent: "border-cyan-300/60 dark:border-cyan-600/40",
    badgeColor: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
  },
  story_turning_point: {
    label: "Story Turn",
    accent: "border-zinc-300 dark:border-zinc-700/60",
    badgeColor: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400",
  },
  quote_moment: {
    label: "Quotable",
    accent: "border-zinc-300 dark:border-zinc-700/60",
    badgeColor: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400",
  },
  fomo_loss_frame: {
    label: "Loss Frame",
    accent: "border-orange-300/60 dark:border-orange-600/40",
    badgeColor: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  },
  authority_proof: {
    label: "Social Proof",
    accent: "border-zinc-300 dark:border-zinc-700/60",
    badgeColor: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400",
  },
};

const PLATFORM_LABELS: Record<PlatformFit, string> = {
  tiktok: "TikTok",
  reels: "Reels",
  shorts: "Shorts",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  youtube: "YouTube",
};

function ConfidenceDot({ score }: { score: number }) {
  const level = score >= 70 ? "strong" : score >= 40 ? "good" : "possible";
  const color =
    level === "strong"
      ? "bg-emerald-500"
      : level === "good"
        ? "bg-amber-400"
        : "bg-zinc-400 dark:bg-zinc-600";
  const label = level === "strong" ? "Strong match" : level === "good" ? "Good match" : "Possible";
  return (
    <span
      className="flex items-center gap-1"
      title={`${score}/100 confidence`}
      aria-label={label}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{label}</span>
    </span>
  );
}

interface Props {
  moment: TimelineMoment;
  rank: number;
}

export default function ClipMomentCard({ moment, rank }: Props) {
  const meta = TYPE_META[moment.momentType] ?? TYPE_META.educational_gem;

  return (
    <div
      className={`border-l-2 pl-5 opacity-0 animate-[fade-in-up_0.45s_ease_forwards] ${meta.accent}`}
      style={{ animationDelay: `${rank * 120}ms` }}
    >
      {/* Meta row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
          {moment.startTime}–{moment.endTime}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badgeColor}`}
        >
          {meta.label}
        </span>
        <ConfidenceDot score={moment.confidenceScore} />
      </div>

      {/* Hook — the most important line */}
      <p className="mb-2.5 text-[14px] font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
        &ldquo;{moment.suggestedHook}&rdquo;
      </p>

      {/* Why it works */}
      <p className="mb-3.5 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-500">
        {moment.whyItWorks}
      </p>

      {/* Platform tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {moment.platformFit.slice(0, 3).map((p) => (
          <span
            key={p}
            className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-600"
          >
            {PLATFORM_LABELS[p] ?? p}
          </span>
        ))}
      </div>

      {moment.sourceTextPreview && (
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-700 line-clamp-2">
          &ldquo;{moment.sourceTextPreview}&rdquo;
        </p>
      )}
    </div>
  );
}
