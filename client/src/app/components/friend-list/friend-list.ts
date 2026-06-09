import { Component, Input, Output, EventEmitter } from "@angular/core";
import { Friend } from "@shared/types";

@Component({
  selector: "app-friend-list",
  standalone: true,
  template: `
    <div>
      <div class="section-label">Participants ({{ friends.length }})</div>

      @if (friends.length === 0) {
        <div class="friend-empty">No participants yet. Add the first address below.</div>
      }

      @for (friend of friends; track friend.id) {
        <div class="friend-item" [class.removing]="removingId === friend.id">
          <div class="friend-avatar" [style.background]="friend.color">
            {{ friend.name[0].toUpperCase() }}
          </div>

          <div class="friend-info">
            <div class="friend-name">{{ friend.name }}</div>
            <div class="friend-address">{{ friend.address }}</div>
          </div>

          <button
            class="friend-remove-btn"
            (click)="remove.emit(friend.id)"
            [disabled]="removingId === friend.id"
            title="Remove"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class FriendListComponent {
  @Input() friends: Friend[] = [];
  @Input() removingId: string | null = null;
  @Output() remove = new EventEmitter<string>();
}
