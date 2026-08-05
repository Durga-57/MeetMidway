import { Component, Input } from "@angular/core";
import { PlaceType } from "@shared/types";

@Component({
  selector: "app-place-type-icon",
  standalone: true,
  template: `
    <svg class="place-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (type) {
        @case ("restaurant") { <path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 13v8" /><path d="M15 3v18M15 3c3 1 4.5 3.5 4.5 6.5H15" /> }
        @case ("cafe") { <path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" /><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2M3 21h15" /><path d="M8 4c-1 1 1 1.5 0 2.5M12 3.5c-1 1 1 1.5 0 2.5" /> }
        @case ("movie_theater") { <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m8 5 3 4-3 4 3 4M15 5l-3 4 3 4-3 4" /> }
        @case ("park") { <path d="M12 21V10" /><path d="M12 14c-4 0-6-2.2-6-5 3.2 0 5 1.3 6 4 1-2.7 2.8-4 6-4 0 2.8-2 5-6 5Z" /><path d="M12 10c-2.8 0-4.5-1.7-4.5-4 2.4 0 4 .9 4.5 3 0.5-2.1 2.1-3 4.5-3 0 2.3-1.7 4-4.5 4Z" /> }
        @case ("bar") { <path d="m6 3 6 8 6-8M12 11v8M8 21h8M4 3h16" /> }
        @case ("shopping_mall") { <path d="M4 8h16l-1 12H5L4 8Z" /><path d="M8 8a4 4 0 0 1 8 0M9 12v2M15 12v2" /> }
        @case ("museum") { <path d="m3 9 9-5 9 5M4 9h16M6 9v8M10 9v8M14 9v8M18 9v8M3 20h18" /> }
        @case ("bowling_alley") { <circle cx="12" cy="15" r="6" /><circle cx="10" cy="13" r=".7" fill="currentColor" /><circle cx="13.5" cy="12.5" r=".7" fill="currentColor" /><path d="M9 4h.01M12 4h.01M15 5h.01" /> }
      }
    </svg>
  `,
})
export class PlaceTypeIconComponent {
  @Input() type: PlaceType = "restaurant";
}
