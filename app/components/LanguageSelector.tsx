"use client";

import type { OutputLanguageId } from "../lib/languages/types";
import { OUTPUT_LANGUAGES } from "../lib/languages/options";

interface Props {
  selectedId: OutputLanguageId;
  onChange: (id: OutputLanguageId) => void;
}

const PILL_BASE =
  "cursor-pointer rounded-full border px-3 py-1 text-[11px] transition-all";
const PILL_IDLE =
  "border-zinc-200 bg-transparent text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-300";
const PILL_ACTIVE =
  "border-zinc-400 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

export default function LanguageSelector({ selectedId, onChange }: Props) {
  return (
    <div className="mt-4">
      <span className="mb-2.5 block text-[11px] text-zinc-400 dark:text-zinc-600">
        Write in
      </span>
      <div className="flex flex-wrap gap-2">
        {OUTPUT_LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => onChange(lang.id)}
            title={lang.id === "auto" ? "Keep output in the same language as the transcript" : undefined}
            className={`${PILL_BASE} ${selectedId === lang.id ? PILL_ACTIVE : PILL_IDLE}`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
