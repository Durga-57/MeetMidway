import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-welcome-toast',
  standalone: true,
  template: `
    @if (shouldRender) {
      <aside class="welcome-toast" [class.welcome-toast--visible]="visible" role="status" aria-live="polite">
        <p>{{ message }}</p>
      </aside>
    }
  `,
  styles: [`
    .welcome-toast {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1200;
      max-width: min(90vw, 360px);
      padding: 0.75rem 1rem;
      border-radius: 0.85rem;
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.12);
      opacity: 0;
      transform: translateY(-10px) scale(0.98);
      transition: opacity 220ms ease, transform 220ms ease;
      pointer-events: none;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .welcome-toast p {
      margin: 0;
    }

    .welcome-toast--visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    @media (max-width: 640px) {
      .welcome-toast {
        left: 0.75rem;
        right: 0.75rem;
        max-width: none;
      }
    }
  `]
})
export class WelcomeToastComponent implements OnInit, OnDestroy {
  shouldRender = false;
  visible = false;
  message = '';

  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly auth: AuthService) {}

  ngOnInit(): void {
    const type = sessionStorage.getItem('mm_welcome');
    if (type !== 'new' && type !== 'returning') {
      return;
    }

    const storedName = sessionStorage.getItem('mm_welcome_name')?.trim();
    const name = storedName || this.auth.displayName();
    this.message = type === 'new' ? `Welcome, ${name}!` : `Welcome back, ${name}!`;

    sessionStorage.removeItem('mm_welcome');
    sessionStorage.removeItem('mm_welcome_name');

    this.shouldRender = true;
    requestAnimationFrame(() => {
      this.visible = true;
    });

    this.hideTimer = setTimeout(() => {
      this.visible = false;
    }, 3000);

    this.cleanupTimer = setTimeout(() => {
      this.shouldRender = false;
      this.message = '';
    }, 3300);
  }

  ngOnDestroy(): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    if (this.cleanupTimer) clearTimeout(this.cleanupTimer);
  }
}
