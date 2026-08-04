import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WelcomeToastComponent } from './components/welcome-toast/welcome-toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, WelcomeToastComponent],
  templateUrl: './app.html',
})
export class App {
}
