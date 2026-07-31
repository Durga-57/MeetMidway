import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from "@angular/core";
import { Router, ActivatedRoute, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { TripService } from "../../services/trip.service";
import { GeocoderService, GeoResult } from "../../services/geocoder.service";
import { AuthService } from '../../services/auth.service';

@Component({
  selector: "app-join",
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-shell page-shell--centered trip-form-page">
      <section class="home-hero create-hero auth-panel trip-form-panel">
        <a routerLink="/" class="btn btn-link create-back">← Back to home</a>

        <h1 class="home-hero__title">Join a <span class="accent">trip session</span></h1>
        @if (tripName) {
          <p class="home-hero__subtitle">Joining: <strong>{{ tripName }}</strong></p>
        } @else {
          <p class="home-hero__subtitle">You&rsquo;re joining as <strong>{{ auth.displayName() }}</strong>. Enter the invite code and your starting address.</p>
        }

        <div class="card create-card">
          <form (ngSubmit)="handleSubmit()" class="create-form">
            <div class="create-grid">
              <div class="form-group">
                <label for="trip-code" class="form-label">Trip code</label>
                <input
                  id="trip-code"
                  type="text"
                  name="code"
                  class="form-input"
                  style="text-align: center; font-family: var(--font-mono); font-size: 16px; font-weight: 700; letter-spacing: 0.15em;"
                  placeholder="AB12CD"
                  [(ngModel)]="code"
                  (ngModelChange)="onCodeChange($event)"
                  maxLength="6"
                  required
                />
              </div>

              <div class="form-group create-field--full">
                <label for="friend-address" class="form-label">Starting address</label>
                <div class="autocomplete-wrapper" #suggestionsWrapper>
                  <div style="position: relative;">
                    <input
                      id="friend-address"
                      type="text"
                      name="address"
                      class="form-input"
                      [class.error]="addressError"
                      placeholder="123 Main St, New York, NY"
                      [(ngModel)]="address"
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
                @if (addressError) {
                  <p class="form-error">{{ addressError }}</p>
                }
              </div>
            </div>

            @if (tripError && !addressError) {
              <div class="alert alert-error">{{ tripError }}</div>
            }

            <button
              type="submit"
              class="btn btn-primary btn-full"
              [disabled]="loading || !code.trim() || !address.trim()"
            >
              @if (loading) {
                <div class="spinner spinner--sm spinner--white"></div>
                <span>Joining…</span>
              } @else {
                <span>Join trip</span>
              }
            </button>
          </form>
        </div>

        <p class="create-note">
          Don't have a code?
          <a routerLink="/create">Create a trip</a>
        </p>
      </section>
    </div>
  `,
})
export class JoinComponent implements OnInit, OnDestroy {
  code = "";
  address = "";
  addressError = "";
  tripError = "";
  tripName: string | null = null;

  showSuggestions = false;
  suggestions: GeoResult[] = [];
  geoLoading = false;
  hoveredSuggest: string | null = null;

  private debounceTimeout: any = null;
  private subSuggestions: Subscription | null = null;
  private subGeoLoading: Subscription | null = null;

  @ViewChild("suggestionsWrapper") suggestionsWrapper!: ElementRef;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private tripService: TripService,
    private geocoderService: GeocoderService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const routeCode = this.activatedRoute.snapshot.paramMap.get("code") || this.activatedRoute.snapshot.queryParams["code"];
    if (routeCode) {
      this.code = routeCode.toUpperCase();
      this.fetchTripName(this.code);
    }

    this.subSuggestions = this.geocoderService.suggestions$.subscribe((results) => {
      this.suggestions = results;
    });

    this.subGeoLoading = this.geocoderService.loading$.subscribe((loading) => {
      this.geoLoading = loading;
    });
  }

  ngOnDestroy() {
    this.subSuggestions?.unsubscribe();
    this.subGeoLoading?.unsubscribe();
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

  onCodeChange(val: string) {
    this.code = val.toUpperCase();
    if (this.code.length === 6) {
      this.fetchTripName(this.code);
    } else {
      this.tripName = null;
    }
  }

  fetchTripName(tripCode: string) {
    this.tripService.fetchTrip(tripCode).subscribe({
      next: (res) => {
        if (res?.trip) this.tripName = res.trip.name;
      },
      error: () => {
        this.tripName = null;
      },
    });
  }

  handleAddressInput(val: string) {
    this.address = val;
    this.addressError = "";
    if (this.debounceTimeout) clearTimeout(this.debounceTimeout);

    if (val.length >= 3) {
      this.debounceTimeout = setTimeout(() => {
        this.geocoderService.search(val);
        this.showSuggestions = true;
      }, 400);
    } else {
      this.geocoderService.clear();
      this.showSuggestions = false;
    }
  }

  onAddressFocus() {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  selectSuggestion(displayName: string) {
    this.address = displayName;
    this.showSuggestions = false;
    this.geocoderService.clear();
  }

  loading = false;
  handleSubmit() {
    if (!this.code.trim() || !this.address.trim()) return;
    this.loading = true;
    this.tripError = "";
    this.addressError = "";

    const cleanCode = this.code.trim().toUpperCase();

    this.tripService.addFriend(cleanCode, this.auth.displayName(), this.address.trim()).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate([`/trip/${cleanCode}`]);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.error || "Failed to join trip.";
        this.tripError = msg;
        if (msg.toLowerCase().includes("address")) {
          this.addressError = "Address not found. Try being more specific.";
        }
      },
    });
  }
}
