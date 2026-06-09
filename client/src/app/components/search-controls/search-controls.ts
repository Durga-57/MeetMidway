import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { PlaceType, PLACE_TYPE_EMOJIS, PLACE_TYPE_LABELS } from "@shared/types";
import { TripStoreService } from "../../services/trip-store.service";

@Component({
  selector: "app-search-controls",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">Category</label>
        <select
          [ngModel]="placeType || defaultPlaceType"
          (ngModelChange)="setPlaceType($event)"
          class="form-select"
        >
          @for (type of placeTypes; track type) {
            <option [value]="type">{{ getEmoji(type) }} {{ getLabel(type) }}</option>
          }
        </select>
      </div>

      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label" style="display: flex; justify-content: space-between;">
          <span>Search radius</span>
          <span style="font-weight: 700; color: var(--text);">{{ radiusKm }} km</span>
        </label>
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          class="form-range"
          [ngModel]="radiusKm"
          (ngModelChange)="setRadiusKm($event)"
        />
        <div class="form-hint" style="display: flex; justify-content: space-between;">
          <span>1 km</span>
          <span>20 km</span>
        </div>
      </div>

      <button
        class="btn btn-primary btn-full"
        (click)="search.emit()"
        [disabled]="!canSearch || isSearching"
        [title]="!canSearch ? 'Add at least 2 starting addresses first' : ''"
      >
        @if (isSearching) {
          <div class="spinner spinner--sm spinner--white"></div>
          <span>Searching…</span>
        } @else {
          <span>Find places</span>
        }
      </button>

      @if (!canSearch) {
        <p class="form-hint" style="text-align: center; margin: 0;">
          Add at least 2 addresses to search.
        </p>
      }
    </div>
  `,
})
export class SearchControlsComponent implements OnInit, OnDestroy {
  @Input() defaultPlaceType: PlaceType = "restaurant";
  @Input() canSearch = false;
  @Input() isSearching = false;
  @Output() search = new EventEmitter<void>();

  placeType: PlaceType | null = null;
  radiusKm = 5;

  placeTypes = Object.keys(PLACE_TYPE_EMOJIS) as PlaceType[];

  private subs: Subscription[] = [];

  constructor(private store: TripStoreService) {}

  ngOnInit() {
    this.subs.push(this.store.placeType$.subscribe((pt) => { this.placeType = pt; }));
    this.subs.push(this.store.radiusKm$.subscribe((r) => { this.radiusKm = r; }));
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  setPlaceType(type: PlaceType) {
    this.store.setPlaceType(type);
  }

  setRadiusKm(val: number) {
    this.store.setRadiusKm(Number(val));
  }

  getEmoji(type: PlaceType): string {
    return PLACE_TYPE_EMOJIS[type] || "📍";
  }

  getLabel(type: PlaceType): string {
    return PLACE_TYPE_LABELS[type] || "";
  }
}
