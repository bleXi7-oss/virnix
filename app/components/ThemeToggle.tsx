"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

const _subs = new Set<() => void>();

function _subscribe(cb: () => void) {
  _subs.add(cb);
  return () => { _subs.delete(cb); };
}

function _getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function _getServerSnapshot(): Theme {
  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try { localStorage.setItem("theme", theme); } catch { /* ignore */ }
  _subs.forEach((cb) => cb());
}

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(_subscribe, _getSnapshot, _getServerSnapshot);
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => applyTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-500 transition-all hover:border-zinc-300 hover:bg-zinc-200 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
