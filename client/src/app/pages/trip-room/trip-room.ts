import { Component, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild, HostListener, ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { Trip, Friend, ScoredPlace, Midpoint, PlaceType } from "@shared/types";
import { TripStoreService } from "../../services/trip-store.service";
import { TripService } from "../../services/trip.service";
import { SocketService } from "../../services/socket.service";
import { GeocoderService, GeoResult } from "../../services/geocoder.service";

import { FriendListComponent } from "../../components/friend-list/friend-list";
import { MapComponent } from "../../components/map/map";
import { PlaceListComponent } from "../../components/place-list/place-list";
import { SearchControlsComponent } from "../../components/search-controls/search-controls";
import { TripCodeBadgeComponent } from "../../components/trip-code-badge/trip-code-badge";
import { NgZone } from "@angular/core";

@Component({
  selector: "app-trip-room",
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    FriendListComponent,
    MapComponent,
    PlaceListComponent,
    SearchControlsComponent,
    TripCodeBadgeComponent,
  ],
  template: `
    @if (notFound) {
      <div class="empty-state">
        <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Trip not found</h1>
        <p style="margin-bottom: 1rem;">This trip may have expired or never existed.</p>
        <a routerLink="/create" class="btn btn-primary">Create new trip</a>
      </div>
    } @else if (!trip) {
      <div class="loading-state">
        <div class="spinner"></div>
        <span style="font-size: 13px; color: var(--text-faint);">Loading trip session…</span>
      </div>
    } @else {
      <div class="page-shell--split">
        <!-- Navbar -->
        <nav class="navbar">
          <a routerLink="/" class="navbar__brand">📍 MeetMidway</a>
          <span class="navbar__trip-name">{{ trip.name }}</span>
          <div class="navbar__code">{{ code }}</div>
        </nav>

        <!-- Split layout -->
        <div class="trip-shell">
          <!-- Sidebar -->
          <aside class="trip-shell__sidebar">
            <!-- Invite code -->
            <app-trip-code-badge [code]="trip.code"></app-trip-code-badge>

            <!-- Friends -->
            <div>
              <app-friend-list
                [friends]="trip.friends"
                [removingId]="removingId"
                (remove)="handleRemoveFriend($event)"
              ></app-friend-list>

              <!-- Add friend toggle -->
              <button
                (click)="showAddForm = !showAddForm"
                class="btn btn-secondary btn-sm btn-full"
                style="margin-top: 0.5rem;"
              >
                {{ showAddForm ? "✕ Cancel" : "+ Add starting address" }}
              </button>

              <!-- Add friend form -->
              @if (showAddForm) {
                <form
                  (ngSubmit)="handleAddFriend($event)"
                  style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem;"
                >
                  <input
                    type="text"
                    name="addName"
                    class="form-input"
                    placeholder="Name"
                    [(ngModel)]="addName"
                    maxLength="40"
                    required
                  />

                  <div class="autocomplete-wrapper" #suggestionsWrapper>
                    <div style="position: relative;">
                      <input
                        type="text"
                        name="addAddress"
                        class="form-input"
                        [class.error]="addError"
                        placeholder="Starting address"
                        [(ngModel)]="addAddress"
                        (ngModelChange)="handleAddressInput($event)"
                        (focus)="onAddressFocus()"
                        autocomplete="off"
                        required
                      />
                      @if (geoLoading) {
                        <div style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);">
                          <div class="spinner spinner--sm"></div>
                        </div>
                      }
                    </div>
                    @if (showSuggestions && suggestions.length > 0) {
                      <div class="autocomplete-list">
                        @for (s of suggestions; track s.display_name) {
                          <button
                            type="button"
                            class="autocomplete-item"
                            (click)="selectSuggestion(s.display_name)"
                          >
                            📍 {{ s.display_name }}
                          </button>
                        }
                      </div>
                    }
                  </div>

                  @if (addError) {
                    <p class="form-error">{{ addError }}</p>
                  }

                  <button
                    type="submit"
                    class="btn btn-primary btn-sm btn-full"
                    [disabled]="addLoading || !addName.trim() || !addAddress.trim()"
                  >
                    @if (addLoading) {
                      <div class="spinner spinner--sm spinner--white"></div>
                      <span>Adding…</span>
                    } @else {
                      <span>Add Me</span>
                    }
                  </button>
                </form>
              }
            </div>

            <div class="divider"></div>

            <!-- Search controls -->
            <app-search-controls
              [defaultPlaceType]="trip.placeType"
              [canSearch]="trip.friends.length >= 2"
              [isSearching]="isSearching"
              (search)="handleSearch()"
            ></app-search-controls>

            <!-- Results -->
            @if (places.length > 0 || isSearching || searchError) {
              <div class="divider"></div>
              <app-place-list
                [places]="places"
                [friends]="trip.friends"
                [isSearching]="isSearching"
                [searchError]="searchError"
                (retry)="handleSearch()"
              ></app-place-list>
            }
          </aside>

          <!-- Map panel -->
          <section class="trip-shell__map">
            @if (midpoint) {
              <div class="midpoint-badge">
                📍 Midpoint: {{ midpoint.lat.toFixed(4) }}, {{ midpoint.lng.toFixed(4) }}
              </div>
            }
            <app-map
              #mapRef
              [friends]="trip.friends"
              [places]="places"
              [midpoint]="midpoint"
              [selectedPlaceId]="selectedPlaceId"
            ></app-map>
          </section>
        </div>
      </div>
    }
  `
})
export class TripRoomComponent implements OnInit, AfterViewChecked, OnDestroy {
  code = "";
  trip: Trip | null = null;
  places: ScoredPlace[] = [];
  midpoint: Midpoint | null = null;
  selectedPlaceId: number | null = null;
  isSearching = false;
  searchError: string | null = null;
  notFound = false;

