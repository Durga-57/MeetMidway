import { create } from "zustand";
import { Trip, Friend, ScoredPlace, PlaceType } from "@shared/types";

interface Midpoint {
  lat: number;
  lng: number;
}

interface TripState {
  trip: Trip | null;
  places: ScoredPlace[];
  midpoint: Midpoint | null;
  selectedPlaceId: number | null;
  isSearching: boolean;
  searchError: string | null;

  setTrip: (trip: Trip) => void;
  updateFriends: (friends: Friend[]) => void;
  removeFriendLocally: (friendId: string) => void;
  setPlaces: (places: ScoredPlace[], midpoint: Midpoint) => void;
  setSelectedPlace: (id: number | null) => void;
  setIsSearching: (v: boolean) => void;
  setSearchError: (err: string | null) => void;
  reset: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  trip: null,
  places: [],
  midpoint: null,
  selectedPlaceId: null,
  isSearching: false,
  searchError: null,

  setTrip: (trip) => set({ trip }),
  updateFriends: (friends) =>
    set((s) => (s.trip ? { trip: { ...s.trip, friends } } : {})),
  removeFriendLocally: (friendId) =>
    set((s) =>
      s.trip
        ? { trip: { ...s.trip, friends: s.trip.friends.filter((f) => f.id !== friendId) } }
        : {}
    ),
  setPlaces: (places, midpoint) => set({ places, midpoint, selectedPlaceId: null }),
  setSelectedPlace: (id) => set({ selectedPlaceId: id }),
  setIsSearching: (v) => set({ isSearching: v }),
  setSearchError: (err) => set({ searchError: err }),
  reset: () =>
    set({
      trip: null,
      places: [],
      midpoint: null,
      selectedPlaceId: null,
      isSearching: false,
      searchError: null,
    }),
}));

// Search settings separate store
interface SearchSettingsState {
  placeType: PlaceType | null;
  radiusKm: number;
  setPlaceType: (t: PlaceType) => void;
  setRadiusKm: (r: number) => void;
}

export const useSearchSettings = create<SearchSettingsState>((set) => ({
  placeType: null,
  radiusKm: 5,
  setPlaceType: (t) => set({ placeType: t }),
  setRadiusKm: (r) => set({ radiusKm: r }),
}));
