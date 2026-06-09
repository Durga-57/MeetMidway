export type PlaceType =
  | "restaurant"
  | "cafe"
  | "movie_theater"
  | "park"
  | "bar"
  | "shopping_mall"
  | "museum"
  | "bowling_alley";

export interface Friend {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  color: string;
  joinedAt: number;
}

export interface Trip {
  code: string;
  name: string;
  placeType: PlaceType;
  friends: Friend[];
  createdAt: number;
  expiresAt: number;
}

export interface ScoredPlace {
  id: number;
  name: string;
  lat: number;
  lng: number;
  placeType: PlaceType;
  tags: Record<string, string>;
  distances: number[];
  avg: number;
  maxD: number;
  minD: number;
  fairnessScore: number;
}

export interface Midpoint {
  lat: number;
  lng: number;
}

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  movie_theater: "Movie Theater",
  park: "Park",
  bar: "Bar",
  shopping_mall: "Shopping Mall",
  museum: "Museum",
  bowling_alley: "Bowling Alley",
};

export const PLACE_TYPE_EMOJIS: Record<PlaceType, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  movie_theater: "🎬",
  park: "🌳",
  bar: "🍺",
  shopping_mall: "🛍️",
  museum: "🏛️",
  bowling_alley: "🎳",
};

export const FRIEND_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
  "#A8E6CF",
  "#FF8B94",
  "#6C5CE7",
  "#FFA552",
  "#74B9FF",
];
