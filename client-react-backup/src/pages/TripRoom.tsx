import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSocket } from "../hooks/useSocket";
import { useTrip } from "../hooks/useTrip";
import { useGeocoder } from "../hooks/useGeocoder";
import { useTripStore, useSearchSettings } from "../store/tripStore";
import Map from "../components/Map";
import FriendList from "../components/FriendList";
import PlaceList from "../components/PlaceList";
import SearchControls from "../components/SearchControls";
import TripCodeBadge from "../components/TripCodeBadge";
import { PlaceType } from "@shared/types";

export default function TripRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { fetchTrip, addFriend, removeFriend, searchPlaces, error: apiError } = useTrip();

  const {
    trip,
    places,
    midpoint,
    selectedPlaceId,
    isSearching,
    searchError,
    setTrip,
    setIsSearching,
    setSearchError,
    setPlaces,
    reset,
  } = useTripStore();

  const { placeType: searchPlaceType, radiusKm } = useSearchSettings();

  // Socket real-time
  useSocket(code);

  // Add friend form state
  const [addName, setAddName] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Geocoder for add friend
  const { suggestions, loading: geoLoading, search: geoSearch, clear } = useGeocoder();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch (socket will overwrite with live state)
  useEffect(() => {
    if (!code) return;
    reset();
    fetchTrip(code.toUpperCase()).then((t) => {
      if (!t) setNotFound(true);
      else setTrip(t);
    });
  }, [code]);

  // Click outside suggestions
  useEffect(() => {
    function h(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleAddressInput(val: string) {
    setAddAddress(val);
    setAddError("");
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

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!code || !addName.trim() || !addAddress.trim()) return;
    setAddLoading(true);
    setAddError("");

    const result = await addFriend(code.toUpperCase(), addName.trim(), addAddress.trim());
    setAddLoading(false);

    if (result) {
      setAddName("");
      setAddAddress("");
      clear();
      setShowSuggestions(false);
      setShowAddForm(false);
      // trip state comes via socket
    } else if (apiError) {
      setAddError(apiError);
    }
  }

  async function handleRemoveFriend(friendId: string) {
    if (!code) return;
    setRemovingId(friendId);
    await removeFriend(code.toUpperCase(), friendId);
    setRemovingId(null);
  }

  async function handleSearch() {
    if (!code || !trip || trip.friends.length < 2) return;
    setIsSearching(true);
    setSearchError(null);
    const type: PlaceType = searchPlaceType ?? trip.placeType;
    const result = await searchPlaces(code.toUpperCase(), type, radiusKm);
    setIsSearching(false);
    if (!result) {
      setSearchError(apiError || "Search failed. Try again.");
    } else if (result.places.length === 0) {
      setSearchError(`No ${type} found within ${radiusKm}km. Try increasing the radius.`);
      setPlaces([], result.midpoint);
    } else {
      // Also set from API response in case socket event hasn't fired yet
      setPlaces(result.places, result.midpoint);
    }
  }

  // ── Not found ──
  if (notFound) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>😕</div>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.5rem" }}>
          Trip Not Found
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
          This trip may have expired or never existed.
        </p>
        <Link to="/create" className="btn-primary">
          Create New Trip
        </Link>
      </div>
    );
  }

  // ── Loading ──
  if (!trip) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
          color: "var(--muted)",
        }}
      >
        <div className="spinner" style={{ width: "32px", height: "32px" }} />
        <span>Loading trip…</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,26,0.9)",
          backdropFilter: "blur(10px)",
          gap: "0.75rem",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            textDecoration: "none",
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>📍</span>
          <span className="gradient-text" style={{ fontWeight: 900, fontSize: "1rem" }}>
            MeetMidway
          </span>
        </Link>
        <span style={{ color: "var(--border)", fontSize: "1.2rem" }}>·</span>
        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>
          {trip.name}
        </span>
        <div style={{ flex: 1 }} />
        <div
          style={{
            background: "rgba(0,245,200,0.1)",
            border: "1px solid rgba(0,245,200,0.2)",
            borderRadius: "100px",
            padding: "0.25rem 0.75rem",
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "var(--accent)",
          }}
        >
          {code}
        </div>
      </div>

      {/* Main layout */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Left Panel */}
        <div
          style={{
            width: "320px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--border)",
            overflowY: "auto",
            background: "rgba(10,10,26,0.6)",
          }}
        >
          <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Code badge */}
            <TripCodeBadge code={trip.code} />

            {/* Friends */}
            <div>
              <FriendList
                friends={trip.friends}
                onRemove={handleRemoveFriend}
                removingId={removingId}
              />

              {/* Add friend toggle */}
              <button
                onClick={() => setShowAddForm((v) => !v)}
                style={{
                  width: "100%",
                  marginTop: "0.625rem",
                  background: showAddForm ? "var(--surface)" : "transparent",
                  border: "1px dashed var(--border)",
                  borderRadius: "var(--radius-xs)",
                  color: "var(--muted)",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  padding: "0.5rem",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--muted)";
                }}
              >
                {showAddForm ? "✕ Cancel" : "+ Add yourself"}
              </button>

              {/* Add friend form */}
              {showAddForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddFriend}
                  style={{
                    marginTop: "0.625rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.625rem",
                  }}
                >
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Your name"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    maxLength={40}
                    style={{ fontSize: "0.875rem", padding: "0.6rem 0.75rem" }}
                    required
                  />

                  <div style={{ position: "relative" }} ref={suggestRef}>
                    <input
                      type="text"
                      className={`input-field${addError ? " error" : ""}`}
                      placeholder="Your address"
                      value={addAddress}
                      onChange={(e) => handleAddressInput(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      style={{ fontSize: "0.875rem", padding: "0.6rem 0.75rem", paddingRight: geoLoading ? "2rem" : "0.75rem" }}
                      autoComplete="off"
                      required
                    />
                    {geoLoading && (
                      <div style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)" }}>
                        <div className="spinner" style={{ width: "14px", height: "14px" }} />
                      </div>
                    )}
                    {showSuggestions && suggestions.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 300,
                          background: "rgba(12,12,28,0.98)",
                          border: "1px solid var(--border-hover)",
                          borderRadius: "var(--radius-xs)",
                          marginTop: "0.2rem",
                          overflow: "hidden",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setAddAddress(s.display_name);
                              setShowSuggestions(false);
                              clear();
                            }}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "0.6rem 0.75rem",
                              background: "transparent",
                              border: "none",
                              color: "var(--text)",
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: "0.78rem",
                              textAlign: "left",
                              cursor: "pointer",
                              borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                              transition: "background 0.15s",
                              lineHeight: 1.4,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            📍 {s.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {addError && (
                    <p style={{ color: "#ff6b6b", fontSize: "0.75rem" }}>{addError}</p>
                  )}

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={addLoading}
                    style={{ fontSize: "0.875rem", padding: "0.6rem", justifyContent: "center" }}
                  >
                    {addLoading ? (
                      <>
                        <div className="spinner" style={{ width: "14px", height: "14px" }} />
                        Adding…
                      </>
                    ) : (
                      "Add Me"
                    )}
                  </button>
                </motion.form>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "var(--border)" }} />

            {/* Search */}
            <SearchControls
              defaultPlaceType={trip.placeType}
              onSearch={handleSearch}
              canSearch={trip.friends.length >= 2}
              isSearching={isSearching}
            />

            {/* Results */}
            {(places.length > 0 || isSearching || searchError) && (
              <>
                <div style={{ height: "1px", background: "var(--border)" }} />
                <PlaceList
                  places={places}
                  friends={trip.friends}
                  isSearching={isSearching}
                  searchError={searchError}
                  onRetry={handleSearch}
                />
              </>
            )}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Midpoint info badge */}
          {midpoint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: "absolute",
                top: "1rem",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 400,
                background: "rgba(10,10,26,0.9)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0,245,200,0.3)",
                borderRadius: "100px",
                padding: "0.4rem 1rem",
                fontSize: "0.8rem",
                color: "var(--accent)",
                fontWeight: 600,
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              📍 Midpoint: {midpoint.lat.toFixed(4)}, {midpoint.lng.toFixed(4)}
            </motion.div>
          )}

          <Map
            friends={trip.friends}
            places={places}
            midpoint={midpoint}
            selectedPlaceId={selectedPlaceId}
          />
        </div>
      </div>

      {/* Mobile map note */}
      <style>{`
        @media (max-width: 768px) {
          .trip-room-layout {
            flex-direction: column !important;
          }
          .trip-left-panel {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border);
            max-height: 60vh;
          }
          .trip-map {
            height: 40vh !important;
          }
        }
      `}</style>
    </div>
  );
}
