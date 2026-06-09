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
import { Friend, ScoredPlace, PLACE_TYPE_EMOJIS } from "@shared/types";
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
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([friend.lat, friend.lng], { icon })
        .addTo(this.map!)
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
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      this.midpointMarker = L.marker([this.midpoint.lat, this.midpoint.lng], { icon })
        .addTo(this.map)
        .bindPopup('<div style="font-weight:600;font-size:13px;color:#1a1a1a">📍 Midpoint</div>');
    }
  }

  private updatePlaceMarkers() {
    if (!this.map) return;

    this.placeMarkers.forEach((m) => m.remove());
    this.placeMarkers = [];

    this.places.forEach((place) => {
      const emoji = PLACE_TYPE_EMOJIS[place.placeType] || "📍";
      const isSelected = place.id === this.selectedPlaceId;

      const icon = L.divIcon({
        html: `<div class="place-marker${isSelected ? " selected" : ""}">${emoji}</div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([place.lat, place.lng], { icon })
        .addTo(this.map!)
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
          ).addTo(this.map!);
          this.polylines.push(line);
        });
      }
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
