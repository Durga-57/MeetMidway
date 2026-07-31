import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-auth-callback', standalone: true, template: '<main class="auth-callback">Completing sign in…</main>' })
export class AuthCallbackComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  
  constructor() {
    this.handleAuthCallback();
  }

  private async handleAuthCallback() {
    try {
      // Let Supabase handle the session from URL parameters
      await this.auth.hasSession();
      // Redirect to home after a short delay to ensure session is set
      setTimeout(() => this.router.navigateByUrl('/'), 500);
    } catch (error) {
      console.error('Auth callback error:', error);
      setTimeout(() => this.router.navigateByUrl('/auth'), 1000);
    }
  }
}
