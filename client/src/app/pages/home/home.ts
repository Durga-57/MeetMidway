import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ThemeService } from "../../services/theme.service";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- Navbar -->
    <nav class="home-nav">
      <a routerLink="/" class="home-nav__brand">
        <span>📍</span>
        <span>MeetMidway</span>
      </a>
      <div class="home-nav__spacer"></div>
      <div class="home-nav__actions">
        <button
          class="theme-toggle"
          (click)="theme.toggle()"
          [title]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          {{ theme.isDark() ? '☀️' : '🌙' }}
        </button>
        <a routerLink="/join" class="btn btn-secondary btn-sm">Join with code</a>
        <a routerLink="/create" class="btn btn-primary btn-sm">Create trip</a>
      </div>
    </nav>

    <div class="page-shell">
      <!-- Hero -->
      <section class="home-hero">
        <h1 class="home-hero__title">
          Find the <span class="accent">fairest</span> meetup spot<br>for everyone.
        </h1>
        <p class="home-hero__subtitle">
          MeetMidway calculates the geographic midpoint between friends, then ranks nearby
          places by travel fairness — so no one gets stuck with a long commute.
        </p>

        <div class="home-hero__actions">
          <a routerLink="/create" class="btn btn-primary">Start a trip</a>
          <a routerLink="/join" class="btn btn-secondary">Join with invite code</a>
        </div>

        <!-- Product mockup -->
        <div class="home-mockup">
          <div class="home-mockup__bar">
            <span class="home-mockup__dot"></span>
            <span class="home-mockup__dot"></span>
            <span class="home-mockup__dot"></span>
            <span class="home-mockup__url">localhost:4200/trip/X7P2QA</span>
          </div>
          <img
            src="/mockup.png"
            alt="MeetMidway trip room — sidebar with friends list and a map showing midpoint"
            width="860"
            height="540"
          />
        </div>
      </section>

      <!-- How it works -->
      <section class="home-steps">
        <h2 class="home-steps__title">How it works</h2>
        <ul class="home-steps__list">
          <li class="home-step">
            <span class="home-step__icon">🗓️</span>
            <div class="home-step__body">
              <strong>Create a session</strong>
              <span>Name the outing, pick a place category, and share the invite code with friends.</span>
            </div>
          </li>
          <li class="home-step">
            <span class="home-step__icon">📍</span>
            <div class="home-step__body">
              <strong>Everyone adds their address</strong>
              <span>Each person enters their starting point. The map updates in real time as they join.</span>
            </div>
          </li>
          <li class="home-step">
            <span class="home-step__icon">🏆</span>
            <div class="home-step__body">
              <strong>Pick the fairest spot</strong>
              <span>Nearby places are scored by travel fairness — the best midpoint rises to the top.</span>
            </div>
          </li>
        </ul>
      </section>

      <!-- Footer -->
      <footer class="home-footer">
        <span>MeetMidway</span>
        <span>No sign-up required. Sessions are free.</span>
      </footer>
    </div>
  `
})
export class HomeComponent {
  constructor(public theme: ThemeService) {}
}
