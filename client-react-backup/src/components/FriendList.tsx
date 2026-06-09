import { motion, AnimatePresence } from "framer-motion";
import { Friend } from "@shared/types";

interface Props {
  friends: Friend[];
  onRemove: (id: string) => void;
  removingId: string | null;
}

export default function FriendList({ friends, onRemove, removingId }: Props) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--muted)" }}>
          FRIENDS ({friends.length})
        </span>
      </div>

      {friends.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "2rem 1rem",
            color: "var(--muted)",
            fontSize: "0.9rem",
            background: "var(--surface)",
            borderRadius: "var(--radius-sm)",
            border: "1px dashed var(--border)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</div>
          <div>No friends yet. Share the trip code!</div>
        </div>
      )}

      <AnimatePresence>
        {friends.map((friend) => (
          <motion.div
            key={friend.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 0.75rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xs)",
              marginBottom: "0.5rem",
              opacity: removingId === friend.id ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: friend.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "0.875rem",
                color: "#fff",
                flexShrink: 0,
                boxShadow: `0 0 8px ${friend.color}40`,
              }}
            >
              {friend.name[0].toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {friend.name}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {friend.address}
              </div>
            </div>

            {/* Remove button */}
            <button
              onClick={() => onRemove(friend.id)}
              disabled={removingId === friend.id}
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "transparent",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.875rem",
                flexShrink: 0,
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,107,107,0.15)";
                e.currentTarget.style.color = "#ff6b6b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--muted)";
              }}
              title="Remove"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
