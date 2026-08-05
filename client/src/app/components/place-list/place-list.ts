import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { ScoredPlace, Friend } from "@shared/types";
import { TripStoreService } from "../../services/trip-store.service";
import { PlaceCardComponent } from "../place-card/place-card";

@Component({
  selector: "app-place-list",
  standalone: true,
  imports: [PlaceCardComponent],
  template: `
    <div class="place-list">
      @if (isSearching) {
        <div class="loading-center">
          <div class="spinner"></div>
          <span>Finding places…</span>
        </div>
      } @else if (searchError) {
        <div class="alert alert-error" style="margin-bottom: 0.5rem;">
          {{ searchError }}
        </div>
        <button class="btn btn-secondary btn-sm" (click)="retry.emit()">Retry</button>
      } @else if (places.length > 0) {
        <div class="voting-guide">
          <div>
            <strong>Vote for one place</strong>
            <span>Your vote is highlighted. You can change it at any time.</span>
          </div>
          <span class="voting-guide__count">{{ totalVotes }} {{ totalVotes === 1 ? 'vote' : 'votes' }}</span>
        </div>
        @for (place of places; track place.id; let idx = $index) {
          <app-place-card
            [place]="place"
            [rank]="idx"
            [friends]="friends"
            [isSelected]="selectedPlaceId === place.id"
            [voteCount]="votes[voteKey(place.id)]?.length || 0"
            [hasVoted]="!!currentVoterId && (votes[voteKey(place.id)] || []).includes(currentVoterId)"
            [confirmedPlaceId]="confirmedPlaceId"
            [voterIds]="votes[voteKey(place.id)] || []"
            (select)="onSelectPlace(place.id)"
            (vote)="vote.emit(place.id)"
            (confirm)="confirm.emit(place.id)"
          ></app-place-card>
        }
      }
    </div>
  `
})
export class PlaceListComponent implements OnInit, OnDestroy {
  @Input() places: ScoredPlace[] = [];
  @Input() friends: Friend[] = [];
  @Input() isSearching = false;
  @Input() searchError: string | null = null;
  @Input() votes: Record<string, string[]> = {};
  @Input() currentVoterId = '';
  @Input() confirmedPlaceId: number | undefined;
  @Output() retry = new EventEmitter<void>();
  @Output() vote = new EventEmitter<number>();
  @Output() confirm = new EventEmitter<number>();

  selectedPlaceId: number | null = null;
  private subSelectedPlace: Subscription | null = null;

  constructor(private store: TripStoreService) {}

  ngOnInit() {
    this.subSelectedPlace = this.store.selectedPlaceId$.subscribe((id) => {
      this.selectedPlaceId = id;
    });
  }

  ngOnDestroy() {
    this.subSelectedPlace?.unsubscribe();
  }

  onSelectPlace(placeId: number) {
    const nextId = this.selectedPlaceId === placeId ? null : placeId;
    this.store.setSelectedPlace(nextId);
  }

  voteKey(placeId: number): string {
    return String(placeId);
  }

  get totalVotes(): number {
    return Object.values(this.votes).reduce((total, voters) => total + voters.length, 0);
  }
}
