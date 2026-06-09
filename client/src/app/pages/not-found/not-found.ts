import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="empty-state">
      <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">404 — Page not found</h1>
      <p style="margin-bottom: 1.25rem;">This page doesn't exist. Maybe the midpoint is elsewhere?</p>
      <div style="display: flex; gap: 0.5rem;">
        <a routerLink="/" class="btn btn-primary">Go Home</a>
        <a routerLink="/create" class="btn btn-secondary">Create a Trip</a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
