"use client";

// Root layout error boundary — Next.js renders this only when the root layout
// itself crashes (extremely rare). Must include <html> and <body> since it
// replaces the entire document when active.

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html>
      <body style={{ margin: 0, background: "#000" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 1rem",
            fontFamily: "system-ui, sans-serif",
            color: "#fff",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "#52525b",
              marginBottom: 40,
            }}
          >
            VIRNIX
          </p>

          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Something went wrong.
          </h1>

          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#71717a",
              marginBottom: 40,
              maxWidth: 360,
              textAlign: "center",
            }}
          >
            An unexpected error occurred. Reload the page to continue.
          </p>

          <button
            onClick={reset}
            style={{
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: 12,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
