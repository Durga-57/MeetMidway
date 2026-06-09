import { useEffect, useRef } from "react";
import L from "leaflet";
import { Friend, ScoredPlace, PLACE_TYPE_EMOJIS } from "@shared/types";
import { useTripStore } from "../store/tripStore";

interface Props {
  friends: Friend[];
  places: ScoredPlace[];
  midpoint: { lat: number; lng: number } | null;
  selectedPlaceId: number | null;
}

// Fix Leaflet default icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function Map({ friends, places, midpoint, selectedPlaceId }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const friendMarkersRef = useRef<L.Marker[]>([]);
  const placeMarkersRef = useRef<L.Marker[]>([]);
  const midpointMarkerRef = useRef<L.Marker | null>(null);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const { setSelectedPlace } = useTripStore();

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update friend markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    friendMarkersRef.current.forEach((m) => m.remove());
    friendMarkersRef.current = [];

    friends.forEach((friend) => {
      const icon = L.divIcon({
        html: `<div class="friend-marker" style="background:${friend.color}">${friend.name[0].toUpperCase()}</div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([friend.lat, friend.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-weight:700;font-size:0.9rem;color:#e8e8f0">${friend.name}</div><div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-top:2px">${friend.address}</div>`
        );

      friendMarkersRef.current.push(marker);
    });

    fitBounds(map, friends, midpoint, places);
  }, [friends]);

  // Update midpoint marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (midpointMarkerRef.current) {
      midpointMarkerRef.current.remove();
      midpointMarkerRef.current = null;
    }

    if (midpoint) {
      const icon = L.divIcon({
        html: `<div class="midpoint-marker"></div>`,
        className: "",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      midpointMarkerRef.current = L.marker([midpoint.lat, midpoint.lng], { icon })
        .addTo(map)
        .bindPopup('<div style="font-weight:700;color:#00f5c8">📍 Midpoint</div>');

      fitBounds(map, friends, midpoint, places);
    }
  }, [midpoint]);

  // Update place markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    placeMarkersRef.current.forEach((m) => m.remove());
    placeMarkersRef.current = [];

    places.forEach((place) => {
      const emoji = PLACE_TYPE_EMOJIS[place.placeType] || "📍";
      const isSelected = place.id === selectedPlaceId;

      const icon = L.divIcon({
        html: `<div class="place-marker${isSelected ? " selected" : ""}">${emoji}</div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([place.lat, place.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-weight:700;color:#e8e8f0;font-size:0.9rem">${place.name}</div><div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-top:4px">Fairness: ${place.fairnessScore.toFixed(0)}%</div>`
        );

      marker.on("click", () => {
        setSelectedPlace(place.id === selectedPlaceId ? null : place.id);
      });

      placeMarkersRef.current.push(marker);
    });

    if (places.length > 0) {
      fitBounds(map, friends, midpoint, places);
    }
  }, [places, selectedPlaceId]);

  // Update polylines for selected place
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    polylinesRef.current.forEach((p) => p.remove());
    polylinesRef.current = [];

    if (selectedPlaceId) {
      const place = places.find((p) => p.id === selectedPlaceId);
      if (place) {
        friends.forEach((friend) => {
          const line = L.polyline(
            [
              [friend.lat, friend.lng],
              [place.lat, place.lng],
            ],
            {
              color: friend.color,
              weight: 2,
              opacity: 0.6,
              dashArray: "6, 6",
            }
          ).addTo(map);
          polylinesRef.current.push(line);
        });
      }
    }
  }, [selectedPlaceId, places, friends]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: "300px" }}
    />
  );
}

function fitBounds(
  map: L.Map,
  friends: Friend[],
  midpoint: { lat: number; lng: number } | null,
  places: ScoredPlace[]
) {
  const points: [number, number][] = [
    ...friends.map((f): [number, number] => [f.lat, f.lng]),
    ...(midpoint ? [[midpoint.lat, midpoint.lng] as [number, number]] : []),
    ...places.slice(0, 3).map((p): [number, number] => [p.lat, p.lng]),
  ];

  if (points.length === 0) return;
  if (points.length === 1) {
    map.setView(points[0], 12);
    return;
  }

  const bounds = L.latLngBounds(points);
  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
}
