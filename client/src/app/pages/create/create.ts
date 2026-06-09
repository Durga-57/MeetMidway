import { Component } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { PlaceType, PLACE_TYPE_EMOJIS, PLACE_TYPE_LABELS } from "@shared/types";
import { TripService } from "../../services/trip.service";

@Component({
  selector: "app-create",
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-shell--centered">
      <div class="card card-narrow" style="width: min(480px, 100%);">
        <div style="margin-bottom: 1rem;">
          <a routerLink="/" class="btn btn-link" style="font-size: 12px;">← Back to home</a>
        </div>

        <h1 style="font-size: 1.3rem; margin-bottom: 0.25rem;">Create a trip</h1>
        <p style="margin-bottom: 1.25rem;">Start a session and invite your friends to join.</p>

        <form (ngSubmit)="handleSubmit()">
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

          <div class="form-group">
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

          @if (error) {
            <div class="alert alert-error">{{ error }}</div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-full"
            [disabled]="loading || !name.trim()"
          >
            @if (loading) {
              <div class="spinner spinner--sm spinner--white"></div>
              <span>Creating…</span>
            } @else {
              <span>Create trip session</span>
            }
          </button>
        </form>

        <p style="text-align: center; margin-top: 0.75rem; margin-bottom: 0; font-size: 12px; color: var(--text-faint);">
          No sign-up required. Sessions are free.
        </p>
      </div>
    </div>
  `
})
export class CreateComponent {
  name = "";
  placeType: PlaceType = "restaurant";
  loading = false;
  error: string | null = null;

  placeTypes = Object.keys(PLACE_TYPE_EMOJIS) as PlaceType[];

  constructor(
    private tripService: TripService,
    private router: Router
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
    if (!this.name.trim()) return;
    this.loading = true;
    this.error = null;

    this.tripService.createTrip(this.name.trim(), this.placeType).subscribe({
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
