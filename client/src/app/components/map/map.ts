import {
  Component,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  SimpleChanges,
  ElementRef,
  ViewChild,
  NgZone,
  ChangeDetectorRef,
} from "@angular/core";
import * as L from "leaflet";
import { Friend, PlaceType, ScoredPlace } from "@shared/types";
import { TripStoreService } from "../../services/trip-store.service";

// Fix Leaflet default icon paths in bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

@Component({
  selector: "app-map",
  standalone: true,
  template: `
    <div
      #mapContainer
      style="width: 100%; height: 100%; min-height: 300px;"
    ></div>
  `
})
export class MapComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() friends: Friend[] = [];
  @Input() places: ScoredPlace[] = [];
  @Input() midpoint: { lat: number; lng: number } | null = null;
  @Input() selectedPlaceId: number | null = null;

  @ViewChild("mapContainer", { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private friendMarkers: L.Marker[] = [];
  private placeMarkers: L.Marker[] = [];
  private midpointMarker: L.Marker | null = null;
  private polylines: L.Polyline[] = [];
  private mapReady = false;
  private pendingUpdate = false;

  constructor(
    private store: TripStoreService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Map init is deferred to AfterViewInit
  }

  ngAfterViewInit() {
    // Run Leaflet entirely outside Angular's zone to prevent
    // change-detection cycles from blocking the UI thread
    this.ngZone.runOutsideAngular(() => {
      this.initializeMap();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.map || !this.mapReady) {
      this.pendingUpdate = true;
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      if (changes["friends"]) {
        this.updateFriendMarkers();
      }
      if (changes["midpoint"]) {
        this.updateMidpointMarker();
      }
      if (changes["places"] || changes["selectedPlaceId"]) {
        this.updatePlaceMarkers();
        this.updatePolylines();
      }
      this.fitMapBounds();
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initializeMap() {
    if (this.map || !this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      // Disable fade animation to avoid blank map on first render
      fadeAnimation: false,
      markerZoomAnimation: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    L.control.zoom({ position: "topright" }).addTo(this.map);

    // CRITICAL: invalidateSize forces Leaflet to recalculate the container
    // dimensions after Angular has finished rendering the layout.
    // Without this, Leaflet may render into a 0-height container and show blank.
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        this.mapReady = true;

        // Draw any data that arrived before the map was ready
        if (this.pendingUpdate) {
          this.pendingUpdate = false;
          this.updateFriendMarkers();
          this.updateMidpointMarker();
          this.updatePlaceMarkers();
          this.updatePolylines();
          this.fitMapBounds();
        } else {
          // Initial draw with current inputs
          this.updateFriendMarkers();
          this.updateMidpointMarker();
          this.updatePlaceMarkers();
          this.updatePolylines();
          this.fitMapBounds();
        }
      }
    }, 100);
  }

  private updateFriendMarkers() {
    if (!this.map) return;

    // Clean old
    this.friendMarkers.forEach((m) => m.remove());
    this.friendMarkers = [];

    this.friends.forEach((friend) => {
      const icon = L.divIcon({
        html: `<div class="friend-marker" style="background:${friend.color}">${friend.name[0].toUpperCase()}</div>`,
        className: "",
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const marker = L.marker([friend.lat, friend.lng], { icon })
        .addTo(this.map!)
        .setZIndexOffset(1000)
        .bindPopup(
          `<div style="font-weight:600;font-size:13px;color:#1a1a1a">${friend.name}</div><div style="font-size:11px;color:#888;margin-top:2px">${friend.address}</div>`
        );

      this.friendMarkers.push(marker);
    });
  }

  private updateMidpointMarker() {
    if (!this.map) return;

    if (this.midpointMarker) {
      this.midpointMarker.remove();
      this.midpointMarker = null;
    }

    if (this.midpoint) {
      const icon = L.divIcon({
        html: `<div class="midpoint-marker"></div>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      this.midpointMarker = L.marker([this.midpoint.lat, this.midpoint.lng], { icon })
        .addTo(this.map)
        .setZIndexOffset(1200)
        .bindPopup('<div style="font-weight:600;font-size:13px;color:#1a1a1a">📍 Midpoint</div>');
    }
  }

  private updatePlaceMarkers() {
    if (!this.map) return;

    this.placeMarkers.forEach((m) => m.remove());
    this.placeMarkers = [];

    this.places.forEach((place) => {
      const isSelected = place.id === this.selectedPlaceId;

      const icon = L.divIcon({
        html: `<div class="place-marker${isSelected ? " selected" : ""}"><svg viewBox="0 0 24 24" aria-hidden="true">${this.getPlaceMarkerIcon(place.placeType)}</svg></div>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([place.lat, place.lng], { icon })
        .addTo(this.map!)
        .setZIndexOffset(isSelected ? 1100 : 900)
        .bindPopup(
          `<div style="font-weight:600;font-size:13px;color:#1a1a1a">${place.name}</div><div style="font-size:11px;color:#888;margin-top:4px">Fairness: ${place.fairnessScore.toFixed(0)}%</div>`
        );

      marker.on("click", () => {
        this.ngZone.run(() => {
          const nextId = this.selectedPlaceId === place.id ? null : place.id;
          this.store.setSelectedPlace(nextId);
        });
      });

      this.placeMarkers.push(marker);
    });
  }

  private updatePolylines() {
    if (!this.map) return;

    this.polylines.forEach((p) => p.remove());
    this.polylines = [];

    if (this.selectedPlaceId) {
      const place = this.places.find((p) => p.id === this.selectedPlaceId);
      if (place) {
        this.friends.forEach((friend) => {
          const path = [
            [friend.lat, friend.lng],
            [place.lat, place.lng],
          ] as [number, number][];

          const halo = L.polyline(path, {
            color: "#ffffff",
            weight: 8,
            opacity: 0.85,
            lineCap: "round",
          }).addTo(this.map!);

          const line = L.polyline(path, {
            color: friend.color,
            weight: 2.5,
            opacity: 0.72,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(this.map!);

          this.polylines.push(halo, line);
        });
      }
    }
  }

  private getPlaceMarkerIcon(type: PlaceType): string {
    switch (type) {
      case "cafe":
        return '<path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z"/><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2M3 21h15"/>';
      case "movie_theater":
        return '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m8 5 3 4-3 4 3 4M15 5l-3 4 3 4-3 4"/>';
      case "park":
        return '<path d="M12 21V10"/><path d="M12 14c-4 0-6-2.2-6-5 3.2 0 5 1.3 6 4 1-2.7 2.8-4 6-4 0 2.8-2 5-6 5Z"/>';
      case "bar":
        return '<path d="m6 3 6 8 6-8M12 11v8M8 21h8M4 3h16"/>';
      case "shopping_mall":
        return '<path d="M4 8h16l-1 12H5L4 8Z"/><path d="M8 8a4 4 0 0 1 8 0M9 12v2M15 12v2"/>';
      case "museum":
        return '<path d="m3 9 9-5 9 5M4 9h16M6 9v8M10 9v8M14 9v8M18 9v8M3 20h18"/>';
      case "bowling_alley":
        return '<circle cx="12" cy="15" r="6"/><circle cx="10" cy="13" r=".7" fill="currentColor"/><circle cx="13.5" cy="12.5" r=".7" fill="currentColor"/>';
      case "restaurant":
      default:
        return '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 13v8M15 3v18M15 3c3 1 4.5 3.5 4.5 6.5H15"/>';
    }
  }

  private fitMapBounds() {
    if (!this.map) return;

    const points: [number, number][] = [
      ...this.friends.map((f): [number, number] => [f.lat, f.lng]),
      ...(this.midpoint ? [[this.midpoint.lat, this.midpoint.lng] as [number, number]] : []),
      ...this.places.slice(0, 3).map((p): [number, number] => [p.lat, p.lng]),
    ];

    if (points.length === 0) return;
    if (points.length === 1) {
      this.map.setView(points[0], 12);
      return;
    }

    const bounds = L.latLngBounds(points);
    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }
}
