import { useState } from "react";
import { PlaceType, Trip, Friend, ScoredPlace } from "@shared/types";

const API = import.meta.env.VITE_API_URL || "";

export function useTrip() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTrip(
    name: string,
    placeType: PlaceType
  ): Promise<{ code: string; trip: Trip } | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, placeType }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return await res.json();
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function fetchTrip(code: string): Promise<Trip | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/trips/${code}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const { trip } = await res.json();
      return trip;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function addFriend(
    code: string,
    name: string,
    address: string
  ): Promise<{ friend: Friend; trip: Trip } | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/trips/${code}/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return await res.json();
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function removeFriend(
    code: string,
    friendId: string
  ): Promise<Trip | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/trips/${code}/friends/${friendId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { trip } = await res.json();
      return trip;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function searchPlaces(
    code: string,
    placeType: PlaceType,
    radiusKm: number
  ): Promise<{ places: ScoredPlace[]; midpoint: { lat: number; lng: number } } | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/trips/${code}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeType, radiusKm }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return await res.json();
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, createTrip, fetchTrip, addFriend, removeFriend, searchPlaces };
}
