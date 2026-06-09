import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

export interface GeoResult {
  lat: number;
  lng: number;
  display_name: string;
}

export function useGeocoder() {
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(query: string) {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/geocode?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("Failed");
      const results: GeoResult[] = await res.json();
      setSuggestions(results.slice(0, 5));
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setSuggestions([]);
  }

  return { suggestions, loading, search, clear };
}
