"use client";

// Page-level error boundary — Next.js renders this automatically when an
// unhandled error escapes the page component tree. Lives inside the root
// layout so dark/light mode and global styles are preserved.
//
// For root layout crashes (very rare), see global-error.tsx.

export default function PageError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-white dark:bg-black">
      <div className="w-full max-w-md text-center">
        <p className="mb-10 text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-600">
          VIRNIX
        </p>

        <h1 className="mb-3 text-xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-white">
          Something went wrong.
        </h1>

        <p className="mb-10 text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          An unexpected error occurred. Hit the button below to reload and
          continue — your content is safe.
        </p>

        <button
          onClick={reset}
          className="cursor-pointer rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-zinc-50"
        >
          Reload page
        </button>

        <p className="mt-6 text-[11px] text-zinc-400 dark:text-zinc-700">
          If this keeps happening, try refreshing your browser.
        </p>
      </div>
    </div>
  );
}
