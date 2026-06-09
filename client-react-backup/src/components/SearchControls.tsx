import { PlaceType, PLACE_TYPE_EMOJIS, PLACE_TYPE_LABELS } from "@shared/types";
import { useSearchSettings } from "../store/tripStore";

const PLACE_TYPES = Object.keys(PLACE_TYPE_EMOJIS) as PlaceType[];

interface Props {
  defaultPlaceType: PlaceType;
  onSearch: () => void;
  canSearch: boolean;
  isSearching: boolean;
}

export default function SearchControls({
  defaultPlaceType,
  onSearch,
  canSearch,
  isSearching,
}: Props) {
  const { placeType, radiusKm, setPlaceType, setRadiusKm } = useSearchSettings();
  const effectiveType = placeType ?? defaultPlaceType;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Place type selector */}
      <div>
        <label
          style={{
            display: "block",
            fontWeight: 700,
            fontSize: "0.8rem",
            color: "var(--muted)",
            letterSpacing: "0.05em",
            marginBottom: "0.5rem",
          }}
        >
          PLACE TYPE
        </label>
        <select
          value={effectiveType}
          onChange={(e) => setPlaceType(e.target.value as PlaceType)}
          style={{
            width: "100%",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xs)",
            color: "var(--text)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "0.9rem",
            padding: "0.6rem 0.75rem",
            outline: "none",
            cursor: "pointer",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.75rem center",
            paddingRight: "2.5rem",
          }}
        >
          {PLACE_TYPES.map((type) => (
            <option key={type} value={type} style={{ background: "#0d0d1f" }}>
              {PLACE_TYPE_EMOJIS[type]} {PLACE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {/* Radius slider */}
      <div>
        <label
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 700,
            fontSize: "0.8rem",
            color: "var(--muted)",
            letterSpacing: "0.05em",
            marginBottom: "0.5rem",
          }}
        >
          <span>SEARCH RADIUS</span>
          <span style={{ color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
            {radiusKm} km
          </span>
        </label>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={radiusKm}
          onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
          style={{
            width: "100%",
            accentColor: "var(--accent)",
            cursor: "pointer",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.7rem",
            color: "var(--muted)",
            marginTop: "0.2rem",
          }}
        >
          <span>1 km</span>
          <span>20 km</span>
        </div>
      </div>

      {/* Search button */}
      <div style={{ position: "relative" }}>
        <button
          className="btn-primary"
          onClick={onSearch}
          disabled={!canSearch || isSearching}
          style={{
            width: "100%",
            justifyContent: "center",
            fontSize: "0.95rem",
          }}
          title={!canSearch ? "Add at least 2 friends first" : undefined}
        >
          {isSearching ? (
            <>
              <div className="spinner" style={{ borderTopColor: "rgba(0,0,0,0.5)" }} />
              Searching…
            </>
          ) : (
            <>🔍 Find Places</>
          )}
        </button>
        {!canSearch && (
          <div
            style={{
              marginTop: "0.5rem",
              fontSize: "0.75rem",
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            Add at least 2 friends to search
          </div>
        )}
      </div>
    </div>
  );
}
