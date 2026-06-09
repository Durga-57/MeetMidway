"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchNearbyPlaces = fetchNearbyPlaces;
const OSM_TAGS = {
    restaurant: { key: "amenity", value: "restaurant" },
    cafe: { key: "amenity", value: "cafe" },
    movie_theater: { key: "amenity", value: "cinema" },
    park: { key: "leisure", value: "park" },
    bar: { key: "amenity", value: "bar" },
    shopping_mall: { key: "shop", value: "mall" },
    museum: { key: "tourism", value: "museum" },
    bowling_alley: { key: "leisure", value: "bowling_alley" },
};
async function fetchNearbyPlaces(lat, lng, radiusKm, placeType) {
    const { key, value } = OSM_TAGS[placeType];
    const radiusM = Math.round(radiusKm * 1000);
    const query = `[out:json][timeout:15];
(
  node["${key}"="${value}"](around:${radiusM},${lat},${lng});
  way["${key}"="${value}"](around:${radiusM},${lat},${lng});
);
out center 30;`;
    const body = new URLSearchParams();
    body.set("data", query);
    const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "*/*",
            "User-Agent": "MeetMidway/1.0",
        },
        body: body.toString(),
        signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
        throw new Error(`Overpass returned ${response.status}: ${response.statusText}`);
    }
    const data = (await response.json());
    const elements = data.elements || [];
    const places = [];
    for (const el of elements) {
        const name = el.tags?.name;
        if (!name)
            continue;
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (elLat == null || elLng == null)
            continue;
        places.push({
            id: el.id,
            name,
            lat: elLat,
            lng: elLng,
            tags: el.tags || {},
        });
    }
    return places;
}
