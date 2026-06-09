import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  code: string;
}

export default function TripCodeBadge({ code }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  const joinUrl = `${window.location.origin}/join/${code}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div
      style={{
        background: "var(--gradient-subtle)",
        border: "1px solid rgba(0,245,200,0.2)",
        borderRadius: "var(--radius-sm)",
        padding: "0.875rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, marginBottom: "0.2rem", letterSpacing: "0.08em" }}>
          TRIP CODE
        </div>
        <div style={{ fontWeight: 900, fontSize: "1.4rem", letterSpacing: "0.2em", color: "var(--accent)" }}>
          {code}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={copy}
          title="Copy code"
          style={{
            background: "rgba(0,245,200,0.1)",
            border: "1px solid rgba(0,245,200,0.2)",
            borderRadius: "var(--radius-xs)",
            color: "var(--accent)",
            padding: "0.4rem 0.6rem",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 600,
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(0,245,200,0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(0,245,200,0.1)")
          }
        >
          {copied ? "✓" : "Copy"}
        </button>

        <button
          onClick={copyLink}
          title="Copy invite link"
          style={{
            background: "rgba(0,245,200,0.1)",
            border: "1px solid rgba(0,245,200,0.2)",
            borderRadius: "var(--radius-xs)",
            color: "var(--accent)",
            padding: "0.4rem 0.6rem",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 600,
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(0,245,200,0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(0,245,200,0.1)")
          }
        >
          🔗 Link
        </button>
      </div>
    </div>
  );
}
