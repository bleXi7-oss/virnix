"use client";

import { Component, type ReactNode } from "react";

// ─── ErrorFallback ────────────────────────────────────────────────────────────
// Calm, minimal fallback shown when a component subtree crashes.
// Deliberately non-technical — no error codes, no stack traces.

export function ErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="mt-8 w-full max-w-2xl">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Something went wrong.
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          An unexpected error occurred here. Your work is safe — try again or refresh the page.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 cursor-pointer text-[12px] font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Try again
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ErrorBoundary ────────────────────────────────────────────────────────────
// Wraps any subtree and catches render errors before they bubble up.
// Use around sections that render user-generated or AI-generated content.
//
// Usage:
//   <ErrorBoundary>
//     <OutputPanel ... />
//   </ErrorBoundary>

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[virnix] UI error caught by boundary:", error.message);
    // Future: track("generation_failed", { error: error.message })
    // Future: Sentry.captureException(error)
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