  // Add friend state
  showAddForm = false;
  hoverAddToggle = false;
  addName = "";
  addAddress = "";
  addError = "";
  addLoading = false;
  removingId: string | null = null;

  // Geocoder state
  showSuggestions = false;
  suggestions: GeoResult[] = [];
  geoLoading = false;
  hoveredSuggest: string | null = null;

  // Search Settings State
  searchPlaceType: PlaceType | null = null;
  radiusKm = 5;

  private debounceTimeout: any = null;
  private subs: Subscription[] = [];
  private mapSizeInvalidated = false;

  @ViewChild("suggestionsWrapper") suggestionsWrapper!: ElementRef;
  @ViewChild("mapRef") mapRef!: MapComponent;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private store: TripStoreService,
    private tripService: TripService,
    private socketService: SocketService,
    private geocoderService: GeocoderService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const tripCode = this.activatedRoute.snapshot.paramMap.get("code");
    if (!tripCode) {
      this.notFound = true;
      return;
    }
    this.code = tripCode.toUpperCase();
    this.store.reset();

    this.tripService.fetchTrip(this.code).subscribe({
      next: (res) => {
        if (!res.trip) {
          this.notFound = true;
        } else {
          this.store.setTrip(res.trip);
          this.socketService.joinRoom(this.code);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notFound = true;
        this.cdr.markForCheck();
      },
    });

    this.subs.push(this.store.trip$.subscribe((t) => { this.trip = t; this.cdr.markForCheck(); }));
    this.subs.push(this.store.places$.subscribe((p) => { this.places = p; this.cdr.markForCheck(); }));
    this.subs.push(this.store.midpoint$.subscribe((m) => { this.midpoint = m; this.cdr.markForCheck(); }));
    this.subs.push(this.store.selectedPlaceId$.subscribe((id) => { this.selectedPlaceId = id; this.cdr.markForCheck(); }));
    this.subs.push(this.store.isSearching$.subscribe((s) => { this.isSearching = s; this.cdr.markForCheck(); }));
    this.subs.push(this.store.searchError$.subscribe((e) => { this.searchError = e; this.cdr.markForCheck(); }));
    this.subs.push(this.store.placeType$.subscribe((pt) => { this.searchPlaceType = pt; this.cdr.markForCheck(); }));
    this.subs.push(this.store.radiusKm$.subscribe((r) => { this.radiusKm = r; this.cdr.markForCheck(); }));
    this.subs.push(this.geocoderService.suggestions$.subscribe((s) => { this.suggestions = s; this.cdr.markForCheck(); }));
    this.subs.push(this.geocoderService.loading$.subscribe((l) => { this.geoLoading = l; this.cdr.markForCheck(); }));
  }

