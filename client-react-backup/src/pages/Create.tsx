import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PlaceType, PLACE_TYPE_EMOJIS, PLACE_TYPE_LABELS } from "@shared/types";
import { useTrip } from "../hooks/useTrip";

const PLACE_TYPES = Object.keys(PLACE_TYPE_EMOJIS) as PlaceType[];

export default function Create() {
  const navigate = useNavigate();
  const { loading, error, createTrip } = useTrip();
  const [name, setName] = useState("");
  const [placeType, setPlaceType] = useState<PlaceType>("restaurant");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await createTrip(name.trim(), placeType);
    if (result) {
      navigate(`/trip/${result.code}`);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(0,120,255,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Back link */}
      <div style={{ position: "absolute", top: "2rem", left: "2rem" }}>
        <Link
          to="/"
          style={{
            color: "var(--muted)",
            textDecoration: "none",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          ← Back home
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: "520px", position: "relative" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🗺️</div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            Create a Trip
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1rem" }}>
            Choose a name and what kind of place you're looking for
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit}>
            {/* Trip name */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="trip-name"
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                  color: "var(--text)",
                }}
              >
                Trip Name
              </label>
              <input
                id="trip-name"
                type="text"
                className="input-field"
                placeholder="e.g. Friday Night Out, Team Lunch…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
              />
            </div>

            {/* Place type */}
            <div style={{ marginBottom: "2rem" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  marginBottom: "0.75rem",
                  color: "var(--text)",
                }}
              >
                Looking for…
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "0.625rem",
                }}
              >
                {PLACE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPlaceType(type)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.6rem 0.875rem",
                      borderRadius: "var(--radius-xs)",
                      border: `1px solid ${placeType === type ? "var(--accent)" : "var(--border)"}`,
                      background:
                        placeType === type
                          ? "rgba(0,245,200,0.1)"
                          : "var(--surface)",
                      color: placeType === type ? "var(--accent)" : "var(--muted)",
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: placeType === type ? 700 : 400,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>{PLACE_TYPE_EMOJIS[type]}</span>
                    <span>{PLACE_TYPE_LABELS[type]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "rgba(255,107,107,0.1)",
                  border: "1px solid rgba(255,107,107,0.3)",
                  borderRadius: "var(--radius-xs)",
                  padding: "0.75rem 1rem",
                  color: "#ff6b6b",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !name.trim()}
              style={{ width: "100%", justifyContent: "center", fontSize: "1rem" }}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Creating…
                </>
              ) : (
                <>✨ Create Trip</>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
