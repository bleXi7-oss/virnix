"use client";

import type { TranscriptWarning } from "../../lib/types/generation";

interface Props {
  warning: TranscriptWarning;
  disabled?: boolean;
  onTryEnglish: () => void;
  onContinue: () => void;
  onPaste: () => void;
}

export default function TranscriptWarningPanel({
  warning,
  disabled = false,
  onTryEnglish,
  onContinue,
  onPaste,
}: Props) {
  return (
    <div className="rounded-xl border border-amber-300/60 bg-amber-50/80 p-5 dark:border-amber-700/40 dark:bg-amber-950/20">
      {/* Icon + title */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-amber-500" aria-hidden="true">
          ⚠
        </span>
        <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-400">
          Caption language mismatch
        </p>
      </div>

      {/* Warning copy */}
      <p className="mb-4 text-[13px] leading-relaxed text-amber-900/80 dark:text-amber-300/80">
        {warning.warningCopy}
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {warning.hasEnglish && (
          <button
            onClick={onTryEnglish}
            disabled={disabled}
            className="w-full rounded-lg border border-amber-400/60 bg-white px-4 py-2.5 text-[13px] font-medium text-amber-800 transition hover:bg-amber-50 disabled:pointer-events-none disabled:opacity-50 dark:border-amber-700/50 dark:bg-zinc-900 dark:text-amber-300 dark:hover:bg-amber-950/30"
          >
            Try English captions instead
          </button>
        )}
        <button
          onClick={onContinue}
          disabled={disabled}
          className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-amber-600 disabled:pointer-events-none disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-500"
        >
          Continue with approximate translation
        </button>
        <button
          onClick={onPaste}
          disabled={disabled}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Paste correct transcript instead
        </button>
      </div>
    </div>
  );
}
