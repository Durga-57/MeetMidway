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
}
