import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home', standalone: true, imports: [RouterLink], template: `
  <nav class="home-nav">
    <a routerLink="/" class="home-nav__brand"><img class="brand-mark" src="/octopus.png" alt="" /><span>MeetMidway</span></a>
    <div class="home-nav__spacer"></div>
    <div class="home-nav__actions">
      <button class="theme-toggle" (click)="theme.toggle()" [title]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'" [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">{{ theme.isDark() ? '☀︎' : '☾' }}</button>
      @if (!auth.session()) {
        <a routerLink="/join" class="btn btn-secondary btn-sm">Join with code</a>
        <a routerLink="/auth" class="btn btn-quiet btn-sm">Sign in</a>
        <a routerLink="/create" class="btn btn-primary btn-sm">Create trip</a>
      } @else {
        <a routerLink="/create" class="btn btn-primary btn-sm">Create trip</a>
        <a routerLink="/join" class="btn btn-secondary btn-sm">Join with code</a>
        <button (click)="auth.signOut()" class="btn btn-quiet btn-sm">Sign out</button>
      }
    </div>
  </nav>
  
  @if (!auth.session()) {
    <div class="page-shell">
      <section class="home-hero">
        <h1 class="home-hero__title">Find the <span class="accent">fairest</span> meetup spot<br />for everyone.</h1>
        <p class="home-hero__subtitle">MeetMidway calculates the geographic midpoint between friends, then ranks nearby places by travel fairness — so no one gets stuck with a long commute.</p>
        <div class="home-hero__actions"><a routerLink="/auth" class="btn btn-primary home-hero__primary-action">Get started now</a><a href="#how-it-works" class="btn btn-secondary home-hero__secondary-action">Explore</a></div>
        <div class="home-mockup"><img src="/mockup.png" alt="MeetMidway trip room with friends and a midpoint map" width="860" height="540" /></div>
      </section>
      <section id="how-it-works" class="home-steps"><h2 class="home-steps__title">How it works</h2><ul class="home-steps__list"><li class="home-step"><span class="home-step__icon">1</span><div class="home-step__body"><strong>Create a session</strong><span>Name the outing, choose a category, and share the invite code.</span></div></li><li class="home-step"><span class="home-step__icon">2</span><div class="home-step__body"><strong>Everyone adds their address</strong><span>Each person enters their starting point and the map updates in real time.</span></div></li><li class="home-step"><span class="home-step__icon">3</span><div class="home-step__body"><strong>Pick the fairest spot</strong><span>Nearby places are scored by travel fairness—the best midpoint rises to the top.</span></div></li></ul></section>
      <footer class="home-footer"><span>MeetMidway</span><span>Guest sessions are free. Accounts keep plans together.</span></footer>
    </div>
  } @else {
    <div class="page-shell dashboard-shell">
      <section class="dashboard-header">
        <div class="dashboard-header__welcome">
          <h1 class="dashboard-header__title">Welcome back, <span class="accent">{{ auth.displayName() }}</span></h1>
          <p class="dashboard-header__subtitle">Ready to plan your next fair meetup?</p>
        </div>
        <div class="dashboard-header__actions">
          <a routerLink="/create" class="btn btn-primary dashboard-header__btn">
            <span class="dashboard-header__btn-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </span>
            <span>Create a trip</span>
          </a>
          <a routerLink="/join" class="btn btn-secondary dashboard-header__btn">
            <span class="dashboard-header__btn-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </span>
            <span>Join with code</span>
          </a>
        </div>
      </section>

      <section class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ stats.totalTrips }}</div>
            <div class="stat-card__label">Total trips</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ stats.totalFriends }}</div>
            <div class="stat-card__label">Friends connected</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
          </div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ stats.activeTrips }}</div>
            <div class="stat-card__label">Active trips</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ stats.placesVoted }}</div>
            <div class="stat-card__label">Places voted</div>
          </div>
        </div>
      </section>

      <section class="dashboard-content">
        <div class="dashboard-section">
          <h2 class="dashboard-section__title">Recent activity</h2>
          <div class="activity-list">
            @for (activity of recentActivities; track activity.id) {
              <div class="activity-item">
                <div class="activity-item__icon">
                  @if (activity.icon === 'created') {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                  } @else if (activity.icon === 'joined') {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  } @else if (activity.icon === 'voted') {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  }
                </div>
                <div class="activity-item__content">
                  <div class="activity-item__title">{{ activity.title }}</div>
                  <div class="activity-item__time">{{ activity.time }}</div>
                </div>
                @if (activity.action) {
                  <a [routerLink]="activity.actionLink" class="activity-item__action">{{ activity.action }}</a>
                }
              </div>
            } @if (recentActivities.length === 0) {
              <div class="activity-empty">
                <div class="activity-empty__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div class="activity-empty__text">No recent activity yet. Start by creating your first trip!</div>
              </div>
            }
          </div>
        </div>

        <div class="dashboard-section">
          <h2 class="dashboard-section__title">Quick actions</h2>
          <div class="quick-actions">
            <a routerLink="/create" class="quick-action-card">
              <div class="quick-action-card__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </div>
              <div class="quick-action-card__title">Create new trip</div>
              <div class="quick-action-card__description">Start planning a new meetup</div>
            </a>
            <a routerLink="/join" class="quick-action-card">
              <div class="quick-action-card__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </div>
              <div class="quick-action-card__title">Join with code</div>
              <div class="quick-action-card__description">Enter a trip code to join</div>
            </a>
            <a routerLink="/auth" class="quick-action-card">
              <div class="quick-action-card__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
              <div class="quick-action-card__title">Account settings</div>
              <div class="quick-action-card__description">Manage your profile</div>
            </a>
          </div>
        </div>
      </section>
    </div>
  }
` })
export class HomeComponent implements OnInit {
  stats = {
    totalTrips: 0,
    totalFriends: 0,
    activeTrips: 0,
    placesVoted: 0
  };

  recentActivities: Array<{
    id: string;
    icon: 'created' | 'joined' | 'voted';
    title: string;
    time: string;
    action?: string;
    actionLink?: string;
  }> = [];

  constructor(public theme: ThemeService, public auth: AuthService) { }

  ngOnInit() {
    if (this.auth.session()) {
      this.loadDashboardData();
    }
  }

  private loadDashboardData() {
    // TODO: Load real data from Supabase
    // For now, using mock data
    this.stats = {
      totalTrips: 3,
      totalFriends: 12,
      activeTrips: 1,
      placesVoted: 8
    };

    this.recentActivities = [
      {
        id: '1',
        icon: 'created',
        title: 'Created "Friday night dinner"',
        time: '2 hours ago',
        action: 'View trip',
        actionLink: '/trip/ABC123'
      },
      {
        id: '2',
        icon: 'joined',
        title: 'Joined "Team lunch" trip',
        time: '1 day ago',
        action: 'View trip',
        actionLink: '/trip/XYZ789'
      },
      {
        id: '3',
        icon: 'voted',
        title: 'Voted for "Mario\'s Pizza"',
        time: '2 days ago'
      }
    ];
  }
}
