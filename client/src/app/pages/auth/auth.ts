import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <a routerLink="/" class="auth-brand" aria-label="MeetMidway home">
        <img src="/octopus.png" alt="" />
        <span>MeetMidway</span>
      </a>

      <section class="auth-panel" aria-labelledby="auth-title">
        <p class="auth-eyebrow">Plan together, fairly</p>
        <h1 id="auth-title">{{ mode === 'signup' ? 'Make meetups easier.' : 'Welcome back.' }}</h1>
        <p class="auth-intro">{{ mode === 'signup' ? 'Save your sessions and keep your group plans in one place.' : 'Sign in to continue planning with your people.' }}</p>

        <div class="auth-mode-toggle" role="tablist" aria-label="Choose authentication mode">
          <button type="button" class="auth-mode-btn" [class.auth-mode-btn--active]="mode === 'signup'" (click)="setMode('signup')">Sign up</button>
          <button type="button" class="auth-mode-btn" [class.auth-mode-btn--active]="mode === 'signin'" (click)="setMode('signin')">Sign in</button>
        </div>

        <button class="auth-google" type="button" (click)="google()" [disabled]="loading">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.8 3.1-4.3 3.1-7.4Z"/><path fill="#34a853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z"/><path fill="#fbbc05" d="M6.2 13.7a6 6 0 0 1 0-3.4V7.7H2.9a10 10 0 0 0 0 8.6l3.3-2.6Z"/><path fill="#ea4335" d="M12 6c1.6 0 3 .6 4.1 1.6l3.1-3A10 10 0 0 0 2.9 7.7l3.3 2.6C7 7.8 9.3 6 12 6Z"/></svg>
          Continue with Google
        </button>

        <div class="auth-divider"><span>or continue with email</span></div>

        <form (ngSubmit)="submit()" class="auth-form">
          @if (mode === 'signup') {
            <label class="auth-field"><span>Name</span><input name="name" [(ngModel)]="name" autocomplete="name" placeholder="Your name" required /></label>
          }
          <label class="auth-field"><span>Email</span><input name="email" [(ngModel)]="email" type="email" autocomplete="email" placeholder="you@example.com" required /></label>
          <label class="auth-field"><span>Password</span><input name="password" [(ngModel)]="password" type="password" autocomplete="current-password" placeholder="At least 8 characters" minlength="8" required /></label>

          @if (message) { <p class="auth-message" [class.auth-message--error]="isError">{{ message }}</p> }

          <button class="auth-submit" type="submit" [disabled]="loading">
            {{ loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in' }}
          </button>
        </form>

        <p class="auth-switch">{{ mode === 'signup' ? 'Already have an account?' : 'New to MeetMidway?' }}
          <button type="button" (click)="toggleMode()">{{ mode === 'signup' ? 'Sign in' : 'Create account' }}</button>
        </p>
      </section>

      <p class="auth-note">Your location is only shared with the trip room you choose.</p>
    </main>
  `
})
export class AuthComponent {
  mode: 'signup' | 'signin' = 'signup';
  name = '';
  email = '';
  password = '';
  loading = false;
  message = '';
  isError = false;

  constructor(private readonly auth: AuthService, private readonly router: Router, private readonly route: ActivatedRoute) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const confirmed = params.get('confirmed') === '1';
    const mode = params.get('mode');
    const email = params.get('email');
    const notice = params.get('notice');

    if (email) {
      this.email = email;
    }

    if (mode === 'signup') {
      this.mode = 'signup';
    }

    if (confirmed || mode === 'signin') {
      this.mode = 'signin';
      if (confirmed) {
        this.message = 'Email confirmed. You can sign in now.';
        this.isError = false;
      }
    }

    if (notice === 'verify') {
      this.mode = 'signin';
      this.message = 'Please verify your email before signing in.';
      this.isError = true;
    }
  }

  toggleMode() { this.mode = this.mode === 'signup' ? 'signin' : 'signup'; this.message = ''; }

  setMode(mode: 'signup' | 'signin') {
    this.mode = mode;
    this.message = '';
    this.isError = false;
  }

  async google() { await this.run(() => this.auth.continueWithGoogle(this.nextPath())); }

  async submit() {
    await this.run(async () => {
      if (this.mode === 'signup') {
        const result = await this.auth.signUp(this.email.trim(), this.password, this.name.trim(), this.nextPath());
        this.message = result.confirmationRequired
          ? 'Check your email and verify your account before signing in.'
          : 'Your account is ready.';
        if (result.confirmationRequired) {
          this.mode = 'signin';
          this.password = '';
        } else {
          const firstName = this.firstName(this.name.trim()) || this.auth.displayName();
          this.setWelcomeFlag(result.isNewUser ? 'new' : 'returning', firstName);
          await this.goToNext();
        }
      } else {
        await this.auth.signIn(this.email.trim(), this.password);
        this.setWelcomeFlag('returning', this.auth.displayName());
        await this.goToNext();
      }
    });
  }

  private async run(action: () => Promise<void>) {
    this.loading = true; this.message = ''; this.isError = false;
    try { await action(); } catch (error) { this.isError = true; this.message = error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }
    finally { this.loading = false; }
  }

  private goToNext() {
    return this.router.navigateByUrl(this.nextPath());
  }

  private nextPath() {
    return this.route.snapshot.queryParamMap.get('next') || '/';
  }

  private setWelcomeFlag(type: 'new' | 'returning', name: string) {
    sessionStorage.setItem('mm_welcome', type);
    sessionStorage.setItem('mm_welcome_name', name || 'there');
    sessionStorage.setItem('mm_welcome_dashboard', type);
  }

  private firstName(name: string): string {
    return name.split(/\s+/)[0] || '';
  }
}
