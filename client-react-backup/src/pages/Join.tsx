import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTrip } from "../hooks/useTrip";
import { useGeocoder } from "../hooks/useGeocoder";

export default function Join() {
  const { code: paramCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { loading, error: tripError, addFriend, fetchTrip } = useTrip();
  const { suggestions, loading: geoLoading, search: geoSearch, clear } = useGeocoder();

  const [code, setCode] = useState(paramCode?.toUpperCase() || "");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tripName, setTripName] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch trip name when code is pre-filled
  useEffect(() => {
    if (paramCode && paramCode.length === 6) {
      fetchTrip(paramCode.toUpperCase()).then((trip) => {
        if (trip) setTripName(trip.name);
      });
    }
  }, [paramCode]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleAddressChange(val: string) {
    setAddress(val);
    setAddressError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length >= 3) {
      debounceRef.current = setTimeout(() => {
        geoSearch(val);
        setShowSuggestions(true);
      }, 400);
    } else {
      clear();
      setShowSuggestions(false);
    }
  }

  function selectSuggestion(displayName: string) {
    setAddress(displayName);
    setShowSuggestions(false);
    clear();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !address.trim()) return;

    const result = await addFriend(code.trim().toUpperCase(), name.trim(), address.trim());
    if (result) {
      navigate(`/trip/${code.trim().toUpperCase()}`);
    } else if (tripError?.includes("Address")) {
      setAddressError("Address not found. Try being more specific.");
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
      {/* Glow */}
      <div
        style={{
          position: "fixed",
          top: "25%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(0,245,200,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

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
        style={{ width: "100%", maxWidth: "480px", position: "relative" }}
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🤝</div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            Join a Trip
          </h1>
          {tripName ? (
            <p style={{ color: "var(--accent)", fontSize: "1rem", fontWeight: 600 }}>
              "{tripName}"
            </p>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: "1rem" }}>
              Enter the trip code and your details
            </p>
          )}
        </div>

        <div className="glass-card" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit}>
            {/* Trip code */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="trip-code"
                style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}
              >
                Trip Code
              </label>
              <input
                id="trip-code"
                type="text"
                className="input-field"
                placeholder="e.g. AB12CD"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  textAlign: "center",
                }}
                required
              />
            </div>

            {/* Name */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                htmlFor="friend-name"
                style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}
              >
                Your Name
              </label>
              <input
                id="friend-name"
                type="text"
                className="input-field"
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                required
              />
            </div>

            {/* Address with autocomplete */}
            <div style={{ marginBottom: "1.5rem", position: "relative" }} ref={suggestionsRef}>
              <label
                htmlFor="friend-address"
                style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem" }}
              >
                Your Home Address
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="friend-address"
                  type="text"
                  className={`input-field${addressError ? " error" : ""}`}
                  placeholder="e.g. 123 Main St, New York, NY"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                  required
                />
                {geoLoading && (
                  <div
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <div className="spinner" style={{ width: "16px", height: "16px" }} />
                  </div>
                )}
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 200,
                    background: "rgba(12,12,28,0.98)",
                    border: "1px solid var(--border-hover)",
                    borderRadius: "var(--radius-xs)",
                    marginTop: "0.25rem",
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectSuggestion(s.display_name)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "0.75rem 1rem",
                        background: "transparent",
                        border: "none",
                        color: "var(--text)",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.85rem",
                        textAlign: "left",
                        cursor: "pointer",
                        borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                        transition: "background 0.15s",
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--surface-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      📍 {s.display_name}
                    </button>
                  ))}
                </div>
              )}

              {addressError && (
                <p style={{ color: "#ff6b6b", fontSize: "0.8rem", marginTop: "0.4rem" }}>
                  {addressError}
                </p>
              )}
            </div>

            {/* Error */}
            {tripError && !tripError.includes("Address") && (
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
                {tripError}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !code.trim() || !name.trim() || !address.trim()}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Joining…
                </>
              ) : (
                <>🚀 Join Trip</>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: "0.875rem",
            }}
          >
            Don't have a code?{" "}
            <Link to="/create" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
              Create a trip
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
