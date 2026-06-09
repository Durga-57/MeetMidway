import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'meetmidway-theme';

  isDark = signal<boolean>(this.loadPreference());

  constructor() {
    // Apply theme class to document root whenever signal changes
    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('dark', dark);
      try {
        localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
      } catch {}
    });
  }

  toggle() {
    this.isDark.update(v => !v);
  }

  private loadPreference(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return stored === 'dark';
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
