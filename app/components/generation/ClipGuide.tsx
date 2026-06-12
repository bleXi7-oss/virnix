"use client";

import type { TimelineMoment } from "../../lib/timeline/types";
import ClipMomentCard from "./ClipMomentCard";

interface Props {
  moments: TimelineMoment[];
  transcriptLang?: string | null;
  outputLanguage?: string | null;
}

export default function ClipGuide({ moments, transcriptLang, outputLanguage }: Props) {
  if (!moments || moments.length === 0) return null;

  const top3 = moments.slice(0, 3);

  return (
    <div className="mt-8 w-full max-w-2xl animate-[fade-in_0.4s_ease_forwards]">
      {/* Section header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-linear-to-r from-transparent to-zinc-200 dark:to-zinc-800" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
          Strongest moments
        </span>
        <div className="h-px flex-1 bg-linear-to-l from-transparent to-zinc-200 dark:to-zinc-800" />
      </div>

      {/* Moment cards */}
      <div className="rounded-xl border border-zinc-200 bg-white px-7 py-6 dark:border-zinc-800/60 dark:bg-[#0a0a0a] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.03)]">
        {top3.map((moment, i) => (
          <div key={moment.id}>
            {i > 0 && (
              <div className="my-6 h-px bg-zinc-100 dark:bg-zinc-800/60" />
            )}
            <ClipMomentCard
              moment={moment}
              rank={i}
              transcriptLang={transcriptLang}
              outputLanguage={outputLanguage}
            />
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        {moments.length} moment{moments.length !== 1 ? "s" : ""} detected · ranked by psychological impact
      </p>
    </div>
  );
}
