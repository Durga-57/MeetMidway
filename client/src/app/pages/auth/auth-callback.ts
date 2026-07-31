import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-auth-callback', standalone: true, template: '<main class="auth-callback">Completing sign in…</main>' })
export class AuthCallbackComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  constructor() { setTimeout(() => this.router.navigateByUrl('/'), 800); }
}