  ngAfterViewChecked() {
    if (this.trip && !this.mapSizeInvalidated && this.mapRef) {
      this.mapSizeInvalidated = true;
      setTimeout(() => {
        if ((this.mapRef as any).map) {
          (this.mapRef as any).map.invalidateSize();
        }
      }, 150);
    }
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
    this.socketService.leaveRoom();
    if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
  }

  @HostListener("document:mousedown", ["$event"])
  onDocumentClick(event: MouseEvent) {
    if (
      this.suggestionsWrapper &&
      !this.suggestionsWrapper.nativeElement.contains(event.target)
    ) {
      this.showSuggestions = false;
    }
  }

  handleAddressInput(val: string) {
    this.addAddress = val;
    this.addError = "";
    if (this.debounceTimeout) clearTimeout(this.debounceTimeout);

    if (val.length >= 3) {
      this.debounceTimeout = setTimeout(() => {
        this.geocoderService.search(val);
        this.showSuggestions = true;
        this.cdr.markForCheck();
      }, 400);
    } else {
      this.geocoderService.clear();
      this.showSuggestions = false;
      this.cdr.markForCheck();
    }
  }

  onAddressFocus() {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
      this.cdr.markForCheck();
    }
  }

  selectSuggestion(val: string) {
    this.addAddress = val;
    this.showSuggestions = false;
    this.geocoderService.clear();
    this.cdr.markForCheck();
  }

  handleAddFriend(e: Event) {
    e.preventDefault();
    if (!this.code || !this.addName.trim() || !this.addAddress.trim()) return;

    this.addLoading = true;
    this.addError = "";
    this.cdr.markForCheck();

    this.tripService.addFriend(this.code, this.addName.trim(), this.addAddress.trim()).subscribe({
      next: () => {
        this.addLoading = false;
        this.addName = "";
        this.addAddress = "";
        this.geocoderService.clear();
        this.showSuggestions = false;
        this.showAddForm = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.addLoading = false;
        this.addError = err.error?.error || "Failed to add friend.";
        this.cdr.markForCheck();
      },
    });
  }

  handleRemoveFriend(friendId: string) {
    if (!this.code) return;
    this.removingId = friendId;
    this.cdr.markForCheck();
    this.tripService.removeFriend(this.code, friendId).subscribe({
      next: () => { this.removingId = null; this.cdr.markForCheck(); },
      error: () => { this.removingId = null; this.cdr.markForCheck(); },
    });
  }

  handleSearch() {
    if (!this.code || !this.trip || this.trip.friends.length < 2) return;

    this.store.setIsSearching(true);
    this.store.setSearchError(null);

    const type = this.searchPlaceType ?? this.trip.placeType;

    this.tripService.searchPlaces(this.code, type, this.radiusKm).subscribe({
      next: (res) => {
        this.store.setIsSearching(false);
        if (res.places.length === 0) {
          this.store.setSearchError(`No ${type} found within ${this.radiusKm}km. Try increasing the radius.`);
          this.store.setPlaces([], res.midpoint);
        } else {
          this.store.setPlaces(res.places, res.midpoint);
        }
      },
      error: (err) => {
        this.store.setIsSearching(false);
        this.store.setSearchError(err.error?.error || "Search failed. Try again.");
      },
    });
  }
}
