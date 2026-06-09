import { Component, Input } from "@angular/core";

@Component({
  selector: "app-trip-code-badge",
  standalone: true,
  template: `
    <div class="code-badge">
      <div style="flex: 1;">
        <div class="code-badge__label">Invite code</div>
        <div class="code-badge__code">{{ code }}</div>
      </div>

      <div class="code-badge__actions">
        <button class="btn btn-secondary btn-sm" (click)="copyCode()">
          {{ copiedCode ? "✓ Copied" : "Copy" }}
        </button>
        <button class="btn btn-secondary btn-sm" (click)="copyLink()">
          {{ copiedLink ? "✓ Done" : "🔗 Link" }}
        </button>
      </div>
    </div>
  `,
})
export class TripCodeBadgeComponent {
  @Input() code = "";

  copiedCode = false;
  copiedLink = false;

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copiedCode = true;
      setTimeout(() => (this.copiedCode = false), 2000);
    } catch {
      // fallback
    }
  }

  async copyLink() {
    try {
      const joinUrl = `${window.location.origin}/join/${this.code}`;
      await navigator.clipboard.writeText(joinUrl);
      this.copiedLink = true;
      setTimeout(() => (this.copiedLink = false), 2000);
    } catch {
      // fallback
    }
  }
}
