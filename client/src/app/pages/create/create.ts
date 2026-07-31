import { Component } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { PlaceType, PLACE_TYPE_EMOJIS, PLACE_TYPE_LABELS } from "@shared/types";
import { TripService } from "../../services/trip.service";
import { AuthService } from '../../services/auth.service';

@Component({
  selector: "app-create",
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-shell page-shell--centered trip-form-page">
      <section class="home-hero create-hero auth-panel trip-form-panel">
        <a routerLink="/" class="btn btn-link create-back">← Back to home</a>

        <h1 class="home-hero__title">Good to see you, <span class="accent">{{ auth.displayName() }}</span>.</h1>
        <p class="home-hero__subtitle">
          Set the outing name, add your own starting point, and we’ll open the room with you already added.
        </p>

        <div class="card create-card">
          <form (ngSubmit)="handleSubmit()" class="create-form">
            <div class="create-grid">
              <div class="form-group">
                <label for="trip-name" class="form-label">Trip name</label>
                <input
                  id="trip-name"
                  type="text"
                  name="name"
                  class="form-input"
                  placeholder="Friday night out, team lunch, coffee run..."
                  [(ngModel)]="name"
                  maxLength="60"
                  required
                />
              </div>

              <div class="form-group create-field--full">
                <label for="creator-address" class="form-label">Your starting address</label>
                <input
                  id="creator-address"
                  type="text"
                  name="creatorAddress"
                  class="form-input"
                  [class.error]="addressError"
                  placeholder="123 Main St, New York, NY"
                  [(ngModel)]="creatorAddress"
                  (ngModelChange)="addressError = ''"
                  maxLength="120"
                  required
                />
                @if (addressError) {
                  <p class="form-error">{{ addressError }}</p>
                }
              </div>

              <div class="form-group create-field--full">
                <label class="form-label">Place category</label>
                <div class="place-type-grid">
                  @for (type of placeTypes; track type) {
                    <button
                      type="button"
                      (click)="setPlaceType(type)"
                      [class.selected]="placeType === type"
                      class="place-type-btn"
                    >
                      <span>{{ getEmoji(type) }}</span>
                      <span>{{ getLabel(type) }}</span>
                    </button>
                  }
                </div>
              </div>
            </div>

            @if (error) {
              <div class="alert alert-error">{{ error }}</div>
            }

            <button
              type="submit"
              class="btn btn-primary btn-full"
              [disabled]="loading || !name.trim() || !creatorAddress.trim()"
            >
              @if (loading) {
                <div class="spinner spinner--sm spinner--white"></div>
                <span>Creating…</span>
              } @else {
                <span>Create trip session</span>
              }
            </button>
          </form>
        </div>

        <p class="create-note">No sign-up required. You’ll be the first participant in the room.</p>
      </section>
    </div>
  `
})
export class CreateComponent {
  name = "";
  creatorAddress = "";
  placeType: PlaceType = "restaurant";
  loading = false;
  error: string | null = null;
  addressError = "";

  placeTypes = Object.keys(PLACE_TYPE_EMOJIS) as PlaceType[];

  constructor(
    private tripService: TripService,
    private router: Router,
    public auth: AuthService
  ) {}

  setPlaceType(type: PlaceType) {
    this.placeType = type;
  }

  getEmoji(type: PlaceType): string {
    return PLACE_TYPE_EMOJIS[type] || "📍";
  }

  getLabel(type: PlaceType): string {
    return PLACE_TYPE_LABELS[type] || "";
  }

  handleSubmit() {
    const tripName = this.name.trim();
    const creatorName = this.auth.displayName();
    const creatorAddress = this.creatorAddress.trim();

    if (!tripName || !creatorAddress) {
      this.error = "Trip name and your address are required.";
      return;
    }

    if (tripName.length < 2 || tripName.length > 60) {
      this.error = "Trip name must be between 2 and 60 characters.";
      return;
    }

    if (creatorAddress.length < 3 || creatorAddress.length > 120) {
      this.addressError = "Please enter a real starting address.";
      return;
    }

    this.loading = true;
    this.error = null;

    this.tripService.createTrip(tripName, this.placeType, creatorName, creatorAddress).subscribe({
      next: (result) => {
        this.loading = false;
        this.router.navigate([`/trip/${result.code}`]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || "Failed to create trip.";
      }
    });
  }
}
