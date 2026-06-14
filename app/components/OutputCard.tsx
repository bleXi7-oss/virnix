"use client";

import { memo } from "react";
import type { OutputCardData, IconType } from "../lib/outputCards";
import CopyButton from "./CopyButton";

function PlatformIcon({ type }: { type: IconType }) {
  if (type === "x") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-white">
        𝕏
      </div>
    );
  }
  if (type === "linkedin") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#0077b5] text-[10px] font-bold text-white">
        in
      </div>
    );
  }
  if (type === "tiktok") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-pink-500 to-orange-400">
        <span className="text-[8px] font-bold text-white">▶</span>
      </div>
    );
  }
  if (type === "instagram") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-purple-500 to-pink-500">
        <span className="text-[9px] font-bold text-white">▣</span>
      </div>
    );
  }
  if (type === "youtube") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#FF0000]">
        <span className="text-[8px] font-bold text-white">▶</span>
      </div>
    );
  }
  return null;
}

function OutputCard({
  card,
  index,
}: {
  card: OutputCardData;
  index: number;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.05)] opacity-0 animate-[fade-in-up_0.45s_ease_forwards] transition-[border-color,box-shadow] duration-200 hover:border-zinc-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-zinc-800/60 dark:bg-[#0a0a0a] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.02)] dark:hover:border-zinc-700/80 dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_32px_rgba(0,0,0,0.5)]${card.wide ? " sm:col-span-2 lg:col-span-2" : ""}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            {card.platform}
          </span>
          <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
            {card.type}
          </span>
        </div>
        <span className="mt-0.5 shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80">
          {card.badge}
        </span>
      </div>

      <p className="flex-1 whitespace-pre-line text-[13px] leading-[1.65] text-zinc-600 dark:text-zinc-300">
        {card.content}
      </p>

      <div className="mt-5 flex items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/40">
        <PlatformIcon type={card.iconType} />
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          {card.charCount}
        </span>
        <div className="ml-auto">
          <CopyButton text={card.content} platform={card.platform} />
        </div>
      </div>
    </div>
  );
}

export default memo(OutputCard);
