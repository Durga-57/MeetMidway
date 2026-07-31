import { Component, Input, Output, EventEmitter } from "@angular/core";
import { ScoredPlace, Friend, PLACE_TYPE_EMOJIS } from "@shared/types";
import { formatDistance } from "../../utils/geo";

@Component({
  selector: "app-place-card",
  standalone: true,
  template: `
    <div
      (click)="select.emit()"
      class="place-card"
      [class.selected]="isSelected"
    >
      <!-- Top row -->
      <div class="place-card__header">
        <div class="place-card__icon">{{ getEmoji() }}</div>

        <div class="place-card__body">
          <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
            <span class="place-card__name">{{ place.name }}</span>
            <span [class]="getFairnessClass()">{{ place.fairnessScore.toFixed(0) }}% Fair</span>
          </div>
          <div class="place-card__meta">
            avg:{{ formatDistanceValue(place.avg) }} max:{{ formatDistanceValue(place.maxD) }}
          </div>
        </div>

        <div class="place-card__rank" [class.rank-top]="rank === 0">#{{ rank + 1 }}</div>
      </div>

      <div class="place-card__actions" (click)="$event.stopPropagation()">
        <button class="place-vote-btn" type="button" [class.active]="hasVoted" (click)="vote.emit()" [disabled]="!!confirmedPlaceId">
          <span class="heart-icon">{{ hasVoted ? '❤️' : '🤍' }}</span>
          <span>{{ voteCount }}</span>
        </button>
        @if (confirmedPlaceId === place.id) {
          <span class="place-confirmed">Confirmed spot</span>
        } @else if (!confirmedPlaceId) {
          <button class="place-confirm-btn" type="button" (click)="confirm.emit()">Lock this spot</button>
        }
      </div>

      <!-- Voter avatars -->
      @if (voters.length > 0) {
        <div class="place-card__voters">
          <span class="place-card__voters-label">Voted by:</span>
          <div class="place-card__voters-list">
            @for (voter of voters; track voter.id) {
              <div class="place-card__voter-avatar" [style.background]="voter.color" [title]="voter.name">
                {{ voter.name[0] }}
              </div>
            }
          </div>
        </div>
      }

      <!-- Expand toggle -->
      <button class="place-card__toggle" (click)="toggleExpanded($event)">
        <span>{{ expanded ? "▴" : "▾" }}</span>
        <span>Distance breakdown</span>
      </button>

      <!-- Distance breakdown -->
      @if (expanded) {
        <div class="place-breakdown">
          @for (friend of friends; track friend.id; let idx = $index) {
            <div class="place-breakdown__row">
              <div class="place-breakdown__avatar" [style.background]="friend.color">
                {{ friend.name[0] }}
              </div>
              <div class="place-breakdown__bar-track">
                <div
                  class="place-breakdown__bar-fill"
                  [style.width]="getDistancePercent(idx)"
                  [style.background]="friend.color"
                ></div>
              </div>
              <span class="place-breakdown__dist">{{ formatDistanceValue(place.distances[idx]) }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PlaceCardComponent {
  @Input() place!: ScoredPlace;
  @Input() rank!: number;
  @Input() friends: Friend[] = [];
  @Input() isSelected = false;
  @Input() voteCount = 0;
  @Input() hasVoted = false;
  @Input() confirmedPlaceId: number | undefined;
  @Input() voterIds: string[] = [];
  @Output() select = new EventEmitter<void>();
  @Output() vote = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  expanded = false;

  get voters(): Friend[] {
    return this.friends.filter(f => this.voterIds.includes(f.id));
  }

  getEmoji(): string {
    return PLACE_TYPE_EMOJIS[this.place.placeType] || "📍";
  }

  getFairnessClass(): string {
    const score = this.place.fairnessScore;
    if (score >= 80) return "fairness-badge fairness-high";
    if (score >= 50) return "fairness-badge fairness-mid";
    return "fairness-badge fairness-low";
  }

  formatDistanceValue(km: number): string {
    return formatDistance(km);
  }

  getDistancePercent(idx: number): string {
    const dist = this.place.distances[idx];
    const pct = dist / this.place.maxD;
    return `${pct * 100}%`;
  }

  toggleExpanded(e: MouseEvent) {
    e.stopPropagation();
    this.expanded = !this.expanded;
  }
}
