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
        <button type="button" class="code-badge__action" (click)="copyCode()" [attr.aria-label]="copiedCode ? 'Invite code copied' : 'Copy invite code'">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/></svg>
          {{ copiedCode ? "✓ Copied" : "Copy" }}
        </button>
        <button type="button" class="code-badge__action" (click)="copyLink()" [attr.aria-label]="copiedLink ? 'Invite link copied' : 'Copy invite link'">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/></svg>
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
