import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({ selector: 'app-home', standalone: true, imports: [RouterLink], template: `
  <nav class="home-nav">
    <a routerLink="/" class="home-nav__brand"><img class="brand-mark" src="/octopus.png" alt="" /><span>MeetMidway</span></a>
    <div class="home-nav__spacer"></div>
    <div class="home-nav__actions">
      <button class="theme-toggle" (click)="theme.toggle()" [title]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'" [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">{{ theme.isDark() ? '☀︎' : '☾' }}</button>
      <a routerLink="/join" class="btn btn-secondary btn-sm">Join with code</a><a routerLink="/auth" class="btn btn-quiet btn-sm">Sign in</a><a routerLink="/create" class="btn btn-primary btn-sm">Create trip</a>
    </div>
  </nav>
  <div class="page-shell">
    <section class="home-hero">
      <h1 class="home-hero__title">Find the <span class="accent">fairest</span> meetup spot<br />for everyone.</h1>
      <p class="home-hero__subtitle">MeetMidway calculates the geographic midpoint between friends, then ranks nearby places by travel fairness — so no one gets stuck with a long commute.</p>
      <div class="home-hero__actions"><a routerLink="/auth" class="btn btn-primary home-hero__primary-action">Get started now</a><a href="#how-it-works" class="btn btn-secondary home-hero__secondary-action">What&rsquo;s the plan?</a></div>
      <div class="home-mockup"><div class="home-mockup__bar"><span class="home-mockup__dot"></span><span class="home-mockup__dot"></span><span class="home-mockup__dot"></span><span class="home-mockup__url">meetmidway.app/trip/X7P2QA</span></div><img src="/mockup.png" alt="MeetMidway trip room with friends and a midpoint map" width="860" height="540" /></div>
    </section>
    <section id="how-it-works" class="home-steps"><h2 class="home-steps__title">How it works</h2><ul class="home-steps__list"><li class="home-step"><span class="home-step__icon">1</span><div class="home-step__body"><strong>Create a session</strong><span>Name the outing, choose a category, and share the invite code.</span></div></li><li class="home-step"><span class="home-step__icon">2</span><div class="home-step__body"><strong>Everyone adds their address</strong><span>Each person enters their starting point and the map updates in real time.</span></div></li><li class="home-step"><span class="home-step__icon">3</span><div class="home-step__body"><strong>Pick the fairest spot</strong><span>Nearby places are scored by travel fairness—the best midpoint rises to the top.</span></div></li></ul></section>
    <footer class="home-footer"><span>MeetMidway</span><span>Guest sessions are free. Accounts keep plans together.</span></footer>
  </div>` })
export class HomeComponent { constructor(public theme: ThemeService) {} }
