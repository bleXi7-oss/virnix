"use client";

import type { TimelineMoment } from "../../lib/timeline/types";
import ClipMomentCard from "./ClipMomentCard";

interface Props {
  moments: TimelineMoment[];
}

export default function ClipGuide({ moments }: Props) {
  if (!moments || moments.length === 0) return null;

  const top3 = moments.slice(0, 3);

  return (
    <div className="mt-8 w-full max-w-2xl animate-[fade-in_0.4s_ease_forwards]">
      {/* Section header */}
      <div className="mb-5 flex items-center gap-4">
        <div className="h-px flex-1 bg-linear-to-r from-transparent to-zinc-200 dark:to-zinc-800" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-600">
          Best moments to clip
        </span>
        <div className="h-px flex-1 bg-linear-to-l from-transparent to-zinc-200 dark:to-zinc-800" />
      </div>

      {/* Moment cards */}
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-[#0a0a0a]">
        {top3.map((moment, i) => (
          <div key={moment.id}>
            {i > 0 && (
              <div className="my-5 h-px bg-zinc-100 dark:bg-zinc-800/60" />
            )}
            <ClipMomentCard moment={moment} rank={i} />
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
        {moments.length} moment{moments.length !== 1 ? "s" : ""} detected · ranked by psychological impact
      </p>
    </div>
  );
}
