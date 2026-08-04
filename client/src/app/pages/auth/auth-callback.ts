import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-auth-callback', standalone: true, template: '<main class="auth-callback">Completing sign in…</main>' })
export class AuthCallbackComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  
  constructor() {
    this.handleAuthCallback();
  }

  private async handleAuthCallback() {
    try {
      const result = await this.auth.completeAuthCallback();
      const next = this.route.snapshot.queryParamMap.get('next') || '/';

      if (result.session) {
        const user = result.session.user;
        this.setWelcomeFlag(this.isLikelyNewUser(user.created_at, user.last_sign_in_at) ? 'new' : 'returning');
        await this.router.navigateByUrl(next);
        return;
      }

      const authUrl = this.router.createUrlTree(['/auth'], {
        queryParams: {
          mode: 'signin',
          confirmed: '1',
          email: result.email || undefined,
          next
        }
      });
      await this.router.navigateByUrl(authUrl);
    } catch (error) {
      console.error('Auth callback error:', error);
      setTimeout(() => this.router.navigateByUrl('/auth'), 1000);
    }
  }

  private setWelcomeFlag(type: 'new' | 'returning') {
    sessionStorage.setItem('mm_welcome', type);
    sessionStorage.setItem('mm_welcome_name', this.auth.displayName());
  }

  private isLikelyNewUser(createdAt?: string, lastSignInAt?: string): boolean {
    if (!createdAt || !lastSignInAt) return false;

    const created = new Date(createdAt).getTime();
    const lastSignIn = new Date(lastSignInAt).getTime();
    if (!Number.isFinite(created) || !Number.isFinite(lastSignIn)) return false;

    return Math.abs(created - lastSignIn) <= 5000;
  }
}
