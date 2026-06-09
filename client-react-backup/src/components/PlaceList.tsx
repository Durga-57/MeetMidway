import { ScoredPlace, Friend } from "@shared/types";
import PlaceCard from "./PlaceCard";
import { useTripStore } from "../store/tripStore";

interface Props {
  places: ScoredPlace[];
  friends: Friend[];
  isSearching: boolean;
  searchError: string | null;
  onRetry: () => void;
}

export default function PlaceList({ places, friends, isSearching, searchError, onRetry }: Props) {
  const { selectedPlaceId, setSelectedPlace } = useTripStore();

  if (isSearching) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "2.5rem 1rem",
          gap: "1rem",
          color: "var(--muted)",
        }}
      >
        <div className="spinner" style={{ width: "28px", height: "28px" }} />
        <span style={{ fontSize: "0.9rem" }}>Finding places…</span>
      </div>
    );
  }

  if (searchError) {
    return (
      <div
        style={{
          background: "rgba(255,107,107,0.08)",
          border: "1px solid rgba(255,107,107,0.2)",
          borderRadius: "var(--radius-sm)",
          padding: "1.25rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⚠️</div>
        <div style={{ color: "#ff6b6b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {searchError}
        </div>
        <button className="btn-secondary" onClick={onRetry} style={{ fontSize: "0.85rem", padding: "0.5rem 1.25rem" }}>
          Retry
        </button>
      </div>
    );
  }

  if (places.length === 0) return null;

  return (
    <div>
      <div
        style={{
          fontWeight: 700,
          fontSize: "0.875rem",
          color: "var(--muted)",
          marginBottom: "0.75rem",
        }}
      >
        TOP RESULTS ({places.length})
      </div>
      {places.map((place, i) => (
        <PlaceCard
          key={place.id}
          place={place}
          rank={i}
          friends={friends}
          isSelected={selectedPlaceId === place.id}
          onSelect={() =>
            setSelectedPlace(selectedPlaceId === place.id ? null : place.id)
          }
        />
      ))}
    </div>
  );
}
