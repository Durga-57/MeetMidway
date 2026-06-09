import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScoredPlace, Friend, PLACE_TYPE_EMOJIS } from "@shared/types";
import { formatDistance } from "../utils/geo";

interface Props {
  place: ScoredPlace;
  rank: number;
  friends: Friend[];
  isSelected: boolean;
  onSelect: () => void;
}

function FairnessLabel({ score }: { score: number }) {
  if (score >= 80)
    return (
      <span className="fairness-badge fairness-high">
        {score.toFixed(0)}% Fair
      </span>
    );
  if (score >= 50)
    return (
      <span className="fairness-badge fairness-mid">
        {score.toFixed(0)}% Fair
      </span>
    );
  return (
    <span className="fairness-badge fairness-low">
      {score.toFixed(0)}% Fair
    </span>
  );
}

export default function PlaceCard({ place, rank, friends, isSelected, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const emoji = PLACE_TYPE_EMOJIS[place.placeType] || "📍";

  return (
    <motion.div
      layout
      className="stagger-item"
      style={{ animationDelay: `${rank * 0.07}s` }}
      onClick={onSelect}
    >
      <div
        style={{
          background: isSelected
            ? "rgba(0,245,200,0.07)"
            : "var(--surface)",
          border: `1px solid ${isSelected ? "rgba(0,245,200,0.3)" : "var(--border)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "0.875rem",
          marginBottom: "0.5rem",
          cursor: "pointer",
          transition: "border-color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            (e.currentTarget as HTMLDivElement).style.borderColor =
              "rgba(255,255,255,0.15)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            (e.currentTarget as HTMLDivElement).style.borderColor =
              "var(--border)";
          }
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
          {/* Rank + emoji */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-xs)",
              background: "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            {emoji}
          </div>

          {/* Name + badges */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "160px",
                }}
              >
                {place.name}
              </span>
              <FairnessLabel score={place.fairnessScore} />
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>
              avg {formatDistance(place.avg)} · max {formatDistance(place.maxD)}
            </div>
          </div>

          {/* Rank badge */}
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background:
                rank === 0
                  ? "var(--gradient)"
                  : "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: rank === 0 ? "#000" : "var(--muted)",
              flexShrink: 0,
            }}
          >
            #{rank + 1}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--muted)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.75rem",
            cursor: "pointer",
            marginTop: "0.5rem",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {expanded ? "▴" : "▾"} Distance breakdown
        </button>

        {/* Expanded distances */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {friends.map((friend, idx) => {
                  const dist = place.distances[idx];
                  const pct = dist / place.maxD;
                  return (
                    <div key={friend.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: friend.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 900,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {friend.name[0]}
                      </div>
                      <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}>
                        <div
                          style={{
                            width: `${pct * 100}%`,
                            height: "100%",
                            background: friend.color,
                            borderRadius: "2px",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "var(--muted)", flexShrink: 0, width: "40px", textAlign: "right" }}>
                        {formatDistance(dist)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
