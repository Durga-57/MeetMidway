// Client-side Overpass utility (for type/tag info only, actual queries run on server)
import { PlaceType, PLACE_TYPE_EMOJIS } from "@shared/types";

export function getPlaceEmoji(type: PlaceType): string {
  return PLACE_TYPE_EMOJIS[type] || "📍";
}
