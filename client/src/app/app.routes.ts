import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { CreateComponent } from './pages/create/create';
import { JoinComponent } from './pages/join/join';
import { TripRoomComponent } from './pages/trip-room/trip-room';
import { NotFoundComponent } from './pages/not-found/not-found';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'create', component: CreateComponent },
  { path: 'join/:code', component: JoinComponent },
  { path: 'join', component: JoinComponent },
  { path: 'trip/:code', component: TripRoomComponent },
  { path: '**', component: NotFoundComponent }
];
