import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { CreateComponent } from './pages/create/create';
import { JoinComponent } from './pages/join/join';
import { TripRoomComponent } from './pages/trip-room/trip-room';
import { NotFoundComponent } from './pages/not-found/not-found';
import { AuthComponent } from './pages/auth/auth';
import { AuthCallbackComponent } from './pages/auth/auth-callback';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'create', component: CreateComponent, canActivate: [authGuard] },
  { path: 'join/:code', component: JoinComponent, canActivate: [authGuard] },
  { path: 'join', component: JoinComponent, canActivate: [authGuard] },
  { path: 'trip/:code', component: TripRoomComponent, canActivate: [authGuard] },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'auth', component: AuthComponent },
  { path: '**', component: NotFoundComponent }
];
