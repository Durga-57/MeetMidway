import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WelcomeToastComponent } from './components/welcome-toast/welcome-toast';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, WelcomeToastComponent],
  templateUrl: './app.html',
})
export class App {
  constructor(private readonly theme: ThemeService) {}
}
