import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Trip, Friend, ScoredPlace, PlaceType, Midpoint } from "@shared/types";

@Injectable({
  providedIn: "root",
})
export class TripStoreService {
  // State subjects
  private tripSubject = new BehaviorSubject<Trip | null>(null);
  private placesSubject = new BehaviorSubject<ScoredPlace[]>([]);
  private midpointSubject = new BehaviorSubject<Midpoint | null>(null);
  private selectedPlaceIdSubject = new BehaviorSubject<number | null>(null);
  private isSearchingSubject = new BehaviorSubject<boolean>(false);
  private searchErrorSubject = new BehaviorSubject<string | null>(null);

  // Search settings subjects
  private placeTypeSubject = new BehaviorSubject<PlaceType | null>(null);
  private radiusKmSubject = new BehaviorSubject<number>(5);

  // Observables for templates/components to subscribe to
  trip$ = this.tripSubject.asObservable();
  places$ = this.placesSubject.asObservable();
  midpoint$ = this.midpointSubject.asObservable();
  selectedPlaceId$ = this.selectedPlaceIdSubject.asObservable();
  isSearching$ = this.isSearchingSubject.asObservable();
  searchError$ = this.searchErrorSubject.asObservable();

  placeType$ = this.placeTypeSubject.asObservable();
  radiusKm$ = this.radiusKmSubject.asObservable();

  // Getters for quick synchronous access
  get trip(): Trip | null {
    return this.tripSubject.getValue();
  }

  get places(): ScoredPlace[] {
    return this.placesSubject.getValue();
  }

  get midpoint(): Midpoint | null {
    return this.midpointSubject.getValue();
  }

  get selectedPlaceId(): number | null {
    return this.selectedPlaceIdSubject.getValue();
  }

  get isSearching(): boolean {
    return this.isSearchingSubject.getValue();
  }

  get searchError(): string | null {
    return this.searchErrorSubject.getValue();
  }

  get placeType(): PlaceType | null {
    return this.placeTypeSubject.getValue();
  }

  get radiusKm(): number {
    return this.radiusKmSubject.getValue();
  }

  // Setters/Updaters
  setTrip(trip: Trip) {
    this.tripSubject.next(trip);
  }

  updateFriends(friends: Friend[]) {
    const currentTrip = this.trip;
    if (currentTrip) {
      this.tripSubject.next({ ...currentTrip, friends });
    }
  }

  removeFriendLocally(friendId: string) {
    const currentTrip = this.trip;
    if (currentTrip) {
      const updatedFriends = currentTrip.friends.filter((f) => f.id !== friendId);
      this.tripSubject.next({ ...currentTrip, friends: updatedFriends });
    }
  }

  setPlaces(places: ScoredPlace[], midpoint: Midpoint) {
    this.placesSubject.next(places);
    this.midpointSubject.next(midpoint);
    this.selectedPlaceIdSubject.next(null);
  }

  setSelectedPlace(id: number | null) {
    this.selectedPlaceIdSubject.next(id);
  }

  setIsSearching(v: boolean) {
    this.isSearchingSubject.next(v);
  }

  setSearchError(err: string | null) {
    this.searchErrorSubject.next(err);
  }

  setPlaceType(t: PlaceType) {
    this.placeTypeSubject.next(t);
  }

  setRadiusKm(r: number) {
    this.radiusKmSubject.next(r);
  }

  reset() {
    this.tripSubject.next(null);
    this.placesSubject.next([]);
    this.midpointSubject.next(null);
    this.selectedPlaceIdSubject.next(null);
    this.isSearchingSubject.next(false);
    this.searchErrorSubject.next(null);
    this.placeTypeSubject.next(null);
    this.radiusKmSubject.next(5);
  }
}
